
import os
import logging
from PIL import Image
from .visual_analysis_agent import VisualAnalysisAgent
from .market_intelligence_agent import MarketIntelligenceAgent

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ListingGenerator:
    """
    Supervisor Agent that orchestrates the QuickSell flow.
    1. Visual Agent -> Identifies Product
    2. Market Agent -> Finds Price/Stock
    3. Synthesizes Final Listing
    """

    def __init__(self):
        self.visual_agent = VisualAnalysisAgent()
        self.market_agent = MarketIntelligenceAgent()
        logger.info("✅ ListingGenerator Initialized")

    def generate_listing(self, image: Image.Image) -> dict:
        """
        Full flow: Image -> Listing (with Price & Metadata)
        """
        logger.info("🚀 Supervisor: Starting Listing Generation...")

        # 1. Visual Analysis
        visual_data = self.visual_agent.analyze(image)
        
        if "error" in visual_data:
            logger.error(f"❌ Supervisor: Visual Analysis Failed ({visual_data['error']})")
            return {"error": "Could not analyze image", "details": visual_data}

        product_name = f"{visual_data.get('brand', '')} {visual_data.get('model', '')}".strip() or visual_data.get('title', '')
        condition = visual_data.get('condition', 'good')

        logger.info(f"   📋 Identified: '{product_name}' ({condition})")

        # 2. Market Intelligence (Price)
        market_data = self.market_agent.find_price_and_stock(product_name, condition)
        
        # Extract price as a number, not an object
        price_info = self._extract_price(market_data, condition)
        used_price_value = price_info.get("used_price") if isinstance(price_info, dict) else None
        
        # 3. Synthesize Result
        final_listing = {
            "title": visual_data.get('title'),
            "category": visual_data.get('category'),
            "brand": visual_data.get('brand'),
            "model": visual_data.get('model'),
            "condition": condition,
            "condition_report": visual_data.get('condition_report'),
            "keywords": visual_data.get('keywords', []),
            "detected_view": visual_data.get('detected_view'),
            "description": visual_data.get('description'),
            
            # Market Data
            "price_estimate": used_price_value,
            "market_context": market_data
        }

        return final_listing

    def refine_listing(self, product_name: str, condition: str = "good") -> dict:
        """
        Refine listing based on text input (e.g. user edits title).
        Returns structured price data.
        """
        logger.info(f"🔄 Supervisor: Refining listing for '{product_name}'...")
        market_data = self.market_agent.find_price_and_stock(product_name, condition)
        
        # Extract structured price from market context
        price_info = self._extract_price(market_data, condition, product_name)
        
        return {
            "source": market_data.get("source", "unknown"),
            "context": market_data.get("context", ""),
            "used_price": price_info.get("used_price"),
            "current_market_price": price_info.get("new_price"),
            "marginal_improvement": price_info.get("marginal"),
            "confidence": price_info.get("confidence", "low")
        }

    def _extract_price(self, market_data: dict, condition: str, product_name: str = "") -> dict:
        """
        Extract structured price from market data context using Groq LLM.
        """
        context = market_data.get("context", "")
        if not context:
            return {"used_price": None, "new_price": None, "marginal": None, "confidence": "none"}

        # Try Groq for intelligent price extraction
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            try:
                from groq import Groq
                client = Groq(api_key=groq_key)
                
                prompt = f"""Extract price information from this market data for "{product_name}" in {condition} condition.

Market Data:
{context[:1500]}

Return a JSON object with:
- "new_price": estimated new/retail price in INR (integer, no commas)
- "used_price": estimated used price for {condition} condition in INR (integer)
- "marginal": brief 1-line note about the price (e.g. "Good deal" or "Below market")
- "confidence": "high", "medium", or "low"

If you cannot determine a price, estimate based on the product type.
Return ONLY valid JSON, no markdown."""

                completion = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": "You are a pricing expert. Always return valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.1,
                    max_tokens=200,
                    response_format={"type": "json_object"}
                )
                
                import json
                result = json.loads(completion.choices[0].message.content)
                logger.info(f"   💰 Price Extracted: ₹{result.get('used_price')} (new: ₹{result.get('new_price')})")
                return result
                
            except Exception as e:
                logger.warning(f"   ⚠️ Groq price extraction failed: {e}")

        # Fallback: regex-based heuristic
        return self._regex_price_extract(context, condition)

    def _regex_price_extract(self, context: str, condition: str) -> dict:
        """Simple regex fallback for price extraction."""
        import re
        prices = re.findall(r'₹\s*([\d,]+)', context)
        if not prices:
            prices = re.findall(r'Rs\.?\s*([\d,]+)', context)
        if not prices:
            prices = re.findall(r'INR\s*([\d,]+)', context)

        if prices:
            numeric_prices = [int(p.replace(',', '')) for p in prices if int(p.replace(',', '')) > 50]
            if numeric_prices:
                new_price = max(numeric_prices)
                condition_multipliers = {
                    'new': 0.95, 'like-new': 0.80, 'good': 0.65, 'fair': 0.45, 'poor': 0.25
                }
                mult = condition_multipliers.get(condition, 0.65)
                used_price = int(new_price * mult)
                return {
                    "new_price": new_price,
                    "used_price": used_price,
                    "marginal": "Estimated from web data",
                    "confidence": "low"
                }

        return {"used_price": None, "new_price": None, "marginal": None, "confidence": "none"}

