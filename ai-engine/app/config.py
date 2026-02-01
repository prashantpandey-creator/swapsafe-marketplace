import torch
import os
import psutil
from functools import lru_cache

class Settings:
    PROJECT_NAME: str = "Guardian AI Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Model Paths (Cached locally)
    CACHE_DIR: str = os.path.expanduser("~/.cache/guardian-ai")
    
    # Feature Flags
    ENABLE_MPS: bool = True  # Enable Apple Silicon GPU

@lru_cache()
def get_settings():
    return Settings()

class DeviceConfig:
    """
    Intelligent hardware selector for the 'Edge-First' architecture.
    Prioritizes Apple Silicon (MPS) > CUDA > CPU.
    """
    @staticmethod
    def get_device() -> torch.device:
        if torch.cuda.is_available():
            print("🚀 Device: NVIDIA CUDA Detected")
            return torch.device("cuda")
        elif torch.backends.mps.is_available():
            print("🍎 Device: Apple Silicon (MPS) Detected - Running on Mac GPU")
            return torch.device("mps")
        else:
            print("🐢 Device: CPU Fallback (Performance will be slow)")
            return torch.device("cpu")

    @staticmethod
    def get_memory_info():
        mem = psutil.virtual_memory()
        return {
            "total_gb": round(mem.total / (1024**3), 2),
            "available_gb": round(mem.available / (1024**3), 2),
            "percent": mem.percent
        }
