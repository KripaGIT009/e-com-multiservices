/**
 * Dropshipping in the admin console, plus the partner webhook.
 * Contract: docs/commerce-architecture.md §9.4 and §10.3.
 *
 * Everything here is admin-only because it carries supplier cost prices and partner
 * order references — neither may reach a customer or seller response.
 */
const { HttpError, sendError } = require('./commerce-core');

const register = (app, { axios, urls, guards, core }) => {
  const { SUPPLIER_SERVICE, ITEM_SERVICE } = urls;
  const { authenticateAdmin } = guards;

  const proxy = (method, path, fallback) => async (req, res) => {
    try {
      const r = await axios({
        method, url: `${SUPPLIER_SERVICE}${path(req)}`, data: req.body, params: req.query,
      });
      res.status(r.status).json(r.data);
    } catch (e) { sendError(res, e, fallback); }
  };
  const enc = encodeURIComponent;

  // ── Partners ────────────────────────────────────────────────────────────────
  app.get('/api/admin/dropship/partners', authenticateAdmin,
    proxy('get', () => '/api/dropship/partners', 'Could not load dropship partners'));
  app.post('/api/admin/dropship/partners', authenticateAdmin,
    proxy('post', () => '/api/dropship/partners', 'Could not add the partner'));
  app.put('/api/admin/dropship/partners/:code', authenticateAdmin,
    proxy('put', (req) => `/api/dropship/partners/${enc(req.params.code)}`, 'Could not update the partner'));
  app.get('/api/admin/dropship/integrations', authenticateAdmin,
    proxy('get', () => '/api/dropship/integrations', 'Could not load integrations'));

  // ── Listings: a catalogue item plus its private supplier link ───────────────
  const withMargin = (listing, item) => {
    const price = item ? Number(item.price) : null;
    const cost = Number(listing.costPrice);
    const margin = price != null ? Math.round((price - cost) * 100) / 100 : null;
    return {
      ...listing,
      item,
      margin,
      marginPercent: price ? Math.round((margin / price) * 1000) / 10 : null,
    };
  };

  app.get('/api/admin/dropship/listings', authenticateAdmin, async (req, res) => {
    try {
      const listings = (await axios.get(`${SUPPLIER_SERVICE}/api/dropship/listings`, { params: req.query })).data || [];
      const joined = await Promise.all(listings.map(async (l) => {
        const item = await axios.get(`${ITEM_SERVICE}/items/${l.itemId}`).then((r) => r.data).catch(() => null);
        return withMargin(l, item);
      }));
      res.json(joined);
    } catch (e) { sendError(res, e, 'Could not load dropship listings'); }
  });

  app.post('/api/admin/dropship/listings', authenticateAdmin, async (req, res) => {
    const { partnerCode, partnerSku, costPrice, sku, name, description, price, quantity, itemType } = req.body || {};
    try {
      if (!partnerCode || !partnerSku || !sku || !name) {
        throw new HttpError(400, 'Partner, partner SKU, SKU and name are required.');
      }
      if (!(Number(costPrice) > 0)) throw new HttpError(400, 'Cost price must be greater than zero.');
      // Selling at or below cost is a loss on every unit before shipping; refuse it.
      if (!(Number(price) > Number(costPrice))) {
        throw new HttpError(400, 'Selling price must be higher than the cost price.');
      }
      // Check the partner first so a bad partner does not leave an orphaned catalogue item.
      const partner = (await axios.get(`${SUPPLIER_SERVICE}/api/dropship/partners/${enc(partnerCode)}`)
        .catch((e) => { if (e.response?.status === 404) throw new HttpError(400, 'Unknown dropship partner.'); throw e; })).data;
      if (!partner.active) throw new HttpError(422, `${partner.name} is not active. Activate the partner first.`);
    } catch (e) { return sendError(res, e, 'Could not create the listing'); }

    let item;
    try {
      item = (await axios.post(`${ITEM_SERVICE}/items`, {
        sku, name, description,
        price: Number(price),
        quantity: Number(quantity) || 0,
        itemType,
        fulfilmentModel: 'DROPSHIP',
        fulfilmentPartnerCode: partnerCode,
      })).data;
    } catch (e) {
      const dup = /sku/i.test(JSON.stringify(e.response?.data || ''));
      return sendError(res, dup ? new HttpError(409, 'That SKU is already in use.') : e, 'Could not create the catalogue item');
    }

    try {
      const listing = (await axios.post(`${SUPPLIER_SERVICE}/api/dropship/listings`, {
        itemId: item.id, partnerCode, partnerSku, costPrice: Number(costPrice),
      })).data;
      res.status(201).json(withMargin(listing, item));
    } catch (e) {
      // Compensate: a dropship item with no supplier link could be sold and never shipped.
      await axios.delete(`${ITEM_SERVICE}/items/${item.id}`).catch((err) =>
        console.error(`[dropship] listing failed and catalogue item ${item.id} could not be removed:`, err.message));
      sendError(res, e, 'Could not link the item to the partner');
    }
  });

  app.put('/api/admin/dropship/listings/:id', authenticateAdmin, async (req, res) => {
    try {
      const { partnerSku, costPrice, partnerStock, active, price, quantity, name, description, itemType } = req.body || {};
      const all = (await axios.get(`${SUPPLIER_SERVICE}/api/dropship/listings`)).data || [];
      const current = all.find((l) => String(l.id) === String(req.params.id));
      if (!current) throw new HttpError(404, 'Listing not found');
      const item = (await axios.get(`${ITEM_SERVICE}/items/${current.itemId}`)).data;

      const nextCost = costPrice != null ? Number(costPrice) : Number(current.costPrice);
      const nextPrice = price != null ? Number(price) : Number(item.price);
      if (!(nextPrice > nextCost)) throw new HttpError(400, 'Selling price must be higher than the cost price.');

      const listing = (await axios.put(`${SUPPLIER_SERVICE}/api/dropship/listings/${enc(req.params.id)}`, {
        partnerSku, costPrice: costPrice != null ? nextCost : undefined, partnerStock, active,
      })).data;

      let updatedItem = item;
      if ([price, quantity, name, description, itemType].some((v) => v !== undefined)) {
        updatedItem = (await axios.put(`${ITEM_SERVICE}/items/${item.id}`, {
          sku: item.sku,
          name: name ?? item.name,
          description: description ?? item.description,
          price: nextPrice,
          quantity: quantity != null ? Number(quantity) : item.quantity,
          itemType: itemType ?? item.itemType,
          fulfilmentModel: 'DROPSHIP',
          fulfilmentPartnerCode: current.partnerCode,
        })).data;
      }
      res.json(withMargin(listing, updatedItem));
    } catch (e) { sendError(res, e, 'Could not update the listing'); }
  });

  app.delete('/api/admin/dropship/listings/:id', authenticateAdmin, async (req, res) => {
    try {
      const all = (await axios.get(`${SUPPLIER_SERVICE}/api/dropship/listings`)).data || [];
      const current = all.find((l) => String(l.id) === String(req.params.id));
      if (!current) throw new HttpError(404, 'Listing not found');
      // Item first: once it is gone nobody can buy it, so a failure after that point
      // leaves only an unused link rather than a sellable item with no supplier.
      await axios.delete(`${ITEM_SERVICE}/items/${current.itemId}`).catch((e) => {
        if (e.response?.status !== 404) throw e;
      });
      await axios.delete(`${SUPPLIER_SERVICE}/api/dropship/listings/${enc(req.params.id)}`);
      res.status(204).send();
    } catch (e) { sendError(res, e, 'Could not remove the listing'); }
  });

  // ── Supplier orders ─────────────────────────────────────────────────────────
  app.get('/api/admin/supplier-orders', authenticateAdmin,
    proxy('get', () => '/api/supplier-orders', 'Could not load supplier orders'));

  app.put('/api/admin/supplier-orders/:id/status', authenticateAdmin, async (req, res) => {
    try {
      const updated = (await axios.put(
        `${SUPPLIER_SERVICE}/api/supplier-orders/${enc(req.params.id)}/status`, req.body)).data;
      // A partner shipping may be the last group the order was waiting on.
      if (['SHIPPED', 'DELIVERED'].includes(updated.status)) {
        await core.syncShippedStatus(updated.orderId).catch((e) =>
          console.error(`[dropship] order ${updated.orderId} status not re-evaluated:`, e.message));
      }
      res.json(updated);
    } catch (e) { sendError(res, e, 'Could not update the supplier order'); }
  });

  app.post('/api/admin/supplier-orders/:id/retry', authenticateAdmin,
    proxy('post', (req) => `/api/supplier-orders/${enc(req.params.id)}/retry`, 'Could not retry the supplier order'));

  app.post('/api/admin/supplier-orders/dispatch/:orderId', authenticateAdmin, async (req, res) => {
    try { res.json(await core.dispatchDropship(req.params.orderId)); }
    catch (e) { sendError(res, e, 'Could not dispatch the order to suppliers'); }
  });

  // ── Partner webhooks — the adapter's signature check is the boundary ────────
  app.post('/api/webhooks/dropship/:partnerCode', async (req, res) => {
    try {
      const r = await axios.post(
        `${SUPPLIER_SERVICE}/api/dropship/webhooks/${enc(req.params.partnerCode)}`,
        req.body, // raw Buffer — see the body-parser selection in server.js
        {
          headers: { ...pickSignatureHeaders(req.headers), 'Content-Type': req.headers['content-type'] || 'application/octet-stream' },
          transformRequest: [(data) => data],
        });
      res.status(r.status).json(r.data);
    } catch (e) { sendError(res, e, 'Webhook rejected'); }
  });
};

/** Forward only headers a partner could sign with; never cookies or our own auth. */
const pickSignatureHeaders = (headers) => Object.fromEntries(
  Object.entries(headers).filter(([k]) => /signature|x-.*(hmac|sign|token|event|webhook)/i.test(k))
);

module.exports = { register };
