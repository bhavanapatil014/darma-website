const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    dateOfBirth: { type: Date },
    phoneNumber: { type: String },
    role: {
        type: String,
        enum: ['user', 'admin', 'superadmin', 'delivery_partner'],
        default: 'user'
    },
    otp: { type: String },
    otpExpires: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: String, enum: ['self', 'admin'] },
    originalEmail: { type: String },
    cart: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        variantId: { type: String },
        quantity: { type: Number, default: 1 }
    }],
    wishlist: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        variantId: { type: String }
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
