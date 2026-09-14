/**
 * Fulfilment groups — pure functions, no I/O.
 *
 * An order is one aggregate, but it ships in groups: our own stock, each marketplace
 * seller, each dropship partner. Groups are derived from the order lines every time
 * rather than stored, so they cannot drift from the lines they describe.
 * See docs/commerce-architecture.md §4.1.
 */

const MODELS = ['FIRST_PARTY', 'SELLER', 'DROPSHIP'];

/** Orders in these states have been paid for and may be fulfilled. */
const PAID_STATUSES = ['PAYMENT_COMPLETED', 'INVENTORY_RESERVED', 'SHIPPED', 'DELIVERED'];

/** Supplier-order states that mean the partner has handed the parcel to a courier. */
const SUPPLIER_SHIPPED = ['SHIPPED', 'DELIVERED'];

/** A line's model. Lines stored before fulfilment models existed carry none. */
const lineModel = (line) => {
  const m = String(line?.fulfilmentModel || '').toUpperCase();
  if (MODELS.includes(m)) return m;
  return line?.sellerId != null ? 'SELLER' : 'FIRST_PARTY';
};

const fulfilmentKeyFor = (line) => {
  const model = lineModel(line);
  if (model === 'SELLER') return `SELLER:${line.sellerId}`;
  if (model === 'DROPSHIP') return `DROPSHIP:${String(line.fulfilmentPartnerCode || 'UNKNOWN').toUpperCase()}`;
  return 'FIRST_PARTY';
};

/** Label shown to a customer. Dropship partners are deliberately not named (§18). */
const customerLabel = (model, line) => {
  if (model === 'SELLER') return `Sold by ${line?.sellerName || 'a marketplace seller'}`;
  if (model === 'DROPSHIP') return 'Ships from our partner warehouse';
  return 'Sold and shipped by MyIndianStore';
};

/**
 * Groups an order's lines. Order of groups: FIRST_PARTY, then sellers, then dropship,
 * each in first-appearance order — so the "primary group" is stable.
 */
const groupLines = (order) => {
  const groups = new Map();
  for (const line of order?.items || []) {
    const key = fulfilmentKeyFor(line);
    if (!groups.has(key)) {
      const model = lineModel(line);
      groups.set(key, {
        fulfilmentKey: key,
        model,
        sellerId: model === 'SELLER' ? line.sellerId : null,
        sellerName: model === 'SELLER' ? line.sellerName || null : null,
        partnerCode: model === 'DROPSHIP' ? String(line.fulfilmentPartnerCode || '').toUpperCase() || null : null,
        label: customerLabel(model, line),
        lines: [],
      });
    }
    groups.get(key).lines.push(line);
  }
  const rank = (g) => MODELS.indexOf(g.model);
  return [...groups.values()].sort((a, b) => rank(a) - rank(b));
};

/** The group whose courier the order-level delivery fields describe. */
const primaryGroup = (groups) =>
  groups.find((g) => g.model === 'FIRST_PARTY') || groups.find((g) => g.model === 'SELLER') || null;

/**
 * Attaches shipments and supplier orders to groups and decides what has shipped.
 *
 * A shipment recorded before fulfilment keys existed has none; it was created for the
 * whole order, so it counts for every courier-shipped group.
 */
const attachProgress = (groups, shipments = [], supplierOrders = []) => {
  const legacy = shipments.find((s) => !s.fulfilmentKey) || null;
  return groups.map((g) => {
    if (g.model === 'DROPSHIP') {
      const supplierOrder = supplierOrders.find(
        (so) => String(so.partnerCode || '').toUpperCase() === g.partnerCode
      ) || null;
      return {
        ...g,
        shipment: null,
        supplierOrder,
        shipped: !!supplierOrder && SUPPLIER_SHIPPED.includes(supplierOrder.status),
      };
    }
    const shipment = shipments.find((s) => s.fulfilmentKey === g.fulfilmentKey) || legacy;
    return { ...g, shipment, supplierOrder: null, shipped: !!shipment };
  });
};

const allShipped = (groups) => groups.length > 0 && groups.every((g) => g.shipped);

const isPaid = (order) => PAID_STATUSES.includes(String(order?.status || '').toUpperCase());

/** Sum of line totals, in rupees. Used for display only — totals are computed by order-service. */
const linesValue = (lines) =>
  lines.reduce((sum, l) => sum + Number(l.unitPrice || 0) * Number(l.quantity || 0), 0);

module.exports = {
  MODELS,
  PAID_STATUSES,
  lineModel,
  fulfilmentKeyFor,
  customerLabel,
  groupLines,
  primaryGroup,
  attachProgress,
  allShipped,
  isPaid,
  linesValue,
};
