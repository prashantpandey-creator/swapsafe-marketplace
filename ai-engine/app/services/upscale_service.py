"""
Upscale Service - Enhances image resolution using Real-ESRGAN
Uses the realesrgan package or falls back to Pillow-based enhancement
"""
import io
from PIL import Image, ImageEnhance, ImageFilter
from typing import Tuple
import base64

# Try to import Real-ESRGAN
def get_realesrgan_upsampler():
    try:
        from realesrgan import RealESRGANer
        from basicsr.archs.rrdbnet_arch import RRDBNet
        import torch
        
        # Determine device
        if torch.backends.mps.is_available():
            device = "mps"  # Mac Apple Silicon
        elif torch.cuda.is_available():
            device = "cuda"
        else:
            device = "cpu"
        
        print(f"🔧 Loading Real-ESRGAN on {device}...")
        
        # RealESRGAN_x4plus model (general purpose, good quality)
        model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
        
        upsampler = RealESRGANer(
            scale=4,
            model_path="https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
            model=model,
            tile=0,         # 0 for no tile during testing
            tile_pad=10,
            pre_pad=0,
            half=False,     # Use full precision on Mac
            device=device
        )
        
        print("✅ Real-ESRGAN loaded successfully")
        return upsampler
        
    except Exception as e:
        print(f"⚠️ Real-ESRGAN not available: {e}")
        print("📦 Using Pillow-based enhancement fallback")
        return None


class UpscaleService:
    """
    Image upscaling and enhancement service.
    Uses Real-ESRGAN when available, falls back to Pillow.
    """
    
    def __init__(self):
        self._upsampler = None
        self._initialized = False
        print("📈 Upscale Service initialized (lazy loading)")
    
    def _ensure_initialized(self):
        """Lazy load the upsampler"""
        if not self._initialized:
            self._upsampler = get_realesrgan_upsampler()
            self._initialized = True
    
    async def upscale_image(
        self,
        image_bytes: bytes,
        target_size: Tuple[int, int] = (1024, 1024),
        enhance_colors: bool = True
    ) -> dict:
        """
        Upscale and enhance an image.
        
        1. Upscale 4x using Real-ESRGAN (or Pillow fallback)
        2. Resize to target size
        3. Enhance colors/contrast
        
        Returns dict with base64 image data.
        """
        import time
        start = time.time()
        
        self._ensure_initialized()
        
        try:
            # Open image
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            original_size = img.size
            print(f"   📏 Input: {original_size[0]}x{original_size[1]}")
            
            # Step 1: Upscale
            upscaled = None
            use_fallback = True
            
            if self._upsampler:
                try:
                    # Use Real-ESRGAN
                    print("   🔬 Upscaling with Real-ESRGAN...")
                    import numpy as np
                    img_np = np.array(img)
                    if img_np.dtype != np.uint8:
                         img_np = img_np.astype(np.uint8)
                         
                    output, _ = self._upsampler.enhance(img_np, outscale=4)
                    
                    # Validation
                    if output is not None and output.mean() > 5:
                        upscaled = Image.fromarray(output)
                        use_fallback = False
                    else:
                        print("   ⚠️ Real-ESRGAN produced black/invalid output. Switching to fallback.")
                        
                except Exception as e:
                    print(f"   ⚠️ Real-ESRGAN failed: {e}. Switching to fallback.")
            
            if use_fallback:
                # Fallback: Pillow bicubic upscale + sharpening
                print("   🔬 Upscaling with Pillow (fallback)...")
                upscaled = img.resize(
                    (img.width * 2, img.height * 2),  # 2x instead of 4x for speed
                    Image.Resampling.LANCZOS
                )
                # Apply sharpening
                upscaled = upscaled.filter(ImageFilter.UnsharpMask(radius=1.5, percent=100, threshold=2))
            
            print(f"   📏 Upscaled: {upscaled.width}x{upscaled.height}")
            
            # Step 2: Smart resize to target (maintain aspect ratio)
            upscaled = self._fit_to_size(upscaled, target_size)
            print(f"   📏 Final: {upscaled.width}x{upscaled.height}")
            
            # Step 3: Color enhancement
            if enhance_colors:
                print("   🎨 Enhancing colors...")
                upscaled = self._enhance_image(upscaled)
            
            # Convert to base64
            buffer = io.BytesIO()
            upscaled.save(buffer, format="JPEG", quality=95)
            buffer.seek(0)
            b64_data = base64.b64encode(buffer.getvalue()).decode()
            
            elapsed = time.time() - start
            print(f"   ✅ Upscale complete in {elapsed:.2f}s")
            
            return {
                "status": "success",
                "image_data": f"data:image/jpeg;base64,{b64_data}",
                "original_size": original_size,
                "final_size": (upscaled.width, upscaled.height),
                "method": "realesrgan" if self._upsampler else "pillow"
            }
            
        except Exception as e:
            print(f"❌ Upscale failed: {e}")
            raise e
    
    def _fit_to_size(self, img: Image.Image, target: Tuple[int, int]) -> Image.Image:
        """Resize image to fit within target size maintaining aspect ratio"""
        ratio = min(target[0] / img.width, target[1] / img.height)
        
        # Only downscale if larger than target
        if ratio < 1:
            new_size = (int(img.width * ratio), int(img.height * ratio))
            return img.resize(new_size, Image.Resampling.LANCZOS)
        
        return img
    
    def _enhance_image(self, img: Image.Image) -> Image.Image:
        """Apply color and contrast enhancement"""
        # Slight contrast boost
        contrast = ImageEnhance.Contrast(img)
        img = contrast.enhance(1.05)

        # Slight saturation boost
        saturation = ImageEnhance.Color(img)
        img = saturation.enhance(1.08)

        # Slight sharpness boost
        sharpness = ImageEnhance.Sharpness(img)
        img = sharpness.enhance(1.1)

        return img

    def enhance(self, image: Image.Image, scale: int = 2) -> Image.Image:
        """
        Synchronous image enhancement (for Plan B pipeline).

        Args:
            image: PIL Image (RGB or RGBA)
            scale: Upscale factor (2 or 4)

        Returns:
            Enhanced PIL Image
        """
        self._ensure_initialized()

        try:
            # Convert to RGB if needed
            if image.mode == "RGBA":
                image = image.convert("RGB")
            elif image.mode != "RGB":
                image = image.convert("RGB")

            print(f"   🔬 Enhancing image ({image.width}x{image.height})...")

            # Try Real-ESRGAN
            if self._upsampler:
                try:
                    import numpy as np
                    img_np = np.array(image, dtype=np.uint8)

                    # Use 4x upsampling
                    output, _ = self._upsampler.enhance(img_np, outscale=4)

                    if output is not None and output.mean() > 5:
                        result = Image.fromarray(output)

                        # If scale is 2, downscale from 4x
                        if scale == 2:
                            w, h = result.size
                            result = result.resize((w // 2, h // 2), Image.Resampling.LANCZOS)

                        print(f"   ✅ Enhanced to {result.width}x{result.height}")
                        return result
                    else:
                        print("   ⚠️ Real-ESRGAN produced invalid output, using fallback")

                except Exception as e:
                    print(f"   ⚠️ Real-ESRGAN failed: {e}, using fallback")

            # Fallback: Pillow upscale + enhance
            new_width = image.width * scale
            new_height = image.height * scale
            result = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            result = result.filter(ImageFilter.UnsharpMask(radius=1.5, percent=100, threshold=2))

            # Apply color enhancement
            result = self._enhance_image(result)

            print(f"   ✅ Enhanced to {result.width}x{result.height} (Pillow fallback)")
            return result

        except Exception as e:
            print(f"   ❌ Enhancement failed: {e}")
            # Return original if all else fails
            return image


# Singleton instance
upscale_service = UpscaleService()
