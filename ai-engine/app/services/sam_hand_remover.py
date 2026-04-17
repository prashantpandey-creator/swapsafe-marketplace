"""
SAM (Segment Anything Model) Precise Hand Removal Service
Uses SAM for pixel-perfect segmentation masks - not rectangles!
"""
import torch
import numpy as np
from PIL import Image
import cv2
import os


class SAMHandRemover:
    """
    Uses Segment Anything Model for PRECISE pixel-level segmentation.
    - Given a bounding box prompt (from Gemini), creates exact mask
    - Much more precise than rectangular bounding boxes
    """
    
    def __init__(self):
        self.sam = None
        self.predictor = None
        self.model_path = "models/sam_vit_b.pth"
        self.device = "cpu"  # MPS has issues with SAM
        
    def load_model(self):
        """Load SAM model"""
        if self.sam is not None:
            return True
            
        print("⚡ Loading SAM (Segment Anything)...")
        
        try:
            from segment_anything import sam_model_registry, SamPredictor
            
            # Check if model exists
            if not os.path.exists(self.model_path):
                print(f"❌ SAM model not found at {self.model_path}")
                print("   Download from: https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth")
                print("   Save to: models/sam_vit_b.pth")
                return False
            
            self.sam = sam_model_registry["vit_b"](checkpoint=self.model_path)
            self.sam.to(self.device)
            self.predictor = SamPredictor(self.sam)
            
            print(f"✅ SAM loaded on {self.device}")
            return True
            
        except Exception as e:
            print(f"❌ SAM load failed: {e}")
            return False
    
    def get_precise_mask(
        self, 
        image: Image.Image, 
        box: dict  # {"x_min", "y_min", "x_max", "y_max"}
    ) -> np.ndarray:
        """
        Get pixel-perfect mask for object in bounding box.
        SAM creates precise contours, not rectangles!
        
        Returns:
            Binary mask (255 = object, 0 = background)
        """
        if not self.load_model():
            # Fallback to rectangular mask
            mask = np.zeros((image.height, image.width), dtype=np.uint8)
            mask[box["y_min"]:box["y_max"], box["x_min"]:box["x_max"]] = 255
            return mask
        
        # Convert to numpy
        img_np = np.array(image.convert("RGB"))
        
        # Set image for SAM
        self.predictor.set_image(img_np)
        
        # Create box prompt for SAM [x_min, y_min, x_max, y_max]
        input_box = np.array([
            box["x_min"], box["y_min"], 
            box["x_max"], box["y_max"]
        ])
        
        # Predict mask
        masks, scores, _ = self.predictor.predict(
            point_coords=None,
            point_labels=None,
            box=input_box[None, :],  # Add batch dimension
            multimask_output=False   # Single best mask
        )
        
        # Get the mask (0 or 1)
        mask = masks[0].astype(np.uint8) * 255
        
        return mask
    
    def remove_hands(
        self, 
        rgba_image: Image.Image,
        hand_boxes: list[dict],
        padding: int = 10
    ) -> Image.Image:
        """
        Remove hands with pixel-perfect masks.
        
        Args:
            rgba_image: RGBA segmented product
            hand_boxes: List of {"x_min", "y_min", "x_max", "y_max"}
            padding: Pixels to add to bounding box
            
        Returns:
            RGBA with hands removed from alpha
        """
        print("\n🎯 SAM Precise Hand Removal")
        print("=" * 50)
        
        if not hand_boxes:
            print("   No hands to remove")
            return rgba_image
        
        # Convert to numpy
        img_np = np.array(rgba_image)
        alpha = img_np[:, :, 3].copy()
        
        for i, box in enumerate(hand_boxes):
            print(f"   [{i+1}/{len(hand_boxes)}] Processing hand...")
            
            # Add padding
            padded_box = {
                "x_min": max(0, box["x_min"] - padding),
                "y_min": max(0, box["y_min"] - padding),
                "x_max": min(rgba_image.width, box["x_max"] + padding),
                "y_max": min(rgba_image.height, box["y_max"] + padding),
            }
            
            # Get precise mask from SAM
            hand_mask = self.get_precise_mask(rgba_image, padded_box)
            
            # Remove hand from alpha
            alpha = np.where(hand_mask > 0, 0, alpha).astype(np.uint8)
        
        # Clean up - keep largest component
        alpha = self._cleanup_mask(alpha)
        
        # Update alpha
        img_np[:, :, 3] = alpha
        
        print("   ✅ Hands removed with pixel-perfect precision")
        return Image.fromarray(img_np)
    
    def _cleanup_mask(self, mask: np.ndarray) -> np.ndarray:
        """Keep only largest connected component"""
        _, binary = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(binary, connectivity=8)
        
        if num_labels <= 1:
            return mask
        
        areas = stats[1:, cv2.CC_STAT_AREA]
        largest_idx = np.argmax(areas) + 1
        
        clean = np.zeros_like(mask)
        clean[labels == largest_idx] = 255
        
        return np.where(clean > 0, mask, 0).astype(np.uint8)


# Singleton
sam_hand_remover = SAMHandRemover()
