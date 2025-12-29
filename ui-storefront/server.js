const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4201;

// Backend service URLs
const ITEM_SERVICE = process.env.ITEM_SERVICE_URL || 'http://localhost:8082';
const CART_SERVICE = process.env.CART_SERVICE_URL || 'http://localhost:8085';
const INVENTORY_SERVICE = process.env.INVENTORY_SERVICE_URL || 'http://localhost:8084';

app.use(cors());
app.use(bodyParser.json());

// Serve static files from Angular app
app.use(express.static(path.join(__dirname, 'dist/ui-storefront/browser')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'ui-storefront' });
});

// ============ ITEMS API ============
app.get('/api/items', async (req, res) => {
  try {
    const response = await axios.get(`${ITEM_SERVICE}/items`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching items:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch items',
      details: error.message 
    });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const response = await axios.get(`${ITEM_SERVICE}/items/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching item:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch item',
      details: error.message 
    });
  }
});

app.get('/api/items/search', async (req, res) => {
  try {
    const { query } = req.query;
    const response = await axios.get(`${ITEM_SERVICE}/items/search?query=${query}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error searching items:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to search items',
      details: error.message 
    });
  }
});

// ============ CART API ============
app.get('/api/cart/:userId', async (req, res) => {
  try {
    const response = await axios.get(`${CART_SERVICE}/cart/${req.params.userId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching cart:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch cart',
      details: error.message 
    });
  }
});

app.post('/api/cart/:userId/items', async (req, res) => {
  try {
    const response = await axios.post(`${CART_SERVICE}/cart/${req.params.userId}/items`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error adding to cart:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to add to cart',
      details: error.message 
    });
  }
});

app.put('/api/cart/:userId/items/:itemId', async (req, res) => {
  try {
    const response = await axios.put(
      `${CART_SERVICE}/cart/${req.params.userId}/items/${req.params.itemId}`, 
      req.body
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error updating cart item:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to update cart item',
      details: error.message 
    });
  }
});

app.delete('/api/cart/:userId/items/:itemId', async (req, res) => {
  try {
    const response = await axios.delete(
      `${CART_SERVICE}/cart/${req.params.userId}/items/${req.params.itemId}`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error removing cart item:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to remove cart item',
      details: error.message 
    });
  }
});

// ============ INVENTORY API (for stock availability) ============
app.get('/api/inventory/:itemId', async (req, res) => {
  try {
    const response = await axios.get(`${INVENTORY_SERVICE}/inventory/${req.params.itemId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching inventory:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch inventory',
      details: error.message 
    });
  }
});

// Serve Angular app for all other routes (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/storefront-ui/browser/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 UI-Storefront (UI + BFF) running on port ${PORT}`);
  console.log(`📦 Item Service: ${ITEM_SERVICE}`);
  console.log(`🛒 Cart Service: ${CART_SERVICE}`);
  console.log(`📊 Inventory Service: ${INVENTORY_SERVICE}`);
});
