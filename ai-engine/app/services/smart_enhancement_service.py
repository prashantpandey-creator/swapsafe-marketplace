"""
Final Smart Enhancement Service - Clean & Simple
BiRefNet Segmentation + White Background ONLY
No inpainting, no edge extension, just perfect segmentation
"""
from PIL import Image


class SmartEnhancementService:
    """
    Production-ready Smart Enhancement.
    - BiRefNet segmentation (pixel-perfect)
    - White background composite
    - No AI modifications to the product
    """
    
    def enhance(self, image: Image.Image) -> Image.Image:
        """
        Main entry point: Clean enhancement with white background.
        
        Args:
            image: Original product photo (RGB/RGBA)
            
        Returns:
            Enhanced image on white background (RGB)
        """
        from services.birefnet_service import birefnet_service
        
        print("🎨 Enhancing product image...")
        
        # Step 1: Segment
        print("   📐 Segmenting with BiRefNet...")
        rgba_product = birefnet_service.remove_background(image)
        
        # Step 2: Place on white background using alpha as mask
        print("   ⬜ Compositing on white background...")
        white_bg = Image.new("RGB", rgba_product.size, (255, 255, 255))
        white_bg.paste(rgba_product, (0, 0), rgba_product)  # Alpha channel as mask
        
        print("   ✅ Enhancement complete")
        return white_bg


# Singleton
smart_enhancement_service = SmartEnhancementService()
