# SwapSafe — AI Components for Frictionless Listing Creation

> The plan for the AI that turns "I have something to sell" into a live, priced, verified listing
> with the least possible effort. Companion to REVOLUTION_PLAN.md.
>
> Status: **PLAN ONLY** — no code. Written 2026-06-21.
> Parallel deep-dive on models/infra: see IMAGE_DETECTION_INFRA_PLAN.md (in progress).

---

## 0. The principle

> **Effort is the enemy. Every tap we remove is a listing that exists instead of one that didn't.**

The magic moment we are engineering: **user says/shows what it is → "boom, listing created"** (image + title + description + price + verification) → user can edit anything → done. The AI does the work; the human only confirms.

We support **three on-ramps** to that moment, because users arrive in different states:

| On-ramp | User has | Speed | Trust |
|---------|----------|-------|-------|
| **A. Snap-to-Sell** | A real photo (even a bad one) | Fast | Highest (real item → Verifiable) |
| **B. Name-to-Sell** | Just knows what it is | Fastest | Lower (stock image → Unverified until real photo) |
| **C. Voice/Describe** | Can describe it | Fast | Depends on photo added |

All three converge into the **same creation engine** and the **same edit-after step**.

---

## 1. The on-ramps in detail

### On-ramp A — Snap-to-Sell (camera-first, "fix my shit photo")
The hero flow. The user shoots straight from the app — bad lighting, messy background, whatever — and we make it look like a product shot.

**Steps the user feels:**
1. Tap "Sell" → camera opens (or pick from gallery).
2. Snap the item (we can prompt: "got another angle?" — optional).
3. *Wait ~2–5s* → AI has identified it, cleaned the photo, written the listing, and priced it.
4. A finished listing preview appears. Edit anything. Publish.

**AI components firing here:** Image Detection → Photo Enhancement → Listing Writer → Price Estimator → Trust/Verify → Publish. (Detailed in §2.)

**Why "even a shit photo" matters:** removing the "I need to take a *good* photo" anxiety is a huge friction kill. The app's promise is literally *"your bad photo becomes a good one."*

### On-ramp B — Name-to-Sell (no good photo, add later)
For when the user can't/won't photograph well right now, or the item isn't in front of them.

**Steps the user feels:**
1. Tap "Sell" → "Don't have a photo? Just tell us what it is."
2. **We prompt for the exact product name** — "iPhone 12 128GB Blue", "Kanjivaram silk saree red". *(Your call: the exact name supercharges both stock-image lookup and price accuracy — so we actively ask for it and explain why: "the exact name helps us price it right and find a photo.")*
3. AI fetches a **representative stock image**, writes the listing, estimates the price.
4. Listing preview appears, clearly marked **"Representative image — not verified."**
5. User publishes. A persistent nudge: **"Add a real photo to unlock the Verified badge."**

**Honesty handling (locked decision):**
- Stock-image listings go live fast but are **labeled clearly as representative/unverified**.
- The **Verified badge + money-back guarantee only unlock when the user adds their real photo** (which then runs the full honesty pipeline).
- This keeps speed *and* keeps the trust system honest — a stock photo can never be "Verified" because it isn't the real item.

### On-ramp C — Voice/Describe
Same as B but the input is natural language / voice: "selling my 2-year-old Dell laptop, i5, works fine, small scratch on lid." AI parses it into structured fields + everything else. Lowest typing effort; great for accessibility and speed.

---

## 2. The AI components (the engine behind "boom, created")

These are the reusable building blocks. Each on-ramp just calls the subset it needs.

### Component 1 — **Image Detection** (the "what is it?" brain)
- **Input:** a photo (A) or none (B/C).
- **Output:** product name, brand, model, variant, category, attributes, and a **condition assessment** from visible wear.
- **Also produces:** the data that powers title, price, stock-lookup, and the claim-vs-photo honesty check.
- *Models & infra: being worked in the parallel IMAGE_DETECTION_INFRA_PLAN. Current stack = Gemini Flash + Qwen-VL.*

### Component 2 — **Photo Enhancement** (the "make it look good" engine)
- **Input:** the user's real photo.
- **Output:** clean, consistent, trustworthy product image — background removed, white/clean studio look, good framing.
- **Free tier:** rembg-based bg removal + lightweight CPU-safe cleanup (white balance, contrast, sharpen, white composite, soft shadow).
- **Pro tier:** paid API (Replicate/fal/Photoroom) for relighting/upscaling — behind the explicit "Pro" toggle, bounded cost.
- *Note: "Pro" relighting is currently stubbed; fixing it is in the infra plan.*

### Component 3 — **Stock-Image Fetcher** (the "no photo" path)
- **Input:** exact product name (we prompt for it).
- **Output:** a representative image, clearly labeled, never eligible for Verified.
- **Sources:** current = DuckDuckGo (free); better options (retailer APIs, product DB, paid image APIs) evaluated in the infra plan. The internal **ProductDatabase** (already in code) should be the first lookup — if we have a clean reference image for that brand+model, use it.

### Component 4 — **Listing Writer** (the "write it for me" engine)
- **Input:** detected/declared product + attributes + condition.
- **Output:** title, structured description, spec bullets, condition statement — in a consistent, trustworthy house style.
- **Model:** LLM (Groq Llama-3.3-70B is wired and free-tier; upgrade path to better models for quality).
- Editable by the user after generation.

### Component 5 — **Price Estimator** (the "boom, priced" engine)
- **Input:** product + condition + (optionally) market signals.
- **Output (locked decision): ALWAYS a number + a confidence range**, even from minimal input. E.g. "₹28,000 (range ₹24k–₹32k, medium confidence)."
- More info → tighter range + higher confidence. The exact product name (from on-ramp B prompt) sharply improves this.
- Shows a recommended price + a floor (used later by the negotiation agent).
- **Model:** market-comp reasoning via LLM + (future) real comparable-sales data. Be transparent about confidence so users trust the number.

### Component 6 — **Trust/Verify** (the honesty gate)
- Runs on real photos (A, or B-after-real-photo-added): photo-honesty, claim-vs-image match, serial/IMEI extraction, price-sanity, duplicate detection.
- Produces the **Trust Score** + unlocks the **Verified badge**.
- *(Full design in REVOLUTION_PLAN Pillar 1.)*

### Component 7 — **Publish + Interconnect**
- Listing goes live, indexed into the circular-economy graph (embeddings for wants↔haves matching).
- Starts (or extends) the item's **Digital Passport**.

---

## 3. The unified creation flow (all on-ramps converge)

```
          ┌─────────── On-ramp A: SNAP ───────────┐
          │   user photo (even bad)               │
          │        │                              │
          │        ▼                              │
          │  [1] Image Detection ──► what is it?  │
          │        │                              │
          │        ▼                              │
          │  [2] Photo Enhancement ─► clean image │
          └────────┬──────────────────────────────┘
                   │
          ┌────────┴── On-ramp B: NAME ───────────┐
          │   "iPhone 12 128GB Blue"              │
          │        │  (we PROMPT for exact name)  │
          │        ▼                              │
          │  [3] Stock-Image Fetcher ─► repr. img │
          │        │  (labeled unverified)        │
          └────────┬──────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │  [4] Listing Writer          │  title + description
        │  [5] Price Estimator         │  number + range (ALWAYS)
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   ★ BOOM — LISTING CREATED ★ │  ◄── the magic moment
        │   (preview, everything filled)│
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  User edits anything (optional)│
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  [6] Trust/Verify (real photo)│  ─► Verified badge or "add real photo"
        │  [7] Publish + Interconnect   │  ─► live + passport started
        └──────────────────────────────┘
```

**Key UX rule:** the listing is **created before the user is asked to do anything else.** They react to a finished thing (edit/approve), they don't fill a form. That inversion — *generate first, edit second* — is the whole feeling of "so damn easy."

---

## 4. Decisions locked in this session

| Decision | Choice |
|----------|--------|
| Bad-photo path | Camera-first; AI enhances even poor photos (on-ramp A). |
| No-photo path | Stock image, **prompt user for exact product name** (helps price + image a lot). |
| Stock-photo honesty | Go live but **labeled "representative — not verified"**; Verified badge unlocks only when real photo added. |
| Price with low info | **Always give a number + range**; tighten with more info. |
| Image detection + infra | **Spawned as a parallel work session** → IMAGE_DETECTION_INFRA_PLAN.md. |
| Creation philosophy | **Generate-first, edit-second.** Listing exists before the user does form work. |

---

## 5. Open questions for later (not blocking the plan)

- Voice input (on-ramp C) — phase it in after A/B prove out.
- How many real photos to require for the Verified badge (1? front+back? category-dependent?).
- Negotiation agent's exact rule schema (floor price, swap-acceptable, auto-accept threshold).
- Whether stock-photo listings should expire/downrank if no real photo is added within N days (anti-clutter).

---

## 6. How this maps to the roadmap (REVOLUTION_PLAN phases)

- **Phase 0–1:** On-ramp A (snap → clean → write → price → verify) + Trust Score v1. This is the core.
- **Phase 2 (Automated Mode):** add on-ramp B (name-to-sell), the negotiation companion, and autonomy levels. This is where "boom, created" becomes the talked-about feature.
- **Phase 3+:** passport accrual, wants↔haves, personalization.

---

## The one line

> **We don't ask the user to make a listing. We make it for them — from a photo, a name, or a sentence — and let them just say "yes."**
