import requests
import base64
import os
import sys

# Configuration
API_URL = "http://localhost:8000/api/v1/studio/enhance"
# Handle spaces in filename
IMAGE_PATH = "/Users/badenath/Downloads/soundbar 3.jpg"
OUTPUT_PATH = "enhanced_soundbar.png"

def test_enhance():
    print(f"🚀 Starting AI Engine Test")
    print(f"📂 Reading image from: {IMAGE_PATH}")
    
    if not os.path.exists(IMAGE_PATH):
        print(f"❌ Error: Image not found at {IMAGE_PATH}")
        return

    try:
        # Prepare the file and form data
        files = {
            'file': ('soundbar.jpg', open(IMAGE_PATH, 'rb'), 'image/jpeg')
        }
        data = {
            'product_name': 'Soundbar and Woofer',
            'category': 'Electronics',
            'has_exact_match': 'false'
        }

        print(f"📡 Sending request to {API_URL}...")
        response = requests.post(API_URL, files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                # Decode and save the enhanced image
                image_data = result['image_data']
                # Remove header if present (data:image/png;base64,)
                if ',' in image_data:
                    image_data = image_data.split(',')[1]
                
                with open(OUTPUT_PATH, "wb") as f:
                    f.write(base64.b64decode(image_data))
                
                print(f"✅ Success! Enhanced image saved to {os.path.abspath(OUTPUT_PATH)}")
                print(f"⏱️ Processing time: {result.get('processing_time_ms')}ms")
            else:
                print(f"❌ API returned success=False")
                print(result)
        else:
            print(f"❌ Error: Status Code {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

if __name__ == "__main__":
    test_enhance()
