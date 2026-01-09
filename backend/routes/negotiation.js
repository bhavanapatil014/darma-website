const express = require('express');
const router = express.Router();
const Negotiation = require('../models/Negotiation');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon'); // To verify/create coupons logic if needed
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/negotiate/message - User sends message (Start or Continue)
router.post('/message', verifyToken, async (req, res) => {
    try {
        const { productId, text, image, offerPrice } = req.body;

        let neg = await Negotiation.findOne({
            user: req.userId,
            product: productId,
            status: { $in: ['active', 'deal_reached'] } // Keep conversation alive? Or force new if closed?
        });

        if (!neg) {
            // Start New
            const product = await Product.findById(productId);
            if (!product) return res.status(404).json({ message: "Product not found" });

            neg = new Negotiation({
                user: req.userId,
                product: productId,
                originalPrice: product.price,
                status: 'active',
                messages: []
            });
        }

        // Add Message
        const msg = {
            sender: 'user',
            text,
            image,
            offerPrice,
            createdAt: new Date()
        };
        neg.messages.push(msg);
        neg.updatedAt = new Date();
        await neg.save();

        res.status(201).json(neg);
    } catch (error) {
        res.status(500).json({ message: "Failed to send message", error: error.message });
    }
});

// GET /api/negotiate/my-offers - User History
router.get('/my-offers', verifyToken, async (req, res) => {
    try {
        const offers = await Negotiation.find({ user: req.userId })
            .populate('product')
            .sort({ updatedAt: -1 });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch offers", error: error.message });
    }
});

// GET /api/negotiate/product/:productId - Get specific chat for UI
router.get('/product/:productId', verifyToken, async (req, res) => {
    try {
        const neg = await Negotiation.findOne({
            user: req.userId,
            product: req.params.productId,
            status: { $ne: 'closed' } // Get active one
        });
        res.json(neg || null);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch negotiation", error: error.message });
    }
});

// --- ADMIN ROUTES ---

// GET /api/negotiate/all - Admin List
router.get('/all', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'admin' && req.userRole !== 'superadmin') return res.status(403).json({ message: "Access denied" });

        const offers = await Negotiation.find()
            .populate('user', 'name email')
            .populate('product')
            .sort({ updatedAt: -1 });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch offers", error: error.message });
    }
});

// POST /api/negotiate/:id/reply - Admin Reply (Text + Optional Coupon)
router.post('/:id/reply', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'admin' && req.userRole !== 'superadmin') return res.status(403).json({ message: "Access denied" });

        const { text, image, couponCode, status } = req.body;
        const neg = await Negotiation.findById(req.params.id);
        if (!neg) return res.status(404).json({ message: "Negotiation not found" });

        const msg = {
            sender: 'admin',
            text,
            image,
            createdAt: new Date()
        };
        neg.messages.push(msg);

        if (status) neg.status = status;
        if (couponCode) {
            neg.couponCode = couponCode;
            neg.status = 'deal_reached';
        }

        neg.updatedAt = new Date();
        await neg.save();
        res.json(neg);
    } catch (error) {
        res.status(500).json({ message: "Failed to reply", error: error.message });
    }
});

module.exports = router;
