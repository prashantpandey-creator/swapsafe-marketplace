/**
 * Legion Shield™ - AI-Powered Fraud Detection & Trust System
 * 
 * Features:
 * - Trust Score calculation
 * - Listing fraud detection
 * - Chat/message analysis for phishing
 * - Price anomaly detection
 */

import { generateText, analyzeImages, parseJSON } from './ai.js';
import User from '../models/User.js';
import Listing from '../models/Listing.js';

// ============ TRUST SCORE CALCULATION ============

/**
 * Calculate a user's Legion Trust Score (0-100)
 */
export async function calculateTrustScore(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Get user's listings and transaction history
    const listings = await Listing.find({ seller: userId });
    const completedSales = listings.filter(l => l.status === 'sold').length;

    let score = 0;
    const breakdown = [];

    // 1. Identity Verification (+30)
    if (user.isVerified) {
        score += 30;
        breakdown.push({ factor: 'Verified Identity', points: 30, status: 'verified' });
    } else {
        breakdown.push({ factor: 'Verified Identity', points: 0, status: 'unverified', hint: 'Complete Aadhaar verification' });
    }

    // 2. Completed Trades (+25 max)
    const tradeScore = Math.min(25, (completedSales + (user.totalPurchases || 0)) * 2.5);
    score += tradeScore;
    breakdown.push({
        factor: 'Completed Trades',
        points: Math.round(tradeScore),
        details: `${completedSales} sales, ${user.totalPurchases || 0} purchases`
    });

    // 3. Community Rating (+20 max)
    const ratingScore = (user.rating || 0) * 4; // 5 stars = 20 points
    score += ratingScore;
    breakdown.push({
        factor: 'Community Rating',
        points: Math.round(ratingScore),
        details: `${user.rating || 0}/5 stars`
    });

    // 4. Account Age (+15 max)
    const accountAge = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24); // days
    const ageScore = Math.min(15, accountAge / 30 * 5); // 3 months = max
    score += ageScore;
    breakdown.push({
        factor: 'Account Age',
        points: Math.round(ageScore),
        details: `${Math.round(accountAge)} days`
    });

    // 5. Profile Completeness (+10 max)
    let profileScore = 0;
    if (user.avatar) profileScore += 2;
    if (user.phone) profileScore += 3;
    if (user.location?.city) profileScore += 2;
    if (user.location?.state) profileScore += 3;
    score += profileScore;
    breakdown.push({
        factor: 'Profile Completeness',
        points: profileScore
    });

    return {
        score: Math.round(Math.min(100, score)),
        breakdown,
        level: getTrustLevel(score),
        updatedAt: new Date()
    };
}

function getTrustLevel(score) {
    if (score >= 80) return { name: 'Legendary', color: '#fbbf24', icon: '🏆' };
    if (score >= 60) return { name: 'Trusted', color: '#22c55e', icon: '✅' };
    if (score >= 40) return { name: 'Rising', color: '#3b82f6', icon: '📈' };
    if (score >= 20) return { name: 'New', color: '#6b7280', icon: '👤' };
    return { name: 'Unverified', color: '#ef4444', icon: '⚠️' };
}

// ============ LISTING FRAUD DETECTION ============

/**
 * Analyze a listing for fraud signals
 */
export async function analyzeListing(listing, options = {}) {
    const flags = [];
    let riskScore = 0;

    // 1. Price Anomaly Detection
    const priceAnalysis = await analyzePriceAnomaly(listing);
    if (priceAnalysis.isAnomalous) {
        flags.push({
            type: 'price_anomaly',
            severity: priceAnalysis.severity,
            message: priceAnalysis.message
        });
        riskScore += priceAnalysis.riskPoints;
    }

    // 2. Image Analysis (if images provided)
    if (listing.images?.length > 0 && options.deepScan) {
        const imageAnalysis = await analyzeListingImages(listing.images, listing.title);
        if (imageAnalysis.flags.length > 0) {
            flags.push(...imageAnalysis.flags);
            riskScore += imageAnalysis.riskPoints;
        }
    }

    // 3. Description Analysis
    const descAnalysis = analyzeDescription(listing.description);
    if (descAnalysis.flags.length > 0) {
        flags.push(...descAnalysis.flags);
        riskScore += descAnalysis.riskPoints;
    }

    // 4. Seller History Check
    if (listing.seller) {
        const sellerRisk = await analyzeSellerHistory(listing.seller);
        if (sellerRisk.flags.length > 0) {
            flags.push(...sellerRisk.flags);
            riskScore += sellerRisk.riskPoints;
        }
    }

    return {
        isClean: flags.length === 0,
        riskScore: Math.min(100, riskScore),
        riskLevel: getRiskLevel(riskScore),
        flags,
        recommendation: getRecommendation(riskScore, flags),
        analyzedAt: new Date()
    };
}

async function analyzePriceAnomaly(listing) {
    // Use AI to estimate fair price
    const prompt = `Estimate the fair market price in INR for:
    Title: ${listing.title}
    Category: ${listing.category}
    Condition: ${listing.condition}
    Listed Price: ₹${listing.price}
    
    Respond with JSON: { "estimatedPrice": number, "isSuspicious": boolean, "reason": string }`;

    try {
        const result = await generateText(prompt);
        const analysis = parseJSON(result.text);

        const priceDiff = (listing.price - analysis.estimatedPrice) / analysis.estimatedPrice;

        if (priceDiff < -0.5) { // More than 50% below market
            return {
                isAnomalous: true,
                severity: 'high',
                message: `Price is ${Math.abs(Math.round(priceDiff * 100))}% below market value`,
                riskPoints: 30
            };
        } else if (priceDiff < -0.3) { // 30-50% below
            return {
                isAnomalous: true,
                severity: 'medium',
                message: `Price is ${Math.abs(Math.round(priceDiff * 100))}% below market value`,
                riskPoints: 15
            };
        }
    } catch (error) {
        console.error('Price analysis failed:', error);
    }

    return { isAnomalous: false, riskPoints: 0 };
}

async function analyzeListingImages(images, title) {
    const flags = [];
    let riskPoints = 0;

    try {
        const prompt = `Analyze these product images for a marketplace listing titled "${title}".
        Check for:
        1. Stock photos or watermarks
        2. Image quality issues
        3. Mismatch between images and title
        4. Signs of image manipulation
        
        Respond with JSON: {
            "isStockPhoto": boolean,
            "hasWatermark": boolean,
            "qualityIssue": boolean,
            "mismatch": boolean,
            "concerns": string[]
        }`;

        const result = await analyzeImages(images.slice(0, 2), prompt);
        const analysis = parseJSON(result.text);

        if (analysis.isStockPhoto) {
            flags.push({ type: 'stock_photo', severity: 'high', message: 'Images appear to be stock photos' });
            riskPoints += 25;
        }
        if (analysis.hasWatermark) {
            flags.push({ type: 'watermark', severity: 'medium', message: 'Images contain watermarks from other sites' });
            riskPoints += 20;
        }
        if (analysis.mismatch) {
            flags.push({ type: 'image_mismatch', severity: 'high', message: 'Images do not match the listing title' });
            riskPoints += 30;
        }
    } catch (error) {
        console.error('Image analysis failed:', error);
    }

    return { flags, riskPoints };
}

function analyzeDescription(description) {
    const flags = [];
    let riskPoints = 0;

    const redFlags = [
        { pattern: /whatsapp|telegram|signal/i, type: 'off_platform', message: 'Requests contact outside platform', points: 15 },
        { pattern: /pay\s*(outside|before|advance)/i, type: 'advance_payment', message: 'Requests advance payment', points: 20 },
        { pattern: /urgent|emergency|desperate/i, type: 'urgency', message: 'Uses urgency pressure tactics', points: 10 },
        { pattern: /gift\s*card|crypto|bitcoin/i, type: 'unusual_payment', message: 'Requests unusual payment methods', points: 25 },
        { pattern: /no\s*(return|refund|warranty)/i, type: 'no_protection', message: 'Explicitly denies buyer protection', points: 10 }
    ];

    for (const flag of redFlags) {
        if (flag.pattern.test(description)) {
            flags.push({ type: flag.type, severity: 'medium', message: flag.message });
            riskPoints += flag.points;
        }
    }

    return { flags, riskPoints };
}

async function analyzeSellerHistory(sellerId) {
    const flags = [];
    let riskPoints = 0;

    const seller = await User.findById(sellerId);
    if (!seller) return { flags, riskPoints };

    // Check account age
    const accountAge = (Date.now() - new Date(seller.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (accountAge < 7) {
        flags.push({ type: 'new_account', severity: 'medium', message: 'Seller account is less than 7 days old' });
        riskPoints += 15;
    }

    // Check verification
    if (!seller.isVerified) {
        flags.push({ type: 'unverified_seller', severity: 'low', message: 'Seller identity is not verified' });
        riskPoints += 10;
    }

    // Check rating
    if (seller.rating < 3 && seller.totalSales > 0) {
        flags.push({ type: 'low_rating', severity: 'medium', message: 'Seller has low ratings' });
        riskPoints += 20;
    }

    return { flags, riskPoints };
}

function getRiskLevel(score) {
    if (score >= 60) return { level: 'high', color: '#ef4444', action: 'block' };
    if (score >= 30) return { level: 'medium', color: '#f59e0b', action: 'warn' };
    if (score > 0) return { level: 'low', color: '#22c55e', action: 'allow' };
    return { level: 'clean', color: '#22c55e', action: 'allow' };
}

function getRecommendation(score, flags) {
    if (score >= 60) {
        return 'This listing has multiple fraud indicators. We recommend NOT proceeding with this transaction.';
    }
    if (score >= 30) {
        return 'This listing has some warning signs. Proceed with caution and verify the seller before payment.';
    }
    if (flags.length > 0) {
        return 'Minor concerns detected. Standard escrow protection recommended.';
    }
    return 'This listing appears safe. Standard buyer protections apply.';
}

// ============ MESSAGE ANALYSIS ============

/**
 * Analyze chat messages for phishing/scam patterns
 */
export async function analyzeMessage(message) {
    const flags = [];
    let riskScore = 0;

    const phishingPatterns = [
        { pattern: /click\s*(this|here|link)/i, type: 'phishing_link', points: 20 },
        { pattern: /verify\s*(your|account|identity)/i, type: 'fake_verification', points: 15 },
        { pattern: /pay.*whatsapp|gpay|phonepe.*outside/i, type: 'off_platform_payment', points: 25 },
        { pattern: /share.*otp|pin|password/i, type: 'credential_theft', points: 30 },
        { pattern: /won|lottery|prize|inherit/i, type: 'scam_bait', points: 20 }
    ];

    for (const pattern of phishingPatterns) {
        if (pattern.pattern.test(message)) {
            flags.push({ type: pattern.type, severity: 'high', pattern: pattern.pattern.source });
            riskScore += pattern.points;
        }
    }

    return {
        isClean: flags.length === 0,
        riskScore,
        flags,
        shouldBlock: riskScore >= 25
    };
}

export default {
    calculateTrustScore,
    analyzeListing,
    analyzeMessage
};
