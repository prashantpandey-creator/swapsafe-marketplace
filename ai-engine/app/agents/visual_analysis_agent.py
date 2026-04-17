
import os
import io
import json
import re
import logging
import base64
from PIL import Image
from google import genai
from google.genai import types
from groq import Groq

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VisualAnalysisAgent:
    """
    Agent responsible for "seeing" the product.
    Uses Gemini Flash (Primary) or Groq Llama Vision (Fallback) to extract data.
    """

    def __init__(self):
        # Gemini Init
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.gemini_client = None
        if self.gemini_key:
            try:
                self.gemini_client = genai.Client(api_key=self.gemini_key)
                logger.info("✅ VisualAnalysisAgent: Gemini Initialized")
            except Exception as e:
                logger.warning(f"⚠️ VisualAnalysisAgent: Gemini Init Failed: {e}")

        # Groq Init
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.groq_client = None
        if self.groq_key:
            try:
                self.groq_client = Groq(api_key=self.groq_key)
                logger.info("✅ VisualAnalysisAgent: Groq Initialized")
            except Exception as e:
                 logger.warning(f"⚠️ VisualAnalysisAgent: Groq Init Failed: {e}")

    def analyze(self, image: Image.Image) -> dict:
        """
        Analyze the image and return structured product data.
        Tries Gemini first, falls back to Groq.
        """
        if not self.gemini_client and not self.groq_client:
            return {"error": "All Visual Agents disabled (No API Keys)"}

        prompt = self._get_analysis_prompt()
        
        # 1. Try Gemini
        if self.gemini_client:
            logger.info("👁️ Visual Agent: Trying Gemini 2.0 Flash...")
            try:
                # Prepare image for Gemini
                img_byte_arr = io.BytesIO()
                image.save(img_byte_arr, format='JPEG')
                img_bytes = img_byte_arr.getvalue()

                response = self.gemini_client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=[
                        types.Content(
                            role="user",
                            parts=[
                                types.Part.from_text(text=prompt),
                                types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
                            ]
                        )
                    ]
                )
                return self._parse_json(response.text)

            except Exception as e:
                logger.warning(f"⚠️ Gemini Failed ({e}). Switching to Fallback...")
        
        # 2. Try Groq (Fallback)
        if self.groq_client:
            logger.info("👁️ Visual Agent: Trying Groq Llama Vision...")
            try:
                return self._analyze_with_groq(image, prompt)
            except Exception as e:
                logger.error(f"❌ Groq Failed: {e}")
                return {"error": f"Groq Failed: {str(e)}"}

        return {"error": "Visual Analysis failed on all providers"}

    def _analyze_with_groq(self, image: Image.Image, prompt: str) -> dict:
        """
        Execute analysis using Groq's Llama 3.2 Vision model.
        """
        # Prepare Base64 Image
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        img_url = f"data:image/jpeg;base64,{img_str}"

        completion = self.groq_client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt + "\n\nIMPORTANT: Respond with pure JSON only. No markdown formatting."},
                        {"type": "image_url", "image_url": {"url": img_url}}
                    ]
                }
            ],
            temperature=0.1,
            max_tokens=1024,
            response_format={"type": "json_object"}
        )
        
        content = completion.choices[0].message.content
        return self._parse_json(content)

    def _get_analysis_prompt(self) -> str:
        return """
        Analyze this product image for a marketplace listing.
        Return a JSON object with:
        - title: Short, catchy title (Brand + Model + Key Feature).
        - category: [electronics, fashion, home, sports, books, other].
        - brand: Brand name (or null).
        - model: Model name/number (or null).
        - condition: [new, like-new, good, fair, poor].
        - condition_report: 1 sentence describing wear/defects or pristine state.
        - keywords: [list, of, 5, keywords].
        - detected_color: dominant color.
        
        Strict JSON only.
        """

    def _parse_json(self, text: str) -> dict:
        try:
            # Clean markdown code blocks
            text = re.sub(r'```json\n|```', '', text).strip()
            return json.loads(text)
        except json.JSONDecodeError:
            logger.error(f"❌ Visual Agent: JSON Parsing failed. Raw: {text[:100]}...")
            return {"error": "Invalid JSON response"}
