"""
Gemini Studio Service - Pro photo cleanup via Gemini 2.5 Flash Image
Pipeline: analyze → inpaint hand only → rembg cutout → upscale

  1. Vision analysis (cheap, ~$0.0004) — describes product shape + arm coverage
  2. Inpaint (expensive, ~$0.039) — erases ONLY the hand/arm pixels, nothing else
  3. rembg background removal (free) — traces the real product edges
  4. Pillow upscale (free, done in router) — 2x LANCZOS

Gemini never regenerates the product body — it only fills where the hand was.
rembg never hallucinates shape — it traces the actual edges after the hand is gone.
"""
import os
import io
import time
import base64
import json
from PIL import Image

ANALYSIS_PROMPT = (
    "Describe this product for use as a reference during hand-removal editing. "
    "Reply with ONLY a JSON object, no markdown. Format: "
    '{"product": "...", "shape_outline": "...", "primary_color": "...", '
    '"material_texture": "...", "arm_coverage": "..."} '
    "For shape_outline: describe the EXACT silhouette — e.g. 'smooth continuous curve with "
    "no notch or cutaway on either side' or 'rectangular slab with rounded corners'. "
    "For arm_coverage: describe exactly what the hand/arm/sleeve covers and what is "
    "visible behind or around it — e.g. 'left arm in dark sleeve covers upper left of body "
    "from neck joint to waist; behind it is more of the same spruce top surface'. "
    "Do not invent features that are not visible."
)

INPAINT_PROMPT_TEMPLATE = (
    "A human hand and arm are holding the product in this photo. "
    "Erase the ENTIRE arm — from shoulder to fingertips — including ALL skin, fabric, "
    "sleeve, clothing, and wristwatch. Replace those pixels with what is behind them: "
    "continue the product surface and/or the original background seamlessly. "
    "\n\nDO NOT touch anything else. Every non-arm pixel must stay IDENTICAL. "
    "The product outline and silhouette must remain EXACTLY as they are in the original — "
    "no reshaping, no added features, no removed features."
    "\n\nPRODUCT REFERENCE (from pre-analysis — treat as ground truth):\n{description}\n\n"
    "RULES:\n"
    "- You are ONLY erasing the arm. You are NOT re-rendering the product.\n"
    "- Fill the erased area by extending the adjacent product texture or background.\n"
    "- Do NOT reshape, resize, recolor, or add/remove any product feature.\n"
    "- Do NOT change the background (walls, floor, sky — keep them as-is)."
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

    def _analyze_product(self, pil_image: "Image.Image") -> str:
        """
        Pass 1: cheap vision call to describe the product's exact shape and features.
        Returns a plain-English description string to inject into the cleanup prompt.
        Falls back to empty string on any failure — cleanup still runs, just without the anchor.
        """
        try:
            r = self._client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[ANALYSIS_PROMPT, pil_image],
            )
            raw = r.text.strip()
            # Strip markdown fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            parsed = json.loads(raw)
            # Flatten to a readable sentence Gemini can follow in the next prompt
            parts = []
            for k, v in parsed.items():
                if v and str(v).strip():
                    parts.append(f"{k.replace('_', ' ')}: {v}")
            description = "; ".join(parts)
            print(f"   🔍 Product analysis: {description[:120]}...")
            return description
        except Exception as e:
            print(f"   ⚠️  Product analysis failed ({e}), proceeding without anchor")
            return ""

    def _extract_image(self, result) -> "Image.Image":
        for part in result.candidates[0].content.parts:
            if hasattr(part, "inline_data") and part.inline_data:
                raw = part.inline_data.data
                if isinstance(raw, str):
                    raw = base64.b64decode(raw)
                return Image.open(io.BytesIO(raw)).convert("RGB")
        return None

    def cleanup_product_photo(self, image_bytes: bytes) -> dict:
        """
        Smart two-pass cleanup:
          Pass 1 (vision, ~$0.0004): analyze product shape + hand location
          Pass 2 (inpaint, ~$0.039): erase ONLY the hand, keep everything else pixel-perfect
        Then rembg handles background removal — no Gemini involvement in the cutout.
        """
        if not self.available:
            raise RuntimeError("Gemini not configured")

        start = time.time()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Pass 1 — describe the product so Pass 2 knows what's behind the hand
        description = self._analyze_product(pil_image)
        prompt = INPAINT_PROMPT_TEMPLATE.format(
            description=description or "no pre-analysis available — be conservative, only erase the hand"
        )

        # Pass 2 — erase ONLY the hand, keep original background and product intact
        try:
            result = self._client.models.generate_content(
                model="gemini-2.5-flash-image",
                contents=[prompt, pil_image],
            )
        except Exception as e:
            raise RuntimeError(f"Gemini API error: {e}") from e

        inpainted = self._extract_image(result)
        if inpainted is None:
            raise RuntimeError("Gemini returned no image in response")

        inpaint_ms = int((time.time() - start) * 1000)

        # Pad the inpainted image so rembg doesn't clip edges touching the frame
        pad = 40
        w, h = inpainted.size
        padded = Image.new("RGB", (w + pad * 2, h + pad * 2), (255, 255, 255))
        padded.paste(inpainted, (pad, pad))

        # Pass 3 — rembg background removal on the clean (hand-free) photo
        try:
            from app.services.birefnet_service import birefnet_service
            rgba = birefnet_service.remove_background(padded)
            alpha_quality = birefnet_service.last_alpha_quality

            # Crop to tight bounding box of the product, then center on white canvas
            bbox = rgba.getbbox()
            if bbox:
                cropped = rgba.crop(bbox)
                cw, ch = cropped.size
                # Add 5% breathing room on each side
                margin = int(max(cw, ch) * 0.05)
                canvas_w = cw + margin * 2
                canvas_h = ch + margin * 2
                white = Image.new("RGB", (canvas_w, canvas_h), (255, 255, 255))
                white.paste(cropped, (margin, margin), cropped)
                final = white
            else:
                white = Image.new("RGB", rgba.size, (255, 255, 255))
                white.paste(rgba, (0, 0), rgba)
                final = white
            bg_method = "rembg"
        except Exception as e:
            print(f"   ⚠️  rembg failed ({e}), returning inpainted image as-is")
            final = inpainted
            alpha_quality = None
            bg_method = "none"

        buf = io.BytesIO()
        final.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode()

        return {
            "status": "success",
            "image_data": f"data:image/png;base64,{b64}",
            "dimensions": list(final.size),
            "processing_time_ms": int((time.time() - start) * 1000),
            "inpaint_ms": inpaint_ms,
            "provider": "gemini-2.5-flash-image",
            "bg_removal": bg_method,
            "alpha_quality": alpha_quality,
        }


# Singleton
gemini_studio_service = GeminiStudioService()
