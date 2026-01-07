const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    userId: { type: String, required: false }, // Optional link to registered user
    address: { type: String, required: true },
    products: [{
        product: { type: String, required: true },
        name: { type: String, required: true }, // Store snapshot of product name
        image: { type: String }, // Store snapshot of product image
        quantity: { type: Number, required: true },
        priceAtPurchase: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    trackingNumber: { type: String },
    courierName: { type: String },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'cod', 'razorpay'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
