"""
BiRefNet Service - State of the Art Background Removal (2024)
Uses the BiRefNet model from HuggingFace for pixel-perfect background removal.
FIXED: Correct mask extraction using .sigmoid() as per official docs.
"""
try:
    import torch
    from torchvision import transforms
except ImportError:
    torch = None
    transforms = None

import numpy as np
from PIL import Image
from io import BytesIO
import os

class BiRefNetService:
    def __init__(self):
        self.model = None
        self._rembg_session = None  # cached u2netp session
        # Quality score (0-100) of the LAST mask produced. Set by remove_background.
        # High = crisp, confident cutout. Low = lots of ambiguous mid-grey edges
        # (cluttered/low-contrast scene) — caller may want to retry or warn the user.
        self.last_alpha_quality = None
        if torch:
            self.device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = "cpu"
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
        
        if not torch:
            print("⚠️ No torch available. Forcing rembg fallback.")
            self.model = "rembg"
            return
            
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
        self.last_alpha_quality = None

        if self.model == "rembg":
            rgba = self._rembg_remove(image)
            self.last_alpha_quality = self._score_alpha_quality(rgba)
            print(f"   📊 Alpha quality: {self.last_alpha_quality}")
            return rgba

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

            self.last_alpha_quality = self._score_alpha_quality(rgba)
            print(f"   📊 Alpha quality: {self.last_alpha_quality}")

            return rgba
            
        except Exception as e:
            print(f"⚠️ BiRefNet inference failed: {e}")
            import traceback
            traceback.print_exc()
            rgba = self._rembg_remove(image)
            self.last_alpha_quality = self._score_alpha_quality(rgba)
            print(f"   📊 Alpha quality: {self.last_alpha_quality}")
            return rgba
    
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
    
    def _score_alpha_quality(self, rgba: Image.Image) -> float:
        """
        Score how confident the cutout is, 0-100, from its alpha channel.

        A clean cutout has alpha pixels that are almost all fully opaque (255)
        or fully transparent (0). Ambiguous masks — cluttered scene, low contrast
        between subject and a dark/blurry background — leave a large band of
        mid-grey pixels (the model "isn't sure"). We measure the fraction of
        edge/foreground pixels that fall in that uncertain mid-band and invert it.

        Returns 100 for a crisp mask, lower as ambiguity rises. Returns 0 if the
        cutout is degenerate (almost nothing kept, or almost nothing removed).
        """
        try:
            alpha = np.asarray(rgba.split()[-1], dtype=np.uint8)
            total = alpha.size
            if total == 0:
                return 0.0

            # Foreground = anything not fully transparent.
            fg = alpha > 10
            fg_count = int(fg.sum())
            fg_frac = fg_count / total

            # Degenerate: removed everything, or removed nothing.
            if fg_frac < 0.01 or fg_frac > 0.99:
                return 0.0

            # Of the foreground pixels, how many sit in the ambiguous mid-band
            # (neither clearly object nor clearly transparent edge)?
            mid = fg & (alpha < 230) & (alpha > 40)
            mid_frac = int(mid.sum()) / max(fg_count, 1)

            # Empirically calibrated against u2netp output (which always leaves a
            # soft antialiased rim, so even clean cutouts run ~0.20-0.25 mid):
            #   clean product on plain bg     ~0.25 -> ~78  (pass, >=60)
            #   subject occluded / ghosting   ~0.45 -> ~46  (warn)
            #   low-contrast / cluttered scene ~0.70 -> ~16  (warn)
            # Anchor 0.25 -> 78 and slope so 0.45 -> ~46.
            score = max(0.0, 100.0 - ((mid_frac - 0.25) * 160.0) - 22.0)
            return round(min(100.0, score), 1)
        except Exception as e:
            print(f"⚠️ alpha quality scoring failed: {e}")
            return None

    def _rembg_remove(self, image: Image.Image) -> Image.Image:
        """Fallback using rembg library (u2netp — fast 4MB model, session cached)"""
        print("⚠️ Using rembg fallback (u2netp)...")
        from rembg import remove, new_session
        if self._rembg_session is None:
            print("⏳ Loading u2netp session (first call)...")
            self._rembg_session = new_session(model_name="u2netp", providers=["CPUExecutionProvider"])
            print("✅ u2netp session ready")
        return remove(image, session=self._rembg_session)
    
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
