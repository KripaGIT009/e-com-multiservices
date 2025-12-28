const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL;

router.use(authenticateToken);

// Get all users
router.get('/', async (req, res) => {
    try {
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/manage/users`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch users'
        });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/manage/users/${req.params.id}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch user'
        });
    }
});

// Create user
router.post('/', async (req, res) => {
    try {
        const response = await axios.post(`${ADMIN_SERVICE_URL}/api/manage/users`, req.body, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(201).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: 'Failed to create user'
        });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const response = await axios.put(`${ADMIN_SERVICE_URL}/api/manage/users/${req.params.id}`, req.body, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: 'Failed to update user'
        });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        await axios.delete(`${ADMIN_SERVICE_URL}/api/manage/users/${req.params.id}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(204).send();
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: 'Failed to delete user'
        });
    }
});

module.exports = router;
