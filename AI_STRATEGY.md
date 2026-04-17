# AI Strategy: Distributed Cognitive System

## Core Philosophy
1.  **Costs scale with intelligence, not pixels.**
2.  **Reasoning is rare -> Rent it (Cloud/LLM).**
3.  **Generation is brute force -> Own it (Local/GPU).**
4.  **Privacy is absolute**: Images **NEVER** leave the device.

## Architecture Layers

### Layer C: Server (Centralized Intelligence)
*   **Role**: Reasoning, Planning, Intent Synthesis.
*   **Input**: User Text Request (Natural Language).
*   **Output**: Structured `VisualPlan` (JSON).
*   **Constraint**: **NO PIXEL MANIPULATION.**
*   **Component**: Cloud LLM (Gemini 1.5 Flash / GPT-4).

### Layer B: Network Boundary (The Air Gap)
*   **Protocol**: Text-Only JSON.
*   **Rule**: No binary image data crosses this line.
*   **Payload Schema**:
    ```json
    {
      "intent": "image_generation",
      "visual_plan": {
        "scene": "Cyberpunk street market",
        "style": "Neon Noir",
        "composition": "Wide angle, low shot",
        "constraints": ["no daylight", "rainy"],
        "variations": ["blue hue", "red hue"]
      },
      "generation_hints": {
        "resolution": "1024x1024",
        "fidelity": "High"
      }
    }
    ```

### Layer A: Client (Local Execution)
*   **Role**: Pixel Rendering & Refinement.
*   **Input**: `VisualPlan` (from Server).
*   **Component**: Local SDXL Turbo (Python/Diffusers).
*   **Action**:
    1.  Parse `VisualPlan`.
    2.  Construct Positive/Negative Prompts.
    3.  Generate Image (Offline).
    4.  Cache & Display.

## End-to-End Flow
`User` -> `Cloud Brain (Plan)` -> `JSON` -> `Local Engine (Render)` -> `Image`

## Implementation Status
- [ ] **Layer C (Brain)**: Update `central_brain.py` to output `VisualPlan` JSON.
- [ ] **Layer A (Engine)**: Update `turbo_service.py` to consume `VisualPlan` (Prompt Expansion).
- [ ] **Layer B (Interface)**: Update `lab.html` / Frontend to mediate this flow.
