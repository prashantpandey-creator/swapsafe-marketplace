"""
Showcase Photo Service - Creates professional product photos
Uses rembg for background removal + Pillow for white/gradient background
Optionally uses upscaling for higher quality output
"""
import io
from PIL import Image, ImageDraw, ImageFilter
from typing import Optional
import base64

# rembg will be imported at runtime to handle cases where not installed
def get_rembg():
    try:
        from rembg import remove, new_session
        # Pre-load the general use model (better for products)
        try:
            session = new_session(model_name="isnet-general-use")
        except:
            print("⚠️ Failed to load isnet-general-use, falling back to default u2net")
            session = new_session()
        return remove, session
    except ImportError as e:
        print(f"⚠️ rembg not installed. Error: {e}")
        print(" Using fallback (no background removal).")
        return None, None

# Import upscale service
def get_upscale_service():
    try:
        from .upscale_service import upscale_service
        return upscale_service
    except ImportError:
        print("⚠️ Upscale service not available")
        return None



class ShowcaseService:
    """
    Creates professional e-commerce showcase photos with clean backgrounds.
    """
    
    
    def __init__(self):
        self._rembg_session = None
        self._remove_bg_func = None
        self.upscale_service = get_upscale_service() # This one seems fine (just import check)
        print("📸 Showcase Service initialized (Lazy Loading)")

    @property
    def rembg_session(self):
        if self._rembg_session is None:
            print("⏳ Lazy Loading rembg model...")
            remove, session = get_rembg()
            self._remove_bg_func = remove
            self._rembg_session = session
            print("✅ rembg model loaded")
        return self._rembg_session

    @property
    def remove_bg(self):
        if self._remove_bg_func is None:
            _ = self.rembg_session # Trigger load
        return self._remove_bg_func
    
    async def create_showcase(
        self, 
        image_bytes: bytes,
        background: str = "white",  # white, gradient, transparent
        add_shadow: bool = True,
        output_size: tuple = (1024, 1024),
        product_hint: str = "",  # Product name for context (future use for smart masking)
        apply_upscale: bool = True,  # NEW: Apply upscaling for better quality
        return_original: bool = True  # NEW: Return original image too
    ) -> dict:
        """
        Creates a professional showcase photo.
        
        1. Remove background from product image
        2. Add clean white/gradient background
        3. Center product with proper padding
        4. Add subtle shadow for depth
        """
        import time
        start = time.time()
        
        try:
            # Step 1: Remove background (Updated to use BiRefNet)
            print("   ✂️ Step A: Removing background (BiRefNet)...")
            step_start = time.time()
            
            from app.services.birefnet_service import birefnet_service
            from starlette.concurrency import run_in_threadpool
            
            # Use BiRefNet in a threadpool to avoid blocking event loop
            input_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            fg_image_pil = await run_in_threadpool(birefnet_service.remove_background, input_pil)
            fg_image = fg_image_pil.convert("RGBA")
            
            print(f"      ✅ Background removed in {time.time()-step_start:.2f}s")
                
            # Step 1.5: Upscale for better quality (NEW)
            if apply_upscale and self.upscale_service and background != "transparent":
                print("   🔬 Step A.5: Upscaling for quality...")
                upscale_start = time.time()
                # Preserve alpha before upscaling (Real-ESRGAN works on RGB)
                alpha_mask = fg_image.split()[-1]
                # Save fg to bytes, upscale, reload
                fg_buffer = io.BytesIO()
                # Composite onto a light matte to avoid dark edge halos
                matte_color = (255, 255, 255) if background != "gradient" else (248, 248, 248)
                fg_rgb = Image.new("RGB", fg_image.size, matte_color)
                fg_rgb.paste(fg_image, mask=alpha_mask)
                fg_rgb.save(fg_buffer, format="PNG")
                fg_buffer.seek(0)
                
                # Upscale service is likely async or should be checked too
                # Assuming it is async based on 'await' usage in original code
                upscale_result = await self.upscale_service.upscale_image(
                    fg_buffer.getvalue(),
                    target_size=output_size,
                    enhance_colors=True
                )
                
                # Reload the upscaled image and restore alpha
                upscaled_data = upscale_result.get("image_data", "")
                if upscaled_data.startswith("data:"):
                    upscaled_data = upscaled_data.split(",", 1)[1]
                upscaled_rgb = Image.open(io.BytesIO(base64.b64decode(upscaled_data))).convert("RGB")
                # Restore alpha at upscaled size to avoid black backgrounds
                alpha_up = alpha_mask.resize(upscaled_rgb.size, Image.Resampling.LANCZOS)
                alpha_up = alpha_up.filter(ImageFilter.GaussianBlur(radius=0.5))
                fg_image = upscaled_rgb.convert("RGBA")
                fg_image.putalpha(alpha_up)
                print(f"      ✅ Upscaled in {time.time()-upscale_start:.2f}s")
            
            # Step 2: Create background
            print(f"   🎨 Step B: Creating {background} background...")
            if background == "gradient":
                bg_image = self._create_gradient_bg(output_size)
            elif background == "transparent":
                bg_image = Image.new("RGBA", output_size, (0, 0, 0, 0))
            else:  # white
                bg_image = Image.new("RGBA", output_size, (255, 255, 255, 255))
            print(f"      ✅ Background {output_size[0]}x{output_size[1]} created")
            
            # Step 3: Resize and center product
            print("   📐 Step C: Resizing and centering...")
            fg_image = self._fit_to_canvas(fg_image, output_size, padding=0.1)
            print(f"      ✅ Product sized to {fg_image.width}x{fg_image.height}")
            
            # Step 4: Add shadow (optional)
            if add_shadow and background != "transparent":
                print("   🌫️ Step D: Adding shadow...")
                shadow = self._create_shadow(fg_image, output_size)
                bg_image = Image.alpha_composite(bg_image, shadow)
                print("      ✅ Shadow added")
            
            
            # Step 5: Composite final image
            print("   🔄 Step E: Compositing final image...")
            position = (
                (output_size[0] - fg_image.width) // 2,
                (output_size[1] - fg_image.height) // 2
            )
            bg_image.paste(fg_image, position, fg_image)
            print(f"      ✅ Product placed at {position}")
            
            # Convert to bytes
            print("   📦 Step F: Encoding to base64...")
            output_buffer = io.BytesIO()
            final_image = bg_image.convert("RGB") if background != "transparent" else bg_image
            final_image.save(output_buffer, format="PNG" if background == "transparent" else "JPEG", quality=95)
            output_buffer.seek(0)
            
            # Convert to base64 for API response
            b64_image = base64.b64encode(output_buffer.getvalue()).decode()
            
            # Also encode original image if requested
            original_b64 = None
            if return_original:
                original_buffer = io.BytesIO()
                original_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                # Resize original to same dimensions for easy comparison
                original_img = self._fit_to_canvas(original_img.convert("RGBA"), output_size, padding=0.1)
                original_final_buffer = io.BytesIO()
                original_img.convert("RGB").save(original_final_buffer, format="JPEG", quality=90)
                original_final_buffer.seek(0)
                original_b64 = base64.b64encode(original_final_buffer.getvalue()).decode()
            
            print("✅ Showcase photo created!")
            result = {
                "status": "success",
                "image_data": f"data:image/{'png' if background == 'transparent' else 'jpeg'};base64,{b64_image}",
                "dimensions": output_size
            }
            
            # Add original image if requested
            if original_b64:
                result["original_image_data"] = f"data:image/jpeg;base64,{original_b64}"
            
            return result
            
        except Exception as e:
            print(f"❌ Showcase creation failed: {e}")
            raise e
    
    def _create_gradient_bg(self, size: tuple) -> Image.Image:
        """Creates a subtle gradient background"""
        img = Image.new("RGBA", size)
        draw = ImageDraw.Draw(img)
        
        # Light gray to white gradient (subtle)
        for y in range(size[1]):
            # Calculate color (white at top, light gray at bottom)
            gray = int(255 - (y / size[1]) * 15)  # 255 to 240
            draw.line([(0, y), (size[0], y)], fill=(gray, gray, gray, 255))
        
        return img
    
    def _fit_to_canvas(self, img: Image.Image, canvas_size: tuple, padding: float = 0.1) -> Image.Image:
        """Resize image to fit canvas with padding"""
        max_width = int(canvas_size[0] * (1 - 2 * padding))
        max_height = int(canvas_size[1] * (1 - 2 * padding))
        
        # Calculate scaling factor
        scale = min(max_width / img.width, max_height / img.height)
        new_size = (int(img.width * scale), int(img.height * scale))
        
        return img.resize(new_size, Image.Resampling.LANCZOS)
    
    def _create_shadow(self, fg: Image.Image, canvas_size: tuple) -> Image.Image:
        """Creates a subtle drop shadow"""
        shadow = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
        
        # Create shadow from alpha channel
        shadow_layer = Image.new("RGBA", fg.size, (0, 0, 0, 40))  # Semi-transparent black
        shadow_layer.putalpha(fg.split()[-1])  # Use foreground alpha
        
        # Position shadow slightly offset and blurred
        shadow_pos = (
            (canvas_size[0] - fg.width) // 2 + 5,
            (canvas_size[1] - fg.height) // 2 + 10
        )
        shadow.paste(shadow_layer, shadow_pos, shadow_layer)
        
        # Blur the shadow
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=15))
        
        return shadow


# Singleton instance
showcase_service = ShowcaseService()
