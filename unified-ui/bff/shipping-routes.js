/**
 * Courier allocation, own-product fulfilment, seller shipping, and the customer's view
 * of an order's groups. Contract: docs/commerce-architecture.md §10.
 */
const f = require('./fulfilment');
const { HttpError, sendError } = require('./commerce-core');

/** Strips what a customer must not see: supplier cost, partner identity and references. */
const customerView = ({ order, groups, allShipped }) => ({
  orderId: order.id,
  orderStatus: order.status,
  allShipped,
  groups: groups.map((g) => ({
    fulfilmentKey: g.model === 'DROPSHIP' ? 'DROPSHIP' : g.fulfilmentKey,
    model: g.model,
    label: g.label,
    lines: g.lines.map((l) => ({
      productId: l.productId, productName: l.productName, quantity: l.quantity, unitPrice: l.unitPrice,
    })),
    shipped: g.shipped,
    shipment: g.shipment ? {
      carrier: g.shipment.carrier,
      trackingNumber: g.shipment.trackingNumber,
      carrierTrackingUrl: g.shipment.carrierTrackingUrl,
      trackingGenerated: !!g.shipment.trackingGenerated,
      status: g.shipment.status,
      estimatedDelivery: g.shipment.estimatedDelivery,
    } : null,
    supplierOrder: g.supplierOrder ? {
      status: g.supplierOrder.status,
      carrierName: g.supplierOrder.carrierName,
      trackingNumber: g.supplierOrder.trackingNumber,
      trackingUrl: g.supplierOrder.trackingUrl,
    } : null,
  })),
});

const register = (app, { axios, urls, guards, core, cartLines }) => {
  const { LOGISTICS_SERVICE, ORDER_SERVICE } = urls;
  const { authenticateAdmin, authenticateAny, authenticateSeller, requireApprovedSeller } = guards;
  const proxy = (method, path) => async (req, res) => {
    try {
      const r = await axios({ method, url: `${LOGISTICS_SERVICE}${path(req)}`, data: req.body });
      res.status(r.status).json(r.data);
    } catch (e) { sendError(res, e, 'Courier allocation request failed'); }
  };

  // ── Admin: partners, integrations, rules, settings, probe ──────────────────
  app.post('/api/delivery-partners', authenticateAdmin, proxy('post', () => '/api/delivery-partners'));
  app.get('/api/admin/carrier-integrations', authenticateAdmin, proxy('get', () => '/api/carrier-integrations'));
  app.get('/api/admin/courier-rules', authenticateAdmin, proxy('get', () => '/api/courier-rules'));
  app.post('/api/admin/courier-rules', authenticateAdmin, proxy('post', () => '/api/courier-rules'));
  app.put('/api/admin/courier-rules/:id', authenticateAdmin,
    proxy('put', (req) => `/api/courier-rules/${encodeURIComponent(req.params.id)}`));
  app.delete('/api/admin/courier-rules/:id', authenticateAdmin, async (req, res) => {
    try {
      await axios.delete(`${LOGISTICS_SERVICE}/api/courier-rules/${encodeURIComponent(req.params.id)}`);
      res.status(204).send();
    } catch (e) { sendError(res, e, 'Could not delete the rule'); }
  });
  app.get('/api/admin/allocation-settings', authenticateAdmin, proxy('get', () => '/api/allocation-settings'));
  app.put('/api/admin/allocation-settings/:model', authenticateAdmin,
    proxy('put', (req) => `/api/allocation-settings/${encodeURIComponent(req.params.model)}`));
  app.post('/api/admin/courier-allocation/quote', authenticateAdmin,
    proxy('post', () => '/api/courier-allocation/quote'));

  // ── Checkout: what will happen to this cart at this address ────────────────
  app.post('/api/delivery/quote', async (req, res) => {
    try {
      const pincode = String(req.body?.pincode || '').trim();
      if (!/^\d{6}$/.test(pincode)) return res.status(400).json({ error: 'Enter a 6-digit pincode.' });
      const address = { postalCode: pincode, state: req.body?.state || null };

      const lines = await cartLines(req, res);
      const groups = f.groupLines({ items: lines });
      const result = await Promise.all(groups.map(async (g) => {
        const base = { fulfilmentKey: g.model === 'DROPSHIP' ? 'DROPSHIP' : g.fulfilmentKey, model: g.model, label: g.label };
        if (g.model === 'DROPSHIP') {
          return { ...base, courier: null, estimatedDays: null, reason: null, note: 'Shipped by our partner' };
        }
        const q = await core.quote({
          fulfilmentModel: g.model, address, pickupPincode: await core.pickupPincodeFor(g),
        });
        return {
          ...base,
          courier: q.selected ? q.selected.name : null,
          estimatedDays: q.selected ? q.selected.estimatedDays : null,
          reason: q.reason,
        };
      }));
      res.json({ groups: result });
    } catch (e) { sendError(res, e, 'Could not estimate delivery'); }
  });

  // ── An order's groups: the owning customer, or an admin ────────────────────
  app.get('/api/orders/:orderId/fulfilment', authenticateAny, async (req, res) => {
    try {
      const progress = await core.loadProgress(req.params.orderId);
      if (!req.user.isAdmin && String(progress.order.customerId) !== String(req.user.id))
        throw new HttpError(404, 'Order not found');
      res.json(customerView(progress));
    } catch (e) { sendError(res, e, 'Could not load the order'); }
  });

  app.get('/api/admin/orders/:orderId/fulfilment', authenticateAdmin, async (req, res) => {
    try {
      const { order, groups, allShipped } = await core.loadProgress(req.params.orderId);
      res.json({ orderId: order.id, orderStatus: order.status, allShipped, groups });
    } catch (e) { sendError(res, e, 'Could not load the order'); }
  });

  // ── Admin: own-product fulfilment queue ─────────────────────────────────────
  app.get('/api/admin/fulfilment', authenticateAdmin, async (req, res) => {
    try {
      const wantShipped = req.query.state === 'shipped';
      const orders = (await axios.get(`${ORDER_SERVICE}/api/v1/orders`)).data || [];
      const candidates = orders.filter((o) =>
        f.isPaid(o) && f.groupLines(o).some((g) => g.model === 'FIRST_PARTY'));

      const rows = await Promise.all(candidates.map(async (o) => {
        const { groups } = await core.loadProgress(o);
        const group = groups.find((g) => g.model === 'FIRST_PARTY');
        if (group.shipped !== wantShipped) return null;
        let suggestion = null;
        if (!group.shipped) {
          suggestion = await core.quote({
            fulfilmentModel: 'FIRST_PARTY', address: o.shippingAddress,
            pickupPincode: await core.pickupPincodeFor(group),
          }).catch((e) => ({ selected: null, reason: 'NONE', candidates: [],
            explanation: e.response?.data?.error || 'Could not reach the allocation service.' }));
        }
        return {
          orderId: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          createdAt: o.createdAt,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          shippingAddress: o.shippingAddress,
          shippingAddressLine: o.shippingAddressLine,
          deliveryPartnerCode: o.deliveryPartnerCode,
          deliveryAssignmentReason: o.deliveryAssignmentReason,
          lines: group.lines,
          lineValue: f.linesValue(group.lines),
          shipment: group.shipment,
          suggestion,
        };
      }));
      res.json(rows.filter(Boolean)
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))));
    } catch (e) { sendError(res, e, 'Could not load the fulfilment queue'); }
  });

  app.post('/api/admin/fulfilment/:orderId/ship', authenticateAdmin, async (req, res) => {
    try {
      // The key is fixed here: the admin queue ships our own stock, never a seller's.
      const { shipment, decision } = await core.bookGroup({
        orderId: req.params.orderId,
        fulfilmentKey: 'FIRST_PARTY',
        partnerCode: req.body?.partnerCode,
        trackingNumber: req.body?.trackingNumber,
      });
      res.status(shipment.alreadyBooked ? 200 : 201).json({ ...shipment, allocation: decision });
    } catch (e) { sendError(res, e, 'Could not create the shipment'); }
  });

  // ── Seller Central ──────────────────────────────────────────────────────────
  const sellerGroup = async (req) => {
    const progress = await core.loadProgress(req.params.orderId);
    const key = `SELLER:${req.seller.sellerId}`;
    const group = progress.groups.find((g) => g.fulfilmentKey === key);
    // Built from the token, never the body: a seller can only ever act on their own lines.
    if (!group) throw new HttpError(404, 'Order not found');
    return { ...progress, group, key };
  };

  app.get('/api/seller/orders/:orderId/courier-quote', authenticateSeller, async (req, res) => {
    try {
      const { order, group } = await sellerGroup(req);
      res.json(await core.quote({
        fulfilmentModel: 'SELLER',
        address: order.shippingAddress,
        pickupPincode: await core.pickupPincodeFor(group),
        preferredPartnerCode: req.query.partnerCode,
      }));
    } catch (e) { sendError(res, e, 'Could not suggest a courier'); }
  });

  app.post('/api/seller/orders/:orderId/ship', authenticateSeller, requireApprovedSeller, async (req, res) => {
    try {
      const { key } = await sellerGroup(req);
      const { shipment, decision } = await core.bookGroup({
        orderId: req.params.orderId,
        fulfilmentKey: key,
        partnerCode: req.body?.partnerCode,
        trackingNumber: req.body?.trackingNumber,
      });
      res.status(shipment.alreadyBooked ? 200 : 201).json({ ...shipment, allocation: decision });
    } catch (e) { sendError(res, e, 'Could not create the shipment'); }
  });
};

module.exports = { register, customerView };
