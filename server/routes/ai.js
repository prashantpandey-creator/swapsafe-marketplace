import express from 'express';
import Listing from '../models/Listing.js';
import { protect } from '../middleware/auth.js';
import { generateText, analyzeImages, parseJSON, getAvailableProviders, checkOllama } from '../services/ai.js';

const router = express.Router();

// @route   GET /api/ai/status
// @desc    Check AI providers status
// @access  Public
router.get('/status', async (req, res) => {
    const providers = getAvailableProviders();
    const ollama = await checkOllama();

    res.json({
        success: true,
        providers: {
            ...providers,
            ollama: ollama.running
        },
        ollamaModels: ollama.models,
        activeProvider: process.env.AI_PROVIDER || 'groq',
        visionProvider: process.env.VISION_PROVIDER || 'gemini'
    });
});

// @route   POST /api/ai/estimate-price
// @desc    Get AI-estimated price for an item
// @access  Public
router.post('/estimate-price', async (req, res) => {
    try {
        const { title, description, category, condition, provider } = req.body;

        if (!title || !category || !condition) {
            return res.status(400).json({ error: 'Title, category, and condition are required' });
        }

        const prompt = `You are a price estimation expert for a used items marketplace in India.

Item Details:
- Title: ${title}
- Description: ${description || 'Not provided'}
- Category: ${category}
- Condition: ${condition}

Provide a JSON response with:
{
  "estimatedPrice": <fair resale price in INR>,
  "confidence": <0-100>,
  "reasoning": "<brief 1-2 sentence explanation>",
  "retailPrice": <estimated new retail price in INR>,
  "priceRangeLow": <lower bound>,
  "priceRangeHigh": <upper bound>
}

Consider:
- Indian market prices (use INR ₹)
- Condition multipliers: new=100%, like-new=85%, good=70%, fair=50%, poor=30%
- Popular brands retain value better
- Electronics depreciate faster

Respond ONLY with valid JSON.`;

        try {
            const result = await generateText(prompt, { provider });
            const estimate = parseJSON(result.text);

            res.json({
                success: true,
                estimate: {
                    value: estimate.estimatedPrice,
                    confidence: estimate.confidence,
                    reasoning: estimate.reasoning,
                    retailPrice: estimate.retailPrice,
                    priceRange: {
                        low: estimate.priceRangeLow,
                        high: estimate.priceRangeHigh
                    }
                },
                source: result.provider,
                model: result.model
            });
        } catch (aiError) {
            console.error('AI estimation failed:', aiError.message);

            // Fallback to algorithm
            const fallback = getFallbackPriceEstimate(title, category, condition);
            res.json({
                success: true,
                estimate: fallback,
                source: 'algorithm',
                note: 'AI unavailable, using algorithmic estimate'
            });
        }
    } catch (error) {
        console.error('Price estimation error:', error);
        res.status(500).json({ error: 'Price estimation failed' });
    }
});

// @route   POST /api/ai/verify-item
// @desc    Verify received item matches listing using vision AI
// @access  Private
router.post('/verify-item', protect, async (req, res) => {
    try {
        const { listingId, listingImages, receivedImages, provider } = req.body;

        if (!listingImages?.length || !receivedImages?.length) {
            return res.status(400).json({ error: 'Both listing and received item images are required' });
        }

        const prompt = `You are an item verification expert for a marketplace. Compare the LISTING images (what was advertised) with the RECEIVED images (what the buyer got).

Analyze:
1. Is this the same product/item?
2. Is the condition as described?
3. Any visible differences or damage not shown in listing?

Provide JSON response:
{
  "match": <true if same item>,
  "confidence": <0-100>,
  "conditionMatch": <true if condition matches>,
  "differences": ["list any differences"],
  "recommendation": "accept" | "reject" | "request_more_info",
  "explanation": "<brief explanation>"
}

Respond ONLY with valid JSON.`;

        try {
            // Combine images for analysis
            const allImages = [...listingImages.slice(0, 2), ...receivedImages.slice(0, 2)];

            const result = await analyzeImages(allImages, prompt, {
                provider: provider || process.env.VISION_PROVIDER
            });

            const verification = parseJSON(result.text);

            // Update listing if ID provided
            if (listingId) {
                await Listing.findByIdAndUpdate(listingId, {
                    'verification.status': verification.match ? 'verified' : 'failed',
                    'verification.receivedImages': receivedImages,
                    'verification.matchScore': verification.confidence,
                    'verification.differences': verification.differences || [],
                    'verification.verifiedAt': new Date()
                });
            }

            res.json({
                success: true,
                verification: {
                    match: verification.match,
                    confidence: verification.confidence,
                    conditionMatch: verification.conditionMatch,
                    differences: verification.differences || [],
                    recommendation: verification.recommendation,
                    explanation: verification.explanation,
                    status: verification.match ? 'verified' : 'mismatch_detected'
                },
                source: result.provider,
                model: result.model
            });
        } catch (aiError) {
            console.error('AI verification failed:', aiError.message);

            res.json({
                success: true,
                verification: {
                    match: null,
                    confidence: 0,
                    differences: [],
                    recommendation: 'manual_review',
                    explanation: 'AI verification unavailable. Please manually compare images.',
                    status: 'manual_review_required'
                },
                source: 'fallback'
            });
        }
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// @route   POST /api/ai/get-retail-price
// @desc    Get estimated retail price
// @access  Public
router.post('/get-retail-price', async (req, res) => {
    try {
        const { title, category, brand, provider } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const prompt = `What is the approximate NEW retail price for this product in India (INR)?

Product: ${title}
${brand ? `Brand: ${brand}` : ''}
${category ? `Category: ${category}` : ''}

Respond with JSON:
{
  "retailPrice": <price in INR>,
  "confidence": <0-100>,
  "source": "estimated market price",
  "productName": "<identified product>"
}

Respond ONLY with valid JSON.`;

        try {
            const result = await generateText(prompt, { provider });
            const priceData = parseJSON(result.text);

            res.json({
                success: true,
                retailPrice: {
                    value: priceData.retailPrice,
                    confidence: priceData.confidence,
                    source: priceData.source || 'AI Estimate',
                    productName: priceData.productName
                },
                provider: result.provider,
                model: result.model
            });
        } catch (aiError) {
            const fallback = getRetailPriceEstimate(title, category);
            res.json({
                success: true,
                retailPrice: fallback,
                source: 'algorithm'
            });
        }
    } catch (error) {
        console.error('Retail price error:', error);
        res.status(500).json({ error: 'Failed to get retail price' });
    }
});

// @route   POST /api/ai/chat
// @desc    General AI chat (for testing/playground)
// @access  Public
router.post('/chat', async (req, res) => {
    try {
        const { message, provider } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const result = await generateText(message, { provider });

        res.json({
            success: true,
            response: result.text,
            provider: result.provider,
            model: result.model
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
    }
});

// @route   POST /api/ai/generate-3d
// @desc    Proxy to Python AI Engine for 3D model generation (Multipart Support)
// @access  Private
router.post('/generate-3d', protect, async (req, res) => {
    console.log('🚀 AI Proxy: Received 3D generation request');

    const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000/api/v1/studio';

    try {
        // Option 1: Simple URL-based approach (existing behavior for backward compat)
        if (req.body.imageUrl) {
            console.log('📦 Single URL Mode');
            await new Promise(resolve => setTimeout(resolve, 3000));
            return res.json({
                success: true,
                modelUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
                preview: 'https://modelviewer.dev/shared-assets/models/Astronaut.png',
                status: 'completed'
            });
        }

        // Option 2: Proxy multipart form data to Python engine
        // This requires express-fileupload or multer middleware to be configured
        // For now, we forward the request body directly to Python

        console.log('📡 Attempting proxy to Python AI Engine...');

        // Since Node.js server doesn't have multer set up for this route,
        // the frontend should call Python directly at localhost:8000
        // This route provides a fallback/mock response

        // Simulate Python engine response for demo
        await new Promise(resolve => setTimeout(resolve, 3000));

        res.json({
            success: true,
            status: 'success',
            model_url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
            modelUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
            poly_count: 15000,
            texture_resolution: '2k',
            note: 'Demo mode - connect to Python engine for real 3D generation'
        });

    } catch (error) {
        console.error('💥 3D Generation error:', error);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: 'AI Engine is not running. Please start the Python service.',
                code: 'AI_ENGINE_OFFLINE'
            });
        }

        res.status(500).json({ error: 'Failed to generate 3D model' });
    }
});

// @route   POST /api/ai/remove-background
// @desc    Remove background from an image
// @access  Private
router.post('/remove-background', protect, async (req, res) => {
    try {
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is required' });
        }

        // Simulate Processing Time
        await new Promise(resolve => setTimeout(resolve, 2000));

        // In a real app, calls remove.bg or similar.
        // Here we return the original image but with a success flag
        // to allow the UI flow to complete.
        res.json({
            success: true,
            processedUrl: imageUrl, // Logic would return new URL here
            originalUrl: imageUrl,
            message: 'Background removal simulation successful'
        });

    } catch (error) {
        console.error('Background removal error:', error);
        res.status(500).json({ error: 'Failed to process image' });
    }
});

// ============ FALLBACK ALGORITHMS ============

function getFallbackPriceEstimate(title, category, condition) {
    const categoryBasePrices = {
        electronics: 15000,
        fashion: 2000,
        home: 5000,
        sports: 3000,
        vehicles: 50000,
        books: 500,
        toys: 1000,
        other: 2000
    };

    const conditionMultipliers = {
        'new': 1.0,
        'like-new': 0.85,
        'good': 0.70,
        'fair': 0.50,
        'poor': 0.30
    };

    const basePrice = categoryBasePrices[category] || 2000;
    const multiplier = conditionMultipliers[condition] || 0.70;
    const titleFactor = Math.min(title.length / 20, 2);

    const estimatedPrice = Math.round(basePrice * multiplier * titleFactor);
    const retailPrice = Math.round(basePrice * titleFactor * 1.5);

    return {
        value: estimatedPrice,
        confidence: 60,
        reasoning: 'Estimated based on category and condition.',
        retailPrice: retailPrice,
        priceRange: {
            low: Math.round(estimatedPrice * 0.8),
            high: Math.round(estimatedPrice * 1.2)
        }
    };
}

function getRetailPriceEstimate(title, category) {
    const categoryMultipliers = {
        electronics: 20000,
        fashion: 3000,
        home: 8000,
        sports: 5000,
        vehicles: 100000,
        books: 800,
        toys: 2000,
        other: 3000
    };

    const basePrice = categoryMultipliers[category] || 5000;
    const titleFactor = Math.min(title.length / 15, 2.5);

    return {
        value: Math.round(basePrice * titleFactor),
        confidence: 50,
        source: 'Algorithm Estimate'
    };
}

export default router;
