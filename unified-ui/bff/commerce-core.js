/**
 * Shared orchestration for fulfilment: courier quotes, booking one group, and keeping
 * the order's status in step with its groups.
 *
 * The decisions themselves live in the services — courier choice in logistics-service,
 * supplier placement in supplier-service. This module only sequences the calls and
 * enforces who may act on which group. See docs/commerce-architecture.md §5–§6.
 */
const f = require('./fulfilment');

/** A failure the route should return as-is. */
class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

/** Passes a downstream service's status and message through, without leaking internals. */
const sendError = (res, e, fallback) => {
  if (e instanceof HttpError) return res.status(e.status).json({ error: e.message, ...e.extra });
  const status = e.response?.status || 500;
  const message = e.response?.data?.error || e.response?.data?.message || fallback;
  if (status >= 500) console.error(`${fallback}:`, e.response?.data || e.message);
  return res.status(status).json({ error: typeof message === 'string' ? message : fallback });
};

const createCore = ({ axios, urls }) => {
  const { ORDER_SERVICE, LOGISTICS_SERVICE, SUPPLIER_SERVICE, SELLER_SERVICE } = urls;
  const WAREHOUSE_PINCODE = process.env.WAREHOUSE_PINCODE || null;

  const getOrder = async (orderId) => {
    try {
      return (await axios.get(`${ORDER_SERVICE}/api/v1/orders/${encodeURIComponent(orderId)}`)).data;
    } catch (e) {
      if (e.response?.status === 404 || e.response?.status === 400) throw new HttpError(404, 'Order not found');
      throw e;
    }
  };

  /** Shipments and supplier orders are progress, not the order — a lookup failure shows as "not yet". */
  const getShipments = (orderId) =>
    axios.get(`${LOGISTICS_SERVICE}/api/shipments/order/${orderId}/all`)
      .then((r) => r.data || [])
      .catch((e) => {
        if (e.response?.status !== 404) console.warn(`[fulfilment] shipments for order ${orderId}:`, e.message);
        return [];
      });

  const getSupplierOrders = (orderId) =>
    axios.get(`${SUPPLIER_SERVICE}/api/supplier-orders/order/${orderId}`)
      .then((r) => r.data || [])
      .catch((e) => {
        if (e.response?.status !== 404) console.warn(`[fulfilment] supplier orders for order ${orderId}:`, e.message);
        return [];
      });

  /** The order with every group and its progress attached. */
  const loadProgress = async (orderOrId) => {
    const order = typeof orderOrId === 'object' ? orderOrId : await getOrder(orderOrId);
    const [shipments, supplierOrders] = await Promise.all([
      getShipments(order.id),
      getSupplierOrders(order.id),
    ]);
    const groups = f.attachProgress(f.groupLines(order), shipments, supplierOrders);
    return { order, groups, allShipped: f.allShipped(groups) };
  };

  /**
   * Moves the order to SHIPPED once every group has shipped — and not before. The first
   * seller to ship used to mark a multi-seller order shipped for everyone.
   */
  const syncShippedStatus = async (orderOrId) => {
    const { order, allShipped } = await loadProgress(orderOrId);
    const status = String(order.status || '').toUpperCase();
    if (allShipped && f.isPaid(order) && status !== 'SHIPPED' && status !== 'DELIVERED') {
      try {
        await axios.patch(`${ORDER_SERVICE}/api/v1/orders/${order.id}/status`, null,
          { params: { status: 'SHIPPED' } });
        return 'SHIPPED';
      } catch (e) {
        console.error(`[fulfilment] order ${order.id} fully shipped but its status stayed ${status}:`, e.message);
      }
    }
    return status;
  };

  const quote = async ({ fulfilmentModel, address, pickupPincode, preferredPartnerCode }) =>
    (await axios.post(`${LOGISTICS_SERVICE}/api/courier-allocation/quote`, {
      fulfilmentModel,
      deliveryPincode: address?.postalCode || null,
      deliveryState: address?.state || null,
      pickupPincode: pickupPincode || null,
      cod: false, // Checkout is Razorpay-only; see §18.
      preferredPartnerCode: preferredPartnerCode || null,
    })).data;

  const sellerPickupPincode = async (sellerId) => {
    try {
      return (await axios.get(`${SELLER_SERVICE}/api/sellers/${sellerId}`)).data?.pickupPostalCode || null;
    } catch (_) {
      return null;
    }
  };

  const pickupPincodeFor = async (group) => {
    if (group.model === 'SELLER') return sellerPickupPincode(group.sellerId);
    return WAREHOUSE_PINCODE;
  };

  /**
   * Books one group with a courier.
   *
   * The allocation engine runs even when the caller named a courier, so a manual pick
   * is checked against coverage exactly as an automatic one would be. A pick that
   * cannot be honoured is refused with the engine's reason rather than quietly swapped.
   */
  const bookGroup = async ({ orderId, fulfilmentKey, partnerCode, trackingNumber }) => {
    const { order, groups } = await loadProgress(orderId);
    const group = groups.find((g) => g.fulfilmentKey === fulfilmentKey);
    if (!group) throw new HttpError(404, 'Order not found');
    if (group.model === 'DROPSHIP') throw new HttpError(422, 'Dropship items are shipped through supplier orders.');
    if (!f.isPaid(order)) throw new HttpError(409, 'This order has not been paid for yet.');
    if (group.shipment && group.shipment.fulfilmentKey === fulfilmentKey) {
      return { shipment: { ...group.shipment, alreadyBooked: true }, order, group, decision: null };
    }

    const address = order.shippingAddress;
    if (!address?.postalCode) throw new HttpError(422, 'This order has no delivery pincode to ship to.');
    const pickupPincode = await pickupPincodeFor(group);

    const decision = await quote({
      fulfilmentModel: group.model, address, pickupPincode, preferredPartnerCode: partnerCode,
    });
    if (partnerCode && decision.manualOverrideRejected) {
      throw new HttpError(422, decision.manualOverrideRejected, { quote: decision });
    }
    if (!decision.selected) {
      throw new HttpError(422, 'No active courier serves this pincode.', { quote: decision });
    }

    const lineValue = f.linesValue(group.lines);
    const booking = await axios.post(`${LOGISTICS_SERVICE}/api/shipments/book`, {
      orderId: String(order.id),
      customerId: String(order.customerId),
      fulfilmentKey,
      partnerCode: decision.selected.code,
      deliveryAddress: order.shippingAddressLine || null,
      deliveryPincode: address.postalCode,
      customerName: address.fullName || order.customerName || null,
      customerPhone: address.phone || order.customerPhone || null,
      pickupPincode,
      weightGrams: null,
      cod: false,
      declaredValue: Math.round(lineValue * 100) / 100,
      trackingNumber: trackingNumber || null,
    });
    const shipment = booking.data;

    // The order's own courier fields describe the primary group. Keep them true to
    // the courier that actually collected it, not the one provisionally assigned.
    const primary = f.primaryGroup(groups);
    if (primary && primary.fulfilmentKey === fulfilmentKey && !shipment.alreadyBooked) {
      try {
        await axios.patch(`${ORDER_SERVICE}/api/v1/orders/${order.id}/delivery`, {
          deliveryPartnerCode: decision.selected.code,
          deliveryPartnerName: decision.selected.name,
          deliveryAssignmentReason: decision.reason,
          expectedDelivery: shipment.estimatedDelivery || null,
        });
      } catch (e) {
        console.error(`[fulfilment] shipment ${shipment.id} booked but order ${order.id} courier not updated:`, e.message);
      }
    }

    await syncShippedStatus(order.id);
    return { shipment, order, group, decision };
  };

  /** Asks supplier-service to place this order's dropship lines. Safe to repeat. */
  const dispatchDropship = async (orderId) =>
    (await axios.post(`${SUPPLIER_SERVICE}/api/supplier-orders/dispatch`, { orderId: Number(orderId) })).data;

  return {
    getOrder,
    loadProgress,
    syncShippedStatus,
    quote,
    bookGroup,
    dispatchDropship,
    sellerPickupPincode,
    pickupPincodeFor,
  };
};

module.exports = { createCore, HttpError, sendError };
