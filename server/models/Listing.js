import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: 2000
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['electronics', 'fashion', 'home', 'sports', 'vehicles', 'books', 'toys', 'other']
    },
    condition: {
        type: String,
        required: [true, 'Condition is required'],
        enum: ['new', 'like-new', 'good', 'fair', 'poor']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    originalPrice: {
        type: Number,
        default: 0
    },
    // AI-estimated prices
    estimatedPrice: {
        value: { type: Number, default: 0 },
        confidence: { type: Number, default: 0 },
        reasoning: { type: String, default: '' }
    },
    retailPrice: {
        value: { type: Number, default: 0 },
        source: { type: String, default: 'AI Estimate' }
    },
    images: [{
        type: String
    }],
    location: {
        city: { type: String, required: true },
        state: { type: String, required: true }
    },
    deliveryOptions: {
        meetup: { type: Boolean, default: true },
        shipping: { type: Boolean, default: false }
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'sold', 'inactive'],
        default: 'active'
    },
    views: {
        type: Number,
        default: 0
    },
    // Item verification
    verification: {
        status: {
            type: String,
            enum: ['pending', 'verified', 'failed', 'not_required'],
            default: 'not_required'
        },
        listingImages: [String],
        receivedImages: [String],
        matchScore: { type: Number, default: 0 },
        differences: [String],
        verifiedAt: Date
    }
}, {
    timestamps: true
});

// Index for search
listingSchema.index({ title: 'text', description: 'text' });
listingSchema.index({ category: 1, status: 1 });
listingSchema.index({ seller: 1 });

// Virtual for savings percentage
listingSchema.virtual('savingsPercent').get(function () {
    if (this.retailPrice?.value && this.price) {
        return Math.round((1 - this.price / this.retailPrice.value) * 100);
    }
    if (this.originalPrice && this.price) {
        return Math.round((1 - this.price / this.originalPrice) * 100);
    }
    return 0;
});

// Ensure virtuals are included in JSON
listingSchema.set('toJSON', { virtuals: true });
listingSchema.set('toObject', { virtuals: true });

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;
