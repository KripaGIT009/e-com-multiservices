/**
 * unified-ui — Express BFF (Backend For Frontend)
 *
 * Single port 4200:
 *   /          → Customer Angular SPA
 *   /admin/    → Admin Angular SPA
 *   /api/…     → Unified BFF routes (role-aware)
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
const CART_SERVICE      = process.env.CART_SERVICE_URL       || 'http://localhost:8006';
const CHECKOUT_SERVICE  = process.env.CHECKOUT_SERVICE_URL   || 'http://localhost:8007';
const ORDER_SERVICE     = process.env.ORDER_SERVICE_URL      || 'http://localhost:8001';
const PAYMENT_SERVICE   = process.env.PAYMENT_SERVICE_URL    || 'http://localhost:8002';
const INVENTORY_SERVICE = process.env.INVENTORY_SERVICE_URL  || 'http://localhost:8003';
const RETURN_SERVICE    = process.env.RETURN_SERVICE_URL     || 'http://localhost:8008';
const ADMIN_SERVICE     = process.env.ADMIN_SERVICE_URL      || 'http://localhost:8011';

app.use(cors());
app.use(bodyParser.json());

// ── Static file serving ───────────────────────────────────────────────────────
const customerDistPath = path.join(__dirname, 'dist/unified-ui/browser');

if (fs.existsSync(customerDistPath)) {
  app.use('/admin', express.static(customerDistPath));
  app.use(express.static(customerDistPath));
}

// ── JWT auth middlewares ──────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const authenticateAdmin = (req, res, next) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, ADMIN_JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid admin token' });
    req.user = { ...user, isAdmin: true };
    next();
  });
};

const authenticateAny = (req, res, next) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, ADMIN_JWT_SECRET, (adminErr, adminUser) => {
    if (!adminErr) { req.user = { ...adminUser, isAdmin: true }; return next(); }
    jwt.verify(token, JWT_SECRET, (custErr, custUser) => {
      if (!custErr) { req.user = { ...custUser, isAdmin: false }; return next(); }
      return res.status(403).json({ error: 'Invalid token' });
    });
  });
};

const adminAuth = (req) => ({ Authorization: req.headers['authorization'] });

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'UP', service: 'unified-ui' }));

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMER AUTH
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const loginIdentifier = username || email;
    if (!loginIdentifier || !password)
      return res.status(400).json({ error: 'Email/username and password are required' });
    let loginEmail = loginIdentifier;
    if (!loginIdentifier.includes('@')) {
      try {
        const r = await axios.get(`${USER_SERVICE}/api/users/username/${loginIdentifier}`);
        if (r.data?.email) loginEmail = r.data.email;
      } catch (_) { return res.status(401).json({ error: 'Invalid credentials' }); }
    }
    let loginRes;
    try { loginRes = await axios.post(`${USER_SERVICE}/api/auth/login`, { email: loginEmail, password }); }
    catch (e) { return res.status(401).json({ error: 'Invalid credentials' }); }
    const data = loginRes.data;
    const uid  = data?.userId || data?.id;
    if (!uid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { id: uid, username: data.username, email: data.email, role: data.role || 'CUSTOMER' },
      JWT_SECRET, { expiresIn: '24h' }
    );
    res.json({ token, user: { id: uid, username: data.username, email: data.email, role: data.role || 'CUSTOMER' } });
  } catch (err) { res.status(401).json({ error: 'Invalid credentials' }); }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'Username, email and password are required' });
    const r = await axios.post(`${USER_SERVICE}/api/users`, {
      username, email, password, firstName: firstName || username, lastName: lastName || username, role: 'CUSTOMER'
    });
    const user  = r.data;
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: 'CUSTOMER' },
      JWT_SECRET, { expiresIn: '24h' }
    );
    res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email, role: 'CUSTOMER' } });
  } catch (err) { res.status(err.response?.status || 500).json({ error: 'Registration failed', details: err.message }); }
});

app.post('/api/auth/logout', (_, res) => res.json({ message: 'Logged out successfully' }));

// Forgot/Reset Password — sets a new password for an email
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword)
      return res.status(400).json({ error: 'Email and new password are required' });
    if (newPassword.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // Look up user by email
    let user;
    try {
      user = (await axios.get(`${USER_SERVICE}/api/users/email/${email}`)).data;
    } catch (e) {
      return res.status(404).json({ error: 'No account found with that email' });
    }

    // Update password via user-service reset endpoint
    await axios.post(`${USER_SERVICE}/api/auth/reset-password`, { email, newPassword });
    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ error: 'Failed to reset password' });
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

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN AUTH
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/admin/login', async (req, res) => {
  try { res.json((await axios.post(`${ADMIN_SERVICE}/api/admin/login`, req.body)).data); }
  catch (err) { res.status(err.response?.status || 401).json({ error: err.response?.data || 'Admin login failed' }); }
});
app.post('/api/auth/admin-login', async (req, res) => {
  try { res.json({ ...(await axios.post(`${ADMIN_SERVICE}/api/admin/login`, req.body)).data, redirectUrl: '/admin/' }); }
  catch (err) { res.status(err.response?.status || 401).json({ error: 'Invalid admin credentials.' }); }
});

// Admin management CRUD
app.get('/api/admin', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/admin`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch admin users' }); }
});
app.post('/api/admin', authenticateAdmin, async (req, res) => {
  try { res.status(201).json((await axios.post(`${ADMIN_SERVICE}/api/admin`, req.body, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to create admin' }); }
});
app.put('/api/admin/:id', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.put(`${ADMIN_SERVICE}/api/admin/${req.params.id}`, req.body, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update admin' }); }
});
app.delete('/api/admin/:id', authenticateAdmin, async (req, res) => {
  try { await axios.delete(`${ADMIN_SERVICE}/api/admin/${req.params.id}`, { headers: adminAuth(req) }); res.status(204).send(); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to delete admin' }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ITEMS — public reads, admin writes
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/items/search', async (req, res) => {
  try { res.json((await axios.get(`${ITEM_SERVICE}/items/search`, { params: req.query })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Search failed' }); }
});
app.get('/api/items/sku/:sku', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ITEM_SERVICE}/items/sku/${req.params.sku}`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'SKU lookup failed' }); }
});
app.get('/api/items/:id', async (req, res) => {
  try { res.json((await axios.get(`${ITEM_SERVICE}/items/${req.params.id}`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch item' }); }
});
app.get('/api/items', async (req, res) => {
  try { res.json((await axios.get(`${ITEM_SERVICE}/items`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch items' }); }
});
app.post('/api/items', authenticateAny, async (req, res) => {
  try { res.status(201).json((await axios.post(`${ADMIN_SERVICE}/api/manage/items`, req.body, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to create item' }); }
});
app.put('/api/items/:id', authenticateAny, async (req, res) => {
  try { res.json((await axios.put(`${ADMIN_SERVICE}/api/manage/items/${req.params.id}`, req.body, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update item' }); }
});
app.delete('/api/items/:id', authenticateAny, async (req, res) => {
  try { await axios.delete(`${ADMIN_SERVICE}/api/manage/items/${req.params.id}`, { headers: adminAuth(req) }); res.status(204).send(); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to delete item' }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CART — customer
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/cart/:userId', async (req, res) => {
  try {
    const uid = req.params.userId === 'guest-user' ? 999999 : parseInt(req.params.userId);
    let cart;
    try { 
      cart = (await axios.get(`${CART_SERVICE}/carts/user/${uid}`)).data; 
    } catch (e) {
      if (e.response?.status === 404 || e.response?.status === 500) {
        // Create a new cart only if none exists — use POST which is idempotent in our controller
        cart = (await axios.post(`${CART_SERVICE}/carts?userId=${uid}`)).data;
      } else {
        throw e;
      }
    }
    // Fetch cart items and include them in the response
    let items = [];
    try { items = (await axios.get(`${CART_SERVICE}/carts/${cart.id}/items`)).data; }
    catch (e) { /* no items yet */ }
    res.json({ ...cart, items });
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch cart' }); }
});
app.post('/api/cart/:userId/items', async (req, res) => {
  try {
    const uid = req.params.userId === 'guest-user' ? 999999 : parseInt(req.params.userId);
    let cart;
    try { 
      cart = (await axios.get(`${CART_SERVICE}/carts/user/${uid}`)).data; 
    } catch (e) {
      if (e.response?.status === 404 || e.response?.status === 500) {
        cart = (await axios.post(`${CART_SERVICE}/carts?userId=${uid}`)).data;
      } else {
        throw e;
      }
    }
    const item = (await axios.get(`${ITEM_SERVICE}/items/${req.body.itemId}`)).data;
    const r = await axios.post(`${CART_SERVICE}/carts/${cart.id}/items`, {
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

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/inventory', authenticateAny, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/inventory`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch inventory' }); }
});
app.get('/api/inventory/:id', async (req, res) => {
  try { res.json((await axios.get(`${INVENTORY_SERVICE}/inventory/${req.params.id}`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch inventory item' }); }
});
app.post('/api/inventory', authenticateAny, async (req, res) => {
  try { res.status(201).json((await axios.post(`${ADMIN_SERVICE}/api/manage/inventory`, req.body, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to add inventory' }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// USER PROFILE — customer
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/profile', authenticateToken, async (req, res) => {
  try { res.json((await axios.get(`${USER_SERVICE}/api/users/email/${req.user.email}`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch profile' }); }
});
app.put('/api/profile', authenticateToken, async (req, res) => {
  try { res.json((await axios.put(`${USER_SERVICE}/api/users/me`, req.body, { headers: { Authorization: req.headers['authorization'] } })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update profile' }); }
});
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try { res.json((await axios.get(`${USER_SERVICE}/api/users/email/${req.user.email}`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch profile' }); }
});
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try { res.json((await axios.put(`${USER_SERVICE}/api/users/me`, req.body, { headers: { Authorization: req.headers['authorization'] } })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update profile' }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// USERS — admin CRUD
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/users', authenticateAny, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/users`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch users' }); }
});
app.get('/api/users/:id', authenticateAny, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/users/${req.params.id}`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch user' }); }
});
app.post('/api/users', authenticateAny, async (req, res) => {
  try { res.status(201).json((await axios.post(`${ADMIN_SERVICE}/api/manage/users`, req.body, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to create user' }); }
});
app.put('/api/users/:id', authenticateAny, async (req, res) => {
  try { res.json((await axios.put(`${ADMIN_SERVICE}/api/manage/users/${req.params.id}`, req.body, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update user' }); }
});
app.delete('/api/users/:id', authenticateAny, async (req, res) => {
  try { await axios.delete(`${ADMIN_SERVICE}/api/manage/users/${req.params.id}`, { headers: adminAuth(req) }); res.status(204).send(); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to delete user' }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS — role-aware
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/orders', authenticateAny, async (req, res) => {
  try {
    if (req.user.isAdmin) { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/orders`, { headers: adminAuth(req) })).data); }
    else { res.json((await axios.get(`${ORDER_SERVICE}/api/v1/orders/user/${req.user.id}`)).data); }
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch orders' }); }
});
app.get('/api/orders/:orderId', authenticateAny, async (req, res) => {
  try {
    if (req.user.isAdmin) { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/orders/${req.params.orderId}`, { headers: adminAuth(req) })).data); }
    else { res.json((await axios.get(`${ORDER_SERVICE}/api/v1/orders/${req.params.orderId}`)).data); }
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch order' }); }
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
    const payload = { ...rest, items: mappedItems, customerId: String(req.user.id) };
    const response = await axios.post(`${ORDER_SERVICE}/api/v1/orders`, payload);
    res.status(response.status).json(response.data);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to create order' }); }
});
app.put('/api/orders/:id/status', authenticateAny, async (req, res) => {
  try {
    const r = await axios.put(`${ADMIN_SERVICE}/api/manage/orders/${req.params.id}/status?status=${req.body.status}`, {}, { headers: adminAuth(req) });
    res.json(r.data);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update order status' }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CHECKOUT
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/checkout', async (req, res) => {
  try { res.json((await axios.post(`${CHECKOUT_SERVICE}/checkouts`, req.body)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Checkout failed' }); }
});
app.get('/api/checkout/:id', async (req, res) => {
  try { res.json((await axios.get(`${CHECKOUT_SERVICE}/checkouts/${req.params.id}`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch checkout' }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENTS — role-aware
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/payments/order/:orderId', async (req, res) => {
  try { res.json((await axios.get(`${PAYMENT_SERVICE}/api/v1/payments/order/${req.params.orderId}`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch payment by order' }); }
});
app.get('/api/payments', authenticateAny, async (req, res) => {
  try {
    if (req.user.isAdmin) { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/payments`, { headers: adminAuth(req) })).data); }
    else { res.json((await axios.get(`${PAYMENT_SERVICE}/api/v1/payments`)).data); }
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch payments' }); }
});
app.get('/api/payments/:id', authenticateAny, async (req, res) => {
  try {
    if (req.user.isAdmin) { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/payments/${req.params.id}`, { headers: adminAuth(req) })).data); }
    else { res.json((await axios.get(`${PAYMENT_SERVICE}/api/v1/payments/${req.params.id}`)).data); }
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch payment' }); }
});
app.post('/api/payments', async (req, res) => {
  try { res.json((await axios.post(`${PAYMENT_SERVICE}/api/v1/payments`, req.body)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Payment failed' }); }
});
app.post('/api/payments/:id/refund', authenticateAny, async (req, res) => {
  try { res.json((await axios.post(`${ADMIN_SERVICE}/api/manage/payments/${req.params.id}/refund`, {}, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to refund payment' }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// RETURNS — role-aware
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/returns', authenticateAny, async (req, res) => {
  try {
    if (req.user.isAdmin) { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/returns`, { headers: adminAuth(req) })).data); }
    else { res.json((await axios.get(`${RETURN_SERVICE}/api/returns/user/${req.user.id}`)).data); }
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch returns' }); }
});
app.get('/api/returns/:id', authenticateAny, async (req, res) => {
  try {
    if (req.user.isAdmin) { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/returns/${req.params.id}`, { headers: adminAuth(req) })).data); }
    else { res.json((await axios.get(`${RETURN_SERVICE}/api/returns/${req.params.id}`)).data); }
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch return' }); }
});
app.post('/api/returns', authenticateToken, async (req, res) => {
  try { res.json((await axios.post(`${RETURN_SERVICE}/api/returns`, { ...req.body, userId: req.user.id })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to create return' }); }
});
app.put('/api/returns/:id/approve', authenticateAny, async (req, res) => {
  try { res.json((await axios.put(`${ADMIN_SERVICE}/api/manage/returns/${req.params.id}/approve`, {}, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to approve return' }); }
});
app.put('/api/returns/:id/reject', authenticateAny, async (req, res) => {
  try { res.json((await axios.put(`${ADMIN_SERVICE}/api/manage/returns/${req.params.id}/reject`, {}, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to reject return' }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SHIPMENTS
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/track/:trackingNumber', async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/shipments/track/${req.params.trackingNumber}`)).data); }
  catch (e) { res.status(e.response?.status || 404).json({ error: 'Shipment not found' }); }
});
app.get('/api/shipments/order/:orderId', authenticateToken, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/shipments/order/${req.params.orderId}`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch shipment' }); }
});
app.get('/api/shipments/:id/events', authenticateToken, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/shipments/${req.params.id}/events`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch shipment events' }); }
});
app.get('/api/shipments', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/shipments`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch shipments' }); }
});
app.get('/api/shipments/:id', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/shipments/${req.params.id}`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch shipment' }); }
});
app.put('/api/shipments/:id/status', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.put(`${ADMIN_SERVICE}/api/manage/shipments/${req.params.id}/status`, req.body, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update shipment' }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT — admin only
// ═══════════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/admin/dashboard/summary', authenticateAny, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/admin/dashboard/summary`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch dashboard summary' }); }
});

app.get('/api/admin/dashboard/revenue', authenticateAny, async (req, res) => {
  try { 
    const period = req.query.period || 'monthly';
    res.json((await axios.get(`${ADMIN_SERVICE}/api/admin/dashboard/revenue?period=${period}`)).data); 
  }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch revenue data' }); }
});

app.get('/api/admin/dashboard/orders/status-distribution', authenticateAny, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/admin/dashboard/orders/status-distribution`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch order status distribution' }); }
});

app.get('/api/admin/dashboard/products/top-selling', authenticateAny, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/admin/dashboard/products/top-selling`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch top products' }); }
});

app.get('/api/admin/dashboard/activity-feed', authenticateAny, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/admin/dashboard/activity-feed`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch activity feed' }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD (legacy)
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/dashboard`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch dashboard' }); }
});

// ─── Admin SPA catch-all ─────────────────────────────────────────────────────
app.get('/admin', (_, res) => {
  const indexFile = path.join(customerDistPath, 'index.html');
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  res.status(503).json({ error: 'Admin app not built' });
});
app.get('/admin/*', (_, res) => {
  const indexFile = path.join(customerDistPath, 'index.html');
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  res.status(503).json({ error: 'Admin app not built' });
});

// ─── Customer SPA catch-all (must be the very last route) ────────────────────
app.get('*', (_, res) => {
  const indexFile = path.join(customerDistPath, 'index.html');
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  res.status(503).json({ error: 'Customer app not built. Run: npm run build' });
});

app.listen(PORT, () => {
  console.log(`🚀 Unified-UI running on http://localhost:${PORT}`);
  console.log(`   🛍  Customer SPA : http://localhost:${PORT}/`);
  console.log(`   🔑  Admin SPA    : http://localhost:${PORT}/admin/`);
});
