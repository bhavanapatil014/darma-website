const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');

console.log("Coupons Route Loaded - Version Check: Fixed Scope");

// GET all coupons (Admin)
router.get('/', async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create coupon (Admin)
router.post('/', async (req, res) => {
    try {
        const { code, type, value, minOrderAmount, maxDiscountAmount, expirationDate, usageLimit, applicableProducts, applicableCategories, applicableBrands } = req.body;

        // Check uniqueness
        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }

        const coupon = new Coupon({
            code, type, value, minOrderAmount, maxDiscountAmount, expirationDate, usageLimit, applicableProducts, applicableCategories, applicableBrands
        });

        const newCoupon = await coupon.save();
        res.status(201).json(newCoupon);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update coupon (Admin)
router.put('/:id', async (req, res) => {
    try {
        console.log(`PUT /coupons/${req.params.id} Payload:`, JSON.stringify(req.body, null, 2));
        const { code, type, value, minOrderAmount, maxDiscountAmount, expirationDate, usageLimit, applicableProducts, applicableCategories, applicableBrands } = req.body;

        // Validation could be added here similar to Create

        const updatedCoupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            {
                code, type, value, minOrderAmount, maxDiscountAmount, expirationDate, usageLimit, applicableProducts, applicableCategories, applicableBrands
            },
            { new: true }
        );

        if (!updatedCoupon) return res.status(404).json({ message: 'Coupon not found' });

        console.log("Updated Coupon DB Result:", JSON.stringify(updatedCoupon, null, 2));
        res.json(updatedCoupon);
    } catch (err) {
        console.error("PUT Error:", err);
        res.status(400).json({ message: err.message });
    }
});

// DELETE coupon (Admin)
router.delete('/:id', async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.json({ message: 'Coupon deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST verify/apply coupon (User)
// POST verify/apply coupon (User)
router.post('/verify', async (req, res) => {
    console.log("Verify Request Received");
    try {
        const { code, cartTotal, cartItems } = req.body;

        if (!code) return res.status(400).json({ message: 'Code is required' });

        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid or inactive coupon' });
        }

        // Check Expiry
        if (coupon.expirationDate && new Date() > coupon.expirationDate) {
            return res.status(400).json({ message: 'Coupon expired' });
        }

        // Check Usage Limit
        if (coupon.usageLimit !== null && (coupon.usedCount || 0) >= coupon.usageLimit) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        // Validate cartItems globally
        if (!cartItems || !Array.isArray(cartItems)) {
            return res.status(400).json({ message: 'Cart items are required' });
        }

        // --- Specific Logic (Products OR Categories) ---
        let eligibleAmount = cartTotal;
        let isSpecific = false;
        let eligibleItems = [];

        // Safely check array length
        const prodConstraints = coupon.applicableProducts || [];
        const catConstraints = coupon.applicableCategories || [];
        const brandConstraints = coupon.applicableBrands || [];

        const hasProductConstraints = prodConstraints.length > 0;
        const hasCategoryConstraints = catConstraints.length > 0;
        const hasBrandConstraints = brandConstraints.length > 0;

        if (hasProductConstraints || hasCategoryConstraints || hasBrandConstraints) {
            isSpecific = true;
            console.log("Processing Specific Coupon Logic...");

            // Fetch fresh product data from DB to ensure valid Category/Brand/Price
            // and to handle stale cart items that might miss the 'brand' field.
            // Note: We use the custom 'id' field (String) which matches frontend Item IDs.
            const productIds = cartItems.map(item => item.id).filter(Boolean);
            const dbProducts = await Product.find({ id: { $in: productIds } }).lean();

            // Create a map for quick lookup
            const productMap = {};
            dbProducts.forEach(p => { productMap[p.id] = p; });

            // Filter items that match ANY of the criteria
            console.log(`-- Checking ${cartItems.length} items against constraints:`, { prodConstraints, catConstraints, brandConstraints });

            eligibleItems = cartItems.filter(item => {
                const dbProduct = productMap[item.id];

                if (!dbProduct) {
                    console.log(`   [SKIP] Product ${item.id} not found in DB`);
                    return false;
                }

                // Use DB Product data for validation
                const itemCustomId = String(dbProduct.id).trim();
                const itemMongoId = String(dbProduct._id).trim();
                const itemCategory = (dbProduct.category || "").trim().toLowerCase();
                const itemBrand = (dbProduct.brand || "").trim().toLowerCase();

                // Check Product Match
                const matchesProduct = hasProductConstraints && prodConstraints.some(allowedId => {
                    const strAllowed = String(allowedId).trim();
                    return strAllowed === itemCustomId || strAllowed === itemMongoId;
                });

                // Check Category Match
                const matchesCategory = hasCategoryConstraints && catConstraints.some(allowedCat =>
                    String(allowedCat).trim().toLowerCase() === itemCategory
                );

                // Check Brand Match
                const matchesBrand = hasBrandConstraints && brandConstraints.some(allowedBrand =>
                    String(allowedBrand).trim().toLowerCase() === itemBrand
                );

                const isMatch = matchesProduct || matchesCategory || matchesBrand;
                if (isMatch) {
                    console.log(`   [MATCH] Item ${dbProduct.name} (Brand: ${itemBrand}) matched.`);
                } else {
                    console.log(`   [FAIL] ${dbProduct.name} (Cat:${itemCategory}|Brand:${itemBrand}) not eligible.`);
                }

                // Logic: specific matches (OR logic between types usually, or AND if you want strictness. 
                // Standard ecommerce: Apply if it matches Valid Product OR Valid Category OR Valid Brand)
                // However, if constraints exist, it ONLY applies to matches.
                return isMatch;
            });

            if (eligibleItems.length === 0) {
                return res.status(400).json({ message: 'Coupon is not applicable to any items in your cart' });
            }

            // Calculate total of only eligible items using DB PRICES for safety
            eligibleAmount = eligibleItems.reduce((sum, item) => {
                const dbP = productMap[item.id];
                return sum + (dbP.price * item.quantity);
            }, 0);
        }

        // Check Min Order
        const amountToCheck = isSpecific ? eligibleAmount : cartTotal;

        if (amountToCheck < (coupon.minOrderAmount || 0)) {
            const msg = isSpecific
                ? `Add ₹${coupon.minOrderAmount - amountToCheck} more of eligible items`
                : `Minimum order amount of ₹${coupon.minOrderAmount} required`;
            return res.status(400).json({ message: msg });
        }

        // Calculate Discount
        let discountAmount = 0;
        if (coupon.type === 'percentage') {
            discountAmount = (eligibleAmount * coupon.value) / 100;
            if (coupon.maxDiscountAmount) {
                discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
            }
        } else {
            discountAmount = Math.min(coupon.value, eligibleAmount);
        }

        // Ensure discount doesn't exceed total
        discountAmount = Math.min(discountAmount, cartTotal);

        // Map IDs for frontend
        let eligibleItemIds = [];
        try {
            const itemsToMap = isSpecific ? eligibleItems : cartItems;
            if (Array.isArray(itemsToMap)) {
                eligibleItemIds = itemsToMap.map(i => i ? (i.id || i._id) : null).filter(Boolean);
            }
        } catch (mapErr) {
            console.error("Error determining eligible IDs:", mapErr);
            // Don't crash, just send empty list
            eligibleItemIds = [];
        }

        const responsePayload = {
            success: true,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            discountAmount: Math.round(discountAmount),
            eligibleItemIds: eligibleItemIds,
            message: 'Coupon applied successfully'
        };

        console.log("Sending Verify Response Success");
        res.json(responsePayload);

    } catch (err) {
        console.error("Coupon Verify CRITICAL Error:", err);
        // Ensure we send a JSON response even on crash
        if (!res.headersSent) {
            res.status(500).json({ message: "Internal Server Error during verification: " + err.message });
        }
    }
});

module.exports = router;
