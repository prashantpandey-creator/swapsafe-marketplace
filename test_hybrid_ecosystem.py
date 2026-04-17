import requests
import os

def test_hybrid():
    print("🧪 Testing SEMANTIC High-Fidelity Ecosystem...")
    
    # Path to test image
    img_path = "/Users/badenath/Downloads/test/soundbar 3.jpg"
    
    if not os.path.exists(img_path):
        print(f"❌ Test image missing: {img_path}")
        return

    url = "http://localhost:8000/brain/edit/sdxl"
    
    # User request that implies multi-object scenes
    data = {
        "user_input": "create a professional showcase for this black soundbar and the subwoofer. ensure both are crisp and isolated on a white background."
    }
    
    files = {
        "image": open(img_path, "rb")
    }
    
    print(f"📤 Uploading to Brain (Gemini 2.5 Flash)...")
    try:
        response = requests.post(url, data=data, files=files)
        response.raise_for_status()
        result = response.json()
        
        print("\n✅ Brain Output:")
        parsed = result.get("brain_parsed", {})
        print(f"   Target: {parsed.get('target')}")
        print(f"   Strength: {parsed.get('strength')}")
        
        print("\n🎨 Vision Output:")
        print(f"   Result Path: {result.get('result_path')}")
        
        if os.path.exists(result.get('result_path')):
            print(f"   🔥 Status: SUCCESS. High-Fidelity image generated.")
            print(f"   💡 TIP: Check if both soundbar and subwoofer are present!")
        else:
            print(f"   ❌ Status: FAILED. Image file not found.")

    except Exception as e:
        print(f"❌ Test Failed: {e}")

if __name__ == "__main__":
    test_hybrid()
