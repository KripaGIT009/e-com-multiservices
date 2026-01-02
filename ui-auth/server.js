const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4200;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://localhost:8004';

// UI URLs for redirects based on role
const UI_URLS = {
  ADMIN: process.env.UI_ADMIN_URL || 'http://localhost:3000',
  ACCOUNT: process.env.UI_ACCOUNT_URL || 'http://localhost:4203',
  CHECKOUT: process.env.UI_CHECKOUT_URL || 'http://localhost:4202',
  STOREFRONT: process.env.UI_STOREFRONT_URL || 'http://localhost:4201'
};

app.use(cors());
app.use(bodyParser.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// ============ CENTRALIZED LOGIN API ============
/**
 * POST /api/auth/login
 * Body: { username, password }
 * Response: { token, user, redirectUrl }
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    let user = null;
    
    // Try to fetch user by username first
    try {
      const response = await axios.get(`${USER_SERVICE}/users/username/${username}`);
      if (response.data && response.data.id) {
        user = response.data;
      }
    } catch (e) {
      // Username not found, try as email
      try {
        const response = await axios.get(`${USER_SERVICE}/users/email/${username}`);
        if (response.data && response.data.id) {
          user = response.data;
        }
      } catch (e) {
        // Email not found either
      }
    }
    
    if (user && user.id) {
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username,
          role: user.role || 'CUSTOMER'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Determine redirect URL based on role
      let redirectUrl = UI_URLS.STOREFRONT; // Default to storefront
      
      if (user.role === 'ADMIN') {
        redirectUrl = UI_URLS.ADMIN;
      } else if (user.role === 'CUSTOMER') {
        redirectUrl = UI_URLS.ACCOUNT;
      } else if (user.role === 'GUEST') {
        redirectUrl = UI_URLS.STOREFRONT;
      }

      res.json({ 
        token, 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role || 'CUSTOMER'
        },
        redirectUrl
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// ============ REGISTER API ============
/**
 * POST /api/auth/register
 * Body: { username, email, password, firstName, lastName, role }
 * Response: { user, token, redirectUrl }
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, firstName, lastName, role } = req.body;

    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    // Create user in user service
    const userResponse = await axios.post(`${USER_SERVICE}/users`, {
      username,
      email,
      firstName: firstName || username,
      lastName: lastName || '',
      role: role || 'CUSTOMER'
    });

    if (userResponse.data && userResponse.data.id) {
      const user = userResponse.data;
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username,
          role: user.role || 'CUSTOMER'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Determine redirect URL based on role
      let redirectUrl = UI_URLS.STOREFRONT;
      if (user.role === 'ADMIN') {
        redirectUrl = UI_URLS.ADMIN;
      } else if (user.role === 'CUSTOMER') {
        redirectUrl = UI_URLS.ACCOUNT;
      }

      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role || 'CUSTOMER'
        },
        token,
        redirectUrl
      });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  } catch (error) {
    console.error('Registration error:', error.response?.status, error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Registration failed',
      details: error.message 
    });
  }
});

// ============ LOGOUT API ============
/**
 * POST /api/auth/logout
 * Response: { message: 'Logged out successfully' }
 */
app.post('/api/auth/logout', (req, res) => {
  // Token invalidation is handled on the client side
  // Server-side implementation would require token blacklist
  res.json({ message: 'Logged out successfully' });
});

// ============ VERIFY TOKEN API ============
/**
 * GET /api/auth/verify
 * Headers: Authorization: Bearer <token>
 * Response: { valid: boolean, user: {...} }
 */
app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ valid: false, error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ valid: false, error: 'Invalid token' });
    }
    res.json({ valid: true, user });
  });
});

// ============ GET REDIRECT URL ============
/**
 * GET /api/auth/redirect-url/:role
 * Response: { redirectUrl: string }
 */
app.get('/api/auth/redirect-url/:role', (req, res) => {
  const role = req.params.role.toUpperCase();
  let redirectUrl = UI_URLS.STOREFRONT;

  if (role === 'ADMIN') {
    redirectUrl = UI_URLS.ADMIN;
  } else if (role === 'CUSTOMER') {
    redirectUrl = UI_URLS.ACCOUNT;
  } else if (role === 'GUEST') {
    redirectUrl = UI_URLS.STOREFRONT;
  }

  res.json({ redirectUrl });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'ui-auth' });
});

// Serve login page for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🔐 Centralized Auth Service running on port ${PORT}`);
  console.log(`👤 User Service: ${USER_SERVICE}`);
  console.log(`\nUI Redirect URLs:`);
  console.log(`  ADMIN: ${UI_URLS.ADMIN}`);
  console.log(`  CUSTOMER: ${UI_URLS.ACCOUNT}`);
  console.log(`  CHECKOUT: ${UI_URLS.CHECKOUT}`);
  console.log(`  STOREFRONT: ${UI_URLS.STOREFRONT}`);
});
