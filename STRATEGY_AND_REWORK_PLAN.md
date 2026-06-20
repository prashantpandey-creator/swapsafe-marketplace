# SwapSafe — Strategy, AI Rework & Trust/Safety Plan

> Author: Engineering session, 2026-06-21
> Status: Plan only — no spend committed. Decisions flagged for owner sign-off.

---

## 0. What changed in this session (done)

- **Themes reduced to 2**: `white` (professional boho-modern, default) + `lynch` (creative). 5 unused themes deleted.
- **Fake data wiped**: 6 demo listings + 4 demo users removed from the live DB. Frontend `mockListings`/`mockTransactions` deleted; checkout no longer falls back to demo data.
- **Test account created** (live): `test@swapsafe.store` / `TestSwap@2026`.
- **Repo hygiene**: untracked a stray Python venv + log files.
- **Site is live**: https://swapsafe.store (Traefik + Let's Encrypt SSL, label-based routing, isolated from PuranGPT).

---

## 1. The intention (what we're actually building)

**One-line:** A marketplace for used goods where a buyer can trust a listing *with their eyes closed* — because AI has verified the item is real, the photo is honest, and the seller is accountable.

The differentiator is **not** "another OLX/Facebook Marketplace." It's **verified trust**:

1. **The photo is real** — AI confirms the uploaded image actually depicts the claimed product (not a stock image, not a different item), then cleans it to a consistent professional standard so listings look trustworthy and comparable.
2. **The item is real** — serial/IMEI/VIN extraction + validation, condition scoring, duplicate-listing detection.
3. **The seller is real** — identity verification tiers (Unverified → Trusted → Legendary), escrow, and safe-zone meetups.
4. **The transaction is safe** — escrow-held funds, safe-zone meetup suggestions, dispute mediation.

Everything below serves that thesis.

---

## 2. AI image pipeline — current state (verified)

**Works today:**
- Background removal via **BiRefNet** (SOTA 2024) with rembg/u2netp fallback.
- White-background compositing.
- Product analysis (Gemini Flash) — name, category, condition, price estimate.
- Price reasoning (Groq Llama-3.3-70B).
- Stock-image lookup (DuckDuckGo, free).
- 3D reconstruction (TripoSR via Replicate, $0.05/img) — "Pro" 3D path.

**Stubbed / disabled (this is the quality gap):**
- **Relighting / "Pro Photo" enhancement** — `vision_service.relight_product()` is a TODO; it returns the original image unchanged. So "Pro Mode" currently does **not** relight.
- **Upscaling** (Real-ESRGAN) — implemented but disabled in pipeline (timeouts).
- **Drop shadow** — disabled.

**The hard constraint:** On the VPS the engine runs **CPU-only** (no GPU), sharing 15GB RAM with PuranGPT. Heavy diffusion relighting (IC-Light) is **not viable on this CPU** — it would take minutes and exhaust RAM. This is the single most important fact driving the recommendation below.

### Verified live test (2026-06-21)
End-to-end QuickSell test through https://swapsafe.store with the test account:
- ✅ Auth, AI-provider config (Groq+Gemini), listings API (clean/empty) all work.
- ✅ `enhance-photo` (fast mode) returns a processed image (`image_data`) in **~2s once the model is cached**.
- ⚠️ **BiRefNet does NOT run on the VPS** — `torch` is not installed in the AI-engine container, so it silently falls back to **rembg (u2net)**. Quality is lower than BiRefNet.
- ⚠️ **First-call timeout bug**: the first enhance call had to download rembg's 175MB `u2net.onnx`, exceeding the 30s proxy timeout → **504**. Now cached, so subsequent calls are fine — but a fresh container redeploy reintroduces the cold-start 504.

### Two concrete fixes (small, do before launch)
1. **Pre-bake the rembg model** into the Docker image (download `u2net.onnx` at build time) so the first request after any redeploy doesn't 504.
2. **Either** install `torch` + transformers in the AI image so BiRefNet actually runs (better quality, more RAM/CPU), **or** consciously accept rembg as the CPU-tier remover and document it. Given the CPU constraint, **accepting rembg for the free tier + Replicate for the Pro tier** is the pragmatic call.
3. Raise the `/ai/` proxy read-timeout to ~60s as a safety margin.

---

## 3. Image-quality rework — options & API pricing (no spend yet)

The goal: every listing photo looks clean, well-lit, true-to-item, and consistent. Three tiers:

### Tier A — Self-hosted only (free, current)
- Keep BiRefNet for background removal.
- **Add back** a *lightweight* enhancement that's CPU-safe: auto white-balance, CLAHE contrast, mild sharpening, white-bg composite, soft shadow. (The `enhance_service.py` code already exists — re-wire it, skip the heavy diffusion path.)
- **Pros:** $0 marginal cost, no external dependency, privacy-preserving.
- **Cons:** No true relighting/upscaling. Quality ceiling is "clean," not "studio."

### Tier B — Paid image API for the "Pro" path (per-image cost)
Use a hosted model **only** when the user explicitly taps "Pro," so cost is bounded by usage. Indicative public pricing (verify before committing — prices change):

| Provider / model | Capability | Indicative price | Notes |
|---|---|---|---|
| **Replicate** (already wired) — IC-Light, ESRGAN, etc. | relight, upscale, cleanup | ~$0.01–0.05 / run | Already have a token + $10/day cap. Lowest-friction. |
| **fal.ai** | relight / upscale / bg | ~$0.01–0.05 / image | Fast cold starts, good for on-demand. |
| **Photoroom API** | e-commerce bg removal + shadows + relight | ~$0.01–0.10 / image (tiered) | Purpose-built for product photos. |
| **remove.bg** | bg removal only | ~$0.09–0.20 / image | Just bg; BiRefNet already matches this for free. |
| **Claude / Gemini vision** | *verification & captioning, not pixel edit* | tokens (~cents) | Use for "is this photo honest?" not for editing. |

**Recommendation (Tier B):** Lean on **Replicate** (already integrated, capped) for the Pro path — wire IC-Light relight + ESRGAN upscale behind the existing "Pro Mode" toggle. Estimate **~$0.03–0.08 per Pro photo**. Free path (Tier A) stays the default.

### Tier C — Rent a GPU
Move the whole engine to a GPU host (e.g. a GPU VPS or serverless GPU) so BiRefNet + relight run in 1–2s locally. Only worth it at real volume (hundreds of photos/day). **Not recommended yet** — premature for a pre-launch marketplace.

### Proposed default
- **Free Tier A** for every upload (clean, fast-enough, $0).
- **Paid Tier B via Replicate** behind the explicit "Pro" button, with the existing daily cost cap.
- Revisit Tier C only after launch traffic justifies it.

> **Decision needed:** approve wiring Replicate IC-Light/ESRGAN into Pro Mode (bounded spend), or stay Tier-A-only for now?

---

## 4. Photo *honesty* verification (the trust core)

This is what makes the marketplace trustworthy, and it's cheap (vision tokens, not GPU):

1. **Stock-image detection** — flag if an uploaded "your item" photo is actually a stock/marketing image (reverse-image heuristics + vision model "is this a real user photo or a catalog render?").
2. **Claim-vs-image match** — Gemini/Claude vision checks the photo actually shows the claimed product & condition. Mismatch → listing flagged, not auto-published.
3. **Serial/IMEI/VIN** — extract & validate; mask for display; mark verified.
4. **Duplicate detection** — perceptual hash to catch the same photo reused across listings (resale fraud).

All of the above run server-side at listing-creation and gate the listing's `verification.status`.

---

## 5. Legalities (must-haves before real money flows)

| Item | Why | Status |
|---|---|---|
| **Razorpay KYC / business entity** | Live key is active (`rzp_live_…`) — Razorpay requires a registered business + KYC to settle funds. | Verify owner has completed this. |
| **Terms of Service + Privacy Policy** | Legal requirement; also Google OAuth/Play/store review need them. `/legal` page exists — needs real content. | Draft exists, needs legal review. |
| **Escrow / payment-flow compliance** | Holding buyer funds = regulated activity in India (RBI / payment-aggregator rules). Using Razorpay Route/escrow product keeps this compliant — don't hand-roll fund-holding. | Confirm using Razorpay's escrow/Route, not custom wallet. |
| **GST** | Marketplace facilitator may have GST collection obligations. | Consult CA. |
| **Prohibited items policy** | Block weapons, counterfeits, stolen goods, etc. — platform liability. | Needs written policy + automated checks. |
| **Data protection (DPDP Act 2023)** | India's data law — consent, deletion rights, breach notice. Storing IDs/IMEIs raises the bar. | Needs compliance pass. |
| **Grievance officer** | Required for Indian intermediaries under IT Rules. | Appoint + publish contact. |

> **Decision needed:** these need a CA + lawyer, not engineering. Flagging so they're not forgotten before real transactions.

---

## 6. AI for marketplace safety & trust — brainstorm (the big idea)

How AI makes this a marketplace people trust "with eyes closed." Grouped by where it acts:

### At listing time (gatekeeping)
- **Honesty score** (0–100) per listing from: photo-claim match, stock-image likelihood, price sanity vs market, condition-vs-photo consistency, serial validation. Low score → manual review before going live.
- **Fraud-pattern detection** — same photo across accounts, prices too-good-to-be-true, copy-pasted scam descriptions, newly-created seller + high-value item.
- **Auto-categorization & fair pricing** — reduces mislisting; flags suspicious under/over-pricing.

### At seller level (accountability)
- **Trust tiers** (already modeled: Unverified→Legendary) driven by verified ID + completed sales + dispute history + AI honesty scores. Visible to buyers.
- **Behavioral risk model** — escalate scrutiny for accounts showing scam signals.

### At transaction time (protection)
- **Escrow by default** for higher-value items (Razorpay Route).
- **Safe-zone meetup suggestions** (malls, police stations — `safeZones` exists).
- **AI dispute mediation** — vision compares delivered-item photos to listing photos; structured evidence for resolution.

### Continuous
- **Community reporting + AI triage** — auto-prioritize reports, auto-action clear violations.
- **Prohibited-item detection** — vision model blocks weapons/counterfeits/etc. at upload.

### Fair-for-everyone principles
- **Transparency:** every AI flag is explainable to the seller ("flagged because the photo appears to be a stock image"), with appeal.
- **No silent shadow-bans:** sellers see their status and how to improve it.
- **Human-in-the-loop** for high-impact actions (account suspension, listing takedown).
- **Bias guard:** trust tiers based on verifiable behavior, not proxies that disadvantage new/legit sellers — every new seller has a clear path to "Trusted."

---

## 7. Recommended sequencing

1. **(now)** Verify the QuickSell pipeline end-to-end with the test account + a real sari photo. Confirm BiRefNet works on the CPU VPS within acceptable time.
2. **(quick win)** Re-wire Tier-A CPU-safe enhancement (white balance/contrast/sharpen/shadow) so "Fast" looks clean. No spend.
3. **(decision)** Approve/deny Replicate Pro path (Tier B).
4. **(trust MVP)** Ship the listing **honesty score** + stock-image/claim-match gate — this is the actual product moat.
5. **(legal)** Owner engages CA + lawyer on §5 before real money volume.
6. **(later)** GPU host (Tier C) only if volume demands.

---

## 8. Open security flag (urgent, separate from above)

Real API keys (Gemini, Groq, Replicate) are committed in `.env` files in the repo history. These should be **rotated** and kept out of git. Tracked separately — see session notes.
