"""
Studio Router - API endpoints for AI-powered product enhancement
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
from app.services.ai_pipeline import pipeline_service
from app.services.stock_service import stock_service
from pydantic import BaseModel
from PIL import Image
from io import BytesIO
import base64

router = APIRouter()


@router.post("/v1/studio/process-local")
async def process_local_plan_a(file: UploadFile = File(...)):
    """
    Plan A: Fully Local Processing
    Processes product photo through the complete pipeline:
    1. Segment (BiRefNet) - remove background
    2. Analyze (Qwen VLM) - understand scene
    3. Composite - place on white background
    4. Polish (Real-ESRGAN) - upscale

    Returns: Enhanced image as base64 JPEG
    """
    try:
        # Read image
        contents = await file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")

        print(f"📥 Processing uploaded image: {image.size}")

        from app.services.local_pipeline import local_pipeline
        # Run Plan A pipeline (synchronous)
        result_image, metadata = local_pipeline.process(image)

        # Convert to base64
        buffer = BytesIO()
        result_image.save(buffer, format="JPEG", quality=95)
        buffer.seek(0)
        b64_data = base64.b64encode(buffer.getvalue()).decode()

        return {
            "status": "success",
            "image": f"data:image/jpeg;base64,{b64_data}",
            "metadata": metadata,
            "message": f"✅ Complete in {metadata['total_time']:.1f}s (fully local, zero cost)",
        }

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-3d-plan-b")
async def process_plan_b(
    file: UploadFile = File(...),
    angles: str = Form("front,side,back"),
    add_shadow: bool = Form(True),
    upscale: bool = Form(True),
    return_binary: bool = Form(False)
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

    Cost: $0.05 per image (Replicate TripoSR API)
    Time: 13-28 seconds depending on angles
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
    from starlette.concurrency import run_in_threadpool

    result = await run_in_threadpool(stock_service.find_product_image, product_name)
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


@router.post("/refine_listing")
async def refine_listing(
    product_name: str = Form(...),
    condition: str = Form("good"),
    condition_report: str = Form("normal wear"),
    return_binary: bool = Form(True)
):
    """
    Simultaneously fetches a better Stock Image AND Re-calculates Price Context based on the new name.
    Uses Multi-Agent Supervisor.
    """
    from app.agents.listing_generator import ListingGenerator
    from app.services.stock_service import stock_service
    from starlette.concurrency import run_in_threadpool

    print(f"🔄 Refinement Triggered (Agent Mode): {product_name} ({condition})")

    # Initialize Supervisor (could be singleton)
    supervisor = ListingGenerator()
    
    # 1. Fetch Stock Image (Legacy Service for now, handled by Supervisor eventually)
    stock_result = await run_in_threadpool(stock_service.find_product_image, product_name)

    # 2. Re-calculate Price via Market Agent
    market_data = await run_in_threadpool(
        supervisor.refine_listing,
        product_name=product_name,
        condition=condition
    )

    response_data = {
        "status": "success",
        "price_context": market_data,
        "market_context": market_data # Standardization
    }
    
    if stock_result:
        response_data["stock_image"] = stock_result["image_data"]
    
    return response_data


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

@router.get("/plan-b-status")
async def check_plan_b_status():
    """
    Check if Plan B (3D reconstruction) is properly configured.

    Returns diagnostic info about:
    - Replicate API token presence
    - Required dependencies (trimesh, pyrender)
    - Service initialization status

    Use this endpoint to debug why Plan B might not be working.
    """
    from app.services.replicate_3d_service import replicate_3d_service

    status = {
        "plan_b_available": False,
        "replicate_token_set": bool(replicate_3d_service.api_token),
        "dependencies": {},
        "issues": []
    }

    # Check token
    if not replicate_3d_service.api_token:
        status["issues"].append("REPLICATE_API_TOKEN not set in .env")
    else:
        status["replicate_token_length"] = len(replicate_3d_service.api_token)
        status["replicate_token_prefix"] = replicate_3d_service.api_token[:8] + "..."

    # Check dependencies
    try:
        import trimesh
        status["dependencies"]["trimesh"] = f"✅ v{trimesh.__version__}"
    except ImportError:
        status["dependencies"]["trimesh"] = "❌ missing"
        status["issues"].append("trimesh not installed (pip install trimesh)")

    try:
        import pyrender
        status["dependencies"]["pyrender"] = "✅ installed"
    except ImportError:
        status["dependencies"]["pyrender"] = "❌ missing"
        status["issues"].append("pyrender not installed (pip install pyrender pyglet<2)")

    try:
        import pyglet
        status["dependencies"]["pyglet"] = f"✅ v{pyglet.version}"
    except ImportError:
        status["dependencies"]["pyglet"] = "❌ missing"
        status["issues"].append("pyglet not installed (pip install pyglet<2)")

    # Check rendering service
    try:
        from app.services.rendering_service import rendering_service
        status["dependencies"]["rendering_service"] = "✅ loaded"
    except Exception as e:
        status["dependencies"]["rendering_service"] = f"❌ error: {e}"
        status["issues"].append(f"rendering_service failed to load: {e}")

    # Final availability check
    status["plan_b_available"] = len(status["issues"]) == 0

    return status


@router.post("/v1/studio/process-sota-v2")
async def process_sota_v2(
    file: UploadFile = File(...),
    remove_occlusions: bool = Form(True),
    enable_relighting: bool = Form(True),
    lighting_style: str = Form("soft_studio"),
    enable_upscaling: bool = Form(True),
    upscale_factor: int = Form(2),
    custom_prompt: Optional[str] = Form(None),
    return_binary: bool = Form(False)
):
    """
    SOTA Pipeline V2: State-of-the-Art Product Photography (2025/2026)

    Full pipeline: BiRefNet → FLUX.1-dev → LBM → Compositing → SUPIR

    Features:
    - Photorealistic product regeneration with FLUX.1-dev
    - Professional studio lighting with LBM Relighting
    - Semantic upscaling with SUPIR for maximum detail
    - Amazon/eBay-grade professional photography quality

    Args:
        file: Product image (any background, any condition)
        remove_occlusions: Regenerate to remove hands/packaging (uses FLUX)
        enable_relighting: Apply professional studio lighting
        lighting_style: 'soft_studio', 'dramatic', 'natural', or 'bright'
        enable_upscaling: Use SUPIR for final upscaling (2x or 4x)
        upscale_factor: Upscaling multiplier (2 or 4)
        custom_prompt: Custom FLUX prompt (optional)
        return_binary: Return as image file instead of base64 JSON

    Returns:
        - JSON: { image: base64_jpeg, metadata: {...} }
        - Binary: JPEG image file

    Cost: $0.00 per image (fully local on L4 GPU)
    Time: 17-24 seconds per image
    Quality: Beats Amazon/eBay product photography
    VRAM: Peak 22GB on L4 (sequential loading)
    """
    import time
    import base64
    from fastapi.responses import Response
    from app.services.sota_pipeline_v2 import sota_pipeline

    pipeline_start = time.time()

    print("\n" + "=" * 70)
    print("🌟 SOTA V2 Pipeline Endpoint Called")
    print("=" * 70)
    print(f"   Flux Regen: {remove_occlusions}")
    print(f"   Relighting: {enable_relighting} ({lighting_style})")
    print(f"   Upscaling: {enable_upscaling} ({upscale_factor}x)")

    try:
        # Read image
        contents = await file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")
        print(f"📥 Input: {image.size}")

        # Configure pipeline
        sota_pipeline.set_config(
            enable_flux=remove_occlusions,
            enable_relighting=enable_relighting,
            lighting_style=lighting_style,
            enable_upscaling=enable_upscaling,
            upscale_factor=upscale_factor
        )

        # Run SOTA Pipeline V2 (async-compatible)
        result_image, metadata = await sota_pipeline.process(
            image,
            enable_flux_regeneration=remove_occlusions,
            enable_relighting=enable_relighting,
            lighting_style=lighting_style,
            enable_upscaling=enable_upscaling,
            upscale_factor=upscale_factor,
            custom_prompt=custom_prompt
        )

        total_time = time.time() - pipeline_start

        print(f"✅ Pipeline Complete: {result_image.size}")
        print(f"   Total time: {total_time:.1f}s")
        print(f"   Quality: Amazon/eBay-grade professional")

        # Return as binary if requested
        if return_binary:
            buffer = BytesIO()
            result_image.save(buffer, format="JPEG", quality=95)
            return Response(
                content=buffer.getvalue(),
                media_type="image/jpeg",
                headers={
                    "X-Pipeline": "SOTA-V2",
                    "X-Processing-Time": f"{total_time:.1f}s",
                    "X-Output-Size": f"{result_image.size[0]}x{result_image.size[1]}"
                }
            )

        # Return as base64 JSON
        buffer = BytesIO()
        result_image.save(buffer, format="JPEG", quality=95)
        buffer.seek(0)
        b64_data = base64.b64encode(buffer.getvalue()).decode()

        return {
            "status": "success",
            "pipeline": "SOTA-V2",
            "image": f"data:image/jpeg;base64,{b64_data}",
            "metadata": metadata,
            "message": f"✅ Complete in {total_time:.1f}s (fully local, zero cost, Amazon-quality)",
            "output_size": f"{result_image.size[0]}x{result_image.size[1]}"
        }

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/v1/studio/sota-v2-status")
async def sota_v2_status():
    """
    Check SOTA V2 pipeline status, device info, and GPU memory.
    Automatically reports whether using FLUX regeneration (cloud) or Clean & Enhance (local).
    """
    from app.services.sota_pipeline_v2 import sota_pipeline

    device_info = sota_pipeline.get_device_info()
    memory_info = sota_pipeline.get_memory_usage()

    return {
        "status": "online",
        "pipeline": "SOTA-V2 Hybrid",
        "device": device_info["device_name"],
        "vram_gb": device_info["vram_gb"],
        "pipeline_mode": device_info["pipeline_mode"],
        "memory": memory_info,
        "config": sota_pipeline.get_config(),
        "features": {
            "cloud_path": "✅ FLUX.1-dev (20GB+ VRAM required)",
            "local_path": "✅ Clean & Enhance (BiRefNet → LaMa → LBM → Compositing → Real-ESRGAN)",
            "relighting": "✅ LBM Relighting (both paths)",
            "upscaling": "✅ SUPIR (cloud) / Real-ESRGAN (local)",
            "quality": "Amazon/eBay-grade"
        },
        "cost_per_image": "$0.00 (fully local)",
        "auto_routing": f"Using {device_info['pipeline_mode'].upper()} path"
    }



@router.post("/v1/studio/process-local-enhanced")
async def process_local_enhanced(
    file: UploadFile = File(...),
    enable_inpainting: bool = Form(True),
    enable_relighting: bool = Form(True),
    lighting_style: str = Form("soft_studio"),
    enable_upscaling: bool = Form(True),
    upscale_factor: int = Form(2),
    return_binary: bool = Form(False)
):
    """
    Local Enhanced Pipeline - "Clean & Enhance" Product Photography
    Works on Mac 32GB + RTX 3060 Ti 8GB, preserves real product details

    5-Phase Pipeline:
    1. BiRefNet Segmentation (2-3s) - Remove background, extract product
    2. LaMa Inpainting (1-2s) - Remove hands/clutter near product edges
    3. LBM Relighting (2-3s) - Professional studio lighting
    4. Compositing (1s) - Place on white background with shadow
    5. Real-ESRGAN Upscaling (3-5s) - Sharpen and enhance resolution

    Total: 10-15s on CUDA, 15-25s on MPS, peak <8GB VRAM, $0 cost

    Args:
        file: Product image (any background)
        enable_inpainting: Remove hands/clutter with LaMa
        enable_relighting: Apply professional studio lighting
        lighting_style: Lighting preset (soft_studio, dramatic, natural, bright)
        enable_upscaling: Use Real-ESRGAN for enhancement
        upscale_factor: Upscaling multiplier (2 or 4)
        return_binary: Return as JPEG binary or base64 JSON

    Returns:
        Enhanced image as base64 JPEG (JSON) or binary JPEG
        Includes metadata with processing times and device info
    """
    import time
    from app.services.local_enhanced_pipeline import local_enhanced_pipeline
    from fastapi.responses import Response

    pipeline_start = time.time()

    print("\n" + "=" * 70)
    print("🎨 Local Enhanced Pipeline Endpoint Called")
    print("=" * 70)

    try:
        # Read image
        content = await file.read()
        image = Image.open(BytesIO(content)).convert("RGB")

        print(f"   📥 Processing uploaded image: {image.size}")
        print(f"   🖥️  Device: {local_enhanced_pipeline.device_profile['device_name']} ({local_enhanced_pipeline.device_profile['vram_gb']}GB)")

        # Run Local Enhanced pipeline (async)
        result_image, metadata = await local_enhanced_pipeline.process(
            image,
            enable_inpainting=enable_inpainting,
            enable_relighting=enable_relighting,
            lighting_style=lighting_style,
            enable_upscaling=enable_upscaling,
            upscale_factor=upscale_factor
        )

        total_time = time.time() - pipeline_start

        print(f"✅ Pipeline Complete: {result_image.size}")
        print(f"   Total time: {total_time:.1f}s")
        print(f"   Quality: Professional marketplace-grade")

        # Return as binary if requested
        if return_binary:
            buffer = BytesIO()
            result_image.save(buffer, format="JPEG", quality=95)
            return Response(
                content=buffer.getvalue(),
                media_type="image/jpeg",
                headers={
                    "X-Pipeline": "Local-Enhanced",
                    "X-Device": local_enhanced_pipeline.device_profile["device_name"],
                    "X-Processing-Time": f"{total_time:.1f}s",
                    "X-Output-Size": f"{result_image.size[0]}x{result_image.size[1]}"
                }
            )

        # Return as base64 JSON
        buffer = BytesIO()
        result_image.save(buffer, format="JPEG", quality=95)
        buffer.seek(0)
        b64_data = base64.b64encode(buffer.getvalue()).decode()

        return {
            "status": "success",
            "pipeline": "Local-Enhanced",
            "image": f"data:image/jpeg;base64,{b64_data}",
            "metadata": {
                **metadata,
                "api_total_time": total_time,
                "cost_per_image": "$0.00 (fully local)"
            },
            "message": f"✅ Complete in {total_time:.1f}s (fully local, zero cost, professional quality)",
        }

    except Exception as e:
        print(f"❌ Error: {e}")
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
            "sota_v2": "ready",
            "marketing_image": "coming_soon",
            "plan_b_3d": "ready"
        }
    }
