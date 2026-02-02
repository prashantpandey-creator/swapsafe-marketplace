/**
 * Products API Routes
 * 
 * Endpoints for product database lookup, brand/model matching,
 * and unique ID validation for Digital Twin system.
 */

import express from 'express';
import ProductDatabase from '../models/ProductDatabase.js';
import { validateUniqueId } from '../utils/idValidators.js';

const router = express.Router();

/**
 * GET /api/products/categories
 * Get all available categories and subcategories
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = await ProductDatabase.aggregate([
            {
                $group: {
                    _id: { category: '$category', subcategory: '$subcategory' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.category': 1, '_id.subcategory': 1 } }
        ]);

        // Group by main category
        const grouped = {};
        categories.forEach(c => {
            if (!grouped[c._id.category]) {
                grouped[c._id.category] = [];
            }
            grouped[c._id.category].push({
                subcategory: c._id.subcategory,
                count: c.count
            });
        });

        res.json(grouped);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/products/brands?category=electronics&subcategory=phones
 * Get all brands for a given category/subcategory
 */
router.get('/brands', async (req, res) => {
    try {
        const { category, subcategory } = req.query;

        const query = {};
        if (category) query.category = category;
        if (subcategory) query.subcategory = subcategory;

        const brands = await ProductDatabase.distinct('brand', query);
        res.json(brands.sort());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/products/models?brand=Apple&category=electronics
 * Get all models for a given brand
 */
router.get('/models', async (req, res) => {
    try {
        const { brand, category, subcategory } = req.query;

        if (!brand) {
            return res.status(400).json({ error: 'Brand is required' });
        }

        const query = { brand: new RegExp(`^${brand}$`, 'i') };
        if (category) query.category = category;
        if (subcategory) query.subcategory = subcategory;

        const products = await ProductDatabase.find(query)
            .select('model variants specifications.msrp uniqueIdConfig')
            .lean();

        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/products/lookup?brand=Apple&model=iPhone 15 Pro
 * Get full product details for a specific brand/model
 */
router.get('/lookup', async (req, res) => {
    try {
        const { brand, model } = req.query;

        if (!brand || !model) {
            return res.status(400).json({ error: 'Brand and model are required' });
        }

        const product = await ProductDatabase.findOne({
            brand: new RegExp(`^${brand}$`, 'i'),
            model: new RegExp(`^${model}$`, 'i')
        }).lean();

        if (!product) {
            return res.status(404).json({
                error: 'Product not found',
                suggestion: 'You can still list this product with manual entry'
            });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/products/validate-id
 * Validate a unique identifier (IMEI, VIN, Serial, etc.)
 * Body: { value: "359802110054291", type: "imei" }
 */
router.post('/validate-id', async (req, res) => {
    try {
        const { value, type } = req.body;

        if (!value) {
            return res.status(400).json({ error: 'ID value is required' });
        }

        const result = validateUniqueId(value, type || 'serial');
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/products/check-duplicate
 * Check if a unique ID is already registered
 * Body: { value: "359802110054291", type: "imei" }
 */
router.post('/check-duplicate', async (req, res) => {
    try {
        const { value, type } = req.body;

        if (!value) {
            return res.status(400).json({ error: 'ID value is required' });
        }

        // First validate the ID
        const validation = validateUniqueId(value, type || 'serial');
        if (!validation.valid) {
            return res.json({
                valid: false,
                duplicate: false,
                error: validation.error
            });
        }

        // Import Listing model dynamically to avoid circular deps
        const Listing = (await import('../models/Listing.js')).default;

        // Check for existing listing with this ID
        const existing = await Listing.findOne({
            'productInfo.uniqueId.value': validation.cleaned,
            status: { $in: ['active', 'pending'] }
        }).select('_id title status').lean();

        res.json({
            valid: true,
            duplicate: !!existing,
            existing: existing ? {
                listingId: existing._id,
                title: existing.title,
                status: existing.status
            } : null,
            masked: validation.masked
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/products/search?q=iphone
 * Search products by keyword
 */
router.get('/search', async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({ error: 'Query must be at least 2 characters' });
        }

        const products = await ProductDatabase.find({
            $or: [
                { brand: new RegExp(q, 'i') },
                { model: new RegExp(q, 'i') },
                { keywords: new RegExp(q, 'i') }
            ]
        })
            .select('brand model category subcategory specifications.msrp')
            .limit(parseInt(limit))
            .lean();

        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/products/contribute
 * Add a new product to the database (AI-generated)
 * This allows the database to grow as users list new products
 */
router.post('/contribute', async (req, res) => {
    try {
        const { brand, model, category, subcategory, uniqueIdType } = req.body;

        if (!brand || !model || !category) {
            return res.status(400).json({ error: 'Brand, model, and category are required' });
        }

        // Check if product already exists
        const existing = await ProductDatabase.findOne({
            brand: new RegExp(`^${brand}$`, 'i'),
            model: new RegExp(`^${model}$`, 'i')
        });

        if (existing) {
            // Increment listings count
            existing.listingsCount += 1;
            await existing.save();
            return res.json({
                message: 'Product already exists',
                product: existing,
                new: false
            });
        }

        // Create new product entry
        const newProduct = new ProductDatabase({
            brand,
            model,
            category,
            subcategory: subcategory || 'other',
            variants: [],
            uniqueIdConfig: {
                type: uniqueIdType || 'serial',
                instructions: 'Check the product label or packaging'
            },
            aiGenerated: true,
            verified: false,
            listingsCount: 1
        });

        await newProduct.save();
        res.json({
            message: 'Product added to database',
            product: newProduct,
            new: true
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
