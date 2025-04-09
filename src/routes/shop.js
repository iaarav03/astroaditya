    const express = require('express');
    const Shop = require('../models/shop');
    const {authenticateToken, isAdmin, hasRole} = require('../middleware/auth');
    // const {isAdmin} = require('../middleware/auth');
    const router = express.Router();

    router.post('/', authenticateToken, isAdmin, async (req, res) => {
        try {
            const shop = new Shop(req.body);
            await shop.save();
            res.status(201).json(shop);
        } catch (e) {
            res.status(400).json({ error: e.message });
        }
    });

    router.get('/',async (req, res) => {
        try {
            const shops = await Shop.find();
            res.json(shops);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    router.get('/:id', async (req, res) => {
        try {
            const shop = await Shop.findById(req.params.id);
            if (!shop) return res.status(404).json({ error: 'Shop not found' });
            res.json(shop);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
        try {
            const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!shop) return res.status(404).json({ error: 'Shop not found' });
            res.json(shop);
        } catch (e) {
            res.status(400).json({ error: e.message });
        }
    });

    router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
        try {
            const shop = await Shop.findByIdAndDelete(req.params.id);
            if (!shop) return res.status(404).json({ error: 'Shop not found' });
            res.json({ message: 'Shop deleted successfully' });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    module.exports = router;
