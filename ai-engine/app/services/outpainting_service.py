import cv2
import numpy as np
from PIL import Image, ImageOps
import gc

class SmartRepairService:
    """
    Simple Smart Repair using OpenCV Inpainting.
    - Detects cropped edges
    - Expands canvas
    - Uses cv2.inpaint (Telea/Navier-Stokes) for seamless extension
    - No AI hallucination - just extends existing patterns
    """
    
    def __init__(self):
        self.expansion_pixels = 64  # Small expansion for natural extension
        
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
        Main entry: Detect crop -> Expand -> OpenCV Inpaint -> Return on White BG
        """
        print("🔍 Checking for cropped edges...")
        crop_info = self.detect_crop(image)
        
        if not crop_info["is_cropped"]:
            print("   ✅ No cropping detected. Placing on white.")
            bg = Image.new("RGB", image.size, (255, 255, 255))
            bg.paste(image, (0, 0), image)
            return bg
            
        print(f"   ⚠️  Cropped edges: {crop_info}")
        print("   🎨 Expanding and Inpainting (OpenCV)...")
        
        w, h = image.size
        pad = self.expansion_pixels
        
        # Calculate new dimensions
        new_w = w + (pad if crop_info["left"] else 0) + (pad if crop_info["right"] else 0)
        new_h = h + (pad if crop_info["top"] else 0) + (pad if crop_info["bottom"] else 0)
        
        # Create expanded canvas (White Background)
        expanded_rgb = Image.new("RGB", (new_w, new_h), (255, 255, 255))
        expanded_alpha = Image.new("L", (new_w, new_h), 0)
        
        # Paste coordinates
        paste_x = pad if crop_info["left"] else 0
        paste_y = pad if crop_info["top"] else 0
        
        # Paste original onto white canvas
        expanded_rgb.paste(image.convert("RGB"), (paste_x, paste_y))
        
        # Paste alpha channel
        if image.mode == "RGBA":
            expanded_alpha.paste(image.split()[-1], (paste_x, paste_y))
        else:
            # If no alpha, assume fully opaque
            expanded_alpha.paste(Image.new("L", image.size, 255), (paste_x, paste_y))
        
        # Create inpaint mask: White (255) = areas to inpaint (transparent)
        # Invert alpha: opaque pixels -> 0 (keep), transparent -> 255 (inpaint)
        mask = ImageOps.invert(expanded_alpha)
        
        # Convert to numpy for OpenCV
        img_np = np.array(expanded_rgb)
        mask_np = np.array(mask)
        
        # OpenCV Inpainting (Telea algorithm)
        print("   🖌️  Running OpenCV Inpaint (Telea)...")
        result_np = cv2.inpaint(img_np, mask_np, inpaintRadius=7, flags=cv2.INPAINT_TELEA)
        
        # Convert back to PIL
        result = Image.fromarray(result_np)
        
        # CRITICAL: Paste original object back to ensure 100% texture preservation
        print("   🧩 Compositing original texture back...")
        result.paste(image.convert("RGB"), (paste_x, paste_y), image)
        
        return result

# Singleton
smart_repair_service = SmartRepairService()

