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
    },
    // AI-Generated Assets
    modelUrl: {
        type: String,
        default: null
    },
    generatedImages: [{
        type: String
    }],
    aiTier: {
        type: String,
        enum: ['draft', 'standard', 'pro', null],
        default: null
    },
    // ============================================
    // DIGITAL TWIN FIELDS
    // ============================================
    // Product identification for Digital Twin matching
    productInfo: {
        brand: { type: String, trim: true },
        model: { type: String, trim: true },
        variant: { type: String, trim: true },
        subcategory: { type: String, trim: true }
    },
    // Unique identifier (IMEI, VIN, Serial, etc.)
    uniqueId: {
        value: { type: String, trim: true },          // Cleaned/validated value
        type: { type: String, enum: ['imei', 'vin', 'serial', 'isbn', 'sku', 'mac', 'none'] },
        masked: { type: String },                      // Masked for display (***054291)
        verified: { type: Boolean, default: false }
    },
    // Reference to Digital Twin (if created)
    digitalTwin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DigitalTwin',
        default: null
    },
    // AI condition analysis
    conditionAnalysis: {
        score: { type: Number, min: 0, max: 10 },
        wear: { type: String, enum: ['none', 'minimal', 'moderate', 'heavy'] },
        blemishes: [{
            type: { type: String },
            location: { type: String },
            severity: { type: String, enum: ['minor', 'moderate', 'major'] }
        }],
        analyzedAt: Date
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
