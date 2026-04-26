/**
 * UI-Customer — Unified BFF Server
 * Serves the Angular storefront app + proxies all customer-facing APIs
 *
 * Replaces: ui-storefront (4201) + ui-account (4203) + ui-checkout (4202)
 * Port: 4200
 */
const express = require('express');
const cors    = require('cors');
const bodyParser = require('body-parser');
const axios   = require('axios');
const jwt     = require('jsonwebtoken');
const path    = require('path');
const fs      = require('fs');
require('dotenv').config();

const app = express();
const PORT       = process.env.PORT || 4200;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ── Backend service URLs ──────────────────────────────────────────────────────
const USER_SERVICE      = process.env.USER_SERVICE_URL      || 'http://localhost:8004';
const ITEM_SERVICE      = process.env.ITEM_SERVICE_URL      || 'http://localhost:8005';
const CART_SERVICE      = process.env.CART_SERVICE_URL      || 'http://localhost:8006';
const CHECKOUT_SERVICE  = process.env.CHECKOUT_SERVICE_URL  || 'http://localhost:8007';
const ORDER_SERVICE     = process.env.ORDER_SERVICE_URL     || 'http://localhost:8001';
const PAYMENT_SERVICE   = process.env.PAYMENT_SERVICE_URL   || 'http://localhost:8002';
const INVENTORY_SERVICE = process.env.INVENTORY_SERVICE_URL || 'http://localhost:8003';
const RETURN_SERVICE    = process.env.RETURN_SERVICE_URL    || 'http://localhost:8008';

app.use(cors());
app.use(bodyParser.json());

// ── Serve Angular dist ────────────────────────────────────────────────────────
const distCandidates = [
  path.join(__dirname, 'dist/ui-storefront/browser'),
  path.join(__dirname, 'dist/ui-storefront/browser/browser'),
];
const staticRoot = distCandidates.find(p => fs.existsSync(path.join(p, 'index.html'))) || distCandidates[0];
app.use(express.static(staticRoot));

// ── JWT middleware ────────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'UP', service: 'ui-customer' }));

// ═════════════════════════════════════════════════════════════════════════════
// AUTH  (delegates to user-service /users/login which checks password)
// ═════════════════════════════════════════════════════════════════════════════
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password are required' });

    // user-service has POST /users/login that validates password
    // It accepts { email, password } — try username as email first, then look up by username
    let loginEmail = username;

    // If it doesn't look like an email, resolve username → email first
    if (!username.includes('@')) {
      try {
        const r = await axios.get(`${USER_SERVICE}/users/username/${username}`);
        if (r.data?.email) loginEmail = r.data.email;
      } catch (_) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Now authenticate with email + password
    let loginRes;
    try {
      loginRes = await axios.post(`${USER_SERVICE}/users/login`, { email: loginEmail, password });
    } catch (e) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const data = loginRes.data;
    // user-service returns { userId, username, email, role, message }
    const uid = data?.userId || data?.id;
    if (!uid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: uid, username: data.username, role: data.role || 'CUSTOMER' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, user: { id: uid, username: data.username, email: data.email, role: data.role || 'CUSTOMER' } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'Username, email, and password are required' });

    const r = await axios.post(`${USER_SERVICE}/users`, {
      username, email, password,
      firstName: firstName || username,
      lastName:  lastName  || '',
      role: 'CUSTOMER'
    });
    const user = r.data;
    const token = jwt.sign(
      { id: user.id, username: user.username, role: 'CUSTOMER' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email, role: 'CUSTOMER' } });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(err.response?.status || 500).json({ error: 'Registration failed', details: err.message });
  }
});

app.post('/api/auth/logout', (_, res) => res.json({ message: 'Logged out successfully' }));

// Admin login — proxies to admin-service and returns token + redirectUrl
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const ADMIN_SERVICE = process.env.ADMIN_SERVICE_URL || 'http://localhost:8011';
    const r = await axios.post(`${ADMIN_SERVICE}/api/admin/login`, { username, password });
    const data = r.data;
    if (!data?.token) return res.status(401).json({ error: 'Invalid admin credentials' });
    res.json({ token: data.token, user: { username: data.username, role: data.role }, redirectUrl: 'http://localhost:3000' });
  } catch (err) {
    console.error('Admin login error:', err.message);
    res.status(401).json({ error: 'Invalid admin credentials' });
  }
});
app.get('/api/auth/verify', (req, res) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ valid: false });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ valid: false });
    res.json({ valid: true, user });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ITEMS
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/items', async (req, res) => {
  try { res.json((await axios.get(`${ITEM_SERVICE}/items`)).data); }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Failed to fetch items', details: e.message }); }
});

app.get('/api/items/search', async (req, res) => {
  try { res.json((await axios.get(`${ITEM_SERVICE}/items/search`, { params: req.query })).data); }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Search failed', details: e.message }); }
});

app.get('/api/items/:id', async (req, res) => {
  try { res.json((await axios.get(`${ITEM_SERVICE}/items/${req.params.id}`)).data); }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Failed to fetch item', details: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// CART
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/cart/:userId', async (req, res) => {
  try {
    const uid = req.params.userId === 'guest-user' ? 999999 : parseInt(req.params.userId);
    let r;
    try { r = await axios.get(`${CART_SERVICE}/carts/user/${uid}`); }
    catch (e) {
      if (e.response?.status === 404) r = await axios.post(`${CART_SERVICE}/carts?userId=${uid}`);
      else throw e;
    }
    res.json(r.data);
  } catch (e) { res.status(e.response?.status||500).json({ error: 'Failed to fetch cart', details: e.message }); }
});

app.post('/api/cart/:userId/items', async (req, res) => {
  try {
    const uid = req.params.userId === 'guest-user' ? 999999 : parseInt(req.params.userId);
    let cart;
    try { cart = (await axios.get(`${CART_SERVICE}/carts/user/${uid}`)).data; }
    catch (e) {
      if (e.response?.status === 404) cart = (await axios.post(`${CART_SERVICE}/carts?userId=${uid}`)).data;
      else throw e;
    }
    const item = (await axios.get(`${ITEM_SERVICE}/items/${req.body.itemId}`)).data;
    const r = await axios.post(`${CART_SERVICE}/carts/${cart.id}/items`, {
      itemId: item.id, itemName: item.name, quantity: req.body.quantity || 1, price: item.price
    });
    res.json(r.data);
  } catch (e) { res.status(e.response?.status||500).json({ error: 'Failed to add to cart', details: e.message }); }
});

app.put('/api/cart/:userId/items/:itemId', async (req, res) => {
  try { res.json((await axios.put(`${CART_SERVICE}/carts/${req.params.userId}/items/${req.params.itemId}`, req.body)).data); }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Failed to update cart', details: e.message }); }
});

app.delete('/api/cart/:userId/items/:itemId', async (req, res) => {
  try { res.json((await axios.delete(`${CART_SERVICE}/carts/${req.params.userId}/items/${req.params.itemId}`)).data); }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Failed to remove cart item', details: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// INVENTORY (stock check)
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/inventory/:itemId', async (req, res) => {
  try { res.json((await axios.get(`${INVENTORY_SERVICE}/inventory/${req.params.itemId}`)).data); }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Failed to fetch inventory', details: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// USER PROFILE  (protected)
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/profile', authenticateToken, async (req, res) => {
  try { res.json((await axios.get(`${USER_SERVICE}/users/${req.user.id}`)).data); }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Failed to fetch profile', details: e.message }); }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try { res.json((await axios.put(`${USER_SERVICE}/users/${req.user.id}`, req.body)).data); }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Failed to update profile', details: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// ORDERS  (protected)
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/orders', authenticateToken, async (req, res) => {
  try { res.json((await axios.get(`${ORDER_SERVICE}/api/v1/orders/user/${req.user.id}`)).data); }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Failed to fetch orders', details: e.message }); }
});

app.get('/api/orders/:orderId', authenticateToken, async (req, res) => {
  try { res.json((await axios.get(`${ORDER_SERVICE}/api/v1/orders/${req.params.orderId}`)).data); }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Failed to fetch order', details: e.message }); }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { items, ...rest } = req.body;
    const mappedItems = (items || []).map(item => ({
      productId: String(item.itemId || item.productId || ''),
      productName: item.name || item.productName || '',
      quantity: item.quantity || 1,
      unitPrice: item.price || item.unitPrice || 0,
      description: item.sku || item.description || null
    }));
    const orderPayload = { ...rest, items: mappedItems, customerId: String(req.user.id) };
    const response = await axios.post(`${ORDER_SERVICE}/api/v1/orders`, orderPayload);
    res.status(response.status).json(response.data);
  }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Failed to create order', details: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// CHECKOUT
// ═════════════════════════════════════════════════════════════════════════════
app.post('/api/checkout', async (req, res) => {
  try { res.json((await axios.post(`${CHECKOUT_SERVICE}/checkouts`, req.body)).data); }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Checkout failed', details: e.message }); }
});

app.get('/api/checkout/:id', async (req, res) => {
  try { res.json((await axios.get(`${CHECKOUT_SERVICE}/checkouts/${req.params.id}`)).data); }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Failed to fetch checkout', details: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// PAYMENTS
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/payments', async (req, res) => {
  try { res.json((await axios.get(`${PAYMENT_SERVICE}/api/v1/payments`)).data); }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Failed to fetch payments', details: e.message }); }
});

app.post('/api/payments', async (req, res) => {
  try { res.json((await axios.post(`${PAYMENT_SERVICE}/api/v1/payments`, req.body)).data); }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Payment failed', details: e.message }); }
});

app.get('/api/payments/order/:orderId', async (req, res) => {
  try { res.json((await axios.get(`${PAYMENT_SERVICE}/api/v1/payments/order/${req.params.orderId}`)).data); }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Failed to fetch payment', details: e.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// RETURNS  (protected)
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/returns', authenticateToken, async (req, res) => {
  try { res.json((await axios.get(`${RETURN_SERVICE}/returns/user/${req.user.id}`)).data); }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Failed to fetch returns', details: e.message }); }
});

app.post('/api/returns', authenticateToken, async (req, res) => {
  try { res.json((await axios.post(`${RETURN_SERVICE}/returns`, { ...req.body, userId: req.user.id })).data); }
  catch (e) { res.status(e.response?.status||500).json({ error: 'Failed to create return', details: e.message }); }
});

// ── Angular catch-all (must be last) ─────────────────────────────────────────
app.get('*', (_, res) => res.sendFile(path.join(staticRoot, 'index.html')));

app.listen(PORT, () => {
  console.log(`🛍️  UI-Customer running on http://localhost:${PORT}`);
  console.log(`   👤 User:      ${USER_SERVICE}`);
  console.log(`   📦 Items:     ${ITEM_SERVICE}`);
  console.log(`   🛒 Cart:      ${CART_SERVICE}`);
  console.log(`   ✅ Checkout:  ${CHECKOUT_SERVICE}`);
  console.log(`   📋 Orders:    ${ORDER_SERVICE}`);
  console.log(`   💳 Payments:  ${PAYMENT_SERVICE}`);
  console.log(`   📊 Inventory: ${INVENTORY_SERVICE}`);
  console.log(`   ↩️  Returns:   ${RETURN_SERVICE}`);
});
