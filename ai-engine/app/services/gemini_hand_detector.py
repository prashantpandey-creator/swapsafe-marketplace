"""
Gemini Vision Hand Detection Service (Updated API)
Uses google-genai package for Gemini Flash vision.
"""
from google import genai
from google.genai import types
from PIL import Image
import os
import json
import re
import numpy as np
import cv2
import io


class GeminiHandDetector:
    """
    Uses Gemini Flash vision to detect hands in images.
    Returns bounding boxes that can be used to mask out hands from segmentation.
    """
    
    def __init__(self):
        self.client = None
        self._configure_api()
    
    def _configure_api(self):
        """Configure Gemini API"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            # Try to load from .env
            try:
                from dotenv import load_dotenv
                load_dotenv()
                api_key = os.getenv("GEMINI_API_KEY")
            except:
                pass
        
        if api_key:
            self.client = genai.Client(api_key=api_key)
            print("✅ Gemini Flash configured (new API)")
        else:
            print("⚠️ No GEMINI_API_KEY found")
    
    def detect_hands(self, image: Image.Image) -> list[dict]:
        """
        Detect hands in image and return bounding boxes.
        
        Returns:
            List of dicts with keys: {'x_min', 'y_min', 'x_max', 'y_max'} in pixel coordinates
        """
        if not self.client:
            print("❌ Gemini not configured. Need GEMINI_API_KEY.")
            return []
        
        print("🤖 Asking Gemini Flash to detect hands...")
        
        # Prepare image
        img_rgb = image.convert("RGB") if image.mode != "RGB" else image
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        img_rgb.save(img_bytes, format="PNG")
        img_bytes = img_bytes.getvalue()
        
        # Create prompt for bounding box detection
        prompt = """Analyze this image and detect ALL human hands visible.

Return the bounding boxes for each hand in this EXACT JSON format:
{
  "hands": [
    {"label": "hand", "y_min": 0, "x_min": 0, "y_max": 100, "x_max": 100}
  ]
}

Coordinates should be normalized from 0 to 1000 (where 1000 = full image dimension).
If no hands are visible, return: {"hands": []}

ONLY return the JSON, no other text."""
        
        try:
            response = self.client.models.generate_content(
                model="gemini-2.0-flash",
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_text(text=prompt),
                            types.Part.from_bytes(data=img_bytes, mime_type="image/png"),
                        ]
                    )
                ]
            )
            
            result_text = response.text.strip()
            
            print(f"   📋 Gemini response: {result_text[:200]}...")
            
            # Parse JSON from response
            # Try to extract JSON if wrapped in markdown
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result_text = json_match.group()
            
            data = json.loads(result_text)
            hands = data.get("hands", [])
            
            if not hands:
                print("   ✅ No hands detected")
                return []
            
            # Convert normalized coords (0-1000) to pixel coords
            w, h = image.size
            pixel_boxes = []
            
            for hand in hands:
                box = {
                    "x_min": int(hand.get("x_min", 0) * w / 1000),
                    "y_min": int(hand.get("y_min", 0) * h / 1000),
                    "x_max": int(hand.get("x_max", 0) * w / 1000),
                    "y_max": int(hand.get("y_max", 0) * h / 1000),
                }
                pixel_boxes.append(box)
                print(f"   🖐️ Hand detected: {box}")
            
            return pixel_boxes
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return []
    
    def remove_hands_from_mask(self, rgba_image: Image.Image) -> Image.Image:
        """
        Detect hands and remove them from the segmentation mask.
        """
        print("\n🔍 LLM-Guided Hand Removal")
        print("=" * 50)
        
        hand_boxes = self.detect_hands(rgba_image)
        
        if not hand_boxes:
            print("   ✅ No hands to remove")
            return rgba_image
        
        img_np = np.array(rgba_image)
        alpha = img_np[:, :, 3].copy()
        
        padding = 20
        
        for box in hand_boxes:
            x_min = max(0, box["x_min"] - padding)
            y_min = max(0, box["y_min"] - padding)
            x_max = min(rgba_image.width, box["x_max"] + padding)
            y_max = min(rgba_image.height, box["y_max"] + padding)
            
            print(f"   🗑️ Removing hand region: ({x_min}, {y_min}) to ({x_max}, {y_max})")
            alpha[y_min:y_max, x_min:x_max] = 0
        
        alpha = self._cleanup_mask(alpha)
        img_np[:, :, 3] = alpha
        
        print("   ✅ Hand removal complete")
        return Image.fromarray(img_np)
    
    def _cleanup_mask(self, mask: np.ndarray) -> np.ndarray:
        """Keep largest connected component"""
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
gemini_hand_detector = GeminiHandDetector()
