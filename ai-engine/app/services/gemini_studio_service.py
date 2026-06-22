"""
Gemini Studio Service - Pro photo cleanup via Gemini 2.5 Flash Image
One-call pipeline: remove hand/arm + reconstruct hidden product area + white background.

Cost: ~$0.039/image (1290 output tokens @ $30/1M)
"""
import os
import io
import time
import base64
from PIL import Image

# Faithful identity prompt — no style drift, no invented features
CLEANUP_PROMPT = (
    "Remove any human hand, arm, fingers, or sleeve visible in this photo. "
    "Reconstruct any part of the product that was hidden behind the hand, "
    "faithfully matching the existing material, texture, color, and shape of the product. "
    "Place the product on a pure white background. "
    "CRITICAL — preserve the product's true identity: do NOT add, remove, or restyle any "
    "features (no cutaways, no added electronics, no color changes, no style changes). "
    "Do not invent details that aren't visible in the original photo."
)


class GeminiStudioService:
    def __init__(self):
        self._client = None
        self._available = None  # None = not yet checked

    def _configure_api(self):
        if self._available is not None:
            return self._available
        try:
            from dotenv import load_dotenv
            load_dotenv("../ai-lab/.env")
            load_dotenv()
        except Exception:
            pass

        key = os.environ.get("GEMINI_API_KEY", "")
        if not key or key.startswith("your_"):
            print("⚠️  GeminiStudioService: GEMINI_API_KEY not configured — Pro cleanup unavailable")
            self._available = False
            return False

        try:
            from google import genai
            self._client = genai.Client(api_key=key)
            self._available = True
            print("✅ GeminiStudioService ready (gemini-2.5-flash-image)")
            return True
        except Exception as e:
            print(f"⚠️  GeminiStudioService init failed: {e}")
            self._available = False
            return False

    @property
    def available(self) -> bool:
        if self._available is None:
            self._configure_api()
        return self._available

    def cleanup_product_photo(self, image_bytes: bytes, prompt: str = CLEANUP_PROMPT) -> dict:
        """
        Remove hand + reconstruct + white background in one Gemini call.
        Returns dict with image_data (base64 data URI), dimensions, processing_time_ms, provider.
        Raises RuntimeError on failure (caller should treat as 502).
        """
        if not self.available:
            raise RuntimeError("Gemini not configured")

        start = time.time()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        try:
            result = self._client.models.generate_content(
                model="gemini-2.5-flash-image",
                contents=[prompt, pil_image],
            )
        except Exception as e:
            raise RuntimeError(f"Gemini API error: {e}") from e

        # Extract image from response
        out_image = None
        for part in result.candidates[0].content.parts:
            if hasattr(part, "inline_data") and part.inline_data:
                raw = part.inline_data.data
                if isinstance(raw, str):
                    raw = base64.b64decode(raw)
                out_image = Image.open(io.BytesIO(raw)).convert("RGB")
                break

        if out_image is None:
            raise RuntimeError("Gemini returned no image in response")

        buf = io.BytesIO()
        out_image.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode()

        return {
            "status": "success",
            "image_data": f"data:image/png;base64,{b64}",
            "dimensions": list(out_image.size),
            "processing_time_ms": int((time.time() - start) * 1000),
            "provider": "gemini-2.5-flash-image",
        }


# Singleton
gemini_studio_service = GeminiStudioService()
