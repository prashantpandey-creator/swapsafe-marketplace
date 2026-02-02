# TASK-002: AI Enhancement with Reference Images

## Objective
Update AI enhancement to lookup ProductDatabase for reference images when exact model match found.

## File Lock
- **MODIFY:** `server/routes/ai.js`, `ai-engine/app/routers/studio.py`, `ai-engine/app/services/ai_pipeline.py`
- **READ-ONLY:** `server/models/ProductDatabase.js`
- **AVOID:** `src/pages/QuickSell.jsx` (Agent 1), `src/pages/ThreeDStudio.jsx` (Agent 3)

## Context
When a user enters "Apple iPhone 15 Pro", we have reference images in ProductDatabase. The AI should use these for smarter enhancement instead of just removing background blindly.

## Detailed Steps

### 1. Update ai.js /enhance-photo
Add ProductDatabase lookup after receiving brand/model:
```javascript
const { imageData, productName, fileName, brand, model, category } = req.body;

// Lookup product in database
const ProductDatabase = (await import('../models/ProductDatabase.js')).default;
const productMatch = await ProductDatabase.findOne({
    brand: new RegExp(`^${brand}$`, 'i'),
    model: new RegExp(`^${model}$`, 'i')
}).select('referenceImages').lean();

const referenceImageUrl = productMatch?.referenceImages?.hero || null;
```

### 2. Pass Reference to Python
```javascript
formData.append('reference_image_url', referenceImageUrl || '');
formData.append('has_exact_match', referenceImageUrl ? 'true' : 'false');
formData.append('category', category || '');
```

### 3. Update Python studio.py /enhance
Add new parameters:
```python
@router.post("/enhance")
async def enhance_product(
    file: UploadFile = File(...),
    product_name: str = Form(""),
    reference_image_url: str = Form(""),  # NEW
    has_exact_match: str = Form("false"),  # NEW
    category: str = Form("")  # NEW
):
```

### 4. Update ai_pipeline.py
Add reference_url parameter to enhance_product_image()

## Verification
- Test with known product: "Apple iPhone 15 Pro" should log "Found reference image"
- Test with unknown product: should log "using context only"

## Agent Instructions
Copy this entire file and paste into a new agent conversation window to begin this task.
