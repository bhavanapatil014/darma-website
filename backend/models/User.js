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
    }],

    // --- Detailed Delivery Agent Profile ---
    agentProfile: {
        vehicleType: { type: String, enum: ['bike', 'scooter', 'van', 'truck'] },
        licensePlate: { type: String },
        serviceAreaPincodes: [{ type: String }],

        // Cash Management
        maxCashLimit: { type: Number, default: 15000 },
        currentCashBalance: { type: Number, default: 0 },

        // Status
        isAvailable: { type: Boolean, default: true },
        currentLoad: { type: Number, default: 0 } // Number of active orders
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
