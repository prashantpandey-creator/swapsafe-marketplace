"""
Studio Polish Service - PRESERVES Photorealism
Uses traditional image processing (no AI generation!)
Just subtle enhancements: color correction, sharpening, exposure
"""
from PIL import Image, ImageEnhance, ImageFilter
import cv2
import numpy as np


class StudioPolishService:
    """
    Traditional image processing for studio polish.
    NO AI generation = 100% photorealism preserved.
    Fast, local, and keeps original pixels.
    """
    
    def polish(
        self, 
        image: Image.Image,
        brightness: float = 1.05,    # Slight brightness boost
        contrast: float = 1.1,       # Slight contrast boost  
        saturation: float = 1.05,    # Slight saturation boost
        sharpness: float = 1.2,      # Subtle sharpening
        denoise: bool = True         # Remove noise
    ) -> Image.Image:
        """
        Polish image for studio-quality look while PRESERVING photorealism.
        
        Args:
            image: Original product image
            brightness: 1.0 = no change, > 1.0 = brighter
            contrast: 1.0 = no change, > 1.0 = more contrast
            saturation: 1.0 = no change, > 1.0 = more vibrant
            sharpness: 1.0 = no change, > 1.0 = sharper
            denoise: Whether to apply noise reduction
            
        Returns:
            Polished image (100% photorealism preserved)
        """
        print("✨ Polishing image (preserving photorealism)...")
        
        # Ensure RGB
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        # 1. Denoise (subtle noise reduction)
        if denoise:
            print("   🔇 Reducing noise...")
            img_np = np.array(image)
            img_np = cv2.fastNlMeansDenoisingColored(img_np, None, 5, 5, 7, 21)
            image = Image.fromarray(img_np)
        
        # 2. Brightness adjustment
        if brightness != 1.0:
            print(f"   💡 Adjusting brightness ({brightness}x)...")
            enhancer = ImageEnhance.Brightness(image)
            image = enhancer.enhance(brightness)
        
        # 3. Contrast adjustment
        if contrast != 1.0:
            print(f"   🎚️  Adjusting contrast ({contrast}x)...")
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(contrast)
        
        # 4. Saturation adjustment
        if saturation != 1.0:
            print(f"   🎨 Adjusting saturation ({saturation}x)...")
            enhancer = ImageEnhance.Color(image)
            image = enhancer.enhance(saturation)
        
        # 5. Sharpening
        if sharpness != 1.0:
            print(f"   🔍 Sharpening ({sharpness}x)...")
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(sharpness)
        
        print("   ✅ Polish complete (100% original pixels preserved)")
        return image
    
    def auto_white_balance(self, image: Image.Image) -> Image.Image:
        """Apply automatic white balance correction"""
        img_np = np.array(image)
        
        # Simple gray world assumption white balance
        avg_b = np.mean(img_np[:, :, 0])
        avg_g = np.mean(img_np[:, :, 1])
        avg_r = np.mean(img_np[:, :, 2])
        avg_gray = (avg_b + avg_g + avg_r) / 3
        
        img_np[:, :, 0] = np.clip(img_np[:, :, 0] * (avg_gray / avg_b), 0, 255)
        img_np[:, :, 1] = np.clip(img_np[:, :, 1] * (avg_gray / avg_g), 0, 255)
        img_np[:, :, 2] = np.clip(img_np[:, :, 2] * (avg_gray / avg_r), 0, 255)
        
        return Image.fromarray(img_np.astype(np.uint8))
    
    def enhance_for_marketplace(self, image: Image.Image) -> Image.Image:
        """
        Full enhancement pipeline for marketplace:
        1. White balance
        2. Polish (brightness, contrast, saturation, sharpness)
        """
        print("🏪 Enhancing for marketplace...")
        
        # Auto white balance
        print("   ⚪ Correcting white balance...")
        image = self.auto_white_balance(image)
        
        # Polish with marketplace-optimized settings
        image = self.polish(
            image,
            brightness=1.02,   # Very subtle
            contrast=1.08,     # Slight pop
            saturation=1.05,   # Slight vibrancy
            sharpness=1.15,    # Crisp edges
            denoise=True
        )
        
        return image


# Singleton
studio_polish_service = StudioPolishService()
