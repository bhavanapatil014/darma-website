const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    minOrderAmount: {
        type: Number,
        default: 0
    },
    maxDiscountAmount: {
        type: Number // For percentage coupons, cap the discount
    },
    expirationDate: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usageLimit: {
        type: Number, // Total times this coupon can be used
        default: null
    },
    usedCount: {
        type: Number,
        default: 0
    },
    applicableProducts: [{
        type: String // Using String ID to match Product 'id' field
    }],
    applicableCategories: [{
        type: String // Stores category names e.g. "Skincare"
    }],
    applicableBrands: [{
        type: String // Stores brand names e.g. "CeraVe"
    }]
}, {
    timestamps: true,
    minimize: false // Ensure empty objects/arrays are saved? No, usually Mongoose defaults arrays to [].
});

module.exports = mongoose.model('Coupon', couponSchema);
