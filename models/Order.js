const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        size: { type: String }
    }],
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'Pending', enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] },
    paymentStatus: { type: String, default: 'Unpaid', enum: ['Unpaid', 'Paid', 'Failed'] },
    returnStatus: { type: String, default: 'Not Returned', enum: ['Not Returned', 'Return Requested', 'Returned'] },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
