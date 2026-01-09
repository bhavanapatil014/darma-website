const express = require('express');
const router = express.Router();
const Negotiation = require('../models/Negotiation');
const Product = require('../models/Product');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/negotiate/offer - User makes an offer
router.post('/offer', verifyToken, async (req, res) => {
    try {
        const { productId, offerPrice, message } = req.body;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        const neg = new Negotiation({
            user: req.userId,
            product: productId,
            originalPrice: product.price,
            offerPrice,
            message
        });

        await neg.save();
        res.status(201).json({ message: "Offer sent successfully", negotiation: neg });
    } catch (error) {
        res.status(500).json({ message: "Failed to send offer", error: error.message });
    }
});

// GET /api/negotiate/my-offers - User views their offers
router.get('/my-offers', verifyToken, async (req, res) => {
    try {
        const offers = await Negotiation.find({ user: req.userId }).populate('product').sort({ createdAt: -1 });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch offers", error: error.message });
    }
});

// GET /api/negotiate/all - Admin views all offers
router.get('/all', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
            return res.status(403).json({ message: "Access denied" });
        }
        const offers = await Negotiation.find().populate('user', 'name email').populate('product').sort({ createdAt: -1 });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch offers", error: error.message });
    }
});

// PUT /api/negotiate/:id/respond - Admin Accepts/Rejects
router.put('/:id/respond', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
            return res.status(403).json({ message: "Access denied" });
        }
        const { status, adminResponse } = req.body; // status: 'accepted' | 'rejected' | 'counter'
        const offer = await Negotiation.findByIdAndUpdate(req.params.id, { status, adminResponse }, { new: true });

        // TODO: Send email/notification to user about decision

        res.json(offer);
    } catch (error) {
        res.status(500).json({ message: "Failed to update offer", error: error.message });
    }
});

module.exports = router;
