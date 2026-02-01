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
        product_image: bytes
    ) -> Dict[str, Any]:
        """
        Generate a lifestyle/marketing shot from product image.
        Uses SDXL + ControlNet (future implementation).
        """
        print(f"📸 2D Studio: Generating marketing shot for '{prompt}'...")
        
        # For now, create a clean showcase as placeholder
        result = await self.showcase.create_showcase(
            image_bytes=product_image,
            background="gradient",
            add_shadow=True
        )
        
        return {
            "status": "success",
            "image_url": result.get("image_data"),
            "prompt_used": prompt
        }

    async def enhance_product_image(
        self,
        image_bytes: bytes,
        product_name: str = ""
    ) -> Dict[str, Any]:
        """
        Quick enhancement for product images.
        - Remove background (uses product_name for better context)
        - Add professional white background
        - Add subtle shadow
        Perfect for Quick Sell single-image uploads.
        """
        print(f"🎯 Enhancing: {product_name or 'Product'}")
        return await self.showcase.create_showcase(
            image_bytes=image_bytes,
            background="white",
            add_shadow=True,
            output_size=(1024, 1024),
            product_hint=product_name  # Pass product context
        )


# Singleton instance
pipeline_service = AiPipelineService()
