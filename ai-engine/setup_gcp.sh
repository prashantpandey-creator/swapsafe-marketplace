#!/bin/bash

#############################################################################
#                     GOOGLE CLOUD SETUP SCRIPT                            #
#                                                                           #
#  This script automates Plan B deployment to Google Cloud VM with GPU     #
#  Usage: bash setup_gcp.sh                                                #
#                                                                           #
#############################################################################

set -e  # Exit on error

echo "🚀 Plan B Google Cloud Setup"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Update system
echo -e "${YELLOW}[1/6]${NC} Updating system packages..."
sudo apt update
sudo apt upgrade -y

# 2. Install Python and build tools
echo -e "${YELLOW}[2/6]${NC} Installing Python 3.10 and dependencies..."
sudo apt install -y \
    python3.10 \
    python3.10-venv \
    python3.10-dev \
    python3-pip \
    build-essential \
    git \
    wget \
    curl

# 3. Install NVIDIA drivers
echo -e "${YELLOW}[3/6]${NC} Installing NVIDIA drivers (for T4 GPU)..."
sudo apt install -y nvidia-driver-535

# Verify GPU
echo ""
echo "GPU Status:"
nvidia-smi || echo "⚠️  GPU not yet available (may need reboot)"
echo ""

# 4. Setup Python environment
echo -e "${YELLOW}[4/6]${NC} Setting up Python virtual environment..."
python3.10 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# 5. Install dependencies
echo -e "${YELLOW}[5/6]${NC} Installing Plan B dependencies..."

# Create requirements file for GCP
cat > gcp_requirements.txt << 'EOF'
# Plan B - Google Cloud Edition
fastapi==0.109.0
uvicorn==0.27.0
python-multipart==0.0.6
torch --index-url https://download.pytorch.org/whl/cu118
numpy
rembg
pillow
hf_transfer
huggingface_hub
python-dotenv
aiofiles
requests
psutil

# SOTA Vision (IC-Light & BiRefNet)
diffusers>=0.28.0
transformers>=4.40.0
accelerate
timm
einops
scikit-image
filelock
kornia
opencv-python
duckduckgo-search>=4.0.0

# Google Cloud
google-cloud-storage
google-cloud-logging

# 3D Reconstruction (Local TripoSR - Optional)
# Uncomment to enable local 3D reconstruction on GPU:
# git+https://github.com/VAST-AI-Research/TripoSR.git
EOF

pip install -r gcp_requirements.txt

# 6. Download and cache models
echo -e "${YELLOW}[6/6]${NC} Caching ML models on GPU (this takes 5-10 minutes)..."
echo "   Downloading BiRefNet..."

python3 << 'PYEOF'
from app.services.birefnet_service import birefnet_service
try:
    birefnet_service.load_model()
    print("✅ BiRefNet cached successfully")
except Exception as e:
    print(f"⚠️  BiRefNet caching failed: {e}")
    print("   Will download on first use")
PYEOF

echo ""
echo "=============================="
echo -e "${GREEN}✅ Google Cloud Setup Complete!${NC}"
echo "=============================="
echo ""
echo "📊 Next Steps:"
echo ""
echo "1. Start FastAPI server:"
echo "   python main.py"
echo ""
echo "2. In another terminal, test endpoint:"
echo "   curl -X POST http://localhost:8001/api/v1/studio/process-3d-plan-b \\"
echo "     -F \"file=@test_image.jpg\" \\"
echo "     -F \"angles=front\""
echo ""
echo "3. For batch processing:"
echo "   python batch_process.py /path/to/images"
echo ""
echo "📁 Your $300 Google Cloud credits = ~30,000 free 3D reconstructions!"
echo ""
