const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL;

router.use(authenticateToken);

router.get('/order-workflow-priorities', async (req, res) => {
    try {
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/manage/orders/workflow/priorities`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: error.response?.data || 'Failed to fetch workflow priorities'
        });
    }
});

router.put('/order-workflow-priorities', async (req, res) => {
    try {
        const response = await axios.put(`${ADMIN_SERVICE_URL}/api/manage/orders/workflow/priorities`, req.body, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: error.response?.data || 'Failed to update workflow priorities'
        });
    }
});

module.exports = router;
