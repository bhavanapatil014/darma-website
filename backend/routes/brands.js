const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');

// GET All Brands
router.get('/', async (req, res) => {
    try {
        const brands = await Brand.find().sort({ name: 1 });
        res.json(brands);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST Create Brand
router.post('/', async (req, res) => {
    try {
        let { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });
        name = name.trim();

        // Check if exists
        const existing = await Brand.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existing) {
            return res.status(400).json({ message: 'Brand already exists' });
        }

        const newBrand = new Brand({ name });
        const savedBrand = await newBrand.save();
        res.status(201).json(savedBrand);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE Brand
router.delete('/:id', async (req, res) => {
    try {
        await Brand.findByIdAndDelete(req.params.id);
        res.json({ message: 'Brand deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
