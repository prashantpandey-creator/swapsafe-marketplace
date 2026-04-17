from PIL import Image, ImageDraw, ImageFilter, ImageOps
from app.config import DeviceConfig
from app.config import DeviceConfig
import os
import torch
import numpy as np
from fastapi import UploadFile

class TurboService:
    def __init__(self):
        self.device = DeviceConfig.get_device()
        self.pipeline = None
        self.model_id = "stabilityai/sdxl-turbo"

    def load_pipeline(self):
        if self.pipeline:
            return
        
        print("⚡ Loading SDXL Lightning + ControlNet Depth (Phase 9 Perfection)...")
        try:
            from diffusers import StableDiffusionXLControlNetImg2ImgPipeline, ControlNetModel, EulerDiscreteScheduler
            
            # 1. Load ControlNet Depth
            controlnet = ControlNetModel.from_pretrained(
                "diffusers/controlnet-depth-sdxl-1.0-small", 
                torch_dtype=torch.float16
            ).to(self.device)
            
            # 2. Load Main Pipeline
            base_model = "SG161222/RealVisXL_V4.0"
            self.pipeline = StableDiffusionXLControlNetImg2ImgPipeline.from_pretrained(
                base_model,
                controlnet=controlnet,
                torch_dtype=torch.float16,
                use_safetensors=True
            ).to(self.device)

            # 3. Memory & Speed Fixes
            self.pipeline.vae = self.pipeline.vae.to(dtype=torch.float32)
            self.pipeline.load_lora_weights("ByteDance/SDXL-Lightning", weight_name="sdxl_lightning_4step_lora.safetensors")
            self.pipeline.fuse_lora()
            self.pipeline.scheduler = EulerDiscreteScheduler.from_config(self.pipeline.scheduler.config, timestep_spacing="trailing")
            
            print("✅ Phase 9 Ready: SDXL + ControlNet Depth.")
        except Exception as e:
            import traceback
            error_msg = f"❌ Failed to load Studio Pipeline: {e}\n{traceback.format_exc()}"
            print(error_msg)
            raise e

    def get_depth_image(self, image: Image.Image):
        from transformers import pipeline as hf_pipeline
        depth_estimator = hf_pipeline("depth-estimation", model="Intel/dpt-large")
        result = depth_estimator(image)["depth"]
        return result

    def deep_align(self, image: Image.Image, mask_image: Image.Image):
        """Phase 9: PCA-based Deep Geometric Alignment (Tripod/90-degree flattened shot)."""
        import cv2
        mask_np = np.array(mask_image)
        contours, _ = cv2.findContours(mask_np, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return image, mask_image
            
        largest_cnt = max(contours, key=cv2.contourArea)
        
        # 1. Perspective Flattening (Keystone Correction)
        # Use minAreaRect to get the perspective corners
        rect = cv2.minAreaRect(largest_cnt)
        box = cv2.boxPoints(rect)
        box = np.int64(box)
        
        # Sort points: top-left, top-right, bottom-right, bottom-left
        src_pts = box.astype("float32")
        s = src_pts.sum(axis=1)
        diff = np.diff(src_pts, axis=1)
        ordered_pts = np.zeros((4, 2), dtype="float32")
        ordered_pts[0] = src_pts[np.argmin(s)]
        ordered_pts[2] = src_pts[np.argmax(s)]
        ordered_pts[1] = src_pts[np.argmin(diff)]
        ordered_pts[3] = src_pts[np.argmax(diff)]
        
        # Calculate true width and height for a flat shot
        width_a = np.sqrt(((ordered_pts[2][0] - ordered_pts[3][0]) ** 2) + ((ordered_pts[2][1] - ordered_pts[3][1]) ** 2))
        width_b = np.sqrt(((ordered_pts[1][0] - ordered_pts[0][0]) ** 2) + ((ordered_pts[1][1] - ordered_pts[0][1]) ** 2))
        dst_w = int(max(width_a, width_b))
        
        height_a = np.sqrt(((ordered_pts[1][0] - ordered_pts[2][0]) ** 2) + ((ordered_pts[1][1] - ordered_pts[2][1]) ** 2))
        height_b = np.sqrt(((ordered_pts[0][0] - ordered_pts[3][0]) ** 2) + ((ordered_pts[0][1] - ordered_pts[3][1]) ** 2))
        dst_h = int(max(height_a, height_b))
        
        # Target points for regular grid (flat shot)
        dst_pts = np.array([
            [0, 0],
            [dst_w - 1, 0],
            [dst_w - 1, dst_h - 1],
            [0, dst_h - 1]], dtype="float32")
            
        M = cv2.getPerspectiveTransform(ordered_pts, dst_pts)
        warped_img = cv2.warpPerspective(np.array(image), M, (dst_w, dst_h))
        warped_mask = cv2.warpPerspective(mask_np, M, (dst_w, dst_h))
        
        # Normalize: if height > width, it's vertical (like a speaker), else horizontal (like a soundbar)
        # We want to keep the product centered and upright.
        
        # --- SMART PADDING RE-LOGIC (85% RULE) ---
        target_max = 870 # 85% of 1024
        scale_p = min(target_max / dst_w, target_max / dst_h)
        dst_w = int(dst_w * scale_p)
        dst_h = int(dst_h * scale_p)
        
        warped_img = cv2.resize(warped_img, (dst_w, dst_h), interpolation=cv2.INTER_LANCZOS4)
        warped_mask = cv2.resize(warped_mask, (dst_w, dst_h), interpolation=cv2.INTER_NEAREST)

        # Paste onto clean 1024x1024 white canvas (Studio centered)
        final_img = Image.new("RGB", (1024, 1024), (255, 255, 255))
        final_mask = Image.new("L", (1024, 1024), 0)
        
        # Center coordinates
        offset_x = (1024 - dst_w) // 2
        offset_y = (1024 - dst_h) // 2
        
        final_img.paste(Image.fromarray(warped_img), (offset_x, offset_y))
        final_mask.paste(Image.fromarray(warped_mask), (offset_x, offset_y))
        
        return final_img, final_mask

    async def agentic_edit(self, image_file: UploadFile, target_text: str, prompt: str, negative_prompt: str = "", strength: float = 0.65) -> str:
        try:
            self.load_pipeline()
            contents = await image_file.read()
            from io import BytesIO
            raw_image = Image.open(BytesIO(contents)).convert("RGB")
            input_image = raw_image.resize((1024, 1024))
            
            # 1. Semantic Mask
            from app.services.vision_service import vision_service
            print(f"⚡ Phase 9: Detailed Semantic Scan for '{target_text}'...")
            semantic_mask = vision_service.get_mask(input_image, target_text)
            
            # 2. Deep Geometric Alignment (Tripod/Keystone correction)
            print("⚡ Phase 9: Deep Geometric Alignment (Flattening Perspective)...")
            input_image, semantic_mask = self.deep_align(input_image, semantic_mask)
            
            # 3. Depth Lock
            print("⚡ Phase 9: Digital Twin Volume Lock (Depth)...")
            depth_image = self.get_depth_image(input_image)
            
            # 4. Product Extraction for Seed
            product_layer = input_image.convert("RGBA")
            product_layer.putalpha(semantic_mask)
            clean_canvas = Image.new("RGB", (1024, 1024), (255, 255, 255))
            clean_canvas.paste(product_layer, (0, 0), product_layer)
            
            # 5. Pass 1: Structural Rendering
            print(f"⚡ Phase 10: Pass 1 (Structural Rendering) - Strength={strength}...")
            # CRITICAL: Explicit pure white background prompt
            studio_prompt = f"{prompt}, isolated product on pure white background, product photography, clean cutout, no shadows on background, #FFFFFF background"
            
            structure_result = self.pipeline(
                prompt=studio_prompt,
                negative_prompt=negative_prompt + ", gradient background, gray background, shadows on floor, studio backdrop, colored background",
                image=clean_canvas,
                control_image=depth_image,
                num_inference_steps=4, 
                strength=strength, 
                guidance_scale=0.0,
                controlnet_conditioning_scale=0.45 
            ).images[0].convert("RGBA")
            
            # 6. GUARANTEED WHITE BACKGROUND: Force-replace non-product pixels
            print("⚡ Phase 10: Enforcing Pure White Background (#FFFFFF)...")
            
            # Create inverted mask (background area)
            from PIL import ImageFilter
            product_mask_np = np.array(semantic_mask)
            # Dilate the mask slightly to avoid edge artifacts
            product_core_mask = semantic_mask.filter(ImageFilter.MaxFilter(size=5))
            product_core_mask_np = np.array(product_core_mask)
            
            # Convert result to numpy
            result_np = np.array(structure_result)
            
            # Force white on background (where mask is 0)
            white_bg = np.ones_like(result_np) * 255
            # Use mask to blend: product pixels stay, background becomes white
            mask_3d = np.stack([product_core_mask_np / 255.0] * 4, axis=-1)  # RGBA
            final_np = (result_np * mask_3d + white_bg * (1 - mask_3d)).astype(np.uint8)
            final_result = Image.fromarray(final_np).convert("RGB")
            
            import time
            filename = f"white_bg_{int(time.time())}.png"
            os.makedirs("static/output", exist_ok=True)
            path = f"static/output/{filename}"
            final_result.save(path)
            return path
            
        except Exception as e:
            import traceback
            print(f"Studio Perfection Plan Failed: {e}\n{traceback.format_exc()}")
            return "error.png"

    def generate(self, input_image: Image.Image, prompt: str, strength: float = 0.5) -> Image.Image:
        """Synchronous fast generation for Turbo endpoint."""
        self.load_pipeline()
        
        # 1. Smart Padding / Alignment (Reuse logic)
        # For simple generate, we might not have a mask, so we create a dummy one or use the image size
        # Actually, deep_align needs a mask. Let's create a proxy mask (everything is product)
        dummy_mask = Image.new("L", input_image.size, 255)
        aligned_image, _ = self.deep_align(input_image, dummy_mask)
        
        # 2. Depth Lock
        depth_image = self.get_depth_image(aligned_image)
        
        # 3. Fast Generation
        studio_prompt = f"{prompt}, professional studio lighting, amazon product shot, high-end marketplace photography, minimalist clean aesthetic"
        
        result = self.pipeline(
            prompt=studio_prompt,
            negative_prompt="lowres, bad anatomy, text, watermark, blurry edges, halo",
            image=aligned_image,
            control_image=depth_image,
            num_inference_steps=4, 
            strength=strength, 
            guidance_scale=0.0,
            controlnet_conditioning_scale=0.3
        ).images[0]
        
        return result

turbo_service = TurboService()
