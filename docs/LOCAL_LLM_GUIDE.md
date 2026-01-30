# 🚀 Local LLM Guide: Playing with AI on Your Mac

## Quick Start with Ollama

### 1. Install Ollama (One Command)
```bash
brew install ollama
```

### 2. Start Ollama Server
```bash
ollama serve
```
Keep this terminal open! Ollama runs on `http://localhost:11434`

### 3. Download Your First Model
```bash
# Small & Fast (3B params - runs on any Mac)
ollama pull llama3.2

# For Vision/Image Analysis
ollama pull llava

# Coding Assistant
ollama pull codellama
```

---

## 🎮 Playing with Models

### Chat in Terminal
```bash
ollama run llama3.2
# Type anything, press Enter to chat!
# Type /bye to exit
```

### Test API Directly
```bash
# Simple chat
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "What is the capital of France?",
  "stream": false
}'

# With image (llava)
curl http://localhost:11434/api/generate -d '{
  "model": "llava",
  "prompt": "What's in this image?",
  "images": ["<base64_image_data>"],
  "stream": false
}'
```

---

## 📊 Model Comparison

| Model | Size | RAM Needed | Speed | Best For |
|-------|------|------------|-------|----------|
| `llama3.2` | 2GB | 4GB | ⚡ Fast | General chat, quick tasks |
| `llama3.1:8b` | 4.7GB | 8GB | 🔥 Medium | Better quality answers |
| `llama3.1:70b` | 40GB | 48GB | 🐢 Slow | Best quality (needs beefy Mac) |
| `llava` | 4.5GB | 8GB | 🔥 Medium | Image understanding |
| `codellama` | 3.8GB | 6GB | 🔥 Medium | Code generation |
| `mistral` | 4.1GB | 6GB | ⚡ Fast | Great all-rounder |
| `mixtral` | 26GB | 32GB | 🐢 Slow | Expert-level quality |
| `phi-3` | 2.2GB | 4GB | ⚡ Fast | Efficient, Microsoft model |

### Download Commands
```bash
ollama pull llama3.2      # Quick & light
ollama pull mistral       # Great balance
ollama pull llava         # Vision
ollama pull codellama     # Coding
ollama pull phi-3         # Efficient
```

---

## 🛠️ Fine-Tuning Your Own Model

### Method 1: Create a Custom Modelfile

Create `Modelfile`:
```dockerfile
# Base model
FROM llama3.2

# Set custom system prompt
SYSTEM """
You are PriceBot, an expert at estimating prices for used items in India.
You always respond in JSON format with: estimatedPrice, confidence, reasoning.
Prices are in INR (₹). Consider condition: new=100%, like-new=85%, good=70%, fair=50%, poor=30%.
"""

# Adjust parameters
PARAMETER temperature 0.3
PARAMETER top_p 0.9
```

Build and run:
```bash
ollama create pricebot -f Modelfile
ollama run pricebot
```

### Method 2: Fine-tune with Training Data

1. **Prepare Training Data** (JSONL format):
```json
{"prompt": "iPhone 14 Pro, like-new condition", "response": "{\"estimatedPrice\": 75000, \"confidence\": 85, \"reasoning\": \"Flagship phone, excellent condition\"}"}
{"prompt": "Samsung TV 55 inch, good condition", "response": "{\"estimatedPrice\": 35000, \"confidence\": 80, \"reasoning\": \"Mid-range TV, some wear\"}"}
```

2. **Use Unsloth for Efficient Fine-tuning** (Recommended):
```bash
pip install unsloth

# See: https://github.com/unslothai/unsloth
# Allows fine-tuning on Mac M1/M2 with 16GB RAM
```

3. **Convert to Ollama Format**:
```bash
# After fine-tuning, export to GGUF
python -m unsloth.save --model ./finetuned --format gguf

# Create Ollama model
ollama create my-pricebot -f ./finetuned/Modelfile
```

---

## 🔧 Advanced: MLX for M1/M2 Macs

Apple's MLX framework is optimized for Apple Silicon:

```bash
pip install mlx mlx-lm

# Download and run models
python -m mlx_lm.generate --model mlx-community/Llama-3.2-3B-Instruct-4bit \
  --prompt "Hello, world!"

# Fine-tune with LoRA (Low-Rank Adaptation)
python -m mlx_lm.lora --model mlx-community/Llama-3.2-3B-Instruct-4bit \
  --data ./training_data \
  --output ./my_finetuned_model
```

---

## 🧪 Testing in SwapSafe

Once Ollama is running, test in your app:

```bash
# Check AI status
curl http://localhost:5000/api/ai/status

# Test price estimation with Ollama
curl -X POST http://localhost:5000/api/ai/estimate-price \
  -H "Content-Type: application/json" \
  -d '{
    "title": "iPhone 14 Pro 256GB Space Black",
    "category": "electronics",
    "condition": "like-new",
    "provider": "ollama"
  }'
```

---

## 📱 Useful Ollama Commands

```bash
# List downloaded models
ollama list

# Show model info
ollama show llama3.2

# Delete a model
ollama rm model-name

# Copy/rename model
ollama cp llama3.2 my-custom-llama

# Update Ollama
brew upgrade ollama

# Check if running
curl http://localhost:11434/api/tags
```

---

## 💡 Tips & Best Practices

1. **Start Small**: Begin with `llama3.2` or `phi-3` - they're fast and good enough for most tasks

2. **Use System Prompts**: Custom system prompts can make generic models work like specialized ones

3. **JSON Mode**: Add "Respond only with valid JSON" to prompts for structured output

4. **Temperature**:
   - Low (0.1-0.3): Consistent, deterministic responses
   - High (0.7-1.0): Creative, varied responses

5. **Context Window**: Most models support 4k-8k tokens. For longer contexts, use `llama3.1` (128k)

---

## 🌐 Production Architecture

```
Development:
┌─────────┐     ┌────────┐
│ Your App│────▶│ Ollama │ (localhost)
└─────────┘     └────────┘

Production:
┌─────────┐     ┌──────────────┐
│ Your App│────▶│ Groq/Gemini  │ (cloud, free tier)
└─────────┘     └──────────────┘
```

Switch between them using `AI_PROVIDER` in `.env`:
- Development: `AI_PROVIDER=ollama`
- Production: `AI_PROVIDER=groq`

---

## 📚 Resources

- [Ollama Models Library](https://ollama.com/library)
- [MLX Community Models](https://huggingface.co/mlx-community)
- [Unsloth Fine-tuning](https://github.com/unslothai/unsloth)
- [LM Studio](https://lmstudio.ai/) - GUI for running local models
- [Jan.ai](https://jan.ai/) - Another great local LLM app

Happy hacking! 🎉
