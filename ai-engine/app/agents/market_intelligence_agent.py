
import os
import re
import json
import logging
from groq import Groq
try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS
    
from googlesearch import search as google_search

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MarketIntelligenceAgent:
    """
    Agent responsible for finding market prices and stock availability.
    Implements a waterfall fallback strategy:
    1. DuckDuckGo Search (Primary)
    2. Google Search (Secondary)
    3. Groq Llama Knowledge (Tertiary - NEW)
    4. Gemini Internal Knowledge (Quaternary)
    """

    def __init__(self):
        self.ddgs = DDGS()
        
        # Groq Init
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.groq_client = None
        if self.groq_key:
            try:
                self.groq_client = Groq(api_key=self.groq_key)
                logger.info("✅ MarketIntelligenceAgent: Groq Initialized")
            except Exception as e:
                logger.warning(f"⚠️ MarketAgent: Groq Init Failed: {e}")
        
        logger.info("✅ MarketIntelligenceAgent Initialized")

    def find_price_and_stock(self, product_name: str, condition: str = "good") -> dict:
        """
        Main entry point to find price intelligence.
        """
        logger.info(f"💰 Market Agent: Hunting price for '{product_name}' ({condition})")
        
        # 1. Try DuckDuckGo
        search_results = self._search_duckduckgo(product_name)
        
        # 2. Fallback to Google
        if not search_results:
             search_results = self._search_google(product_name)
        
        # 3. Fallback to Groq Knowledge (Faster/Free)
        if not search_results:
            search_results = self._ask_groq_knowledge(product_name, condition)
            if search_results:
                return {
                    "source": "groq_knowledge",
                    "context": search_results
                }

        # 4. Fallback to Gemini Internal Knowledge
        if not search_results:
            search_results = self._ask_gemini_knowledge(product_name, condition)
            if search_results:
                return {
                    "source": "gemini_knowledge",
                    "context": search_results
                }

        # 5. If all fail
        if not search_results:
            logger.warning("❌ Market Agent: No search results found from any provider.")
            return {
                "source": "failed",
                "error": "No market data found"
            }
            
        return {
            "source": "web_search",
            "context": search_results
        }

    def _ask_groq_knowledge(self, product_name: str, condition: str) -> str:
        """
        Tertiary fallback: Ask Groq (Llama 3) based on its training data.
        """
        if not self.groq_client:
            return None
            
        logger.info(f"   🧠 Asking Groq Knowledge: '{product_name}'")
        try:
            prompt = f"""
            You are a market expert. user is selling: "{product_name}" ({condition} condition) in India.
            Since web search failed, provide your best general knowledge estimate.
            
            Return a short text summarizing:
            1. Approximate new price in INR.
            2. Approximate used price for '{condition}' condition.
            3. Disclaimer that this is an AI estimate.
            """
            
            completion = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a helpful market assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            response_text = completion.choices[0].message.content
            logger.info(f"   ✅ Groq Retrieval Success: {len(response_text)} chars")
            return response_text
            
        except Exception as e:
            logger.error(f"   ❌ Groq Knowledge Failed: {e}")
            return None

    def _ask_gemini_knowledge(self, product_name: str, condition: str) -> str:
        """
        Quaternary fallback: Ask Gemini LLM directly based on its training data.
        """
        try:
            from google import genai
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                logger.warning("   ⚠️ GEMINI_API_KEY missing for knowledge fallback")
                return None
            
            client = genai.Client(api_key=api_key)
            logger.info(f"   🧠 Asking Gemini Knowledge: '{product_name}'")
            
            prompt = f"""
            You are a market expert. user is selling: "{product_name}" ({condition} condition) in India.
            Since web search failed, provide your best general knowledge estimate.
            
            Return a short text summarizing:
            1. Approximate new price in INR.
            2. Approximate used price for '{condition}' condition.
            3. Disclaimer that this is an AI estimate.
            """
            
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            
            if response and response.text:
                logger.info(f"   ✅ Gemini Retrieval Success: {len(response.text)} chars")
                return response.text
            else:
                logger.warning(f"   ⚠️ Gemini returned empty response. Response obj: {response}")
                return None
            
        except Exception as e:
            logger.error(f"   ❌ Gemini Knowledge Failed: {e}")
            return None

    def _search_duckduckgo(self, query: str) -> str:
        """
        Primary search method using DuckDuckGo.
        """
        try:
            logger.info(f"   🦆 DDGS Search: '{query} price in India'")
            results = list(self.ddgs.text(f"{query} price in India", region="in-en", max_results=5))
            
            if not results:
                logger.warning("   ⚠️ DDGS returned no results.")
                return None
                
            context = "\\n".join([f"- {r.get('title', '')}: {r.get('body', '')}" for r in results])
            return context
            
        except Exception as e:
            logger.error(f"   ❌ DDGS Failed: {e}")
            return None

    def _search_google(self, query: str) -> str:
        """
        Secondary search method using Google Search (unofficial).
        """
        try:
            logger.info(f"   G Google Search: '{query} price in India'")
            # googlesearch-python returns generators
            results = []
            for j in google_search(f"{query} price in India", num_results=5, advanced=True):
                results.append(f"- {j.title}: {j.description}")
            
            if not results:
                logger.warning("   ⚠️ Google returned no results.")
                return None
                
            return "\\n".join(results)
            
        except Exception as e:
            logger.error(f"   ❌ Google Search Failed: {e}")
            return None
