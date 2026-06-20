# IMAGE_DETECTION_INFRA_PLAN.md

> SwapSafe — Image Detection & Image Infrastructure Deep-Dive
> Status: **PLAN ONLY — no code, no spend committed.** Parallel companion to `REVOLUTION_PLAN.md` and `STRATEGY_AND_REWORK_PLAN.md`.
> Scope: the *image* half of the AI system — detection, enhancement, stock-image fetch, and the infrastructure that runs it.
> All prices are approximate 2025/2026 public list prices and **must be re-verified before any spend**.

---

## 0. Grounding — what actually exists today (verified from code)

Before recommending anything, here is the real state of the engine, cited to files.

**Detection (what-is-this):**
- `app/services/gemini_analysis_service.py` — Gemini `gemini-2.0-flash` vision returns `{title, category, brand, model, condition, condition_report, detected_view, description, keywords}`. This is the primary detector.
- `app/agents/visual_analysis_agent.py` — second detector path: Gemini `gemini-2.0-flash` with a **Groq `meta-llama/llama-4-scout-17b-16e-instruct` vision fallback**.
- `app/services/vlm_director_service.py` — `Qwen2-VL-7B-Instruct`, **torch-dependent, never runs in prod** (no torch), falls back to a crude rule-based heuristic (`_fallback_analysis`).
- `app/services/qwen_service.py` — `Qwen-Image-Edit-2509` editing is a **stub** that echoes the input.

**Enhancement (make-it-look-good):**
- `app/services/birefnet_service.py` — BiRefNet, **guarded by `try: import torch`**; in prod `torch` is absent → `self.model = "rembg"` → `_rembg_remove()` (u2net via onnxruntime).
- `app/services/showcase_service.py` — rembg `u2netp` session + Pillow white-bg compositing, shadow, fit-to-canvas. This is the real free path.
- `app/services/enhance_service.py` — OpenCV CLAHE + denoise + sharpen. CPU-safe, **currently not wired into the live enhance flow** (`ai_pipeline.enhance_product_image` calls `showcase` only, with `apply_upscale=False`, `add_shadow=False`).
- `app/services/upscale_service.py` — Real-ESRGAN, torch-gated, **disabled in pipeline** (`apply_upscale=False` in `ai_pipeline.py:189`, "Causing timeouts").
- `app/services/vision_service.py::relight_product()` — **STUB**, returns input unchanged. "Pro Mode" in `studio.py` `/enhance` (`mode='pro'`) calls this → Pro relight is a no-op today.

**Stock path:**
- `app/services/stock_service.py` — DuckDuckGo image + text search (`find_product_image`, `search_web`). Free, rate-limit-prone, no labelling of results as representative.

**3D / paid:**
- `app/services/replicate_3d_service.py` + `studio.py` `/process-3d-plan-b`, `/generate-3d` — Replicate TripoSR, ~$0.05/img. The `$10/day` cap referenced in the strategy doc is **not found enforced in code** — it must be implemented (see §4.6).

**Infra primitives already present:**
- `requirements-render.txt` is the **prod manifest**: `onnxruntime`, `rembg[cpu]`, `opencv-python-headless`, `groq`, `google-genai`, `duckduckgo-search`. **No torch, no transformers** — confirming BiRefNet/Qwen/ESRGAN cannot run in prod.
- `requirements.txt` (dev) *does* install torch — this is the source of the dev/prod drift.
- Backend `server/package.json` already depends on **`bullmq` + `ioredis`** → a Redis-backed job queue is available and unused for image jobs.
- Backend provider abstraction in `server/services/ai.js`: Groq / Gemini / OpenAI / Ollama switchable via `AI_PROVIDER`.

**Net:** in production the engine is effectively *rembg + Pillow + OpenCV + Gemini/Groq API calls*. Every torch model is dead weight. The plan below leans into that reality rather than fighting it.

---

## 1. Image DETECTION — "what is this item?"

### 1.1 The job detection must do
Detection is not one task; it feeds four downstream consumers, and each needs different fidelity:

| Consumer | What it needs from detection | Fidelity bar |
|---|---|---|
| **(a) Auto title/description** | product type, brand, model, key features | Medium — "good enough to edit" |
| **(b) Price estimation** | exact `brand + model + variant` + condition | **High** — wrong model = wrong price |
| **(c) Stock-image lookup** | a clean searchable product string | Medium |
| **(d) Claim-vs-photo honesty check** | does the photo match the *claimed* item & condition; is this a real user photo or a catalog render | **High** — this is the trust moat |

The first three are the *Automated Mode* pillar (effort). The fourth is the *Zero-Fraud* pillar (trust) and is the one that must never be cheap-and-wrong.

### 1.2 Option comparison

| Approach | Accuracy (brand/model) | Latency | Cost / image | Notes for SwapSafe |
|---|---|---|---|---|
| **Gemini 2.0/2.5 Flash vision** (current) | Good; strong at Indian-market products & text-on-box OCR | ~1–3 s | ~$0.001–0.003 (Flash tier; verify) | Already wired (`gemini_analysis_service.py`). Cheapest credible option. Generous free tier. |
| **Claude (Haiku/Sonnet) vision** | Sonnet excellent at nuanced condition + honesty reasoning; Haiku cheap/fast | 1–4 s | Haiku ≈ cents; Sonnet higher | Best *reasoning* for the honesty check (d). Worth using selectively for high-value items. Verify current vision pricing. |
| **GPT-4o / 4o-mini vision** | Strong general; 4o-mini cheap | 1–3 s | 4o-mini low; 4o higher | Solid third provider for ensemble/fallback. |
| **Groq Llama-4-Scout vision** (current fallback) | Decent, **very fast**, free-ish tier | <1 s | ~free / very low | Already wired (`visual_analysis_agent.py`). Great cheap fallback + speed. |
| **Self-hosted VLM** (Qwen2-VL-7B, current dead code) | Good *if it ran* | **Minutes on CPU** / unusable | $0 marginal but needs GPU | **Not viable** on the CPU VPS. Keep code, don't run. Only revisit with a GPU host (§4). |

**Key insight:** detection is **token-cost, not GPU-cost**. It is the one part of the image system that is *already cheap and already works in prod*. The mistake would be to self-host it.

### 1.3 Recommended detection architecture

**Tiered cascade (cheap-first, escalate on uncertainty or value):**

1. **Default detector — Gemini 2.0/2.5 Flash** (keep `gemini_analysis_service.py`). One call returns the structured listing JSON. Cheapest, fastest-to-ship, already in prod.
2. **Speed/cost fallback — Groq Llama-4-Scout** when Gemini errors, is rate-limited, or for the free-tier bulk path. Already in `visual_analysis_agent.py`.
3. **Honesty/condition escalation — Claude vision (Haiku→Sonnet)** *only* when: (i) item value > a threshold, (ii) detection confidence is low, or (iii) the listing is going for the AI-Verified badge. This is where the money-back guarantee rides, so spend a few cents to get the reasoning right.
4. **Confidence-gated human review** below a confidence floor (mirrors `EditPlan.confidence` / `quality_score` already in `vlm_director_service.py`).

**Make detection return a confidence and a "needs-review" flag** — the schema in `gemini_analysis_service.py` should add `confidence` and `is_stock_image_likelihood`. Detection must be allowed to say "I'm not sure," because a confidently-wrong "Verified" badge is worse than no badge (per `REVOLUTION_PLAN.md` Part VIII).

### 1.4 How detection feeds each consumer

- **(a) Auto title/description** — Gemini JSON `title`/`description`/`keywords` flow straight into the listing draft. Already implemented; just surface as *editable* (Assisted level).
- **(b) Price estimation** — the *exact* `brand + model` string feeds `market_intelligence_agent.py` / `gemini_analysis_service.calculate_price_context()` (search → Groq/Gemini reasoning). **Guardrail:** if model confidence is low, do **not** auto-price; ask the user to confirm the model. Wrong-model pricing is a classic trust killer.
- **(c) Stock-image lookup** — the same product string is the query into the stock path (§3). Detection quality directly caps stock quality.
- **(d) Claim-vs-photo honesty check** — this is a **separate, second** vision call, run *after* the user has entered/confirmed the claim: "Does this photo show a {claimed product} in {claimed condition}? Is this a genuine user photo or a catalog/marketing render? List visible defects." Output a 0–100 honesty sub-score + flags. Use the strongest available reasoner (Claude Sonnet) for high-value/badge items, Flash for the bulk. This call is the literal product moat and should be budgeted as such.

> **Detection recommendation in one line:** keep it 100% cloud-API, cascade Gemini Flash → Groq → Claude-on-escalation, never self-host a VLM on the CPU VPS, and split "describe the item" from "verify the claim" into two calls with confidence gating.

---

## 2. Image ENHANCEMENT — "make a bad photo look good"

### 2.1 What "good" means here
Consistent, clean, white-studio look with the real item faithfully shown. Per `REVOLUTION_PLAN.md`, every listing should look "trustworthy and comparable." We explicitly do **not** want to *beautify into dishonesty* — over-relighting that hides scratches would undermine the trust pillar. This is a constraint, not a footnote.

### 2.2 The torch / BiRefNet decision (resolve it)

**Decision: do NOT install torch in the production image. Accept rembg as the free-tier remover.**

Rationale:
- The prod box is CPU-only, 15 GB RAM shared with PuranGPT. BiRefNet on CPU at 1024² is multi-second-to-tens-of-seconds and RAM-heavy; with another tenant it risks OOM. `birefnet_service.py` already degrades to rembg there anyway — installing torch buys nothing but a fatter, slower, more fragile image.
- rembg `u2net`/`u2netp` (onnxruntime) is "clean" quality — good enough for the free default. The quality gap to BiRefNet is real but not worth a GPU bill pre-launch.
- **Keep BiRefNet code intact** behind the torch guard. It "turns on for free" the day the engine lands on a GPU host (§4).

### 2.3 The two paths

**FREE default path (every upload, $0 marginal):**
1. `rembg u2netp` background removal (already in `showcase_service.py`). **Pre-bake `u2net.onnx` + `u2netp.onnx` into the Docker image** (fixes the cold-start 504 — see §4.5).
2. **Re-wire `enhance_service.py`** (CLAHE white-balance + denoise + mild sharpen) into the live flow — it's CPU-cheap and currently bypassed. Run it on the cutout *before* compositing.
3. White-bg composite + soft shadow + fit-to-canvas (already in `showcase_service.py`).
4. **Skip** Real-ESRGAN upscaling (torch, disabled, causes timeouts) — use the existing Pillow LANCZOS + UnsharpMask fallback in `upscale_service.py` if any upscaling is wanted, or none at all.

Result: "clean studio-ish," ~1–3 s once models are cached, $0. This is the right default for India-first, price-sensitive sellers and bulk listing.

**PAID "Pro" path (explicit opt-in, bounded spend):**
The `relight_product()` stub must be replaced by a **real API call**, not a CPU diffusion model. Options:

| Provider / model | Capability | Indicative price (verify) | Fit |
|---|---|---|---|
| **Replicate** — IC-Light (relight), Real-ESRGAN/SUPIR (upscale), bg models | relight + upscale + cleanup | ~$0.01–0.05 / run | **Already integrated** (`replicate_3d_service.py` pattern). Lowest friction. **Recommended.** |
| **fal.ai** | relight / upscale / bg-removal | ~$0.01–0.05 / image | Fast cold starts; good per-request alternative/fallback to Replicate. |
| **Photoroom API** | purpose-built e-commerce bg + shadow + relight | ~$0.01–0.10 / image (tiered) | Best "it just looks like a product photo" out-of-box. Worth it if Replicate IC-Light tuning is fiddly. |
| **remove.bg** | bg removal only | ~$0.09–0.20 / image | Overpriced for bg-only when rembg is free. Skip. |

**Pro recommendation:** wire **Replicate IC-Light relight + ESRGAN/SUPIR upscale** behind the existing `mode='pro'` toggle in `studio.py` `/enhance`. Budget ~**$0.03–0.08 per Pro photo**. Add Photoroom later only if quality demands it. **Honesty guard:** Pro enhancement must not erase or smooth over genuine defects — relight prompts should be lighting-only, not "restore/repair," and the honesty check (§1.4d) runs on the *original* photo, never the enhanced one.

> **Enhancement recommendation in one line:** free path = pre-baked rembg + re-wired OpenCV CLAHE + white composite (no torch); Pro path = Replicate IC-Light/ESRGAN behind an explicit toggle with a daily cap; never run diffusion on the CPU VPS; never enhance the photo used for honesty verification.

---

## 3. Stock-image PATH — "no good photo / add it later"

### 3.1 The problem with DuckDuckGo (current)
`stock_service.py` scrapes DDG images. It's free but: rate-limited/bot-flagged (hence the `time.sleep` and UA spoofing), non-deterministic quality, no licensing clarity, and — critically — **returns images with no provenance label**, which directly conflicts with the "no fake, everything explainable" principle in both strategy docs. A scraped marketing render presented as if it were the seller's item is exactly the fraud vector Pillar 1 is meant to kill.

### 3.2 Better sources

| Source | Quality | Cost | Licensing / trust | Verdict |
|---|---|---|---|---|
| **DuckDuckGo scrape** (current) | Hit-or-miss | Free | Murky | Keep only as last-resort fallback, **clearly labelled**. |
| **Product-DB matching** (internal) | Exact when matched | Free after build | Clean | **Best long-term.** When detection yields a confident `brand+model`, match against an internal catalog of canonical product images accrued over time. Feeds the Digital Passport too. |
| **Retailer / affiliate APIs** (e.g. Amazon PA-API, Flipkart affiliate) | High, India-relevant | Free-ish w/ affiliate acceptance | Clear-ish (catalog imagery) | Strong India-first fit; gated behind affiliate approval. Phase 2+. |
| **Google Programmable Search / SerpAPI image** | Good | SerpAPI ~$0.005–0.015/query (verify) | Murky imagery | Reliable replacement for DDG scraping when you'll pay a little. |
| **Bing Image Search API** | Good | Per-query (verify) | Murky imagery | Alternative to SerpAPI. |
| **Stock libraries (Unsplash/Pexels)** | Generic, not product-specific | Free | Clean | Useless for "this exact model." Skip. |

### 3.3 Recommended stock strategy
1. **Internal product-DB first.** Build a `canonical_products` collection keyed by `brand+model`, storing one clean reference image (seeded from the first verified real listings + retailer APIs). On a confident detection match, serve that. Zero marginal cost, improves with every listing, and feeds the Passport moat. This is the only "stock" source that's actually *trustworthy*.
2. **Retailer/affiliate API** for catalog imagery on confident matches not yet in the DB (Phase 2, once affiliate access is approved).
3. **Paid search API (SerpAPI/Bing)** as the reliable fallback when the DB misses — replaces the fragile DDG scrape.
4. **DDG scrape** demoted to absolute last resort.

### 3.4 Labelling (non-negotiable, ties to the trust pillar)
Any image not taken by the seller must carry an explicit, structured flag, e.g. `image.source = "representative_stock" | "seller_original" | "passport_inherited"`, and the UI renders a visible **"Representative image — not the actual item"** badge. A representative image can **never** earn the AI-Verified badge or the money-back guarantee — only `seller_original` photos that pass the honesty check can. This rule is what keeps the stock convenience from poisoning the trust promise.

> **Stock recommendation in one line:** build an internal product-image DB as the primary source (free, compounding, Passport-feeding), use affiliate/paid-search APIs as fallback, retire DDG scraping to last-resort, and *always* label non-seller imagery as representative and disqualify it from verification.

---

## 4. INFRASTRUCTURE — the big decision

### 4.1 The four options

| Option | What it is | Pros | Cons |
|---|---|---|---|
| **(a) Keep CPU VPS + rembg + Replicate-for-Pro** (status quo, hardened) | Current Hetzner box runs rembg/OpenCV/Pillow + cloud detection; Pro path → Replicate | $0 marginal for free path; already deployed; no new vendors; privacy-ok | No SOTA bg/relight locally; shares RAM with PuranGPT; cold-start risk |
| **(b) Rent a dedicated GPU VPS** | Move whole engine to an always-on GPU box; BiRefNet/IC-Light/ESRGAN run locally | SOTA quality at $0 marginal; full control | **$200–1,000+/mo always-on burn**; idle waste at low volume; ops overhead; absurd pre-launch |
| **(c) Serverless GPU per-request** (Replicate / fal / Modal / RunPod) | Each heavy op is an API call billed per-second/run | No idle cost; scales to zero; SOTA models on tap | Per-image cost; cold-starts (1–10 s); external dependency; data leaves box |
| **(d) Hybrid** (recommended) | CPU VPS does free/common path; serverless GPU APIs do Pro/heavy/high-value | Best cost curve; cheap default, premium on demand; scales to zero | Two code paths; spend monitoring needed |

### 4.2 Recommendation for a solo founder, India-first, scaling

**Adopt (d) Hybrid = (a) + (c). Concretely:**
- **Detection:** 100% cloud API (Gemini/Groq/Claude). No infra.
- **Free enhancement:** CPU VPS, rembg + OpenCV + Pillow, pre-baked models.
- **Pro enhancement + 3D + upscale + relight:** serverless GPU via **Replicate** (already wired), with **fal.ai as a secondary**.
- **Defer the dedicated GPU VPS (b)** until sustained volume (roughly **>1,000 heavy images/day**) makes always-on cheaper than per-request — see §5 break-even.

This keeps fixed cost ≈ the existing VPS, makes marginal cost ≈ $0 for the common path, and caps variable cost to opt-in Pro usage. It matches the strategy docs' "free CPU tier, paid APIs only for Pro/high-value."

### 4.3 Separate the AI engine from PuranGPT (RAM safety)
15 GB shared with another project is a latent OOM. Pin the AI-engine container's memory, and since the heavy work is moving to serverless APIs, the engine's own footprint shrinks (no torch). Document a hard RAM ceiling so a PuranGPT spike can't kill listing creation.

### 4.4 Async / queue pattern (use the Redis you already have)
The API client has an **8 s timeout** (per `marketplace/CLAUDE.md`) and the proxy ~30 s; any Pro/3D/relight op blows through both. The backend already ships **`bullmq` + `ioredis`** — use them:

1. Client uploads → backend enqueues an image job in **BullMQ** → returns a `jobId` immediately (202).
2. Worker calls the AI engine / Replicate; on completion stores result (Cloudinary) + updates job state.
3. Client polls `GET /jobs/:id` or receives a push.
4. **Free fast path** (rembg, ~1–3 s) can stay synchronous; **only the slow paid path goes async.** This single change removes the entire class of timeout-504 enhancement failures.

### 4.5 Cold-start / model pre-baking fixes (do before launch)
- **Pre-bake `u2net.onnx` and `u2netp.onnx` into the Docker image** at build time so the first request after any redeploy never triggers the 175 MB download → kills the cold-start 504 noted in `STRATEGY_AND_REWORK_PLAN.md`.
- **Warm-up call** on container start (one tiny rembg inference) so the first real user isn't the one paying the lazy-load cost (`showcase_service.py` lazy-loads today).
- **Raise the `/ai/` proxy read-timeout to ~60 s** as a safety margin for the sync free path.

### 4.6 Spend governance for serverless GPU (the missing cap)
The "$10/day Replicate cap" is **referenced in strategy but not enforced in code**. Implement it: a Redis counter keyed per-day incremented on each Replicate/fal call; reject (or downgrade to free path) when the cap is hit, with a clear user message. Without this, the Pro path is an unbounded liability. Add per-user rate limits to stop a single actor draining the cap.

### 4.7 Timeout & failure handling
- Every serverless call: explicit timeout + retry-with-backoff (pattern already exists in `replicate_3d_service.py`) + **graceful downgrade to the free path** on failure, so a Replicate outage degrades quality, never breaks listing creation.
- Idempotency keys on jobs so a client retry doesn't double-bill.

---

## 5. Cost table (per-image and monthly)

> All figures **approximate, list-price, 2025/2026, must be verified.** Monthly = per-image × volume × 30. Assumes the *recommended* providers. "Free path" ops are $0 marginal (VPS fixed cost amortized separately).

### 5.1 Per-image unit cost (recommended provider)

| Operation | Provider (recommended) | Per-image (approx) |
|---|---|---|
| **Detection** (describe item) | Gemini 2.0 Flash | ~$0.001–0.003 |
| **Honesty check** (claim-vs-photo) | Gemini Flash (bulk) / Claude Sonnet (badge) | ~$0.002 / ~$0.01–0.03 |
| **BG removal (free)** | rembg on VPS | **$0** |
| **Enhancement (free)** | OpenCV/Pillow on VPS | **$0** |
| **Enhancement (Pro relight)** | Replicate IC-Light | ~$0.02–0.05 |
| **Upscaling (Pro)** | Replicate ESRGAN/SUPIR | ~$0.01–0.04 |
| **Stock lookup (DB hit)** | internal product-DB | **$0** |
| **Stock lookup (fallback)** | SerpAPI/Bing image | ~$0.005–0.015 |
| **3D (TripoSR)** | Replicate | ~$0.05 |

### 5.2 Monthly cost by scenario

Assume per listing: **1 detection + 1 honesty check (Flash) + 1 free bg/enhance.** Pro/3D/stock-fallback are *opt-in* — modeled at **~15% of listings** going Pro and **~10%** needing a paid stock fallback. (Tune these.)

**Per-listing blended marginal cost:**
- Always-on: detection + Flash honesty ≈ **$0.004**
- + 15% Pro (IC-Light + ESRGAN ≈ $0.06) ≈ **+$0.009**
- + 10% paid stock ($0.01) ≈ **+$0.001**
- **≈ $0.014 / listing blended** (excluding 3D and Claude-escalations).

| Volume (images/day) | Always-on AI (detect+honesty) | + Pro 15% | + Stock 10% | **Blended monthly** (excl. fixed VPS) |
|---|---|---|---|---|
| **100/day** (~3k/mo) | ~$12 | ~$27 | ~$3 | **~$42/mo** |
| **1,000/day** (~30k/mo) | ~$120 | ~$270 | ~$30 | **~$420/mo** |
| **10,000/day** (~300k/mo) | ~$1,200 | ~$2,700 | ~$300 | **~$4,200/mo** |

**Plus fixed infra:** the Hetzner CPU VPS (~$5–20/mo, already paid). **3D** is extra and bounded by the daily cap.

**Break-even note (when to revisit option (b) GPU VPS):** a dedicated GPU VPS runs ~$200–1,000+/mo always-on. At 100/day, serverless Pro (~$30/mo) crushes it. Around **1,000–3,000 heavy images/day**, an always-on GPU box starts to win on the *heavy* ops — that's the trigger to reconsider (b) for bg/relight/upscale (detection stays cloud regardless). Until then, hybrid serverless is strictly cheaper.

**Sensitivity:** the Pro-uptake % dominates the bill. Keep Pro opt-in and capped, and the cost stays trivial; if Pro becomes default-on, costs 4–5×. Verify each provider's real price — Claude/GPT-4o vision escalations on high-value items can add up if the threshold is set too low.

---

## 6. Recommended phased rollout (aligned to `REVOLUTION_PLAN.md` phases)

### Phase 0 — Foundation (now → launch-ready) — *matches "Make photos clean & honest"*
- **Pre-bake rembg `u2net`/`u2netp` into the Docker image** + warm-up call → kills cold-start 504.
- **Re-wire `enhance_service.py`** (CLAHE/denoise/sharpen) into the live free flow so "Fast" actually looks clean.
- **Raise `/ai/` proxy timeout to ~60 s.**
- **Pin AI-engine RAM** so PuranGPT can't OOM it; confirm no torch in prod image.
- Keep detection on Gemini Flash + Groq fallback (already live).
- Decision: confirm **no torch in prod** (this plan's recommendation).

### Phase 1 — Trust Wedge — *matches "AI-Verified badge + guarantee"*
- Ship the **claim-vs-photo honesty check** as a second vision call (Flash bulk, Claude Sonnet for badge/high-value), returning an explainable honesty sub-score + flags.
- Add **stock-image likelihood** + **detection confidence** to the detector schema; gate auto-publish/badge on it.
- Enforce **image provenance labelling** (`seller_original` vs `representative_stock`); disqualify non-seller imagery from the badge.
- This is the launch-story enabler — verification you can see.

### Phase 2 — Automated Mode — *matches "one-tap auto-list"*
- Wire the **BullMQ/ioredis async job queue** for all slow image ops; free path stays sync.
- Replace `relight_product()` stub with **Replicate IC-Light Pro path** behind the explicit toggle; add **ESRGAN/SUPIR upscale**.
- **Implement the daily spend cap + per-user limits** (Redis counter) before exposing Pro broadly.
- Detection cascade (Flash → Groq → Claude-on-escalation) formalized with confidence gating feeding auto-title/price/stock.

### Phase 3 — Passport & Circular Engine — *matches "the moat deepens"*
- Stand up the **internal product-image DB** (`canonical_products`) as primary stock source; seed from verified listings + affiliate/retailer APIs.
- Passport inherits verified `seller_original` images across resales; detection + honesty history accrues per item.
- Retire DDG scraping to last-resort.

### Phase 4 — Personalization & depth
- Tune detection escalation thresholds from real payout/fraud data (the guarantee P&L tells you where detection is weak).
- Add perceptual-hash duplicate-photo detection (cheap, CPU) to catch reused images across listings.

### Phase 5 — Global / scale
- Re-evaluate **dedicated GPU VPS (option b)** once heavy-op volume crosses the ~1,000–3,000/day break-even.
- Multi-region serverless GPU; the parked BiRefNet/Qwen/ESRGAN code "turns on for free" on the first GPU host.

---

## 7. The five decisions this plan asks the owner to make

1. **No torch in prod** — accept rembg as the free-tier remover, keep BiRefNet parked. (Recommended: yes.)
2. **Wire Replicate IC-Light/ESRGAN into the Pro path** behind an explicit toggle + enforced daily cap. (Recommended: yes, Phase 2.)
3. **Split detection into "describe" vs "verify honesty"**, escalating to Claude vision for badge/high-value items. (Recommended: yes, Phase 1.)
4. **Build an internal product-image DB** as the primary stock source; label all non-seller imagery as representative and bar it from the badge. (Recommended: yes, from Phase 1 labelling → Phase 3 DB.)
5. **Stay hybrid-serverless; defer the GPU VPS** until ~1,000–3,000 heavy images/day. (Recommended: yes.)

---

*This document is the image-subsystem "how." It complements — and defers to — `REVOLUTION_PLAN.md` (the "why") and `STRATEGY_AND_REWORK_PLAN.md` (the broader AI state). No code was written and no spend is committed. All prices require verification before any purchase.*
