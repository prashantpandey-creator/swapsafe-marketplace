
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

// 1. Check System Status
router.get('/status', async (req, res) => {
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
router.post('/start-ai-engine', async (req, res) => {
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

export default router;
