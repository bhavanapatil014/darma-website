const mongoose = require('mongoose');

const negotiationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    originalPrice: { type: Number, required: true },

    // Chat History
    messages: [{
        sender: { type: String, enum: ['user', 'admin'], required: true },
        text: { type: String }, // Message content
        image: { type: String }, // Image URL (Cloudinary)
        offerPrice: { type: Number }, // If this message proposes a price
        createdAt: { type: Date, default: Date.now }
    }],

    // Deal State
    status: {
        type: String,
        enum: ['active', 'closed', 'deal_reached'],
        default: 'active'
    },

    // Outcome
    finalPrice: { type: Number },
    couponCode: { type: String }, // The coupon given to the user

    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Negotiation', negotiationSchema);
