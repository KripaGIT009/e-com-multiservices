const express = require('express');
const axios = require('axios');
const router = express.Router();

const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL;

// Login
router.post('/login', async (req, res) => {
    try {
        const response = await axios.post(`${ADMIN_SERVICE_URL}/api/admin/login`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: error.response?.data || 'Login failed'
        });
    }
});

// Get all admin users
router.get('/', async (req, res) => {
    try {
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/admin`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: error.response?.data || 'Failed to fetch admin users'
        });
    }
});

// Create admin user
router.post('/', async (req, res) => {
    try {
        const response = await axios.post(`${ADMIN_SERVICE_URL}/api/admin`, req.body, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(201).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: error.response?.data || 'Failed to create admin user'
        });
    }
});

// Update admin user
router.put('/:id', async (req, res) => {
    try {
        const response = await axios.put(`${ADMIN_SERVICE_URL}/api/admin/${req.params.id}`, req.body, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: error.response?.data || 'Failed to update admin user'
        });
    }
});

// Delete admin user
router.delete('/:id', async (req, res) => {
    try {
        await axios.delete(`${ADMIN_SERVICE_URL}/api/admin/${req.params.id}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(204).send();
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: error.response?.data || 'Failed to delete admin user'
        });
    }
});

module.exports = router;
