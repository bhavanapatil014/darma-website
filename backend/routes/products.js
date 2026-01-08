const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');

const fs = require('fs');

// Multer Storage (Memory for Base64)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper Constant
const NEW_ARRIVAL_DAYS = 7;

// GET All Products
router.get('/', async (req, res) => {
    try {
        const { category, brand, search, minPrice, maxPrice, sort } = req.query;
        console.log(`GET /products REQUEST QUERY:`, req.query); // DEBUG

        let query = {};
        if (category && category !== 'all') query.category = category;
        if (brand) {
            query.brand = { $regex: new RegExp(brand, 'i') }; // Flexible "Contains" match
            console.log(`Applying Brand Filter: ${brand} -> Regex: ${query.brand}`);
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Price Filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Sorting
        let sortOption = { createdAt: -1 }; // Default: Newest
        if (sort === 'price_asc') sortOption = { price: 1 };
        else if (sort === 'price_desc') sortOption = { price: -1 };
        else if (sort === 'rating_desc') sortOption = { rating: -1 };
        else if (sort === 'name_asc') sortOption = { name: 1 };

        console.log(`GET /products params:`, req.query);
        console.log(`Query:`, JSON.stringify(query));
        console.log(`Sort:`, sortOption);

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12; // Default 12 per page
        const skip = (page - 1) * limit;

        // Count total for pagination meta
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        // Use lean() for plain JS objects
        const collation = { locale: "en_US", numericOrdering: true };
        const products = await Product.find(query)
            .sort(sortOption)
            .collation(collation)
            .skip(skip)
            .limit(limit)
            .lean();

        if (products.length > 0) {
            console.log(`Sorted Products: ${products.length}. First: ${products[0].price}, Last: ${products[products.length - 1].price}`);
        }

        // Calculate isNewArrival dynamically and ensure images array
        const productsWithStatus = products.map(p => {
            const daysDiff = (new Date() - new Date(p.createdAt)) / (1000 * 60 * 60 * 24);
            return {
                ...p,
                images: (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []),
                isNewArrival: daysDiff <= NEW_ARRIVAL_DAYS
            };
        });

        res.json({
            products: productsWithStatus,
            pagination: {
                totalProducts,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.error("GET /products error:", error);
        res.status(500).json({ message: error.message });
    }
});

// GET Single Product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findOne({ id: req.params.id }).lean();
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Calculate Status
        const daysDiff = (new Date() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24);
        product.isNewArrival = daysDiff <= NEW_ARRIVAL_DAYS;

        // Ensure images
        product.images = (product.images && product.images.length > 0) ? product.images : (product.image ? [product.image] : []);

        console.log(`Sending Product: ${product.name} | MRP: ${product.mrp} | NetContent: ${product.netContent}`);
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST Create Product (Admin)
router.post('/', async (req, res) => {
    try {
        console.log("POST /products body:", JSON.stringify(req.body, null, 2)); // Debug Log
        const newProduct = new Product({
            id: Date.now().toString(),
            ...req.body,
            image: req.body.image || (req.body.images && req.body.images.length > 0 ? req.body.images[0] : 'https://via.placeholder.com/300?text=No+Image'),
            images: req.body.images || [],
            rating: 0,
            reviews: 0,
            inStock: true
        });
        const savedProduct = await newProduct.save();
        console.log("Saved Product Images:", savedProduct.images);
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error("POST /products error:", error);
        res.status(400).json({ message: error.message });
    }
});

// PUT Update Product (Admin)
router.put('/:id', async (req, res) => {
    try {
        console.log("PUT /products/:id body:", JSON.stringify(req.body, null, 2)); // Debug Log
        console.log(`Explicit fields - MRP: ${req.body.mrp}, NetContent: ${req.body.netContent}, Brand: ${req.body.brand}`);
        // Ensure image is set if images array is provided
        const updateData = { ...req.body };
        if (updateData.images && updateData.images.length > 0 && !updateData.image) {
            updateData.image = updateData.images[0];
        }

        const product = await Product.findOneAndUpdate(
            { id: req.params.id },
            updateData,
            { new: true }
        );
        if (!product) return res.status(404).json({ message: 'Product not found' });
        console.log("Updated Product Images:", product.images);
        res.json(product);
    } catch (error) {
        console.error("PUT /products error:", error);
        res.status(400).json({ message: error.message });
    }
});

// DELETE Product (Admin)
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({ id: req.params.id });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST Upload Single Image (Base64)
router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    console.log(`Image converted to Base64 (Size: ${b64.length} chars)`);
    res.json({ imageUrl: dataURI }); // Return Base64 string as URL
});

// POST Upload Multiple Images (Base64)
router.post('/upload-multiple', upload.array('images', 5), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }
    const imageUrls = req.files.map(file => {
        const b64 = Buffer.from(file.buffer).toString('base64');
        return `data:${file.mimetype};base64,${b64}`;
    });

    console.log(`Converted ${imageUrls.length} images to Base64`);
    res.json({ imageUrls });
});

module.exports = router;
