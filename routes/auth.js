const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const userResponse = await User.findById(newUser._id).select('-password');
        res.status(201).json({ token, user: userResponse });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Enforce specific admin credentials
        if (user.role === 'admin' && user.email !== 'abyaz816@gmail.com') {
            return res.status(403).json({ message: "Unauthorized admin account" });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const userResponse = await User.findById(user._id).select('-password');
        res.status(200).json({ token, user: userResponse });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.post('/admin-setup', async (req, res) => {
    try {
        const { email, password, adminSecret } = req.body;
        if (adminSecret !== 'diamondadmin') return res.status(403).json({ message: "Unauthorized" });

        // Enforce strict admin constraints
        if (email !== 'abyaz816@gmail.com' || password !== 'cricket313@') {
            return res.status(403).json({ message: "Invalid admin credentials pattern" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Admin already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username: 'Admin', email, password: hashedPassword, role: 'admin' });
        await newUser.save();

        res.status(201).json({ message: "Admin created" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
