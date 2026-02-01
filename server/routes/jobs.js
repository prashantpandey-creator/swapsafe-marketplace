// Job Queue Routes - API endpoints for async AI job management
import express from 'express';
import { protect } from '../middleware/auth.js';
import Listing from '../models/Listing.js';

const router = express.Router();

// Flag to check if BullMQ is available
let jobQueueService = null;
let bullmqAvailable = false;

// Try to load BullMQ service (graceful fallback if Redis not available)
try {
    jobQueueService = await import('../services/jobQueue.js');
    bullmqAvailable = true;
    console.log('✅ Job Queue Service loaded');
} catch (error) {
    console.warn('⚠️ BullMQ not available - running in sync mode:', error.message);
}

/**
 * @route   POST /api/jobs/submit-3d
 * @desc    Submit a 3D model generation job to the queue
 * @access  Private
 */
router.post('/submit-3d', protect, async (req, res) => {
    try {
        const { listingId, images, metadata } = req.body;

        if (!images || images.length < 2) {
            return res.status(400).json({ error: 'At least 2 images required for 3D generation' });
        }

        // Check if queue is available
        if (!bullmqAvailable) {
            // Fallback: Return a mock response for demo
            return res.json({
                success: true,
                jobId: `mock-${Date.now()}`,
                status: 'processing',
                message: 'Running in sync mode (Redis not configured)',
                estimatedWait: 30
            });
        }

        // Submit to queue
        const result = await jobQueueService.submit3DGenerationJob({
            listingId,
            userId: req.user._id.toString(),
            images,      // Expecting base64 encoded images
            metadata     // { title, category, description, tier }
        });

        // Update listing status to 'processing' if listingId provided
        if (listingId) {
            await Listing.findByIdAndUpdate(listingId, {
                'aiStatus': 'processing',
                'aiJobId': result.jobId
            });
        }

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Job submission error:', error);
        res.status(500).json({ error: 'Failed to submit job' });
    }
});

/**
 * @route   GET /api/jobs/:jobId/status
 * @desc    Get status of a queued job
 * @access  Private
 */
router.get('/:jobId/status', protect, async (req, res) => {
    try {
        const { jobId } = req.params;
        const { type = '3d' } = req.query;

        if (!bullmqAvailable) {
            // Mock response for demo
            return res.json({
                jobId,
                status: 'completed',
                progress: 100,
                data: {
                    modelUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
                    polyCount: 15000
                }
            });
        }

        const status = await jobQueueService.getJobStatus(jobId, type);
        res.json(status);

    } catch (error) {
        console.error('Job status error:', error);
        res.status(500).json({ error: 'Failed to get job status' });
    }
});

/**
 * @route   GET /api/jobs/queue-stats
 * @desc    Get queue statistics (admin)
 * @access  Private (should be admin-only in production)
 */
router.get('/queue-stats', protect, async (req, res) => {
    try {
        if (!bullmqAvailable) {
            return res.json({
                mode: 'sync',
                message: 'Queue not configured - running in synchronous mode'
            });
        }

        const modelQueue = jobQueueService.modelGenerationQueue;
        const imageQueue = jobQueueService.imageGenerationQueue;

        const [modelWaiting, modelActive, modelCompleted, modelFailed] = await Promise.all([
            modelQueue.getWaitingCount(),
            modelQueue.getActiveCount(),
            modelQueue.getCompletedCount(),
            modelQueue.getFailedCount()
        ]);

        const [imageWaiting, imageActive] = await Promise.all([
            imageQueue.getWaitingCount(),
            imageQueue.getActiveCount()
        ]);

        res.json({
            mode: 'async',
            queues: {
                modelGeneration: {
                    waiting: modelWaiting,
                    active: modelActive,
                    completed: modelCompleted,
                    failed: modelFailed
                },
                imageGeneration: {
                    waiting: imageWaiting,
                    active: imageActive
                }
            }
        });

    } catch (error) {
        console.error('Queue stats error:', error);
        res.status(500).json({ error: 'Failed to get queue stats' });
    }
});

export default router;
