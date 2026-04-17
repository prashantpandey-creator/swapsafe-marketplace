"""
Texture-Preserving Smart Fill Service
Uses actual textures from the product to fill missing areas.
NO AI generation - just intelligent texture sampling/mirroring.
"""
from PIL import Image, ImageOps
import cv2
import numpy as np


class TextureFillService:
    """
    Texture-preserving fill for extending cropped product edges.
    Uses OpenCV's PatchMatch-based inpainting for texture-aware fill.
    Samples from actual product textures, not AI-generated content.
    """
    
    def __init__(self):
        self.expansion_pixels = 64
    
    def detect_crop(self, image: Image.Image) -> dict:
        """Detect if product touches edges (cropped)"""
        if image.mode != "RGBA":
            image = image.convert("RGBA")
            
        alpha = np.array(image.split()[-1])
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
    
    def smart_fill(self, image: Image.Image) -> Image.Image:
        """
        Main entry: Detect crop -> Expand -> Texture-aware fill -> White BG
        Uses the product's own textures to extend missing areas.
        """
        print("🔍 Checking for cropped edges...")
        crop_info = self.detect_crop(image)
        
        if not crop_info["is_cropped"]:
            print("   ✅ No cropping detected. Placing on white.")
            bg = Image.new("RGB", image.size, (255, 255, 255))
            bg.paste(image, (0, 0), image)
            return bg
            
        print(f"   ⚠️  Cropped edges: {crop_info}")
        print("   🧩 Extending with texture-aware fill...")
        
        w, h = image.size
        pad = self.expansion_pixels
        
        # Calculate new dimensions
        new_w = w + (pad if crop_info["left"] else 0) + (pad if crop_info["right"] else 0)
        new_h = h + (pad if crop_info["top"] else 0) + (pad if crop_info["bottom"] else 0)
        
        # Paste coordinates
        paste_x = pad if crop_info["left"] else 0
        paste_y = pad if crop_info["top"] else 0
        
        # Create expanded canvas with WHITE background
        expanded_rgb = Image.new("RGB", (new_w, new_h), (255, 255, 255))
        expanded_rgb.paste(image, (paste_x, paste_y), image)
        
        # Create alpha channel for mask
        expanded_alpha = Image.new("L", (new_w, new_h), 0)
        if image.mode == "RGBA":
            expanded_alpha.paste(image.split()[-1], (paste_x, paste_y))
        else:
            expanded_alpha.paste(Image.new("L", image.size, 255), (paste_x, paste_y))
        
        # Create inpaint mask (white = inpaint, black = keep)
        mask = ImageOps.invert(expanded_alpha)
        
        # Convert to numpy for OpenCV
        img_np = np.array(expanded_rgb)
        mask_np = np.array(mask)
        
        # Use INPAINT_NS (Navier-Stokes based) - better for textures
        # Or INPAINT_TELEA for smoother results
        print("   🖌️  Applying texture-aware inpaint (NS algorithm)...")
        
        # First pass: Use Navier-Stokes for texture-aware fill
        result_np = cv2.inpaint(img_np, mask_np, inpaintRadius=10, flags=cv2.INPAINT_NS)
        
        # Convert back to PIL
        result = Image.fromarray(result_np)
        
        # CRITICAL: Paste original object back (100% texture preservation)
        print("   🧩 Compositing original texture back...")
        result.paste(image, (paste_x, paste_y), image)
        
        return result
    
    def mirror_extend(self, image: Image.Image) -> Image.Image:
        """
        Alternative: Extend edges by mirroring edge pixels.
        100% texture preservation - just mirrors what's already there.
        """
        print("🔍 Checking for cropped edges...")
        crop_info = self.detect_crop(image)
        
        if not crop_info["is_cropped"]:
            print("   ✅ No cropping. Placing on white.")
            bg = Image.new("RGB", image.size, (255, 255, 255))
            bg.paste(image, (0, 0), image)
            return bg
        
        print(f"   ⚠️  Cropped edges: {crop_info}")
        print("   🪞 Mirror extending edges...")
        
        # Convert to numpy
        if image.mode == "RGBA":
            img_np = np.array(image.convert("RGB"))
            alpha_np = np.array(image.split()[-1])
        else:
            img_np = np.array(image)
            alpha_np = np.ones((image.height, image.width), dtype=np.uint8) * 255
        
        pad = self.expansion_pixels
        
        # Mirror extend in each direction
        if crop_info["top"]:
            # Mirror top rows
            top_strip = img_np[:pad, :, :]
            top_flipped = np.flipud(top_strip)
            img_np = np.vstack([top_flipped, img_np])
            alpha_np = np.vstack([np.flipud(alpha_np[:pad, :]), alpha_np])
            
        if crop_info["bottom"]:
            # Mirror bottom rows
            bottom_strip = img_np[-pad:, :, :]
            bottom_flipped = np.flipud(bottom_strip)
            img_np = np.vstack([img_np, bottom_flipped])
            alpha_np = np.vstack([alpha_np, np.flipud(alpha_np[-pad:, :])])
            
        if crop_info["left"]:
            # Mirror left columns
            left_strip = img_np[:, :pad, :]
            left_flipped = np.fliplr(left_strip)
            img_np = np.hstack([left_flipped, img_np])
            alpha_np = np.hstack([np.fliplr(alpha_np[:, :pad]), alpha_np])
            
        if crop_info["right"]:
            # Mirror right columns
            right_strip = img_np[:, -pad:, :]
            right_flipped = np.fliplr(right_strip)
            img_np = np.hstack([img_np, right_flipped])
            alpha_np = np.hstack([alpha_np, np.fliplr(alpha_np[:, -pad:])])
        
        # Create result on white background
        result = Image.fromarray(img_np)
        white_bg = Image.new("RGB", result.size, (255, 255, 255))
        
        # Apply alpha
        alpha_pil = Image.fromarray(alpha_np)
        result_rgba = result.convert("RGBA")
        result_rgba.putalpha(alpha_pil)
        
        white_bg.paste(result_rgba, (0, 0), result_rgba)
        
        return white_bg


# Singleton
texture_fill_service = TextureFillService()
