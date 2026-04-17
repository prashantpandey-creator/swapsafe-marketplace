# Hand Removal from Product Image - Context for Continuation

## Objective
Remove the hand holding a guitar from a product image to create a clean product photo.

## Source Image
`/Users/badenath/Documents/travel website/marketplace/ai-engine/static/output/local_pipeline/1_segmented.png`
- Size: 720x960 pixels
- Already segmented (transparent background)
- Hand wrapped around guitar neck at **y=265-380, x=280-395**

## What Has Been Tried (DO NOT REPEAT)

### 1. Skin Color Detection
- Files: `skin_inpaint.py`, `skin_v2.py`
- Result: ❌ Guitar wood tone similar to skin - false positives

### 2. MediaPipe Hand Detection
- File: `app/services/mediapipe_hand_detector.py`
- Result: ❌ Failed to detect hand (occlusion/size issues)

### 3. SAM (Segment Anything Model)
- Files: `sam_hand.py`, `sam_fingers.py`
- Result: ❌ Can't distinguish hand from connected guitar - segments entire guitar

### 4. LaMa Inpainting (various approaches)
- Files: `lama_hand_inpaint.py`, `lama_fixed.py`, `lama_polygon.py`, `corrected.py`, `large_mask.py`
- Result: ❌ LaMa uses hand pixels as context → regenerates hand texture
- Even with large masks (y=250-420, x=270-410), hand partially visible

### 5. Gemini Flash API
- Files: `gemini_hand.py`, `gemini_15.py`
- Result: ✅ **gemini-2.5-flash WORKS** for detection (new API key required)
- Detected hand box: **(280, 350) to (375, 510)** from first attempt
- Polygon detection also worked but coordinates were off

### 6. Texture Cloning
- File: `texture_clone.py`
- Result: ❌ Visible seams, misalignment

### 7. Alpha Channel Manipulation
- Multiple attempts to modify alpha to remove hand
- Result: ❌ Hand is part of original alpha mask - removing it cuts the guitar too

## Key Findings

1. **Correct Hand Coordinates**: y=265-380, x=280-395 (verified with debug_grid.png)
2. **Guitar Neck**: ~50px wide centered at x=345
3. **Core Problem**: Hand is WRAPPED AROUND neck - no guitar texture exists behind hand
4. **LaMa Limitation**: Uses surrounding context including hand → recreates hand

## Available Tools/Models

| Tool | Status | Notes |
|------|--------|-------|
| LaMa | ✅ Installed | `simple_lama_inpainting` - works but recreates hand |
| SAM | ✅ Installed | `models/sam_vit_b.pth` - can't separate connected objects |
| MediaPipe | ✅ Installed | Doesn't detect occluded hands |
| Gemini 2.5 Flash | ✅ Works | Use for coordinate detection |
| BiRefNet | ✅ Installed | For segmentation |

## Files Created

```
ai-engine/
├── corrected.py          # Correct coordinates (y=265-380)
├── large_mask.py         # Large mask attempt
├── texture_clone.py      # Texture cloning attempt
├── hand_only.py          # Hand-only mask
├── gemini_skin.py        # Gemini + skin detection
├── gemini_polygons.py    # Gemini polygon coordinates
├── full_regen.py         # Full regeneration attempt
├── final_blend.py        # Blending approach
├── static/output/
│   ├── debug_grid.png    # Coordinate visualization
│   ├── local_pipeline/1_segmented.png  # SOURCE IMAGE
│   ├── corrected/        # Results with correct coords
│   ├── large_mask/       # Large mask results
│   └── texture_clone/    # Texture clone results
```

## Environment

```bash
cd /Users/badenath/Documents/travel\ website/marketplace/ai-engine
source venv/bin/activate
export GEMINI_API_KEY="YOUR_NEW_KEY_HERE"
```

## Suggested Next Steps

1. **Stable Diffusion Inpainting** - Semantic understanding could remove hand properly
2. **ControlNet + Inpainting** - Structure-aware inpainting
3. **Different Input Image** - One without hand holding the guitar
4. **Manual Editing** - Use image editing software

## Prompt for Continuation

Copy this to start new conversation:

---

**Continue hand removal from guitar image. Context:**

- Source: `ai-engine/static/output/local_pipeline/1_segmented.png` (720x960)
- Hand location: y=265-380, x=280-395
- Previous attempts failed: LaMa, SAM, skin detection, texture cloning
- LaMa recreates hand from context
- SAM can't separate hand from guitar
- Need semantic inpainting (Stable Diffusion?) or different approach
- See `ai-engine/HAND_REMOVAL_CONTEXT.md` for full details

**New approach to try:** [YOUR IDEA HERE]

---
