"""
Compositing Service - Pure Python/PIL operations for placing products on backgrounds.
Uses CPU only (no GPU) for fast, simple background placement and shadow effects.
Plan A: Fully Local Implementation
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from typing import Optional, Tuple


class CompositingService:
    """
    Composites a product image onto a studio background.
    Uses PIL and NumPy for CPU-only operations.
    """

    def __init__(self):
        self.device = "cpu"  # Always CPU - PIL is optimized for this

    def place_on_white_background(
        self,
        product_image: Image.Image,
        background_size: Tuple[int, int] = (1024, 1024),
        padding_percent: float = 0.1,
    ) -> Image.Image:
        """
        Place a product image (RGBA with transparency) on a white background.

        Args:
            product_image: PIL Image (RGBA preferred)
            background_size: Target output size (width, height)
            padding_percent: Padding around product as % of image size

        Returns:
            PIL Image (RGB) with product on white background
        """
        # Ensure product is RGBA
        if product_image.mode != "RGBA":
            product_image = product_image.convert("RGBA")

        # Create white background
        white_bg = Image.new("RGB", background_size, (255, 255, 255))

        # Calculate padding
        padding = int(background_size[0] * padding_percent)

        # Scale product to fit with padding
        available_width = background_size[0] - (2 * padding)
        available_height = background_size[1] - (2 * padding)

        # Maintain aspect ratio
        product_ratio = product_image.width / product_image.height
        if product_ratio > available_width / available_height:
            # Width is limiting factor
            new_width = available_width
            new_height = int(new_width / product_ratio)
        else:
            # Height is limiting factor
            new_height = available_height
            new_width = int(new_height * product_ratio)

        # Resize product
        scaled_product = product_image.resize(
            (new_width, new_height), Image.Resampling.LANCZOS
        )

        # Center on background
        x_offset = (background_size[0] - new_width) // 2
        y_offset = (background_size[1] - new_height) // 2

        # Paste with alpha channel
        white_bg.paste(scaled_product, (x_offset, y_offset), scaled_product)

        return white_bg

    def add_drop_shadow(
        self,
        image: Image.Image,
        mask: Optional[Image.Image] = None,
        offset: Tuple[int, int] = (5, 10),
        blur_radius: int = 15,
        shadow_opacity: float = 0.3,
    ) -> Image.Image:
        """
        Add a subtle drop shadow to a product on white background.

        Args:
            image: Product on white background (RGB)
            mask: Optional alpha mask of product (if None, creates one)
            offset: Shadow offset (x, y)
            blur_radius: Gaussian blur radius for shadow
            shadow_opacity: Shadow transparency (0.0-1.0)

        Returns:
            PIL Image with shadow effect
        """
        # Convert to RGBA for compositing
        result = image.convert("RGBA")

        # If no mask provided, assume product is not pure white
        if mask is None:
            # Simple approach: anything not pure white is product
            img_array = np.array(image)
            # Product pixels are slightly off-white or colored
            mask_array = np.where(
                (
                    (img_array[:, :, 0] < 250)
                    | (img_array[:, :, 1] < 250)
                    | (img_array[:, :, 2] < 250)
                ),
                255,
                0,
            ).astype(np.uint8)
            mask = Image.fromarray(mask_array)

        # Create shadow layer
        shadow = Image.new("RGBA", image.size, (0, 0, 0, 0))
        shadow_data = np.array(mask) / 255.0  # Normalize mask to 0-1

        # Create shadow color (dark gray with opacity)
        shadow_color = (50, 50, 50, int(255 * shadow_opacity))
        shadow_array = np.zeros((*mask.size[::-1], 4), dtype=np.uint8)
        shadow_array[..., :3] = shadow_color[:3]
        shadow_array[..., 3] = (shadow_data * shadow_color[3]).astype(np.uint8)
        shadow = Image.fromarray(shadow_array)

        # Blur shadow
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=blur_radius))

        # Offset shadow
        shadow_offset = Image.new("RGBA", image.size, (0, 0, 0, 0))
        shadow_offset.paste(shadow, offset, shadow)

        # Composite shadow behind product
        result = Image.alpha_composite(shadow_offset, result)

        return result.convert("RGB")

    def center_and_pad(
        self,
        image: Image.Image,
        canvas_size: Tuple[int, int] = (1024, 1024),
        fill_color: Tuple[int, int, int] = (255, 255, 255),
    ) -> Image.Image:
        """
        Center an image on a larger canvas with padding.

        Args:
            image: Input image
            canvas_size: Size of output canvas
            fill_color: Color for padding (default white)

        Returns:
            Centered image on larger canvas
        """
        # Ensure image is RGB
        if image.mode == "RGBA":
            image = image.convert("RGB")

        # Create canvas
        canvas = Image.new("RGB", canvas_size, fill_color)

        # Calculate offset to center
        x_offset = (canvas_size[0] - image.width) // 2
        y_offset = (canvas_size[1] - image.height) // 2

        # Paste image
        canvas.paste(image, (x_offset, y_offset))

        return canvas

    def adjust_white_balance(self, image: Image.Image, strength: float = 1.0) -> Image.Image:
        """
        Enhance white balance for studio-like appearance.
        Brightens highlights slightly for a professional look.

        Args:
            image: Input image
            strength: Adjustment strength (0.0-2.0, 1.0 = no change)

        Returns:
            Adjusted image
        """
        from PIL import ImageEnhance

        # Increase brightness slightly
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(1.0 + (strength * 0.1))

        # Increase contrast slightly for pop
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.0 + (strength * 0.05))

        # Slight color boost
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(1.0 + (strength * 0.05))

        return image

    def add_vignette(
        self, image: Image.Image, strength: float = 0.3
    ) -> Image.Image:
        """
        Add a subtle vignette effect for depth.

        Args:
            image: Input image
            strength: Vignette strength (0.0-1.0)

        Returns:
            Image with vignette
        """
        # Create vignette mask (radial gradient)
        size = image.size
        x = np.linspace(-1, 1, size[0])
        y = np.linspace(-1, 1, size[1])
        X, Y = np.meshgrid(x, y)

        # Distance from center
        dist = np.sqrt(X**2 + Y**2)
        vignette_mask = 1 - (dist / dist.max()) * strength

        # Convert to PIL
        vignette_array = (vignette_mask * 255).astype(np.uint8)
        vignette_pil = Image.fromarray(vignette_array)

        # Apply to image
        img_array = np.array(image.convert("RGB")) / 255.0
        vig_array = np.array(vignette_pil) / 255.0

        # Multiply each channel
        result = (img_array * vig_array[:, :, np.newaxis]).astype(np.uint8) * 255
        result = Image.fromarray(result.astype(np.uint8))

        return result


# Singleton instance
compositing_service = CompositingService()
