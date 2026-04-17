"""
Local Enhanced Pipeline - "Clean & Enhance" Product Photography
Works on Mac 32GB + RTX 3060 Ti 8GB, preserves real product details

5-Phase Pipeline:
1. BiRefNet Segmentation (2-3s) - Remove background, extract product
2. LaMa Inpainting (1-2s) - Remove hands/clutter near product edges
3. LBM Relighting (2-3s) - Professional studio lighting
4. Compositing (1s) - Place on white background with shadow
5. Real-ESRGAN Upscaling (3-5s) - Sharpen and enhance resolution

Total: 10-15s on CUDA, 15-25s on MPS, peak <8GB VRAM, $0 cost
"""

import torch
import gc
import time
from PIL import Image
from typing import Tuple, Dict, Optional
from io import BytesIO

from app.config import DeviceProfile
from app.services.birefnet_service import BiRefNetService
from app.services.lama_inpainting_service import LamaInpaintingService
from app.services.lbm_relighting_service import LBMRelightingService
from app.services.compositing_service import CompositingService
from app.services.upscale_service import UpscaleService


class LocalEnhancedPipeline:
    """
    Clean & Enhance pipeline — works on Mac 32GB and RTX 3060 Ti 8GB.
    Preserves real product details, no full image regeneration.
    """

    def __init__(self):
        self.device_profile = DeviceProfile.get_profile()
        self.device = torch.device(self.device_profile["device"])

        # Lazy-loaded services
        self._birefnet = None
        self._lama = None
        self._relighting = None
        self._compositing = None
        self._upscaler = None

        self.config = {
            "enable_inpainting": True,
            "enable_relighting": True,
            "enable_upscaling": True,
            "lighting_style": "soft_studio",
            "upscale_factor": 2,
        }

        print(f"""
🎨 Local Enhanced Pipeline initialized
   Device: {self.device_profile['device_name']}
   VRAM: {self.device_profile['vram_gb']}GB
   Recommendation: {self.device_profile['recommendation']}
   Pipeline: BiRefNet → LaMa → LBM → Compositing → Real-ESRGAN
        """)

    # Lazy loading properties
    @property
    def birefnet(self) -> BiRefNetService:
        if self._birefnet is None:
            print("⏳ Loading BiRefNet...")
            self._birefnet = BiRefNetService()
            self._birefnet.load_model(variant="massive")
        return self._birefnet

    @property
    def lama(self) -> LamaInpaintingService:
        if self._lama is None and self.config["enable_inpainting"]:
            print("⏳ Loading LaMa Inpainting...")
            self._lama = LamaInpaintingService()
            self._lama.load_model()
        return self._lama

    @property
    def relighting(self) -> LBMRelightingService:
        if self._relighting is None and self.config["enable_relighting"]:
            print("⏳ Loading LBM Relighting...")
            self._relighting = LBMRelightingService()
            self._relighting.load_model()
        return self._relighting

    @property
    def compositing(self) -> CompositingService:
        if self._compositing is None:
            self._compositing = CompositingService()
        return self._compositing

    @property
    def upscaler(self) -> UpscaleService:
        if self._upscaler is None and self.config["enable_upscaling"]:
            print("⏳ Loading Real-ESRGAN...")
            self._upscaler = UpscaleService()
            self._upscaler.load_model()
        return self._upscaler

    def _cleanup_model(self, model_name: str):
        """Unload a model to free VRAM."""
        if model_name == "birefnet" and self._birefnet is not None:
            del self._birefnet
            self._birefnet = None
        elif model_name == "lama" and self._lama is not None:
            del self._lama
            self._lama = None
        elif model_name == "relighting" and self._relighting is not None:
            self._relighting.unload_model()
            del self._relighting
            self._relighting = None
        elif model_name == "upscaler" and self._upscaler is not None:
            self._upscaler.unload_model()
            del self._upscaler
            self._upscaler = None

        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        elif torch.backends.mps.is_available():
            torch.mps.empty_cache()

    async def process(
        self,
        image: Image.Image,
        enable_inpainting: bool = True,
        enable_relighting: bool = True,
        lighting_style: str = "soft_studio",
        enable_upscaling: bool = True,
        upscale_factor: int = 2,
    ) -> Tuple[Image.Image, Dict]:
        """
        Process image through Clean & Enhance pipeline.

        Args:
            image: Input product image (any background)
            enable_inpainting: Remove hands/clutter with LaMa
            enable_relighting: Apply professional studio lighting
            lighting_style: Lighting preset (soft_studio, dramatic, natural, bright)
            enable_upscaling: Use Real-ESRGAN for enhancement
            upscale_factor: Upscaling multiplier (2 or 4)

        Returns:
            (result_image, metadata) - Final result and processing stats
        """
        pipeline_start = time.time()
        metadata = {
            "stages": {},
            "timings": {},
            "device": self.device_profile["device_name"],
            "vram_gb": self.device_profile["vram_gb"],
        }

        try:
            # Phase 1: BiRefNet Segmentation (2-3s, 2-3GB)
            print("\n📦 Phase 1: BiRefNet Segmentation...")
            phase_start = time.time()

            # Convert to RGB if needed
            if image.mode != "RGB":
                image = image.convert("RGB")

            # Get product with transparent background
            product_rgba = self.birefnet.remove_background(image)
            metadata["stages"]["segmentation"] = "BiRefNet"
            metadata["timings"]["segmentation"] = time.time() - phase_start
            print(f"   ✅ Complete in {metadata['timings']['segmentation']:.1f}s")

            # Cleanup BiRefNet to free VRAM
            self._cleanup_model("birefnet")

            # Phase 2: LaMa Inpainting (1-2s, <1GB) - Optional
            if enable_inpainting:
                print("🖼️  Phase 2: LaMa Inpainting (remove hands/clutter)...")
                phase_start = time.time()

                # Use LaMa to repair cropped edges and clean up artifacts
                cleaned_rgba = self.lama.smart_repair(product_rgba)

                metadata["stages"]["inpainting"] = "LaMa"
                metadata["timings"]["inpainting"] = time.time() - phase_start
                print(f"   ✅ Complete in {metadata['timings']['inpainting']:.1f}s")

                # Use cleaned image for next phase
                product_rgba = cleaned_rgba

                # Cleanup LaMa
                self._cleanup_model("lama")

            # Phase 3: LBM Relighting (2-3s, <8GB) - Optional
            if enable_relighting:
                print("💡 Phase 3: LBM Relighting...")
                phase_start = time.time()

                # Create mask from alpha channel
                if product_rgba.mode == "RGBA":
                    mask = product_rgba.split()[3]
                else:
                    mask = Image.new("L", product_rgba.size, 255)

                # Apply professional studio lighting
                relit, relight_meta = self.relighting.apply_studio_lighting(
                    product_rgba.convert("RGB"),
                    mask=mask,
                    style=lighting_style,
                    intensity=1.0
                )

                metadata["stages"]["relighting"] = "LBM"
                metadata["timings"]["relighting"] = time.time() - phase_start
                print(f"   ✅ Complete in {metadata['timings']['relighting']:.1f}s")

                product_rgba = relit.convert("RGBA") if relit.mode != "RGBA" else relit

                # Cleanup relighting
                self._cleanup_model("relighting")

            # Phase 4: Compositing (1s, CPU) - Always done
            print("🎨 Phase 4: Compositing (white background + shadow)...")
            phase_start = time.time()

            # Ensure RGBA
            if product_rgba.mode != "RGBA":
                product_rgba = product_rgba.convert("RGBA")

            # Place on white background with shadow
            composed = self.compositing.place_on_white_background(
                product_rgba,
                background_size=(1024, 1024),
                padding_percent=0.05
            )

            # Add drop shadow for professional look
            composed = self.compositing.add_drop_shadow(
                composed,
                shadow_opacity=0.2
            )

            metadata["stages"]["compositing"] = "PIL"
            metadata["timings"]["compositing"] = time.time() - phase_start
            print(f"   ✅ Complete in {metadata['timings']['compositing']:.1f}s")

            # Phase 5: Real-ESRGAN Upscaling (3-5s, 2-4GB) - Optional
            if enable_upscaling:
                print(f"🔍 Phase 5: Real-ESRGAN Upscaling ({upscale_factor}x)...")
                phase_start = time.time()

                # Convert to RGB for upscaler
                upscale_input = composed.convert("RGB")

                # Upscale
                upscaled = self.upscaler.upscale(
                    upscale_input,
                    scale=upscale_factor
                )

                metadata["stages"]["upscaling"] = "Real-ESRGAN"
                metadata["timings"]["upscaling"] = time.time() - phase_start
                print(f"   ✅ Complete in {metadata['timings']['upscaling']:.1f}s")

                composed = upscaled

                # Cleanup upscaler
                self._cleanup_model("upscaler")

            # Final stats
            total_time = time.time() - pipeline_start
            metadata["total_time"] = total_time
            metadata["output_size"] = composed.size
            metadata["success"] = True

            print(f"\n🎉 Clean & Enhance Complete!")
            print(f"   Total time: {total_time:.1f}s")
            print(f"   Output: {composed.size[0]}x{composed.size[1]}")
            print(f"   Quality: Professional marketplace-grade")
            print(f"   Cost: $0.00 (fully local)")

            # Final cleanup
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            elif torch.backends.mps.is_available():
                torch.mps.empty_cache()

            return composed, metadata

        except Exception as e:
            import traceback
            print(f"\n❌ Pipeline failed: {e}")
            traceback.print_exc()
            metadata["success"] = False
            metadata["error"] = str(e)
            raise RuntimeError(f"Local Enhanced Pipeline failed: {e}") from e

    def cleanup(self):
        """Force cleanup of all loaded models."""
        print("\n🧹 Cleaning up all models...")
        self._cleanup_model("birefnet")
        self._cleanup_model("lama")
        self._cleanup_model("relighting")
        self._cleanup_model("upscaler")
        print("   ✅ Cleanup complete")


# Singleton instance for API
local_enhanced_pipeline = LocalEnhancedPipeline()
