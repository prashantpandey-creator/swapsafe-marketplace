from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from server.schemas import PlanResponse  # noqa: E402


def _build_prompts(plan: PlanResponse) -> tuple[str, str]:
    vp = plan.visual_plan
    hints = plan.generation_hints

    positive_parts = [
        vp.scene,
        vp.style,
        vp.composition,
        f"mood: {hints.mood}",
    ]

    negative_parts = []
    for c in vp.constraints:
        c_low = c.lower()
        if c_low.startswith("no "):
            negative_parts.append(c)
        elif "white seamless" in c_low:
            positive_parts.append("white seamless background")
        elif "exact texture" in c_low:
            positive_parts.append("exact texture preservation")
        else:
            # Keep strict constraints in negative prompt if they read like a prohibition
            if "no" in c_low:
                negative_parts.append(c)

    positive = ", ".join([p for p in positive_parts if p])
    negative = ", ".join([n for n in negative_parts if n])
    return positive, negative


def _build_spec(plan: PlanResponse) -> dict:
    positive, negative = _build_prompts(plan)
    hints = plan.generation_hints

    return {
        "positive_prompt": positive,
        "negative_prompt": negative,
        "resolution": hints.resolution,
        "steps": hints.steps,
        "guidance": hints.guidance,
        "strength": hints.strength,
        "seed": hints.seed,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Plan executor: structured plan -> generation spec")
    parser.add_argument("--plan", required=True, help="Path to plan JSON")
    parser.add_argument("--out", default=None, help="Output spec JSON path")
    args = parser.parse_args()

    plan_path = Path(args.plan)
    data = json.loads(plan_path.read_text())
    plan = PlanResponse.model_validate(data)

    spec = _build_spec(plan)

    out_path = Path(args.out) if args.out else Path("../outputs") / f"spec_{plan.plan_id}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(spec, indent=2))

    print(json.dumps(spec, indent=2))
    print(f"\nSaved spec -> {out_path}")


if __name__ == "__main__":
    main()
