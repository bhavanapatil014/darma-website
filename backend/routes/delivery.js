const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { verifyToken } = require('../middleware/authMiddleware');

// Middleware to ensure user is a delivery partner
const verifyDeliveryPartner = (req, res, next) => {
    if (req.userRole !== 'delivery_partner' && req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ message: 'Access denied: Delivery Partners Only' });
    }
    next();
};

// GET /api/delivery/dashboard - Get assigned orders
router.get('/dashboard', verifyToken, verifyDeliveryPartner, async (req, res) => {
    try {
        // Find orders assigned to this agent that are NOT cancelled or delivered (show history optionally)
        // Usually, dashboard shows active tasks
        const activeOrders = await Order.find({
            deliveryAgentId: req.userId,
            status: { $in: ['shipped', 'out_for_delivery'] }
        }).sort({ updatedAt: -1 });

        const completedOrders = await Order.find({
            deliveryAgentId: req.userId,
            status: 'delivered'
        }).limit(20).sort({ updatedAt: -1 });

        res.json({ active: activeOrders, completed: completedOrders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/delivery/:id/start - Mark as Out for Delivery
router.put('/:id/start', verifyToken, verifyDeliveryPartner, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, deliveryAgentId: req.userId });
        if (!order) return res.status(404).json({ message: 'Order not found or not assigned to you' });

        if (order.status !== 'shipped') {
            return res.status(400).json({ message: 'Order must be Shipped before starting delivery' });
        }

        order.status = 'out_for_delivery';

        // Generate Delivery OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        order.deliveryOtp = otp;

        await order.save();

        // Send OTP to Customer via SMS/Email (Using existing email service)
        const { sendEmailWrapper } = require('../utils/emailService'); // Assuming export, if not we might need to expose it
        // Or basically send a custom email/sms using utils logic
        // For now, logging it and maybe sending simple email
        console.log(`Delivery OTP for Order ${order._id}: ${otp}`);

        // TODO: Send Actual OTP SMS here 

        res.json({ message: 'Order marked Out for Delivery', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/delivery/:id/complete - Verify OTP and Deliver
router.put('/:id/complete', verifyToken, verifyDeliveryPartner, async (req, res) => {
    try {
        const { otp } = req.body;
        const order = await Order.findOne({ _id: req.params.id, deliveryAgentId: req.userId });

        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.status !== 'out_for_delivery') {
            return res.status(400).json({ message: 'Order is not out for delivery yet' });
        }

        if (order.deliveryOtp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        order.status = 'delivered';
        order.deliveredAt = Date.now();
        if (order.paymentMethod === 'cod') {
            order.paymentStatus = 'paid'; // Assume cash collected
        }
        order.deliveryOtp = undefined; // Clear OTP

        await order.save();
        res.json({ message: 'Order Delivered Successfully', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
