import express from 'express';
import Groq from 'groq-sdk';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Initialize Groq for AI-powered price estimation
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Price database - common items with typical retail prices (expandable)
const PRICE_DATABASE = {
    // Electronics
    'iphone 15': { retail: 79900, category: 'electronics' },
    'iphone 14': { retail: 69900, category: 'electronics' },
    'iphone 13': { retail: 59900, category: 'electronics' },
    'iphone 12': { retail: 49900, category: 'electronics' },
    'samsung galaxy s24': { retail: 79999, category: 'electronics' },
    'samsung galaxy s23': { retail: 69999, category: 'electronics' },
    'oneplus 12': { retail: 64999, category: 'electronics' },
    'macbook air m2': { retail: 114900, category: 'electronics' },
    'macbook pro m3': { retail: 169900, category: 'electronics' },
    'ipad pro': { retail: 81900, category: 'electronics' },
    'ipad air': { retail: 59900, category: 'electronics' },
    'airpods pro': { retail: 24900, category: 'electronics' },
    'airpods': { retail: 14900, category: 'electronics' },
    'sony wh-1000xm5': { retail: 29990, category: 'electronics' },
    'sony wh-1000xm4': { retail: 24990, category: 'electronics' },
    'apple watch': { retail: 41900, category: 'electronics' },
    'ps5': { retail: 54990, category: 'electronics' },
    'xbox series x': { retail: 52990, category: 'electronics' },
    'nintendo switch': { retail: 29999, category: 'electronics' },
    'gopro': { retail: 44990, category: 'electronics' },
    'jbl speaker': { retail: 9999, category: 'electronics' },
    'boat earbuds': { retail: 1999, category: 'electronics' },

    // Fashion
    'nike shoes': { retail: 8999, category: 'fashion' },
    'adidas shoes': { retail: 7999, category: 'fashion' },
    'puma shoes': { retail: 6999, category: 'fashion' },
    'levis jeans': { retail: 3999, category: 'fashion' },
    'zara shirt': { retail: 2499, category: 'fashion' },
    'h&m dress': { retail: 1999, category: 'fashion' },
    'nike jacket': { retail: 5999, category: 'fashion' },
    'adidas tracksuit': { retail: 6999, category: 'fashion' },

    // Home
    'ikea chair': { retail: 4999, category: 'home' },
    'ikea desk': { retail: 8999, category: 'home' },
    'philips mixer': { retail: 3999, category: 'home' },
    'prestige cooker': { retail: 2499, category: 'home' },
    'dyson vacuum': { retail: 35000, category: 'home' },

    // Sports
    'yonex badminton': { retail: 2999, category: 'sports' },
    'nike football': { retail: 1499, category: 'sports' },
    'decathlon cycle': { retail: 12999, category: 'sports' },
    'yoga mat': { retail: 999, category: 'sports' },
    'dumbbells': { retail: 2999, category: 'sports' }
};

// Category-based pricing (fallback)
const CATEGORY_AVERAGES = {
    'electronics': { min: 2000, avg: 25000, max: 150000 },
    'fashion': { min: 500, avg: 3000, max: 20000 },
    'home': { min: 500, avg: 5000, max: 50000 },
    'sports': { min: 300, avg: 3000, max: 30000 },
    'books': { min: 100, avg: 500, max: 2000 },
    'other': { min: 200, avg: 2000, max: 20000 }
};

// Condition multipliers
const CONDITION_MULTIPLIERS = {
    'new': 0.90,       // 90% of retail
    'like-new': 0.75,  // 75% of retail
    'good': 0.55,      // 55% of retail
    'fair': 0.35       // 35% of retail
};

/**
 * LIVE WEB SEARCH + LLM PRICE EXTRACTION
 * Completely free approach using DuckDuckGo + Groq
 */
async function searchWebForPrice(query) {
    try {
        // Step 1: Search DuckDuckGo (free, no API key needed)
        const searchQuery = encodeURIComponent(`${query} price india rupees buy`);
        const searchUrl = `https://html.duckduckgo.com/html/?q=${searchQuery}`;

        console.log(`🌐 Searching web for: "${query}"`);

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error('Search failed');
        }

        const html = await response.text();

        // Step 2: Extract search result snippets (simple regex parsing)
        const snippets = extractSearchSnippets(html);

        if (snippets.length === 0) {
            console.log('❌ No search results found');
            return null;
        }

        console.log(`📄 Found ${snippets.length} search snippets`);

        // Step 3: Use Groq LLM to extract price from snippets
        if (groq) {
            const priceResult = await extractPriceWithLLM(query, snippets);
            if (priceResult) {
                return priceResult;
            }
        }

        // Step 4: Fallback - try regex price extraction
        const regexPrice = extractPriceWithRegex(snippets.join(' '));
        if (regexPrice) {
            return {
                retail: regexPrice,
                source: 'web_search_regex',
                confidence: 50
            };
        }

        return null;
    } catch (error) {
        console.error('Web search error:', error.message);
        return null;
    }
}

/**
 * Extract snippets from DuckDuckGo HTML
 */
function extractSearchSnippets(html) {
    const snippets = [];

    // Extract result snippets (between result-snippet class)
    const snippetMatches = html.match(/class="result__snippet"[^>]*>([^<]+)</g) || [];
    for (const match of snippetMatches.slice(0, 5)) {
        const text = match.replace(/class="result__snippet"[^>]*>/, '').replace(/<$/, '');
        if (text.length > 20) {
            snippets.push(text);
        }
    }

    // Also extract titles
    const titleMatches = html.match(/class="result__a"[^>]*>([^<]+)</g) || [];
    for (const match of titleMatches.slice(0, 5)) {
        const text = match.replace(/class="result__a"[^>]*>/, '').replace(/<$/, '');
        snippets.push(text);
    }

    // Extract any text with price patterns
    const pricePatterns = html.match(/(?:₹|Rs\.?|INR)\s*[\d,]+(?:\.\d{2})?/gi) || [];
    snippets.push(...pricePatterns.slice(0, 10));

    return snippets;
}

/**
 * Use Groq LLM to intelligently extract price from search snippets
 */
async function extractPriceWithLLM(productName, snippets) {
    try {
        const prompt = `You are a price extraction expert. I searched for "${productName}" and got these search results:

${snippets.map((s, i) => `${i + 1}. ${s}`).join('\n')}

From these search results, extract the most likely RETAIL price in Indian Rupees.
Look for prices mentioned with ₹, Rs, or INR symbols.
If multiple prices are found, choose the one that seems like a typical retail/MRP price (not discounted).

Respond ONLY with JSON, no other text:
{
    "price": <number in rupees, no commas>,
    "confidence": <1-100 how confident you are>,
    "source_hint": "<which snippet had the price>",
    "is_discounted": <true/false if this looks like a sale price>
}

If you cannot find any price, respond with: {"price": 0, "confidence": 0}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1,
            max_tokens: 150
        });

        const responseText = completion.choices[0]?.message?.content || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.price && parsed.price > 0) {
                console.log(`✅ LLM extracted price: ₹${parsed.price} (${parsed.confidence}% confidence)`);
                return {
                    retail: parsed.price,
                    source: 'web_search_llm',
                    confidence: parsed.confidence || 70,
                    isDiscounted: parsed.is_discounted || false
                };
            }
        }

        return null;
    } catch (error) {
        console.error('LLM extraction error:', error.message);
        return null;
    }
}

/**
 * Fallback: Extract price using regex patterns
 */
function extractPriceWithRegex(text) {
    // Match common Indian price patterns
    const patterns = [
        /₹\s*([\d,]+(?:\.\d{2})?)/gi,
        /Rs\.?\s*([\d,]+(?:\.\d{2})?)/gi,
        /INR\s*([\d,]+(?:\.\d{2})?)/gi,
        /Price[:\s]*([\d,]+)/gi
    ];

    const prices = [];
    for (const pattern of patterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const price = parseInt(match[1].replace(/,/g, ''));
            if (price > 100 && price < 10000000) { // Reasonable price range
                prices.push(price);
            }
        }
    }

    if (prices.length > 0) {
        // Return the median price to avoid outliers
        prices.sort((a, b) => a - b);
        return prices[Math.floor(prices.length / 2)];
    }

    return null;
}

/**
 * @route   GET /api/price/lookup
 * @desc    AI-powered price lookup with LIVE WEB SEARCH!
 * @access  Private
 * 
 * Priority: DB → User Input → Web Search → AI Estimate → Category Fallback
 */
router.get('/lookup', protect, async (req, res) => {
    const { q, category, condition, originalPrice } = req.query;

    if (!q) {
        return res.status(400).json({
            success: false,
            error: 'Query parameter "q" is required'
        });
    }

    console.log(`🔍 Price lookup: "${q}" (category: ${category || 'any'})`);

    try {
        // Step 1: Check local database first (instant, free)
        const dbResult = lookupInDatabase(q);
        if (dbResult) {
            console.log('✅ Found in local database');
            return res.json(formatPriceResponse(dbResult, category, condition, 'database', 90));
        }

        // Step 2: If user provided original price, use that as reference
        if (originalPrice && parseFloat(originalPrice) > 0) {
            console.log('✅ Using user-provided original price');
            const userPriceResult = {
                retail: parseFloat(originalPrice),
                category: category || 'other'
            };
            return res.json(formatPriceResponse(userPriceResult, category, condition, 'user_input', 95));
        }

        // Step 3: 🆕 LIVE WEB SEARCH with LLM extraction (FREE!)
        console.log('🌐 Trying live web search...');
        const webResult = await searchWebForPrice(q);
        if (webResult && webResult.retail > 0) {
            console.log(`✅ Web search found price: ₹${webResult.retail}`);
            return res.json(formatPriceResponse(
                { retail: webResult.retail, category: category || 'other' },
                category,
                condition,
                webResult.source || 'web_search',
                webResult.confidence || 75
            ));
        }

        // Step 4: Use AI estimation (Groq - free tier is generous)
        if (groq) {
            console.log('🤖 Trying AI estimation...');
            const aiResult = await estimateWithAI(q, category);
            if (aiResult.success) {
                return res.json(aiResult);
            }
        }

        // Step 5: Fallback to category-based estimation
        console.log('📊 Using category fallback');
        return res.json(getCategoryEstimate(q, category, condition));

    } catch (error) {
        console.error('Price lookup error:', error);
        return res.json(getCategoryEstimate(q, category, condition));
    }
});

/**
 * Look up price in local database
 */
function lookupInDatabase(query) {
    const normalizedQuery = query.toLowerCase().trim();

    // Exact match
    if (PRICE_DATABASE[normalizedQuery]) {
        return PRICE_DATABASE[normalizedQuery];
    }

    // Partial match - find best matching key
    for (const [key, value] of Object.entries(PRICE_DATABASE)) {
        if (normalizedQuery.includes(key) || key.includes(normalizedQuery.split(' ')[0])) {
            return value;
        }
    }

    return null;
}

/**
 * AI-powered price estimation using Groq (free tier: 30 RPM, 14,400 RPD)
 */
async function estimateWithAI(query, category) {
    try {
        const prompt = `You are a price estimation expert for the Indian second-hand marketplace.

Product: "${query}"
Category: ${category || 'unknown'}

Estimate the typical RETAIL price (MRP) in Indian Rupees (₹) for this product.

Respond ONLY with a JSON object, no other text:
{
    "retailPrice": <number>,
    "confidence": <1-100>,
    "brand": "<detected brand or null>",
    "model": "<detected model or null>",
    "reasoning": "<brief explanation>"
}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',  // Fast, free
            temperature: 0.3,
            max_tokens: 200
        });

        const responseText = completion.choices[0]?.message?.content || '';

        // Parse JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const retailPrice = parsed.retailPrice || 5000;
            const confidence = parsed.confidence || 60;

            return formatPriceResponse(
                { retail: retailPrice, category: category || 'other' },
                category,
                null,
                'ai_estimate',
                confidence,
                parsed.brand,
                parsed.model
            );
        }

        return { success: false };
    } catch (error) {
        console.error('AI estimation error:', error);
        return { success: false };
    }
}

/**
 * Format price response with suggested selling prices
 */
function formatPriceResponse(data, category, condition, source, confidence, brand = null, model = null) {
    const retailPrice = data.retail;
    const conditionMultiplier = CONDITION_MULTIPLIERS[condition] || 0.60;
    const suggestedPrice = Math.round(retailPrice * conditionMultiplier);

    return {
        success: true,
        source: source,
        data: {
            retailPrice: retailPrice,
            lowestPrice: Math.round(retailPrice * 0.4),
            highestPrice: Math.round(retailPrice * 0.85),
            averagePrice: Math.round(retailPrice * 0.6),
            suggestedRange: {
                min: Math.round(retailPrice * 0.35),
                max: Math.round(retailPrice * 0.80)
            },
            suggestedPrice: suggestedPrice,
            confidence: confidence,
            brand: brand,
            model: model,
            note: source === 'database'
                ? 'Price from verified database'
                : source === 'user_input'
                    ? 'Based on your provided retail price'
                    : source === 'ai_estimate'
                        ? 'AI estimated - verify if needed'
                        : 'Category-based estimate'
        }
    };
}

/**
 * Category-based fallback estimation
 */
function getCategoryEstimate(query, category, condition) {
    const catData = CATEGORY_AVERAGES[category] || CATEGORY_AVERAGES['other'];
    const retailPrice = catData.avg;

    return formatPriceResponse(
        { retail: retailPrice, category: category || 'other' },
        category,
        condition,
        'category_fallback',
        30
    );
}

/**
 * @route   POST /api/price/compare
 * @desc    Compare user's price with market price
 * @access  Private
 */
router.post('/compare', protect, async (req, res) => {
    const { userPrice, retailPrice, condition } = req.body;

    if (!userPrice || !retailPrice) {
        return res.status(400).json({
            success: false,
            error: 'userPrice and retailPrice are required'
        });
    }

    const multiplier = CONDITION_MULTIPLIERS[condition] || 0.60;
    const fairPrice = Math.round(retailPrice * multiplier);
    const savings = retailPrice - userPrice;
    const savingsPercent = Math.round((savings / retailPrice) * 100);

    // Determine pricing verdict
    let verdict, verdictColor;
    if (userPrice <= fairPrice * 0.8) {
        verdict = '🔥 Great deal! Will sell fast';
        verdictColor = 'green';
    } else if (userPrice <= fairPrice) {
        verdict = '✓ Fair price for quick sale';
        verdictColor = 'green';
    } else if (userPrice <= fairPrice * 1.2) {
        verdict = '⚠️ Slightly above market - may take longer';
        verdictColor = 'yellow';
    } else {
        verdict = '📉 Above market value - consider lowering';
        verdictColor = 'red';
    }

    return res.json({
        success: true,
        comparison: {
            userPrice,
            retailPrice,
            fairPrice,
            savings: Math.max(0, savings),
            savingsPercent: Math.max(0, savingsPercent),
            verdict,
            verdictColor,
            buyerMessage: savingsPercent > 0
                ? `Buyers save ${savingsPercent}% (₹${savings.toLocaleString()})!`
                : 'Priced at retail value'
        }
    });
});

/**
 * @route   POST /api/price/add-to-db
 * @desc    Add a new item to price database (for learning)
 * @access  Private
 */
router.post('/add-to-db', protect, async (req, res) => {
    const { productName, retailPrice, category } = req.body;

    if (!productName || !retailPrice) {
        return res.status(400).json({
            success: false,
            error: 'productName and retailPrice are required'
        });
    }

    // Add to database (in-memory for now, could persist to MongoDB)
    const key = productName.toLowerCase().trim();
    PRICE_DATABASE[key] = {
        retail: parseFloat(retailPrice),
        category: category || 'other',
        addedAt: new Date()
    };

    console.log(`📝 Added to price DB: ${key} = ₹${retailPrice}`);

    return res.json({ success: true, message: 'Added to price database' });
});

export default router;
