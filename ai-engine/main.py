from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings, DeviceConfig
import time

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS - Allow production domains
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

# Add production origin from env
import os
if os.getenv("CLIENT_URL"):
    origins.append(os.getenv("CLIENT_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for now to avoid tunnel issues, or strictly use 'origins'
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import studio
app.include_router(studio.router, prefix="/api/v1/studio", tags=["studio"])

@app.on_event("startup")
async def startup_event():
    print(f"✨ {settings.PROJECT_NAME} Initializing...")
    device = DeviceConfig.get_device()
    mem = DeviceConfig.get_memory_info()
    print(f"🧠 Hardware Status: {mem['available_gb']}GB RAM Available | Tensor Core: {device}")

@app.get("/")
def read_root():
    return {
        "status": "online", 
        "engine": "Guardian AI", 
        "device": str(DeviceConfig.get_device())
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": time.time()}
