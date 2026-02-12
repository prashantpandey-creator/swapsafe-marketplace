# Google Cloud Compute Engine + GPU Setup Guide

**Option 2: Full Control, Your Code, $300 Credits**

---

## 📊 Cost Breakdown

With your **$300 Google Cloud credits**:
- VM (e2-standard-4): $0.15/hour
- GPU (NVIDIA T4): $0.35/hour
- **Total: $0.50/hour**
- **Your $300 = 600 hours = 25 days of 24/7 processing**
- **At 50 images/hour = ~30,000 images processed completely FREE**

---

## ⏱️ Timeline

- **Google Cloud Setup:** 10 minutes
- **VM Creation & Boot:** 5 minutes
- **Dependencies Install:** 10-15 minutes
- **Deploy Plan B Code:** 5 minutes
- **First Test:** 2-3 minutes
- **TOTAL: ~35-40 minutes to first 3D reconstruction**

---

## 🚀 Step-by-Step Setup

### STEP 1: Google Cloud Project Setup (10 min)

```bash
# 1. Go to Google Cloud Console
https://console.cloud.google.com

# 2. Create new project
Click "Select a Project" → "New Project"
Project name: "Product-Photo-Enhancement"
Click "Create"

# Wait for project to be created (1-2 minutes)

# 3. Enable required APIs
Go to "APIs & Services" → "Library"

Search and ENABLE:
  ✅ Compute Engine API
  ✅ Cloud Resource Manager API
  ✅ Service Usage API

# 4. Create service account (optional, for automation)
Go to "APIs & Services" → "Credentials"
Click "Create Credentials" → "Service Account"
Name: "plan-b-service"
Grant roles: "Compute Instance Admin"
```

---

### STEP 2: Create VM with GPU (5 min)

**In Google Cloud Console:**

```
1. Go to "Compute Engine" → "VM instances"
   Click "Create Instance"

2. Configuration:
   Name: plan-b-gpu-processing

   Region: us-central1 (cheapest)
   Zone: us-central1-a

   Machine type: e2-standard-4
     - 4 vCPU
     - 16 GB RAM

   GPU:
     - GPU type: NVIDIA T4
     - Number of GPUs: 1

   Boot disk:
     - Image: Ubuntu 22.04 LTS
     - Size: 100 GB (SSD)

   Firewall:
     - Allow HTTP traffic: NO
     - Allow HTTPS traffic: NO
     - SSH access: Yes (default)

3. Click "Create"

4. Wait for VM to start (2-3 minutes)
   You'll see a green checkmark when ready
```

---

### STEP 3: SSH into VM and Install Dependencies (15 min)

**From your Mac terminal:**

```bash
# 1. Go to Google Cloud Console → Compute Engine → VM instances
# 2. Find "plan-b-gpu-processing" and click SSH button
# This opens a terminal connected to your Google Cloud VM

# You're now inside the VM! Run these commands:

# Update system
sudo apt update
sudo apt upgrade -y

# Install Python 3.10+
sudo apt install -y python3.10 python3.10-venv python3.10-dev
sudo apt install -y python3-pip

# Install CUDA dependencies (for GPU support)
sudo apt install -y build-essential git

# Install NVIDIA drivers (will auto-detect T4)
sudo apt install -y nvidia-driver-535
nvidia-smi  # Test GPU (should show T4 info)

# Verify GPU is working
# Output should show NVIDIA T4 GPU
```

---

### STEP 4: Clone and Deploy Plan B Code (10 min)

**Still in VM terminal:**

```bash
# 1. Clone your repo (or download code)
cd ~
git clone <your-repo-url> swapsafe
cd swapsafe/ai-engine

# OR if you don't have git set up:
# Download and extract your code manually

# 2. Create Python virtual environment
python3.10 -m venv venv
source venv/bin/activate

# 3. Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Add Google Cloud specific packages
pip install google-cloud-storage google-cloud-logging

# 4. Set up environment variables
cat > .env << 'EOF'
# Google Cloud Configuration
GCP_PROJECT_ID=your-project-id-here
GCP_STORAGE_BUCKET=plan-b-processing-bucket

# Replicate API (Optional - we're using local GPU instead)
# REPLICATE_API_TOKEN=your_replicate_api_token_here

# Cost tracking
REPLICATE_COST_PER_CALL=0.00  # $0 because running on GCP!
DAILY_COST_LIMIT=999.00  # Unlimited
EOF

# 5. Download ML models (first time setup)
# This caches models on the VM so subsequent runs are fast
python3 << 'PYEOF'
from app.services.birefnet_service import birefnet_service
birefnet_service.load_model()
print("✅ BiRefNet cached on GPU")
PYEOF

# This will take 5-10 minutes but only happens once!
```

---

### STEP 5: Test 3D Reconstruction (5 min)

**Still in VM terminal:**

```bash
# Start FastAPI server
python main.py &

# Wait 10 seconds for server to start, then test:

# Test with a sample image
curl -X POST http://localhost:8001/api/v1/studio/process-3d-plan-b \
  -F "file=@/path/to/test/image.jpg" \
  -F "angles=front"

# Expected output:
# {
#   "status": "success",
#   "plan": "B",
#   "views": { "front": "data:image/jpeg;base64,..." },
#   "metadata": { "total_time": 15.2, "cost": 0.00 }
# }

# SUCCESS! Your GPU is processing 3D reconstructions!
```

---

## 💻 Deploy from Your Mac

Once VM is running, you can:

### Option A: SSH and Process Directly

```bash
# SSH into VM
gcloud compute ssh plan-b-gpu-processing --zone=us-central1-a

# Inside VM:
source venv/bin/activate
python main.py

# From another terminal on your Mac:
curl -X POST http://<VM-EXTERNAL-IP>:8001/api/v1/studio/process-3d-plan-b \
  -F "file=@~/Downloads/test/guitar.jpg"
```

### Option B: Use VM as API Server (Better)

```bash
# Make FastAPI accessible from your Mac
# In VM, edit: nano ~/swapsafe/ai-engine/main.py
# Change: uvicorn.run(app, host="127.0.0.1", port=8001)
# To:     uvicorn.run(app, host="0.0.0.0", port=8001)

# Restart server:
pkill -f "python main.py"
python main.py &

# Get VM's external IP
gcloud compute instances list

# From your Mac:
curl -X POST http://<EXTERNAL-IP>:8001/api/v1/studio/process-3d-plan-b \
  -F "file=@~/Downloads/test/guitar.jpg"
```

---

## 🔧 Google Cloud SDK Setup (Mac)

**If you want easier management from your Mac:**

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# List your VMs
gcloud compute instances list

# SSH into VM
gcloud compute ssh plan-b-gpu-processing --zone=us-central1-a

# Start VM (if stopped)
gcloud compute instances start plan-b-gpu-processing --zone=us-central1-a

# Stop VM (to save credits)
gcloud compute instances stop plan-b-gpu-processing --zone=us-central1-a

# View pricing
gcloud compute instances describe plan-b-gpu-processing --zone=us-central1-a
```

---

## 📊 Cost Monitoring

### Check VM Billing

```bash
# In Google Cloud Console:
# Go to "Billing" → "Budgets & alerts"
# Create budget alert: $10/day
# VM auto-notifies you before overspending
```

### Calculate Cost Per Image

```bash
# If VM runs 24/7 at $0.50/hour:
# Process 50 images/hour = $0.01 per image
# Your $300 credits = 30,000 images processed

# Better strategy: Run VM only when processing
# Turn off when not in use → Save credits!
```

---

## 🚀 Batch Processing Script

**Create batch_process.py on VM:**

```python
#!/usr/bin/env python3
"""
Batch process images on Google Cloud VM
Usage: python batch_process.py /path/to/images/folder
"""

import asyncio
import sys
from pathlib import Path
from PIL import Image
from app.services.plan_b_pipeline import plan_b_pipeline

async def process_batch(images_dir):
    """Process all images in directory"""

    images_dir = Path(images_dir)
    results_dir = images_dir.parent / "plan_b_results"
    results_dir.mkdir(exist_ok=True)

    images = list(images_dir.glob("*.jpg")) + list(images_dir.glob("*.png"))

    print(f"\n🎯 Batch Processing {len(images)} images on Google Cloud GPU\n")

    for i, image_path in enumerate(images, 1):
        print(f"[{i}/{len(images)}] Processing: {image_path.name}")

        try:
            image = Image.open(image_path).convert("RGB")

            # Process through Plan B (3D reconstruction on GPU)
            views, metadata = await plan_b_pipeline.process(
                image,
                angles=["front"],
                add_shadow=True,
                upscale=True
            )

            # Save result
            output_file = results_dir / f"{image_path.stem}_3d.jpg"
            views["front"].save(output_file, quality=95)

            print(f"   ✅ {output_file.name}")
            print(f"   ⏱️  {metadata.get('total_time', 0):.1f}s")

        except Exception as e:
            print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python batch_process.py /path/to/images")
        sys.exit(1)

    asyncio.run(process_batch(sys.argv[1]))
```

**Run it:**

```bash
# On VM:
python batch_process.py ~/images/

# Processes all images with GPU acceleration
# Each image: 15-20 seconds with 3D reconstruction
# Cost: $0.00 (paid by your Google Cloud credits)
```

---

## ⚡ Performance on Google Cloud

**Expected Performance with NVIDIA T4 GPU:**

| Task | Time | Cost |
|------|------|------|
| Segmentation (BiRefNet) | 2-3s | $0.00 |
| 3D Reconstruction (TripoSR - Local) | 10-15s | $0.00 |
| Rendering | 2-3s | $0.00 |
| Compositing + Upscaling | 3-5s | $0.00 |
| **Total per image** | **17-26s** | **$0.00** |

**Processing Rate:**
- ~50 images/hour
- ~1,200 images/day with 24/7 running
- **$300 credits = ~250 days of processing!** 🤯

---

## 🛑 Stopping VM (Important - Save Credits!)

**Always stop VM when not processing:**

```bash
# From Mac terminal:
gcloud compute instances stop plan-b-gpu-processing --zone=us-central1-a

# Or in Google Cloud Console:
# Compute Engine → VM instances → plan-b-gpu-processing → Stop

# Cost when stopped: $0.00/hour
# Your $300 credits saved!

# Start again when needed:
gcloud compute instances start plan-b-gpu-processing --zone=us-central1-a
```

---

## 🔄 Workflow Summary

### Every Time You Want to Process Images:

```bash
# 1. SSH into VM
gcloud compute ssh plan-b-gpu-processing --zone=us-central1-a

# 2. Activate environment
source venv/bin/activate
cd ~/swapsafe/ai-engine

# 3. Run batch processing
python batch_process.py ~/images/

# 4. Results in: ~/images/plan_b_results/

# 5. Download results to Mac
# In another Mac terminal:
gcloud compute scp \
  plan-b-gpu-processing:~/images/plan_b_results/* \
  ~/Downloads/gcp_results/ \
  --zone=us-central1-a --recurse

# 6. Stop VM to save credits
gcloud compute instances stop plan-b-gpu-processing --zone=us-central1-a
```

---

## 📋 Deployment Checklist

- [ ] Google Cloud project created
- [ ] Compute Engine API enabled
- [ ] VM created with T4 GPU
- [ ] SSH into VM working
- [ ] Dependencies installed
- [ ] BiRefNet model cached
- [ ] FastAPI server running
- [ ] First test image processed
- [ ] Batch processing script created
- [ ] Cost monitoring set up
- [ ] Stop VM procedure documented

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| GPU not detected | Run `nvidia-smi` - if no output, drivers not installed |
| Out of memory | Reduce image size or process one at a time |
| Slow processing | Check `nvidia-smi` - GPU should show high utilization |
| High costs | Stop VM when not in use |
| Can't SSH | Check firewall rules allow SSH (port 22) |

---

## 📞 Support

If you need help:

1. Check VM logs:
```bash
gcloud compute instances get-serial-port-output plan-b-gpu-processing --zone=us-central1-a
```

2. SSH in and check services:
```bash
ps aux | grep python  # Check if server is running
nvidia-smi  # Check GPU
df -h  # Check disk space
```

3. Review cost in Google Cloud Console:
```
Billing → Cost Management → Cost breakdown
```

---

## 🎉 Next Steps

Once 3D reconstruction is working on Google Cloud:

1. ✅ Process your product catalog
2. ✅ Generate multi-angle views (front, side, back)
3. ✅ Upload results to SwapSafe marketplace
4. ✅ Integrate with React frontend
5. ✅ Monitor costs (should be $0 from your credits)

---

**Status: Ready to deploy to Google Cloud Compute Engine**

Your $300 credits = ~30,000 free 3D reconstructions! 🚀
