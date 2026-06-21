
import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // Standard import might work if project is type:module

const router = express.Router();

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8001';
// Path to script (Assuming server runs from /server directory)
const SCRIPT_PATH = path.resolve(__dirname, '../../ai-engine/start_engine.sh');

// Admin guard — requires a matching x-admin-key header against ADMIN_KEY env.
// If ADMIN_KEY is unset we DENY by default (fail closed) so these powerful
// routes (shell exec, DB seed) are never accidentally exposed.
const requireAdmin = (req, res, next) => {
    const key = req.headers['x-admin-key'];
    if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

// 1. Check System Status
router.get('/status', requireAdmin, async (req, res) => {
    let aiStatus = 'offline';

    try {
        // Ping AI Engine
        const response = await fetch(`${AI_ENGINE_URL}/health`, { timeout: 2000 });
        if (response.ok) {
            aiStatus = 'online';
        }
    } catch (error) {
        aiStatus = 'offline';
    }

    res.json({
        backend: 'online',
        ai_engine: aiStatus,
        timestamp: Date.now()
    });
});

// 2. Start AI Engine
router.post('/start-ai-engine', requireAdmin, async (req, res) => {
    console.log("🚀 Triggering AI Engine Start...");

    // Check if checks pass first
    try {
        const response = await fetch(`${AI_ENGINE_URL}/health`, { timeout: 1000 });
        if (response.ok) {
            return res.json({ status: 'already_running', message: 'AI Engine is already online' });
        }
    } catch (e) {
        // Expected to fail if offline
    }

    // Execute Start Script
    // Using nohup to keep process alive after parent exits/restarts
    const logPath = path.resolve(__dirname, '../../ai-engine/ai_engine_launch.log');
    const command = `nohup "${SCRIPT_PATH}" > "${logPath}" 2>&1 &`;

    console.log(`Command: ${command}`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Failed to start AI Engine: ${error}`);
            return res.status(500).json({ status: 'error', message: 'Failed to start process' });
        }

        console.log("✅ Start command executed.");
        res.json({ status: 'starting', message: 'AI Engine startup initiated' });
    });
});

// 3. Seed Database (listings, users, and products)
router.post('/seed', requireAdmin, async (req, res) => {
    console.log("🌱 Triggering Database Seeding...");
    
    const cmd1 = `node "${path.resolve(__dirname, '../seed.js')}"`;
    const cmd2 = `node "${path.resolve(__dirname, '../scripts/seedProducts.js')}"`;

    exec(cmd1, (err1, stdout1, stderr1) => {
        if (err1) {
            console.error(`❌ Failed to run user/listings seed: ${err1}`);
            return res.status(500).json({ 
                status: 'error', 
                message: 'Failed to seed users and listings', 
                details: stderr1 || err1.message 
            });
        }

        console.log("✅ Users and listings seeded successfully.");
        
        exec(cmd2, (err2, stdout2, stderr2) => {
            if (err2) {
                console.error(`❌ Failed to run product catalogue seed: ${err2}`);
                return res.json({
                    status: 'partial_success',
                    message: 'Users and listings seeded, but product catalogue failed',
                    listings_output: stdout1,
                    product_error: stderr2 || err2.message
                });
            }

            console.log("✅ Product catalogue seeded successfully.");
            res.json({
                status: 'success',
                message: 'Database seeded successfully (Users, Listings, and Product Catalogue)',
                listings_output: stdout1,
                product_output: stdout2
            });
        });
    });
});

export default router;
