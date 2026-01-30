/**
 * Legion Shield API Routes
 * Trust scoring, fraud detection, and security features
 */

import express from 'express';
import { protect } from '../middleware/auth.js';
import { calculateTrustScore, analyzeListing, analyzeMessage } from '../services/legionShield.js';
import User from '../models/User.js';
import Listing from '../models/Listing.js';

const router = express.Router();

// ============ TRUST SCORE ============

/**
 * @route   GET /api/shield/trust-score/:userId
 * @desc    Get a user's Legion Trust Score
 * @access  Public
 */
router.get('/trust-score/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const trustScore = await calculateTrustScore(userId);

        res.json({
            success: true,
            trustScore
        });
    } catch (error) {
        console.error('Trust score error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/shield/my-trust-score
 * @desc    Get current user's trust score
 * @access  Private
 */
router.get('/my-trust-score', protect, async (req, res) => {
    try {
        const trustScore = await calculateTrustScore(req.user._id);

        // Store the latest score on the user document
        await User.findByIdAndUpdate(req.user._id, {
            'trustScore': trustScore.score,
            'trustLevel': trustScore.level.name
        });

        res.json({
            success: true,
            trustScore
        });
    } catch (error) {
        console.error('Trust score error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ LISTING ANALYSIS ============

/**
 * @route   POST /api/shield/analyze-listing
 * @desc    Analyze a listing for fraud signals
 * @access  Public
 */
router.post('/analyze-listing', async (req, res) => {
    try {
        const { listingId, listingData, deepScan } = req.body;

        let listing;
        if (listingId) {
            listing = await Listing.findById(listingId);
            if (!listing) {
                return res.status(404).json({ error: 'Listing not found' });
            }
        } else if (listingData) {
            listing = listingData;
        } else {
            return res.status(400).json({ error: 'Provide listingId or listingData' });
        }

        const analysis = await analyzeListing(listing, { deepScan: deepScan || false });

        res.json({
            success: true,
            analysis
        });
    } catch (error) {
        console.error('Listing analysis error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   POST /api/shield/pre-submit-check
 * @desc    Check a listing before submission (preview fraud detection)
 * @access  Private
 */
router.post('/pre-submit-check', protect, async (req, res) => {
    try {
        const listingData = {
            ...req.body,
            seller: req.user._id
        };

        const analysis = await analyzeListing(listingData, { deepScan: true });

        // If high risk, don't allow submission
        if (analysis.riskLevel.level === 'high') {
            return res.json({
                success: false,
                canSubmit: false,
                reason: 'Listing flagged as high risk',
                analysis
            });
        }

        res.json({
            success: true,
            canSubmit: true,
            analysis
        });
    } catch (error) {
        console.error('Pre-submit check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ MESSAGE SCANNING ============

/**
 * @route   POST /api/shield/scan-message
 * @desc    Scan a message for phishing/scam patterns
 * @access  Private
 */
router.post('/scan-message', protect, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const analysis = await analyzeMessage(message);

        res.json({
            success: true,
            analysis
        });
    } catch (error) {
        console.error('Message scan error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ REPORT ============

/**
 * @route   POST /api/shield/report
 * @desc    Report a suspicious user or listing
 * @access  Private
 */
router.post('/report', protect, async (req, res) => {
    try {
        const { type, targetId, reason, details } = req.body;

        if (!type || !targetId || !reason) {
            return res.status(400).json({ error: 'type, targetId, and reason are required' });
        }

        // In production, save to a Reports collection
        // For now, just log it
        console.log('🚨 REPORT RECEIVED:', {
            reportedBy: req.user._id,
            type,
            targetId,
            reason,
            details,
            timestamp: new Date()
        });

        res.json({
            success: true,
            message: 'Report submitted. Our team will review this within 24 hours.',
            reportId: `RPT-${Date.now()}`
        });
    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ SHIELD STATUS ============

/**
 * @route   GET /api/shield/status
 * @desc    Get Legion Shield system status
 * @access  Public
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        status: 'active',
        features: {
            trustScoring: true,
            fraudDetection: true,
            messageScanning: true,
            imageVerification: true,
            priceAnomalyDetection: true
        },
        version: '1.0.0'
    });
});

export default router;
