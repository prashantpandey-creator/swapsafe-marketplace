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
        # Primary and Fallback queries
        queries = [
            f"{product_name} white background product online shopping",
            f"{product_name} high quality official stock image",
            f"{product_name} product amazon india"
        ]
        
        for idx, query in enumerate(queries):
            print(f"🔎 [Try {idx+1}] Searching for stock image: '{query}'")
            
            try:
                # Add random delay to avoid bot detection
                import time
                if idx > 0: time.sleep(1)
                
                with DDGS() as ddgs:
                    results = list(ddgs.images(
                        query,
                        region="wt-wt",
                        safesearch="on",
                        size="Large",
                        max_results=5
                    ))
                
                if not results:
                    print(f"   ⚠️ No results for query {idx+1}. Trying next...")
                    continue
                    
                # Try to download the first valid image
                for result in results:
                    image_url = result.get("image")
                    if not image_url:
                        continue
                        
                    print(f"   ⬇️ Downloading: {image_url}")
                    try:
                        # Use a more realistic User-Agent
                        headers = {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
                        }
                        response = requests.get(image_url, timeout=7, headers=headers)
                        if response.status_code == 200:
                            image_data = base64.b64encode(response.content).decode('utf-8')
                            return {
                                "source": "stock_search",
                                "query_used": query,
                                "image_url": image_url,
                                "image_data": f"data:image/jpeg;base64,{image_data}"
                            }
                    except Exception as download_error:
                        print(f"      ⚠️ Download failed: {download_error}")
                        continue
                
            except Exception as search_error:
                print(f"   ❌ Search attempt {idx+1} failed: {search_error}")
                continue
        
        print("❌ Final: No stock images found after all attempts.")
        return None

    def search_web(self, query: str) -> str:
        """
        Performs a text search and returns a summary string of top results.
        Useful for price checking.
        """
        print(f"🔎 Web Search: '{query}'")
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, region="in-en", max_results=4))
                
            if not results:
                return ""
            
            # Combine snippets
            context = "\n".join([f"- {r.get('title', '')}: {r.get('body', '')}" for r in results])
            return context
            
        except Exception as e:
            print(f"❌ Web search failed: {e}")
            return ""

# Singleton
stock_service = StockImageService()
