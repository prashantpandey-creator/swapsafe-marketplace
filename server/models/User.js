import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false // Don't include password in queries by default
    },
    avatar: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    location: {
        city: { type: String, default: '' },
        state: { type: String, default: '' }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0
    },
    totalSales: {
        type: Number,
        default: 0
    },
    totalPurchases: {
        type: Number,
        default: 0
    },
    // Legion Shield Trust System
    trustScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    trustLevel: {
        type: String,
        enum: ['Unverified', 'New', 'Rising', 'Trusted', 'Legendary'],
        default: 'Unverified'
    },
    // Verification details
    verification: {
        method: { type: String, default: '' }, // 'aadhaar', 'digilocker', etc.
        verifiedAt: { type: Date },
        documentId: { type: String, default: '' } // Masked ID for display
    },
    // Fraud flags
    flags: [{
        type: { type: String },
        reason: { type: String },
        createdAt: { type: Date, default: Date.now }
    }],
    isBanned: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate avatar URL based on name
userSchema.methods.getAvatar = function () {
    if (this.avatar) return this.avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=6366f1&color=fff`;
};

const User = mongoose.model('User', userSchema);

export default User;
