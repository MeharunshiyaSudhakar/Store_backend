const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { auth, isAdmin } = require('../middleware/auth');

// Get all coupons (Admin)
router.get('/', auth, isAdmin, async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create a new coupon (Admin)
router.post('/', auth, isAdmin, async (req, res) => {
    try {
        const { code, discountPercentage, validUntil, isActive } = req.body;
        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) return res.status(400).json({ message: 'Coupon code already exists' });

        const coupon = new Coupon({
            code: code.toUpperCase(),
            discountPercentage,
            validUntil,
            isActive: isActive !== undefined ? isActive : true
        });

        await coupon.save();
        res.status(201).json({ message: 'Coupon created', coupon });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a coupon (Admin)
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Validate and apply a coupon (Public/User)
router.post('/validate', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: 'Code is required' });

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (!coupon) return res.status(404).json({ message: 'Invalid coupon code' });

        if (!coupon.isActive) return res.status(400).json({ message: 'This coupon is no longer active' });
        
        if (new Date(coupon.validUntil) < new Date()) {
            return res.status(400).json({ message: 'This coupon has expired' });
        }

        res.json({ message: 'Coupon applied successfully', discountPercentage: coupon.discountPercentage });
    } catch (error) {
        res.status(500).json({ message: 'Server error validating coupon', error: error.message });
    }
});

module.exports = router;
