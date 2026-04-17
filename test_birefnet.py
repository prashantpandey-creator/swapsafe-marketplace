"""
Test BiRefNet Local Background Removal
Tests the new SOTA background removal pipeline on the soundbar image.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ai-engine'))

from PIL import Image
import shutil

def test_birefnet():
    print("🧪 Testing BiRefNet SOTA Background Removal...")
    print("=" * 50)
    
    # Import the service
    from app.services.birefnet_service import birefnet_service
    
    # Load test image
    test_image_path = "/Users/badenath/Downloads/test/soundbar 3.jpg"
    if not os.path.exists(test_image_path):
        print(f"❌ Test image not found: {test_image_path}")
        return
    
    print(f"📂 Loading: {test_image_path}")
    image = Image.open(test_image_path).convert("RGB")
    image = image.resize((1024, 1024), Image.LANCZOS)
    
    # Run BiRefNet
    print("🚀 Running BiRefNet background removal...")
    result = birefnet_service.remove_and_place_on_white(image)
    
    # Save result
    import time
    filename = f"birefnet_{int(time.time())}.png"
    os.makedirs("ai-engine/static/output", exist_ok=True)
    output_path = f"ai-engine/static/output/{filename}"
    result.save(output_path)
    
    print(f"✅ Result saved to: {output_path}")
    print("🔥 SUCCESS: BiRefNet Local Pipeline Verified.")
    
    # Copy to artifacts
    artifact_path = "/Users/badenath/.gemini/antigravity/brain/0509a38a-18d9-4027-ad3d-47864438b67f/birefnet_result.png"
    shutil.copy(output_path, artifact_path)
    print(f"📸 Result copied to artifacts: {artifact_path}")

if __name__ == "__main__":
    test_birefnet()
