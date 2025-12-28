const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL;

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/manage/payments`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch payments' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/manage/payments/${req.params.id}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch payment' });
    }
});

router.post('/:id/refund', async (req, res) => {
    try {
        const response = await axios.post(`${ADMIN_SERVICE_URL}/api/manage/payments/${req.params.id}/refund`, {}, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Failed to refund payment' });
    }
});

module.exports = router;
