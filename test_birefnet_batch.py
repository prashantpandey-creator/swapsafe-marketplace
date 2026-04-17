"""
BiRefNet Batch Test - Process all images in test folder
Creates an interactive before/after gallery.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ai-engine'))

from PIL import Image
import glob
import json
import time

def process_all_images():
    print("🧪 BiRefNet Batch Processing")
    print("=" * 60)
    
    # Import the service
    from app.services.birefnet_service import birefnet_service
    
    # Find all test images
    test_dir = "/Users/badenath/Downloads/test"
    output_dir = "/Users/badenath/Documents/travel website/marketplace/ai-engine/static/birefnet_gallery"
    os.makedirs(output_dir, exist_ok=True)
    
    # Get all image files
    image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.webp']
    image_files = []
    for ext in image_extensions:
        image_files.extend(glob.glob(os.path.join(test_dir, ext)))
    
    print(f"📂 Found {len(image_files)} images to process")
    
    results = []
    
    for i, img_path in enumerate(image_files):
        filename = os.path.basename(img_path)
        print(f"\n[{i+1}/{len(image_files)}] Processing: {filename}")
        
        try:
            # Load image
            image = Image.open(img_path).convert("RGB")
            original_size = image.size
            
            # Resize for processing
            image_resized = image.resize((1024, 1024), Image.LANCZOS)
            
            # Process with BiRefNet
            start_time = time.time()
            result = birefnet_service.remove_and_place_on_white(image_resized)
            process_time = time.time() - start_time
            
            # Save original (copy) and result
            safe_name = filename.replace(" ", "_").replace(".jpg", "").replace(".jpeg", "").replace(".png", "").replace(".webp", "")
            
            # Save original thumbnail
            original_path = os.path.join(output_dir, f"{safe_name}_original.jpg")
            image_resized.save(original_path, quality=90)
            
            # Save processed result
            result_path = os.path.join(output_dir, f"{safe_name}_birefnet.png")
            result.save(result_path)
            
            results.append({
                "filename": filename,
                "safe_name": safe_name,
                "original": f"{safe_name}_original.jpg",
                "result": f"{safe_name}_birefnet.png",
                "process_time": round(process_time, 2),
                "original_size": f"{original_size[0]}x{original_size[1]}",
                "status": "success"
            })
            
            print(f"   ✅ Done in {process_time:.2f}s")
            
        except Exception as e:
            print(f"   ❌ Failed: {e}")
            results.append({
                "filename": filename,
                "safe_name": filename.replace(" ", "_"),
                "status": "failed",
                "error": str(e)
            })
    
    # Save results JSON
    results_path = os.path.join(output_dir, "results.json")
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n{'=' * 60}")
    print(f"✅ Processed {len([r for r in results if r.get('status') == 'success'])}/{len(results)} images")
    print(f"📁 Results saved to: {output_dir}")
    
    return results, output_dir

if __name__ == "__main__":
    process_all_images()
