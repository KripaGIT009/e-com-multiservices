const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL;

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/manage/returns`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch returns' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/manage/returns/${req.params.id}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch return' });
    }
});

router.put('/:id/approve', async (req, res) => {
    try {
        const response = await axios.put(`${ADMIN_SERVICE_URL}/api/manage/returns/${req.params.id}/approve`, {}, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Failed to approve return' });
    }
});

router.put('/:id/reject', async (req, res) => {
    try {
        const response = await axios.put(`${ADMIN_SERVICE_URL}/api/manage/returns/${req.params.id}/reject`, {}, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Failed to reject return' });
    }
});

router.put('/:id/resolve', async (req, res) => {
    try {
        const action = req.body?.action;
        if (!action) {
            return res.status(400).json({ error: 'Action is required' });
        }

        const response = await axios.put(
            `${ADMIN_SERVICE_URL}/api/manage/returns/${req.params.id}/resolve?action=${encodeURIComponent(action)}`,
            {},
            { headers: { Authorization: req.headers.authorization } }
        );
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Failed to resolve return action' });
    }
});

// Compatibility endpoint for older frontend calls
router.put('/:id/status', async (req, res) => {
    try {
        const status = (req.body?.status || '').toString().toUpperCase();
        const actionMap = {
            PENDING: 'APPROVE',
            APPROVED: 'APPROVE',
            REJECTED: 'REJECT',
            REJECT: 'REJECT',
            REFUNDED: 'REFUND',
            REFUND: 'REFUND'
        };

        const action = actionMap[status];
        if (!action) {
            return res.status(400).json({ error: 'Unsupported return status/action value' });
        }

        const response = await axios.put(
            `${ADMIN_SERVICE_URL}/api/manage/returns/${req.params.id}/resolve?action=${encodeURIComponent(action)}`,
            {},
            { headers: { Authorization: req.headers.authorization } }
        );
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Failed to update return status' });
    }
});

module.exports = router;
