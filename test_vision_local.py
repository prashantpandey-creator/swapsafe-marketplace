import sys
import os
import asyncio
from PIL import Image
from io import BytesIO

# Add app directory to path
sys.path.append(os.path.abspath("ai-engine"))

from app.services.turbo_service import turbo_service

async def test_local_studio():
    print("🧪 Testing LOCAL Studio Excellence Pipeline...")
    
    img_path = "/Users/badenath/Downloads/test/soundbar 3.jpg"
    if not os.path.exists(img_path):
        print(f"❌ Missing image: {img_path}")
        return

    # Mock Brain Output
    target_text = "the black soundbar and the black subwoofer"
    prompt = "best quality, masterpiece, photorealistic, professional studio photography, pure white background"
    strength = 0.75
    
    print(f"📂 Loading: {img_path}")
    input_image = Image.open(img_path).convert("RGB")
    
    # We need to simulate UploadFile for agentic_edit
    class MockFile:
        def __init__(self, path):
            self.path = path
        async def read(self):
            with open(self.path, "rb") as f:
                return f.read()
    
    mock_file = MockFile(img_path)
    
    print("🚀 Running Agentic Edit (Local Only)...")
    try:
        result_path = await turbo_service.agentic_edit(
            mock_file, 
            target_text, 
            prompt, 
            strength=strength
        )
        
        print(f"✅ Result saved to: {result_path}")
        if os.path.exists(result_path):
            print("🔥 SUCCESS: Local Studio Pipeline Verified.")
            # Move result for walkthrough
            final_path = "/Users/badenath/.gemini/antigravity/brain/0509a38a-18d9-4027-ad3d-47864438b67f/studio_fix_result.png"
            import shutil
            shutil.copy(result_path, final_path)
            print(f"📸 Result copied to artifacts: {final_path}")
    except Exception as e:
        import traceback
        print(f"❌ Failed: {e}")
        print(traceback.format_exc())

if __name__ == "__main__":
    asyncio.run(test_local_studio())
