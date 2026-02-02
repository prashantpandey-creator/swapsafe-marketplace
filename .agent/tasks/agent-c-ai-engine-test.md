# AGENT-C: AI Engine Direct Test

## Objective
Test Python AI engine directly with a sample image to verify it works, add detailed logging.

## File Lock
- **MODIFY:** `ai-engine/app/routers/studio.py`, `ai-engine/app/services/showcase_service.py`
- **AVOID:** `src/pages/QuickSell.jsx` (Agent A), `server/routes/ai.js` (Agent B)

## Context
Need to verify Python AI engine actually works when called directly, and add logging for debugging.

## Detailed Steps

### 1. Test Endpoint Directly
Create a test command to verify the enhance endpoint:
```bash
# Create a test image and send to AI engine
curl -X POST "http://localhost:8000/api/v1/studio/enhance" \
  -F "file=@/path/to/test/image.jpg" \
  -F "product_name=Test Product"
```

### 2. Add Logging to studio.py /enhance
```python
@router.post("/enhance")
async def enhance_product(
    file: UploadFile = File(...),
    product_name: str = Form(""),
    reference_image_url: str = Form(""),
    has_exact_match: str = Form("false"),
    category: str = Form("")
):
    print("═" * 50)
    print("🎨 ENHANCE ENDPOINT CALLED")
    print("═" * 50)
    print(f"📥 file: {file.filename}, size: {file.size}")
    print(f"📥 product_name: {product_name}")
    print(f"📥 reference_image_url: {reference_image_url[:50] if reference_image_url else 'none'}")
    print(f"📥 has_exact_match: {has_exact_match}")
    print(f"📥 category: {category}")
    
    try:
        content = await file.read()
        print(f"📊 Read {len(content)} bytes from file")
        
        result = await pipeline_service.enhance_product_image(
            image_bytes=content,
            product_name=product_name,
            reference_url=reference_image_url if has_exact_match.lower() == 'true' else None,
            category=category
        )
        
        print(f"✅ Enhancement complete")
        print(f"   - status: {result.get('status')}")
        print(f"   - image_data length: {len(result.get('image_data', ''))}")
        print("═" * 50)
        return result
        
    except Exception as e:
        print(f"💥 ERROR: {e}")
        import traceback
        traceback.print_exc()
        print("═" * 50)
        raise HTTPException(status_code=500, detail=str(e))
```

### 3. Add Logging to showcase_service.py
```python
async def create_showcase(self, image_bytes, background="white", add_shadow=True, output_size=(1024, 1024), product_hint=""):
    print(f"📸 Showcase Service: create_showcase called")
    print(f"   - image_bytes: {len(image_bytes)} bytes")
    print(f"   - background: {background}")
    print(f"   - output_size: {output_size}")
    print(f"   - product_hint: {product_hint}")
    
    try:
        # Step 1: Remove background
        print("✂️ Step 1: Removing background...")
        if self.remove_bg:
            print("   Using rembg...")
            fg_bytes = self.remove_bg(image_bytes)
            print(f"   ✅ Background removed, {len(fg_bytes)} bytes")
        else:
            print("   ⚠️ rembg not available, using original")
        
        # ... rest of steps with similar logging ...
        
    except Exception as e:
        print(f"💥 Showcase error: {e}")
        import traceback
        traceback.print_exc()
        raise
```

## Verification
- Watch AI engine terminal for detailed logs
- Test directly with curl
- Identify if issue is in rembg, PIL, or base64 encoding

## Agent Instructions
Copy this entire content into a new conversation window.
