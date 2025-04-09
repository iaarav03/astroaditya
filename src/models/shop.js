const mongoose = require('mongoose');

const CATEGORIES = ['Bracelets', 'Gemstone', 'Rudraksha', 'Crystal', 'Kawach'];

const shopSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shopName: {
        type: String,
        required: true
    },
    itemName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discountedPrice: {
        type: Number,
        min: 0,
        validate: {
            validator: function (value) {
                return value <= this.price; 
            },
            message: "Discounted price cannot be greater than the original price"
        }
    },
    description: {
        type: String,
        // default: "" 
        required:true
    },
    category: {
        type: String,
        enum: CATEGORIES,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    image: {
        type: [String], // Array of image URLs
        default: () => [] 
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalRatings: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);
