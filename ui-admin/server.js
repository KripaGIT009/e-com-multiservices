const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const itemRoutes = require('./routes/items');
const inventoryRoutes = require('./routes/inventory');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const shipmentRoutes = require('./routes/shipments');
const returnRoutes = require('./routes/returns');
const auditRoutes = require('./routes/audit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from Angular app
app.use(express.static(path.join(__dirname, 'dist/ui-admin/browser')));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/audit', auditRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'ui-admin' });
});

// Catch-all route for Angular routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/ui-admin/browser', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Serve Angular app for all other routes (must be last)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../ui-frontend/dist/ui-frontend/browser/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 UI-Admin (UI + BFF) running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});
