const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
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

        // Notify Customer
        const { sendDeliveryUpdateEmail } = require('../utils/emailService');
        await sendDeliveryUpdateEmail(order, 'out_for_delivery');

        res.json({ message: 'Order marked Out for Delivery', order, simulationOtp: otp });
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
        order.deliveryOtp = undefined; // Clear OTP

        // Cash Handling
        if (order.paymentMethod === 'cod') {
            order.paymentStatus = 'paid';
            order.codCollected = true;
            order.codAmountToCollect = order.totalAmount;

            // Update Agent Wallet
            await User.findByIdAndUpdate(req.userId, {
                $inc: { 'agentProfile.currentCashBalance': order.totalAmount }
            });
        }

        await order.save();

        // Notify Customer
        const { sendDeliveryUpdateEmail } = require('../utils/emailService');
        await sendDeliveryUpdateEmail(order, 'delivered');

        res.json({ message: 'Order Delivered Successfully', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/delivery/:id/fail - Mark delivery attempt failed
router.put('/:id/fail', verifyToken, verifyDeliveryPartner, async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await Order.findOne({ _id: req.params.id, deliveryAgentId: req.userId });

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Record Attempt
        order.deliveryAttempts.push({
            timestamp: new Date(),
            status: 'failed',
            reason: reason || 'Delivery Failed',
            agentId: req.userId
        });

        const maxAttempts = 3;
        const failedCount = order.deliveryAttempts.filter(a => a.status === 'failed').length;

        if (failedCount >= maxAttempts) {
            order.status = 'returned'; // Auto-return after max attempts
            order.returnRequest = {
                requestedAt: new Date(),
                reason: 'Max Delivery Attempts Exceeded',
                status: 'approved'
            };
        } else {
            // Keep it 'out_for_delivery' or revert to 'shipped' for next day? 
            // Usually reverts to 'shipped' or stays 'out_for_delivery' until end of day scan.
            // Let's set to 'shipped' so it can be 'Started' again tomorrow.
            order.status = 'shipped';
            order.deliveryOtp = undefined; // Reset OTP
        }

        await order.save();

        // Notify Customer
        const { sendDeliveryUpdateEmail } = require('../utils/emailService');
        await sendDeliveryUpdateEmail(order, 'failed');

        res.json({ message: 'Delivery Marked as Failed', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
