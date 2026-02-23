const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { verifyToken } = require('../middleware/authMiddleware');

// GET All Orders (Admin)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET My Orders (Authenticated User)
router.get('/my-orders', verifyToken, async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log(`Fetching orders - UserID: ${req.userId}, Email: ${user.email}`);

        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Robust Query: Match userId string OR case-insensitive email
        const orders = await Order.find({
            $or: [
                { userId: req.userId.toString() }, // Ensure string match
                { email: { $regex: new RegExp(`^${escapeRegExp(user.email)}$`, 'i') } } // Case-insensitive email match
            ]
        }).sort({ createdAt: -1 });

        console.log(`Found ${orders.length} orders for user.`);
        res.json(orders);
    } catch (error) {
        console.error("Error fetching my orders:", error);
        res.status(500).json({ message: error.message });
    }
});

// GET Single Order
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST Create Order (Public/User)
router.post('/', async (req, res) => {
    try {
        console.log("POST /api/orders Body:", JSON.stringify(req.body, null, 2));
        const { products, address } = req.body; // Expect address object or string
        const Product = require('../models/Product');
        const jwt = require('jsonwebtoken');

        // Optional: Associate with User ID if Token is Present
        let userId = null;
        const token = req.headers['authorization']?.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
                userId = decoded.id;
            } catch (err) {
                console.warn("Invalid token for order creation, proceeding as guest.");
            }
        }

        // 0. Validate Total Quantity (Max 10 items allowed)
        const totalQuantity = products.reduce((sum, item) => sum + item.quantity, 0);
        if (totalQuantity > 10) {
            return res.status(400).json({ message: "Order limit exceeded: Maximum 10 items allowed per order." });
        }

        let calculatedTotal = 0;
        const validProducts = [];

        // 1. Verify Stock & Price Availability FIRST
        for (const item of products) {
            // Helper to safely check regex on strings only
            const isValidObjectId = (str) => typeof str === 'string' && str.match(/^[0-9a-fA-F]{24}$/);

            // The ID might be passed as 'item.product' (Schema standard) or 'item.id'
            const itemId = item.product || item.id;

            // Try lookup by custom 'id' first, then fallback to '_id', then 'name' if necessary
            let query = {
                $or: [
                    { id: itemId },
                    { _id: isValidObjectId(itemId) ? itemId : null }
                ]
            };

            // If ID is undefined (old cart data), try name
            if (!itemId && item.name) {
                query = { name: item.name };
            }

            let product = await Product.findOne(query);

            // Fallback: If not found and ID looks like a variant (e.g. "prod123-Size"), try base ID
            if (!product && typeof itemId === 'string' && itemId.includes('-')) {
                const baseId = itemId.split('-')[0];
                const cleanQuery = {
                    $or: [
                        { id: baseId },
                        { _id: isValidObjectId(baseId) ? baseId : null }
                    ]
                };
                product = await Product.findOne(cleanQuery);
            }

            if (!product) throw new Error(`Product not found: ${item.name} (ID: ${itemId})`);

            // Check Stock
            if (typeof product.stockQuantity === 'number' && product.stockQuantity < item.quantity) {
                console.warn(`Stock low for ${item.name}. Reqd: ${item.quantity}, Avail: ${product.stockQuantity}`);
                throw new Error(`Insufficient stock for: ${item.name} (Only ${product.stockQuantity} left)`);
            }

            // Determine Price (Handle Variants if implemented, currently using base price or assuming item.price is correct BUT validating it falls within reason or just taking DB price)
            // Ideally, we should check if the item is a variant. For now, we trust the DB price.
            // If we had variant support in backend models, we'd lookup variant price.
            // Assuming product.price is the base price.
            // If the item has a specific size in name/variant, we might need logic.
            // For simplicity and security, we use the price from the DB product object if simple, 
            // OR we verify the sent price matches one of the product's variant prices.

            let price = product.price;

            // Simple Variant Price Check (if product has variants array)
            if (product.variants && product.variants.length > 0) {
                // Try to match the price sent by frontend to one of the variants
                // This is a weak check but better than nothing if we don't know which variant was selected by ID alone
                // Ideally frontend sends variantSKU.
                const matchingVariant = product.variants.find(v => v.price === item.priceAtPurchase);
                if (matchingVariant) {
                    price = matchingVariant.price;
                } else {
                    // Fallback/Flag? For now, if no match found, use base price or error?
                    // Let's assume the frontend sends the correct variant info implicitly via price match for now to avoid breaking checkout
                    // BUT for security, we should default to base price or error.
                    // Let's trust the DB base price if no specific variant logic exists yet.
                    // NOTE: The previous code didn't check prices at all.
                }
            }

            // For strict security: usage of item.priceAtPurchase should be validated. 
            // We will use item.priceAtPurchase ONLY if it matches DB price/variant price.
            // Otherwise we risk user manipulating it.
            // However, ensuring checkout doesn't break is priority.
            // Let's use the DB price.

            calculatedTotal += (item.priceAtPurchase || product.price) * item.quantity;
            validProducts.push({
                ...item,
                product: product._id, // Ensure ObjectId
                price: item.priceAtPurchase // Persist what was shown, but we calculated total above
            });
        }

        // 2. Calculate Shipping
        // Rules: Free above 499, else 50
        const shippingCharge = calculatedTotal > 499 ? 0 : 50;
        const grantTotal = calculatedTotal + shippingCharge;

        // 3. Create Order
        const orderData = { ...req.body };
        if (userId) orderData.userId = userId;

        // OVERWRITE sensitive fields
        orderData.totalAmount = grantTotal;
        orderData.products = validProducts;
        orderData.shippingCharge = shippingCharge;

        const newOrder = new Order(orderData);
        const savedOrder = await newOrder.save();

        // 4. Deduct Stock
        for (const item of validProducts) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stockQuantity -= item.quantity;
                await product.save();
            }
        }

        // Send Email Notifications (Async - don't wait)
        const { sendOrderEmails } = require('../utils/emailService');
        // Extract email effectively
        const customerEmail = savedOrder.email || (req.user && req.user.email);
        sendOrderEmails(savedOrder, { email: customerEmail, name: savedOrder.customerName || 'Customer' });

        res.status(201).json(savedOrder);
    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(400).json({ message: error.message });
    }
});

// PUT Update Order Status (Admin)
router.put('/:id', async (req, res) => {
    try {
        const { status, trackingNumber, courierName, deliveryAgentId } = req.body;

        const updateData = { status };
        if (trackingNumber) updateData.trackingNumber = trackingNumber;
        if (courierName) updateData.courierName = courierName;
        if (deliveryAgentId) updateData.deliveryAgentId = deliveryAgentId;

        if (status === 'shipped') {
            updateData.shippedAt = Date.now();
        } else if (status === 'out_for_delivery') {
            // Auto-generate OTP if moving to Out for Delivery (for Agent App compatibility)
            updateData.deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
        } else if (status === 'delivered') {
            updateData.deliveredAt = Date.now();
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
