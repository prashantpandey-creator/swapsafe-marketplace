// Job Queue Service - BullMQ-based async processing for AI tasks
// This service handles background processing of 3D model generation and 2D image generation

import { Queue, Worker, QueueEvents } from 'bullmq';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import Listing from '../models/Listing.js';
import Job from '../models/Job.js';

// Redis connection config - defaults to localhost for development
const REDIS_CONFIG = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null
};

const USE_REDIS = process.env.USE_REDIS !== 'false';

// Python AI Engine URL
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000/api/v1/studio';

// Mock Queue for fallback when Redis is disabled
class MockQueue {
    constructor(name) { this.name = name; }
    async add(name, data) {
        console.warn(`⚠️ Redis disabled: Job ${name} skipped`);
        return { id: `mock-${Date.now()}` };
    }
    async getJob() { return null; }
    async getWaitingCount() { return 0; }
    async getActiveCount() { return 0; }
}

// ============ QUEUES ============

// Queue for 3D model generation jobs
export const modelGenerationQueue = USE_REDIS
    ? new Queue('model-generation', {
        connection: REDIS_CONFIG,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            },
            removeOnComplete: { count: 100 },  // Keep last 100 completed jobs
            removeOnFail: { count: 50 }        // Keep last 50 failed jobs
        }
    })
    : new MockQueue('model-generation');

// Queue for 2D image generation jobs  
export const imageGenerationQueue = USE_REDIS
    ? new Queue('image-generation', {
        connection: REDIS_CONFIG,
        defaultJobOptions: {
            attempts: 2,
            backoff: { type: 'fixed', delay: 3000 },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 50 }
        }
    })
    : new MockQueue('image-generation');

// Queue for listing creation
export const listingCreationQueue = USE_REDIS
    ? new Queue('listing-creation', {
        connection: REDIS_CONFIG,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 50 }
        }
    })
    : new MockQueue('listing-creation');

// ============ JOB SUBMISSION ============

/**
 * Submit a 3D model generation job to the queue
 * @param {Object} jobData - { listingId, userId, images (base64[]), metadata }
 * @returns {Object} - { jobId, status }
 */
export async function submit3DGenerationJob(jobData) {
    const { listingId, userId, images, metadata } = jobData;

    const job = await modelGenerationQueue.add('generate-3d', {
        listingId,
        userId,
        images,          // Array of base64 encoded images
        metadata,        // { title, category, description }
        tier: metadata.tier || 'draft',
        submittedAt: new Date().toISOString()
    }, {
        priority: metadata.tier === 'pro' ? 1 : metadata.tier === 'standard' ? 5 : 10,
        jobId: `3d-${listingId}-${Date.now()}`
    });

    console.log(`📦 Queued 3D job: ${job.id} for listing ${listingId}`);

    return {
        jobId: job.id,
        status: 'queued',
        estimatedWait: await getEstimatedWaitTime(modelGenerationQueue)
    };
}

/**
 * Submit a 2D marketing image generation job
 */
export async function submit2DGenerationJob(jobData) {
    const { listingId, userId, productImage, prompt } = jobData;

    const job = await imageGenerationQueue.add('generate-2d', {
        listingId,
        userId,
        productImage,    // Base64 encoded product image
        prompt,
        submittedAt: new Date().toISOString()
    }, {
        jobId: `2d-${listingId}-${Date.now()}`
    });

    console.log(`🎨 Queued 2D job: ${job.id}`);

    return { jobId: job.id, status: 'queued' };
}

/**
 * Submit a listing creation job to the queue
 * @param {string} userId - User ID creating the listing
 * @param {object} listingData - Listing data with images, title, description, etc.
 * @returns {object} Job info with jobId, status, estimatedWaitMs
 */
export async function submitListingCreationJob(userId, listingData) {
    const jobId = uuidv4();

    try {
        // Get current queue size
        const queueCount = await listingCreationQueue.getWaitingCount();

        // Create job record in MongoDB
        const jobRecord = await Job.create({
            jobId,
            type: 'listing_creation',
            userId,
            status: 'queued',
            data: listingData,
            queuePosition: queueCount,
            estimatedWaitMs: queueCount * 15000 // 15s per job estimate
        });

        // Add to BullMQ queue
        await listingCreationQueue.add('create-listing', {
            jobId,
            userId,
            listingData
        }, {
            jobId // Use same ID for BullMQ job
        });

        console.log(`📦 Queued listing creation job: ${jobId} (position: ${queueCount})`);

        return {
            jobId,
            status: 'queued',
            queuePosition: jobRecord.queuePosition,
            estimatedWaitMs: jobRecord.estimatedWaitMs
        };
    } catch (error) {
        console.error('Listing job submission error:', error);
        throw error;
    }
}

/**
 * Get job status by ID
 */
export async function getJobStatus(jobId, queueType = '3d') {
    const queue = queueType === '3d' ? modelGenerationQueue : imageGenerationQueue;
    const job = await queue.getJob(jobId);

    if (!job) {
        return { status: 'not_found' };
    }

    const state = await job.getState();
    const progress = job.progress || 0;

    return {
        jobId: job.id,
        status: state,
        progress,
        data: state === 'completed' ? job.returnvalue : null,
        error: state === 'failed' ? job.failedReason : null,
        attempts: job.attemptsMade
    };
}

// ============ HELPERS ============

async function getEstimatedWaitTime(queue) {
    const waiting = await queue.getWaitingCount();
    const active = await queue.getActiveCount();

    // Estimate ~30s per job for 3D generation
    const avgJobTime = 30; // seconds
    return (waiting + active) * avgJobTime;
}

// ============ WORKERS ============
// Workers are started separately to allow scaling independently

export function start3DWorker() {
    if (!USE_REDIS) return { on: () => { } };

    const worker = new Worker('model-generation', async (job) => {
        console.log(`🔧 Processing 3D job: ${job.id}`);

        const { images, metadata, listingId } = job.data;

        try {
            // Update progress
            await job.updateProgress(10);

            // Build FormData for Python engine
            const formData = new FormData();

            // Convert base64 images to buffers and append
            for (let i = 0; i < images.length; i++) {
                const imageBuffer = Buffer.from(images[i], 'base64');
                formData.append('files', imageBuffer, {
                    filename: `view_${i}.jpg`,
                    contentType: 'image/jpeg'
                });
            }

            formData.append('title', metadata.title || 'Unknown');
            formData.append('category', metadata.category || 'Gear');
            formData.append('description', metadata.description || '');

            await job.updateProgress(30);

            // Call Python AI Engine
            console.log(`📡 Calling AI Engine for job ${job.id}...`);
            const response = await fetch(`${AI_ENGINE_URL}/generate-3d`, {
                method: 'POST',
                body: formData,
                headers: formData.getHeaders(),
                timeout: 300000 // 5 min timeout for complex jobs
            });

            await job.updateProgress(80);

            if (!response.ok) {
                throw new Error(`AI Engine error: ${response.statusText}`);
            }

            const result = await response.json();

            await job.updateProgress(100);

            console.log(`✅ 3D job ${job.id} completed: ${result.model_url}`);

            // TODO: Update listing in MongoDB with model_url
            // await updateListingWithModel(listingId, result.model_url);

            return {
                success: true,
                modelUrl: result.model_url,
                polyCount: result.poly_count,
                textureResolution: result.texture_resolution
            };

        } catch (error) {
            console.error(`❌ 3D job ${job.id} failed:`, error.message);
            throw error; // Re-throw to trigger retry
        }

    }, {
        connection: REDIS_CONFIG,
        concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2')
    });

    worker.on('completed', (job, result) => {
        console.log(`🎉 Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
        console.error(`💥 Job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err.message);
    });

    return worker;
}

export function start2DWorker() {
    if (!USE_REDIS) return { on: () => { } };

    const worker = new Worker('image-generation', async (job) => {
        console.log(`🎨 Processing 2D job: ${job.id}`);

        const { productImage, prompt } = job.data;

        try {
            const formData = new FormData();
            const imageBuffer = Buffer.from(productImage, 'base64');
            formData.append('file', imageBuffer, { filename: 'product.jpg', contentType: 'image/jpeg' });
            formData.append('prompt', prompt);

            const response = await fetch(`${AI_ENGINE_URL}/generate-image`, {
                method: 'POST',
                body: formData,
                headers: formData.getHeaders(),
                timeout: 120000
            });

            if (!response.ok) {
                throw new Error(`AI Engine error: ${response.statusText}`);
            }

            const result = await response.json();

            return {
                success: true,
                imageUrl: result.image_url
            };

        } catch (error) {
            console.error(`❌ 2D job ${job.id} failed:`, error.message);
            throw error;
        }

    }, {
        connection: REDIS_CONFIG,
        concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3')
    });

    return worker;
}

// Worker for listing creation
export function startListingCreationWorker() {
    if (!USE_REDIS) return { on: () => { } };

    const worker = new Worker('listing-creation', async (job) => {
        const { jobId, userId, listingData } = job.data;

        console.log(`📝 Processing listing creation job: ${jobId}`);

        try {
            // Update to active with 10% progress
            await Job.findOneAndUpdate(
                { jobId },
                {
                    status: 'active',
                    startedAt: new Date(),
                    progress: 10
                }
            );
            await job.updateProgress(10);

            // Step 1: Process images (40% progress)
            let processedImages = [];
            if (listingData.images && listingData.images.length > 0) {
                // Images are already URLs or base64
                processedImages = listingData.images;
            }

            await Job.findOneAndUpdate({ jobId }, { progress: 50 });
            await job.updateProgress(50);

            // Step 2: AI analysis placeholder (30% progress)
            const aiTags = ['user-listed'];
            const aiVerified = false;

            await Job.findOneAndUpdate({ jobId }, { progress: 80 });
            await job.updateProgress(80);

            // Step 3: Create listing in DB (20% progress)
            const listing = await Listing.create({
                title: listingData.title,
                description: listingData.description,
                price: parseFloat(listingData.price),
                category: listingData.category,
                condition: listingData.condition,
                images: processedImages,
                location: listingData.location || { city: 'Unknown', state: 'IN' },
                seller: userId,
                aiVerified,
                aiTags,
                status: 'active'
            });

            await Job.findOneAndUpdate({ jobId }, { progress: 90 });
            await job.updateProgress(90);

            // Mark complete
            await Job.findOneAndUpdate(
                { jobId },
                {
                    status: 'completed',
                    progress: 100,
                    result: { listingId: listing._id.toString() },
                    completedAt: new Date()
                }
            );

            console.log(`✅ Listing creation job ${jobId} completed - Listing ${listing._id}`);

            return { listingId: listing._id.toString() };

        } catch (error) {
            console.error(`❌ Listing job ${jobId} failed:`, error);

            await Job.findOneAndUpdate(
                { jobId },
                {
                    status: 'failed',
                    error: error.message,
                    completedAt: new Date()
                }
            );

            throw error;
        }
    }, {
        connection: REDIS_CONFIG,
        concurrency: 5 // Process 5 listings concurrently
    });

    worker.on('completed', (job) => {
        console.log(`✅ Listing worker completed job ${job.id}`);
    });

    worker.on('failed', (job, err) => {
        console.error(`❌ Listing worker failed job ${job?.id}:`, err.message);
    });

    console.log('🚀 Listing creation worker started');

    return worker;
}

// ============ QUEUE EVENTS (for monitoring) ============

export function setupQueueEvents() {
    if (!USE_REDIS) return { on: () => { } };

    const events = new QueueEvents('model-generation', { connection: REDIS_CONFIG });

    events.on('completed', ({ jobId, returnvalue }) => {
        console.log(`📊 [Monitor] Job ${jobId} completed`);
        // TODO: Send push notification / email to user
    });

    events.on('failed', ({ jobId, failedReason }) => {
        console.error(`📊 [Monitor] Job ${jobId} failed: ${failedReason}`);
        // TODO: Alert admin / retry logic
    });

    return events;
}

export default {
    modelGenerationQueue,
    imageGenerationQueue,
    listingCreationQueue,
    submit3DGenerationJob,
    submit2DGenerationJob,
    submitListingCreationJob,
    getJobStatus,
    start3DWorker,
    start2DWorker,
    startListingCreationWorker,
    setupQueueEvents
};
