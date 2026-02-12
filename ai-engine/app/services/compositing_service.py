"""
Compositing Service - Combines product images with backgrounds and effects
Handles white background placement, drop shadows, and professional styling.
"""
from PIL import Image, ImageDraw, ImageFilter
from typing import Tuple, Optional
import numpy as np


class CompositingService:
    """
    Product image compositing and enhancement.

    Features:
    - White background placement
    - Professional drop shadows
    - Automatic centering and padding
    - RGBA → RGB conversion with proper backgrounds
    """

    def __init__(self):
        print("🎨 Compositing Service initialized")

    def place_on_white_background(
        self,
        image: Image.Image,
        background_size: Tuple[int, int] = (1024, 1024),
        padding_percent: float = 0.05
    ) -> Image.Image:
        """
        Place product image on white background with smart padding.

        Args:
            image: Input image (RGB or RGBA)
            background_size: Size of output background
            padding_percent: Padding around image (0.0 to 1.0)

        Returns:
            PIL Image (RGB) on white background
        """
        # Convert to RGBA if needed
        if image.mode != "RGBA":
            image = image.convert("RGBA")

        # Calculate padding
        padding = int(min(background_size) * padding_percent)

        # Available space for image
        available_width = background_size[0] - 2 * padding
        available_height = background_size[1] - 2 * padding

        # Resize image to fit with padding, maintaining aspect ratio
        img_copy = image.copy()
        img_copy.thumbnail(
            (available_width, available_height),
            Image.Resampling.LANCZOS
        )

        # Create white background
        white_bg = Image.new("RGB", background_size, (255, 255, 255))

        # Calculate position to center image
        img_x = (background_size[0] - img_copy.width) // 2
        img_y = (background_size[1] - img_copy.height) // 2

        # Paste image onto white background
        if img_copy.mode == "RGBA":
            white_bg.paste(img_copy, (img_x, img_y), img_copy)
        else:
            white_bg.paste(img_copy, (img_x, img_y))

        return white_bg

    def add_drop_shadow(
        self,
        image: Image.Image,
        shadow_color: Tuple[int, int, int] = (0, 0, 0),
        shadow_blur: int = 15,
        shadow_offset: Tuple[int, int] = (0, 10),
        shadow_opacity: float = 0.3
    ) -> Image.Image:
        """
        Add professional drop shadow to product image.

        Args:
            image: Input image (RGB or RGBA)
            shadow_color: RGB color of shadow
            shadow_blur: Blur radius for soft shadow
            shadow_offset: (x, y) offset of shadow
            shadow_opacity: Alpha opacity of shadow (0.0 to 1.0)

        Returns:
            PIL Image with drop shadow applied
        """
        # Ensure RGB mode
        if image.mode == "RGBA":
            image = image.convert("RGB")
        elif image.mode != "RGB":
            image = image.convert("RGB")

        # Convert to numpy for easier processing
        img_array = np.array(image)
        height, width, _ = img_array.shape

        # Create shadow layer
        shadow = Image.new("RGBA", image.size, (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow)

        # Find product bounds (assuming white background is 255, 255, 255)
        # Invert: product is NOT white
        white_mask = np.all(img_array == [255, 255, 255], axis=2)
        product_pixels = np.where(~white_mask)

        if len(product_pixels[0]) == 0:
            # No product detected, return original
            return image

        # Get bounding box of product
        min_y, max_y = product_pixels[0].min(), product_pixels[0].max()
        min_x, max_x = product_pixels[1].min(), product_pixels[1].max()

        # Add padding to bounding box
        padding = 10
        bbox = [
            max(0, min_x - padding),
            max(0, min_y - padding),
            min(width, max_x + padding),
            min(height, max_y + padding)
        ]

        # Draw shadow as a dark rectangle
        shadow_draw.rectangle(
            bbox,
            fill=(*shadow_color, int(255 * shadow_opacity))
        )

        # Blur shadow
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=shadow_blur))

        # Offset shadow
        shadow_offset_y = shadow_offset[1]
        shadow = Image.new("RGBA", image.size, (0, 0, 0, 0))

        # Recreate shadow with offset
        shadow_draw = ImageDraw.Draw(shadow)
        offset_bbox = [
            bbox[0] + shadow_offset[0],
            bbox[1] + shadow_offset_y,
            bbox[2] + shadow_offset[0],
            bbox[3] + shadow_offset_y
        ]

        shadow_draw.rectangle(
            offset_bbox,
            fill=(*shadow_color, int(255 * shadow_opacity))
        )
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=shadow_blur))

        # Convert image to RGBA
        image_rgba = image.convert("RGBA")

        # Composite: shadow + image
        result = Image.new("RGBA", image.size, (255, 255, 255, 255))
        result.paste(shadow, (0, 0), shadow)
        result.paste(image_rgba, (0, 0), image_rgba)

        # Convert back to RGB
        result = result.convert("RGB")

        return result

    def add_shadow_simple(
        self,
        image: Image.Image,
        shadow_opacity: float = 0.2
    ) -> Image.Image:
        """
        Add a simple drop shadow for fast processing.

        Args:
            image: Input image (RGB)
            shadow_opacity: Shadow intensity (0.0 to 1.0)

        Returns:
            PIL Image with shadow
        """
        if image.mode == "RGBA":
            image = image.convert("RGB")

        # Create a darker version for shadow
        img_array = np.array(image)
        darkened = (img_array * (1 - shadow_opacity)).astype(np.uint8)

        # Shift down and right
        shadow = Image.new("RGB", image.size, (255, 255, 255))
        shadow_array = np.array(shadow)

        # Place darkened image offset
        offset_x, offset_y = 3, 5
        shadow_array[offset_y:, offset_x:] = darkened[:-offset_y, :-offset_x]

        shadow = Image.fromarray(shadow_array)

        # Blur
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=8))

        # Composite
        img_array_float = img_array.astype(float)
        shadow_array_float = np.array(shadow).astype(float)

        result = (shadow_array_float * 0.7 + img_array_float * 0.3).astype(np.uint8)

        return Image.fromarray(result)

    def composite_images(
        self,
        foreground: Image.Image,
        background: Image.Image,
        position: Tuple[int, int] = (0, 0)
    ) -> Image.Image:
        """
        Composite foreground image onto background.

        Args:
            foreground: Image to place on top (RGBA)
            background: Background image (RGB)
            position: (x, y) position for foreground

        Returns:
            Composited image (RGB)
        """
        if foreground.mode != "RGBA":
            foreground = foreground.convert("RGBA")

        if background.mode != "RGB":
            background = background.convert("RGB")

        # Create output
        result = background.copy()
        result.paste(foreground, position, foreground)

        return result

    def resize_with_padding(
        self,
        image: Image.Image,
        target_size: Tuple[int, int],
        padding_color: Tuple[int, int, int] = (255, 255, 255)
    ) -> Image.Image:
        """
        Resize image to target size with padding (no crop).

        Args:
            image: Input image
            target_size: Target (width, height)
            padding_color: Color of padding area (RGB)

        Returns:
            Resized image with padding
        """
        if image.mode == "RGBA":
            image = image.convert("RGB")

        # Calculate resize maintaining aspect ratio
        ratio = min(
            target_size[0] / image.width,
            target_size[1] / image.height
        )

        new_size = (
            int(image.width * ratio),
            int(image.height * ratio)
        )

        # Resize
        image = image.resize(new_size, Image.Resampling.LANCZOS)

        # Create padded background
        padded = Image.new("RGB", target_size, padding_color)

        # Center image
        x = (target_size[0] - image.width) // 2
        y = (target_size[1] - image.height) // 2

        padded.paste(image, (x, y))

        return padded


# Singleton instance
compositing_service = CompositingService()
