const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const { auth, isAdmin } = require('../middleware/auth');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin add new product
router.post('/upload', auth, isAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const { name, description, price, originalPrice, materials, segment, category, sizes, isBundle } = req.body;
        if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'At least one image is required' });

        const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
        const parsedSizes = sizes ? JSON.parse(sizes) : [];

        const newProduct = new Product({
            name, description, price, originalPrice, materials, segment, category,
            isBundle: isBundle === 'true' || isBundle === true,
            images: imageUrls,
            sizes: parsedSizes
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add review with photos
router.post('/:id/reviews', auth, upload.array('photos', 3), async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);
        const User = require('../models/User');
        const user = await User.findById(req.user.id);

        if (!product) return res.status(404).json({ message: 'Product not found' });

        const alreadyReviewed = product.reviews.find(
            (r) => r.user.toString() === req.user.id.toString()
        );

        if (alreadyReviewed) return res.status(400).json({ message: 'Product already reviewed' });

        const photoUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        const review = {
            user: req.user.id,
            username: user.username,
            rating: Number(rating),
            comment,
            images: photoUrls
        };

        product.reviews.push(review);
        product.numReviews = product.reviews.length;
        product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

        await product.save();
        res.status(201).json({ message: 'Review added' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Admin delete product
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
