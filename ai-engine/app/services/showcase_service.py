"""
Showcase Photo Service - Creates professional product photos
Uses rembg for background removal + Pillow for white/gradient background
"""
import io
from PIL import Image, ImageDraw, ImageFilter
from typing import Optional
import base64

# rembg will be imported at runtime to handle cases where not installed
def get_rembg():
    try:
        from rembg import remove
        return remove
    except ImportError:
        print("⚠️ rembg not installed. Using fallback (no background removal).")
        return None

class ShowcaseService:
    """
    Creates professional e-commerce showcase photos with clean backgrounds.
    """
    
    def __init__(self):
        self.remove_bg = get_rembg()
        print("📸 Showcase Service initialized")
    
    async def create_showcase(
        self, 
        image_bytes: bytes,
        background: str = "white",  # white, gradient, transparent
        add_shadow: bool = True,
        output_size: tuple = (1024, 1024),
        product_hint: str = ""  # Product name for context (future use for smart masking)
    ) -> dict:
        """
        Creates a professional showcase photo.
        
        1. Remove background from product image
        2. Add clean white/gradient background
        3. Center product with proper padding
        4. Add subtle shadow for depth
        """
        try:
            # Step 1: Remove background
            print("✂️ Removing background...")
            if self.remove_bg:
                fg_bytes = self.remove_bg(image_bytes)
                fg_image = Image.open(io.BytesIO(fg_bytes)).convert("RGBA")
            else:
                # Fallback: just use original image
                fg_image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
            
            # Step 2: Create background
            print(f"🎨 Creating {background} background...")
            if background == "gradient":
                bg_image = self._create_gradient_bg(output_size)
            elif background == "transparent":
                bg_image = Image.new("RGBA", output_size, (0, 0, 0, 0))
            else:  # white
                bg_image = Image.new("RGBA", output_size, (255, 255, 255, 255))
            
            # Step 3: Resize and center product
            fg_image = self._fit_to_canvas(fg_image, output_size, padding=0.1)
            
            # Step 4: Add shadow (optional)
            if add_shadow and background != "transparent":
                shadow = self._create_shadow(fg_image, output_size)
                bg_image = Image.alpha_composite(bg_image, shadow)
            
            # Step 5: Composite final image
            position = (
                (output_size[0] - fg_image.width) // 2,
                (output_size[1] - fg_image.height) // 2
            )
            bg_image.paste(fg_image, position, fg_image)
            
            # Convert to bytes
            output_buffer = io.BytesIO()
            final_image = bg_image.convert("RGB") if background != "transparent" else bg_image
            final_image.save(output_buffer, format="PNG" if background == "transparent" else "JPEG", quality=95)
            output_buffer.seek(0)
            
            # Convert to base64 for API response
            b64_image = base64.b64encode(output_buffer.getvalue()).decode()
            
            print("✅ Showcase photo created!")
            return {
                "status": "success",
                "image_data": f"data:image/{'png' if background == 'transparent' else 'jpeg'};base64,{b64_image}",
                "dimensions": output_size
            }
            
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
