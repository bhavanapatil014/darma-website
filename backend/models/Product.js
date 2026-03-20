const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: { type: String, unique: true }, // Keeping string ID for compatibility with frontend
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, required: false }, // Primary/Cover Image
    images: { type: [String], default: [] }, // Gallery Images
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    isNewArrival: { type: Boolean, default: false },
    stockQuantity: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true },
    mrp: { type: Number }, // Maximum Retail Price (for strikethrough)
    netContent: { type: String }, // e.g. "80ml", "50g"
    brand: { type: String }, // e.g. "CeraVe"
    variants: [{
        size: { type: String, required: true }, // e.g. "150ml"
        price: { type: Number, required: true },
        mrp: { type: Number },
        stock: { type: Number, default: 0 }
    }]
}, { timestamps: true });

// Indexes for faster filtering and sorting
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
