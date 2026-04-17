"""
Studio Regeneration Service - Structure-Preserving Background Generation
Uses SDXL + ControlNet Depth to regenerate studio-quality photos while preserving product structure.

Pipeline: BiRefNet → Depth Extraction → ControlNet Studio Generation
Target: 94.2% structural accuracy (ControlNet benchmark)
"""
import torch
import numpy as np
from PIL import Image
from io import BytesIO
import os
from diffusers import (
    StableDiffusionXLControlNetImg2ImgPipeline,
    ControlNetModel,
    AutoencoderKL,
    DPMSolverMultistepScheduler
)


class StudioRegenerationService:
    def __init__(self):
        self.pipeline = None
        self.device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
        
    def load_pipeline(self, low_memory: bool = False):
        """Load SDXL + ControlNet Depth pipeline"""
        if self.pipeline is not None:
            return
            
        print("⚡ Loading SDXL + ControlNet Depth Pipeline (Img2Img)...")
        try:
            # Load ControlNet for depth conditioning
            print("   📥 Loading ControlNet Depth model...")
            controlnet = ControlNetModel.from_pretrained(
                "diffusers/controlnet-depth-sdxl-1.0",
                torch_dtype=torch.float32,  # FORCE FP32
            )
            
            # Load high-quality VAE for better results
            print("   📥 Loading VAE...")
            vae = AutoencoderKL.from_pretrained(
                "madebyollin/sdxl-vae-fp16-fix",
                torch_dtype=torch.float32 # FORCE FP32
            )
            
            # Load SDXL Img2Img pipeline with ControlNet
            print("   📥 Loading SDXL Img2Img model...")
            self.pipeline = StableDiffusionXLControlNetImg2ImgPipeline.from_pretrained(
                "stabilityai/stable-diffusion-xl-base-1.0",
                controlnet=controlnet,
                vae=vae,
                torch_dtype=torch.float32,  # FORCE FP32
                use_safetensors=True
            )
            
            # CRITICAL: Force VAE to float32 to avoid black images on Mac
            # This is the official method that handles type mismatch safely
            self.pipeline.upcast_vae()
            
            # CRITICAL FIX: Monkey patch vae.decode to handle type mismatch
            # The UNet outputs FP16, but VAE is now FP32. Diffusers doesn't auto-cast this.
            original_decode = self.pipeline.vae.decode
            
            def patched_decode(latents, return_dict=True):
                # Cast latents to match VAE dtype (FP32)
                latents = latents.to(self.pipeline.vae.dtype)
                
                # DEBUG: Check for NaNs/Inf
                # print(f"   🔍 Latents stats: Min={latents.min()}, Max={latents.max()}, Mean={latents.mean()}")
                if torch.isnan(latents).any():
                    print("   ❌ WARNING: Latents contain NaNs!")
                
                return original_decode(latents, return_dict=return_dict)
                
            self.pipeline.vae.decode = patched_decode
            print("   🔧 Applied VAE decode type-cast patch")
            
            # Optimize scheduler for quality
            self.pipeline.scheduler = DPMSolverMultistepScheduler.from_config(
                self.pipeline.scheduler.config
            )
            
            # Memory optimizations
            if low_memory:
                print("   💾 Enabling Low Memory Mode (CPU Offload)")
                # This moves parts of model to CPU when not used
                self.pipeline.enable_model_cpu_offload() 
                self.pipeline.enable_vae_slicing()
                self.pipeline.enable_vae_tiling()
            else:
                self.pipeline.to(self.device)
                
            # Additional MPS optimizations
            if self.device == "mps":
                self.pipeline.enable_attention_slicing()
            
            print(f"✅ Studio Regeneration Pipeline loaded on {self.device}")

        except Exception as e:
            print(f"❌ Pipeline load failed: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def load_lightning_lora(self):
        """Load SDXL-Lightning LoRA for 4-step generation"""
        if self.pipeline is None:
            self.load_pipeline(low_memory=True)
            
        print("⚡ Loading SDXL-Lightning LoRA (4-step)...")
        try:
            # Load the 4-step LoRA for extreme speed
            self.pipeline.load_lora_weights(
                "ByteDance/SDXL-Lightning", 
                weight_name="sdxl_lightning_4step_lora.safetensors", 
                adapter_name="lightning"
            )
            self.pipeline.fuse_lora(adapter_names=["lightning"], lora_scale=1.0)
            print("✅ SDXL-Lightning LoRA fused!")
        except Exception as e:
            print(f"⚠️ Failed to load Lightning LoRA: {e}")
    
    def generate_studio_image(
        self,
        product_image: Image.Image,
        depth_map: Image.Image,
        prompt: str = None,
        negative_prompt: str = None,
        num_inference_steps: int = 30,
        controlnet_conditioning_scale: float = 0.8,
        guidance_scale: float = 7.5,
        strength: float = 0.75, # Control how much to preserve original (0.75 = balanced)
    ) -> Image.Image:
        """
        Generate studio-quality image using Img2Img + ControlNet.
        
        Args:
            product_image: Original product image (Source for texture)
            depth_map: Depth map (Structure control)
            prompt: Generation prompt
            negative_prompt: What to avoid
            num_inference_steps: Quality vs speed tradeoff
            controlnet_conditioning_scale: How strictly to follow depth
            guidance_scale: How closely to follow prompt
            strength: Denoising strength (0.0=Original, 1.0=Full Hallucination)
            
        Returns:
            Studio-quality product image
        """
        self.load_pipeline()
        
        # Default prompts optimized for product photography
        if prompt is None:
            prompt = (
                "professional product photography, studio lighting, clean white background, "
                "soft shadows, commercial quality, professional setup, perfect lighting, "
                "high resolution, sharp focus, e-commerce photo"
            )
        
        if negative_prompt is None:
            negative_prompt = (
                "low quality, blurry, deformed, distorted, watermark, text, "
                "bad lighting, amateur, grainy, noise, artifacts"
            )
        
        try:
            # Ensure depth map is grayscale and same size as product
            depth_map = depth_map.convert("L")
            depth_map = depth_map.resize(product_image.size, Image.LANCZOS)
            
            # Convert depth to RGB (ControlNet expects 3-channel input)
            depth_rgb = Image.merge("RGB", (depth_map, depth_map, depth_map))
            
            # Generate
            print(f"🎨 Generating studio image (Img2Img)...")
            print(f"   📐 Size: {product_image.size}")
            print(f"   🎯 Steps: {num_inference_steps}")
            print(f"   🎚️  Strength: {strength}")
            print(f"   🎚️  ControlNet: {controlnet_conditioning_scale}")
            
            result = self.pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                image=product_image,        # Img2Img Source
                control_image=depth_rgb,    # ControlNet Condition
                num_inference_steps=num_inference_steps,
                controlnet_conditioning_scale=controlnet_conditioning_scale,
                guidance_scale=guidance_scale,
                strength=strength,          # Img2Img Strength
                height=product_image.size[1],
                width=product_image.size[0],
            ).images[0]
            
            return result
            
        except Exception as e:
            print(f"⚠️ Studio generation failed: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def regenerate_from_scratch(
        self,
        original_image: Image.Image,
        studio_prompt: str = None,
        quality: str = "balanced"  # "fast" | "balanced" | "quality"
    ) -> tuple[Image.Image, Image.Image, Image.Image]:
        """
        Full pipeline: Background removal → Depth → Studio generation
        
        Args:
            original_image: Raw product photo
            studio_prompt: Custom studio setup (optional)
            quality: Speed vs quality preset
            
        Returns:
            (isolated_product, depth_map, studio_result)
        """
        from services.birefnet_service import birefnet_service
        from services.depth_service import depth_service
        import gc
        
        # Quality presets
        quality_settings = {
            "fast": {"steps": 4, "scale": 0.7},     # 4 STEPS for Lightning
            "balanced": {"steps": 30, "scale": 0.8},
            "quality": {"steps": 50, "scale": 0.9}
        }
        settings = quality_settings.get(quality, quality_settings["balanced"])
        
        print("\n" + "=" * 60)
        print("🏭 STUDIO REGENERATION PIPELINE (Optimized)")
        print("=" * 60)
        
        # Step 1: Remove background
        print("\n🔸 Step 1/3: Background Removal (BiRefNet)")
        isolated_product = birefnet_service.remove_and_place_on_white(original_image)
        # FORCE UNLOAD BiRefNet
        if hasattr(birefnet_service, 'model'):
            del birefnet_service.model
            birefnet_service.model = None
            # FORCE GARBAGE COLLECTION
            gc.collect()
            if self.device == "mps":
                torch.mps.empty_cache() 
            elif self.device == "cuda":
                torch.cuda.empty_cache()
            print("   🗑️ Unloaded BiRefNet")
        print("   ✅ Product isolated")
        
        # Step 2: Extract depth
        print("\n🔸 Step 2/3: Depth Extraction (DPT)")
        depth_map = depth_service.estimate_depth(isolated_product)
        # FORCE UNLOAD DPT
        depth_service.unload()
        print("   🗑️ Unloaded DPT")
        print("   ✅ Depth map extracted")
        
        # Step 3: Generate studio image
        print("\n🔸 Step 3/3: Studio Generation (SDXL + ControlNet)")
        
        # Enable aggressive memory saving for SDXL
        self.load_pipeline(low_memory=True)
        
        # Load Lightning LoRA if fast mode requested
        if quality == "fast":
            self.load_lightning_lora()
            print("   ⚡ FAST MODE: Using SDXL Lightning (4 steps)")
        
        studio_result = self.generate_studio_image(
            product_image=isolated_product,
            depth_map=depth_map,
            prompt=studio_prompt,
            num_inference_steps=settings["steps"],
            controlnet_conditioning_scale=settings["scale"]
        )
        print("   ✅ Studio image generated")
        
        print("\n" + "=" * 60)
        print("✅ PIPELINE COMPLETE")
        print("=" * 60)
        
        return isolated_product, depth_map, studio_result
    
    async def process_upload(
        self,
        image_file,
        prompt: str = None,
        quality: str = "balanced"
    ) -> dict:
        """
        Process uploaded image and return all results.
        
        Returns:
            {
                "isolated": "path/to/isolated.png",
                "depth": "path/to/depth.png",
                "studio": "path/to/studio.png",
                "comparison": "path/to/comparison.png"
            }
        """
        import time
        
        # Load image
        contents = await image_file.read()
        original = Image.open(BytesIO(contents)).convert("RGB")
        
        # Run pipeline
        isolated, depth, studio = self.regenerate_from_scratch(
            original, studio_prompt=prompt, quality=quality
        )
        
        # Save results
        timestamp = int(time.time())
        os.makedirs("static/output", exist_ok=True)
        
        paths = {
            "isolated": f"static/output/studio_isolated_{timestamp}.png",
            "depth": f"static/output/studio_depth_{timestamp}.png",
            "studio": f"static/output/studio_result_{timestamp}.png",
        }
        
        isolated.save(paths["isolated"])
        depth.save(paths["depth"])
        studio.save(paths["studio"])
        
        # Create comparison image (original | isolated | studio)
        comparison = self._create_comparison(original, isolated, studio)
        paths["comparison"] = f"static/output/studio_comparison_{timestamp}.png"
        comparison.save(paths["comparison"])
        
        return paths
    
    def _create_comparison(self, img1: Image.Image, img2: Image.Image, img3: Image.Image) -> Image.Image:
        """Create side-by-side comparison"""
        # Resize all to same height
        height = 800
        imgs = []
        for img in [img1, img2, img3]:
            aspect = img.size[0] / img.size[1]
            width = int(height * aspect)
            imgs.append(img.resize((width, height), Image.LANCZOS))
        
        # Concatenate horizontally
        total_width = sum(img.size[0] for img in imgs)
        comparison = Image.new("RGB", (total_width, height))
        
        x = 0
        for img in imgs:
            comparison.paste(img, (x, 0))
            x += img.size[0]
        
        return comparison
    
    def unload(self):
        """Free memory by unloading the pipeline"""
        if self.pipeline is not None:
            del self.pipeline
            self.pipeline = None
            
            import gc
            gc.collect()
            
            if self.device == "mps":
                torch.mps.empty_cache()
            elif self.device == "cuda":
                torch.cuda.empty_cache()
            
            print("🗑️ Studio regeneration pipeline unloaded")


# Singleton instance
studio_regen_service = StudioRegenerationService()
