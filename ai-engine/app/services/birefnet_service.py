"""
BiRefNet Service - State of the Art Background Removal (2024)
Uses the BiRefNet model from HuggingFace for pixel-perfect background removal.
FIXED: Correct mask extraction using .sigmoid() as per official docs.
"""
import torch
import numpy as np
from PIL import Image
from io import BytesIO
from torchvision import transforms
import os

class BiRefNetService:
    def __init__(self):
        self.model = None
        self.device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
        self.transform = None
        
    def load_model(self, variant: str = "massive"):
        if self.model is not None:
            return
        
        # Available variants: BiRefNet, BiRefNet-massive, BiRefNet-general, BiRefNet-general-lite
        # BiRefNet-massive: Trained on larger dataset, better quality
        variants = {
            "base": "ZhengPeng7/BiRefNet",
            "massive": "ZhengPeng7/BiRefNet-massive",
            "general": "ZhengPeng7/BiRefNet-general",
            "general-lite": "ZhengPeng7/BiRefNet-general-lite",
        }
        
        model_id = variants.get(variant, variants["massive"])
        print(f"⚡ Loading BiRefNet ({variant}) - SOTA Background Removal...")
        
        try:
            from transformers import AutoModelForImageSegmentation
            
            self.model = AutoModelForImageSegmentation.from_pretrained(
                model_id, 
                trust_remote_code=True
            )
            
            # CRITICAL: Convert entire model to float32 for MPS compatibility
            # The model is saved in half precision but MPS needs float32
            self.model = self.model.float()
            self.model.to(self.device)
            self.model.eval()
            
            # Standard ImageNet normalization
            self.transform = transforms.Compose([
                transforms.Resize((1024, 1024)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])
            
            print(f"✅ BiRefNet loaded on {self.device} (float32)")

        except Exception as e:
            print(f"❌ BiRefNet load failed: {e}")
            import traceback
            traceback.print_exc()
            self.model = "rembg"  # Fallback
    
    def remove_background(self, image: Image.Image) -> Image.Image:
        """
        Remove background from image and return RGBA image with transparent background.
        Uses official BiRefNet inference pattern.
        """
        self.load_model()
        
        if self.model == "rembg":
            return self._rembg_remove(image)
        
        try:
            # Store original size for resizing mask back
            original_size = image.size
            
            # Preprocess
            input_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # For MPS, ensure float32
            if self.device == "mps":
                input_tensor = input_tensor.float()
            
            # Inference - CRITICAL: use [-1] to get final output, then .sigmoid()
            with torch.no_grad():
                preds = self.model(input_tensor)[-1].sigmoid().cpu()
            
            # Extract mask
            pred = preds[0].squeeze()
            
            # Convert to PIL mask
            pred_pil = transforms.ToPILImage()(pred)
            mask = pred_pil.resize(original_size, Image.LANCZOS)
            
            # POST-PROCESSING: Clean up mask to remove artifacts
            mask = self._cleanup_mask(mask)
            
            # Apply mask to original image
            rgba = image.convert("RGBA")
            rgba.putalpha(mask)
            
            return rgba
            
        except Exception as e:
            print(f"⚠️ BiRefNet inference failed: {e}")
            import traceback
            traceback.print_exc()
            return self._rembg_remove(image)
    
    def _cleanup_mask(self, mask: Image.Image) -> Image.Image:
        """
        Clean up segmentation mask by:
        1. Keeping only the largest connected component
        2. Removing small fragments (like hands, reflections)
        """
        import cv2
        
        # Convert to numpy
        mask_np = np.array(mask)
        
        # OPTIMIZED CLEANUP - SOFT MODE
        # We need to preserve thin details (fretboards) which might have lower confidence values.
        # A hard threshold of 127 kills them.
        
        # 1. Very low threshold just to find the main object
        _, binary_c = cv2.threshold(mask_np, 10, 255, cv2.THRESH_BINARY)
        
        # 2. Find connected components on this broad mask
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary_c, connectivity=8)
        
        if num_labels <= 1:
            return mask
        
        # 3. Find largest component
        areas = stats[1:, cv2.CC_STAT_AREA]
        largest_idx = np.argmax(areas) + 1
        
        # 4. Create a "Keep Mask" (Binary)
        # We only keep pixels that belong to the largest component
        keep_mask = np.where(labels == largest_idx, 255, 0).astype(np.uint8)
        
        # 5. Apply "Keep Mask" to the ORIGINAL soft mask
        # This preserves the alpha/transparency of edges
        result = cv2.bitwise_and(mask_np, mask_np, mask=keep_mask)
        
        # 6. Optional: Very subtle gamma correction to boost faint details
        # result = np.power(result / 255.0, 0.8) * 255.0
        
        return Image.fromarray(result.astype(np.uint8))
    
    def _rembg_remove(self, image: Image.Image) -> Image.Image:
        """Fallback using rembg library"""
        print("⚠️ Using rembg fallback...")
        from rembg import remove
        return remove(image)
    
    def remove_and_place_on_white(self, image: Image.Image) -> Image.Image:
        """
        Remove background and place on pure white canvas.
        This is the main function for marketplace product images.
        """
        # Remove background
        rgba = self.remove_background(image)
        
        # Create white canvas
        white_canvas = Image.new("RGB", rgba.size, (255, 255, 255))
        
        # Paste with alpha
        white_canvas.paste(rgba, (0, 0), rgba)
        
        return white_canvas
    
    async def process_upload(self, image_file, add_shadow: bool = False) -> str:
        """
        Process an uploaded file and return path to result.
        """
        contents = await image_file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")
        
        # Resize to standard marketplace size
        image = image.resize((1024, 1024), Image.LANCZOS)
        
        # Remove background and place on white
        result = self.remove_and_place_on_white(image)
        
        # Optionally add shadow
        if add_shadow:
            result = self._add_drop_shadow(result)
        
        # Save
        import time
        filename = f"birefnet_{int(time.time())}.png"
        os.makedirs("static/output", exist_ok=True)
        path = f"static/output/{filename}"
        result.save(path)
        
        return path
    
    def _add_drop_shadow(self, image: Image.Image) -> Image.Image:
        """Add a subtle drop shadow for depth"""
        # Simple implementation - just return as-is for now
        return image

# Singleton instance
birefnet_service = BiRefNetService()
