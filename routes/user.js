const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Subscriber = require('../models/Subscriber');
const nodemailer = require('nodemailer');
const { auth, isAdmin } = require('../middleware/auth');

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile (comprehensive)
router.put('/profile', auth, async (req, res) => {
    try {
        const {
            mobile, gender, dob, location,
            alternateMobile, hintName, addresses
        } = req.body;

        const user = await User.findById(req.user.id);

        if (mobile !== undefined) user.mobile = mobile;
        if (gender !== undefined) user.gender = gender;
        if (dob !== undefined) user.dob = dob;
        if (location !== undefined) user.location = location;
        if (alternateMobile !== undefined) user.alternateMobile = alternateMobile;
        if (hintName !== undefined) user.hintName = hintName;

        if (addresses && Array.isArray(addresses)) {
            user.addresses = addresses;
        }

        await user.save();
        const updatedUser = await User.findById(req.user.id).select('-password');
        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle wishlist
router.post('/wishlist/:productId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const productId = req.params.productId;

        // More robust comparison for ObjectId vs String
        const wishlistStrings = user.wishlist.map(id => id.toString());
        const index = wishlistStrings.indexOf(productId);
        
        if (index === -1) {
            user.wishlist.push(productId);
        } else {
            user.wishlist.splice(index, 1);
        }

        await user.save();
        
        // Explicitly return as strings for frontend compatibility
        const updatedWishlist = user.wishlist.map(id => id.toString());
        res.json({ message: 'Wishlist updated', wishlist: updatedWishlist });
    } catch (error) {
        console.error('Wishlist Error Details:', error);
        res.status(500).json({ message: 'Server error during wishlist sync' });
    }
});

// Newsletter Subscription
router.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const existing = await Subscriber.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Already subscribed to the Archive List' });

        await Subscriber.create({ email });
        res.status(201).json({ message: 'Successfully subscribed to the Archive List' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Admin notify all users
router.post('/notify-all', auth, isAdmin, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ message: 'Message is required' });

        await User.updateMany({}, {
            $push: { notifications: { $each: [{ message }], $position: 0 } }
        });

        const subscribers = await Subscriber.find({});
        const emails = subscribers.map(s => s.email);

        if (emails.length > 0) {
            let transporter;
            let isTestAccount = false;

            // More robust check to see if the user has actually filled in their real details
            const isPlaceholder = (val) => !val || val.includes('your_gmail_username') || val.includes('your_gmail_app_password');

            if (!isPlaceholder(process.env.EMAIL_USER) && !isPlaceholder(process.env.EMAIL_PASS)) {
                // Use Real Gmail Account
                transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });
            } else {
                // Fallback to Test Account if no real email is configured
                isTestAccount = true;
                let testAccount = await nodemailer.createTestAccount();
                transporter = nodemailer.createTransport({
                    host: "smtp.ethereal.email",
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });
                console.log("⚠️ Real EMAIL_USER is not configured in .env. Falling back to Ethereal test inbox!");
            }

            try {
                let info = await transporter.sendMail({
                    from: !isTestAccount ? `"Diamond Fashion" <${process.env.EMAIL_USER}>` : '"Diamond Fashion" <archive@diamondfashion.com>',
                    bcc: emails.join(', '),
                    subject: "New Dispatch from Diamond Fashion Archive",
                    text: message,
                    html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #1a1d14; color: #fff;">
                              <h2 style="color: #d4af37;">Diamond Fashion</h2>
                              <p style="font-size: 16px;">${message}</p>
                              <hr style="border-top: 1px solid #d4af37;" />
                              <p style="font-size: 12px; color: #888;">You are receiving this because you subscribed to the Archive List.</p>
                           </div>`
                });
                
                if (isTestAccount) {
                    console.log("Transmission sent to test inbox: %s", info.messageId);
                    console.log("Check it here -> %s", nodemailer.getTestMessageUrl(info));
                } else {
                    console.log("Real Email Delivered successfully: %s", info.messageId);
                }
            } catch (err) {
                console.error("❌ Transporter failed to send mail:", err.message);
                throw new Error("Mail submission failed");
            }
        }

        res.json({ message: 'Notifications broadcasted locally and via email' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
