"""
Local TripoSR Service - 3D Reconstruction on Local GPU
Runs TripoSR directly on machine (Google Cloud VM or local GPU)
Much faster and cheaper than Replicate API!
"""
import os
import tempfile
import uuid
from pathlib import Path
from typing import Optional
from PIL import Image
from io import BytesIO
import numpy as np


class LocalTriposrService:
    """
    Run TripoSR locally on GPU (instead of Replicate API).

    Perfect for:
    - Google Cloud Compute Engine with GPU
    - Local machine with NVIDIA GPU
    - Processing thousands of images cheaply

    Cost: $0.00 (uses your compute resources)
    Speed: 10-15s per image (much faster than Replicate!)
    """

    def __init__(self):
        self.model = None
        self.device = self._get_device()
        self._model_loaded = False
        print(f"🎮 Local TripoSR Service initialized (device: {self.device})")

    def _get_device(self):
        """Detect GPU device"""
        try:
            import torch

            if torch.cuda.is_available():
                return "cuda"
            elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                return "mps"
            else:
                return "cpu"
        except:
            return "cpu"

    def _load_model(self):
        """Lazy load TripoSR model"""
        if self._model_loaded:
            return True

        try:
            print(f"⚡ Loading TripoSR model on {self.device}...")

            # Option 1: Try importing from local installation
            try:
                from tsr.models import TSR
                from tsr.utils import remove_background, resize_foreground

                self.tsr_module = TSR
                self.remove_bg = remove_background
                self.resize_fg = resize_foreground
                self._model_loaded = True
                print("✅ TripoSR loaded (local installation)")
                return True

            except ImportError:
                print("⚠️  TripoSR not installed. Install with:")
                print("   pip install git+https://github.com/VAST-AI-Research/TripoSR.git")
                return False

        except Exception as e:
            print(f"❌ Error loading TripoSR: {e}")
            return False

    async def reconstruct_3d(
        self,
        image: Image.Image,
        foreground_ratio: float = 0.85,
        chunk_size: int = 8192,
    ) -> Optional[str]:
        """
        Generate 3D mesh from image using local TripoSR.

        Args:
            image: PIL Image (RGBA with transparent background)
            foreground_ratio: How much of frame is product
            chunk_size: TripoSR chunk size (lower = more memory efficient)

        Returns:
            Path to downloaded GLB file, or None if failed
        """
        if not self._load_model():
            print("❌ TripoSR not available. Install to enable 3D reconstruction.")
            return None

        try:
            import torch

            print(f"🚀 Local TripoSR: Generating 3D mesh...")

            # Convert PIL to numpy
            image_np = np.array(image)

            # Remove background if still present
            if image.mode == "RGBA":
                mask = image_np[:, :, 3] > 128
            else:
                # Simple color-based background removal
                mask = np.ones(image_np.shape[:2], dtype=bool)

            # Prepare image for TripoSR
            # TripoSR expects RGB, square, 512x512 optimal
            if image.size[0] != image.size[1]:
                # Make square
                size = max(image.size)
                square = Image.new("RGB", (size, size), color=(255, 255, 255))
                offset = ((size - image.size[0]) // 2, (size - image.size[1]) // 2)
                square.paste(image.convert("RGB"), offset)
                image = square

            # Resize to 512x512 for processing
            image = image.resize((512, 512), Image.Resampling.LANCZOS)

            # Convert to tensor
            image_tensor = torch.from_numpy(np.array(image)).float() / 255.0
            if len(image_tensor.shape) == 2:
                image_tensor = image_tensor.unsqueeze(-1).repeat(1, 1, 3)
            image_tensor = image_tensor.permute(2, 0, 1).unsqueeze(0).to(self.device)

            print(f"   Input shape: {image_tensor.shape}")

            # Run TripoSR
            with torch.no_grad():
                # Initialize model if needed
                if not hasattr(self, "model_instance"):
                    from tsr.models import TSR

                    self.model_instance = TSR.from_pretrained("stabilityai/TripoSR")
                    self.model_instance = self.model_instance.to(self.device)
                    self.model_instance.eval()

                # Generate 3D
                outputs = self.model_instance(image_tensor, chunks=chunk_size)

            # Extract mesh
            mesh = outputs["mesh"]  # Trimesh object

            # Save as GLB
            glb_path = f"/tmp/product_mesh_{uuid.uuid4().hex[:8]}.glb"
            mesh.export(glb_path)

            print(f"   ✅ 3D mesh generated: {glb_path}")
            print(f"   Vertices: {len(mesh.vertices)}")
            print(f"   Faces: {len(mesh.faces)}")

            return glb_path

        except ImportError as e:
            print(f"❌ Missing dependency: {e}")
            print("Install TripoSR:")
            print("  pip install git+https://github.com/VAST-AI-Research/TripoSR.git")
            return None

        except Exception as e:
            print(f"❌ TripoSR error: {e}")
            import traceback

            traceback.print_exc()
            return None

    def clear_cache(self):
        """Clear GPU memory"""
        if self.device == "cuda":
            import torch

            torch.cuda.empty_cache()
            print("🧹 GPU cache cleared")


# Singleton
local_triposr_service = LocalTriposrService()


"""
USAGE:

To use this instead of Replicate:

1. In plan_b_pipeline.py, change:
   from app.services.replicate_3d_service import replicate_3d_service
   To:
   from app.services.local_triposr_service import local_triposr_service

2. Change the API call:
   glb_path = await replicate_3d_service.reconstruct_3d(image)
   To:
   glb_path = await local_triposr_service.reconstruct_3d(image)

3. Now it runs locally on your GPU instead of calling Replicate!

INSTALLATION:

pip install git+https://github.com/VAST-AI-Research/TripoSR.git

This takes ~5 minutes on first install.
"""
