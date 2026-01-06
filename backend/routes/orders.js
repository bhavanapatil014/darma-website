const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { verifyToken } = require('../middleware/authMiddleware');

// GET All Orders (Admin)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET My Orders (Authenticated User)
router.get('/my-orders', verifyToken, async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("Fetching orders for user:", user.email);
        const orders = await Order.find({ email: user.email }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error("Error fetching my orders:", error);
        res.status(500).json({ message: error.message });
    }
});

// GET Single Order
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST Create Order (Public/User)
router.post('/', async (req, res) => {
    try {
        console.log("POST /api/orders Body:", JSON.stringify(req.body, null, 2));
        const { products } = req.body;
        const Product = require('../models/Product');

        // 0. Validate Total Quantity (Max 10 items allowed)
        const totalQuantity = products.reduce((sum, item) => sum + item.quantity, 0);
        if (totalQuantity > 10) {
            return res.status(400).json({ message: "Order limit exceeded: Maximum 10 items allowed per order." });
        }

        // 1. Verify Stock Availability FIRST
        for (const item of products) {
            // Helper to safely check regex on strings only
            const isValidObjectId = (str) => typeof str === 'string' && str.match(/^[0-9a-fA-F]{24}$/);

            // Try lookup by custom 'id' first, then fallback to '_id', then 'name' if necessary
            let query = {
                $or: [
                    { id: item.id },
                    { _id: isValidObjectId(item.id) ? item.id : null }
                ]
            };

            // If ID is undefined (old cart data), try name
            if (!item.id && item.name) {
                query = { name: item.name };
            }

            const product = await Product.findOne(query);

            if (!product) throw new Error(`Product not found: ${item.name} (ID: ${item.id})`);
            if (product.stockQuantity < item.quantity) {
                throw new Error(`Insufficient stock for: ${item.name} (Only ${product.stockQuantity} left)`);
            }
        }

        // 2. Create Order
        const newOrder = new Order(req.body);
        const savedOrder = await newOrder.save();

        // 3. Deduct Stock
        for (const item of products) {
            const isValidObjectId = (str) => typeof str === 'string' && str.match(/^[0-9a-fA-F]{24}$/);

            let query = {
                $or: [
                    { id: item.id },
                    { _id: isValidObjectId(item.id) ? item.id : null }
                ]
            };
            if (!item.id && item.name) {
                query = { name: item.name };
            }

            await Product.findOneAndUpdate(
                query,
                { $inc: { stockQuantity: -item.quantity } }
            );
        }

        // Send Email Notifications (Async - don't wait)
        const { sendOrderEmails } = require('../utils/emailService');
        sendOrderEmails(savedOrder, { email: savedOrder.email, name: savedOrder.shippingAddress?.fullName || 'Customer' });

        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT Update Order Status (Admin)
router.put('/:id', async (req, res) => {
    try {
        const { status, trackingNumber, courierName } = req.body;

        const updateData = { status };
        if (trackingNumber) updateData.trackingNumber = trackingNumber;
        if (courierName) updateData.courierName = courierName;

        if (status === 'shipped') {
            updateData.shippedAt = Date.now();
        } else if (status === 'delivered') {
            updateData.deliveredAt = Date.now();
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
