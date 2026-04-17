"""
VLM Director Service - Vision Language Model for understanding product photos.
Uses Qwen-Image-2.0 (7B unified model) for scene analysis and editing plan generation.
Plan A: Fully Local Implementation
"""
import json
import torch
import numpy as np
from PIL import Image
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
import gc


@dataclass
class EditPlan:
    """Structured output from VLM director analysis."""
    product_name: str
    confidence: float  # 0-1, confidence in analysis
    complexity: str  # "simple", "medium", "complex"
    issues: List[str]  # List of identified issues
    removals_needed: List[str]  # Objects to remove (hands, clutter, etc.)
    missing_parts: List[str]  # Parts that are cut off or damaged
    suggested_pose: str  # Suggested studio angle
    suggested_prompt: str  # Editing prompt for inpainting service
    quality_score: float  # 0-1 assessment of current photo quality


class VLMDirectorService:
    """
    Analyzes product photos using Qwen-Image-2.0 to create structured edit plans.
    Acts as the "brain" that understands the scene and decides what editing is needed.
    """

    def __init__(self):
        self.model = None
        self.processor = None
        self.device = (
            "mps"
            if torch.backends.mps.is_available()
            else "cuda"
            if torch.cuda.is_available()
            else "cpu"
        )
        self.model_id = "Qwen/Qwen2-VL-7B-Instruct"  # 7B unified model
        self._load_count = 0

    def load_model(self):
        """Load Qwen-Image-2.0 from HuggingFace."""
        if self.model is not None:
            return

        print(f"🔮 Loading Qwen-Image-2.0 (7B) on {self.device}...")

        try:
            from transformers import AutoProcessor, Qwen2VLForConditionalGeneration

            # Load processor
            self.processor = AutoProcessor.from_pretrained(
                self.model_id,
                trust_remote_code=True,
            )

            # Load model in float16 for memory efficiency
            self.model = Qwen2VLForConditionalGeneration.from_pretrained(
                self.model_id,
                torch_dtype=torch.float16,
                low_cpu_mem_usage=True,
                trust_remote_code=True,
            )

            # Move to device
            self.model = self.model.to(self.device)
            self.model.eval()

            print(f"✅ Qwen-Image-2.0 loaded on {self.device}")
            self._load_count += 1

        except Exception as e:
            print(f"❌ Failed to load Qwen-Image-2.0: {e}")
            # Fallback: use rule-based analysis
            print("⚠️ Falling back to rule-based analysis (no ML)")
            self.model = "fallback"

    def analyze(self, image: Image.Image) -> EditPlan:
        """
        Analyze a product photo and create an edit plan.

        Args:
            image: PIL Image of product photo

        Returns:
            EditPlan with structured editing instructions
        """
        self.load_model()

        # Convert to RGB if needed
        if image.mode != "RGB":
            image = image.convert("RGB")

        try:
            if self.model == "fallback":
                return self._fallback_analysis(image)

            # Build analysis prompt
            prompt = """You are an expert product photography analyst. Analyze this product photo for marketplace preparation.

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "product_name": "brief product description",
  "confidence": 0.0-1.0,
  "complexity": "simple|medium|complex",
  "issues": ["list of problems with photo"],
  "removals_needed": ["hands", "background clutter", etc],
  "missing_parts": ["cut off at edge", "damaged area", etc],
  "suggested_pose": "front-facing 15° tilt",
  "quality_score": 0.0-1.0
}

CRITICAL: Only respond with the JSON object. No other text."""

            # Prepare inputs
            with torch.no_grad():
                # Use processor to prepare inputs
                inputs = self.processor(
                    text=[prompt],
                    images=[image],
                    padding=True,
                    return_tensors="pt",
                )

                # Move to device
                for key in inputs:
                    if torch.is_tensor(inputs[key]):
                        inputs[key] = inputs[key].to(self.device)

                # Generate response
                output_ids = self.model.generate(
                    **inputs,
                    max_new_tokens=500,
                    temperature=0.3,  # Low temperature for deterministic output
                )

                # Decode response
                response_text = self.processor.decode(
                    output_ids[0], skip_special_tokens=True
                )

            # Parse JSON response
            try:
                # Extract JSON from response (in case of extra text)
                json_start = response_text.find("{")
                json_end = response_text.rfind("}") + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                else:
                    json_str = response_text

                analysis = json.loads(json_str)

                # Build edit plan
                plan = EditPlan(
                    product_name=analysis.get("product_name", "Unknown Product"),
                    confidence=float(analysis.get("confidence", 0.5)),
                    complexity=analysis.get("complexity", "medium"),
                    issues=analysis.get("issues", []),
                    removals_needed=analysis.get("removals_needed", []),
                    missing_parts=analysis.get("missing_parts", []),
                    suggested_pose=analysis.get("suggested_pose", "front-facing"),
                    suggested_prompt=self._build_inpaint_prompt(analysis),
                    quality_score=float(analysis.get("quality_score", 0.5)),
                )

                print(f"📋 Analysis: {plan.complexity} • {plan.product_name}")
                print(f"   Issues: {', '.join(plan.issues) if plan.issues else 'None'}")
                print(f"   Removals: {', '.join(plan.removals_needed) if plan.removals_needed else 'None'}")

                return plan

            except json.JSONDecodeError as e:
                print(f"⚠️ Failed to parse VLM response: {e}")
                print(f"   Response: {response_text[:200]}")
                return self._fallback_analysis(image)

        except Exception as e:
            print(f"❌ Analysis error: {e}")
            import traceback
            traceback.print_exc()
            return self._fallback_analysis(image)

    def _build_inpaint_prompt(self, analysis: Dict[str, Any]) -> str:
        """Build an inpainting prompt from VLM analysis."""
        removals = analysis.get("removals_needed", [])
        if not removals:
            return "studio white background"

        # Specific prompts for common removals
        removals_lower = [r.lower() for r in removals]
        prompts = []

        if any("hand" in r for r in removals_lower):
            prompts.append("remove hands")
        if any("shadow" in r for r in removals_lower):
            prompts.append("remove shadows")
        if any("background" in r for r in removals_lower):
            prompts.append("clean background")
        if any("reflection" in r for r in removals_lower):
            prompts.append("remove reflections")
        if any("clutter" in r for r in removals_lower):
            prompts.append("clean surroundings")

        if prompts:
            return ", ".join(prompts) + ", studio white background"
        else:
            return "studio white background"

    def _fallback_analysis(self, image: Image.Image) -> EditPlan:
        """
        Fallback rule-based analysis when ML model unavailable.
        Uses heuristics to detect common issues.
        """
        print("📋 Using rule-based fallback analysis...")

        # Simple heuristics
        img_array = np.array(image)
        h, w = img_array.shape[:2]

        # Check for white edges (suggests product might be cut off)
        top_row = np.mean(img_array[0:5, :, :], axis=(0, 1))
        bottom_row = np.mean(img_array[-5:, :, :], axis=(0, 1))
        left_col = np.mean(img_array[:, 0:5, :], axis=(0, 1))
        right_col = np.mean(img_array[:, -5:, :], axis=(0, 1))

        edges_bright = np.mean([top_row, bottom_row, left_col, right_col]) > 200
        missing_parts = ["edges appear cut off"] if edges_bright else []

        # Check color distribution (uniform background = likely cluttered)
        center = img_array[h // 4 : 3 * h // 4, w // 4 : 3 * w // 4, :]
        color_variance = np.std(center)
        high_variance = color_variance > 50  # Complex background

        issues = []
        removals = []

        if high_variance:
            issues.append("complex background")
            removals.append("background clutter")

        if edges_bright:
            issues.append("product may be cut off at edges")
            missing_parts.append("edges")

        complexity = "simple"
        if removals or missing_parts:
            complexity = "medium" if len(removals) <= 2 else "complex"

        return EditPlan(
            product_name="Product",
            confidence=0.6,  # Lower confidence for fallback
            complexity=complexity,
            issues=issues if issues else ["unclear background"],
            removals_needed=removals if removals else ["background"],
            missing_parts=missing_parts if missing_parts else [],
            suggested_pose="front-facing",
            suggested_prompt="studio white background",
            quality_score=0.7 if not issues else 0.5,
        )

    def unload(self):
        """Unload model to free memory."""
        if self.model is not None and self.model != "fallback":
            print("🧹 Unloading Qwen-Image-2.0...")
            del self.model
            del self.processor
            self.model = None
            self.processor = None
            gc.collect()

            # Clear MPS cache
            if torch.backends.mps.is_available():
                try:
                    torch.mps.empty_cache()
                except:
                    pass

            print("   ✅ Memory freed")


# Singleton instance
vlm_director_service = VLMDirectorService()
