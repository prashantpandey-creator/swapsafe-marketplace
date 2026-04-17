from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import Optional
from app.services.central_brain import CentralBrainService
from app.services.haggle_service import HaggleService, HaggleState
from app.services.turbo_service import turbo_service
from app.services.qwen_service import qwen_service
from app.services.gemini_analysis_service import gemini_analysis_service
from app.services.stock_service import stock_service
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# --- 1. The Unified Interact Endpoint (Text Only) ---
@router.post("/interact")
async def interact_with_brain(
    user_input: str = Form(...),
):
    """
    Standard Text Interaction.
    """
    thought = CentralBrainService.think(user_input)
    skill = thought.get("skill", "chat")
    
    if skill == "haggle":
        state = HaggleState(current_price=100.0, min_price=80.0)
        try:
            raw_offer = thought.get("offer", 0)
            if isinstance(raw_offer, str):
                import re
                raw_offer = re.sub(r'[^\d.]', '', raw_offer)
            user_offer = float(raw_offer)
        except:
            user_offer = 0.0
        result = HaggleService.negotiate(user_offer, state)
        return {"skill": "haggle", "brain_thought": thought, "action": result}

    elif skill == "edit":
         return {"skill": "edit", "brain_thought": thought, "message": "Please upload an image for editing."}

    else:
        return {"skill": "chat", "brain_thought": thought, "message": thought.get("reply", "I didn't understand.")}


# --- 2. The FAST Lane (SDXL-Native High Fidelity) ---
@router.post("/edit/sdxl")
async def edit_image_fast(
    user_input: str = Form(...),
    image: UploadFile = File(...)
):
    """
    Agentic Vision (Fast): user_input -> Brain -> SDXL-Native (ControlNet + Hybrid)
    """
    # 1. Ask Brain for specific "Visual Plan"
    image_bytes = await image.read()
    await image.seek(0)
    
    thought = CentralBrainService.think(user_input, image_file=image_bytes)
    
    # 2. Parse Canonical Intent
    intent = thought.get("intent", "unknown").lower()
    valid_intents = ["image_generation", "edit", "showcase", "create"]
    is_valid_intent = any(k in intent for k in valid_intents) or thought.get("skill") == "edit"
    
    if not is_valid_intent:
        return {"error": "The brain didn't interpret this as an edit request.", "thought": thought}
    
    # Extract Plan details
    plan = thought.get("visual_plan", {})
    target = plan.get("mask_subject") or "object"
    
    # NEW: SDXL-Native Tokens
    tokens = plan.get("sdxl_tokens", {})
    prompt = tokens.get("positive") or plan.get("technical_prompt") or user_input
    negative_prompt = tokens.get("negative") or "lowres, bad anatomy, text, error"
    
    # NEW: Adaptive Refinement
    strength = plan.get("refining_strength") or 0.65
    
    # 3. Call Turbo Service (Hybrid Pipeline)
    result_path = await turbo_service.agentic_edit(
        image, 
        target, 
        prompt,
        negative_prompt=negative_prompt,
        strength=float(strength)
    )
    
    return {
        "mode": "Fast Lane (SDXL-Native)",
        "brain_thought": thought,
        "brain_parsed": {
            "target": target, 
            "prompt": prompt, 
            "strength": strength,
            "negative": negative_prompt
        },
        "status": "Success", 
        "result_path": result_path
    }


# --- 3. The SMART Lane (Qwen) ---
@router.post("/edit/qwen")
async def edit_image_smart(
    user_input: str = Form(...),
    image: UploadFile = File(...)
):
    """
    Agentic Vision (Local Smart)
    """
    thought = CentralBrainService.think(user_input)
    result_path = await qwen_service.edit(image, user_input)

    return {
        "mode": "Smart Lane (Qwen)",
        "brain_thought": thought,
        "status": "Success",
        "result_path": result_path
    }

# --- 4. System / Memory Management ---
@router.post("/unload")
async def unload_resources(target: str = "all"):
    import gc
    import torch
    status = []
    
    if target in ["sdxl", "all"]:
        if turbo_service.pipeline:
            del turbo_service.pipeline
            turbo_service.pipeline = None
            status.append("SDXL Unloaded")
            
    if target in ["qwen", "all"]:
        if qwen_service.pipeline:
            del qwen_service.pipeline
            qwen_service.pipeline = None
            status.append("Qwen Unloaded")

    gc.collect()
    if torch.cuda.is_available(): torch.cuda.empty_cache()
    if torch.backends.mps.is_available(): torch.mps.empty_cache()
    
    return {"message": "Memory Cleared", "details": status}   

@router.get("/status")
async def get_brain_status():
    return {
        "sdxl_loaded": turbo_service.pipeline is not None,
        "qwen_loaded": qwen_service.pipeline is not None
    }

# --- 5. Analysis & Stock Services ---
@router.post("/analyze")
async def analyze_image(image: UploadFile = File(...)):
    """
    Analyze product image using Gemini Flash or Groq Fallback.
    """
    try:
        # Read file contents securely
        await image.seek(0)
        contents = await image.read()
        
        if len(contents) == 0:
            raise ValueError("Received empty file")

        logger.info(f"🧠 Analysis Request. Image Size: {len(contents)} bytes")
        
        from io import BytesIO
        from PIL import Image
        
        try:
            pil_image = Image.open(BytesIO(contents))
            pil_image.load() # Force load
            logger.info(f"DEBUG: Pillow opened image: {pil_image.format} {pil_image.size} {pil_image.mode}")
        except Exception as e:
            logger.error(f"DEBUG: Pillow failed to open image: {e}")
            raise e
        
        from starlette.concurrency import run_in_threadpool
        from app.agents.listing_generator import ListingGenerator
        
        # Initialize Supervisor
        supervisor = ListingGenerator()
        
        # Run full multi-agent flow
        result = await run_in_threadpool(supervisor.generate_listing, pil_image)
        
        return {"status": "success", "analysis": result}
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logger.error(f"❌ Analysis Endpoint Failed: {e}")
        logger.error(tb)
        return {"status": "error", "message": str(e), "traceback": tb}

@router.get("/stock-image")
async def get_stock_image(query: str):
    """
    Fetch a stock image for the given query.
    """
    result = stock_service.find_product_image(query)
    if result:
        return {"status": "success", "results": [result]} # Return as array for future expansion
    else:
        return {"status": "error", "message": "No image found"}
