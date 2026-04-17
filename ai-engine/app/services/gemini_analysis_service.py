"""
Gemini Vision Analysis Service
Uses google-genai package for Gemini Flash vision to analyze product images.
"""
from google import genai
from google.genai import types
from PIL import Image
import os
import json
import re
import io

class GeminiAnalysisService:
    """
    Uses Gemini Flash vision to analyze product images.
    Returns JSON metadata about the product.
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
            print("✅ Gemini Flash Analysis Service Configured")
        else:
            print("⚠️ No GEMINI_API_KEY found for Analysis Service")
    
    def analyze_product(self, image: Image.Image) -> dict:
        """
        Analyze product image and return metadata.
        """
        if not self.client:
             # Try to re-configure (in case key was added later)
            self._configure_api()
            if not self.client:
                print("❌ Gemini not configured.")
                return {"error": "Gemini API Key missing"}
        
        print("🤖 Asking Gemini Flash to analyze product...")
        
        # Prepare image
        img_rgb = image.convert("RGB") if image.mode != "RGB" else image
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        img_rgb.save(img_bytes, format="PNG")
        img_bytes = img_bytes.getvalue()
        
        prompt = """Analyze this image and identify the main product for sale.
Return a JSON object with the following fields:
- title: A short, catchy title for the listing (3-6 words).
- category: One of [electronics, fashion, home, sports, books, other].
- brand: The brand name if visible, or null.
- model: The model name/number if visible, or null.
- condition: Estimated condition [new, like-new, good, fair] based on visual appearance.
- condition_report: MANDATORY. A brief 1-sentence explanation of the condition (e.g."Visible scratches on screen", "Pristine packaging", "Signs of heavy wear").
- detected_view: The angle/view of the product (e.g. "front view", "side profile", "top down", "isometric").
- description: A short description highlighting key features (1-2 sentences).
- keywords: A list of 3-5 relevant keywords.

If the image is not a product or valid listing item, return {"error": "Not a product"}.

ONLY return the JSON, no other text."""
        
        try:
            # Step 1: Visual Analysis
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
            print(f"   📋 Visual Analysis: {result_text[:100]}...")
            
            # Extract JSON
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result_text = json_match.group()
            
            data = json.loads(result_text)
            
            # Step 2: Advanced Price Intelligence (Disabled for Speed - Triggered via /refine_listing)
            # if 'brand' in data and data.get('brand') and 'model' in data and data.get('model'):
            #     price_context = self.calculate_price_context(
            #         product_name=f"{data['brand']} {data['model']}",
            #         condition=data.get('condition', 'good'),
            #         condition_report=data.get('condition_report', 'normal wear')
            #     )
            #     
            #     if price_context:
            #         data['price_estimate'] = price_context.get('used_price')
            #         data['market_price_context'] = {
            #             "new_price": price_context.get('current_market_price'),
            #             "listing_price": price_context.get('used_price'),
            #             "marginal_gain": price_context.get('marginal_improvement')
            #         }

            # Fallback/Cleanup Price Parsing
            if 'price_estimate' in data and data['price_estimate']:
                p_val = str(data['price_estimate']).replace(',', '') # Fix "5,000"
                nums = re.findall(r'\d+', p_val)
                if nums:
                    data['price_estimate'] = int(nums[0])
            
            return data
            
        except Exception as e:
            print(f"   ❌ Analysis Error: {e}")
            return {"error": str(e)}

    def calculate_price_context(self, product_name: str, condition: str, condition_report: str) -> dict:
        """
        Synthesizes price based on Market Search + Condition.
        """
        try:
            from .stock_service import stock_service
            
            query = f"{product_name} price in India"
            print(f"   💰 Checking Current Market Price: {query}")
            search_context = stock_service.search_web(query)
            
            if not search_context:
                return None
                
            # Ask Gemini to estimate price based on search context + condition
            price_prompt = f"""
            Product: {product_name}
            Condition: {condition}
            Condition details: {condition_report}
            
            Search Results for Current Market Price:
            {search_context}
            
            Task:
            1. Identify the 'current_market_price' (new/retail price in INR) from the search results.
            2. Estimate a fair 'used_price' (in INR) for this specific condition.
            3. Calculate 'marginal_improvement': How much more could they get if it was in 'Like New' condition? (e.g. 2000).
            
            Return JSON: {{ "current_market_price": (int), "used_price": (int), "marginal_improvement": (int) }}
            Only JSON.
            """
            
            price_resp = self.client.models.generate_content(
                model="gemini-2.0-flash",
                contents=price_prompt
            )
            price_json_match = re.search(r'\{.*\}', price_resp.text, re.DOTALL)
            if price_json_match:
                price_data = json.loads(price_json_match.group())
                print(f"      💵 Price Intel: New={price_data.get('current_market_price')}, Used={price_data.get('used_price')}")
                return price_data
                
        except Exception as pe:
            print(f"      ⚠️ Price refinement failed: {pe}")
        
        return None
            


# Singleton
gemini_analysis_service = GeminiAnalysisService()
