from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageFilter


def _parse_resolution(res: str) -> tuple[int, int]:
    if "x" in res:
        w, h = res.lower().split("x", 1)
        return int(w), int(h)
    return 1024, 1024


def stage_image(input_path: Path, output_path: Path, resolution: str, padding: float = 0.08) -> None:
    width, height = _parse_resolution(resolution)
    canvas = Image.new("RGBA", (width, height), (255, 255, 255, 255))

    img = Image.open(input_path).convert("RGBA")
    max_w = int(width * (1 - 2 * padding))
    max_h = int(height * (1 - 2 * padding))
    scale = min(max_w / img.width, max_h / img.height)
    new_size = (max(1, int(img.width * scale)), max(1, int(img.height * scale)))
    img = img.resize(new_size, Image.LANCZOS)

    x = (width - new_size[0]) // 2
    y = (height - new_size[1]) // 2

    # Soft shadow
    shadow_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    shadow = Image.new("RGBA", new_size, (0, 0, 0, 140))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=16))
    shadow_layer.paste(shadow, (x + 14, y + 20), shadow)

    canvas = Image.alpha_composite(canvas, shadow_layer)
    canvas.paste(img, (x, y), img)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(output_path, format="PNG")


def main() -> None:
    parser = argparse.ArgumentParser(description="Local staging controller (non-generative).")
    parser.add_argument("--spec", required=True, help="Path to generation spec JSON")
    parser.add_argument("--input", required=True, help="Path to input product image")
    parser.add_argument("--out", default=None, help="Output image path")
    args = parser.parse_args()

    spec = json.loads(Path(args.spec).read_text())
    resolution = spec.get("resolution", "1024x1024")

    out_path = Path(args.out) if args.out else Path("../outputs") / "staged_output.png"
    stage_image(Path(args.input), out_path, resolution)

    print(f"Saved staged image -> {out_path}")


if __name__ == "__main__":
    main()
