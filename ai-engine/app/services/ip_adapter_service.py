"""
IP-Adapter Studio Enhancement Service
Uses IP-Adapter + SDXL to generate studio-quality product images
while preserving product identity from the reference image.
"""
import torch
from PIL import Image
from diffusers import StableDiffusionXLPipeline, AutoencoderKL
import os


class IPAdapterStudioService:
    """
    IP-Adapter + SDXL for studio-quality product photography.
    - Preserves product identity using image prompting
    - Generates clean, professional studio aesthetics
    - Works with segmented product images on white background
    """
    
    def __init__(self):
        self.pipe = None
        self.device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
        
    def load_models(self):
        """Load SDXL + IP-Adapter models"""
        if self.pipe is not None:
            return
            
        print("⚡ Loading IP-Adapter + SDXL Pipeline...")
        
        # Load SDXL base
        model_id = "stabilityai/stable-diffusion-xl-base-1.0"
        
        # Load VAE for better quality
        vae = AutoencoderKL.from_pretrained(
            "madebyollin/sdxl-vae-fp16-fix",
            torch_dtype=torch.float32
        )
        
        self.pipe = StableDiffusionXLPipeline.from_pretrained(
            model_id,
            vae=vae,
            torch_dtype=torch.float32,  # MPS needs float32
            use_safetensors=True
        )
        
        self.pipe.to(self.device)
        
        # Load IP-Adapter - use the base version that's more compatible
        print("   📦 Loading IP-Adapter weights...")
        self.pipe.load_ip_adapter(
            "h94/IP-Adapter",
            subfolder="sdxl_models",
            weight_name="ip-adapter_sdxl.safetensors"  # Use base version, not plus
        )
        
        # Set IP-Adapter scale (how much to follow the reference image)
        self.pipe.set_ip_adapter_scale(0.6)
        
        print(f"✅ IP-Adapter + SDXL loaded on {self.device}")
    
    def enhance_to_studio(
        self, 
        product_image: Image.Image,
        prompt: str = "professional studio product photography, pristine, clean, soft diffused lighting, white background, commercial product shot, high-end, magazine quality",
        negative_prompt: str = "blurry, low quality, distorted, amateur, dark, shadows, noisy, grainy",
        num_inference_steps: int = 30,
        guidance_scale: float = 7.5,
        ip_adapter_scale: float = 0.6
    ) -> Image.Image:
        """
        Transform product image to studio-quality version.
        """
        self.load_models()
        
        print("🎬 Generating studio-quality image...")
        print(f"   📝 Prompt: {prompt[:50]}...")
        print(f"   🎯 IP-Adapter Scale: {ip_adapter_scale}")
        
        # Update IP-Adapter scale
        self.pipe.set_ip_adapter_scale(ip_adapter_scale)
        
        # Prepare image for IP-Adapter - resize to SDXL-friendly size
        target_size = (1024, 1024)
        product_resized = product_image.resize(target_size, Image.LANCZOS)
        
        # Generate
        with torch.no_grad():
            result = self.pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                ip_adapter_image=product_resized,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                generator=torch.Generator(self.device).manual_seed(42)
            ).images[0]
        
        print("   ✅ Studio image generated")
        return result
    
    def batch_enhance(
        self,
        images: list[Image.Image],
        output_dir: str = "static/output/studio"
    ) -> list[str]:
        """Enhance multiple images to studio quality."""
        os.makedirs(output_dir, exist_ok=True)
        output_paths = []
        
        for i, img in enumerate(images):
            print(f"\n[{i+1}/{len(images)}] Processing...")
            result = self.enhance_to_studio(img)
            
            path = f"{output_dir}/studio_{i+1}.png"
            result.save(path)
            output_paths.append(path)
            print(f"   💾 Saved: {path}")
        
        return output_paths


# Singleton
ip_adapter_service = IPAdapterStudioService()
