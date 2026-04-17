import requests
import json
import time

# Config
URL = "http://localhost:11434/brain/edit/sdxl" # Wait, local uvicorn is on 8000
URL = "http://localhost:8000/brain/edit/sdxl"
IMAGE_PATH = "stock_jbl_soundbar.jpg"
PROMPT = "create a showcase like image of this product with white background like in online marketplaces"

def test_showcase():
    print(f"🧪 Testing SHOWCASE Pipeline...")
    print(f"   Input: {IMAGE_PATH}")
    print(f"   Prompt: '{PROMPT}'")
    
    start_time = time.time()
    
    try:
        files = {"image": open(IMAGE_PATH, "rb")}
        data = {"user_input": PROMPT}
        
        print("   📤 Uploading to Brain (Gemini 1.5 Flash)...")
        response = requests.post(URL, files=files, data=data)
        
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Success in {elapsed:.2f}s")
            print(f"\n🔍 RAW RESPONSE: {json.dumps(result, indent=2)}")
            
            # Print Transparency Data
            brain_thought = result.get("brain_thought", {})
            plan = brain_thought.get("visual_plan", {})
            print("\n🧠 CLOUD BRAIN TRACE (Gemini):")
            print(f"   Intent: {brain_thought.get('intent')}")
            print(f"   Scene: '{plan.get('scene')}'")
            print(f"   Prompt: '{plan.get('technical_prompt')}'")
            print(f"   Mask: '{plan.get('mask_subject')}'")
            
            print(f"\n🖼️ Result Path: {result.get('result_path')}")
            
        else:
            print(f"\n❌ Error {response.status_code}: {response.text}")

    except Exception as e:
        print(f"\n❌ Crash: {e}")

if __name__ == "__main__":
    test_showcase()
