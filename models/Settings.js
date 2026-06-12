const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    marqueeText: { type: String, default: 'FREE SHIPPING ON ORDERS OVER ₹5000' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
