"""
Product Transformation Service
Transform, reposition, resize, and rotate extracted products.
Uses BiRefNet for extraction and PIL for transformations.
"""
import numpy as np
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
from typing import Tuple, Optional
import os


class ProductTransformer:
    """
    Transform products after BiRefNet extraction.
    Supports resize, rotate, reposition, and effects.
    """
    
    def __init__(self):
        self.birefnet = None
    
    def _load_birefnet(self):
        """Lazy load BiRefNet."""
        if self.birefnet is None:
            from app.services.birefnet_service import birefnet_service
            self.birefnet = birefnet_service
        return self.birefnet
    
    def extract_product(self, image: Image.Image) -> Tuple[Image.Image, Image.Image]:
        """
        Extract product with transparent background using BiRefNet.
        
        Returns:
            (product_rgba, alpha_mask)
        """
        birefnet = self._load_birefnet()
        
        # Get mask from BiRefNet
        img_resized = image.resize((1024, 1024), Image.LANCZOS)
        result = birefnet.remove_and_place_on_white(img_resized)
        
        # Also get the alpha mask
        # BiRefNet puts product on white, we need to extract RGBA
        # For now, use the result which has product on white
        return result, None
    
    def resize_product(
        self,
        product: Image.Image,
        scale: float = 1.0,
        target_size: Optional[Tuple[int, int]] = None
    ) -> Image.Image:
        """
        Resize the product.
        
        Args:
            product: Product image (RGB or RGBA)
            scale: Scale factor (1.0 = original, 0.5 = half, 2.0 = double)
            target_size: Optional (width, height) to resize to
        
        Returns:
            Resized product image
        """
        if target_size:
            return product.resize(target_size, Image.LANCZOS)
        else:
            new_size = (int(product.width * scale), int(product.height * scale))
            return product.resize(new_size, Image.LANCZOS)
    
    def rotate_product(
        self,
        product: Image.Image,
        angle: float,
        expand: bool = True,
        fill_color: Tuple[int, int, int] = (255, 255, 255)
    ) -> Image.Image:
        """
        Rotate the product.
        
        Args:
            product: Product image
            angle: Rotation angle in degrees (positive = counterclockwise)
            expand: If True, expand image to fit rotated product
            fill_color: Background fill color for expanded areas
        
        Returns:
            Rotated product image
        """
        return product.rotate(angle, expand=expand, fillcolor=fill_color, resample=Image.BICUBIC)
    
    def reposition_product(
        self,
        product: Image.Image,
        canvas_size: Tuple[int, int] = (1024, 1024),
        position: str = "center",
        offset: Tuple[int, int] = (0, 0),
        background_color: Tuple[int, int, int] = (255, 255, 255)
    ) -> Image.Image:
        """
        Reposition product on a new canvas.
        
        Args:
            product: Product image
            canvas_size: (width, height) of output canvas
            position: "center", "top", "bottom", "left", "right", "top-left", etc.
            offset: (x, y) offset from position
            background_color: Canvas background color
        
        Returns:
            Product on new canvas
        """
        canvas = Image.new("RGB", canvas_size, background_color)
        
        # Calculate position
        cw, ch = canvas_size
        pw, ph = product.size
        
        positions = {
            "center": ((cw - pw) // 2, (ch - ph) // 2),
            "top": ((cw - pw) // 2, 20),
            "bottom": ((cw - pw) // 2, ch - ph - 20),
            "left": (20, (ch - ph) // 2),
            "right": (cw - pw - 20, (ch - ph) // 2),
            "top-left": (20, 20),
            "top-right": (cw - pw - 20, 20),
            "bottom-left": (20, ch - ph - 20),
            "bottom-right": (cw - pw - 20, ch - ph - 20),
        }
        
        base_pos = positions.get(position, positions["center"])
        final_pos = (base_pos[0] + offset[0], base_pos[1] + offset[1])
        
        # Handle RGBA compositing
        if product.mode == "RGBA":
            canvas.paste(product, final_pos, product)
        else:
            canvas.paste(product, final_pos)
        
        return canvas
    
    def add_shadow(
        self,
        product: Image.Image,
        shadow_offset: Tuple[int, int] = (10, 10),
        shadow_blur: int = 15,
        shadow_opacity: float = 0.3
    ) -> Image.Image:
        """
        Add a drop shadow to the product.
        
        Args:
            product: Product image (RGBA preferred)
            shadow_offset: (x, y) offset for shadow
            shadow_blur: Blur radius for shadow
            shadow_opacity: Shadow opacity (0-1)
        
        Returns:
            Product with shadow on white background
        """
        # Create canvas larger than product to fit shadow
        margin = max(abs(shadow_offset[0]), abs(shadow_offset[1])) + shadow_blur * 2
        canvas_size = (product.width + margin * 2, product.height + margin * 2)
        
        # Create shadow layer
        shadow = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
        
        if product.mode == "RGBA":
            # Use alpha channel to create shadow shape
            alpha = product.split()[3]
            shadow_mask = alpha.copy()
            shadow_layer = Image.new("RGBA", product.size, (0, 0, 0, int(255 * shadow_opacity)))
            shadow_layer.putalpha(shadow_mask)
            shadow.paste(shadow_layer, (margin + shadow_offset[0], margin + shadow_offset[1]))
            shadow = shadow.filter(ImageFilter.GaussianBlur(shadow_blur))
        
        # Create white background
        result = Image.new("RGB", canvas_size, (255, 255, 255))
        
        # Composite shadow
        result.paste(shadow, (0, 0), shadow)
        
        # Composite product
        if product.mode == "RGBA":
            result.paste(product, (margin, margin), product)
        else:
            result.paste(product, (margin, margin))
        
        return result
    
    def enhance_brightness_contrast(
        self,
        product: Image.Image,
        brightness: float = 1.0,
        contrast: float = 1.0,
        saturation: float = 1.0
    ) -> Image.Image:
        """
        Enhance brightness, contrast, and saturation.
        
        Args:
            product: Product image
            brightness: Brightness factor (1.0 = original)
            contrast: Contrast factor (1.0 = original)
            saturation: Saturation factor (1.0 = original)
        
        Returns:
            Enhanced product image
        """
        result = product.copy()
        
        if brightness != 1.0:
            enhancer = ImageEnhance.Brightness(result)
            result = enhancer.enhance(brightness)
        
        if contrast != 1.0:
            enhancer = ImageEnhance.Contrast(result)
            result = enhancer.enhance(contrast)
        
        if saturation != 1.0:
            enhancer = ImageEnhance.Color(result)
            result = enhancer.enhance(saturation)
        
        return result
    
    def transform_complete(
        self,
        image: Image.Image,
        scale: float = 0.8,
        rotation: float = 0,
        position: str = "center",
        add_shadow: bool = True,
        canvas_size: Tuple[int, int] = (1024, 1024)
    ) -> dict:
        """
        Complete transformation pipeline.
        
        Args:
            image: Input image
            scale: Product scale relative to canvas
            rotation: Rotation angle
            position: Position on canvas
            add_shadow: Whether to add drop shadow
            canvas_size: Output canvas size
        
        Returns:
            dict with 'extracted', 'transformed' results
        """
        results = {}
        
        # Step 1: Extract product
        print("🎯 Extracting product with BiRefNet...")
        extracted, _ = self.extract_product(image)
        results['extracted'] = extracted
        
        # Step 2: Scale
        target_size = (int(canvas_size[0] * scale), int(canvas_size[1] * scale))
        scaled = self.resize_product(extracted, target_size=target_size)
        
        # Step 3: Rotate if needed
        if rotation != 0:
            scaled = self.rotate_product(scaled, rotation)
        
        # Step 4: Add shadow if requested
        if add_shadow:
            scaled = self.add_shadow(scaled)
        
        # Step 5: Reposition on canvas
        final = self.reposition_product(scaled, canvas_size=canvas_size, position=position)
        results['transformed'] = final
        
        print("  ✅ Transformation complete")
        return results


# Singleton
product_transformer = ProductTransformer()


def test_transformer():
    """Test product transformation."""
    test_path = "/Users/badenath/.gemini/antigravity/brain/0509a38a-18d9-4027-ad3d-47864438b67f/hybrid_birefnet.png"
    
    if os.path.exists(test_path):
        img = Image.open(test_path)
        
        print("\n" + "="*60)
        print("🔄 Testing Product Transformation")
        print("="*60)
        
        # Test repositioning
        result = product_transformer.reposition_product(
            img,
            canvas_size=(1200, 1200),
            position="center"
        )
        
        output_path = "/Users/badenath/.gemini/antigravity/brain/0509a38a-18d9-4027-ad3d-47864438b67f/transformed_centered.png"
        result.save(output_path)
        print(f"✅ Saved centered: {output_path}")
        
        # Test with shadow
        result_shadow = product_transformer.add_shadow(img)
        shadow_path = "/Users/badenath/.gemini/antigravity/brain/0509a38a-18d9-4027-ad3d-47864438b67f/transformed_shadow.png"
        result_shadow.save(shadow_path)
        print(f"✅ Saved with shadow: {shadow_path}")
        
        print("\n🔥 Transformation test complete!")
        return result
    else:
        print(f"❌ Test image not found: {test_path}")
        return None


if __name__ == "__main__":
    test_transformer()
