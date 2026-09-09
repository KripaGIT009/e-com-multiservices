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
const JWT_SECRET       = process.env.JWT_SECRET;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;

// These secrets mint and validate every token in the system. Refuse to start
// without them rather than silently falling back to a value published in the repo.
const WEAK_SECRETS = [
  'your-unified-secret-key',
  'adminSecretKeyForJWTTokenGenerationAndValidation2025WithExtraLengthToMeetHS512Requirements',
];
for (const [name, value] of [['JWT_SECRET', JWT_SECRET], ['ADMIN_JWT_SECRET', ADMIN_JWT_SECRET]]) {
  if (!value) {
    console.error(`FATAL: ${name} is not set. Generate one with: openssl rand -base64 48`);
    process.exit(1);
  }
  if (WEAK_SECRETS.includes(value)) {
    console.error(`FATAL: ${name} is set to a well-known default published in this repository.`);
    process.exit(1);
  }
  if (value.length < 32) {
    console.error(`FATAL: ${name} must be at least 32 characters.`);
    process.exit(1);
  }
}

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
const WISHLIST_SERVICE  = process.env.WISHLIST_SERVICE_URL   || 'http://localhost:8016';

app.use(cors());

// The Razorpay webhook signature covers the exact request bytes, so this one route
// must keep its raw body. Parsing it here would make verification impossible.
const RAZORPAY_WEBHOOK_PATH = '/api/payments/razorpay/webhook';
app.use((req, res, next) =>
  req.path === RAZORPAY_WEBHOOK_PATH
    ? express.raw({ type: '*/*' })(req, res, next)
    : bodyParser.json()(req, res, next)
);

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

/**
 * Resolves a bearer token against either realm without asserting any privilege.
 * Returns null when the token is absent or invalid.
 *
 * Two identity realms exist: admin-service issues its own tokens (ADMIN_JWT_SECRET),
 * while user-service accounts are signed by this BFF (JWT_SECRET) and carry a role
 * claim. Both can legitimately be an administrator.
 */
const resolveUser = (req) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return null;
  try {
    const u = jwt.verify(token, ADMIN_JWT_SECRET);
    return { ...u, username: u.username || u.sub, isAdmin: true };
  } catch (_) { /* not an admin-realm token — try the customer realm */ }
  try {
    const u = jwt.verify(token, JWT_SECRET);
    return { ...u, isAdmin: u.role === 'ADMIN' };
  } catch (_) {
    return null;
  }
};

// Requires a valid token in either realm AND administrator privilege.
const authenticateAdmin = (req, res, next) => {
  if (!(req.headers['authorization'] || '').split(' ')[1])
    return res.status(401).json({ error: 'Access token required' });
  const user = resolveUser(req);
  if (!user) return res.status(403).json({ error: 'Invalid token' });
  if (!user.isAdmin) return res.status(403).json({ error: 'Administrator privileges required' });
  req.user = user;
  next();
};

// Requires a valid token in either realm; sets req.user.isAdmin for role-aware routes.
const authenticateAny = (req, res, next) => {
  if (!(req.headers['authorization'] || '').split(' ')[1])
    return res.status(401).json({ error: 'Access token required' });
  const user = resolveUser(req);
  if (!user) return res.status(403).json({ error: 'Invalid token' });
  req.user = user;
  next();
};

/**
 * Mints a short-lived admin-service token for the already-authorised caller.
 *
 * The caller's own token is deliberately not forwarded: a user-service ADMIN holds a
 * JWT_SECRET token that admin-service cannot verify. Every route using this helper is
 * already behind authenticateAdmin, so req.user is a confirmed administrator.
 */
const issueRefreshToken = (user) =>
  jwt.sign({ ...user, aud: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });

const clearGuestCookie = (res) => {
  if (res && !res.headersSent) {
    res.setHeader('Set-Cookie', `${GUEST_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  }
};

/**
 * Folds this browser's guest cart into the account that just signed in.
 *
 * Without this, everything added before signing in silently disappeared — the items
 * stayed on the orphaned guest cart while the user's own cart came back empty.
 * Quantities are added to any line the user already had for the same product.
 *
 * Never allowed to fail the sign-in: a merge problem is logged and swallowed, because
 * losing the cart is bad but refusing the login is worse.
 */
const mergeGuestCart = async (req, res, userId) => {
  const cookie = readCookie(req, GUEST_COOKIE);
  if (!cookie) return;

  let guestId;
  try {
    guestId = jwt.verify(cookie, JWT_SECRET, { audience: 'guest-cart' }).gid;
  } catch (_) {
    return clearGuestCookie(res);
  }

  try {
    const guestCart = (await axios.get(`${CART_SERVICE}/carts/user/${guestId}`)).data;
    const guestItems = (await axios.get(`${CART_SERVICE}/carts/${guestCart.id}/items`)).data || [];
    if (!guestItems.length) return clearGuestCookie(res);

    const userCart = await getOrCreateCart(parseInt(userId, 10));
    for (const gi of guestItems) {
      const existing = await findCartItem(userCart.id, gi.itemId);
      if (existing) {
        await axios.put(`${CART_SERVICE}/carts/${userCart.id}/items/${existing.id}`, {
          quantity: existing.quantity + gi.quantity,
        });
      } else {
        await axios.post(`${CART_SERVICE}/carts/${userCart.id}/items`, {
          itemId: gi.itemId, itemName: gi.itemName, quantity: gi.quantity, price: gi.price,
        });
      }
    }

    await axios.delete(`${CART_SERVICE}/carts/${guestCart.id}/clear`).catch(() => {});
    clearGuestCookie(res);
    console.log(`[cart] merged ${guestItems.length} guest line(s) into user ${userId}`);
  } catch (e) {
    console.warn('[cart] guest cart merge failed:', e.message);
  }
};

const adminAuth = (req) => {
  const username = req.user?.username || req.user?.sub || req.user?.email || 'admin';
  const role = req.user?.role && req.user.role !== 'ADMIN' ? req.user.role : 'ADMIN';
  const token = jwt.sign({ sub: username, role }, ADMIN_JWT_SECRET, {
    algorithm: 'HS512',
    expiresIn: '5m',
  });
  return { Authorization: `Bearer ${token}` };
};

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
    const user = { id: uid, username: data.username, email: data.email, role: data.role || 'CUSTOMER' };
    await mergeGuestCart(req, res, uid);
    res.json({ token, refreshToken: issueRefreshToken(user), user });
  } catch (err) { res.status(401).json({ error: 'Invalid credentials' }); }
});

/**
 * Normalises an Indian mobile number to its bare 10 digits.
 * Accepts "+91 92504 44838", "09250444838", "9250-444-838" and similar, because
 * browsers autofill in all of these shapes. Returns null if it is not a valid
 * Indian mobile number.
 */
const normaliseIndianMobile = (raw) => {
  if (!raw) return null;
  let digits = String(raw).replace(/[^\d]/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
};

/** Derives a unique-ish, URL-safe username from a display name or email. */
const deriveUsername = (name, email) => {
  const base = String(name || email.split('@')[0])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 24);
  return base || email.split('@')[0];
};

const VALID_GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, name, phone, gender } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });
    if (String(password).length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // The form sends a single display name; user-service wants first and last.
    const displayName = String(name || username || '').trim();
    const parts = displayName.split(/\s+/).filter(Boolean);
    const resolvedFirst = firstName || parts[0] || email.split('@')[0];
    const resolvedLast = lastName || (parts.length > 1 ? parts.slice(1).join(' ') : resolvedFirst);

    let phoneNumber;
    if (phone) {
      phoneNumber = normaliseIndianMobile(phone);
      if (!phoneNumber)
        return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
    }

    const normalisedGender = gender ? String(gender).toUpperCase() : undefined;
    if (normalisedGender && !VALID_GENDERS.includes(normalisedGender))
      return res.status(400).json({ error: 'Please select a valid gender.' });

    const explicitUsername = username && !name ? username : null;
    const baseUsername = explicitUsername || deriveUsername(displayName, email);

    const createUser = (candidate) => axios.post(`${USER_SERVICE}/api/users`, {
      username: candidate,
      email,
      password,
      firstName: resolvedFirst,
      lastName: resolvedLast,
      role: 'CUSTOMER',
      ...(phoneNumber ? { phoneNumber } : {}),
      ...(normalisedGender ? { gender: normalisedGender } : {}),
    });

    // A derived username is ours to vary; an explicitly supplied one is not.
    let r;
    for (let attempt = 0; ; attempt++) {
      const candidate = attempt === 0
        ? baseUsername
        : `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;
      try {
        r = await createUser(candidate);
        break;
      } catch (e) {
        const isUsernameClash = e.response?.status === 409 &&
          /username/i.test(String(e.response?.data?.message || ''));
        if (!isUsernameClash || explicitUsername || attempt >= 5) throw e;
      }
    }
    const user  = r.data;
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: 'CUSTOMER' },
      JWT_SECRET, { expiresIn: '24h' }
    );
    const authUser = { id: user.id, username: user.username, email: user.email, role: 'CUSTOMER' };
    await mergeGuestCart(req, res, user.id);
    res.status(201).json({ token, refreshToken: issueRefreshToken(authUser), user: authUser });
  } catch (err) {
    const status = err.response?.status;
    if (status === 409) {
      const detail = String(err.response?.data?.message || '');
      return res.status(409).json({
        error: /username/i.test(detail)
          ? 'That username is already taken. Try a different name.'
          : 'An account with this email already exists. Try logging in instead.',
      });
    }
    if (status === 400) {
      return res.status(400).json({
        error: err.response?.data?.message || 'Some of the details you entered are not valid.',
      });
    }
    console.error('Registration failed:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/api/auth/logout', (_, res) => res.json({ message: 'Logged out successfully' }));

// ── Password reset ────────────────────────────────────────────────────────────
// Two steps. Requesting a reset issues a short-lived single-purpose token; only a
// holder of that token may set a new password. The previous single-call version let
// anyone who knew an email address take over the account.
//
// No mail transport is configured in this environment, so the token is logged
// server-side and — only when ALLOW_DEV_PASSWORD_RESET is explicitly enabled —
// returned in the response. Wire up notification-service before going to production.
const RESET_TOKEN_AUDIENCE = 'password-reset';
const ALLOW_DEV_PASSWORD_RESET = process.env.ALLOW_DEV_PASSWORD_RESET === 'true';

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Always answer identically so this endpoint cannot be used to enumerate accounts.
  const neutral = {
    message: 'If an account exists for that email, a password reset link has been sent.',
  };

  let user;
  try {
    user = (await axios.get(`${USER_SERVICE}/api/users/email/${email}`)).data;
  } catch (e) {
    return res.json(neutral);
  }

  const resetToken = jwt.sign(
    { sub: String(user.id), email: user.email, aud: RESET_TOKEN_AUDIENCE },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  console.log(`[password-reset] token issued for ${user.email} (valid 15m)`);

  res.json(ALLOW_DEV_PASSWORD_RESET ? { ...neutral, devResetToken: resetToken } : neutral);
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword)
      return res.status(400).json({ error: 'Reset token and new password are required' });
    if (newPassword.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    let claims;
    try {
      claims = jwt.verify(token, JWT_SECRET, { audience: RESET_TOKEN_AUDIENCE });
    } catch (e) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }

    await axios.post(`${USER_SERVICE}/api/auth/reset-password`, {
      email: claims.email,
      newPassword,
    });
    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// The Angular JwtInterceptor calls this on any 401. Without it every 401 — including
// a simply wrong password — ended in a forced logout labelled "session expired".
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });
  let claims;
  try {
    claims = jwt.verify(refreshToken, JWT_SECRET, { audience: 'refresh' });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
  const user = { id: claims.id, username: claims.username, email: claims.email, role: claims.role };
  res.json({
    token: jwt.sign(user, JWT_SECRET, { expiresIn: '24h' }),
    refreshToken: issueRefreshToken(user),
    user,
  });
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
// item-service exposes no /items/search route — proxying there bound "search" to
// @GetMapping("/{id}") and returned 400. Filter the catalogue here until a real
// search service exists.
app.get('/api/items/search', async (req, res) => {
  try {
    const items = (await axios.get(`${ITEM_SERVICE}/items`)).data || [];
    const q = String(req.query.q || req.query.search || '').trim().toLowerCase();
    const category = String(req.query.category || '').trim().toLowerCase();
    const matches = items.filter((item) => {
      const haystack = [item.name, item.description, item.sku, item.itemType]
        .filter(Boolean).join(' ').toLowerCase();
      const matchesQuery = !q || q.split(/\s+/).every((term) => haystack.includes(term));
      const matchesCategory = !category || String(item.itemType || '').toLowerCase() === category;
      return matchesQuery && matchesCategory;
    });
    res.json(matches);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Search failed' }); }
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
app.post('/api/items', authenticateAdmin, async (req, res) => {
  try { res.status(201).json((await axios.post(`${ADMIN_SERVICE}/api/manage/items`, req.body, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to create item' }); }
});
app.put('/api/items/:id', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.put(`${ADMIN_SERVICE}/api/manage/items/${req.params.id}`, req.body, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update item' }); }
});
app.delete('/api/items/:id', authenticateAdmin, async (req, res) => {
  try { await axios.delete(`${ADMIN_SERVICE}/api/manage/items/${req.params.id}`, { headers: adminAuth(req) }); res.status(204).send(); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to delete item' }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CART — customer
// ═══════════════════════════════════════════════════════════════════════════════
// Guest carts live above this floor so they cannot collide with real user ids.
const GUEST_ID_FLOOR = 900000000;
const GUEST_COOKIE = 'mis_guest';

const readCookie = (req, name) =>
  (req.headers.cookie || '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + '='))
    ?.slice(name.length + 1);

/**
 * Returns this browser's own guest cart id, issuing one if it has none.
 *
 * Signed rather than a bare number so a visitor cannot read another guest's cart by
 * editing the cookie. httpOnly keeps it away from page scripts.
 */
const guestCartId = (req, res) => {
  const existing = readCookie(req, GUEST_COOKIE);
  if (existing) {
    try {
      return jwt.verify(existing, JWT_SECRET, { audience: 'guest-cart' }).gid;
    } catch (_) { /* tampered or expired — issue a fresh one */ }
  }

  const gid = GUEST_ID_FLOOR + Math.floor(Math.random() * 99999999);
  if (res && !res.headersSent) {
    const token = jwt.sign({ gid, aud: 'guest-cart' }, JWT_SECRET, { expiresIn: '30d' });
    res.cookie
      ? res.cookie(GUEST_COOKIE, token, { httpOnly: true, sameSite: 'lax', maxAge: 2592000000 })
      : res.setHeader('Set-Cookie',
          `${GUEST_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
  }
  return gid;
};

/**
 * The cart always belongs to the caller. :userId in the path is ignored — it was
 * previously trusted, which let anyone read or mutate any cart by id.
 */
const cartOwner = (req, res) => {
  const user = resolveUser(req);
  return user?.id ? parseInt(user.id, 10) : guestCartId(req, res);
};

/** Resolves (creating if needed) the caller's cart. */
const getOrCreateCart = async (uid) => {
  try {
    return (await axios.get(`${CART_SERVICE}/carts/user/${uid}`)).data;
  } catch (e) {
    if (e.response?.status === 404 || e.response?.status === 500) {
      return (await axios.post(`${CART_SERVICE}/carts?userId=${uid}`)).data;
    }
    throw e;
  }
};

/** Maps a product id to the caller's matching cart-item row, or null. */
const findCartItem = async (cartId, itemId) => {
  const items = (await axios.get(`${CART_SERVICE}/carts/${cartId}/items`)).data || [];
  return items.find((i) => String(i.id) === String(itemId))
      || items.find((i) => String(i.itemId) === String(itemId))
      || null;
};

app.get('/api/cart/:userId', async (req, res) => {
  try {
    const cart = await getOrCreateCart(cartOwner(req, res));
    let items = [];
    try { items = (await axios.get(`${CART_SERVICE}/carts/${cart.id}/items`)).data; }
    catch (e) { /* no items yet */ }
    res.json({ ...cart, items });
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch cart' }); }
});

app.post('/api/cart/:userId/items', async (req, res) => {
  try {
    const cart = await getOrCreateCart(cartOwner(req, res));
    const item = (await axios.get(`${ITEM_SERVICE}/items/${req.body.itemId}`)).data;
    const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);

    // cart-service always inserts a new row, so adding the same product twice used
    // to produce duplicate lines. Merge into the existing line instead.
    const existing = await findCartItem(cart.id, item.id);
    if (existing) {
      const r = await axios.put(`${CART_SERVICE}/carts/${cart.id}/items/${existing.id}`, {
        quantity: existing.quantity + quantity,
      });
      return res.json(r.data);
    }

    const r = await axios.post(`${CART_SERVICE}/carts/${cart.id}/items`, {
      itemId: item.id, itemName: item.name, quantity, price: item.price,
    });
    res.json(r.data);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to add to cart' }); }
});

app.put('/api/cart/:userId/items/:itemId', async (req, res) => {
  try {
    const cart = await getOrCreateCart(cartOwner(req, res));
    // cart-service keys on the cart-item row id, not the product id the UI sends.
    const line = await findCartItem(cart.id, req.params.itemId);
    if (!line) return res.status(404).json({ error: 'Item not in cart' });
    res.json((await axios.put(`${CART_SERVICE}/carts/${cart.id}/items/${line.id}`, req.body)).data);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update cart' }); }
});

app.delete('/api/cart/:userId/items/:itemId', async (req, res) => {
  try {
    const cart = await getOrCreateCart(cartOwner(req, res));
    const line = await findCartItem(cart.id, req.params.itemId);
    if (!line) return res.status(404).json({ error: 'Item not in cart' });
    await axios.delete(`${CART_SERVICE}/carts/${cart.id}/items/${line.id}`);
    res.status(204).send();
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to remove cart item' }); }
});

// §2.6 — the cart was never emptied after checkout, so users kept everything they
// had just bought. Exposed so the checkout flow can clear it.
app.delete('/api/cart/:userId/clear', async (req, res) => {
  try {
    const cart = await getOrCreateCart(cartOwner(req, res));
    await axios.delete(`${CART_SERVICE}/carts/${cart.id}/clear`);
    res.status(204).send();
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to clear cart' }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// WISHLIST — customer, always scoped to the caller
// ═══════════════════════════════════════════════════════════════════════════════
// A wishlist belongs to a signed-in customer; there is no guest equivalent, so
// these all require a token rather than falling back to a shared list.
app.get('/api/wishlist', authenticateToken, async (req, res) => {
  try {
    const saved = (await axios.get(`${WISHLIST_SERVICE}/api/wishlist/user/${req.user.id}`)).data || [];
    // Join to the live catalogue so the page shows the current price and can flag a
    // drop against the price captured when the item was saved.
    const enriched = await Promise.all(saved.map(async (entry) => {
      try {
        const item = (await axios.get(`${ITEM_SERVICE}/items/${entry.itemId}`)).data;
        const priceDropped = entry.priceAtSave != null && item.price < entry.priceAtSave;
        return { ...entry, item, currentPrice: item.price, priceDropped, available: true };
      } catch (e) {
        // Product withdrawn since it was saved — the snapshot still renders.
        return { ...entry, item: null, currentPrice: null, priceDropped: false, available: false };
      }
    }));
    res.json(enriched);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch wishlist' }); }
});

app.get('/api/wishlist/count', authenticateToken, async (req, res) => {
  try { res.json((await axios.get(`${WISHLIST_SERVICE}/api/wishlist/user/${req.user.id}/count`)).data); }
  catch (e) { res.json({ count: 0 }); }
});

app.post('/api/wishlist/items', authenticateToken, async (req, res) => {
  try {
    const item = (await axios.get(`${ITEM_SERVICE}/items/${req.body.itemId}`)).data;
    const r = await axios.post(`${WISHLIST_SERVICE}/api/wishlist/user/${req.user.id}/items`, {
      itemId: item.id, itemName: item.name, price: item.price,
    });
    res.status(201).json(r.data);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to save item' }); }
});

app.delete('/api/wishlist/items/:itemId', authenticateToken, async (req, res) => {
  try {
    await axios.delete(`${WISHLIST_SERVICE}/api/wishlist/user/${req.user.id}/items/${req.params.itemId}`);
    res.status(204).send();
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to remove item' }); }
});

// Moves a saved item into the cart, then drops it from the list.
app.post('/api/wishlist/items/:itemId/move-to-cart', authenticateToken, async (req, res) => {
  try {
    const cart = await getOrCreateCart(parseInt(req.user.id, 10));
    const item = (await axios.get(`${ITEM_SERVICE}/items/${req.params.itemId}`)).data;
    const existing = await findCartItem(cart.id, item.id);
    if (existing) {
      await axios.put(`${CART_SERVICE}/carts/${cart.id}/items/${existing.id}`, {
        quantity: existing.quantity + 1,
      });
    } else {
      await axios.post(`${CART_SERVICE}/carts/${cart.id}/items`, {
        itemId: item.id, itemName: item.name, quantity: 1, price: item.price,
      });
    }
    await axios.delete(`${WISHLIST_SERVICE}/api/wishlist/user/${req.user.id}/items/${req.params.itemId}`)
      .catch(() => { /* already gone; the cart write is what matters */ });
    res.json({ moved: true });
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to move item to cart' }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/inventory', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/inventory`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch inventory' }); }
});
app.get('/api/inventory/:id', async (req, res) => {
  try { res.json((await axios.get(`${INVENTORY_SERVICE}/inventory/${req.params.id}`)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch inventory item' }); }
});
app.post('/api/inventory', authenticateAdmin, async (req, res) => {
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
app.get('/api/users', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/users`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch users' }); }
});
app.get('/api/users/:id', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/users/${req.params.id}`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch user' }); }
});
app.post('/api/users', authenticateAdmin, async (req, res) => {
  try { res.status(201).json((await axios.post(`${ADMIN_SERVICE}/api/manage/users`, req.body, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to create user' }); }
});
app.put('/api/users/:id', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.put(`${ADMIN_SERVICE}/api/manage/users/${req.params.id}`, req.body, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to update user' }); }
});
app.delete('/api/users/:id', authenticateAdmin, async (req, res) => {
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
    else {
      const order = (await axios.get(`${ORDER_SERVICE}/api/v1/orders/${req.params.orderId}`)).data;
      // Order ids are sequential — without this check any customer could read any order.
      if (String(order.customerId) !== String(req.user.id))
        return res.status(404).json({ error: 'Order not found' });
      res.json(order);
    }
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
app.put('/api/orders/:id/status', authenticateAdmin, async (req, res) => {
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
app.get('/api/payments/order/:orderId', authenticateAny, async (req, res) => {
  try {
    const payment = (await axios.get(`${PAYMENT_SERVICE}/api/v1/payments/order/${req.params.orderId}`)).data;
    if (!req.user.isAdmin && String(payment.customerId) !== String(req.user.id))
      return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch payment by order' }); }
});
app.get('/api/payments', authenticateAny, async (req, res) => {
  try {
    if (req.user.isAdmin) { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/payments`, { headers: adminAuth(req) })).data); }
    // Scoped to the caller — the unscoped collection is every customer's payment history.
    else { res.json((await axios.get(`${PAYMENT_SERVICE}/api/v1/payments/customer/${req.user.id}`)).data); }
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch payments' }); }
});
app.get('/api/payments/:id', authenticateAny, async (req, res) => {
  try {
    if (req.user.isAdmin) { res.json((await axios.get(`${ADMIN_SERVICE}/api/manage/payments/${req.params.id}`, { headers: adminAuth(req) })).data); }
    else {
      const payment = (await axios.get(`${PAYMENT_SERVICE}/api/v1/payments/${req.params.id}`)).data;
      if (String(payment.customerId) !== String(req.user.id))
        return res.status(404).json({ error: 'Payment not found' });
      res.json(payment);
    }
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch payment' }); }
});
app.post('/api/payments', async (req, res) => {
  try { res.json((await axios.post(`${PAYMENT_SERVICE}/api/v1/payments`, req.body)).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Payment failed' }); }
});
app.post('/api/payments/:id/refund', authenticateAdmin, async (req, res) => {
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
    else {
      const ret = (await axios.get(`${RETURN_SERVICE}/api/returns/${req.params.id}`)).data;
      if (String(ret.userId) !== String(req.user.id))
        return res.status(404).json({ error: 'Return not found' });
      res.json(ret);
    }
  } catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch return' }); }
});
app.post('/api/returns', authenticateToken, async (req, res) => {
  try { res.json((await axios.post(`${RETURN_SERVICE}/api/returns`, { ...req.body, userId: req.user.id })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to create return' }); }
});
app.put('/api/returns/:id/approve', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.put(`${ADMIN_SERVICE}/api/manage/returns/${req.params.id}/approve`, {}, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to approve return' }); }
});
app.put('/api/returns/:id/reject', authenticateAdmin, async (req, res) => {
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
app.get('/api/admin/dashboard/summary', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/admin/dashboard/summary`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch dashboard summary' }); }
});

app.get('/api/admin/dashboard/revenue', authenticateAdmin, async (req, res) => {
  try { 
    const period = req.query.period || 'monthly';
    res.json((await axios.get(`${ADMIN_SERVICE}/api/admin/dashboard/revenue?period=${period}`, { headers: adminAuth(req) })).data); 
  }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch revenue data' }); }
});

app.get('/api/admin/dashboard/orders/status-distribution', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/admin/dashboard/orders/status-distribution`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch order status distribution' }); }
});

app.get('/api/admin/dashboard/products/top-selling', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/admin/dashboard/products/top-selling`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch top products' }); }
});

app.get('/api/admin/dashboard/activity-feed', authenticateAdmin, async (req, res) => {
  try { res.json((await axios.get(`${ADMIN_SERVICE}/api/admin/dashboard/activity-feed`, { headers: adminAuth(req) })).data); }
  catch (e) { res.status(e.response?.status || 500).json({ error: 'Failed to fetch activity feed' }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// RAZORPAY PAYMENT GATEWAY
// ═══════════════════════════════════════════════════════════════════════════════
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_PLACEHOLDER';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'PLACEHOLDER_SECRET';
const crypto = require('crypto');

// Get Razorpay key for frontend
app.get('/api/payments/razorpay/key', (req, res) => {
  res.json({ key: RAZORPAY_KEY_ID });
});

// Create Razorpay order
app.post('/api/payments/razorpay/create-order', authenticateToken, async (req, res) => {
  try {
    const { amount, receipt } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Test/demo mode: if using placeholder keys, return a mock order
    if (RAZORPAY_KEY_ID === 'rzp_test_PLACEHOLDER' || RAZORPAY_KEY_ID.includes('PLACEHOLDER')) {
      console.log('[Razorpay DEMO MODE] Creating mock order for amount:', amount);
      return res.json({
        id: `order_demo_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: receipt || `order_${Date.now()}`,
        demo: true,
      });
    }

    // Production mode: Create order via Razorpay API
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const orderResponse = await axios.post(
      'https://api.razorpay.com/v1/orders',
      {
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt: receipt || `order_${Date.now()}`,
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      id: orderResponse.data.id,
      amount: orderResponse.data.amount,
      currency: orderResponse.data.currency,
      receipt: orderResponse.data.receipt,
    });
  } catch (err) {
    console.error('Razorpay order creation failed:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify Razorpay payment signature
app.post('/api/payments/razorpay/verify', authenticateToken, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = req.body;

    // Demo mode: auto-verify if using placeholder keys
    if (RAZORPAY_KEY_ID === 'rzp_test_PLACEHOLDER' || RAZORPAY_KEY_ID.includes('PLACEHOLDER')) {
      console.log('[Razorpay DEMO MODE] Auto-verifying payment for order:', orderId);
      return res.json({
        success: true,
        message: 'Payment verified successfully (demo mode)',
        paymentId: razorpay_payment_id || `pay_demo_${Date.now()}`,
        orderId: orderId,
      });
    }

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Payment verified — update order status if orderId provided
      if (orderId) {
        try {
          await axios.post(`${PAYMENT_SERVICE}/api/v1/payments`, {
            orderId: orderId,
            amount: 0, // Will be fetched from order
            paymentMethod: 'RAZORPAY',
            transactionId: razorpay_payment_id,
            status: 'COMPLETED',
          });
        } catch (payErr) {
          console.warn('Payment service update failed (non-critical):', payErr.message);
        }
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
        orderId: orderId,
      });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed - invalid signature' });
    }
  } catch (err) {
    console.error('Payment verification error:', err.message);
    res.status(500).json({ success: false, message: 'Payment verification error' });
  }
});

// Razorpay Webhook — handles async payment events from Razorpay
// Configure in Razorpay Dashboard → Settings → Webhooks
// URL: https://yourdomain.com/api/payments/razorpay/webhook
// Events: payment.captured, payment.failed, refund.created
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_KEY_SECRET;

app.post(RAZORPAY_WEBHOOK_PATH, (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    // req.body is a Buffer here (see the raw-body middleware above).
    const body = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      console.warn('[Razorpay Webhook] Invalid signature — rejecting');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    const payload = event.payload;

    console.log(`[Razorpay Webhook] Event: ${eventType}`);

    switch (eventType) {
      case 'payment.captured': {
        const payment = payload.payment?.entity;
        if (payment) {
          console.log(`[Razorpay Webhook] Payment captured: ${payment.id}, Amount: ${payment.amount / 100} INR, Order: ${payment.order_id}`);
          // Update order status to CONFIRMED/PAID in your system
          // This is the backup confirmation for cases where client callback fails
        }
        break;
      }

      case 'payment.failed': {
        const payment = payload.payment?.entity;
        if (payment) {
          console.log(`[Razorpay Webhook] Payment failed: ${payment.id}, Reason: ${payment.error_description}`);
          // Optionally mark order as payment-failed
        }
        break;
      }

      case 'refund.created': {
        const refund = payload.refund?.entity;
        if (refund) {
          console.log(`[Razorpay Webhook] Refund created: ${refund.id}, Amount: ${refund.amount / 100} INR, Payment: ${refund.payment_id}`);
          // Update order/payment status to REFUNDED
        }
        break;
      }

      case 'order.paid': {
        const order = payload.order?.entity;
        if (order) {
          console.log(`[Razorpay Webhook] Order paid: ${order.id}, Amount: ${order.amount / 100} INR`);
        }
        break;
      }

      default:
        console.log(`[Razorpay Webhook] Unhandled event: ${eventType}`);
    }

    // Always respond 200 to acknowledge receipt (Razorpay retries on non-2xx)
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('[Razorpay Webhook] Error processing:', err.message);
    res.status(200).json({ status: 'ok' }); // Still return 200 to prevent retries on parse errors
  }
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
