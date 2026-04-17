# Plan A Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER APPLICATION                          │
│              (React Frontend / Mobile / API Client)           │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         │ POST /api/v1/studio/v1/studio/process-local
                         │ + image file
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      FASTAPI SERVER                          │
│               (ai-engine/main.py:8001)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Studio Router                                  │ │
│  │  POST /api/v1/studio/v1/studio/process-local           │ │
│  │    ├─ Read uploaded image                              │ │
│  │    ├─ Call local_pipeline.process()                    │ │
│  │    ├─ Convert result to base64                         │ │
│  │    └─ Return JSON response                             │ │
│  └────────────┬───────────────────────────────────────────┘ │
│               │                                              │
│               ▼                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         LocalPipeline Orchestrator                     │ │
│  │  (app/services/local_pipeline.py)                      │ │
│  │                                                        │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │ Phase 1: BiRefNet Segmentation                  │  │ │
│  │  │  Input:  RGB image (512-2048px)                │  │ │
│  │  │  Output: RGBA image (transparent BG)           │  │ │
│  │  │  Memory: 2-3GB | Time: 2-3s                    │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                     ▼                                  │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │ Complexity Heuristic Check                      │  │ │
│  │  │  If simple (>50% product, clean edges):         │  │ │
│  │  │    → Skip Phase 2 (VLM analysis)               │  │ │
│  │  │  Else:                                         │  │ │
│  │  │    → Continue to Phase 2                       │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                     ▼                                  │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │ Phase 2: VLM Analysis (Optional)                │  │ │
│  │  │  Input:  RGB image                             │  │ │
│  │  │  Model:  Qwen-Image-2.0 (7B)                   │  │ │
│  │  │  Output: EditPlan JSON                         │  │ │
│  │  │  - product_name                                │  │ │
│  │  │  - issues (hands, shadows, clutter, etc)       │  │ │
│  │  │  - removals_needed                             │  │ │
│  │  │  - missing_parts                               │  │ │
│  │  │  Memory: 4-6GB | Time: 3-5s                    │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                     ▼                                  │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │ Phase 3: Compositing (PIL/CPU)                 │  │ │
│  │  │  Input:  RGBA image (product + transparency)   │  │ │
│  │  │  Process:                                      │  │ │
│  │  │    1. Create white canvas (1024x1024)          │  │ │
│  │  │    2. Scale product to fit with padding        │  │ │
│  │  │    3. Center and paste with alpha              │  │ │
│  │  │    4. Add drop shadow (optional)               │  │ │
│  │  │  Output: RGB image (product on white BG)       │  │ │
│  │  │  Memory: <0.5GB | Time: 1s                     │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                     ▼                                  │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │ Phase 4: Polish (Real-ESRGAN)                  │  │ │
│  │  │  Input:  RGB image (1024x1024)                 │  │ │
│  │  │  Process:                                      │  │ │
│  │  │    1. Load Real-ESRGAN model (2x upscaling)    │  │ │
│  │  │    2. Upscale to 2048x2048                     │  │ │
│  │  │    3. Enhance contrast and sharpness           │  │ │
│  │  │  Output: High-res RGB image                    │  │ │
│  │  │  Memory: 2-4GB | Time: 3-5s                    │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Response: {
                         │   status: "success",
                         │   image: "data:image/jpeg;base64,..
                         │   metadata: { timing, complexity, ... }
                         │ }
                         │
                         ▼
            ┌──────────────────────────┐
            │   User Sees Result      │
            │ - Professional image    │
            │ - White background      │
            │ - Sharp, crisp details  │
            │ - Studio quality        │
            └──────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────┐
│  Messy JPEG │ (512x512, hand holding guitar, background clutter)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ BiRefNet                            │
│ Input:  RGB (512x512)               │
│ Output: RGBA (512x512, transparent) │
│ Time: 2-3s                          │
└──────┬──────────────────────────────┘
       │ RGBA with transparent background
       │
       ▼
┌─────────────────────────────────────┐
│ Complexity Heuristic                │
│ Check: product_ratio > 50%?         │
└──────┬──────────┬────────────────────┘
       │ Simple   │ Complex
       │          │
       │          ▼
       │   ┌──────────────────────────┐
       │   │ Qwen-Image-2.0 VLM       │
       │   │ Input:  RGB              │
       │   │ Output: EditPlan JSON    │
       │   │ Time: 3-5s               │
       │   └──────┬───────────────────┘
       │          │
       ▼          ▼
┌─────────────────────────────────────┐
│ Compositing (PIL)                   │
│ Input:  RGBA image                  │
│ Step 1: Create white canvas         │
│ Step 2: Scale product to fit        │
│ Step 3: Center and paste            │
│ Step 4: Add drop shadow             │
│ Output: RGB (1024x1024)             │
│ Time: 1s                            │
└──────┬──────────────────────────────┘
       │ RGB on white background
       │
       ▼
┌─────────────────────────────────────┐
│ Real-ESRGAN 2x Upscaler             │
│ Input:  RGB (1024x1024)             │
│ Process: ML upsampling              │
│ Output: RGB (2048x2048)             │
│ Time: 3-5s                          │
│ Fallback: Pillow LANCZOS            │
└──────┬──────────────────────────────┘
       │ High-resolution RGB
       │
       ▼
┌──────────────────────────┐
│  Studio-Quality JPEG     │
│  - Professional looking  │
│  - Sharp details         │
│  - Proper lighting       │
│  - Clean background      │
└──────────────────────────┘
```

---

## Memory Management Strategy

```
Timeline of Memory Usage During Processing

32GB Mac Total RAM

Start:  OS + system cache: 8GB
        Available: 24GB

Phase 1 (BiRefNet Load):
        8GB (OS) + 3GB (BiRefNet) = 11GB used
        Available: 21GB
        ✅ Plenty of headroom

Phase 1 (BiRefNet Process):
        Still: 8GB (OS) + 3GB (BiRefNet)
        Available: 21GB

Phase 1 (BiRefNet Unload):
        8GB (OS) only
        Available: 24GB
        ✅ Memory freed

Phase 2 (Qwen VLM Load):
        8GB (OS) + 6GB (Qwen) = 14GB used
        Available: 18GB
        ✅ Safe, plenty of headroom

Phase 2 (Qwen Process):
        Same: 8GB + 6GB

Phase 2 (Qwen Unload + MPS cache clear):
        8GB (OS) only
        Available: 24GB
        ✅ Memory freed

Phase 3 (Compositing - CPU only):
        8GB (OS) + <0.5GB (PIL) = 8.5GB
        Available: 23.5GB
        ✅ Minimal memory use

Phase 4 (Real-ESRGAN Load):
        8GB (OS) + 4GB (ESRGAN) = 12GB
        Available: 20GB
        ✅ Safe

Phase 4 (Real-ESRGAN Unload):
        8GB (OS) only
        Available: 24GB

Peak Memory Used: 14GB (during Qwen VLM)
Peak Memory Available: 18GB
Safety Margin: 4GB ✅

Max Allowed by PipelineConfig: 16GB
Current Peak: 14GB
Status: ✅ SAFE
```

---

## Service Dependencies

```
LocalPipeline
│
├─ BiRefNetService
│  └─ transformers (AutoModelForImageSegmentation)
│  └─ torch (MPS backend)
│  └─ PIL, numpy, torchvision
│
├─ VLMDirectorService (Qwen-Image-2.0)
│  └─ transformers (Qwen2VLForConditionalGeneration)
│  └─ torch (float16 mode)
│  └─ PIL
│
├─ CompositingService
│  └─ PIL
│  └─ numpy
│  └─ No ML models (CPU only)
│
└─ UpscaleService
   ├─ realesrgan (Real-ESRGAN model)
   ├─ basicsr
   ├─ torch (MPS backend)
   └─ PIL (Pillow fallback)

All services:
├─ psutil (memory monitoring)
├─ gc (garbage collection)
└─ torch (device detection)
```

---

## Class Relationships

```
┌──────────────────────────────────┐
│   BiRefNetService                │
│  ─────────────────────────────   │
│  + model: AutoModel              │
│  + device: str (mps/cuda/cpu)    │
│  + transform: Compose            │
│                                   │
│  + load_model()                  │
│  + remove_background() → RGBA    │
│  + _cleanup_mask()               │
│  + _rembg_remove() [fallback]    │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│   VLMDirectorService             │
│  ─────────────────────────────   │
│  + model: Qwen2VL                │
│  + processor: AutoProcessor      │
│  + device: str                   │
│                                   │
│  + load_model()                  │
│  + analyze() → EditPlan          │
│  + _fallback_analysis()          │
│  + _build_inpaint_prompt()       │
│  + unload()                      │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│   CompositingService             │
│  ─────────────────────────────   │
│  + device: str (cpu always)      │
│                                   │
│  + place_on_white_background()   │
│  + add_drop_shadow()             │
│  + center_and_pad()              │
│  + adjust_white_balance()        │
│  + add_vignette()                │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│   UpscaleService                 │
│  ─────────────────────────────   │
│  + _upsampler: RealESRGANer      │
│  + _initialized: bool            │
│                                   │
│  + _ensure_initialized()         │
│  + enhance() → Image [NEW]       │
│  + _fit_to_size()                │
│  + _enhance_image()              │
│  + cleanup() [NEW]               │
└──────────────────────────────────┘

┌──────────────────────────────────────────┐
│   LocalPipeline                          │
│  ────────────────────────────────────   │
│  + birefnet: BiRefNetService            │
│  + vlm: VLMDirectorService              │
│  + compositing: CompositingService      │
│  + upscaler: UpscaleService             │
│  + config: PipelineConfig               │
│  + device: str                          │
│                                         │
│  + process() → (Image, dict)            │
│  + _estimate_complexity() → str         │
│  + _check_memory() → bool               │
│  + _log_memory()                        │
│  + cleanup()                            │
└──────────────────────────────────────────┘
         │
         │ orchestrates
         │
         ├─→ BiRefNetService
         ├─→ VLMDirectorService
         ├─→ CompositingService
         └─→ UpscaleService
```

---

## API Response Structure

```
{
  "status": "success|error",

  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",

  "metadata": {
    "total_time": 11.35,
    "success": true,

    "stages": {
      "segmentation": 2.15,      # BiRefNet
      "analysis": 4.50,          # Qwen VLM (0 if skipped)
      "compositing": 0.85,       # White BG + shadow
      "upscaling": 3.45          # Real-ESRGAN
    },

    "estimated_complexity": "medium",

    "edit_plan": {
      "product": "Guitar",
      "issues": ["hand occluding neck"],
      "removals": ["hand"],
      "complexity": "medium"
    }
  },

  "message": "✅ Complete in 11.35s (fully local, zero cost)"
}
```

---

## Error Handling Flow

```
Input Image
    │
    ├─ BiRefNet fails
    │  └─ Fallback: rembg (simpler model)
    │
    ├─ Qwen VLM fails
    │  └─ Fallback: rule-based analysis
    │
    ├─ Compositing fails
    │  └─ Return original image
    │
    ├─ Real-ESRGAN fails
    │  └─ Fallback: Pillow LANCZOS upscaling
    │
    ├─ Memory exhausted
    │  └─ Return last successful stage
    │
    └─ Any critical error
       └─ Return original image + error metadata
           "success": false
```

---

## Complexity Decision Tree

```
Input Image
    │
    ▼
Extract product via BiRefNet
    │
    ├─ Product area > 50% of image?
    │  │
    │  ├─ YES → Product well-framed
    │  │  │
    │  │  └─ Complexity = SIMPLE ✅
    │  │     (Skip VLM, fast path)
    │  │
    │  └─ NO → Continue checking
    │
    ├─ Product area 10-50%?
    │  │
    │  ├─ YES → Medium framing
    │  │  │
    │  │  └─ Complexity = MEDIUM
    │  │     (Run VLM analysis)
    │  │
    │  └─ NO → Continue checking
    │
    └─ Product area < 10%?
       │
       └─ YES → Complexity = COMPLEX
          (Run VLM analysis, may need manual touch-up)
```

---

## Deployment Architecture (Future)

```
┌─────────────────────────────┐
│  Node.js Express Backend    │
│  (server/routes/ai.js)      │
├─────────────────────────────┤
│  POST /api/ai/enhance-photo │
│  - Validates auth           │
│  - Forwards to AI Engine    │
│  - Stores result in S3      │
│  - Returns signed URL       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Python FastAPI Engine      │
│  (ai-engine/main.py)        │
├─────────────────────────────┤
│  POST /api/v1/studio/v1...  │
│  - Plan A (local)           │
│  - Plan B (cloud)           │
│  - Plan C (external APIs)   │
└──────────────┬──────────────┘
               │
               ├─ Plan A: Local only
               │  (this implementation)
               │
               ├─ Plan B: Cloud 3D
               │  (future: HF Spaces)
               │
               └─ Plan C: External
                  (future: Claid.ai, Photoroom)

┌─────────────────────────────┐
│  React Frontend             │
│  (src/pages/StudioMode.jsx) │
├─────────────────────────────┤
│  - File upload              │
│  - Progress tracking        │
│  - Before/after comparison  │
│  - Result display           │
└─────────────────────────────┘
```

---

## Performance Optimization Roadmap

```
Current (Plan A v1.0): 11.35s

Potential Improvements:

1. Model Quantization (-2s)
   ├─ Qwen-Image-2.0 → int8 quantization
   └─ 4.50s → 2.50s

2. Faster Upscaling (-1s)
   ├─ Real-ESRGAN-x2-slim (instead of x2+)
   └─ 3.45s → 2.45s

3. Batch Processing (-60%)
   ├─ Process multiple images in parallel
   └─ Per image cost: 11.35s / 5 = 2.27s

4. Cache Preprocessing (N/A)
   ├─ Models already loaded on first run
   └─ Subsequent images: 5-7s (skip model loading)

Target v2.0 Performance:
├─ Single image: 8-10s (quantization + faster upscaling)
├─ Cached (no reload): 5-7s
└─ Batch 10 images: 30-40s total (3-4s per image)
```

---

**This architecture ensures:**
✅ Reliability (fallbacks at each stage)
✅ Efficiency (sequential loading, minimal memory)
✅ Scalability (stateless, parallelizable)
✅ User Experience (fast, informative feedback)
