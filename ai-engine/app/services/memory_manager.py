"""
Memory-Managed Model Pipeline
Ensures only ONE heavy model is loaded at a time to prevent RAM/VRAM exhaustion.
"""
import gc
import torch


class ModelMemoryManager:
    """
    Manages memory by ensuring only one heavy model is loaded at a time.
    Unloads previous models before loading new ones.
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._current_model = None
            cls._instance._current_model_name = None
        return cls._instance
    
    def unload_current(self):
        """Unload current model and free memory"""
        if self._current_model is not None:
            print(f"🧹 Unloading {self._current_model_name}...")
            
            # Clear the model
            del self._current_model
            self._current_model = None
            self._current_model_name = None
            
            # Force garbage collection
            gc.collect()
            
            # Clear GPU/MPS cache
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            elif torch.backends.mps.is_available():
                # MPS cache clearing (available in PyTorch 2.1+)
                try:
                    torch.mps.empty_cache()
                except AttributeError:
                    # Older PyTorch version
                    pass
            
            print("   ✅ Memory freed")
    
    def register_model(self, model, name: str):
        """Register a newly loaded model"""
        self._current_model = model
        self._current_model_name = name
        print(f"📦 Registered model: {name}")
    
    def is_loaded(self, name: str) -> bool:
        """Check if a specific model is currently loaded"""
        return self._current_model_name == name
    
    def get_current(self):
        """Get current model if any"""
        return self._current_model


# Singleton
memory_manager = ModelMemoryManager()


class SequentialPipeline:
    """
    Runs heavy models sequentially with memory management.
    Only ONE model in memory at a time.
    """
    
    def __init__(self):
        self.mm = memory_manager
    
    def run_birefnet(self, image):
        """Run BiRefNet (unloads other models first)"""
        print("\n" + "=" * 50)
        print("📸 STAGE 1: BiRefNet Segmentation")
        print("=" * 50)
        
        # Unload other models
        if not self.mm.is_loaded("birefnet"):
            self.mm.unload_current()
        
        # Import and run
        from services.birefnet_service import BiRefNetService
        birefnet = BiRefNetService()
        result = birefnet.remove_background(image)
        
        # Register as current
        if birefnet.model is not None:
            self.mm.register_model(birefnet.model, "birefnet")
        
        return result
    
    def run_sam(self, image, boxes):
        """Run SAM for precise masks (unloads other models first)"""
        print("\n" + "=" * 50)
        print("🎯 STAGE 3: SAM Precise Segmentation")
        print("=" * 50)
        
        if not boxes:
            print("   No boxes to segment")
            return image
        
        # Unload other models
        if not self.mm.is_loaded("sam"):
            self.mm.unload_current()
        
        from services.sam_hand_remover import sam_hand_remover
        result = sam_hand_remover.remove_hands(image, boxes)
        
        # Register as current
        if sam_hand_remover.sam is not None:
            self.mm.register_model(sam_hand_remover.sam, "sam")
        
        return result
    
    def run_lama(self, image, mask):
        """Run LaMa inpainting (unloads other models first)"""
        print("\n" + "=" * 50)
        print("🖌️ STAGE 4: LaMa Inpainting")
        print("=" * 50)
        
        # Unload other models
        self.mm.unload_current()
        
        try:
            from simple_lama_inpainting import SimpleLama
            lama = SimpleLama()
            result = lama(image.convert("RGB"), mask)
            # Don't register LaMa as it's stateless
            return result
        except ImportError:
            print("   ⚠️ LaMa not available, using OpenCV")
            import cv2
            import numpy as np
            img_np = np.array(image.convert("RGB"))
            mask_np = np.array(mask)
            result = cv2.inpaint(img_np, mask_np, 15, cv2.INPAINT_NS)
            from PIL import Image
            return Image.fromarray(result)
    
    def cleanup(self):
        """Final cleanup - unload all models"""
        print("\n🧹 Final cleanup...")
        self.mm.unload_current()
        gc.collect()
        print("   ✅ All models unloaded")


# Singleton
sequential_pipeline = SequentialPipeline()
