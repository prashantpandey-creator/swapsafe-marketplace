import torch
from PIL import Image
from app.config import DeviceConfig
import os
from fastapi import UploadFile

class QwenEditService:
    def __init__(self):
        self.device = DeviceConfig.get_device()
        self.pipeline = None
        self.model_id = "Qwen/Qwen-Image-Edit-2509"

    async def edit(self, image_file: UploadFile, prompt: str) -> str:
        """
        Smart Lane: Sequential Loading (Encoder -> VAE/DiT GGUF)
        """
        import gc
        
        try:
             # Read Image
            contents = await image_file.read()
            from io import BytesIO
            input_image = Image.open(BytesIO(contents)).convert("RGB")
            
            # 1. Load Text Encoder (15GB)
            print("🐼 Step 1: Loading Text Encoder (15GB)...")
            from transformers import Qwen2_5_VLForConditionalGeneration, Qwen2Tokenizer, Qwen2VLProcessor
            
            text_encoder_id = "Qwen/Qwen2.5-VL-7B-Instruct" # Or appropriate variant
            processor = Qwen2VLProcessor.from_pretrained(text_encoder_id, trust_remote_code=True)
            # tokenizer = Qwen2Tokenizer.from_pretrained(text_encoder_id, trust_remote_code=True)
            
            text_encoder = Qwen2_5_VLForConditionalGeneration.from_pretrained(
                text_encoder_id,
                torch_dtype=torch.float16,
                low_cpu_mem_usage=True,
                trust_remote_code=True
            ).to(self.device)
            
            # 2. Encode Prompt
            print(f"🐼 Step 2: Encoding '{prompt}'...")
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": input_image},
                        {"type": "text", "text": prompt},
                    ],
                }
            ]
            text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            try:
                from qwen_vl_utils import process_vision_info
                image_inputs, video_inputs = process_vision_info(messages)
            except ImportError:
                print("Warning: process_vision_info not found, using raw")
                image_inputs = [input_image]
                video_inputs = None

            inputs = processor(
                text=[text],
                images=image_inputs,
                videos=video_inputs,
                padding=True,
                return_tensors="pt",
            ).to(self.device)
            
            # Generate Embeddings (This is the critical "Brain Output")
            # For this stub, we simulate the memory verification primarily.
            
            # 3. PURGE ENCODER
            print("🐼 Step 3: Purging Encoder (Freeing 15GB RAM)...")
            del text_encoder
            del inputs
            gc.collect()
            torch.mps.empty_cache()
            
            # 4. Load GGUF Transformer (12GB)
            print("🐼 Step 4: Loading GGUF Transformer...")
            # from qwen_gguf.pipeline import QwenGGUFPipeline
            # pipe = QwenGGUFPipeline(model_path="ai-lab/qwen-mps/models/Qwen-Image-Edit-2509-Q4_K_M.gguf")
            
            # 5. Generate
            print("🐼 Step 5: Generating Image (Stub)...")

            # Return MOCK for now until GGUF download finishes
            import time
            filename = f"qwen_smart_{int(time.time())}.png"
            path = f"static/output/{filename}"
            input_image.save(path) # Just echoing input for now
            
            return path
            
        except Exception as e:
            print(f"💥 Qwen Edit Error: {e}")
            import traceback
            traceback.print_exc()
            return "error.png"

qwen_service = QwenEditService()
