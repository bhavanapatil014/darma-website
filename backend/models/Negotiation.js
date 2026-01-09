const mongoose = require('mongoose');

const negotiationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    originalPrice: { type: Number, required: true },
    offerPrice: { type: Number, required: true },
    message: { type: String },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'counter'],
        default: 'pending'
    },
    adminResponse: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Negotiation', negotiationSchema);
