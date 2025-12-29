const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4203;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Backend service URLs
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://localhost:8080';
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL || 'http://localhost:8081';
const RETURN_SERVICE = process.env.RETURN_SERVICE_URL || 'http://localhost:8087';

app.use(cors());
app.use(bodyParser.json());

// Serve static files from Angular app
app.use(express.static(path.join(__dirname, 'dist/ui-account/browser')));

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
    const { username, password } = req.body;
    
    // Call user service to validate credentials
    const response = await axios.post(`${USER_SERVICE}/users/login`, { username, password });
    
    if (response.data && response.data.id) {
      const token = jwt.sign(
        { id: response.data.id, username: response.data.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({ 
        token, 
        user: response.data 
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const response = await axios.post(`${USER_SERVICE}/users`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Registration failed',
      details: error.message 
    });
  }
});

// ============ USER PROFILE API ============
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${USER_SERVICE}/users/${req.user.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching profile:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch profile',
      details: error.message 
    });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const response = await axios.put(`${USER_SERVICE}/users/${req.user.id}`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error updating profile:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to update profile',
      details: error.message 
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
  res.sendFile(path.join(__dirname, 'dist/ui-account/browser/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 UI-Account (UI + BFF) running on port ${PORT}`);
  console.log(`👤 User Service: ${USER_SERVICE}`);
  console.log(`📦 Order Service: ${ORDER_SERVICE}`);
  console.log(`↩️  Return Service: ${RETURN_SERVICE}`);
});
