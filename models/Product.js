const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number }, // Optional field for sale logic
    materials: { type: String, required: true },
    segment: {
        type: String,
        enum: ['women', 'men', 'girls', 'boys'],
        required: true
    },
    category: {
        type: String,
        required: true
    },
    season: {
        type: String,
        enum: ['Spring', 'Summer', 'Autumn', 'Winter', 'All-Season'],
        default: 'All-Season'
    },
    isBundle: { type: Boolean, default: false },
    images: [{ type: String }], // Multiple product images
    sizes: [{
        size: { type: String, enum: ['S', 'M', 'L', 'XL', 'XXL'] },
        stock: { type: Number, default: 0 }
    }],
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        username: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        images: [{ type: String }], // Photos added by users in review
        createdAt: { type: Date, default: Date.now }
    }],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
