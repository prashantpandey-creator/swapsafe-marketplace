"""
Studio Router - API endpoints for AI-powered product enhancement
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
from app.services.ai_pipeline import pipeline_service
from app.services.stock_service import stock_service
from pydantic import BaseModel

router = APIRouter()

class StockRequest(BaseModel):
    product_name: str

@router.post("/fetch_stock")
async def fetch_stock_image(request: StockRequest):
    """
    Finds a professional stock photo for the product.
    """
    result = stock_service.find_product_image(request.product_name)
    if result:
        return result
    return {"status": "error", "message": "No suitable stock image found"}


@router.post("/generate-3d")
async def generate_3d(
    files: List[UploadFile] = File(...),
    title: str = Form(""),
    category: str = Form(""),
    description: str = Form("")
):
    """
    Generate a 3D model from uploaded product photos.
    
    - Single image: Fast single-view reconstruction (~5-10 seconds)
    - Multiple images: Full photogrammetry reconstruction (~15-30 seconds)
    
    Returns GLB model URL for web 3D viewer.
    """
    try:
        # Read file contents
        images = []
        for file in files:
            content = await file.read()
            images.append(content)
            
        metadata = {
            "title": title,
            "category": category,
            "description": description
        }
        
        result = await pipeline_service.generate_3d_preview(images, metadata)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/showcase")
async def create_showcase(
    file: UploadFile = File(...),
    background: str = Form("white"),  # white, gradient, transparent
    add_shadow: bool = Form(True)
):
    """
    Create a professional e-commerce showcase photo.
    
    1. Removes background from product image
    2. Places on clean white/gradient background
    3. Adds subtle drop shadow for depth
    
    Perfect for Quick Sell single-image uploads.
    """
    try:
        content = await file.read()
        result = await pipeline_service.create_showcase_photo(
            image_bytes=content,
            background=background,
            add_shadow=add_shadow
        )
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enhance")
async def enhance_product(
    file: UploadFile = File(...),
    product_name: str = Form(""),  # Product name for better segmentation context
    reference_image_url: str = Form(""),  # NEW: Reference image from ProductDatabase
    has_exact_match: str = Form("false"),  # NEW: Whether exact product match found
    category: str = Form(""),  # NEW: Product category for styling hints
    mode: str = Form("fast")  # 'fast' (Legacy/OpenCV) or 'pro' (SOTA/Vision)
):
    """
    Quick enhancement for product images.
    Single endpoint that applies all enhancements automatically.
    
    - Background removal (uses product_name for context if provided)
    - White background
    - Professional shadow
    - 1024x1024 output
    
    NEW: If reference_image_url provided (exact product match), uses reference
    for smarter composition and styling.
    """
    import time
    from app.services.vision_service import vision_service
    from PIL import Image
    import io
    import base64
    
    start_time = time.time()
    
    print("")
    print("═" * 60)
    print(f"🎨 PYTHON ENHANCE ENDPOINT CALLED (Mode: {mode})")
    print("═" * 60)
    print(f"📁 File: {file.filename}")
    print(f"📦 product_name: {product_name or '(none)'}")
    print(f"🖼️  reference_url: {reference_image_url[:50] + '...' if reference_image_url else '(none)'}")
    print(f"✓  has_exact_match: {has_exact_match}")
    print(f"📂 category: {category or '(none)'}")
    
    try:
        print("")
        print("📥 Step 1: Reading uploaded file...")
        content = await file.read()
        print(f"   ✅ Read {len(content)} bytes")
        
        # SOTA MODE (VisionService)
        if mode == 'pro':
            print("✨ Running SOTA Vision Pipeline (BiRefNet + IC-Light)...")
            
            # Load Image
            input_image = Image.open(io.BytesIO(content)).convert("RGB")
            
            # 1. Segmentation
            print("   ✂️ Segmenting with BiRefNet...")
            segmented = vision_service.segment_image(input_image)
            
            # 2. Relighting
            print("   💡 Relighting with IC-Light...")
            # Use product name and category for context in relighting prompt
            lighting_prompt = f"professional studio photography of {product_name}, soft lighting, 4k"
            relit_image = vision_service.relight_product(segmented, prompt=lighting_prompt)
            
            # Convert back to Base64/Bytes
            output_buffer = io.BytesIO()
            relit_image.save(output_buffer, format="PNG")
            img_str = base64.b64encode(output_buffer.getvalue()).decode("utf-8")
            
            result = {
                "status": "success",
                "image_data": f"data:image/png;base64,{img_str}",
                "original_image_data": f"data:image/jpeg;base64,{base64.b64encode(content).decode('utf-8')}",
                "dimensions": relit_image.size
            }
            
        else:
            # LEGACY MODE (Fast OpenCV)
            print("⚡ Running Fast Enhancement Pipeline (RemBG + OpenCV)...")
            has_match = has_exact_match.lower() == 'true'
            if has_match and reference_image_url:
                print(f"📦 Using reference image for {product_name}")
            else:
                print(f"📦 No reference - enhancing with context only")
            
            print("")
            print("🎯 Step 2: Calling AI pipeline...")
            result = await pipeline_service.enhance_product_image(
                image_bytes=content,
                product_name=product_name,
                reference_url=reference_image_url if has_match else None,
                category=category
            )
        
        elapsed = time.time() - start_time
        print("")
        print(f"✅ ENHANCEMENT COMPLETE in {elapsed:.2f}s")
        print(f"   - status: {result.get('status')}")
        print(f"   - enhanced_image length: {len(result.get('image_data', ''))}")
        print(f"   - original_image length: {len(result.get('original_image_data', ''))}")
        print("═" * 60)
        print("")
        
        # Return both images for frontend comparison
        return {
            "success": True,
            "image_data": result.get("image_data"),  # Enhanced image
            "original_image_data": result.get("original_image_data"),  # Original for comparison
            "dimensions": result.get("dimensions"),
            "processing_time_ms": int(elapsed * 1000)
        }
        
    except Exception as e:
        import traceback
        print("")
        print("💥 ENHANCEMENT FAILED")
        print(f"   Error: {e}")
        traceback.print_exc()
        print("═" * 60)
        print("")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-image")
async def generate_image(
    file: UploadFile = File(...),
    prompt: str = Form(...)
):
    """
    Generate a lifestyle/marketing image from a product photo.
    Uses enhanced showcase as placeholder (SDXL coming soon).
    """
    try:
        content = await file.read()
        result = await pipeline_service.generate_marketing_image(prompt, content)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Check if the studio service is healthy"""
    return {
        "status": "healthy",
        "services": {
            "showcase": "ready",
            "3d_generation": "ready",
            "marketing_image": "coming_soon"
        }
    }
