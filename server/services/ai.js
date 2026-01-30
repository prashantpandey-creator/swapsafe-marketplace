/**
 * Multi-Provider AI Service
 * Supports: Groq (FREE), Google Gemini (FREE + Vision), Ollama (LOCAL), OpenAI (PAID)
 */

import dotenv from 'dotenv';
dotenv.config();

import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// ============ PROVIDER INITIALIZATION ============

// Groq (FREE - Fast LLaMA/Mixtral)
let groq = null;
if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here') {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('✅ Groq AI initialized');
}

// Google Gemini (FREE - Good for Vision)
let gemini = null;
let geminiVision = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    gemini = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    geminiVision = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✅ Google Gemini initialized');
}

// OpenAI (PAID - Fallback)
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('✅ OpenAI initialized');
}

// Ollama URL
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// ============ TEXT GENERATION ============

/**
 * Generate text using the configured provider
 */
export async function generateText(prompt, options = {}) {
    const provider = options.provider || process.env.AI_PROVIDER || 'groq';

    try {
        switch (provider) {
            case 'groq':
                return await generateWithGroq(prompt, options);
            case 'gemini':
                return await generateWithGemini(prompt, options);
            case 'ollama':
                return await generateWithOllama(prompt, options);
            case 'openai':
                return await generateWithOpenAI(prompt, options);
            default:
                // Try providers in order of preference (free first)
                if (groq) return await generateWithGroq(prompt, options);
                if (gemini) return await generateWithGemini(prompt, options);
                if (openai) return await generateWithOpenAI(prompt, options);
                return await generateWithOllama(prompt, options);
        }
    } catch (error) {
        console.error(`AI generation failed with ${provider}:`, error.message);
        throw error;
    }
}

// Groq implementation
async function generateWithGroq(prompt, options) {
    if (!groq) throw new Error('Groq not initialized. Set GROQ_API_KEY in .env');

    const completion = await groq.chat.completions.create({
        model: options.model || 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: 'You are a helpful assistant. Respond only with valid JSON when asked.' },
            { role: 'user', content: prompt }
        ],
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 1000
    });

    return {
        text: completion.choices[0].message.content,
        provider: 'groq',
        model: options.model || 'llama-3.3-70b-versatile'
    };
}

// Gemini implementation
async function generateWithGemini(prompt, options) {
    if (!gemini) throw new Error('Gemini not initialized. Set GEMINI_API_KEY in .env');

    const result = await gemini.generateContent(prompt);
    const response = await result.response;

    return {
        text: response.text(),
        provider: 'gemini',
        model: 'gemini-1.5-flash'
    };
}

// Ollama implementation (LOCAL)
async function generateWithOllama(prompt, options) {
    const model = options.model || 'llama3.2';

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            prompt,
            stream: false,
            options: {
                temperature: options.temperature || 0.3
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}. Is Ollama running?`);
    }

    const data = await response.json();

    return {
        text: data.response,
        provider: 'ollama',
        model
    };
}

// OpenAI implementation
async function generateWithOpenAI(prompt, options) {
    if (!openai) throw new Error('OpenAI not initialized. Set OPENAI_API_KEY in .env');

    const completion = await openai.chat.completions.create({
        model: options.model || 'gpt-4o-mini',
        messages: [
            { role: 'system', content: 'You are a helpful assistant. Respond only with valid JSON when asked.' },
            { role: 'user', content: prompt }
        ],
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 1000
    });

    return {
        text: completion.choices[0].message.content,
        provider: 'openai',
        model: options.model || 'gpt-4o-mini'
    };
}

// ============ VISION (IMAGE ANALYSIS) ============

/**
 * Analyze images using vision-capable models
 */
export async function analyzeImages(images, prompt, options = {}) {
    const provider = options.provider || process.env.VISION_PROVIDER || 'gemini';

    try {
        switch (provider) {
            case 'gemini':
                return await analyzeWithGemini(images, prompt, options);
            case 'ollama':
                return await analyzeWithOllamaVision(images, prompt, options);
            case 'openai':
                return await analyzeWithOpenAIVision(images, prompt, options);
            default:
                if (geminiVision) return await analyzeWithGemini(images, prompt, options);
                if (openai) return await analyzeWithOpenAIVision(images, prompt, options);
                return await analyzeWithOllamaVision(images, prompt, options);
        }
    } catch (error) {
        console.error(`Vision analysis failed with ${provider}:`, error.message);
        throw error;
    }
}

// Gemini Vision
async function analyzeWithGemini(images, prompt, options) {
    if (!geminiVision) throw new Error('Gemini not initialized');

    // Convert images to Gemini format
    const imageParts = await Promise.all(
        images.slice(0, 4).map(async (img) => {
            // Handle base64 or URL
            if (img.startsWith('data:')) {
                const [meta, data] = img.split(',');
                const mimeType = meta.match(/data:(.*);/)[1];
                return {
                    inlineData: { data, mimeType }
                };
            } else {
                // Fetch URL and convert to base64
                const response = await fetch(img);
                const buffer = await response.arrayBuffer();
                const base64 = Buffer.from(buffer).toString('base64');
                return {
                    inlineData: { data: base64, mimeType: 'image/jpeg' }
                };
            }
        })
    );

    const result = await geminiVision.generateContent([prompt, ...imageParts]);
    const response = await result.response;

    return {
        text: response.text(),
        provider: 'gemini',
        model: 'gemini-1.5-flash'
    };
}

// Ollama Vision (LLaVA)
async function analyzeWithOllamaVision(images, prompt, options) {
    const model = options.model || 'llava';

    // Convert first image to base64
    let imageData = images[0];
    if (imageData.startsWith('data:')) {
        imageData = imageData.split(',')[1];
    }

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            prompt,
            images: [imageData],
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error(`Ollama vision error: Is LLaVA model installed?`);
    }

    const data = await response.json();

    return {
        text: data.response,
        provider: 'ollama',
        model
    };
}

// OpenAI Vision
async function analyzeWithOpenAIVision(images, prompt, options) {
    if (!openai) throw new Error('OpenAI not initialized');

    const imageContent = images.slice(0, 4).map(img => ({
        type: 'image_url',
        image_url: { url: img, detail: 'low' }
    }));

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    ...imageContent
                ]
            }
        ],
        max_tokens: 500
    });

    return {
        text: completion.choices[0].message.content,
        provider: 'openai',
        model: 'gpt-4o-mini'
    };
}

// ============ HELPER FUNCTIONS ============

/**
 * Parse JSON from AI response
 */
export function parseJSON(text) {
    try {
        return JSON.parse(text);
    } catch {
        // Try to extract JSON from text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Could not parse JSON from response');
    }
}

/**
 * Check which providers are available
 */
export function getAvailableProviders() {
    return {
        groq: !!groq,
        gemini: !!gemini,
        openai: !!openai,
        ollama: true // Always show as available (user might start it)
    };
}

/**
 * Check if Ollama is running
 */
export async function checkOllama() {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`);
        if (response.ok) {
            const data = await response.json();
            return {
                running: true,
                models: data.models?.map(m => m.name) || []
            };
        }
    } catch {
        return { running: false, models: [] };
    }
}

export default {
    generateText,
    analyzeImages,
    parseJSON,
    getAvailableProviders,
    checkOllama
};
