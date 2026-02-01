"""
Studio Router - API endpoints for AI-powered product enhancement
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
from app.services.ai_pipeline import pipeline_service

router = APIRouter()


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
    product_name: str = Form("")  # Product name for better segmentation context
):
    """
    Quick enhancement for product images.
    Single endpoint that applies all enhancements automatically.
    
    - Background removal (uses product_name for context if provided)
    - White background
    - Professional shadow
    - 1024x1024 output
    """
    try:
        content = await file.read()
        print(f"📦 Enhancing product: {product_name or 'Unknown'}")
        result = await pipeline_service.enhance_product_image(
            image_bytes=content,
            product_name=product_name
        )
        return result
        
    except Exception as e:
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
