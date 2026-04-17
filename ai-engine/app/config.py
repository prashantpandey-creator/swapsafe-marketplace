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


class DeviceProfile:
    """
    Hardware detection for pipeline selection.
    Used to determine whether to use Clean & Enhance (local) or FLUX regeneration (cloud).
    """
    @staticmethod
    def get_profile() -> dict:
        """
        Detect device and return profile for pipeline selection.
        Returns dict with keys: device, vram_gb, dtype, recommendation
        """
        if torch.cuda.is_available():
            vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
            return {
                "device": "cuda",
                "vram_gb": round(vram_gb, 1),
                "dtype": torch.float16 if vram_gb >= 16 else torch.float32,
                "recommendation": "clean-enhance" if vram_gb < 20 else "flux-regen",
                "device_name": torch.cuda.get_device_name(0)
            }
        elif torch.backends.mps.is_available():
            mem = psutil.virtual_memory().total / (1024**3)
            return {
                "device": "mps",
                "vram_gb": round(mem, 1),
                "dtype": torch.float32,
                "recommendation": "clean-enhance",
                "device_name": "Apple Silicon (MPS)"
            }
        else:
            mem = psutil.virtual_memory().total / (1024**3)
            return {
                "device": "cpu",
                "vram_gb": round(mem, 1),
                "dtype": torch.float32,
                "recommendation": "cpu-fallback",
                "device_name": "CPU"
            }
