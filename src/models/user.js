const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"]
    },
    password: {
        type: String,
        required: true,
        minlength: [6, "Password must be at least 6 characters long"]
    },
    balance: {
        type: Number,
        default: 0
    },
    role: {
        type: String,
        enum: ["user", "admin", "astrologer", "superadmin"],
        default: "user"
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        match: [/^\d{10}$/, "Please use a valid phone number"]
    },
    address: String,
    isVerified: {
        type: Boolean,
        default: false
    },
    experience: String,
    expertise: [String],
    languages: [String],
    price: {
        original: {
            type: Number,
            default: 0
        },
        discounted: {
            type: Number,
            default: 0
        }
    },
    rating: {
        type: Number,
        default: 0
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    availability: {
        online: {
            type: Boolean,
            default: false
        },
        startTime: {
            type: String,
            default: '09:00'
        },
        endTime: {
            type: String,
            default: '18:00'
        }
    },
    status: {
        chat: {
            type: Boolean,
            default: false
        },
        video: {
            type: Boolean,
            default: false
        }
    },
    profilePicture: String,
    isOnline: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Static method to find user  email
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email });
};

// Static method to create a new user
userSchema.statics.createUser = async function (userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return this.create({ ...userData, password: hashedPassword });
};

// Method to compare password
userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
