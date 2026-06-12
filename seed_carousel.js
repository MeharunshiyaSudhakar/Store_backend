const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const carouselSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    backgroundImage: { type: String, required: true },
    link: { type: String, default: '/shop' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
}, { timestamps: true });

const CarouselItem = mongoose.models.CarouselItem || mongoose.model('CarouselItem', carouselSchema);

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://abyaz816_db_user:safari@cluster0website.onwevbu.mongodb.net/diamond_fashion?retryWrites=true&w=majority&appName=Cluster0website');
        
        await CarouselItem.deleteMany({});
        
        await CarouselItem.create([
            {
                title: 'Urban High Fashion',
                description: 'Explore the latest luxury streetwear for the modern city dweller. Premium quality, unmatched comfort.',
                backgroundImage: '/uploads/carousel_1.png',
                link: '/shop?category=men',
                order: 1
            },
            {
                title: 'Winter Elegance',
                description: 'Stay warm without compromising on style. Minimalist outerwear designed for the absolute best.',
                backgroundImage: '/uploads/carousel_2.png',
                link: '/shop?category=women',
                order: 2
            },
            {
                title: 'Summer Escapade',
                description: 'Lightweight, breathable fabrics tailored for the perfect sunlit beach aesthetics.',
                backgroundImage: '/uploads/carousel_3.png',
                link: '/shop?category=women',
                order: 3
            },
            {
                title: 'Neon Nights',
                description: 'Avant-garde fashion collections illuminated by vibrant city nights.',
                backgroundImage: '/uploads/carousel_4.png',
                link: '/shop?category=men',
                order: 4
            },
            {
                title: 'Modern Classic',
                description: 'Neutral tones and architectural silhouettes defining the modern luxury standards.',
                backgroundImage: '/uploads/carousel_5.png',
                link: '/shop?category=all',
                order: 5
            }
        ]);
        
        console.log("Carousel seeded successfully!");
        process.exit();
    } catch (error) {
        console.error("Error seeding carousel:", error);
        process.exit(1);
    }
};

seed();
