const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');

// Middleware to verify token for posting reviews
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// GET Reviews for a Product
router.get('/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST Create a Review
router.post('/', verifyToken, async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;

        const User = require('../models/User');
        const user = await User.findById(req.user.userId || req.user.id);
        const userName = user ? user.name : "Anonymous";

        const review = new Review({
            productId,
            userId: req.user.userId || req.user.id,
            userName,
            rating,
            comment
        });

        const savedReview = await review.save();

        // Update Product Rating
        const allReviews = await Review.find({ productId });
        const avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;

        await Product.findOneAndUpdate(
            { id: productId },
            { rating: avgRating, reviews: allReviews.length }
        );

        res.status(201).json(savedReview);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
