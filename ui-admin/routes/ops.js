const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL;

router.use(authenticateToken);

router.get('/work-queue', async (req, res) => {
    try {
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/manage/ops/work-queue`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch operations work queue' });
    }
});

module.exports = router;
