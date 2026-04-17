"""
LaMa Inpainting Service
Uses LaMa (Large Mask Inpainting) for high-quality edge extension
"""
from simple_lama_inpainting import SimpleLama
from PIL import Image, ImageOps
import numpy as np
import torch


class LamaInpaintingService:
    """
    LaMa Inpainting wrapper for smart product enhancement.
    - Better quality than OpenCV
    - Faster than SDXL
    - No hallucination, just pixel-perfect extension
    """
    
    def __init__(self):
        self.model = None
        self.device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
        self.expansion_pixels = 64
        
    def load_model(self):
        """Load LaMa model (lazy loading)"""
        if self.model is not None:
            return
            
        print("⚡ Loading LaMa Inpainting Model...")
        self.model = SimpleLama()
        print(f"✅ LaMa loaded on {self.device}")
    
    def detect_crop(self, image: Image.Image) -> dict:
        """Detect if product touches edges (cropped)"""
        if image.mode != "RGBA":
            image = image.convert("RGBA")
            
        alpha = np.array(image.split()[-1])
        h, w = alpha.shape
        threshold = 10
        
        crop_info = {
            "top": np.any(alpha[0, :] > threshold),
            "bottom": np.any(alpha[-1, :] > threshold),
            "left": np.any(alpha[:, 0] > threshold),
            "right": np.any(alpha[:, -1] > threshold),
            "is_cropped": False
        }
        
        crop_info["is_cropped"] = any([crop_info[k] for k in ["top", "bottom", "left", "right"]])
        return crop_info
    
    def smart_repair(self, image: Image.Image) -> Image.Image:
        """
        Main entry: Detect crop -> Expand -> LaMa Inpaint -> Return on White BG
        """
        print("🔍 Checking for cropped edges...")
        crop_info = self.detect_crop(image)
        
        if not crop_info["is_cropped"]:
            print("   ✅ No cropping detected. Placing on white.")
            bg = Image.new("RGB", image.size, (255, 255, 255))
            bg.paste(image, (0, 0), image)
            return bg
            
        print(f"   ⚠️  Cropped edges: {crop_info}")
        print("   🎨 Expanding and Inpainting (LaMa)...")
        
        # Load model
        self.load_model()
        
        w, h = image.size
        pad = self.expansion_pixels
        
        # Calculate new dimensions
        new_w = w + (pad if crop_info["left"] else 0) + (pad if crop_info["right"] else 0)
        new_h = h + (pad if crop_info["top"] else 0) + (pad if crop_info["bottom"] else 0)
        
        # Create expanded canvas (White Background)
        expanded_rgb = Image.new("RGB", (new_w, new_h), (255, 255, 255))
        
        # Paste coordinates
        paste_x = pad if crop_info["left"] else 0
        paste_y = pad if crop_info["top"] else 0
        
        # CRITICAL: Paste using alpha channel as mask so white shows through transparent areas
        # This ensures LaMa sees "product on white" not "product on black"
        if image.mode == "RGBA":
            expanded_rgb.paste(image, (paste_x, paste_y), image)  # Use image itself as mask
        else:
            expanded_rgb.paste(image.convert("RGB"), (paste_x, paste_y))
        
        # Create mask for LaMa: We need to inpaint the EXPANDED areas (white regions)
        # Build alpha channel for the expanded canvas
        expanded_alpha = Image.new("L", (new_w, new_h), 0)  # Start with transparent
        
        if image.mode == "RGBA":
            expanded_alpha.paste(image.split()[-1], (paste_x, paste_y))
        else:
            # If no alpha, assume fully opaque
            expanded_alpha.paste(Image.new("L", image.size, 255), (paste_x, paste_y))
        
        # Create inpaint mask: White (255) = areas to inpaint (transparent areas)
        # Invert alpha: opaque pixels -> 0 (keep), transparent -> 255 (inpaint)
        mask = ImageOps.invert(expanded_alpha)
        
        # DEBUG: Save what we're sending to LaMa
        expanded_rgb.save("static/output/DEBUG_lama_input.png")
        mask.save("static/output/DEBUG_lama_mask.png")
        print(f"   🐛 DEBUG: Saved LaMa input (should be white BG) and mask")
        
        # Run LaMa Inpainting
        print("   🖌️  Running LaMa Inpaint...")
        result = self.model(expanded_rgb, mask)
        
        # CRITICAL: Paste original object back to ensure 100% texture preservation
        print("   🧩 Compositing original texture back...")
        if image.mode == "RGBA":
            result.paste(image, (paste_x, paste_y), image)  # Use alpha as mask
        else:
            result.paste(image.convert("RGB"), (paste_x, paste_y))
        
        return result


# Singleton
lama_service = LamaInpaintingService()
