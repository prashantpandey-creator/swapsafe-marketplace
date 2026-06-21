import mongoose from 'mongoose';

// A directed follow edge: `follower` follows `following`.
// Separate collection (not arrays on User) so the graph scales and both
// directions are indexable. Unique compound index prevents duplicates.
const followSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    following: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

// One edge per (follower, following) pair.
followSchema.index({ follower: 1, following: 1 }, { unique: true });
// "Who do I follow" and "who follows me" both fast.
followSchema.index({ follower: 1, createdAt: -1 });
followSchema.index({ following: 1, createdAt: -1 });

const Follow = mongoose.model('Follow', followSchema);

export default Follow;
