const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const router = express.Router();
const Negotiation = require('../models/Negotiation');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon'); // To verify/create coupons logic if needed
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/negotiate/message - User sends message (Start or Continue)
router.post('/message', verifyToken, async (req, res) => {
    try {
        const { productId, text, image, offerPrice } = req.body;

        // Find product by Custom ID (String) or ObjectId
        let product = await Product.findOne({ id: productId });
        if (!product && mongoose.isValidObjectId(productId)) {
            product = await Product.findById(productId);
        }
        if (!product) return res.status(404).json({ message: "Product not found" });

        let neg = await Negotiation.findOne({
            user: req.userId,
            product: product._id,
            status: { $in: ['active', 'deal_reached'] }
        });

        if (!neg) {
            // Start New
            neg = new Negotiation({
                user: req.userId,
                product: product._id,
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
        console.error("Negotiation POST Error:", error);
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
        let product = await Product.findOne({ id: req.params.productId });
        if (!product && mongoose.isValidObjectId(req.params.productId)) {
            product = await Product.findById(req.params.productId);
        }

        if (!product) return res.json(null);

        const neg = await Negotiation.findOne({
            user: req.userId,
            product: product._id,
            status: { $ne: 'closed' }
        });
        res.json(neg || null);
    } catch (error) {
        console.error("Negotiation GET Error:", error);
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

        const { text, image, createCoupon, discountAmount, status } = req.body;
        const neg = await Negotiation.findById(req.params.id);
        if (!neg) return res.status(404).json({ message: "Negotiation not found" });

        let replyText = text;

        if (createCoupon && discountAmount) {
            const product = await Product.findById(neg.product);
            if (product) {
                // Generate Unique Code
                const code = 'DEAL-' + Math.random().toString(36).substring(2, 8).toUpperCase();

                // Scope Logic
                const scope = req.body.couponScope || 'specific'; // 'specific' | 'global'
                const applicableProducts = scope === 'specific' ? [product.id, product._id.toString()] : []; // Empty = Global

                // Create Real Coupon in DB
                const coupon = new Coupon({
                    code,
                    description: `Negotiated deal for ${product.name} (${scope})`,
                    discountType: 'fixed',
                    value: Number(discountAmount),
                    minPurchaseAmount: 0,
                    applicableProducts: applicableProducts, // Fixed field name
                    usageLimit: 1,
                    expirationDate: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 Hours Validity
                });
                await coupon.save();

                neg.couponCode = code;
                neg.status = 'deal_reached';
                // Append coupon info to message
                const scopeText = scope === 'global' ? 'on your next order' : 'for this item';
                replyText = `${text || 'Offer Accepted!'} (Use Coupon Code: ${code} for ₹${discountAmount} OFF ${scopeText})`;
            }
        } else if (status) {
            neg.status = status;
        }

        const msg = {
            sender: 'admin',
            text: replyText,
            image,
            createdAt: new Date()
        };
        neg.messages.push(msg);

        neg.updatedAt = new Date();
        await neg.save();
        res.json(neg);
    } catch (error) {
        console.error("Reply Error:", error);
        res.status(500).json({ message: "Failed to reply", error: error.message });
    }
});

module.exports = router;
