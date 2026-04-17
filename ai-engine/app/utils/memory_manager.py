"""
Memory Management Utility
Manages RAM usage by cleaning up unused models and clearing GPU caches.
"""
import gc
import os
import subprocess


def get_memory_usage() -> dict:
    """Get current system memory usage (macOS)."""
    try:
        result = subprocess.run(['top', '-l', '1', '-s', '0'], capture_output=True, text=True)
        lines = result.stdout.split('\n')
        
        for line in lines:
            if 'PhysMem:' in line:
                # Parse: PhysMem: 14G used (2087M wired, 2700M compressor), 1983M unused.
                parts = line.split()
                used_idx = parts.index('used')
                unused_idx = [i for i, p in enumerate(parts) if 'unused' in p]
                
                return {
                    'used': parts[1] if len(parts) > 1 else 'N/A',
                    'unused': parts[unused_idx[0] - 1] if unused_idx else 'N/A',
                    'raw': line
                }
    except Exception as e:
        return {'error': str(e)}
    
    return {'raw': 'Unable to parse memory info'}


def cleanup_torch():
    """Clean up PyTorch memory (MPS/CUDA caches)."""
    import torch
    
    print("🧹 Cleaning PyTorch memory...")
    
    # Clear MPS cache
    if torch.backends.mps.is_available():
        torch.mps.empty_cache()
        print("  ✅ MPS cache cleared")
    
    # Clear CUDA cache
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        print("  ✅ CUDA cache cleared")
    
    # Force garbage collection
    gc.collect()
    print("  ✅ GC completed")


def unload_all_models():
    """Unload all loaded AI models from memory."""
    print("🔄 Unloading all AI models...")
    
    try:
        # Unload BiRefNet
        from app.services.birefnet_service import birefnet_service
        if birefnet_service.model is not None:
            birefnet_service.model.to("cpu")
            del birefnet_service.model
            birefnet_service.model = None
            birefnet_service.is_loaded = False
            print("  ✅ BiRefNet unloaded")
    except Exception as e:
        print(f"  ℹ️ BiRefNet: {e}")
    
    try:
        # Unload Hybrid Service components
        from app.services.hybrid_service import hybrid_service
        hybrid_service._offload_birefnet()
        hybrid_service._offload_sdxl()
        print("  ✅ Hybrid service cleared")
    except Exception as e:
        print(f"  ℹ️ Hybrid service: {e}")
    
    try:
        # Unload IC-Light if loaded
        from app.services.iclight_service import iclight_service
        if iclight_service.is_loaded:
            if iclight_service.unet:
                iclight_service.unet.to("cpu")
            if iclight_service.vae:
                iclight_service.vae.to("cpu")
            if iclight_service.text_encoder:
                iclight_service.text_encoder.to("cpu")
            iclight_service.is_loaded = False
            print("  ✅ IC-Light unloaded")
    except Exception as e:
        print(f"  ℹ️ IC-Light: {e}")
    
    # Final cleanup
    cleanup_torch()


def full_cleanup():
    """Full memory cleanup - unload models and clear caches."""
    print("\n" + "="*60)
    print("🧠 FULL MEMORY CLEANUP")
    print("="*60)
    
    print("\n📊 Before cleanup:")
    mem_before = get_memory_usage()
    print(f"   {mem_before.get('raw', mem_before)}")
    
    unload_all_models()
    
    print("\n📊 After cleanup:")
    mem_after = get_memory_usage()
    print(f"   {mem_after.get('raw', mem_after)}")
    
    print("\n✅ Memory cleanup complete!")


if __name__ == "__main__":
    full_cleanup()
