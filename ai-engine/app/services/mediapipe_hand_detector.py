"""
MediaPipe Local Hand Detection Service (Tasks API)
Uses MediaPipe Tasks API for local, API-free hand detection.
No quota limits, runs entirely on device.
"""
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from PIL import Image
import numpy as np
import cv2
import os


class MediaPipeHandDetector:
    """
    Local hand detection using MediaPipe Tasks API.
    No API calls, no quota limits.
    Detects 21 landmarks per hand and calculates bounding boxes.
    """
    
    def __init__(self):
        self.detector = None
        self.model_path = os.path.join(
            os.path.dirname(__file__), 
            "../../models/hand_landmarker.task"
        )
        self._initialize()
    
    def _initialize(self):
        """Initialize the HandLandmarker"""
        if not os.path.exists(self.model_path):
            print(f"⚠️ Model not found at {self.model_path}")
            print("   Download: https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task")
            return
            
        try:
            base_options = python.BaseOptions(model_asset_path=self.model_path)
            options = vision.HandLandmarkerOptions(
                base_options=base_options,
                num_hands=4,  # Detect up to 4 hands
                min_hand_detection_confidence=0.5,
                min_hand_presence_confidence=0.5,
                min_tracking_confidence=0.5
            )
            self.detector = vision.HandLandmarker.create_from_options(options)
            print("✅ MediaPipe HandLandmarker initialized (local, no API)")
        except Exception as e:
            print(f"❌ Failed to initialize MediaPipe: {e}")
    
    def detect_hands(self, image: Image.Image) -> list[dict]:
        """
        Detect hands in image and return bounding boxes.
        
        Args:
            image: PIL Image (RGB or RGBA)
            
        Returns:
            List of dicts with keys: {'x_min', 'y_min', 'x_max', 'y_max'} in pixel coordinates
        """
        print("🖐️ MediaPipe detecting hands (local)...")
        
        if self.detector is None:
            print("   ❌ Detector not initialized")
            return []
        
        # Convert to RGB numpy array
        img_rgb = image.convert("RGB") if image.mode != "RGB" else image
        img_np = np.array(img_rgb)
        
        # Create MediaPipe Image
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_np)
        
        # Detect hands
        result = self.detector.detect(mp_image)
        
        if not result.hand_landmarks:
            print("   ✅ No hands detected")
            return []
        
        # Calculate bounding boxes from landmarks
        h, w = img_np.shape[:2]
        boxes = []
        
        for i, hand_landmarks in enumerate(result.hand_landmarks):
            # Get all landmark coordinates
            x_coords = [lm.x * w for lm in hand_landmarks]
            y_coords = [lm.y * h for lm in hand_landmarks]
            
            # Calculate bounding box with padding
            padding = 30  # pixels
            x_min = max(0, int(min(x_coords)) - padding)
            y_min = max(0, int(min(y_coords)) - padding)
            x_max = min(w, int(max(x_coords)) + padding)
            y_max = min(h, int(max(y_coords)) + padding)
            
            box = {
                "x_min": x_min,
                "y_min": y_min,
                "x_max": x_max,
                "y_max": y_max
            }
            boxes.append(box)
            print(f"   🖐️ Hand {i+1} detected: {box}")
        
        return boxes
    
    def remove_hands_from_mask(self, rgba_image: Image.Image) -> Image.Image:
        """
        Detect hands and remove them from segmentation mask.
        
        Args:
            rgba_image: RGBA image with alpha channel
            
        Returns:
            RGBA image with hands removed from alpha
        """
        print("\n🔍 Local Hand Removal (MediaPipe)")
        print("=" * 50)
        
        hand_boxes = self.detect_hands(rgba_image)
        
        if not hand_boxes:
            print("   ✅ No hands to remove")
            return rgba_image
        
        # Convert to numpy
        img_np = np.array(rgba_image)
        alpha = img_np[:, :, 3].copy()
        
        for box in hand_boxes:
            print(f"   🗑️ Removing hand region: ({box['x_min']}, {box['y_min']}) to ({box['x_max']}, {box['y_max']})")
            alpha[box["y_min"]:box["y_max"], box["x_min"]:box["x_max"]] = 0
        
        # Keep largest connected component
        alpha = self._cleanup_mask(alpha)
        
        img_np[:, :, 3] = alpha
        
        print("   ✅ Hand removal complete")
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
    
    def close(self):
        """Release resources"""
        if self.detector:
            self.detector.close()


# Lazy initialization singleton (don't create at import time)
_detector_instance = None

def get_mediapipe_detector():
    """Get or create the MediaPipe detector instance"""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = MediaPipeHandDetector()
    return _detector_instance
