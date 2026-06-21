import mongoose from 'mongoose';

// A comment on a Post. Flat (no nested threads) for v1 — simpler to render
// and moderate. Reports handled the same way as posts.
const commentSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        index: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    text: {
        type: String,
        required: [true, 'Comment text is required'],
        trim: true,
        maxlength: 500,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likeCount: { type: Number, default: 0 },

    reportCount: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
}, {
    timestamps: true,
});

commentSchema.index({ post: 1, createdAt: 1 });

commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
