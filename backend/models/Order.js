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
        enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'failed', 'returned', 'cancelled'],
        default: 'pending'
    },

    // --- Logistics & Packing ---
    warehouseId: { type: String },
    invoiceNumber: { type: String },
    qrCodeData: { type: String }, // For scanning

    // --- Delivery Assignment ---
    courierName: { type: String },
    trackingNumber: { type: String },
    deliveryAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // --- Last Mile Delivery Logic ---
    deliveryOtp: { type: String },
    deliveryAttempts: [{
        timestamp: { type: Date, default: Date.now },
        status: { type: String, enum: ['failed', 'rescheduled'] },
        reason: String,
        agentId: { type: mongoose.Schema.Types.ObjectId }
    }],
    proofOfDelivery: { type: String }, // URL to image

    // --- Timestamps ---
    shippedAt: { type: Date },
    deliveredAt: { type: Date },

    // --- Payment Verification ---
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'cod', 'razorpay'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    codAmountToCollect: { type: Number, default: 0 }, // Specific field for Agent App
    codCollected: { type: Boolean, default: false },

    // --- Returns ---
    returnRequest: {
        requestedAt: Date,
        reason: String,
        status: { type: String, enum: ['requested', 'approved', 'rejected', 'picked', 'refunded'] },
        pickupAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
