import mongoose from 'mongoose';

// A marketplace-native social post. Free-form text + optional image, and
// optionally attached to a listing (the "just listed / looking for / swap
// story" loop). Likes and comment counts are denormalised for cheap feeds.
const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    // Free-form body. Kept short — this is a feed, not a blog.
    text: {
        type: String,
        required: [true, 'Post text is required'],
        trim: true,
        maxlength: 1000,
    },
    // Optional single image (Cloudinary URL, reuses /api/upload).
    image: {
        type: String,
        default: '',
    },
    // Optional attached listing — the marketplace-native hook.
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        default: null,
    },
    // Lightweight intent tag so the feed can be filtered later.
    kind: {
        type: String,
        enum: ['general', 'just_listed', 'looking_for', 'swap_story', 'review'],
        default: 'general',
    },
    // Users who liked. Array of user ids — fine at community scale; if this
    // ever gets huge, split into a separate Like collection.
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },

    // ─── Moderation (report + soft auto-checks) ───────────────
    reports: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
    }],
    reportCount: { type: Number, default: 0 },
    // Set true once reportCount crosses the threshold OR an admin hides it.
    // Hidden posts are excluded from feeds but kept for review.
    isHidden: { type: Boolean, default: false },
    // Soft auto-check verdict from the Gemini text screen at creation time.
    autoFlag: {
        flagged: { type: Boolean, default: false },
        reason: { type: String, default: '' },
    },
}, {
    timestamps: true,
});

// Feed query: newest non-hidden first.
postSchema.index({ isHidden: 1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });

postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

const Post = mongoose.model('Post', postSchema);

export default Post;
