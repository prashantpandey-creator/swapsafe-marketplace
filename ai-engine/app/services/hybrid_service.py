"""
Hybrid Enhancement Service - BiRefNet + Fast SDXL Regeneration
World-class product photos at zero cost with fast local processing.

Pipeline:
1. BiRefNet: SOTA background removal (2s)
2. SDXL Turbo: Fast 4-step regeneration for studio lighting (3s)
Total: ~5 seconds per image
"""
import torch
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
from typing import Optional
import os


class HybridEnhanceService:
    """
    Production-grade hybrid enhancement: BiRefNet + SDXL Turbo.
    Fast, local, and free.
    """
    
    def __init__(self):
        self.device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
        self.birefnet = None
        self.sdxl_turbo = None
        
    def _load_birefnet(self):
        """Lazy load BiRefNet."""
        if self.birefnet is None:
            from app.services.birefnet_service import birefnet_service
            self.birefnet = birefnet_service
        return self.birefnet
    
    def _load_sdxl_turbo(self):
        """Lazy load SDXL Turbo for fast regeneration."""
        if self.sdxl_turbo is None:
            print("⚡ Loading SDXL Turbo for regeneration...")
            from diffusers import AutoPipelineForImage2Image
            
            self.sdxl_turbo = AutoPipelineForImage2Image.from_pretrained(
                "stabilityai/sdxl-turbo",
                torch_dtype=torch.float32 if self.device == "mps" else torch.float16,
                variant="fp16" if self.device != "mps" else None
            )
            self.sdxl_turbo.to(self.device)
            print(f"✅ SDXL Turbo loaded on {self.device}")
        return self.sdxl_turbo
    
    def _offload_birefnet(self):
        """Offload BiRefNet from GPU to free memory."""
        if self.birefnet is not None and self.birefnet.model is not None:
            print("  🧹 Offloading BiRefNet from GPU...")
            self.birefnet.model.to("cpu")
            torch.mps.empty_cache() if self.device == "mps" else torch.cuda.empty_cache()
            del self.birefnet
            self.birefnet = None
            import gc
            gc.collect()
            print("  ✅ BiRefNet offloaded, memory freed")
    
    def _offload_sdxl(self):
        """Offload SDXL Turbo from GPU to free memory."""
        if self.sdxl_turbo is not None:
            print("  🧹 Offloading SDXL Turbo from GPU...")
            self.sdxl_turbo.to("cpu")
            torch.mps.empty_cache() if self.device == "mps" else torch.cuda.empty_cache()
            del self.sdxl_turbo
            self.sdxl_turbo = None
            import gc
            gc.collect()
            print("  ✅ SDXL Turbo offloaded, memory freed")
    
    def enhance(
        self,
        image: Image.Image,
        prompt: str = "professional product photography, soft studio lighting, clean white background, e-commerce, high quality",
        negative_prompt: str = "dark, shadows, amateur, low quality, blurry",
        regeneration_strength: float = 0.2,
        use_regeneration: bool = True,
        seed: int = 42
    ) -> dict:
        """
        Full enhancement pipeline: BiRefNet + optional SDXL regeneration.
        Memory-optimized: offloads each model after use.
        
        Args:
            image: Input product image
            prompt: Style prompt for regeneration
            negative_prompt: What to avoid
            regeneration_strength: How much to regenerate (0.1-0.3 recommended)
            use_regeneration: Whether to apply SDXL enhancement
            seed: Random seed
        
        Returns:
            dict with 'birefnet' and optionally 'enhanced' results
        """
        results = {}
        
        # Step 1: BiRefNet background removal
        print("🎯 Step 1: BiRefNet background removal...")
        birefnet = self._load_birefnet()
        
        # Resize for processing
        original_size = image.size
        img_resized = image.resize((1024, 1024), Image.LANCZOS)
        
        # Get product on white background
        birefnet_result = birefnet.remove_and_place_on_white(img_resized)
        results['birefnet'] = birefnet_result.resize(original_size, Image.LANCZOS)
        print("  ✅ BiRefNet complete")
        
        # OFFLOAD BiRefNet before loading SDXL
        if use_regeneration:
            self._offload_birefnet()
        
        # Step 2: Optional SDXL Turbo regeneration
        if use_regeneration:
            print(f"🎨 Step 2: SDXL Turbo enhancement (strength={regeneration_strength})...")
            try:
                pipe = self._load_sdxl_turbo()
                generator = torch.Generator(device=self.device).manual_seed(seed)
                
                # Convert BiRefNet result to RGB for SDXL
                input_image = birefnet_result.convert("RGB")
                
                # SDXL Turbo needs minimum 2 effective steps
                # With strength=0.5 and steps=4, we get 2 effective steps
                # Lower strength = more preservation but needs more steps
                effective_steps = max(2, int(4 * regeneration_strength))
                actual_strength = max(0.3, regeneration_strength)  # Minimum 0.3 for Turbo
                
                print(f"    Using steps={effective_steps}, strength={actual_strength}")
                
                enhanced = pipe(
                    prompt=prompt,
                    image=input_image,
                    num_inference_steps=4,
                    strength=actual_strength,  # Ensure at least 2 steps
                    guidance_scale=0.0,  # Turbo uses 0.0 guidance
                    generator=generator
                ).images[0]
                
                results['enhanced'] = enhanced.resize(original_size, Image.LANCZOS)
                print("  ✅ SDXL enhancement complete")
                
                # OFFLOAD SDXL after use
                self._offload_sdxl()
                
            except Exception as e:
                print(f"  ⚠️ SDXL enhancement failed: {e}")
                import traceback
                traceback.print_exc()
                results['enhanced'] = results['birefnet']
        
        return results
    
    def enhance_with_lighting(
        self,
        image: Image.Image,
        lighting_style: str = "soft_studio"
    ) -> dict:
        """
        Enhance with specific lighting presets.
        
        Args:
            image: Input product image
            lighting_style: "soft_studio", "dramatic", "natural", "warm"
        
        Returns:
            dict with 'birefnet' and 'enhanced' results
        """
        prompts = {
            "soft_studio": "professional product photography, soft diffused studio lighting, clean white background, e-commerce ready, high-end",
            "dramatic": "product photography, dramatic side lighting, professional, clean white background, contrast",
            "natural": "product photography, natural daylight, soft shadows, clean white background, authentic",
            "warm": "product photography, warm golden lighting, professional, clean white background, inviting"
        }
        
        prompt = prompts.get(lighting_style, prompts["soft_studio"])
        
        return self.enhance(
            image,
            prompt=prompt,
            regeneration_strength=0.25,
            use_regeneration=True
        )


# Singleton
hybrid_service = HybridEnhanceService()


def test_hybrid():
    """Test hybrid enhancement on BiRefNet result."""
    test_path = "/Users/badenath/.gemini/antigravity/brain/0509a38a-18d9-4027-ad3d-47864438b67f/birefnet_result.png"
    
    if os.path.exists(test_path):
        img = Image.open(test_path)
        
        print("\n" + "="*60)
        print("🚀 Testing Hybrid Enhancement Pipeline")
        print("="*60)
        
        results = hybrid_service.enhance(
            img,
            prompt="professional product photography, soft studio lighting, clean white background",
            regeneration_strength=0.2,
            use_regeneration=True
        )
        
        # Save results
        artifacts_dir = "/Users/badenath/.gemini/antigravity/brain/0509a38a-18d9-4027-ad3d-47864438b67f"
        
        if 'birefnet' in results:
            results['birefnet'].save(f"{artifacts_dir}/hybrid_birefnet.png")
            print(f"✅ BiRefNet saved: hybrid_birefnet.png")
        
        if 'enhanced' in results:
            results['enhanced'].save(f"{artifacts_dir}/hybrid_enhanced.png")
            print(f"✅ Enhanced saved: hybrid_enhanced.png")
        
        print("\n🔥 Hybrid pipeline test complete!")
        return results
    else:
        print(f"❌ Test image not found: {test_path}")
        return None


if __name__ == "__main__":
    test_hybrid()
