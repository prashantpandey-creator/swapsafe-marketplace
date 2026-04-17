"""
Depth Service - Depth Map Extraction for Structure-Preserving Generation
Uses DPT (Dense Prediction Transformer) for high-quality depth estimation.
This enables ControlNet to preserve product structure during studio regeneration.
"""
import torch
import numpy as np
from PIL import Image
from io import BytesIO
import os


class DepthService:
    def __init__(self):
        self.model = None
        self.transform = None
        self.device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
        
    def load_model(self):
        """Load DPT model for depth estimation"""
        if self.model is not None:
            return
            
        print("⚡ Loading DPT Depth Estimation Model...")
        try:
            from transformers import DPTImageProcessor, DPTForDepthEstimation
            
            # DPT-Large for high quality depth maps
            model_id = "Intel/dpt-large"
            
            self.processor = DPTImageProcessor.from_pretrained(model_id)
            self.model = DPTForDepthEstimation.from_pretrained(model_id)
            
            # Convert to float32 for MPS
            self.model = self.model.float()
            self.model.to(self.device)
            self.model.eval()
            
            print(f"✅ DPT Depth Model loaded on {self.device}")
            
        except Exception as e:
            print(f"❌ DPT load failed: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def estimate_depth(self, image: Image.Image) -> Image.Image:
        """
        Estimate depth map from input image.
        Returns a grayscale depth map image (closer objects = brighter).
        """
        self.load_model()
        
        try:
            # Preprocess
            inputs = self.processor(images=image, return_tensors="pt")
            
            # Move to device and ensure float32
            inputs = {k: v.to(self.device).float() if isinstance(v, torch.Tensor) else v 
                     for k, v in inputs.items()}
            
            # Inference
            with torch.no_grad():
                outputs = self.model(**inputs)
                predicted_depth = outputs.predicted_depth
            
            # Interpolate to original size
            prediction = torch.nn.functional.interpolate(
                predicted_depth.unsqueeze(1),
                size=image.size[::-1],  # (height, width)
                mode="bicubic",
                align_corners=False,
            )
            
            # Normalize to 0-255 range
            output = prediction.squeeze().cpu().numpy()
            output = (output - output.min()) / (output.max() - output.min())
            depth_map = (output * 255).astype(np.uint8)
            
            # Convert to PIL Image
            depth_image = Image.fromarray(depth_map)
            
            return depth_image
            
        except Exception as e:
            print(f"⚠️ Depth estimation failed: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def create_depth_visualization(self, depth_map: Image.Image) -> Image.Image:
        """
        Create a colorized visualization of the depth map for debugging.
        """
        try:
            import cv2
            
            # Convert to numpy
            depth_array = np.array(depth_map)
            
            # Apply color map (TURBO is modern and perceptually uniform)
            colorized = cv2.applyColorMap(depth_array, cv2.COLORMAP_TURBO)
            
            # Convert back to PIL (OpenCV uses BGR, PIL uses RGB)
            colorized_rgb = cv2.cvtColor(colorized, cv2.COLOR_BGR2RGB)
            return Image.fromarray(colorized_rgb)
            
        except Exception as e:
            print(f"⚠️ Depth visualization failed: {e}")
            # Return original grayscale if colorization fails
            return depth_map
    
    async def process_upload(self, image_file) -> tuple[str, str]:
        """
        Process an uploaded file and return paths to depth map and visualization.
        Returns: (grayscale_depth_path, colorized_depth_path)
        """
        contents = await image_file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")
        
        # Generate depth map
        depth_map = self.estimate_depth(image)
        
        # Create visualization
        depth_viz = self.create_depth_visualization(depth_map)
        
        # Save both
        import time
        timestamp = int(time.time())
        os.makedirs("static/output", exist_ok=True)
        
        depth_path = f"static/output/depth_{timestamp}.png"
        viz_path = f"static/output/depth_viz_{timestamp}.png"
        
        depth_map.save(depth_path)
        depth_viz.save(viz_path)
        
        return depth_path, viz_path
    
    def unload(self):
        """Free memory by unloading the model"""
        if self.model is not None:
            del self.model
            del self.processor
            self.model = None
            self.processor = None
            
            # Force garbage collection
            import gc
            gc.collect()
            
            if self.device == "mps":
                torch.mps.empty_cache()
            elif self.device == "cuda":
                torch.cuda.empty_cache()
            
            print("🗑️ Depth model unloaded")


# Singleton instance
depth_service = DepthService()
