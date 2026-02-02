import mongoose from 'mongoose';

/**
 * ProductDatabase Schema
 * 
 * Reference database of known products for Digital Twin matching.
 * Stores brand, model, variants, and how to identify each product type.
 */
const productDatabaseSchema = new mongoose.Schema({
    // Product identification
    brand: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    model: {
        type: String,
        required: true,
        trim: true
    },

    // Variants (colors, storage, sizes)
    variants: [{
        name: String,      // e.g., "256GB Space Black"
        color: String,
        storage: String,
        size: String
    }],

    // Category info
    category: {
        type: String,
        required: true,
        enum: ['electronics', 'fashion', 'home', 'sports', 'vehicles', 'books', 'toys', 'other']
    },
    subcategory: {
        type: String,
        required: true
        // e.g., "phones", "laptops", "sneakers", "watches"
    },

    // Reference images for showcase generation
    referenceImages: {
        front: String,
        back: String,
        side: String,
        hero: String      // Main marketing image
    },

    // 3D model if available
    threeDModelUrl: String,

    // Unique ID configuration for this product type
    uniqueIdConfig: {
        type: {
            type: String,
            enum: ['imei', 'serial', 'vin', 'isbn', 'sku', 'mac', 'none'],
            default: 'serial'
        },
        format: String,           // Regex pattern for validation
        length: Number,
        instructions: String,     // How to find this ID
        example: String           // Example value
    },

    // Specifications
    specifications: {
        releaseYear: Number,
        msrp: Number,             // Original retail price in INR
        dimensions: {
            height: Number,
            width: Number,
            depth: Number,
            unit: { type: String, default: 'mm' }
        },
        weight: {
            value: Number,
            unit: { type: String, default: 'g' }
        }
    },

    // Depreciation curve for price estimation
    depreciation: {
        year1: { type: Number, default: 0.70 },   // Worth 70% after 1 year
        year2: { type: Number, default: 0.55 },
        year3: { type: Number, default: 0.40 },
        year4: { type: Number, default: 0.30 },
        year5Plus: { type: Number, default: 0.20 }
    },

    // For AI matching
    keywords: [String],           // Alternative names, common misspellings

    // Tracking
    listingsCount: {
        type: Number,
        default: 0
    },

    // AI-contributed flag
    aiGenerated: {
        type: Boolean,
        default: false
    },
    verified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index for fast lookups
productDatabaseSchema.index({ brand: 1, model: 1 }, { unique: true });
productDatabaseSchema.index({ category: 1, subcategory: 1 });
productDatabaseSchema.index({ keywords: 'text' });

// Static method to find product
productDatabaseSchema.statics.findProduct = async function (brand, model) {
    return this.findOne({
        brand: new RegExp(`^${brand}$`, 'i'),
        model: new RegExp(`^${model}$`, 'i')
    });
};

// Static method to get brands by category
productDatabaseSchema.statics.getBrandsByCategory = async function (category, subcategory) {
    const query = { category };
    if (subcategory) query.subcategory = subcategory;

    const brands = await this.distinct('brand', query);
    return brands.sort();
};

// Static method to get models by brand
productDatabaseSchema.statics.getModelsByBrand = async function (brand, category) {
    const query = { brand: new RegExp(`^${brand}$`, 'i') };
    if (category) query.category = category;

    const products = await this.find(query).select('model variants').lean();
    return products;
};

const ProductDatabase = mongoose.model('ProductDatabase', productDatabaseSchema);

export default ProductDatabase;
