import mongoose from 'mongoose';

/**
 * TrainingPair — Image detection exhaust collection.
 * Every successful AI detection (analyze-image) logs one pair: image URL + verified labels.
 * Over time this becomes the dataset for fine-tuning a small VLM that beats Gemini
 * on Indian secondhand goods (Move 5, Phase 3+).
 *
 * Design:
 * - Fire-and-forget logging on the hot path (never blocks listing creation).
 * - Confidence gate: only pairs where `confidence >= 0.80` are included in training
 *   (low-confidence detections corrupt the fine-tune, so we filter strict).
 * - Provenance: track which AI provider/model generated the labels (Gemini Flash, Groq, etc.)
 *   so we can weight them later (Sonnet-verified pairs are heavier than Flash guesses).
 */

const trainingPairSchema = new mongoose.Schema({
    // The input: Cloudinary URL or data: URL of the uploaded image
    imageUrl: {
        type: String,
        required: true,
        index: true
    },

    // The labels: what the AI said about this image
    labels: {
        title: String,                    // product name / title
        category: String,                 // electronics, fashion, etc.
        brand: String,                    // brand (e.g. Apple, Samsung)
        model: String,                    // model (e.g. iPhone 14 Pro)
        condition: { type: String, enum: ['new', 'like-new', 'good', 'fair', 'poor'] },
        condition_report: String,         // "Visible scratches on screen", etc.
        detected_view: String,            // "front view", "side profile", etc.
        description: String,              // short feature description
        keywords: [String],               // 3-5 search terms
    },

    // Confidence in the detection (0–100)
    // Only pairs with confidence >= 0.80 should be used for fine-tuning
    confidence: {
        type: Number,
        min: 0,
        max: 100,
        index: true
    },

    // Which AI provider generated this label
    // (affects weighting in fine-tune: Sonnet/Claude > Gemini Flash > Groq)
    provider: {
        type: String,
        enum: ['gemini-flash', 'gemini-sonnet', 'claude-haiku', 'claude-sonnet', 'groq', 'unknown'],
        default: 'unknown',
        index: true
    },

    // Whether this pair has been validated by a human or a stronger model
    verified: {
        type: Boolean,
        default: false,
        index: true
    },

    // Seller info (optional, for later analysis of listing outcomes)
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // Timestamps
    createdAt: { type: Date, default: Date.now, index: true },
}, {
    collection: 'trainingPairs'
});

// Composite index for finding high-confidence, unverified pairs for fine-tuning
trainingPairSchema.index({ confidence: -1, verified: 1, provider: 1 });

export default mongoose.model('TrainingPair', trainingPairSchema);
