"""
FLUX.1-dev Generation Service - State of the Art Image Generation (2025/2026)
Generates photorealistic product photography using FLUX.1-dev model.
VRAM: 22GB at fp16 on L4 GPU, seamless local deployment.
"""
import torch
import numpy as np
from PIL import Image
import gc
import time
from app.config import DeviceConfig


class FluxGenerationService:
    """
    FLUX.1-dev service for photorealistic product photography generation.

    Key Features:
    - Full fp16 precision for L4 GPU (22GB VRAM)
    - Product-optimized prompts
    - Memory-efficient with model unloading
    - Graceful fallback to SDXL Turbo if FLUX fails
    """

    def __init__(self):
        self.device = DeviceConfig.get_device()
        self.pipeline = None
        self.model_id = "black-forest-labs/FLUX.1-dev"
        self.fallback_model = None

    def load_pipeline(self):
        """
        Load FLUX.1-dev model in fp16 precision.
        On L4 GPU: Uses ~22GB VRAM
        """
        if self.pipeline is not None:
            return

        print("🌟 Loading FLUX.1-dev (State-of-the-Art Product Photography)...")
        print(f"   Device: {self.device} | Model: {self.model_id}")

        try:
            from diffusers import FluxPipeline

            # Load in fp16 with CPU offloading to fit in 16GB system RAM + 24GB VRAM
            self.pipeline = FluxPipeline.from_pretrained(
                self.model_id,
                torch_dtype=torch.float16,
            )

            # CPU offload moves components to GPU only during forward pass
            # This keeps system RAM usage low while using the full 24GB L4 VRAM
            self.pipeline.enable_model_cpu_offload()
            self.pipeline.enable_attention_slicing()

            print("✅ FLUX.1-dev loaded successfully (fp16)")

        except Exception as e:
            print(f"❌ FLUX.1-dev load failed: {e}")
            print("   Falling back to SDXL Turbo for generation...")
            import traceback
            traceback.print_exc()
            self.pipeline = "fallback"
            self._load_fallback_sdxl()

    def _load_fallback_sdxl(self):
        """
        Fallback to SDXL Turbo if FLUX.1-dev fails to load.
        Maintains functionality with slightly lower quality.
        """
        try:
            from diffusers import AutoPipelineForText2Image

            self.fallback_model = AutoPipelineForText2Image.from_pretrained(
                "stabilityai/sdxl-turbo",
                torch_dtype=torch.float16,
            )
            self.fallback_model.enable_model_cpu_offload()
            print("✅ SDXL Turbo fallback loaded (fp16)")

        except Exception as e:
            print(f"❌ SDXL Turbo fallback also failed: {e}")
            self.fallback_model = None

    def generate(
        self,
        image: Image.Image = None,
        prompt: str = None,
        width: int = 768,
        height: int = 768,
        num_inference_steps: int = 25,
        guidance_scale: float = 3.5,
        seed: int = None
    ) -> tuple:
        """
        Generate a photorealistic product image using FLUX.1-dev.

        Args:
            image: Optional input image for img2img mode (regenerate)
            prompt: Text description of desired product appearance
            width: Output width (default 768px)
            height: Output height (default 768px)
            num_inference_steps: Number of denoising steps (4-50, default 25)
            guidance_scale: How much to follow the prompt (3.5 is optimal)
            seed: Random seed for reproducibility

        Returns:
            (PIL.Image, dict) - Generated image and metadata
        """
        self.load_pipeline()

        start_time = time.time()
        metadata = {
            "model": "FLUX.1-dev" if self.pipeline != "fallback" else "SDXL-Turbo-Fallback",
            "width": width,
            "height": height,
            "steps": num_inference_steps,
            "guidance_scale": guidance_scale,
        }

        # Use default product photography prompt if none provided
        if prompt is None:
            prompt = (
                "professional product photography, studio lighting, "
                "white background, product centered, clean, sharp, "
                "high quality, detailed, Amazon-ready listing photo"
            )

        # Enhance prompt for photorealism
        enhanced_prompt = self._enhance_product_prompt(prompt)

        try:
            if self.pipeline == "fallback":
                return self._generate_with_fallback(
                    enhanced_prompt, width, height, num_inference_steps, seed
                )

            # Generate with FLUX.1-dev
            generator = None
            if seed is not None:
                generator = torch.Generator(device=self.device).manual_seed(seed)

            print(f"🎨 Generating: {enhanced_prompt[:60]}...")

            # Text-to-image generation
            result = self.pipeline(
                prompt=enhanced_prompt,
                height=height,
                width=width,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                generator=generator
            )

            image_output = result.images[0]
            elapsed = time.time() - start_time

            metadata["processing_time"] = elapsed
            metadata["success"] = True

            print(f"✅ Generation complete in {elapsed:.1f}s")

            # Clear GPU memory
            torch.cuda.empty_cache() if torch.cuda.is_available() else None

            return image_output, metadata

        except Exception as e:
            print(f"❌ Generation failed: {e}")
            import traceback
            traceback.print_exc()

            metadata["success"] = False
            metadata["error"] = str(e)

            # Return blank image with error
            return Image.new("RGB", (width, height), color="white"), metadata

    def regenerate_from_image(
        self,
        image: Image.Image,
        prompt: str = None,
        strength: float = 0.8,
        num_inference_steps: int = 20,
        guidance_scale: float = 3.5,
        seed: int = None
    ) -> tuple:
        """
        Regenerate/improve a product image using img2img mode.

        Args:
            image: Input product image to improve
            prompt: Desired changes/style
            strength: How much to modify (0=no change, 1=full regen)
            num_inference_steps: Denoising steps
            guidance_scale: Prompt adherence
            seed: Random seed

        Returns:
            (PIL.Image, dict) - Regenerated image and metadata
        """
        self.load_pipeline()

        start_time = time.time()
        metadata = {
            "mode": "img2img",
            "model": "FLUX.1-dev-img2img",
            "strength": strength,
        }

        # Default improvement prompt
        if prompt is None:
            prompt = (
                "professional studio photography, enhanced lighting, "
                "sharper details, product looks premium and commercial-grade"
            )

        enhanced_prompt = self._enhance_product_prompt(prompt)

        try:
            if self.pipeline == "fallback":
                return self._regenerate_fallback(
                    image, enhanced_prompt, strength, num_inference_steps, seed
                )

            # Resize to FLUX dims
            image = image.convert("RGB").resize((768, 768), Image.Resampling.LANCZOS)

            generator = None
            if seed is not None:
                generator = torch.Generator(device=self.device).manual_seed(seed)

            print(f"🎨 Regenerating with strength={strength}...")

            # For FLUX img2img, use FluxImg2ImgPipeline if available
            # Otherwise fall back to basic generation with the image as reference
            result = self.pipeline(
                prompt=enhanced_prompt,
                image=image,
                strength=strength,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                generator=generator
            )

            image_output = result.images[0]
            elapsed = time.time() - start_time

            metadata["processing_time"] = elapsed
            metadata["success"] = True

            print(f"✅ Regeneration complete in {elapsed:.1f}s")

            torch.cuda.empty_cache() if torch.cuda.is_available() else None

            return image_output, metadata

        except Exception as e:
            print(f"⚠️  Img2img mode not supported, falling back to txt2img...")
            # Fall back to simple text-to-image
            return self.generate(
                prompt=prompt,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                seed=seed
            )

    def _generate_with_fallback(
        self, prompt, width, height, num_inference_steps, seed
    ) -> tuple:
        """Fallback generation using SDXL Turbo."""
        try:
            generator = None
            if seed is not None:
                generator = torch.Generator(device=self.device).manual_seed(seed)

            result = self.fallback_model(
                prompt=prompt,
                height=height,
                width=width,
                num_inference_steps=num_inference_steps or 4,  # SDXL Turbo: 1-4 steps
                guidance_scale=7.5,  # Different guidance for SDXL
                generator=generator
            )

            return result.images[0], {
                "model": "SDXL-Turbo-Fallback",
                "success": True
            }

        except Exception as e:
            print(f"❌ Fallback generation failed: {e}")
            return Image.new("RGB", (width, height), color="white"), {
                "model": "Fallback-Failed",
                "success": False,
                "error": str(e)
            }

    def _regenerate_fallback(
        self, image, prompt, strength, num_inference_steps, seed
    ) -> tuple:
        """Fallback regeneration using SDXL Turbo."""
        # SDXL Turbo doesn't have great img2img, use simple generation instead
        return self.generate(
            prompt=prompt,
            num_inference_steps=num_inference_steps or 4,
            seed=seed
        )

    def _enhance_product_prompt(self, prompt: str) -> str:
        """
        Enhance product photography prompt with optimal styling.
        Adds photography-specific terms for best results.
        """
        if not prompt:
            return ""

        # Add photographic enhancement if not already present
        enhancements = []

        if "studio" not in prompt.lower():
            enhancements.append("studio lighting")

        if "professional" not in prompt.lower():
            enhancements.append("professional photography")

        if "background" not in prompt.lower():
            enhancements.append("white background")

        if "sharp" not in prompt.lower():
            enhancements.append("sharp focus")

        if "detail" not in prompt.lower():
            enhancements.append("detailed")

        enhanced = ", ".join(enhancements)
        if enhanced:
            return f"{prompt}, {enhanced}"
        return prompt

    def unload_model(self):
        """
        Unload FLUX.1-dev model to free GPU memory.
        Useful for sequential processing.
        """
        if self.pipeline is not None and self.pipeline != "fallback":
            del self.pipeline
            self.pipeline = None
            gc.collect()
            torch.cuda.empty_cache() if torch.cuda.is_available() else None
            print("🧹 FLUX.1-dev model unloaded from GPU")

    def get_memory_usage(self) -> dict:
        """
        Get current GPU/CPU memory usage.
        """
        if torch.cuda.is_available():
            reserved = torch.cuda.memory_reserved(0) / 1e9
            allocated = torch.cuda.memory_allocated(0) / 1e9
            total = torch.cuda.get_device_properties(0).total_memory / 1e9

            return {
                "device": "CUDA",
                "total_gb": total,
                "allocated_gb": allocated,
                "reserved_gb": reserved,
                "available_gb": total - reserved
            }
        else:
            import psutil
            mem = psutil.virtual_memory()
            return {
                "device": "CPU",
                "total_gb": mem.total / (1024**3),
                "used_gb": mem.used / (1024**3),
                "available_gb": mem.available / (1024**3),
            }


# Singleton instance for the API
flux_service = FluxGenerationService()
