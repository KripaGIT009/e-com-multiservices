/**
 * ui-main — Unified BFF (Backend For Frontend)
 *
 * Replaces: ui-auth (4200) + ui-storefront (4201) + ui-checkout (4202)
 *           + ui-account (4203) + ui-admin (3000)
 *
 * Single port 4200:
 *   /          → Customer Angular SPA (storefront, cart, checkout, account)
 *   /admin/    → Admin Angular SPA   (dashboard, users, items, orders …)
 *   /api/…     → Unified BFF routes (role-aware where paths overlap)
 *
 * JWT strategy:
 *   - Customer tokens  : signed with JWT_SECRET (issued here on login)
 *   - Admin    tokens  : signed with ADMIN_JWT_SECRET (issued by admin-service,
 *                        forwarded as-is so admin-service can verify them too)
 */

const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const axios      = require('axios');
const jwt        = require('jsonwebtoken');
const path       = require('path');
const fs         = require('fs');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 4200;

// ── JWT secrets ───────────────────────────────────────────────────────────────
const JWT_SECRET       = process.env.JWT_SECRET       || 'your-unified-secret-key';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET ||
  'adminSecretKeyForJWTTokenGenerationAndValidation2025WithExtraLengthToMeetHS512Requirements';

// ── Backend service URLs ──────────────────────────────────────────────────────
const USER_SERVICE      = process.env.USER_SERVICE_URL      || 'http://localhost:8004';
const ITEM_SERVICE      = process.env.ITEM_SERVICE_URL      || 'http://localhost:8005';
const CART_SERVICE      = process.env.CART_SERVICE_URL      || 'http://localhost:8006';
const CHECKOUT_SERVICE  = process.env.CHECKOUT_SERVICE_URL  || 'http://localhost:8007';
const ORDER_SERVICE     = process.env.ORDER_SERVICE_URL     || 'http://localhost:8001';
const PAYMENT_SERVICE   = process.env.PAYMENT_SERVICE_URL   || 'http://localhost:8002';
const INVENTORY_SERVICE = process.env.INVENTORY_SERVICE_URL || 'http://localhost:8003';
const RETURN_SERVICE    = process.env.RETURN_SERVICE_URL    || 'http://localhost:8008';
const ADMIN_SERVICE     = process.env.ADMIN_SERVICE_URL     || 'http://localhost:8011';

app.use(cors());
app.use(bodyParser.json());

// ── Static file serving ───────────────────────────────────────────────────────
// Admin Angular SPA — built with --base-href /admin/ so all asset URLs are /admin/*
const adminDistPath = path.join(__dirname, 'dist/admin');
if (fs.existsSync(adminDistPath)) {
  app.use('/admin', express.static(adminDistPath));
}

// Customer Angular SPA — served at /
const customerDistPath = path.join(__dirname, 'dist/customer');
if (fs.existsSync(customerDistPath)) {
  app.use(express.static(customerDistPath));
}

// ── JWT auth middlewares ──────────────────────────────────────────────────────

/** Requires a valid customer JWT (signed with JWT_SECRET). */
const authenticateToken = (req, res, next) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

/** Requires a valid admin JWT (signed with ADMIN_JWT_SECRET). */
const authenticateAdmin = (req, res, next) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, ADMIN_JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid admin token' });
    req.user = { ...user, isAdmin: true };
    next();
  });
};

/**
 * Accepts EITHER a valid admin JWT OR a valid customer JWT.
 * Sets req.user.isAdmin = true when admin token is detected.
 * Used for routes that serve different data depending on caller role.
 */
const authenticateAny = (req, res, next) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  // Try admin JWT first
  jwt.verify(token, ADMIN_JWT_SECRET, (adminErr, adminUser) => {
    if (!adminErr) {
      req.user = { ...adminUser, isAdmin: true };
      return next();
    }
    // Fall back to customer JWT
    jwt.verify(token, JWT_SECRET, (custErr, custUser) => {
      if (!custErr) {
        req.user = { ...custUser, isAdmin: false };
        return next();
      }
      return res.status(403).json({ error: 'Invalid token' });
    });
  });
};

/** Builds Authorization header object to forward the caller's token to admin-service. */
const adminAuth = (req) => ({ Authorization: req.headers['authorization'] });

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'UP', service: 'ui-main' }));

// ═════════════════════════════════════════════════════════════════════════════
// CUSTOMER AUTH
// Signs tokens with JWT_SECRET; delegates credential check to user-service.
// ═════════════════════════════════════════════════════════════════════════════
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password are required' });

    // Resolve username → email if needed (user-service login requires email)
    let loginEmail = username;
    if (!username.includes('@')) {
      try {
        const r = await axios.get(`${USER_SERVICE}/users/username/${username}`);
        if (r.data?.email) loginEmail = r.data.email;
      } catch (_) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    let loginRes;
    try {
      loginRes = await axios.post(`${USER_SERVICE}/users/login`, { email: loginEmail, password });
    } catch (e) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const data = loginRes.data;
    const uid  = data?.userId || data?.id;
    if (!uid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: uid, username: data.username, email: data.email, role: data.role || 'CUSTOMER' },
      JWT_SECRET, { expiresIn: '24h' }
    );
    res.json({
      token,
      user: { id: uid, username: data.username, email: data.email, role: data.role || 'CUSTOMER' }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'Username, email and password are required' });

    const r    = await axios.post(`${USER_SERVICE}/users`, {
      username, email, password,
      firstName: firstName || username,
      lastName:  lastName  || '',
      role: 'CUSTOMER'
    });
    const user  = r.data;
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: 'CUSTOMER' },
      JWT_SECRET, { expiresIn: '24h' }
    );
    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: 'CUSTOMER' }
    });
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: 'Registration failed', details: err.message });
  }
});

app.post('/api/auth/logout', (_, res) => res.json({ message: 'Logged out successfully' }));

app.get('/api/auth/verify', (req, res) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ valid: false });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ valid: false });
    res.json({ valid: true, user });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN AUTH — delegates to admin-service and returns its token unchanged.
// Admin-service tokens are signed with ADMIN_JWT_SECRET; the authenticateAdmin
// and authenticateAny middlewares validate them using that same secret.
// ═════════════════════════════════════════════════════════════════════════════
app.post('/api/admin/login', async (req, res) => {
  try {
    const r = await axios.post(`${ADMIN_SERVICE}/api/admin/login`, req.body);
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 401).json({ error: err.response?.data || 'Admin login failed' });
  }
});

// Alias used by the storefront Angular login component (/api/auth/admin-login)
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const r = await axios.post(`${ADMIN_SERVICE}/api/admin/login`, req.body);
    res.json({ ...r.data, redirectUrl: '/admin/' });
  } catch (err) {
    res.status(err.response?.status || 401).json({ error: 'Invalid admin credentials.' });
  }
});

// Admin management (CRUD on admin accounts) — must come before /api/admin/:id
app.get('/api/admin', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/admin`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch admin users' }); }
});
app.post('/api/admin', authenticateAdmin, async (req, res) => {
  try {
    const r = await axios.post(`${ADMIN_SERVICE}/api/admin`, req.body, { headers: adminAuth(req) });
    res.status(201).json(r.data);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to create admin' }); }
});
app.put('/api/admin/:id', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.put(`${ADMIN_SERVICE}/api/admin/${req.params.id}`, req.body, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update admin' }); }
});
app.delete('/api/admin/:id', authenticateAdmin, async (req, res) => {
  try {
    await axios.delete(`${ADMIN_SERVICE}/api/admin/${req.params.id}`, { headers: adminAuth(req) });
    res.status(204).send();
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to delete admin' }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// ITEMS — public reads; writes are admin-only (via admin-service).
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/items/search', async (req, res) => {
  try { res.json((await axios.get(`${ITEM_SERVICE}/items/search`, { params: req.query })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Search failed' }); }
});
app.get('/api/items/:id', async (req, res) => {
  try { res.json((await axios.get(`${ITEM_SERVICE}/items/${req.params.id}`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch item' }); }
});
app.get('/api/items', async (req, res) => {
  try { res.json((await axios.get(`${ITEM_SERVICE}/items`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch items' }); }
});
app.post('/api/items', authenticateAdmin, async (req, res) => {
  try {
    const r = await axios.post(`${ADMIN_SERVICE}/api/manage/items`, req.body, { headers: adminAuth(req) });
    res.status(201).json(r.data);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to create item' }); }
});
app.put('/api/items/:id', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.put(`${ADMIN_SERVICE}/api/manage/items/${req.params.id}`, req.body, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update item' }); }
});
app.delete('/api/items/:id', authenticateAdmin, async (req, res) => {
  try {
    await axios.delete(`${ADMIN_SERVICE}/api/manage/items/${req.params.id}`, { headers: adminAuth(req) });
    res.status(204).send();
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to delete item' }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// CART — customer only
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
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch cart' }); }
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
    const r    = await axios.post(`${CART_SERVICE}/carts/${cart.id}/items`, {
      itemId: item.id, itemName: item.name, quantity: req.body.quantity || 1, price: item.price
    });
    res.json(r.data);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to add to cart' }); }
});
app.put('/api/cart/:userId/items/:itemId', async (req, res) => {
  try { res.json((await axios.put(`${CART_SERVICE}/carts/${req.params.userId}/items/${req.params.itemId}`, req.body)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update cart' }); }
});
app.delete('/api/cart/:userId/items/:itemId', async (req, res) => {
  try { res.json((await axios.delete(`${CART_SERVICE}/carts/${req.params.userId}/items/${req.params.itemId}`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to remove cart item' }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// INVENTORY
//   GET /api/inventory          — admin: full list via admin-service
//   GET /api/inventory/:id      — public: single item by ID (stock check)
//   POST /api/inventory         — admin only
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/inventory', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/inventory`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch inventory' }); }
});
app.get('/api/inventory/:id', async (req, res) => {
  try { res.json((await axios.get(`${INVENTORY_SERVICE}/inventory/${req.params.id}`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch inventory item' }); }
});
app.post('/api/inventory', authenticateAdmin, async (req, res) => {
  try {
    const r = await axios.post(`${ADMIN_SERVICE}/api/manage/inventory`, req.body, { headers: adminAuth(req) });
    res.status(201).json(r.data);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to add inventory' }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// USER PROFILE — customer reads/updates their own profile
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/profile', authenticateToken, async (req, res) => {
  try { res.json((await axios.get(`${USER_SERVICE}/users/${req.user.id}`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch profile' }); }
});
app.put('/api/profile', authenticateToken, async (req, res) => {
  try { res.json((await axios.put(`${USER_SERVICE}/users/${req.user.id}`, req.body)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update profile' }); }
});
// Alias used by some Angular components
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try { res.json((await axios.get(`${USER_SERVICE}/users/${req.user.id}`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch profile' }); }
});
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try { res.json((await axios.put(`${USER_SERVICE}/users/${req.user.id}`, req.body)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update profile' }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// USERS — admin CRUD (via admin-service)
// /api/users/profile must be registered BEFORE /api/users/:id (see above).
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/users', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/users`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch users' }); }
});
app.get('/api/users/:id', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/users/${req.params.id}`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch user' }); }
});
app.post('/api/users', authenticateAdmin, async (req, res) => {
  try {
    const r = await axios.post(`${ADMIN_SERVICE}/api/manage/users`, req.body, { headers: adminAuth(req) });
    res.status(201).json(r.data);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to create user' }); }
});
app.put('/api/users/:id', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.put(`${ADMIN_SERVICE}/api/manage/users/${req.params.id}`, req.body, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update user' }); }
});
app.delete('/api/users/:id', authenticateAdmin, async (req, res) => {
  try {
    await axios.delete(`${ADMIN_SERVICE}/api/manage/users/${req.params.id}`, { headers: adminAuth(req) });
    res.status(204).send();
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to delete user' }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// ORDERS — role-aware
//   Admin → admin-service (all orders, status management)
//   Customer → order-service (their orders only)
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/orders', authenticateAny, async (req, res) => {
  try {
    if (req.user.isAdmin) {
      const r = await axios.get(`${ADMIN_SERVICE}/api/manage/orders`, { headers: adminAuth(req) });
      res.json(r.data);
    } else {
      const r = await axios.get(`${ORDER_SERVICE}/api/v1/orders/user/${req.user.id}`);
      res.json(r.data);
    }
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch orders' }); }
});
app.get('/api/orders/:orderId', authenticateAny, async (req, res) => {
  try {
    if (req.user.isAdmin) {
      const r = await axios.get(`${ADMIN_SERVICE}/api/manage/orders/${req.params.orderId}`, { headers: adminAuth(req) });
      res.json(r.data);
    } else {
      const r = await axios.get(`${ORDER_SERVICE}/api/v1/orders/${req.params.orderId}`);
      res.json(r.data);
    }
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch order' }); }
});
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { items, ...rest } = req.body;
    const mappedItems = (items || []).map(item => ({
      productId:   String(item.itemId   || item.productId   || ''),
      productName: item.name            || item.productName || '',
      quantity:    item.quantity        || 1,
      unitPrice:   item.price           || item.unitPrice   || 0,
      description: item.sku             || item.description || null
    }));
    const payload  = { ...rest, items: mappedItems, customerId: String(req.user.id) };
    const response = await axios.post(`${ORDER_SERVICE}/api/v1/orders`, payload);
    res.status(response.status).json(response.data);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to create order' }); }
});
app.put('/api/orders/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const r = await axios.put(
      `${ADMIN_SERVICE}/api/manage/orders/${req.params.id}/status?status=${req.body.status}`,
      {}, { headers: adminAuth(req) }
    );
    res.json(r.data);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update order status' }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// CHECKOUT — customer only
// ═════════════════════════════════════════════════════════════════════════════
app.post('/api/checkout', async (req, res) => {
  try { res.json((await axios.post(`${CHECKOUT_SERVICE}/checkouts`, req.body)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Checkout failed' }); }
});
app.get('/api/checkout/:id', async (req, res) => {
  try { res.json((await axios.get(`${CHECKOUT_SERVICE}/checkouts/${req.params.id}`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch checkout' }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// PAYMENTS — role-aware
//   NOTE: /api/payments/order/:orderId must be declared before /api/payments/:id
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/payments/order/:orderId', async (req, res) => {
  try { res.json((await axios.get(`${PAYMENT_SERVICE}/api/v1/payments/order/${req.params.orderId}`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch payment by order' }); }
});
app.get('/api/payments', authenticateAny, async (req, res) => {
  try {
    if (req.user.isAdmin) {
      const r = await axios.get(`${ADMIN_SERVICE}/api/manage/payments`, { headers: adminAuth(req) });
      res.json(r.data);
    } else {
      const r = await axios.get(`${PAYMENT_SERVICE}/api/v1/payments`);
      res.json(r.data);
    }
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch payments' }); }
});
app.get('/api/payments/:id', authenticateAny, async (req, res) => {
  try {
    if (req.user.isAdmin) {
      const r = await axios.get(`${ADMIN_SERVICE}/api/manage/payments/${req.params.id}`, { headers: adminAuth(req) });
      res.json(r.data);
    } else {
      const r = await axios.get(`${PAYMENT_SERVICE}/api/v1/payments/${req.params.id}`);
      res.json(r.data);
    }
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch payment' }); }
});
app.post('/api/payments', async (req, res) => {
  try { res.json((await axios.post(`${PAYMENT_SERVICE}/api/v1/payments`, req.body)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Payment failed' }); }
});
app.post('/api/payments/:id/refund', authenticateAdmin, async (req, res) => {
  try {
    const r = await axios.post(`${ADMIN_SERVICE}/api/manage/payments/${req.params.id}/refund`, {}, { headers: adminAuth(req) });
    res.json(r.data);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to refund payment' }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// RETURNS — role-aware
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/returns', authenticateAny, async (req, res) => {
  try {
    if (req.user.isAdmin) {
      const r = await axios.get(`${ADMIN_SERVICE}/api/manage/returns`, { headers: adminAuth(req) });
      res.json(r.data);
    } else {
      const r = await axios.get(`${RETURN_SERVICE}/api/returns/user/${req.user.id}`);
      res.json(r.data);
    }
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch returns' }); }
});
app.get('/api/returns/:id', authenticateAny, async (req, res) => {
  try {
    if (req.user.isAdmin) {
      const r = await axios.get(`${ADMIN_SERVICE}/api/manage/returns/${req.params.id}`, { headers: adminAuth(req) });
      res.json(r.data);
    } else {
      const r = await axios.get(`${RETURN_SERVICE}/api/returns/${req.params.id}`);
      res.json(r.data);
    }
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch return' }); }
});
app.post('/api/returns', authenticateToken, async (req, res) => {
  try { res.json((await axios.post(`${RETURN_SERVICE}/api/returns`, { ...req.body, userId: req.user.id })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to create return' }); }
});
app.put('/api/returns/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const r = await axios.put(`${ADMIN_SERVICE}/api/manage/returns/${req.params.id}/approve`, {}, { headers: adminAuth(req) });
    res.json(r.data);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to approve return' }); }
});
app.put('/api/returns/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const r = await axios.put(`${ADMIN_SERVICE}/api/manage/returns/${req.params.id}/reject`, {}, { headers: adminAuth(req) });
    res.json(r.data);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to reject return' }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// SHIPMENTS
// ═════════════════════════════════════════════════════════════════════════════

// Public: track by tracking number (like Amazon — no login required)
app.get('/api/track/:trackingNumber', async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/shipments/track/${req.params.trackingNumber}`)).data); }
  catch (e) { res.status(e.response?.status || 404).json({ error: 'Shipment not found' }); }
});

// Customer: get shipment for their order
app.get('/api/shipments/order/:orderId', authenticateToken, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/shipments/order/${req.params.orderId}`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch shipment' }); }
});

// Customer: shipment events for their order's shipment
app.get('/api/shipments/:id/events', authenticateToken, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/shipments/${req.params.id}/events`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch shipment events' }); }
});

// Admin: list all
app.get('/api/shipments', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/shipments`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch shipments' }); }
});
// Admin: get by id
app.get('/api/shipments/:id', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/shipments/${req.params.id}`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch shipment' }); }
});
// Admin: update status
app.put('/api/shipments/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const r = await axios.put(
      `${ADMIN_SERVICE}/api/manage/shipments/${req.params.id}/status`,
      req.body, { headers: adminAuth(req) }
    );
    res.json(r.data);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update shipment' }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// AUDIT — admin only
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/audit/admin/:username', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/audit/admin/${req.params.username}`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch admin audit logs' }); }
});
app.get('/api/audit/entity/:entityType', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/audit/entity/${req.params.entityType}`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch entity audit logs' }); }
});
app.get('/api/audit', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/audit`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch audit logs' }); }
});

// ─── Admin SPA catch-all ─────────────────────────────────────────────────────
// Serve admin index.html for all /admin/* paths (Angular client-side routing).
// Must come BEFORE the customer catch-all below.
if (fs.existsSync(adminDistPath)) {
  app.get('/admin', (_, res) => res.sendFile(path.join(adminDistPath, 'index.html')));
  app.get('/admin/*', (_, res) => res.sendFile(path.join(adminDistPath, 'index.html')));
} else {
  app.get('/admin', (_, res) => res.status(503).json({ error: 'Admin app not built' }));
  app.get('/admin/*', (_, res) => res.status(503).json({ error: 'Admin app not built' }));
}

// ─── Customer SPA catch-all (must be the very last route) ────────────────────
app.get('*', (_, res) => {
  const indexFile = path.join(customerDistPath, 'index.html');
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  res.status(503).json({ error: 'Customer app not built' });
});

app.listen(PORT, () => {
  console.log(`🚀 UI-Main (Unified) running on http://localhost:${PORT}`);
  console.log(`   🛍  Customer SPA : http://localhost:${PORT}/`);
  console.log(`   🔑  Admin SPA    : http://localhost:${PORT}/admin/`);
  console.log(`   ─────────────────────────────────────────`);
  console.log(`   👤  User Svc     : ${USER_SERVICE}`);
  console.log(`   📦  Item Svc     : ${ITEM_SERVICE}`);
  console.log(`   🛒  Cart Svc     : ${CART_SERVICE}`);
  console.log(`   ✅  Checkout Svc : ${CHECKOUT_SERVICE}`);
  console.log(`   📋  Order Svc    : ${ORDER_SERVICE}`);
  console.log(`   💳  Payment Svc  : ${PAYMENT_SERVICE}`);
  console.log(`   🏭  Inventory    : ${INVENTORY_SERVICE}`);
  console.log(`   🔄  Return Svc   : ${RETURN_SERVICE}`);
  console.log(`   🛡  Admin Svc    : ${ADMIN_SERVICE}`);
});
