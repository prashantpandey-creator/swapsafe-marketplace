# Image Test Lab (Distributed Visual Planning)

This experiment implements the **distributed architecture** you specified:

- **Server** does high-level reasoning and outputs **structured visual plans** (text-only).
- **Client** performs **local diffusion rendering** and **never does semantic reasoning**.
- **No pixels cross the network boundary**.

## Canonical Payload

```json
{
  "intent": "image_generation",
  "visual_plan": {
    "scene": "...",
    "style": "...",
    "composition": "...",
    "constraints": ["..."],
    "variations": ["..."]
  },
  "generation_hints": {
    "resolution": "...",
    "fidelity": "...",
    "mood": "..."
  }
}
```

## Non‑negotiable Constraints (verbatim)

- The LLM must not output raw image prompts.
- The LLM must output structured visual intent.
- The client must not perform semantic reasoning.
- All image generation must be local.
- The system must support iterative refinement via deltas, not regeneration from scratch.

## Layout

```
image-test/
  server/
    app.py
    schemas.py
  client/
    executor.py
    local_controller.py
  outputs/
  README.md
```

## Quickstart

### 1) Start the planning server (text‑only)

```bash
cd /Users/badenath/Documents/travel\ website/marketplace/image-test/server
../ai-engine/venv/bin/python -m uvicorn app:app --port 8091 --host 0.0.0.0
```

### 2) Generate a plan

```bash
curl -X POST http://localhost:8091/plan \
  -H "Content-Type: application/json" \
  -d '{"user_request": "Create a marketplace-ready studio photo of a JBL soundbar with subwoofer on white background."}'
```

### 3) Execute a plan locally (no pixels leave the machine)

```bash
cd /Users/badenath/Documents/travel\ website/marketplace/image-test/client
../ai-engine/venv/bin/python executor.py --plan plan.json
```

The executor emits a **deterministic generation spec** (prompt, negative prompt, steps, cfg, resolution) that a local diffusion runtime can consume.

## Notes

- This prototype does **not** call an external LLM. The server uses a deterministic ruleset to build structured plans.
- Plug in a remote LLM later without changing the client code.
- The executor is intentionally non‑semantic and rule‑driven.
