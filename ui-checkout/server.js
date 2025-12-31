const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4202;

// Backend service URLs
const CHECKOUT_SERVICE = process.env.CHECKOUT_SERVICE_URL || 'http://localhost:8086';
const PAYMENT_SERVICE = process.env.PAYMENT_SERVICE_URL || 'http://localhost:8083';
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL || 'http://localhost:8081';

app.use(cors());
app.use(bodyParser.json());

// Serve static files from Angular app (support both browser and browser/browser)
const checkoutDistCandidates = [
  path.join(__dirname, 'dist/ui-checkout/browser'),
  path.join(__dirname, 'dist/ui-checkout/browser/browser')
];
const checkoutStaticRoot = checkoutDistCandidates.find(p => fs.existsSync(path.join(p, 'index.html'))) || checkoutDistCandidates[0];
app.use(express.static(checkoutStaticRoot));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'ui-checkout' });
});

// ============ CHECKOUT API ============
app.post('/api/checkout', async (req, res) => {
  try {
    const response = await axios.post(`${CHECKOUT_SERVICE}/checkout`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error processing checkout:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to process checkout',
      details: error.message 
    });
  }
});

app.get('/api/checkout/:checkoutId', async (req, res) => {
  try {
    const response = await axios.get(`${CHECKOUT_SERVICE}/checkout/${req.params.checkoutId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching checkout:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch checkout',
      details: error.message 
    });
  }
});

// ============ PAYMENT API ============
app.get('/api/payments', async (req, res) => {
  try {
    const response = await axios.get(`${PAYMENT_SERVICE}/payments`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching payments:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch payments',
      details: error.message 
    });
  }
});

app.get('/api/payments/:id', async (req, res) => {
  try {
    const response = await axios.get(`${PAYMENT_SERVICE}/payments/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching payment:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch payment',
      details: error.message 
    });
  }
});

app.get('/api/payments/order/:orderId', async (req, res) => {
  try {
    const response = await axios.get(`${PAYMENT_SERVICE}/payments/order/${req.params.orderId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching payment by order:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch payment',
      details: error.message 
    });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const response = await axios.post(`${PAYMENT_SERVICE}/payments`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error creating payment:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to create payment',
      details: error.message 
    });
  }
});

// ============ ORDER API (for confirmation) ============
app.get('/api/orders/:orderId', async (req, res) => {
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

// Serve Angular app for all other routes (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(checkoutStaticRoot, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 UI-Checkout (UI + BFF) running on port ${PORT}`);
  console.log(`✅ Checkout Service: ${CHECKOUT_SERVICE}`);
  console.log(`💳 Payment Service: ${PAYMENT_SERVICE}`);
  console.log(`📦 Order Service: ${ORDER_SERVICE}`);
});
