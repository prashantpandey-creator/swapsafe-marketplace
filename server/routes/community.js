import express from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Follow from '../models/Follow.js';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { generateText, parseJSON } from '../services/ai.js';

const router = express.Router();

// Hide a post once this many distinct users report it.
const REPORT_HIDE_THRESHOLD = 3;

// Fields we expose for an author/user inline (never the password etc.)
const AUTHOR_FIELDS = 'name avatar isVerified trustScore trustLevel';

// ─── Soft auto-check ──────────────────────────────────────────
// Single cheap text screen at post-creation time. Best-effort: if the AI is
// unavailable or errors, we DON'T block the post — we just skip the flag.
async function autoCheckText(text) {
    try {
        const prompt = `You are a lightweight content safety filter for a used-goods marketplace community in India.
Classify the following user post. Flag ONLY clear violations: scam/fraud solicitation,
hate or harassment, explicit sexual content, or obvious spam. Ordinary buying/selling
talk, opinions, and complaints are NOT violations.

Post: """${text}"""

Respond ONLY with JSON: { "flagged": true|false, "reason": "short reason or empty" }`;
        // Use Gemini explicitly — it's the reliable provider on this deployment
        // (Groq intermittently drops the connection). Still fail-open on error.
        const res = await generateText(prompt, { provider: 'gemini', temperature: 0 });
        const parsed = parseJSON(res.text);
        if (parsed && typeof parsed.flagged === 'boolean') {
            return { flagged: parsed.flagged, reason: parsed.reason || '' };
        }
    } catch (_) {
        // fail-open
    }
    return { flagged: false, reason: '' };
}

// Attach `likedByMe` to a post object for the requesting user.
function decoratePost(postObj, userId) {
    const likedByMe = userId
        ? (postObj.likes || []).some((id) => id.toString() === userId.toString())
        : false;
    // Don't ship the full likes array to the client.
    const { likes, reports, ...rest } = postObj;
    return { ...rest, likedByMe };
}

// ═══════════════════════════════════════════════════════════════
//  POSTS
// ═══════════════════════════════════════════════════════════════

// @route   POST /api/community/posts
// @desc    Create a post (text + optional image + optional listing)
// @access  Private
router.post('/posts', protect, async (req, res) => {
    try {
        const { text, image, listing, kind } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Post text is required' });
        }

        // Validate attached listing, if any.
        let listingId = null;
        if (listing) {
            if (!mongoose.isValidObjectId(listing)) {
                return res.status(400).json({ error: 'Invalid listing id' });
            }
            const exists = await Listing.exists({ _id: listing });
            if (!exists) return res.status(404).json({ error: 'Attached listing not found' });
            listingId = listing;
        }

        const autoFlag = await autoCheckText(text);

        const post = await Post.create({
            author: req.user._id,
            text: text.trim(),
            image: image || '',
            listing: listingId,
            kind: kind || 'general',
            autoFlag,
            // Auto-flagged posts are hidden pending review, but the author is
            // still told it published — they see their own post regardless.
            isHidden: autoFlag.flagged,
        });

        await post.populate('author', AUTHOR_FIELDS);
        if (listingId) await post.populate('listing', 'title price images');

        res.status(201).json({
            success: true,
            post: decoratePost(post.toObject(), req.user._id),
            autoFlagged: autoFlag.flagged,
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Server error creating post' });
    }
});

// @route   GET /api/community/feed
// @desc    Feed. ?scope=following uses the follow graph; default = global.
// @access  Public (optional auth enriches with likedByMe + following feed)
router.get('/feed', optionalAuth, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);
        const scope = req.query.scope || 'global';

        const query = { isHidden: false };

        if (scope === 'following' && req.user) {
            const edges = await Follow.find({ follower: req.user._id }).select('following');
            const ids = edges.map((e) => e.following);
            // Include the user's own posts in their following feed.
            ids.push(req.user._id);
            query.author = { $in: ids };
        }

        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', AUTHOR_FIELDS)
            .populate('listing', 'title price images')
            .lean();

        const decorated = posts.map((p) => decoratePost(p, req.user?._id));
        res.json({ success: true, posts: decorated, page, hasMore: posts.length === limit });
    } catch (error) {
        console.error('Feed error:', error);
        res.status(500).json({ error: 'Server error loading feed' });
    }
});

// @route   GET /api/community/posts/:id
// @desc    Single post with its comments
// @access  Public (optional auth)
router.get('/posts/:id', optionalAuth, async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.params.id, isHidden: false })
            .populate('author', AUTHOR_FIELDS)
            .populate('listing', 'title price images')
            .lean();
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const comments = await Comment.find({ post: post._id, isHidden: false })
            .sort({ createdAt: 1 })
            .populate('author', AUTHOR_FIELDS)
            .lean();

        res.json({
            success: true,
            post: decoratePost(post, req.user?._id),
            comments,
        });
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/community/posts/:id/like
// @desc    Toggle like
// @access  Private
router.post('/posts/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const uid = req.user._id.toString();
        const idx = post.likes.findIndex((id) => id.toString() === uid);
        let liked;
        if (idx === -1) {
            post.likes.push(req.user._id);
            liked = true;
        } else {
            post.likes.splice(idx, 1);
            liked = false;
        }
        post.likeCount = post.likes.length;
        await post.save();

        res.json({ success: true, liked, likeCount: post.likeCount });
    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/community/posts/:id/report
// @desc    Report a post; auto-hide past threshold
// @access  Private
router.post('/posts/:id/report', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const already = post.reports.some((r) => r.user?.toString() === req.user._id.toString());
        if (already) {
            return res.json({ success: true, message: 'Already reported' });
        }

        post.reports.push({ user: req.user._id, reason: req.body.reason || '' });
        post.reportCount = post.reports.length;
        if (post.reportCount >= REPORT_HIDE_THRESHOLD) post.isHidden = true;
        await post.save();

        res.json({ success: true, message: 'Reported. Thank you for keeping the community safe.' });
    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE /api/community/posts/:id
// @desc    Delete own post
// @access  Private (author only)
router.delete('/posts/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this post' });
        }
        await Comment.deleteMany({ post: post._id });
        await post.deleteOne();
        res.json({ success: true });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════════════
//  COMMENTS
// ═══════════════════════════════════════════════════════════════

// @route   POST /api/community/posts/:id/comments
// @access  Private
router.post('/posts/:id/comments', protect, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Comment text is required' });
        }
        const post = await Post.findById(req.params.id);
        if (!post || post.isHidden) return res.status(404).json({ error: 'Post not found' });

        const comment = await Comment.create({
            post: post._id,
            author: req.user._id,
            text: text.trim(),
        });
        post.commentCount = (post.commentCount || 0) + 1;
        await post.save();

        await comment.populate('author', AUTHOR_FIELDS);
        res.status(201).json({ success: true, comment });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE /api/community/comments/:id
// @access  Private (author only)
router.delete('/comments/:id', protect, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        await comment.deleteOne();
        await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════════════
//  FOLLOW GRAPH + PROFILES
// ═══════════════════════════════════════════════════════════════

// @route   POST /api/community/users/:id/follow
// @desc    Toggle follow
// @access  Private
router.post('/users/:id/follow', protect, async (req, res) => {
    try {
        const targetId = req.params.id;
        if (!mongoose.isValidObjectId(targetId)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }
        if (targetId === req.user._id.toString()) {
            return res.status(400).json({ error: 'You cannot follow yourself' });
        }
        const target = await User.exists({ _id: targetId });
        if (!target) return res.status(404).json({ error: 'User not found' });

        const existing = await Follow.findOne({ follower: req.user._id, following: targetId });
        let following;
        if (existing) {
            await existing.deleteOne();
            following = false;
        } else {
            await Follow.create({ follower: req.user._id, following: targetId });
            following = true;
        }
        const followerCount = await Follow.countDocuments({ following: targetId });
        res.json({ success: true, following, followerCount });
    } catch (error) {
        // Duplicate-key race → treat as already following.
        if (error.code === 11000) return res.json({ success: true, following: true });
        console.error('Follow error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/community/users/:id/profile
// @desc    Public profile: user, counts, their posts, isFollowing
// @access  Public (optional auth)
router.get('/users/:id/profile', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }
        const user = await User.findById(id).select(AUTHOR_FIELDS + ' location createdAt totalSales');
        if (!user) return res.status(404).json({ error: 'User not found' });

        const [followerCount, followingCount, posts, isFollowing] = await Promise.all([
            Follow.countDocuments({ following: id }),
            Follow.countDocuments({ follower: id }),
            Post.find({ author: id, isHidden: false })
                .sort({ createdAt: -1 })
                .limit(30)
                .populate('author', AUTHOR_FIELDS)
                .populate('listing', 'title price images')
                .lean(),
            req.user
                ? Follow.exists({ follower: req.user._id, following: id })
                : Promise.resolve(false),
        ]);

        res.json({
            success: true,
            user,
            stats: { followerCount, followingCount, postCount: posts.length },
            isFollowing: !!isFollowing,
            isMe: req.user ? req.user._id.toString() === id : false,
            posts: posts.map((p) => decoratePost(p, req.user?._id)),
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
