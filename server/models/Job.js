import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    jobId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['listing_creation', '3d_model', '2d_image', 'video_transcode']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['queued', 'active', 'completed', 'failed'],
        default: 'queued',
        index: true
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    // Input data (form, images, etc)
    data: {
        type: mongoose.Schema.Types.Mixed
    },
    // Output result (listing ID, URLs, etc)
    result: {
        type: mongoose.Schema.Types.Mixed
    },
    error: {
        type: String
    },
    queuePosition: {
        type: Number
    },
    estimatedWaitMs: {
        type: Number
    },
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
jobSchema.index({ userId: 1, status: 1 });
jobSchema.index({ status: 1, createdAt: -1 });

const Job = mongoose.model('Job', jobSchema);

export default Job;
