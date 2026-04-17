"""
Local Pipeline Service - Plan A: Fully Local Product Photography Pipeline
Orchestrates the complete workflow: Segment → Analyze → Clean → Composite → Polish
All processing stays on your 32GB Mac. Zero costs, privacy-first.
"""
import time
from typing import Tuple, Optional
from PIL import Image
from io import BytesIO
import psutil
import gc
import torch

from app.services.birefnet_service import BiRefNetService
from app.services.vlm_director_service import VLMDirectorService
from app.services.compositing_service import CompositingService
from app.services.upscale_service import UpscaleService


class PipelineConfig:
    """Configuration for pipeline execution."""
    def __init__(
        self,
        max_memory_gb: float = 16.0,
        target_size: Tuple[int, int] = (1024, 1024),
        padding_percent: float = 0.05,
        add_shadow: bool = True,
        upscale: bool = True,
        upscale_factor: int = 2,
    ):
        self.max_memory_gb = max_memory_gb
        self.target_size = target_size
        self.padding_percent = padding_percent
        self.add_shadow = add_shadow
        self.upscale = upscale
        self.upscale_factor = upscale_factor


class LocalPipeline:
    """
    Plan A Pipeline: Fully local processing on Mac.
    Phases: 1) Segment (BiRefNet) → 2) Analyze (Qwen VLM) → 3) Composite → 4) Polish (Real-ESRGAN)
    """

    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or PipelineConfig()
        self._birefnet = None
        self._vlm = None
        self._compositing = None
        self._upscaler = None

        self.device = (
            "mps"
            if torch.backends.mps.is_available()
            else "cuda"
            if torch.cuda.is_available()
            else "cpu"
        )
        print(f"🖥️  Local Pipeline initialized on {self.device} (Lazy Loading)")

    @property
    def birefnet(self):
        if self._birefnet is None:
            print("⏳ Lazy Loading BiRefNet...")
            self._birefnet = BiRefNetService()
        return self._birefnet

    @property
    def vlm(self):
        if self._vlm is None:
            print("⏳ Lazy Loading VLM...")
            self._vlm = VLMDirectorService()
        return self._vlm

    @property
    def compositing(self):
        if self._compositing is None:
            self._compositing = CompositingService()
        return self._compositing

    @property
    def upscaler(self):
        if self._upscaler is None:
            print("⏳ Lazy Loading Upscaler...")
            self._upscaler = UpscaleService()
        return self._upscaler

    def _check_memory(self) -> bool:
        """Check if we have enough memory to continue."""
        mem = psutil.virtual_memory()
        available_gb = mem.available / (1024 ** 3)
        return available_gb > 1.0  # Need at least 1GB free

    def _log_memory(self, stage: str):
        """Log current memory usage."""
        mem = psutil.virtual_memory()
        used_gb = mem.used / (1024 ** 3)
        available_gb = mem.available / (1024 ** 3)
        percent = mem.percent
        print(f"   📊 Memory: {used_gb:.1f}GB used, {available_gb:.1f}GB available ({percent:.1f}%)")

    def process(self, image: Image.Image) -> Tuple[Image.Image, dict]:
        """
        Process a product photo through the full Plan A pipeline.

        Args:
            image: PIL Image of product photo

        Returns:
            Tuple of (processed_image, metadata)
        """
        start_time = time.time()
        print("\n" + "=" * 60)
        print("🚀 LOCAL PIPELINE (Plan A) - Fully Private, Zero Cost")
        print("=" * 60)

        # Ensure image is RGB
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Resize to max 1024 for processing (speed)
        if image.width > 2048 or image.height > 2048:
            image.thumbnail((2048, 2048), Image.Resampling.LANCZOS)

        self._log_memory("START")
        metadata = {
            "stages": {},
            "total_time": 0,
            "success": False,
        }

        try:
            # PHASE 1: SEGMENT (BiRefNet)
            # ==============================
            print("\n📸 PHASE 1: Segmentation (BiRefNet)")
            print("-" * 40)
            stage_start = time.time()

            rgba_product = self.birefnet.remove_background(image)
            stage_time = time.time() - stage_start
            self._log_memory("PHASE 1")
            metadata["stages"]["segmentation"] = stage_time
            print(f"   ✅ Completed in {stage_time:.1f}s")

            if not self._check_memory():
                print("   ⚠️ Low memory, unloading BiRefNet")
                del self.birefnet
                gc.collect()

            # PHASE 2: ANALYZE (Qwen VLM) - Optional
            # ========================================
            print("\n🔮 PHASE 2: Analysis (Qwen-Image-2.0)")
            print("-" * 40)
            stage_start = time.time()

            # For Plan A, only do full VLM analysis for medium/complex cases
            # Use a quick heuristic first
            complexity = self._estimate_complexity(image, rgba_product)
            metadata["estimated_complexity"] = complexity

            if complexity in ["medium", "complex"]:
                print(f"   Complexity: {complexity} → Running VLM analysis")
                edit_plan = self.vlm.analyze(image)
                metadata["edit_plan"] = {
                    "product": edit_plan.product_name,
                    "issues": edit_plan.issues,
                    "removals": edit_plan.removals_needed,
                    "complexity": edit_plan.complexity,
                }
                stage_time = time.time() - stage_start
                metadata["stages"]["analysis"] = stage_time
                self._log_memory("PHASE 2")
                print(f"   ✅ Completed in {stage_time:.1f}s")
            else:
                print(f"   Complexity: {complexity} → Skipping VLM (fast path)")
                metadata["stages"]["analysis"] = 0
                edit_plan = None

            # PHASE 3: COMPOSITE
            # ==================
            print("\n🎨 PHASE 3: Compositing")
            print("-" * 40)
            stage_start = time.time()

            composited = self.compositing.place_on_white_background(
                rgba_product,
                background_size=self.config.target_size,
                padding_percent=self.config.padding_percent,
            )

            if self.config.add_shadow:
                print("   Adding drop shadow...")
                composited = self.compositing.add_drop_shadow(
                    composited,
                    shadow_opacity=0.2,
                )

            stage_time = time.time() - stage_start
            metadata["stages"]["compositing"] = stage_time
            self._log_memory("PHASE 3")
            print(f"   ✅ Completed in {stage_time:.1f}s")

            # Unload VLM if loaded
            if edit_plan is not None:
                self.vlm.unload()
                gc.collect()

            # PHASE 4: POLISH (Real-ESRGAN) - Optional
            # =========================================
            if self.config.upscale:
                print("\n✨ PHASE 4: Polish (Real-ESRGAN)")
                print("-" * 40)
                stage_start = time.time()

                final = self.upscaler.enhance(
                    composited,
                    scale=self.config.upscale_factor,
                )

                stage_time = time.time() - stage_start
                metadata["stages"]["upscaling"] = stage_time
                self._log_memory("PHASE 4")
                print(f"   ✅ Completed in {stage_time:.1f}s")
            else:
                final = composited
                metadata["stages"]["upscaling"] = 0

            # SUCCESS
            # =======
            total_time = time.time() - start_time
            metadata["total_time"] = total_time
            metadata["success"] = True

            print("\n" + "=" * 60)
            print(f"✅ PIPELINE COMPLETE in {total_time:.1f}s")
            print(f"   Segmentation: {metadata['stages']['segmentation']:.1f}s")
            if metadata["stages"]["analysis"] > 0:
                print(f"   Analysis: {metadata['stages']['analysis']:.1f}s")
            print(f"   Compositing: {metadata['stages']['compositing']:.1f}s")
            if metadata["stages"]["upscaling"] > 0:
                print(f"   Upscaling: {metadata['stages']['upscaling']:.1f}s")
            self._log_memory("FINAL")
            print("=" * 60)

            return final, metadata

        except Exception as e:
            print(f"\n❌ Pipeline error: {e}")
            import traceback
            traceback.print_exc()
            metadata["error"] = str(e)
            metadata["success"] = False
            return image, metadata  # Return original image on error

    def _estimate_complexity(self, original: Image.Image, segmented: Image.Image) -> str:
        """
        Quick heuristic to estimate editing complexity.
        Avoids running full VLM analysis for simple cases.
        """
        import numpy as np

        # If segmentation is clean (large connected component), probably simple
        seg_array = np.array(segmented)
        alpha = seg_array[:, :, 3] if seg_array.shape[2] == 4 else np.ones(seg_array.shape[:2])

        # Ratio of product area to total image
        product_ratio = np.sum(alpha > 128) / (alpha.shape[0] * alpha.shape[1])

        # If product is >50% of image, likely well-framed
        if product_ratio > 0.5:
            return "simple"  # Fast path

        # If product is 10-50%, medium framing
        if product_ratio > 0.1:
            return "medium"

        # Otherwise, likely complex (cut off, small in frame)
        return "complex"

    def cleanup(self):
        """Unload all models and free memory."""
        print("\n🧹 Cleanup...")
        self.birefnet = None
        self.vlm.unload()
        self.upscaler.cleanup()
        gc.collect()
        print("✅ All models unloaded")


# Singleton instance
local_pipeline = LocalPipeline()
