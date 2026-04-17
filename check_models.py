import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv("ai-lab/.env")
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("KEY MISSING")
else:
    genai.configure(api_key=api_key)
    print("Listing Models...")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
