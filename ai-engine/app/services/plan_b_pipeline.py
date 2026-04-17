"""
Plan B Pipeline - 3D Reconstruction + Multi-Angle Rendering
Orchestrates hybrid cloud (Replicate API) + local (trimesh/pyrender) workflow.

Architecture:
1. BiRefNet Segmentation (local, 2-3s) - Remove background
2. 3D Reconstruction (cloud, 5-10s) - Replicate TripoSR API
3. Headless Rendering (local, 2-3s per angle) - Multiple viewpoints
4. Compositing (local, 1s) - Add white BG + shadow
5. Upscaling (local, 3-5s) - Real-ESRGAN polish
"""
import os
import time
import asyncio
from typing import Dict, List, Tuple, Optional
from PIL import Image
from io import BytesIO
import torch
import numpy as np

# Import Plan B services
from app.services.replicate_3d_service import replicate_3d_service
from app.services.rendering_service import rendering_service

# Import Plan A services (reused)
from app.services.birefnet_service import birefnet_service
from app.services.compositing_service import compositing_service
from app.services.upscale_service import upscale_service


class PlanBPipeline:
    """
    Plan B: 3D Reconstruction + Multi-Angle Rendering Pipeline.

    Combines cloud 3D model generation with local headless rendering
    to produce professional studio-quality product images from any angle.

    Key Innovation: 3D mesh naturally removes occlusions (hands, packaging)
    because they don't become part of the geometry.
    """

    def __init__(self):
        self.device = (
            "mps"
            if torch.backends.mps.is_available()
            else "cuda"
            if torch.cuda.is_available()
            else "cpu"
        )
        print(f"🎯 Plan B Pipeline initialized (device: {self.device})")

    async def process(
        self,
        image: Image.Image,
        angles: Optional[List[str]] = None,
        add_shadow: bool = True,
        upscale: bool = True,
        foreground_ratio: float = 0.85
    ) -> Tuple[Dict[str, Image.Image], Dict]:
        """
        Process product photo through Plan B pipeline.

        Args:
            image: Input PIL Image (any background)
            angles: List of camera angles to render
                   Default: [front, side, back]
            add_shadow: Add drop shadow in compositing
            upscale: Apply Real-ESRGAN upscaling (2x)
            foreground_ratio: Ratio of frame occupied by product (0.5-1.0)

        Returns:
            (dict of {angle: Image}, metadata dict)

        Raises:
            RuntimeError if all phases fail
        """
        if angles is None:
            angles = ["front", "side", "back"]

        start_time = time.time()
        metadata = {
            "plan": "B (3D Reconstruction)",
            "stages": {},
            "angles": angles,
            "success": False,
            "cost": 0.00
        }

        print("\n" + "=" * 70)
        print("🚀 PLAN B PIPELINE - 3D Reconstruction + Multi-Angle Rendering")
        print("=" * 70)

        try:
            # PHASE 1: Segmentation (Plan A service)
            print("\n📸 PHASE 1: Segmentation (BiRefNet)")
            print("-" * 70)
            stage_start = time.time()

            rgba_product = birefnet_service.remove_background(image)
            stage_time = time.time() - stage_start
            metadata["stages"]["segmentation"] = stage_time
            print(f"   ✅ Completed in {stage_time:.1f}s")
            print(f"      Extracted product with transparent background")

            # PHASE 2: 3D Reconstruction (cloud)
            print("\n🎨 PHASE 2: 3D Reconstruction (Replicate API)")
            print("-" * 70)
            stage_start = time.time()

            glb_path = await replicate_3d_service.reconstruct_3d(
                rgba_product,
                foreground_ratio=foreground_ratio
            )

            if glb_path is None:
                print(f"   ❌ 3D reconstruction failed. Falling back to Plan A...")
                return await self._fallback_plan_a(rgba_product, add_shadow, upscale)

            stage_time = time.time() - stage_start
            metadata["stages"]["reconstruction"] = stage_time
            metadata["cost"] = replicate_3d_service.cost_per_call
            print(f"   ✅ 3D model generated in {stage_time:.1f}s")
            print(f"   💰 Cost: ${metadata['cost']:.2f}")

            # PHASE 3: Headless Rendering (local)
            print("\n🖼️  PHASE 3: Rendering ({} angle(s))".format(len(angles)))
            print("-" * 70)
            stage_start = time.time()

            try:
                rendered_views = rendering_service.render_multiple_angles(
                    glb_path,
                    angles=angles
                )
                stage_time = time.time() - stage_start
                metadata["stages"]["rendering"] = stage_time
                print(f"   ✅ Rendered {len(angles)} view(s) in {stage_time:.1f}s")
                for angle in angles:
                    print(f"      • {angle}: {rendered_views[angle].size}")

            except Exception as e:
                print(f"   ❌ Rendering failed: {e}")
                print(f"   🔄 Falling back to Plan A...")
                # Cleanup GLB
                if os.path.exists(glb_path):
                    os.remove(glb_path)
                return await self._fallback_plan_a(rgba_product, add_shadow, upscale)

            # PHASE 4: Compositing (Plan A service)
            print("\n✏️  PHASE 4: Compositing")
            print("-" * 70)
            stage_start = time.time()

            composited_views = {}
            for angle, view_img in rendered_views.items():
                # Ensure RGBA
                if view_img.mode != "RGBA":
                    view_img = view_img.convert("RGBA")

                # Place on white background
                composited = compositing_service.place_on_white_background(
                    view_img,
                    background_size=(1024, 1024),
                    padding_percent=0.05
                )

                # Add drop shadow
                if add_shadow:
                    composited = compositing_service.add_drop_shadow(composited)

                composited_views[angle] = composited

            stage_time = time.time() - stage_start
            metadata["stages"]["compositing"] = stage_time
            print(f"   ✅ Completed in {stage_time:.1f}s")

            # PHASE 5: Upscaling (Plan A service)
            if upscale:
                print("\n✨ PHASE 5: Polish (Real-ESRGAN)")
                print("-" * 70)
                stage_start = time.time()

                final_views = {}
                for angle, comp_img in composited_views.items():
                    # Clear MPS cache before upscaling
                    if self.device == "mps":
                        torch.mps.empty_cache()

                    final_views[angle] = upscale_service.enhance(comp_img, scale=2)

                stage_time = time.time() - stage_start
                metadata["stages"]["upscaling"] = stage_time
                print(f"   ✅ Completed in {stage_time:.1f}s")
            else:
                final_views = composited_views
                metadata["stages"]["upscaling"] = 0

            # Cleanup
            if os.path.exists(glb_path):
                os.remove(glb_path)

            # SUCCESS
            total_time = time.time() - start_time
            metadata["total_time"] = total_time
            metadata["success"] = True

            print("\n" + "=" * 70)
            print("✅ PLAN B PIPELINE COMPLETE")
            print("=" * 70)
            print(f"   Total Time: {total_time:.1f}s")
            print(f"   Segmentation: {metadata['stages']['segmentation']:.1f}s")
            print(f"   3D Reconstruction: {metadata['stages']['reconstruction']:.1f}s")
            print(f"   Rendering: {metadata['stages']['rendering']:.1f}s")
            print(f"   Compositing: {metadata['stages']['compositing']:.1f}s")
            print(f"   Upscaling: {metadata['stages'].get('upscaling', 0):.1f}s")
            print(f"   💰 Total Cost: ${metadata['cost']:.2f}")
            print("=" * 70)

            return final_views, metadata

        except Exception as e:
            print(f"\n❌ Pipeline error: {e}")
            import traceback
            traceback.print_exc()
            metadata["error"] = str(e)
            raise

    async def _fallback_plan_a(
        self,
        rgba_image: Image.Image,
        add_shadow: bool,
        upscale: bool
    ) -> Tuple[Dict[str, Image.Image], Dict]:
        """
        Fallback to Plan A (2D only) if 3D reconstruction fails.

        Args:
            rgba_image: RGBA image with transparent background
            add_shadow: Add drop shadow
            upscale: Apply upscaling

        Returns:
            ({angle: image}, metadata)
        """
        print("\n" + "=" * 70)
        print("🔄 FALLBACK: Plan A (2D Enhancement Only)")
        print("=" * 70)

        metadata = {
            "plan": "A (fallback from B)",
            "success": False,
            "cost": 0.00,
            "stages": {}
        }

        try:
            # Convert RGBA to RGB on white background
            rgb_image = Image.new("RGB", rgba_image.size, (255, 255, 255))
            rgb_image.paste(rgba_image, mask=rgba_image.split()[3])

            # Composite with shadow
            start_time = time.time()
            composited = compositing_service.place_on_white_background(rgb_image)
            if add_shadow:
                composited = compositing_service.add_drop_shadow(composited)

            metadata["stages"]["compositing"] = time.time() - start_time

            # Upscale if requested
            if upscale:
                start_time = time.time()
                result = upscale_service.enhance(composited, scale=2)
                metadata["stages"]["upscaling"] = time.time() - start_time
            else:
                result = composited
                metadata["stages"]["upscaling"] = 0

            metadata["success"] = True
            metadata["total_time"] = sum(metadata["stages"].values())

            print("   ✅ Fallback complete (single front view)")
            return {"front": result}, metadata

        except Exception as e:
            print(f"   ❌ Fallback failed: {e}")
            raise


# Singleton instance
plan_b_pipeline = PlanBPipeline()
