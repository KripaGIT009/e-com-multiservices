const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL;

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/audit`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch audit logs' });
    }
});

router.get('/admin/:username', async (req, res) => {
    try {
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/audit/admin/${req.params.username}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch admin logs' });
    }
});

router.get('/entity/:entityType', async (req, res) => {
    try {
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/audit/entity/${req.params.entityType}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch entity logs' });
    }
});

module.exports = router;
