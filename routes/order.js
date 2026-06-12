const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
});

// 1. Create Order and Razorpay Order
router.post('/', auth, async (req, res) => {
    try {
        const { items, totalAmount } = req.body;
        console.log('Order Request Received:', { itemsCount: items?.length, totalAmount });
        
        if (!items || items.length === 0) return res.status(400).json({ message: 'No items' });

        // Instantiate Razorpay order
        const options = {
            amount: Math.round(totalAmount * 100), // Ensure integer paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const rzpOrder = await razorpay.orders.create(options);
        console.log('Razorpay Order Created:', rzpOrder.id);

        const newOrder = new Order({
            user: req.user.id,
            items,
            totalAmount,
            razorpayOrderId: rzpOrder.id,
            paymentStatus: 'Unpaid',
            status: 'Pending'
        });

        await newOrder.save();

        res.status(201).json({
            order: newOrder,
            razorpayOrder: rzpOrder
        });
    } catch (error) {
        console.error('Razorpay Order Error Details:', error);
        res.status(500).json({ message: 'Server error during order creation', error: error.message });
    }
});

// 2. Verify Payment
router.post('/verify-payment', auth, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            const order = await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                {
                    paymentStatus: 'Paid',
                    status: 'Confirmed',
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature
                },
                { new: true }
            );

            // Add notification
            await User.findByIdAndUpdate(req.user.id, {
                $push: {
                    notifications: {
                        $each: [{
                            message: `Payment Successful! Your Diamond Archive order ${order._id} is now confirmed. Status: Confirmed.`,
                            date: new Date()
                        }],
                        $position: 0
                    }
                }
            });

            res.status(200).json({ message: 'Payment verified successfully', order });
        } else {
            res.status(400).json({ message: 'Invalid payment signature' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during verification', error: error.message });
    }
});

// 3. Admin: Get All Orders
router.get('/all', auth, isAdmin, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'username email')
            .populate('items.product')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching all orders', error: error.message });
    }
});

// 4. Admin: Update Order Status
router.patch('/:id/status', auth, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });

        // Notify user
        await User.findByIdAndUpdate(order.user, {
            $push: {
                notifications: {
                    $each: [{ message: `Order status update: Your piece is now ${status}.` }],
                    $position: 0
                }
            }
        });

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating status', error: error.message });
    }
});

// 5. User: Get mine
router.get('/mine', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('items.product')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// User: Request Return
router.post('/:id/return', auth, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        
        if (order.status !== 'Delivered') {
            return res.status(400).json({ message: 'Only delivered orders can be returned' });
        }

        if (order.returnStatus !== 'Not Returned') {
            return res.status(400).json({ message: 'Return already requested or processed' });
        }

        order.returnStatus = 'Return Requested';
        await order.save();

        res.json({ message: 'Return requested successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Server error requesting return', error: error.message });
    }
});

// 6. Admin: Detailed Analytics
router.get('/analytics', auth, isAdmin, async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const daySales = await Order.aggregate([
            { $match: { createdAt: { $gte: startOfDay }, paymentStatus: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const monthSales = await Order.aggregate([
            { $match: { createdAt: { $gte: startOfMonth }, paymentStatus: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const totalSalesCount = await Order.countDocuments({ paymentStatus: 'Paid' });
        const pendingCount = await Order.countDocuments({ status: 'Pending' });

        res.json({
            day: daySales[0]?.total || 0,
            month: monthSales[0]?.total || 0,
            totalOrders: totalSalesCount,
            pendingOrders: pendingCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Analytics calculation error', error: error.message });
    }
});

module.exports = router;
