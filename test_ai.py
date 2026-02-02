import requests
import base64
import os
import sys

# Configuration
API_URL = "http://localhost:8000/api/v1/studio/fetch_stock"
PRODUCT_NAME = "Jbl Cinema Sb241 Soundbar"
OUTPUT_PATH = "stock_jbl_soundbar.jpg"

def test_fetch():
    print(f"🚀 Starting Stock Image Fetch Test")
    print(f"🔍 Searching for: {PRODUCT_NAME}")
    
    try:
        data = {
            'product_name': PRODUCT_NAME
        }

        print(f"📡 Sending request to {API_URL}...")
        response = requests.post(API_URL, json=data)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('image_data'):
                # Decode and save
                image_data = result['image_data']
                if ',' in image_data:
                    image_data = image_data.split(',')[1]
                
                with open(OUTPUT_PATH, "wb") as f:
                    f.write(base64.b64decode(image_data))
                
                print(f"✅ Success! Stock image saved to {os.path.abspath(OUTPUT_PATH)}")
                print(f"🔗 Source URL: {result.get('image_url')}")
            else:
                print(f"⚠️ API returned success but no image data: {result}")
        else:
            print(f"❌ Error: Status Code {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

if __name__ == "__main__":
    test_fetch()
