# Plan A Integration Guide — Node.js Backend

This guide explains how to integrate Plan A endpoints into the Express backend and React frontend.

## Backend Integration (server/routes/ai.js)

### Add Plan A Endpoint

```javascript
// server/routes/ai.js

const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * POST /api/ai/enhance-photo-local
 * Plan A: Fully local processing on user's Mac
 *
 * Request body:
 * - file: UploadFile (multipart/form-data)
 *
 * Response:
 * - status: "success" or "error"
 * - image: base64 JPEG data
 * - metadata: { total_time, complexity, stages }
 */
router.post('/enhance-photo-local', async (req, res) => {
  try {
    // Validate user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Ensure file is uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get AI Engine URL from environment
    const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8001';

    // Forward to AI Engine
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    console.log(`[AI] Forwarding to Plan A: ${req.file.originalname}`);

    const aiResponse = await axios.post(
      `${AI_ENGINE_URL}/api/v1/studio/v1/studio/process-local`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 60000, // 60 second timeout for slow operations
      }
    );

    if (!aiResponse.data.status === 'success') {
      return res.status(500).json({
        error: 'AI processing failed',
        detail: aiResponse.data.error,
      });
    }

    // Log processing for analytics
    console.log(`[AI] Plan A completed:`, {
      user: req.user.id,
      file: req.file.originalname,
      time: aiResponse.data.metadata.total_time,
      complexity: aiResponse.data.metadata.estimated_complexity,
    });

    // Return result
    res.json({
      status: 'success',
      image: aiResponse.data.image,
      metadata: aiResponse.data.metadata,
      message: aiResponse.data.message,
    });

  } catch (error) {
    console.error('[AI] Plan A error:', error.message);
    res.status(500).json({
      error: 'Enhancement failed',
      detail: error.message,
    });
  }
});

module.exports = router;
```

### Add to Server Config

```javascript
// server/index.js

const aiRoutes = require('./routes/ai');
// ... other requires

app.use('/api/ai', aiRoutes);
```

---

## Frontend Integration (React)

### Create Hook: usePhotoEnhancement.js

```javascript
// src/hooks/usePhotoEnhancement.js

import { useState, useCallback } from 'react';
import api from '../services/api';

export const usePhotoEnhancement = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const enhancePhoto = useCallback(async (imageFile) => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      // Stage 1: Upload & start processing
      setCurrentStage('Analyzing image...');
      setProgress(10);

      const response = await api.post(
        '/ai/enhance-photo-local',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 seconds
        }
      );

      const { image, metadata } = response.data;

      // Simulate progress through stages
      const stages = [
        { name: 'Segmentation', percent: 25 },
        { name: 'Analysis', percent: 50 },
        { name: 'Compositing', percent: 75 },
        { name: 'Polishing', percent: 90 },
      ];

      for (const stage of stages) {
        setCurrentStage(stage.name);
        setProgress(stage.percent);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setProgress(100);
      setCurrentStage('Complete!');

      // Store result
      setResult({
        image,
        metadata,
        original: imageFile,
      });

      return response.data;

    } catch (err) {
      console.error('Enhancement failed:', err);
      setError(err.message || 'Enhancement failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    enhancePhoto,
    isProcessing,
    progress,
    currentStage,
    result,
    error,
  };
};
```

### Create Component: PhotoEnhancer.jsx

```javascript
// src/components/PhotoEnhancer.jsx

import React, { useState, useRef } from 'react';
import { usePhotoEnhancement } from '../hooks/usePhotoEnhancement';
import { Upload, Image as ImageIcon, Download, Loader } from 'lucide-react';

export const PhotoEnhancer = () => {
  const fileInputRef = useRef(null);
  const [originalImage, setOriginalImage] = useState(null);

  const {
    enhancePhoto,
    isProcessing,
    progress,
    currentStage,
    result,
    error,
  } = usePhotoEnhancement();

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview original
    const preview = URL.createObjectURL(file);
    setOriginalImage(preview);

    // Process
    await enhancePhoto(file);
  };

  const handleDownload = () => {
    if (!result?.image) return;

    // Convert base64 to blob
    const base64 = result.image.split(',')[1];
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `enhanced-product-${Date.now()}.jpg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Studio Photo Enhancer</h1>
      <p className="text-gray-600">
        Transform your product photos into professional studio-quality images.
        <br />
        <span className="text-sm">
          ✨ Fully local processing • Zero cost • 100% private
        </span>
      </p>

      {/* Upload Area */}
      {!isProcessing && !result && (
        <div
          className="border-2 border-dashed border-blue-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto text-blue-500 mb-4" />
          <p className="text-lg font-medium">Click to upload your product photo</p>
          <p className="text-sm text-gray-600 mt-2">
            JPG, PNG • Max 10MB • Any size (auto-resized)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Processing */}
      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 space-y-4">
          <div className="flex items-center gap-3">
            <Loader className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-lg font-medium text-blue-900">
              {currentStage}
            </p>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-blue-700 text-right">{progress}%</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-900">❌ {error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">✨ Enhanced Result</h2>

          {/* Before/After */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2 text-gray-600">Before</p>
              <img
                src={originalImage}
                alt="Original"
                className="w-full rounded-lg border border-gray-200"
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2 text-gray-600">After</p>
              <img
                src={result.image}
                alt="Enhanced"
                className="w-full rounded-lg border border-blue-200 shadow-lg"
              />
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <p>
              <span className="font-medium">Processing Time:</span>{' '}
              {result.metadata.total_time.toFixed(2)}s
            </p>
            <p>
              <span className="font-medium">Complexity:</span>{' '}
              {result.metadata.estimated_complexity}
            </p>
            {result.metadata.edit_plan && (
              <div>
                <p className="font-medium mb-1">Detected Issues:</p>
                <ul className="list-disc list-inside text-gray-700">
                  {result.metadata.edit_plan.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
            <button
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-2 bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              <Upload className="w-5 h-5" />
              Process Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoEnhancer;
```

### Use in App Router

```javascript
// src/App.jsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PhotoEnhancer from './components/PhotoEnhancer';

function App() {
  return (
    <Router>
      <Routes>
        {/* ... other routes ... */}
        <Route path="/studio" element={<PhotoEnhancer />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## Environment Variables

### Backend (.env)

```bash
# AI Engine
AI_ENGINE_URL=http://localhost:8001
AI_ENGINE_TIMEOUT=60000

# Optional: Auth settings
REQUIRE_AUTH_FOR_AI=true
```

### Frontend (.env.local)

```bash
# API endpoint (Node.js backend)
VITE_API_URL=http://localhost:5000

# Or production
VITE_API_URL=https://api.swapsafe.com
```

---

## API Flow Diagram

```
User (React)
    │
    ├─ Select image
    │
    ▼
PhotoEnhancer Component
    │
    ├─ Show upload UI
    ├─ Show progress
    │
    ▼
Express Backend (Node.js)
    │
    ├─ POST /api/ai/enhance-photo-local
    ├─ Authenticate user
    ├─ Validate file
    │
    ▼
Python FastAPI Engine
    │
    ├─ POST /api/v1/studio/v1/studio/process-local
    ├─ Run Plan A pipeline
    │  ├─ BiRefNet
    │  ├─ Qwen VLM
    │  ├─ Compositing
    │  └─ Real-ESRGAN
    │
    ▼
Express Backend (Node.js)
    │
    ├─ Receive result
    ├─ Log analytics
    │
    ▼
React Component
    │
    ├─ Display result
    ├─ Show before/after
    ├─ Offer download
```

---

## Testing the Integration

### Step 1: Start AI Engine

```bash
cd "/Users/badenath/Documents/travel website/marketplace/ai-engine"
python main.py
# Server at http://localhost:8001
```

### Step 2: Start Backend

```bash
cd server
node index.js
# Server at http://localhost:5000
```

### Step 3: Start Frontend

```bash
npm run dev
# Server at http://localhost:3000
# Navigate to /studio
```

### Step 4: Test Upload

1. Go to `http://localhost:3000/studio`
2. Upload a product image
3. Watch progress bar (0-100%)
4. See before/after comparison
5. Download enhanced image

---

## Monitoring & Analytics

### Log Processing Stats

```javascript
// server/routes/ai.js

const analytics = [];

router.post('/enhance-photo-local', async (req, res) => {
  const startTime = Date.now();

  // ... processing ...

  const duration = Date.now() - startTime;

  // Log stats
  analytics.push({
    userId: req.user.id,
    timestamp: new Date(),
    fileName: req.file.originalname,
    duration,
    complexity: res.data.metadata.estimated_complexity,
    success: true,
  });

  // Save to database
  await AnalyticsLog.create({...});

  res.json({...});
});
```

### Admin Dashboard Endpoint

```javascript
// server/routes/admin.js

router.get('/analytics/ai-processing', async (req, res) => {
  const stats = await AnalyticsLog.aggregate([
    {
      $match: { type: 'ai_processing' },
    },
    {
      $group: {
        _id: '$complexity',
        count: { $sum: 1 },
        avgTime: { $avg: '$duration' },
      },
    },
  ]);

  res.json({
    stats,
    totalProcessed: stats.reduce((sum, s) => sum + s.count, 0),
    avgProcessingTime: stats.reduce((sum, s) => sum + s.avgTime, 0) / stats.length,
  });
});
```

---

## Deployment Checklist

- [ ] Environment variables set (.env files)
- [ ] AI Engine can access required models
- [ ] Node.js backend has AI_ENGINE_URL configured
- [ ] Frontend API endpoint correct (VITE_API_URL)
- [ ] SSL certificate for HTTPS (if production)
- [ ] Rate limiting enabled on /api/ai endpoints
- [ ] Error logging configured
- [ ] Analytics database ready
- [ ] File upload size limits set
- [ ] CORS properly configured

---

## Troubleshooting

### "AI Engine not responding"

```bash
# Check if AI Engine is running
curl http://localhost:8001/docs

# Check logs
# Look for 🍎 Device: Apple Silicon detected
```

### "CORS error"

```javascript
// server/index.js - Ensure CORS is configured

const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL,
  ],
  credentials: true,
}));
```

### "File too large"

```javascript
// server/index.js - Set file size limit

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
```

---

## Performance in Production

**Expected:**
- Single request: 11-15 seconds (Plan A)
- Concurrent requests: 1 per Mac (queue others)
- Daily throughput: 5-10k images per Mac
- Monthly cost: $0 (Plan A)

**Scaling:**
- Multiple Macs: Horizontal scaling via load balancer
- Cloud: Migrate to Plan B (cloud GPU) for unlimited scale

---

**✅ Ready for integration!**

Next steps:
1. Install requirements.txt packages
2. Test Plan A locally
3. Integrate with Node.js routes
4. Build React component
5. Deploy to production

