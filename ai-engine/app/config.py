import os
import psutil
from functools import lru_cache

# torch is optional — only available in local/GPU environments
try:
    import torch
    _TORCH_AVAILABLE = True
except ImportError:
    torch = None
    _TORCH_AVAILABLE = False

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
    Falls back gracefully to CPU string when torch is not installed.
    """
    @staticmethod
    def get_device():
        if not _TORCH_AVAILABLE:
            return "cpu"
        if torch.cuda.is_available():
            print("🚀 Device: NVIDIA CUDA Detected")
            return torch.device("cuda")
        elif torch.backends.mps.is_available():
            print("🍎 Device: Apple Silicon (MPS) Detected")
            return torch.device("mps")
        else:
            print("🐢 Device: CPU Fallback")
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
    """
    @staticmethod
    def get_profile() -> dict:
        mem_gb = round(psutil.virtual_memory().total / (1024**3), 1)

        if not _TORCH_AVAILABLE:
            return {
                "device": "cpu",
                "vram_gb": mem_gb,
                "dtype": "float32",
                "recommendation": "cpu-fallback",
                "device_name": "CPU (no torch)"
            }

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
            return {
                "device": "mps",
                "vram_gb": mem_gb,
                "dtype": torch.float32,
                "recommendation": "clean-enhance",
                "device_name": "Apple Silicon (MPS)"
            }
        else:
            return {
                "device": "cpu",
                "vram_gb": mem_gb,
                "dtype": torch.float32,
                "recommendation": "cpu-fallback",
                "device_name": "CPU"
            }
