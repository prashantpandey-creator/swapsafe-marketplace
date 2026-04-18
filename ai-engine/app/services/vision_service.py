from PIL import Image
import io

try:
    import torch
    from app.config import DeviceConfig
except ImportError:
    torch = None
    # Mock DeviceConfig if missing
    class DeviceConfig:
        @staticmethod
        def get_device(): return "cpu"

class VisionService:
    def __init__(self):
        self.device = DeviceConfig.get_device()
        self.model_id = "CIDAS/clipseg-rd64-refined"
        self.processor = None
        self.model = None

    def load_model(self):
        if self.model:
            return
        
        if not torch:
            print("⚠️ VisionService: No torch available. Skipping model load.")
            return

        print(f"👁️ Loading CLIPSeg ({self.model_id})...")
        try:
            from transformers import CLIPSegProcessor, CLIPSegForImageSegmentation
            self.processor = CLIPSegProcessor.from_pretrained(self.model_id)
            self.model = CLIPSegForImageSegmentation.from_pretrained(self.model_id).to(self.device)
            print("✅ CLIPSeg Loaded.")
        except Exception as e:
            print(f"❌ Failed to load CLIPSeg: {e}")
            raise e

    def get_mask(self, image: Image.Image, text: str) -> Image.Image:
        """
        Generates a binary mask for the given text description.
        """
        self.load_model()
        
        try:
            # Resize image for CLIPSeg (it likes squares, but handles others)
            # We keep it original size processing and then resize mask back?
            # CLIPSeg internal resolution is usually 352x352
            
            inputs = self.processor(
                text=[text], 
                images=[image], 
                padding="max_length", 
                return_tensors="pt"
            ).to(self.device)

            with torch.no_grad():
                outputs = self.model(**inputs)
            
            # Get prediction
            preds = outputs.logits.unsqueeze(1)
            
            # Normalize and threshold
            # standard sigmoid
            preds = torch.sigmoid(preds)[0][0]
            
            # Convert to PIL Image
            mask_array = (preds > 0.4).float().cpu().numpy() * 255 # Threshold 0.4 usually good
            mask_image = Image.fromarray(mask_array.astype("uint8"))
            
            # Resize mask back to original image size
            mask_image = mask_image.resize(image.size, Image.NEAREST)
            
            return mask_image
            
        except Exception as e:
            print(f"👁️ Mask Gen Error: {e}")
            # Fallback to empty mask (safe fail)
            return Image.new("L", image.size, 0)

    def relight_product(self, input_image: Image.Image, prompt: str, reference_images: list = None, debug_prefix: str = None) -> Image.Image:
        """
        Relights the product image based on the prompt.
        Currently a placeholder to prevent 500 errors.
        """
        print(f"💡 Relighting product with prompt: {prompt}")
        if reference_images:
            print(f"   Using {len(reference_images)} reference images")
            
        # TODO: Implement actual IC-Light / Diffusion relighting here
        # For now, return original image to unblock the UI
        return input_image

vision_service = VisionService()
