"""
Headless 3D Rendering Service - Renders GLB meshes to 2D images
Uses trimesh + pyrender for local GPU/CPU rendering without display server.
"""
import os
import numpy as np
from typing import Dict, List, Optional
from PIL import Image
import time


class RenderingService:
    """
    Headless 3D rendering of GLB meshes from multiple viewpoints.

    Features:
    - Multiple preset camera angles
    - Professional 3-point studio lighting
    - White background (255, 255, 255)
    - Automatic mesh centering and scaling
    - CPU/GPU rendering (no display required)
    """

    def __init__(self):
        self.camera_distance = 2.5
        self.image_size = (1024, 1024)
        self._ensure_offscreen_renderer()

    def _ensure_offscreen_renderer(self):
        """
        Ensure pyglet is configured for offscreen rendering (no display server).
        This must be done before importing pyrender.
        """
        os.environ["PYGLET_SHADOW_WINDOW"] = "1"  # Shadow window (headless)

        try:
            import pyglet

            pyglet.options["shadow_window"] = True
            pyglet.options["debug_gl"] = False
        except Exception as e:
            print(f"⚠️  Pyglet config warning: {e}")

    def render_multiple_angles(
        self,
        glb_path: str,
        angles: Optional[List[str]] = None
    ) -> Dict[str, Image.Image]:
        """
        Render GLB from multiple preset angles.

        Args:
            glb_path: Path to GLB file
            angles: List of angle names (front, side, back, top, 3/4)
                   Defaults to [front, side, back] if None

        Returns:
            Dict mapping angle name to PIL Image (RGBA, 1024x1024)

        Raises:
            FileNotFoundError if GLB not found
            RuntimeError if rendering fails
        """
        if angles is None:
            angles = ["front", "side", "back"]

        if not os.path.exists(glb_path):
            raise FileNotFoundError(f"GLB file not found: {glb_path}")

        print(f"   📦 Loading GLB from {glb_path}")

        try:
            import trimesh
            import pyrender

            # Load mesh
            mesh = trimesh.load(glb_path)

            if not isinstance(mesh, trimesh.Trimesh):
                # Handle composite meshes (Scene objects)
                if hasattr(mesh, "geometry"):
                    # It's a Scene, merge all geometry
                    meshes = [geom for geom in mesh.geometry.values()]
                    mesh = trimesh.util.concatenate(meshes)
                else:
                    raise RuntimeError(f"Unexpected mesh type: {type(mesh)}")

            # Verify mesh is valid
            if mesh.vertices.shape[0] == 0:
                raise RuntimeError("Mesh has no vertices")

            print(f"   ✅ Loaded mesh: {mesh.vertices.shape[0]} vertices, {mesh.faces.shape[0]} faces")

            # Center and scale mesh
            mesh.apply_translation(-mesh.centroid)
            scale = 1.5 / np.max(mesh.extents)
            mesh.apply_scale(scale)

            # Create pyrender scene
            scene = pyrender.Scene(
                bg_color=[255, 255, 255, 255],
                ambient_light=np.array([0.5, 0.5, 0.5, 1.0])
            )

            # Add mesh to scene
            mesh_node = scene.add(pyrender.Mesh.from_trimesh(mesh))

            # Add professional studio lighting
            self._add_studio_lights(scene)

            # Render from each angle
            renders = {}
            renderer = pyrender.OffscreenRenderer(
                self.image_size[0],
                self.image_size[1]
            )

            try:
                for i, angle in enumerate(angles):
                    print(f"   🎬 Rendering '{angle}' ({i + 1}/{len(angles)})")

                    # Get camera pose for this angle
                    camera_pose = self._get_camera_pose(angle)

                    # Create camera
                    camera = pyrender.PerspectiveCamera(
                        yfov=np.pi / 3.0,
                        aspectRatio=1.0
                    )

                    # Remove any existing camera from scene
                    for node in scene.get_nodes(obj=pyrender.Camera):
                        scene.remove_node(node)

                    # Add camera to scene
                    scene.add(camera, pose=camera_pose)

                    # Render
                    color, depth = renderer.render(scene)

                    # Convert to PIL Image (RGBA)
                    # color is already RGB (H, W, 3)
                    img_array = np.concatenate([color, np.full((color.shape[0], color.shape[1], 1), 255, dtype=np.uint8)], axis=2)
                    img_pil = Image.fromarray(img_array, mode="RGBA")

                    renders[angle] = img_pil
                    print(f"      ✅ '{angle}' rendered")

            finally:
                # Cleanup renderer
                renderer.delete()

            return renders

        except ImportError as e:
            raise RuntimeError(
                f"Missing dependencies for rendering: {e}. "
                f"Install: pip install trimesh pyrender pyglet<2 networkx"
            )
        except Exception as e:
            print(f"   ❌ Rendering error: {e}")
            import traceback
            traceback.print_exc()
            raise

    def _get_camera_pose(self, angle: str) -> np.ndarray:
        """
        Get camera transformation matrix for preset angles.

        Angles:
        - front: Looking at -Z axis (product facing camera)
        - side: Looking at product from right (+X axis)
        - back: Looking at product from back (+Z axis)
        - top: Looking down at product from above
        - 3/4: Isometric 3/4 view (upper right front)
        """
        d = self.camera_distance

        poses = {
            # Front: camera at (0, 0, +d), looking at origin
            "front": np.array([
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, d],
                [0, 0, 0, 1]
            ], dtype=np.float32),

            # Side: camera at (+d, 0, 0), looking at origin
            "side": np.array([
                [0, 0, -1, -d],
                [0, 1, 0, 0],
                [1, 0, 0, 0],
                [0, 0, 0, 1]
            ], dtype=np.float32),

            # Back: camera at (0, 0, -d), looking at origin
            "back": np.array([
                [-1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, -1, -d],
                [0, 0, 0, 1]
            ], dtype=np.float32),

            # Top: camera at (0, +d, 0), looking down
            "top": np.array([
                [1, 0, 0, 0],
                [0, 0, 1, d],
                [0, -1, 0, 0],
                [0, 0, 0, 1]
            ], dtype=np.float32),

            # 3/4 view: upper right front (isometric)
            "3/4": np.array([
                [0.866, -0.5, 0.0, 0.866 * d],
                [0.289, 0.5, 0.816, 0.289 * d],
                [-0.408, -0.707, 0.577, -0.408 * d],
                [0, 0, 0, 1]
            ], dtype=np.float32),
        }

        return poses.get(angle, poses["front"])

    def _add_studio_lights(self, scene):
        """
        Add professional 3-point studio lighting setup.

        - Key light: Main light (3.0 intensity, upper right front)
        - Fill light: Softer opposite light (1.0 intensity, upper left)
        - Ambient: Soft overall illumination (0.5 intensity)
        """
        import pyrender

        # Key light (main) - bright, directional
        key_light = pyrender.DirectionalLight(
            color=np.array([1.0, 1.0, 1.0]),
            intensity=3.0
        )
        key_pose = np.array([
            [1, 0, 0, 1],
            [0, 1, 0, 2],
            [0, 0, 1, 2],
            [0, 0, 0, 1]
        ], dtype=np.float32)
        scene.add(key_light, pose=key_pose)

        # Fill light (softer, opposite side) - reduces harsh shadows
        fill_light = pyrender.DirectionalLight(
            color=np.array([1.0, 1.0, 1.0]),
            intensity=1.0
        )
        fill_pose = np.array([
            [1, 0, 0, -1],
            [0, 1, 0, 1],
            [0, 0, 1, 1],
            [0, 0, 0, 1]
        ], dtype=np.float32)
        scene.add(fill_light, pose=fill_pose)

        # Ambient light (soft overall) - prevents pure black shadows
        ambient = pyrender.DirectionalLight(
            color=np.array([1.0, 1.0, 1.0]),
            intensity=0.5
        )
        ambient_pose = np.array([
            [1, 0, 0, 0],
            [0, 1, 0, 2],
            [0, 0, 1, 2],
            [0, 0, 0, 1]
        ], dtype=np.float32)
        scene.add(ambient, pose=ambient_pose)

        print("   💡 Studio lighting configured (3-point setup)")


# Singleton instance
rendering_service = RenderingService()
