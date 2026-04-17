"""
Core AI Orchestrator - Unified Pipeline Service.
Manages:
1. Showcase Photos (Background Removal + White BG)
2. 3D Model Generation (TripoSR)
3. Marketing Image Generation (SDXL - future)
"""
import asyncio
from typing import Dict, Any, List
from .showcase_service import showcase_service
from .triposr_service import triposr_service
from .vision_service import vision_service
from .upscale_service import upscale_service
from .stock_service import stock_service

class AiPipelineService:
    """
    Unified AI Pipeline for the Guardian AI Engine.
    Routes requests to appropriate specialized services.
    """

    def __init__(self):
        print("🚀 AI Pipeline Service initialized")
        self.showcase = showcase_service
        self.triposr = triposr_service

    async def create_showcase_photo(
        self,
        image_bytes: bytes,
        background: str = "white",
        add_shadow: bool = True
    ) -> Dict[str, Any]:
        """
        Create a professional e-commerce showcase photo.
        Removes background and adds clean white/gradient background.
        """
        return await self.showcase.create_showcase(
            image_bytes=image_bytes,
            background=background,
            add_shadow=add_shadow
        )

    async def generate_3d_preview(
        self, 
        images: List[bytes], 
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate 3D model from images.
        Single image: Fast single-view reconstruction
        Multiple images: Full photogrammetry reconstruction
        """
        print(f"🎨 Pipeline Started: Processing {len(images)} images...")
        
        if not images:
            raise ValueError("No images provided")
        
        print(f"🧠 Context: '{metadata.get('title')}' - {metadata.get('category')}")
        
        if len(images) == 1:
            # Single image 3D generation
            return await self.triposr.generate_3d_from_image(
                image_bytes=images[0],
                metadata=metadata
            )
        else:
            # Multi-view 3D generation
            return await self.triposr.generate_3d_from_multiple(
                images=images,
                metadata=metadata
            )

    async def generate_marketing_image(
        self, 
        prompt: str, 
        product_image: bytes,
        product_name: str = "",
        reference_image_bytes: bytes = None # NEW: Explicit 1-Shot Reference
    ) -> Dict[str, Any]:
        """
        Generate a lifestyle/marketing shot from product image.
        Uses RAG (Retrieval Augmented Generation) to find Official Look if product_name provided.
        """
        print(f"📸 2D Studio: Generating marketing shot for '{prompt}'...")
        import io
        import base64
        from PIL import Image

        # Convert bytes to PIL
        input_image = Image.open(io.BytesIO(product_image)).convert("RGB")
        
        # QUANTUM INFO RETRIEVAL (Stock Style Transfer)
        reference_images = None
        
        # 1. Check for Explicit Reference (1-Shot Learning)
        if reference_image_bytes:
             print("   📸 explicit_reference_image provided. Loading specific style context...")
             try:
                 ref_img = Image.open(io.BytesIO(reference_image_bytes)).convert("RGB")
                 reference_images = [ref_img]
             except Exception as e:
                 print(f"   ⚠️ Failed to load explicit reference: {e}")

        # 2. Fallback to Stock Search (Zero-Shot RAG)
        if not reference_images and product_name:
            print(f"   🔮 Quantum Info Retrieval: Searching for Official Look of '{product_name}'...")
            stock_data = stock_service.find_product_image(product_name)
            
            if stock_data:
                print("   ✅ Official Asset Found! Extracting Style DNA...")
                try:
                    # stock_data["image_data"] is "data:image/jpeg;base64,..."
                    b64_str = stock_data["image_data"].split(",")[1]
                    stock_bytes = base64.b64decode(b64_str)
                    stock_img = Image.open(io.BytesIO(stock_bytes)).convert("RGB")
                    
                    if stock_img.size[0] > 64 and stock_img.size[1] > 64:
                        reference_images = [stock_img]
                    else:
                        print(f"   ⚠️ Stock image too small: {stock_img.size}. Skipping.")
                except Exception as e:
                    print(f"   ⚠️ Failed to decode stock info: {e}")

        # Use Vision Service to GENERATE (Relight)
        # We append some quality boosters to the user's prompt
        full_prompt = f"{prompt}, isolated on white background, product view, front angle, professional photography, high quality, 8k, highly detailed"
        
        # VISION: Relight with SDXL Modular (No Compromise)
        result_image = vision_service.relight_product(
            input_image,
            prompt=full_prompt,
            reference_images=reference_images
        )
        
        # QUANTUM PORTAL: PIPE TO SHOWCASE (Post-Process: Cutout + White BG + Upscale)
        # Convert base generation to bytes
        temp_buffer = io.BytesIO()
        result_image.save(temp_buffer, format="PNG")
        
        print("   🚀 Quantum Portal: Engaging Studio Showcase (Rembg + Upscale)...")
        showcase_result = await self.showcase.create_showcase(
            image_bytes=temp_buffer.getvalue(),
            background="white",
            add_shadow=True, # Add artificial shadow since we removed real one
            apply_upscale=True, # Run Real-ESRGAN on the cutout
            product_hint=product_name
        )

        return {
            "status": "success",
            "image_data": showcase_result["image_data"],
            "prompt_used": prompt,
            "pipeline": "SDXL (Relight) + Rembg + RealESRGAN (Showcase)"
        }

    async def enhance_product_image(
        self,
        image_bytes: bytes,
        product_name: str = "",
        reference_url: str = None,  # NEW: Reference image URL for exact matches
        category: str = ""  # NEW: Product category for styling
    ) -> Dict[str, Any]:
        """
        Quick enhancement for product images.
        - Remove background (uses product_name for better context)
        - Add professional white background
        - Add subtle shadow
        
        NEW: If reference_url provided, can be used for smarter composition.
        Perfect for Quick Sell single-image uploads.
        """
        print(f"🎯 Enhancing: {product_name or 'Product'}")
        if reference_url:
            print(f"📸 Reference: {reference_url[:50]}...")
        
        return await self.showcase.create_showcase(
            image_bytes=image_bytes,
            background="white",
            add_shadow=False,  # Disabled per user request (Step 3 removed)
            output_size=(1024, 1024),
            product_hint=product_name,  # Pass product context
            apply_upscale=False,  # DISABLED: Causing timeouts on local machine
            return_original=True  # Return original image too for comparison
        )


# Singleton instance
pipeline_service = AiPipelineService()
