require('dotenv').config();
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    images: [{ type: String }],
    sizes: [{
        size: { type: String },
        stock: { type: Number, default: 0 }
    }],
    createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const addTryOnModels = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const products = [
            {
                name: "Midnight Onyx AR Try-On Model",
                description: "Experience the luxurious fit of the Midnight Onyx via Maison AR.",
                price: 1850,
                category: "Elite T-Shirts",
                images: ["/uploads/tryon_black.png"],
                sizes: [
                    { size: "S", stock: 10 },
                    { size: "M", stock: 15 },
                    { size: "L", stock: 20 },
                    { size: "XL", stock: 5 }
                ]
            },
            {
                name: "The Golden Crest AR Try-On Model",
                description: "The classic white crest edition, designed for seamless AR integration.",
                price: 2100,
                category: "Elite T-Shirts",
                images: ["/uploads/tryon_white.png"],
                sizes: [
                    { size: "S", stock: 10 },
                    { size: "M", stock: 10 },
                    { size: "L", stock: 10 }
                ]
            }
        ];

        for (const p of products) {
            // Check if already exists so we don't spam
            const exists = await Product.findOne({ name: p.name });
            if (!exists) {
                await Product.create(p);
                console.log(`Added: ${p.name}`);
            } else {
                console.log(`Already exists: ${p.name}`);
            }
        }

        console.log("AR models seeded successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding models:", error);
        process.exit(1);
    }
};

addTryOnModels();
