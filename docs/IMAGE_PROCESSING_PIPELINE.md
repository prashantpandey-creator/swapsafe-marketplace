# Image Processing Pipeline – Current State

> **Source:** Traced from MD checkpoints (AI_STRATEGY.md, task-002-ai-enhance.md, HAND_REMOVAL_CONTEXT.md, PROJECT_STATUS.md), `studio.py`, `ai_pipeline.py`, `showcase_service.py`, `vision_service.py`, `server/routes/ai.js`, and frontend hooks/pages.  
> **Last analyzed:** 2026-02-11

---

## 1. High-Level Flow

```
Frontend (QuickSell / CreateListing / StudioMode)
    → POST /api/ai/enhance-photo (Node)
        → Optional: ProductDatabase lookup (brand/model → reference_image_url)
        → Proxy to AI Engine: POST /api/v1/studio/enhance (Python)
            → mode='fast'  → AiPipelineService.enhance_product_image() → ShowcaseService
            → mode='pro'   → VisionService.relight_product() [then optional showcase]
        ← JSON { image_data (base64), ... } or binary (if Python returns Response)
    ← Backend returns JSON { success, image_data, ... } (always JSON from Node)
```

**Entry points:**
- **QuickSell:** `enhancePhoto()` → `POST /api/ai/enhance-photo` → expects `response.json()` and `result.image_data`.
- **CreateListing / PhotoUploadZone:** `usePhotoEnhancement().enhancePhoto()` → same endpoint → uses `response.blob()` (see inconsistency below).
- **StudioMode / 3D Studio:** Can call same enhance or other studio endpoints (showcase, generate-3d, etc.).

---

## 2. Backend Proxy (Node) – `server/routes/ai.js`

| Step | What happens |
|------|----------------------|
| 1 | `POST /api/ai/enhance-photo` with `upload.fields([file, secondary_files])`. |
| 2 | Reads `productName`, `brand`, `model`, `category`, `mode` from body. |
| 3 | **Reference lookup:** If `brand` + `model` present, queries `ProductDatabase` for `referenceImages.hero` / `.front` → `referenceImageUrl`, `has_exact_match`. |
| 4 | Builds FormData: `file`, `secondary_files`, `product_name`, `reference_image_url`, `has_exact_match`, `category`, `mode`. |
| 5 | Proxies to `AI_ENGINE_URL/api/v1/studio/enhance`. |
| 6 | On success: returns **JSON** `{ success, image_data, enhanced, product_matched, reference_used, processing_time_ms }`. |
| 7 | **Fallback:** If AI engine fails and `mode === 'fast'` or `ECONNREFUSED`, returns same JSON with original image as base64 and `enhanced: false`. |

**Important:** The backend **always** responds with JSON. It does not stream or return raw binary for enhance-photo.

---

## 3. AI Engine – `ai-engine/app/routers/studio.py` – `/enhance`

| Step | What happens |
|------|----------------------|
| 1 | Receives: `file`, `secondary_files`, `product_name`, `reference_image_url`, `has_exact_match`, `category`, `mode` (default `"fast"`), `return_binary`. |
| 2 | Loads primary image: `Image.open(io.BytesIO(content)).convert("RGB")`. |
| 3 | **Branch on `mode`:** |

### 3a. `mode === 'pro'` (SOTA / “Enterprise”)

- **Scenario routing:**
  - **Scenario 3 – Visual context:** `reference_image_url` and `has_exact_match === 'true'` → prompt includes “matching official stock catalog style”.
  - **Scenario 2 – Semantic context:** `product_name` set → “professional commercial studio setup” + product name.
  - **Scenario 1 – Image only:** else → “commercial product photography”.
- **Execution:** `vision_service.relight_product(input_image, prompt=lighting_prompt, debug_prefix=...)`.
- **Current implementation:** `vision_service.relight_product()` is a **stub** – it returns `input_image` unchanged (see `vision_service.py`). No actual relighting/IC-Light/diffusion yet.
- **Response:** PNG as base64 in JSON, or if `return_binary` True, `Response(content=decoded, media_type="image/png")` (binary).

### 3b. `mode === 'fast'` (default – “Fast Enhancement”)

- Calls `pipeline_service.enhance_product_image(image_bytes=content, product_name, reference_url=..., category)`.
- That delegates to **ShowcaseService** (see below); no VisionService.

**Downstream:** Fast path = **ShowcaseService** only. Pro path = **VisionService** (stub) only; no post-showcase/upscale in the single-image `/enhance` flow.

---

## 4. ShowcaseService – `ai-engine/app/services/showcase_service.py`

**Used by:** `AiPipelineService.enhance_product_image()` (fast enhance) and `create_showcase_photo()` (showcase endpoint + marketing “Quantum Portal” post-step).

| Step | What happens |
|------|----------------------|
| **A** | **Background removal:** `rembg.remove(..., model_name="isnet-general-use", alpha_matting=True, ...)` → RGBA. |
| **A.5** | **Upscale (if `apply_upscale` and background ≠ transparent):** Keep alpha, composite RGB on white/matte, call `upscale_service.upscale_image()` (Real-ESRGAN 4x or Pillow fallback), then restore alpha at new size. |
| **B** | **Background:** White, gradient, or transparent canvas (e.g. 1024×1024). |
| **C** | **Fit & center:** `_fit_to_canvas(fg_image, output_size, padding=0.1)`. |
| **D** | **Shadow (if add_shadow and not transparent):** `_create_shadow()` from alpha, offset, Gaussian blur, composite. |
| **E** | **Composite** foreground onto background. |
| **F** | Encode to JPEG/PNG, base64, return `{ status, image_data, dimensions [, original_image_data ] }`. |

So the **current image processing pipeline** for the default “fast” path is:

**rembg (isnet-general-use) → optional Real-ESRGAN upscale → white/gradient BG + shadow + composite → base64.**

---

## 5. Other Services (Not in Default Enhance Path)

- **VisionService** (`vision_service.py`): CLIPSeg for text-based masks; `relight_product()` is stub (returns input). Intended for “pro” relighting later.
- **AiPipelineService.generate_marketing_image():** Uses VisionService.relight + **then** ShowcaseService (rembg + upscale) for “2D Studio” marketing shots; not used by single-image `/enhance`.
- **UpscaleService** (`upscale_service.py`): Real-ESRGAN 4x or Pillow fallback; used only inside ShowcaseService when `apply_upscale=True`.
- **Stock / reference:** `reference_image_url` is passed to Python but in `studio.py` **pro** path it only influences the **prompt** (e.g. “matching official stock catalog style”); the reference image is not downloaded or fed into VisionService in the current code.
- **Hand removal / inpainting:** Documented in `HAND_REMOVAL_CONTEXT.md` (LaMa, SAM, Gemini, etc.); not part of the current production enhance pipeline.

---

## 6. Strategy vs Implementation (from AI_STRATEGY.md)

- **Layer C (server/brain):** JSON-only “VisualPlan”; no pixel work. Partially reflected in “context” and “scenario” routing (product name, reference flag) and JSON payloads; no formal VisualPlan schema.
- **Layer B (network):** No binary over the boundary is the goal; in practice the proxy sends FormData (including image bytes) to the AI engine, and the engine returns base64 or binary. So images do cross the boundary between Node and Python.
- **Layer A (client/local):** Intended to be local SDXL/Turbo; currently all enhancement runs in the **Python AI engine** (rembg, upscale, and in future relighting), not in the browser.

---

## 7. Frontend Consistency Issue

- **QuickSell** and any caller that uses `response.json()` and `result.image_data` match the backend (which always returns JSON with base64 `image_data`).
- **usePhotoEnhancement** (used by CreateListing/PhotoUploadZone) does `const blob = await response.blob()` and then `URL.createObjectURL(blob)`. Since the server returns **JSON**, that blob is the JSON string; the object URL will not display as an image. **Recommendation:** In the hook, use `response.json()`, then decode `result.image_data` (base64) to a blob and create the object URL from that, so behavior matches QuickSell and the backend contract.

---

## 8. Summary Table

| Stage | Component | Role |
|-------|-----------|------|
| 1 | Frontend | Upload image, optional productName/category; QuickSell also brand/model. Calls `POST /api/ai/enhance-photo`. |
| 2 | Node `ai.js` | ProductDatabase lookup (reference URL), build FormData, proxy to Python `/api/v1/studio/enhance`. Always returns JSON. |
| 3 | Python `studio.py` | Route by `mode`: **pro** → VisionService.relight (stub); **fast** → pipeline.enhance_product_image() → ShowcaseService. |
| 4 | ShowcaseService | rembg (isnet-general-use) → optional upscale (Real-ESRGAN) → white BG + shadow + composite → base64. |
| 5 | VisionService (pro) | relight_product() currently returns input unchanged; future: IC-Light / diffusion relighting. |

**Effective pipeline for default “fast” mode:**  
**Image → Node proxy → Python → rembg (BG remove) → [optional upscale] → white BG + shadow → base64 → JSON → Frontend.**

Reference images from ProductDatabase are only used to set a “reference style” prompt in **pro** mode; the actual reference image is not loaded or used in the current implementation.
