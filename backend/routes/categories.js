const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// GET All Categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST Create Category
router.post('/', async (req, res) => {
    try {
        let { name, slug, description } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });

        // Generate slug if not provided
        if (!slug) {
            slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }

        // Check if exists
        const existing = await Category.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${name}$`, 'i') } },
                { slug: slug }
            ]
        });

        if (existing) {
            return res.status(400).json({ message: 'Category name or slug already exists' });
        }

        const newCategory = new Category({ name, slug, description });
        const savedCategory = await newCategory.save();
        res.status(201).json(savedCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE Category
router.delete('/:id', async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
