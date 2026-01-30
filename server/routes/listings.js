import express from 'express';
import Listing from '../models/Listing.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/listings
// @desc    Get all listings with filters
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
    try {
        const {
            category,
            condition,
            minPrice,
            maxPrice,
            search,
            sort,
            page = 1,
            limit = 12
        } = req.query;

        // Build query
        const query = { status: 'active' };

        if (category && category !== 'all') {
            query.category = category;
        }

        if (condition) {
            query.condition = condition;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        if (search) {
            query.$text = { $search: search };
        }

        // Build sort
        let sortOption = { createdAt: -1 }; // Default: newest first

        if (sort === 'price-low') sortOption = { price: 1 };
        else if (sort === 'price-high') sortOption = { price: -1 };
        else if (sort === 'oldest') sortOption = { createdAt: 1 };

        // Execute query
        const skip = (Number(page) - 1) * Number(limit);

        const [listings, total] = await Promise.all([
            Listing.find(query)
                .populate('seller', 'name avatar rating isVerified')
                .sort(sortOption)
                .skip(skip)
                .limit(Number(limit)),
            Listing.countDocuments(query)
        ]);

        res.json({
            success: true,
            listings,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Get listings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/listings/:id
// @desc    Get single listing
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id)
            .populate('seller', 'name avatar rating isVerified totalSales createdAt location');

        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Increment views
        listing.views += 1;
        await listing.save();

        res.json({
            success: true,
            listing
        });
    } catch (error) {
        console.error('Get listing error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/listings
// @desc    Create new listing
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            condition,
            price,
            originalPrice,
            images,
            location,
            deliveryOptions,
            estimatedPrice,
            retailPrice
        } = req.body;

        // Validate required fields
        if (!title || !description || !category || !condition || !price || !location) {
            return res.status(400).json({ error: 'Please provide all required fields' });
        }

        const listing = await Listing.create({
            seller: req.user._id,
            title,
            description,
            category,
            condition,
            price,
            originalPrice: originalPrice || 0,
            images: images || [],
            location,
            deliveryOptions: deliveryOptions || { meetup: true, shipping: false },
            estimatedPrice: estimatedPrice || { value: 0, confidence: 0, reasoning: '' },
            retailPrice: retailPrice || { value: 0, source: '' }
        });

        // Populate seller info
        await listing.populate('seller', 'name avatar rating isVerified');

        res.status(201).json({
            success: true,
            listing
        });
    } catch (error) {
        console.error('Create listing error:', error);
        res.status(500).json({ error: 'Server error creating listing' });
    }
});

// @route   PUT /api/listings/:id
// @desc    Update listing
// @access  Private (owner only)
router.put('/:id', protect, async (req, res) => {
    try {
        let listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Check ownership
        if (listing.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to update this listing' });
        }

        // Update fields
        const allowedUpdates = [
            'title', 'description', 'category', 'condition',
            'price', 'originalPrice', 'images', 'location',
            'deliveryOptions', 'status'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                listing[field] = req.body[field];
            }
        });

        await listing.save();
        await listing.populate('seller', 'name avatar rating isVerified');

        res.json({
            success: true,
            listing
        });
    } catch (error) {
        console.error('Update listing error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE /api/listings/:id
// @desc    Delete listing
// @access  Private (owner only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Check ownership
        if (listing.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this listing' });
        }

        await listing.deleteOne();

        res.json({
            success: true,
            message: 'Listing deleted'
        });
    } catch (error) {
        console.error('Delete listing error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/listings/user/:userId
// @desc    Get listings by user
// @access  Public
router.get('/user/:userId', async (req, res) => {
    try {
        const listings = await Listing.find({
            seller: req.params.userId,
            status: 'active'
        })
            .populate('seller', 'name avatar rating isVerified')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            listings
        });
    } catch (error) {
        console.error('Get user listings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/listings/my/all
// @desc    Get current user's listings (all statuses)
// @access  Private
router.get('/my/all', protect, async (req, res) => {
    try {
        const listings = await Listing.find({ seller: req.user._id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            listings
        });
    } catch (error) {
        console.error('Get my listings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
