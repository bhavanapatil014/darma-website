const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

// Initialize Razorpay instance conditionally
let instance = null;
if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('YOUR_KEY_HERE')) {
    instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
}

// 1. Create an Order
router.post('/create-order', async (req, res) => {
    try {
        // DUMMY MODE CHECK
        if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('YOUR_KEY_HERE')) {
            console.log("Simulating Razorpay Order (Dummy Mode)");
            return res.json({
                id: "order_dummy_" + Date.now(),
                amount: Math.round(req.body.amount * 100),
                currency: "INR"
            });
        }

        const options = {
            amount: Math.round(req.body.amount * 100), // Amount in paise, rounded to avoid fraction errors
            currency: "INR",
            receipt: "order_rcptid_" + Date.now(),
        };
        const order = await instance.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Razorpay Error:", error);
        res.status(500).send(error);
    }
});

// 2. Verify Payment Signature
router.post('/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // DUMMY MODE CHECK
        if (razorpay_order_id.startsWith('order_dummy_')) {
            console.log("Verifying Dummy Payment");
            return res.json({ status: 'success', message: 'Dummy payment verified' });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            res.json({ status: 'success', message: 'Payment verified' });
        } else {
            res.status(400).json({ status: 'failure', message: 'Invalid signature' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
