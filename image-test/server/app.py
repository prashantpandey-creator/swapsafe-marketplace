from __future__ import annotations

import re
from typing import List

import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse

from schemas import GenerationHints, PlanRequest, PlanResponse, RefineRequest, RefineResponse, VisualPlan

app = FastAPI(title="Image Test Planner", version="0.1.0")


def _extract_product_terms(text: str) -> List[str]:
    tokens = []
    candidates = [
        "soundbar", "subwoofer", "speaker", "headphones", "earbuds",
        "phone", "laptop", "camera", "watch", "console", "router",
    ]
    lower = text.lower()
    for c in candidates:
        if c in lower:
            tokens.append(c)
    return tokens


def _base_constraints() -> List[str]:
    return [
        "exact texture preservation",
        "no extra objects",
        "no text or watermark",
        "white seamless background",
        "clean edges",
    ]


def _build_visual_plan(req: PlanRequest) -> PlanResponse:
    text = req.user_request.strip()
    product_terms = _extract_product_terms(text)
    product_name = req.product_name or " ".join(product_terms) or "product"

    scene = f"{product_name} on a clean white seamless background"
    style = "professional marketplace catalog, realistic textures, true-to-product"
    composition = "centered product, slight 3/4 angle, generous padding, soft shadow"

    constraints = _base_constraints()
    if "no shadow" in text.lower():
        constraints.append("no shadow")

    variations = [
        "front-facing view",
        "3/4 angle",
        "slight top-down",
    ]

    hints = GenerationHints(
        resolution="640x640",
        fidelity="strict",
        mood="soft studio lighting",
        steps=6,
        guidance=1.0,
        strength=0.38,
    )

    if any(k in text.lower() for k in ["high-res", "high resolution", "hq", "ultra"]):
        hints.resolution = "1024x1024"
        hints.steps = 10
        hints.guidance = 1.2
        hints.strength = 0.55

    plan = VisualPlan(
        scene=scene,
        style=style,
        composition=composition,
        constraints=constraints,
        variations=variations,
    )

    return PlanResponse(visual_plan=plan, generation_hints=hints)


def _apply_delta(plan: VisualPlan, hints: GenerationHints, delta: str) -> None:
    d = delta.lower().strip()

    if "increase contrast" in d or "more contrast" in d:
        hints.mood = "higher contrast studio lighting"
    if "softer shadow" in d:
        plan.constraints.append("softer shadow")
    if "remove background" in d or "background clutter" in d:
        if "no extra objects" not in plan.constraints:
            plan.constraints.append("no extra objects")
    if "brighter" in d:
        hints.mood = "brighter studio lighting"
    if "higher fidelity" in d or "preserve texture" in d:
        hints.fidelity = "strict"
        hints.strength = 0.35
    if "higher resolution" in d or "larger" in d:
        hints.resolution = "1024x1024"
        hints.steps = max(hints.steps or 6, 10)
    if "faster" in d or "speed" in d:
        hints.resolution = "640x640"
        hints.steps = 6
        hints.guidance = 1.0
        hints.strength = 0.38


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/", response_class=HTMLResponse)
def home():
    return """
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Image Test Planner</title>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500&display=swap");
      :root {
        --ink: #0b0f16;
        --muted: #5b6776;
        --card: #ffffff;
        --border: rgba(15, 23, 42, 0.12);
        --accent: #2a6fdb;
        --accent-2: #f6b352;
        --soft: #f2f4f7;
        --shadow: 0 20px 45px rgba(15, 23, 42, 0.1);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Space Grotesk", "IBM Plex Sans", "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(1200px 600px at 10% -10%, #d9e7ff 0%, transparent 60%),
          radial-gradient(900px 400px at 90% 0%, #ffe9c7 0%, transparent 55%),
          var(--soft);
      }
      .shell { max-width: 1200px; margin: 0 auto; padding: 28px 24px 64px; }
      header {
        border-radius: 20px;
        padding: 24px;
        background: linear-gradient(135deg, #0f172a 0%, #1e2a3f 60%, #2b4555 100%);
        color: #f8fafc;
        box-shadow: var(--shadow);
      }
      header h1 { margin: 0 0 8px; font-size: 30px; }
      header p { margin: 0; color: rgba(248, 250, 252, 0.8); font-size: 14px; }
      .row { display: flex; gap: 20px; flex-wrap: wrap; margin-top: 22px; }
      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 18px;
        box-shadow: var(--shadow);
        flex: 1 1 360px;
        min-width: 320px;
      }
      label { display: block; font-weight: 600; margin: 12px 0 6px; }
      input, textarea, select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        font-family: inherit;
        font-size: 14px;
      }
      textarea { min-height: 96px; resize: vertical; }
      button {
        margin-top: 14px;
        padding: 12px 16px;
        border: 0;
        border-radius: 12px;
        background: var(--accent);
        color: #fff;
        cursor: pointer;
        font-weight: 600;
        letter-spacing: 0.02em;
      }
      button.secondary { background: #111827; }
      button:disabled { opacity: 0.6; cursor: not-allowed; }
      .muted { color: var(--muted); font-size: 13px; }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        background: #0b1020;
        color: #e5e7eb;
        padding: 12px;
        border-radius: 12px;
        overflow: auto;
        font-size: 12px;
      }
      .pill {
        display: inline-flex;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(246, 179, 82, 0.2);
        color: #9a5b00;
        font-size: 12px;
        font-weight: 600;
        margin-right: 8px;
      }
      .footer { margin-top: 14px; font-size: 12px; color: var(--muted); }
    </style>
  </head>
  <body>
    <div class="shell">
      <header>
        <h1>Image Test Planner</h1>
        <p>Server-side visual planning only. Outputs structured intent. No prompts, no pixels.</p>
      </header>

      <div class="row">
        <div class="card">
          <span class="pill">Plan</span>
          <label>User Request</label>
          <textarea id="user_request" placeholder="Create a marketplace-ready studio photo of a JBL soundbar and subwoofer on white background."></textarea>

          <label>Product Name (optional)</label>
          <input id="product_name" placeholder="JBL Bar 5.1" />

          <label>Product Tags (comma-separated)</label>
          <input id="product_tags" placeholder="soundbar, subwoofer, black, JBL" />

          <label>Desired Output (optional)</label>
          <input id="desired_output" placeholder="clean catalog image, 1024x1024" />

          <button id="btnPlan">Generate Plan</button>
          <div class="footer">This endpoint returns a structured visual plan and generation hints.</div>
        </div>

        <div class="card">
          <span class="pill">Refine</span>
          <label>Plan JSON</label>
          <textarea id="base_plan" placeholder="Paste PlanResponse JSON here"></textarea>

          <label>Refinement Deltas (one per line)</label>
          <textarea id="deltas" placeholder="increase contrast\\nsofter shadow\\nhigher fidelity"></textarea>

          <button class="secondary" id="btnRefine">Refine Plan</button>
          <div class="footer">Refinement applies deltas without re-planning from scratch.</div>
        </div>
      </div>

        <div class="row">
        <div class="card">
          <span class="pill">Response</span>
          <div style="display:flex; gap:10px; flex-wrap: wrap; margin-bottom: 12px;">
            <button class="secondary" id="btnExport">Export Plan JSON</button>
            <button class="secondary" id="btnSchema">Toggle Schema</button>
          </div>
          <pre id="resp" class="muted"></pre>
          <pre id="schema" class="muted" style="display:none;"></pre>
        </div>
      </div>
    </div>

    <script>
      const resp = document.getElementById('resp');
      const schemaEl = document.getElementById('schema');
      const btnPlan = document.getElementById('btnPlan');
      const btnRefine = document.getElementById('btnRefine');
      const btnExport = document.getElementById('btnExport');
      const btnSchema = document.getElementById('btnSchema');

      function show(obj) {
        resp.textContent = JSON.stringify(obj, null, 2);
      }

      btnPlan.addEventListener('click', async () => {
        btnPlan.disabled = true;
        resp.textContent = '';
        try {
          const payload = {
            user_request: document.getElementById('user_request').value.trim(),
            product_name: document.getElementById('product_name').value.trim() || null,
            product_tags: document.getElementById('product_tags').value
              .split(',')
              .map(t => t.trim())
              .filter(Boolean),
            desired_output: document.getElementById('desired_output').value.trim() || null,
          };

          const r = await fetch('/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const j = await r.json();
          show(j);
        } catch (err) {
          show({ error: String(err) });
        } finally {
          btnPlan.disabled = false;
        }
      });

      btnRefine.addEventListener('click', async () => {
        btnRefine.disabled = true;
        resp.textContent = '';
        try {
          const baseRaw = document.getElementById('base_plan').value.trim();
          const deltas = document.getElementById('deltas').value
            .split('\\n')
            .map(t => t.trim())
            .filter(Boolean);

          const payload = {
            base_plan: JSON.parse(baseRaw),
            deltas,
          };

          const r = await fetch('/refine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const j = await r.json();
          show(j);
        } catch (err) {
          show({ error: String(err) });
        } finally {
          btnRefine.disabled = false;
        }
      });

      btnExport.addEventListener('click', async () => {
        btnExport.disabled = true;
        try {
          const raw = resp.textContent.trim();
          if (!raw) throw new Error('No plan in response panel');
          const plan = JSON.parse(raw);
          const r = await fetch('/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plan),
          });
          const j = await r.json();
          show(j);
        } catch (err) {
          show({ error: String(err) });
        } finally {
          btnExport.disabled = false;
        }
      });

      btnSchema.addEventListener('click', async () => {
        try {
          if (schemaEl.style.display === 'none') {
            const r = await fetch('/schema');
            const j = await r.json();
            schemaEl.textContent = JSON.stringify(j, null, 2);
            schemaEl.style.display = 'block';
          } else {
            schemaEl.style.display = 'none';
          }
        } catch (err) {
          show({ error: String(err) });
        }
      });
    </script>
  </body>
</html>
""".strip()


@app.get("/schema")
def schema():
    return {
        "PlanRequest": PlanRequest.model_json_schema(),
        "PlanResponse": PlanResponse.model_json_schema(),
    }


@app.post("/export")
def export_plan(plan: PlanResponse):
    out_dir = Path(__file__).resolve().parents[1] / "outputs"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"plan_{plan.plan_id}.json"
    out_path.write_text(json.dumps(plan.model_dump(), indent=2))
    return {"ok": True, "path": str(out_path)}


@app.post("/plan", response_model=PlanResponse)
def plan(req: PlanRequest):
    return _build_visual_plan(req)


@app.post("/refine", response_model=RefineResponse)
def refine(req: RefineRequest):
    base = req.base_plan
    plan = base.visual_plan.model_copy(deep=True)
    hints = base.generation_hints.model_copy(deep=True)
    for delta in req.deltas:
        _apply_delta(plan, hints, delta)

    return RefineResponse(
        visual_plan=plan,
        generation_hints=hints,
    )
