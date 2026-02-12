"""
Studio Router - API endpoints for AI-powered product enhancement
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
from app.services.ai_pipeline import pipeline_service
from app.services.stock_service import stock_service
from pydantic import BaseModel

router = APIRouter()

@router.post("/fetch_stock")
async def fetch_stock_image(
    product_name: str = Form(...),
    return_binary: bool = Form(True)
):
    """
    Finds a professional stock photo for the product.
    """
    import base64
    from fastapi.responses import Response

    result = stock_service.find_product_image(product_name)
    if result:
        if return_binary:
            # Decode the base64 string provided by service
            # Format: "data:image/jpeg;base64,......"
            b64_str = result["image_data"].split(",")[1]
            b64_str = result["image_data"].split(",")[1]
            return Response(content=base64.b64decode(b64_str), media_type="image/jpeg", headers={
                "Content-Disposition": "inline; filename=stock.jpg",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache", 
                "Expires": "0"
            })
        return result
        
    return {"status": "error", "message": "No suitable stock image found"}


@router.get("/stock_view")
async def view_stock_image(product_name: str):
    """
    Browser-friendly endpoint to view stock image directly.
    Usage: /api/v1/studio/stock_view?product_name=JBL%20Soundbar
    """
    import base64
    from fastapi.responses import Response

    result = stock_service.find_product_image(product_name)
    if result:
        b64_str = result["image_data"].split(",")[1]
        return Response(content=base64.b64decode(b64_str), media_type="image/jpeg", headers={
            "Content-Disposition": "inline; filename=stock.jpg",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache", 
            "Expires": "0"
        })
        
    raise HTTPException(status_code=404, detail="Stock image not found")


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
    add_shadow: bool = Form(True),
    return_binary: bool = Form(True)
):
    """
    Create a professional e-commerce showcase photo.
    """
    import base64
    from fastapi.responses import Response

    try:
        content = await file.read()
        result = await pipeline_service.create_showcase_photo(
            image_bytes=content,
            background=background,
            add_shadow=add_shadow
        )
        
        if return_binary:
            try:
                # Format: "data:image/png;base64,......"
                b64_str = result["image_data"].split(",")[1]
                return Response(content=base64.b64decode(b64_str), media_type="image/png", headers={
                    "Content-Disposition": "inline; filename=showcase.png",
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache", 
                    "Expires": "0"
                })
            except:
                pass # Fallback to JSON if parsing fails
                
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enhance")
async def enhance_product(
    file: UploadFile = File(...),
    secondary_files: List[UploadFile] = File([]),
    product_name: str = Form(""),
    reference_image_url: str = Form(""),
    has_exact_match: str = Form("false"),
    category: str = Form(""),
    mode: str = Form("fast"),
    debug_id: Optional[str] = Form(None),
    return_binary: bool = Form(True)
):
    """
    Enhanced SOTA Pipeline with Multi-Photo Context and Identity Locking.
    """
    import time
    from app.services.vision_service import vision_service
    from fastapi.responses import Response
    from PIL import Image
    import io
    import base64
    
    start_time = time.time()
    
    print("")
    print("═" * 60)
    print(f"🎨 PYTHON ENHANCE ENDPOINT CALLED (Mode: {mode})")
    print(f"🆔 Debug ID: {debug_id or 'none'}")
    print("═" * 60)
    
    try:
        content = await file.read()
        input_image = Image.open(io.BytesIO(content)).convert("RGB")
        
        # 1. Context Aggregation
        context_description = f"authentic {product_name}" if product_name else "product"
        
        # SOTA MODE (VisionService with Identity Lock)
        if mode == 'pro':
            print("✨ Running Enterprise SOTA Pipeline (Amazon-Style)...")
            
            # Scenario Router
            workflow_case = "1. Image-Only"
            reference_style_image = None
            
            # Scenario 3: Visual Context (Stock Proxy)
            if reference_image_url and has_exact_match.lower() == 'true':
                workflow_case = "3. Visual-Context (Stock)"
                print(f"🔗 Scenario 3 ACTIVE: Using reference style from {reference_image_url}")
                # In a full v3 implementation, we would download and pass this to VisionService
                # For now, we use the name-infused prompt with "Amazon-style" keywords
                lighting_prompt = f"{product_name or 'product'}, matching official stock catalog style, high-key lighting"
            
            # Scenario 2: Semantic Context (Name)
            elif product_name:
                workflow_case = "2. Semantic-Context (Name)"
                print(f"📝 Scenario 2 ACTIVE: Name-Infused Context for {product_name}")
                lighting_prompt = f"{product_name}, professional commercial studio setup"
            
            # Scenario 1: Zero Context (Image Only)
            else:
                workflow_case = "1. Zero-Context (Image Only)"
                print("⚡ Scenario 1 ACTIVE: Generic Commercial Context")
                lighting_prompt = "commercial product photography"

            print(f"🏗️  Executing Workflow: {workflow_case}")
            
            # Execution with VisionService (Amazon-Style prompt is appended in VisionService)
            relit_image = vision_service.relight_product(
                input_image, 
                prompt=lighting_prompt,
                debug_prefix=debug_id
            )            # Convert back to Base64
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
            # LEGACY MODE
            print("⚡ Running Fast Enhancement Pipeline...")
            result = await pipeline_service.enhance_product_image(
                image_bytes=content,
                product_name=product_name,
                reference_url=reference_image_url if has_exact_match.lower() == 'true' else None,
                category=category
            )
        
        elapsed = time.time() - start_time
        print(f"✅ ENHANCEMENT COMPLETE in {elapsed:.2f}s")
        
        if return_binary and result.get("image_data"):
            try:
                b64_str = result["image_data"].split(",")[1]
                return Response(content=base64.b64decode(b64_str), media_type="image/png", headers={
                    "Content-Disposition": "inline; filename=result.png",
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache", 
                    "Expires": "0"
                })
            except:
                pass

        return {
            "success": True,
            "image_data": result.get("image_data"),
            "original_image_data": result.get("original_image_data"),
            "dimensions": result.get("dimensions"),
            "processing_time_ms": int(elapsed * 1000)
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enhance_multi")
async def enhance_multi_product(
    files: List[UploadFile] = File(...),
    product_name: str = Form(""),
    debug_id: Optional[str] = Form(None),
    return_binary: bool = Form(True)
):
    """
    SOTA v5.0: Multi-Shot Product Learning Endpoint.
    - files[0]: The 'Hero' image (Geometric Reference)
    - files[1...N]: Context images for IP-Adapter (Texture/Identity Source)
    """
    import time
    from app.services.vision_service import vision_service
    from fastapi.responses import Response
    from PIL import Image
    import io
    import base64
    
    start_time = time.time()
    print("")
    print("═" * 60)
    print(f"🧬 PYTHON ENHANCE_MULTI CALLED ({len(files)} images)")
    print(f"🆔 Debug ID: {debug_id or 'none'}")
    print("═" * 60)
    
    try:
        if len(files) < 1:
            raise HTTPException(400, "At least one image is required")
            
        # 1. Read Main Image
        content_main = await files[0].read()
        main_image = Image.open(io.BytesIO(content_main)).convert("RGB")
        
        # 2. Read Reference Images (including main image for self-reinforcement)
        reference_images = []
        for file in files:
            await file.seek(0) # Safety
            c = await file.read()
            img = Image.open(io.BytesIO(c)).convert("RGB")
            reference_images.append(img)
            
        print(f"   🧠 Loaded {len(reference_images)} images for Multi-Shot Context")
        
        # 3. Enhance
        lighting_prompt = f"{product_name or 'product'}, professional commercial studio setup"
        
        relit_image = vision_service.relight_product(
            main_image, 
            prompt=lighting_prompt,
            reference_images=reference_images,
            debug_prefix=debug_id
        )
        
        # Output
        output_buffer = io.BytesIO()
        relit_image.save(output_buffer, format="PNG")
        
        elapsed = time.time() - start_time
        print(f"✅ MULTI-SHOT ENHANCEMENT COMPLETE in {elapsed:.2f}s")
        
        if return_binary:
            return Response(content=output_buffer.getvalue(), media_type="image/png", headers={
                "Content-Disposition": "inline; filename=enhanced_result.png",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache", 
                "Expires": "0"
            })
        
        img_str = base64.b64encode(output_buffer.getvalue()).decode("utf-8")
        
        return {
            "success": True,
            "image_data": f"data:image/png;base64,{img_str}",
            "processing_time_ms": int(elapsed * 1000)
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-image")
async def generate_image(
    file: UploadFile = File(...),
    reference_image: Optional[UploadFile] = File(None), # NEW: 1-Shot Upload
    prompt: str = Form(...),
    product_name: str = Form(""),
    return_binary: bool = Form(True)
):
    """
    Generate a lifestyle/marketing image from a product photo.
    Supports 1-Shot Style Transfer via 'reference_image'.
    """
    import base64
    from fastapi.responses import Response

    try:
        content = await file.read()
        
        # Read Reference if provided
        ref_bytes = None
        if reference_image:
            ref_bytes = await reference_image.read()
            
        result = await pipeline_service.generate_marketing_image(
            prompt, 
            content, 
            product_name=product_name,
            reference_image_bytes=ref_bytes
        )
        
        if return_binary and isinstance(result, dict) and "image_data" in result:
            try:
                b64_str = result["image_data"].split(",")[1]
                return Response(content=base64.b64decode(b64_str), media_type="image/png", headers={
                    "Content-Disposition": "inline; filename=marketing_gen.png",
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache", 
                    "Expires": "0"
                })
            except:
                pass

        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-turbo")
async def generate_turbo_image(
    file: UploadFile = File(...),
    prompt: str = Form(...),
    strength: float = Form(0.5),
    return_binary: bool = Form(True)
):
    """
    ULTRA-FAST Z-Turbo Generation (1-Step SDXL Turbo).
    Target: < 1 second latency.
    """
    import base64
    from fastapi.responses import Response
    from app.services.turbo_service import turbo_service
    from PIL import Image
    import io

    try:
        content = await file.read()
        input_image = Image.open(io.BytesIO(content)).convert("RGB")
        
        # Run Turbo Pipeline
        result_image = turbo_service.generate(input_image, prompt, strength)
        
        # Return
        output_buffer = io.BytesIO()
        result_image.save(output_buffer, format="JPEG", quality=85)
        
        if return_binary:
             return Response(content=output_buffer.getvalue(), media_type="image/jpeg")
             
        img_str = base64.b64encode(output_buffer.getvalue()).decode("utf-8")
        return {"image_data": f"data:image/jpeg;base64,{img_str}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/qwen-edit")
async def qwen_edit_image(
    file: UploadFile = File(...),
    prompt: str = Form(...),
    return_binary: bool = Form(True)
):
    """
    Qwen-Image-Edit-2509 Pipeline.
    Instruction-based Image Editing.
    """
    import base64
    from fastapi.responses import Response
    from app.services.qwen_service import qwen_service
    from PIL import Image
    import io

    try:
        content = await file.read()
        input_image = Image.open(io.BytesIO(content)).convert("RGB")
        
        # Run Qwen Pipeline
        # Prompt acts as "Instruction" (e.g. "Add a cat", "Make it sunny")
        result_image = qwen_service.edit(input_image, prompt)
        
        # Return
        output_buffer = io.BytesIO()
        result_image.save(output_buffer, format="JPEG", quality=90)
        
        if return_binary:
             return Response(content=output_buffer.getvalue(), media_type="image/jpeg")
             
        img_str = base64.b64encode(output_buffer.getvalue()).decode("utf-8")
        return {"image_data": f"data:image/jpeg;base64,{img_str}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-3d-plan-b")
async def process_plan_b(
    file: UploadFile = File(...),
    angles: str = Form("front,side,back"),
    add_shadow: bool = Form(True),
    upscale: bool = Form(True),
    return_binary: bool = Form(True)
):
    """
    Plan B: 3D Reconstruction + Multi-Angle Rendering.

    Uses Replicate TripoSR API to generate 3D mesh, then renders from multiple angles.
    Naturally removes occlusions (hands, packaging) because they don't become part of 3D mesh.

    Args:
        file: Product image (any background)
        angles: Comma-separated angle names (front, side, back, top, 3/4)
        add_shadow: Add professional drop shadow
        upscale: Apply Real-ESRGAN upscaling
        return_binary: Return as image file or JSON

    Returns:
        Multiple images (one per angle) as binary or base64-encoded JSON
    """
    import time
    import base64
    from fastapi.responses import Response
    from PIL import Image
    import io
    from app.services.plan_b_pipeline import plan_b_pipeline

    start_time = time.time()

    print("\n" + "=" * 70)
    print("📱 Plan B API Endpoint Called")
    print("=" * 70)

    try:
        # Read image
        content = await file.read()
        image = Image.open(io.BytesIO(content)).convert("RGB")

        # Parse angles
        angle_list = [a.strip() for a in angles.split(",")]
        print(f"   📐 Angles: {angle_list}")

        # Process through Plan B
        rendered_views, metadata = await plan_b_pipeline.process(
            image,
            angles=angle_list,
            add_shadow=add_shadow,
            upscale=upscale
        )

        elapsed = time.time() - start_time
        metadata["api_time"] = elapsed

        # Return format depends on request
        if return_binary and len(angle_list) == 1:
            # Single image: return as binary
            single_angle = angle_list[0]
            img = rendered_views[single_angle]

            output_buffer = io.BytesIO()
            img.save(output_buffer, format="JPEG", quality=95)
            output_buffer.seek(0)

            return Response(
                content=output_buffer.getvalue(),
                media_type="image/jpeg",
                headers={
                    "X-Plan": "B",
                    "X-Cost": f"${metadata['cost']:.2f}",
                    "X-Total-Time": f"{elapsed:.1f}s"
                }
            )

        # Multiple images or JSON return: base64 JSON
        views_b64 = {}
        for angle, img in rendered_views.items():
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=95)
            b64_data = base64.b64encode(buffer.getvalue()).decode()
            views_b64[angle] = f"data:image/jpeg;base64,{b64_data}"

        return {
            "status": "success",
            "plan": "B",
            "views": views_b64,
            "metadata": metadata,
            "cost": metadata.get("cost", 0.05),
            "total_time": elapsed,
            "angles": angle_list
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Check if the studio service is healthy"""
    return {
        "status": "healthy",
        "services": {
            "showcase": "ready",
            "3d_generation": "ready",
            "marketing_image": "coming_soon",
            "plan_b_3d": "ready"
        }
    }
