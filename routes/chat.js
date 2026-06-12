const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const msg = message.toLowerCase();
        let reply = "I'm your AI Shopping Assistant! How can I help you today?";

        // Simulated rule-based AI logic
        if (msg.includes("shipping") || msg.includes("delivery")) {
            reply = "We offer FREE shipping on all orders over ₹1500! Standard delivery takes 3-5 business days.";
        } else if (msg.includes("return") || msg.includes("refund") || msg.includes("exchange")) {
            reply = "We have a 14-day hassle-free return and exchange policy. Items must be unworn with original tags attached.";
        } else if (msg.includes("track") || msg.includes("order status")) {
            reply = "You can track your order by logging into your Profile and checking the 'Orders' section. We also send email updates with tracking links once your package ships.";
        } else if (msg.includes("size") || msg.includes("fit")) {
            reply = "Our garments are designed for a relaxed, premium fit. We recommend checking our detailed sizing chart on each product page before ordering.";
        } else if (msg.includes("sale") || msg.includes("discount")) {
            reply = "Yes! We currently have a massive FLAT 50% OFF Sale on all exclusive premium wear. Check the 'Sale' section in the top menu!";
        } else if (msg.includes("contact") || msg.includes("support") || msg.includes("help")) {
            reply = "You can reach our Tirupur wholesale support team via email at support@store.com or call us at 1800-123-4567 during business hours.";
        } else if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
            reply = "Hello there! Welcome to our store. Are you looking for anything specific today?";
        } else if (msg.includes("tirupur") || msg.includes("wholesale")) {
            reply = "Yes! We are a premium Tirupur wholesale company providing the highest quality cotton garments directly from the manufacturers.";
        } else if (msg.length > 3) {
            reply = "That's a great question! While I'm just an automated assistant, you can browse our collections to find what you're looking for, or contact support if you need more help.";
        }

        // Simulate a slight delay to feel like "AI typing"
        setTimeout(() => {
            res.json({ reply });
        }, 800);

    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ error: "Failed to process chat message" });
    }
});

module.exports = router;
