"""
IC-Light Service - Studio Relighting Enhancement (V3 - Correct Implementation)
Based on official lllyasviel/IC-Light gradio_demo.py

Key implementation notes:
1. IC-Light weights are OFFSETS - they must be ADDED to base SD weights
2. UNet forward is hooked to inject foreground latent via cross_attention_kwargs
3. Uses standard StableDiffusionPipeline with the hooked UNet
"""
import torch
import numpy as np
from PIL import Image
from typing import Optional, List
import os
import math


class ICLightService:
    """
    Production-grade IC-Light relighting service for product photography.
    Follows the exact architecture of the official gradio_demo.py.
    """
    
    def __init__(self):
        self.device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
        self.dtype = torch.float32 if self.device == "mps" else torch.float16
        
        self.unet = None
        self.vae = None
        self.text_encoder = None
        self.tokenizer = None
        self.scheduler = None
        self.pipe = None
        self.unet_original_forward = None
        self.is_loaded = False
        
    def load_model(self):
        """Load IC-Light model with correct OFFSET weight merging."""
        if self.is_loaded:
            return
            
        print("⚡ Loading IC-Light (Studio Relighting Model)...")
        
        try:
            from diffusers import (
                AutoencoderKL, 
                UNet2DConditionModel, 
                StableDiffusionPipeline,
                DPMSolverMultistepScheduler
            )
            from transformers import CLIPTextModel, CLIPTokenizer
            from huggingface_hub import hf_hub_download
            from safetensors.torch import load_file
            
            # Base model (official uses realistic-vision, we use vanilla SD 1.5)
            base_model = "runwayml/stable-diffusion-v1-5"
            
            print("  📦 Loading base SD 1.5 components...")
            self.tokenizer = CLIPTokenizer.from_pretrained(base_model, subfolder="tokenizer")
            self.text_encoder = CLIPTextModel.from_pretrained(base_model, subfolder="text_encoder")
            self.vae = AutoencoderKL.from_pretrained(base_model, subfolder="vae")
            self.unet = UNet2DConditionModel.from_pretrained(base_model, subfolder="unet")
            
            # Step 1: Modify UNet conv_in from 4 to 8 channels
            print("  🔧 Modifying UNet for 8-channel input...")
            with torch.no_grad():
                new_conv_in = torch.nn.Conv2d(
                    8, self.unet.conv_in.out_channels,
                    self.unet.conv_in.kernel_size,
                    self.unet.conv_in.stride,
                    self.unet.conv_in.padding
                )
                new_conv_in.weight.zero_()
                new_conv_in.weight[:, :4, :, :].copy_(self.unet.conv_in.weight)
                new_conv_in.bias = self.unet.conv_in.bias
                self.unet.conv_in = new_conv_in
            
            # Step 2: Hook UNet forward to inject concat_conds
            print("  🔧 Installing UNet forward hook...")
            self.unet_original_forward = self.unet.forward
            
            def hooked_unet_forward(sample, timestep, encoder_hidden_states, **kwargs):
                c_concat = kwargs.get('cross_attention_kwargs', {}).get('concat_conds')
                if c_concat is not None:
                    c_concat = c_concat.to(sample)
                    c_concat = torch.cat([c_concat] * (sample.shape[0] // c_concat.shape[0]), dim=0)
                    new_sample = torch.cat([sample, c_concat], dim=1)
                    kwargs['cross_attention_kwargs'] = {}
                    return self.unet_original_forward(new_sample, timestep, encoder_hidden_states, **kwargs)
                return self.unet_original_forward(sample, timestep, encoder_hidden_states, **kwargs)
            
            self.unet.forward = hooked_unet_forward
            
            # Step 3: Download and merge IC-Light OFFSET weights
            print("  📥 Loading IC-Light offset weights...")
            model_path = hf_hub_download(
                repo_id="lllyasviel/ic-light",
                filename="iclight_sd15_fc.safetensors"
            )
            
            sd_offset = load_file(model_path)
            sd_origin = self.unet.state_dict()
            
            # CRITICAL: IC-Light weights are OFFSETS, ADD them to base
            sd_merged = {}
            for k in sd_origin.keys():
                if k in sd_offset:
                    sd_merged[k] = sd_origin[k] + sd_offset[k].to(sd_origin[k].dtype)
                else:
                    sd_merged[k] = sd_origin[k]
            
            self.unet.load_state_dict(sd_merged, strict=True)
            print(f"  ✅ Merged {len(sd_offset)} IC-Light offset tensors")
            
            del sd_offset, sd_origin, sd_merged
            
            # Step 4: Create scheduler
            self.scheduler = DPMSolverMultistepScheduler(
                num_train_timesteps=1000,
                beta_start=0.00085,
                beta_end=0.012,
                algorithm_type="sde-dpmsolver++",
                use_karras_sigmas=True,
                steps_offset=1
            )
            
            # Step 5: Move to device
            print(f"  📦 Moving to {self.device}...")
            self.text_encoder = self.text_encoder.to(device=self.device, dtype=self.dtype)
            self.vae = self.vae.to(device=self.device, dtype=self.dtype)
            self.unet = self.unet.to(device=self.device, dtype=self.dtype)
            
            # Step 6: Create pipeline
            self.pipe = StableDiffusionPipeline(
                vae=self.vae,
                text_encoder=self.text_encoder,
                tokenizer=self.tokenizer,
                unet=self.unet,
                scheduler=self.scheduler,
                safety_checker=None,
                requires_safety_checker=False,
                feature_extractor=None,
                image_encoder=None
            )
            
            self.is_loaded = True
            print(f"✅ IC-Light loaded on {self.device}")
            
        except Exception as e:
            print(f"❌ IC-Light load failed: {e}")
            import traceback
            traceback.print_exc()
            self.is_loaded = False
    
    def _encode_prompt(self, prompt: str, negative_prompt: str = ""):
        """Encode prompts to match IC-Light's approach."""
        # Positive
        text_inputs = self.tokenizer(
            prompt, 
            padding="max_length", 
            max_length=self.tokenizer.model_max_length,
            truncation=True, 
            return_tensors="pt"
        )
        conds = self.text_encoder(text_inputs.input_ids.to(self.device))[0]
        
        # Negative
        uncond_inputs = self.tokenizer(
            negative_prompt,
            padding="max_length",
            max_length=self.tokenizer.model_max_length,
            truncation=True,
            return_tensors="pt"
        )
        unconds = self.text_encoder(uncond_inputs.input_ids.to(self.device))[0]
        
        return conds, unconds
    
    def _numpy2pytorch(self, imgs: List[np.ndarray]) -> torch.Tensor:
        """Convert numpy images to pytorch tensor (IC-Light style)."""
        h = torch.from_numpy(np.stack(imgs, axis=0)).float() / 127.0 - 1.0
        h = h.movedim(-1, 1)
        return h
    
    def _pytorch2numpy(self, imgs: torch.Tensor, quant: bool = True) -> List[np.ndarray]:
        """Convert pytorch tensor to numpy images (IC-Light style)."""
        results = []
        for x in imgs:
            y = x.movedim(0, -1)
            if quant:
                y = y * 127.5 + 127.5
                y = y.detach().float().cpu().numpy().clip(0, 255).astype(np.uint8)
            else:
                y = y * 0.5 + 0.5
                y = y.detach().float().cpu().numpy().clip(0, 1).astype(np.float32)
            results.append(y)
        return results
    
    def _resize_and_center_crop(self, image: np.ndarray, target_width: int, target_height: int) -> np.ndarray:
        """Resize and center crop image."""
        pil_image = Image.fromarray(image)
        original_width, original_height = pil_image.size
        scale_factor = max(target_width / original_width, target_height / original_height)
        resized_width = int(round(original_width * scale_factor))
        resized_height = int(round(original_height * scale_factor))
        resized_image = pil_image.resize((resized_width, resized_height), Image.LANCZOS)
        left = (resized_width - target_width) / 2
        top = (resized_height - target_height) / 2
        right = (resized_width + target_width) / 2
        bottom = (resized_height + target_height) / 2
        cropped_image = resized_image.crop((left, top, right, bottom))
        return np.array(cropped_image)
    
    def apply_studio_lighting(
        self,
        foreground_image: Image.Image,
        prompt: str = "product, soft studio lighting, professional photography",
        negative_prompt: str = "dark, shadows, low quality, blurry",
        num_steps: int = 25,
        guidance_scale: float = 7.0,
        seed: int = 42,
        lighting_direction: str = "center"
    ) -> Image.Image:
        """
        Apply studio-quality lighting to a foreground image.
        
        Args:
            foreground_image: Product image (with or without alpha)
            prompt: Lighting description
            negative_prompt: What to avoid
            num_steps: Inference steps (20-30 recommended)
            guidance_scale: CFG scale (5-9 works well)
            seed: Random seed
            lighting_direction: "left", "right", "top", "bottom", "center"
        
        Returns:
            Relit product image with studio lighting
        """
        if not self.is_loaded:
            self.load_model()
            
        if not self.is_loaded:
            print("⚠️ IC-Light not available, returning original")
            return foreground_image.convert("RGB")
        
        original_size = foreground_image.size
        image_width, image_height = 512, 512  # SD 1.5 native resolution
        
        # Convert to numpy RGB
        if foreground_image.mode == "RGBA":
            # Composite onto white background for foreground conditioning
            white_bg = Image.new("RGB", foreground_image.size, (255, 255, 255))
            white_bg.paste(foreground_image, mask=foreground_image.split()[3])
            fg_array = np.array(white_bg)
            original_alpha = foreground_image.split()[3]
        else:
            fg_array = np.array(foreground_image.convert("RGB"))
            original_alpha = None
        
        # Resize foreground
        fg_resized = self._resize_and_center_crop(fg_array, image_width, image_height)
        
        # Create initial latent background based on lighting direction
        bg_array = self._create_lighting_background(lighting_direction, image_width, image_height)
        
        # Encode foreground to latent (concat_conds)
        concat_conds = self._numpy2pytorch([fg_resized]).to(device=self.device, dtype=self.dtype)
        concat_conds = self.vae.encode(concat_conds).latent_dist.mode() * self.vae.config.scaling_factor
        
        # Encode prompts
        conds, unconds = self._encode_prompt(prompt, negative_prompt)
        
        # Set seed
        rng = torch.Generator(device=self.device).manual_seed(seed)
        
        # Encode background for img2img
        bg_tensor = self._numpy2pytorch([bg_array]).to(device=self.device, dtype=self.dtype)
        bg_latent = self.vae.encode(bg_tensor).latent_dist.mode() * self.vae.config.scaling_factor
        
        print(f"  🎨 Relighting with IC-Light ({num_steps} steps)...")
        
        # Run pipeline with concat_conds in cross_attention_kwargs
        from diffusers import StableDiffusionImg2ImgPipeline
        
        i2i_pipe = StableDiffusionImg2ImgPipeline(
            vae=self.vae,
            text_encoder=self.text_encoder,
            tokenizer=self.tokenizer,
            unet=self.unet,
            scheduler=self.scheduler,
            safety_checker=None,
            requires_safety_checker=False,
            feature_extractor=None,
            image_encoder=None
        )
        
        # Use img2img with background
        denoise_strength = 0.9
        
        latents = i2i_pipe(
            image=bg_latent,
            strength=denoise_strength,
            prompt_embeds=conds,
            negative_prompt_embeds=unconds,
            width=image_width,
            height=image_height,
            num_inference_steps=int(round(num_steps / denoise_strength)),
            num_images_per_prompt=1,
            generator=rng,
            output_type='latent',
            guidance_scale=guidance_scale,
            cross_attention_kwargs={'concat_conds': concat_conds},
        ).images.to(self.dtype) / self.vae.config.scaling_factor
        
        # Decode
        pixels = self.vae.decode(latents).sample
        results = self._pytorch2numpy(pixels)
        
        result_image = Image.fromarray(results[0])
        
        # Resize back to original size
        result_image = result_image.resize(original_size, Image.LANCZOS)
        
        # Composite with original alpha if available
        if original_alpha is not None:
            result_rgba = result_image.convert("RGBA")
            result_rgba.putalpha(original_alpha)
            
            # Place on white background
            white_bg = Image.new("RGB", original_size, (255, 255, 255))
            white_bg.paste(result_rgba, mask=original_alpha)
            return white_bg
        
        return result_image
    
    def _create_lighting_background(self, direction: str, width: int, height: int) -> np.ndarray:
        """Create gradient background for lighting direction hint."""
        if direction == "left":
            gradient = np.linspace(255, 0, width)
            image = np.tile(gradient, (height, 1))
        elif direction == "right":
            gradient = np.linspace(0, 255, width)
            image = np.tile(gradient, (height, 1))
        elif direction == "top":
            gradient = np.linspace(255, 0, height)[:, None]
            image = np.tile(gradient, (1, width))
        elif direction == "bottom":
            gradient = np.linspace(0, 255, height)[:, None]
            image = np.tile(gradient, (1, width))
        else:  # center - use top lighting for studio look
            gradient = np.linspace(255, 200, height)[:, None]
            image = np.tile(gradient, (1, width))
        
        return np.stack((image,) * 3, axis=-1).astype(np.uint8)


# Singleton instance
iclight_service = ICLightService()


def test_iclight():
    """Test IC-Light with BiRefNet result."""
    test_image_path = "/Users/badenath/.gemini/antigravity/brain/0509a38a-18d9-4027-ad3d-47864438b67f/birefnet_result.png"
    
    if os.path.exists(test_image_path):
        img = Image.open(test_image_path)
        
        # Apply studio lighting
        result = iclight_service.apply_studio_lighting(
            img,
            prompt="product photography, soft studio lighting, professional, clean white background",
            num_steps=25,
            seed=42,
            lighting_direction="top"
        )
        
        output_path = "/Users/badenath/.gemini/antigravity/brain/0509a38a-18d9-4027-ad3d-47864438b67f/iclight_result.png"
        result.save(output_path)
        print(f"✅ IC-Light result saved to: {output_path}")
        
        return result
    else:
        print(f"❌ Test image not found: {test_image_path}")
        return None


if __name__ == "__main__":
    test_iclight()
