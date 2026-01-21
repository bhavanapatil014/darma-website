const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

// --- Cart Routes ---

// Get Cart
router.get('/cart', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('cart.productId');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Filter out items where product might have been deleted
        const validCart = user.cart.filter(item => item.productId);

        // Format for frontend
        const formattedCart = validCart.map(item => {
            const product = item.productId;
            const variantId = item.variantId;
            let price = product.price;
            let mrp = product.mrp;
            let stock = product.stockQuantity;
            let name = product.name;
            let image = product.image;

            // Resolve variant details if variantId exists
            if (variantId && product.variants && product.variants.length > 0) {
                // variantId is composite "prodId-size" usually, or just size?
                // In our frontend logic we save "prodId-size". 
                // Let's assume we store the composite ID in DB too for simplicity.
                // We need to extract the size part if logical, or just find it.
                // The frontend uses "prodId-size" as the ID.

                // Let's try to match by SIZE if possible, or exact ID match logic
                // We need to parse the size from the variantId string if it follows "id-size" pattern
                // Or we can simple look for a variant that matches the properties.

                // Actually the frontend sends the *computed* price/name in the item object. 
                // But the backend source of truth is the Product model.
                // We should re-construct the details.

                const idParts = variantId.split('-');
                const size = idParts.length > 1 ? idParts.slice(1).join('-') : null;

                if (size) {
                    const variant = product.variants.find(v => v.size === size);
                    if (variant) {
                        price = variant.price;
                        mrp = variant.mrp;
                        stock = variant.stock;
                        name = `${product.name} (${variant.size})`;
                        // image = ... (if variants had images)
                    }
                }
            }

            return {
                ...product.toObject(),
                _id: product._id, // Real Mongo ID
                id: variantId || product._id.toString(), // Frontend ID (Variant or Base)
                name: name,
                price: price, // Current Price
                mrp: mrp,
                stockQuantity: stock,
                quantity: item.quantity,
                // Ensure we send variantId back so frontend context knows
                variantId: variantId
            };
        });

        res.json(formattedCart);
    } catch (error) {
        console.error("Get Cart Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Cart (Sync)
router.put('/cart', protect, async (req, res) => {
    try {
        const { items } = req.body; // Expects array of frontend items

        // Transform frontend items to DB schema
        const cartItems = items.map(item => {
            // Frontend item.id might be composite (variant). 
            // We need real productId. Frontend item usually has '_id' (from previous fetch) or we extract from composite ID?
            // "item" in frontend usually has the full product data merged.
            // But for safety, reliable way is: item._id (if present) is the Mongo Product ID. 
            // If item.id is composite, split it? 
            // Actually, frontend item object *extends* Product. So item._id should be there?
            // Let's check `cart-context`. Yup, it stores `Product` which has `_id` (sometimes `id` is mapped to `_id`).
            // In `data.ts`, `Product` interface has `id: string`. 

            // Critical: We need the Mongo `_id` of the *base* product to store in `productId`.
            // If the frontend sends `item.id` as "123-Small", `123` is typically the MongoID.

            let productId = item._id || item.id;
            if (productId.includes('-')) {
                productId = productId.split('-')[0];
            }

            return {
                productId: productId,
                variantId: item.id, // Store the composite ID as variantId
                quantity: item.quantity
            };
        });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.cart = cartItems;
        await user.save();

        res.json({ success: true, count: user.cart.length });
    } catch (error) {
        console.error("Update Cart Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});


// --- Wishlist Routes ---

router.get('/wishlist', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist.productId');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const validWishlist = user.wishlist.filter(item => item.productId);

        const formattedWishlist = validWishlist.map(item => {
            const product = item.productId;
            const variantId = item.variantId;
            let price = product.price;
            let mrp = product.mrp;
            let name = product.name;
            let stock = product.stockQuantity;

            // Resolve Variant
            if (variantId && product.variants && product.variants.length > 0) {
                const idParts = variantId.split('-');
                const size = idParts.length > 1 ? idParts.slice(1).join('-') : null;

                if (size) {
                    const variant = product.variants.find(v => v.size === size);
                    if (variant) {
                        price = variant.price;
                        mrp = variant.mrp;
                        stock = variant.stock;
                        name = `${product.name} (${variant.size})`;
                    }
                }
            }

            return {
                ...product.toObject(),
                _id: product._id,
                id: variantId || product._id.toString(),
                name: name,
                price: price,
                mrp: mrp,
                stockQuantity: stock
            };
        });

        res.json(formattedWishlist);
    } catch (error) {
        console.error("Get Wishlist Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/wishlist', protect, async (req, res) => {
    try {
        const { items } = req.body;

        const wishlistItems = items.map(item => {
            let productId = item._id || item.id;
            if (productId.includes('-')) {
                productId = productId.split('-')[0];
            }

            return {
                productId: productId,
                variantId: item.id
            };
        });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.wishlist = wishlistItems;
        await user.save();

        res.json({ success: true, count: user.wishlist.length });
    } catch (error) {
        console.error("Update Wishlist Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
