const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4203;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Backend service URLs
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://localhost:8080';
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL || 'http://localhost:8081';
const RETURN_SERVICE = process.env.RETURN_SERVICE_URL || 'http://localhost:8087';const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:4200';
app.use(cors());
app.use(bodyParser.json());

// Serve static files from Angular app (support both browser and browser/browser)
const accountDistCandidates = [
  path.join(__dirname, 'dist/ui-account/browser'),
  path.join(__dirname, 'dist/ui-account/browser/browser')
];
const accountStaticRoot = accountDistCandidates.find(p => fs.existsSync(path.join(p, 'index.html'))) || accountDistCandidates[0];
app.use(express.static(accountStaticRoot));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'ui-account' });
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ============ AUTH API ============
app.post('/api/login', async (req, res) => {
  try {
    // Delegate to centralized auth service
    const response = await axios.post(`${AUTH_SERVICE}/api/auth/login`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Login error:', error.response?.status, error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.error || 'Authentication failed',
      details: error.message
    });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    // Delegate to centralized auth service
    const response = await axios.post(`${AUTH_SERVICE}/api/auth/register`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.error || 'Registration failed',
      details: error.message 
    });
  }
});

app.post('/api/logout', (req, res) => {
  // Token invalidation handled on client side
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/verify', async (req, res) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE}/api/auth/verify`, {
      headers: req.headers
    });
    res.json(response.data);
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Token verification failed' });
  }
});

// ============ USER PROFILE API ============
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    console.log(`Fetching profile for user ${req.user.id} via ${USER_SERVICE}/users/${req.user.id}`);
    const response = await axios.get(`${USER_SERVICE}/users/${req.user.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching profile:', error.response?.status, error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch profile',
      details: error.message,
      status: error.response?.status
    });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    console.log(`Updating profile for user ${req.user.id} via ${USER_SERVICE}/users/${req.user.id}`);
    const response = await axios.put(`${USER_SERVICE}/users/${req.user.id}`, req.body, {
      headers: { 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error updating profile:', error.response?.status, error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to update profile',
      details: error.message,
      status: error.response?.status
    });
  }
});

// ============ USER PROFILE API (alias for /api/users/profile) ============
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    console.log(`Fetching profile for user ${req.user.id} via ${USER_SERVICE}/users/${req.user.id}`);
    const response = await axios.get(`${USER_SERVICE}/users/${req.user.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching profile:', error.response?.status, error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch profile',
      details: error.message,
      status: error.response?.status
    });
  }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    console.log(`Updating profile for user ${req.user.id} via ${USER_SERVICE}/users/${req.user.id}`);
    const response = await axios.put(`${USER_SERVICE}/users/${req.user.id}`, req.body, {
      headers: { 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error updating profile:', error.response?.status, error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to update profile',
      details: error.message,
      status: error.response?.status
    });
  }
});

// ============ ORDERS HISTORY API ============
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${ORDER_SERVICE}/orders/user/${req.user.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch orders',
      details: error.message 
    });
  }
});

app.get('/api/orders/:orderId', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${ORDER_SERVICE}/orders/${req.params.orderId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching order:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch order',
      details: error.message 
    });
  }
});

// ============ RETURNS API ============
app.get('/api/returns', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${RETURN_SERVICE}/returns/user/${req.user.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching returns:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch returns',
      details: error.message 
    });
  }
});

app.post('/api/returns', authenticateToken, async (req, res) => {
  try {
    const response = await axios.post(`${RETURN_SERVICE}/returns`, {
      ...req.body,
      userId: req.user.id
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error creating return:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to create return',
      details: error.message 
    });
  }
});

// Serve Angular app for all other routes (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(accountStaticRoot, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 UI-Account (UI + BFF) running on port ${PORT}`);
  console.log(`👤 User Service: ${USER_SERVICE}`);
  console.log(`📦 Order Service: ${ORDER_SERVICE}`);
  console.log(`↩️  Return Service: ${RETURN_SERVICE}`);
});
