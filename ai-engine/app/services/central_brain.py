import os
import json
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CentralBrain")

class CentralBrainService:
    @staticmethod
    def think(user_input: str, image_file: bytes = None) -> dict:
        """
        The Brain: Routes intent using Google Gemini 1.5 Flash (Cloud).
        Supports Multimodal Input (Text + Image).
        """
        api_key = os.getenv("GEMINI_API_KEY")
        
        if not api_key:
            return {"skill": "error", "error": "Gemini Key Missing", "hint": "Add GEMINI_API_KEY to .env"}

        try:
            import google.generativeai as genai
            from PIL import Image
            import io
            
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            system_prompt = """
            You are the High-Level Reasoning Engine.
            Goal: Translate user intent (+ optional image context) into a `VisualPlan`.
            
            NO PIXEL MANIPULATION. OUTPUT JSON ONLY.
            
            OUTPUT SCHEMA: { 
                "intent": "...", 
                "visual_plan": { 
                    "scene_analysis": "...", 
                    "sdxl_tokens": {
                        "positive": "best quality, master piece, (tags, separated, by, commas)...",
                        "negative": "low quality, bad anatomy, (negative, tags)..."
                    },
                    "refining_strength": 0.5, # 0.4 (preserved) to 0.8 (reconstructed)
                    "mask_subject": "..."
                } 
            }
            
            RULES:
            1. Analyze product image quality. If edges are blurry/missing or hands/objects obstruct it, set 'refining_strength' to 0.7-0.8.
            2. 'sdxl_tokens' must be technical tags, not sentences. Include specific product materials (e.g., 'brushed metal', 'glossy plastic').
            3. Always emphasize 'pure white background' in positive tokens if requested.
            4. 'mask_subject' must specify the exact area to be refined/preserved.
            """
            
            content = [f"{system_prompt}\nUser Input: {user_input}\nJSON Output:"]
            
            if image_file:
                # Convert bytes to PIL for Gemini
                img = Image.open(io.BytesIO(image_file))
                content.append(img)
                content[0] += "\n[IMAGE ATTACHED]"

            # Generate
            response = model.generate_content(content)

            raw_text = response.text
            
            # Clean Markdown Code Blocks if present (Gemini loves ```json)
            raw_text = raw_text.replace("```json", "").replace("```", "").strip()
            
            # Parse
            thought_data = json.loads(raw_text)
            logger.info(f"Gemini Thought: {thought_data}")
            return thought_data

        except Exception as e:
            logger.error(f"Brain Freeze: {e}")
            return {
                "skill": "error", 
                "error": "Brain Malfunction", 
                "hint": "Gemini API Error",
                "details": str(e)
            }
