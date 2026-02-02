from duckduckgo_search import DDGS
import requests
import base64
import random

class StockImageService:
    """
    Fetches professional product stock images from the web.
    """
    
    def find_product_image(self, product_name: str) -> dict:
        """
        Searches for a high-quality product image with a white background.
        Returns dict with image_url and base64 data.
        """
        query = f"{product_name} white background product photography studio"
        print(f"🔎 Searching for stock image: '{query}'")
        
        try:
            with DDGS() as ddgs:
                # Get up to 5 results to find a valid one
                results = list(ddgs.images(
                    query,
                    region="wt-wt",
                    safesearch="on",
                    size="Large",
                    max_results=5
                ))
            
            if not results:
                print("⚠️ No stock images found.")
                return None
                
            # Try to download the first valid image
            for result in results:
                image_url = result.get("image")
                if not image_url:
                    continue
                    
                print(f"   ⬇️ Downloading: {image_url}")
                try:
                    # Download image (with timeout)
                    response = requests.get(image_url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
                    if response.status_code == 200:
                        image_data = base64.b64encode(response.content).decode('utf-8')
                        return {
                            "source": "stock_search",
                            "image_url": image_url,
                            "image_data": f"data:image/jpeg;base64,{image_data}"
                        }
                except Exception as e:
                    print(f"      ⚠️ Failed to download {image_url}: {e}")
                    continue
            
            return None

        except Exception as e:
            print(f"❌ Stock search failed: {e}")
            return None

# Singleton
stock_service = StockImageService()
