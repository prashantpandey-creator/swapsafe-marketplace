import cv2
import numpy as np
from PIL import Image
import io

class EnhanceService:
    """
    Enhances raw product photos to look like studio shots.
    Features:
    - Lighting Correction (CLAHE) - Fixes shadows/exposure on the object
    - Denoising - Removes grain from low-light shots
    - Color Balancing - Ensures natural colors
    """
    
    def enhance_product(self, image_bytes: bytes) -> bytes:
        """
        Applies a 'Studio' filter to the raw image bytes.
        Returns enhanced image bytes.
        """
        try:
            # Convert bytes to numpy array for OpenCV
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                raise ValueError("Could not decode image")

            # --- Step 1: Denoise ---
            # Remove grain/noise which is common in phone photos
            # h=3 is mild, keeps details but reduces speckles
            img = cv2.fastNlMeansDenoisingColored(img, None, 3, 3, 7, 21)

            # --- Step 2: Lighting Correction (CLAHE) ---
            # Convert to LAB color space to separate Luminance from Color
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            
            # Apply Contrast Limited Adaptive Histogram Equalization to L channel
            # This brings out details in shadows without blowing out highlights
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            cl = clahe.apply(l)
            
            # Merge enhanced L with original A/B
            limg = cv2.merge((cl, a, b))
            enhanced_img = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
            
            # --- Step 3: Mild Sharpening ---
            # Brings out texture details (like speaker mesh)
            kernel = np.array([[0, -1, 0], 
                               [-1, 5,-1], 
                               [0, -1, 0]])
            enhanced_img = cv2.filter2D(enhanced_img, -1, kernel)

            # Convert back to bytes (JPEG)
            success, encoded_img = cv2.imencode('.jpg', enhanced_img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
            if not success:
                raise ValueError("Could not encode enhanced image")
                
            return encoded_img.tobytes()

        except Exception as e:
            print(f"⚠️ Enhancement failed: {e}. Returning original.")
            return image_bytes

# Singleton
enhance_service = EnhanceService()
