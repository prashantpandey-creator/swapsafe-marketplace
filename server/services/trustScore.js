// Trust Score Service — SwapSafe's fraud-detection brain.
//
// Combines several CHEAP, EXPLAINABLE signals into one confidence-graded
// 0-100 Trust Score. This is intentionally NOT a single "scam: yes/no" model
// (no such model exists honestly). It's a stack of independent checks, each of
// which catches a different kind of lie and reports its OWN confidence.
//
// Design rules:
//   1. Every signal returns { score, confidence, verdict, explanation } —
//      never a bare boolean. We never claim certainty we don't have.
//   2. Advisory-first. This service computes and explains; the caller decides
//      whether to nudge, soft-gate the badge, or block. We do NOT hard-reject.
//   3. Signals degrade gracefully. If a vision call fails, that signal is
//      marked "unavailable" (low confidence) and the score reflects that —
//      we never fail the whole listing because one check errored.
//
// Signals (v1):
//   A. Price sanity  — too-good-to-be-true / gouging vs market band. Free math.
//   B. Honesty diff  — vision: does the photo show defects the seller omitted?
//   C. Claim match   — vision: does the photo actually show the claimed product?
//
// Photo-theft (pHash/CLIP) is a separate service that plugs in as signal D once
// image hashing is wired; this file is structured so adding it is one entry.

import { analyzeImages, parseJSON } from './ai.js';

// Weights for combining signals into the final score. They sum to 1.0 over the
// signals that were actually AVAILABLE (confidence > 0), so an unavailable
// signal doesn't silently drag the score down — it's excluded and noted.
const SIGNAL_WEIGHTS = {
    priceSanity: 0.25,
    honestyDiff: 0.45, // the heaviest — undisclosed damage is the core fraud
    claimMatch: 0.30,
};

// Condition → expected fraction of retail. Mirrors getFallbackPriceEstimate so
// price-sanity uses the same mental model the rest of the app already uses.
const CONDITION_MULTIPLIER = {
    'new': 1.0,
    'like-new': 0.85,
    'good': 0.70,
    'fair': 0.50,
    'poor': 0.30,
};

/**
 * Signal A — Price sanity.
 * Pure math, zero cost, zero AI. Compares asking price to a market band derived
 * from retail × condition multiplier. Flags BOTH directions:
 *   - far below band  → classic scam bait ("too good to be true")
 *   - far above band  → gouging (less dangerous, but erodes trust)
 *
 * @returns {{score:number, confidence:number, verdict:string, explanation:string}}
 */
export function checkPriceSanity({ price, retailPrice, condition }) {
    // Without a retail anchor we can't judge fairness — say so honestly.
    if (!retailPrice || retailPrice <= 0) {
        return {
            score: 50,
            confidence: 20,
            verdict: 'unknown',
            explanation: 'No retail reference available, so price fairness could not be assessed.',
        };
    }

    const mult = CONDITION_MULTIPLIER[condition] ?? 0.70;
    const expected = retailPrice * mult;
    const ratio = price / expected; // 1.0 = bang on the expected used price

    // Bands chosen to be forgiving — real prices vary a lot. We only flag the
    // genuinely suspicious tails.
    if (ratio < 0.35) {
        return {
            score: 15,
            confidence: 75,
            verdict: 'suspicious_low',
            explanation: `Asking ₹${Math.round(price)} is far below the ~₹${Math.round(expected)} expected for a ${condition} item — a common sign of scam bait. Verify before trusting.`,
        };
    }
    if (ratio < 0.6) {
        return {
            score: 55,
            confidence: 60,
            verdict: 'low',
            explanation: `Priced below the typical ${condition} range (~₹${Math.round(expected)}). Could be a genuine deal, but worth a second look.`,
        };
    }
    if (ratio > 1.5) {
        return {
            score: 60,
            confidence: 60,
            verdict: 'high',
            explanation: `Priced above the typical ${condition} range (~₹${Math.round(expected)}). Not fraud, but buyers may negotiate.`,
        };
    }
    return {
        score: 90,
        confidence: 70,
        verdict: 'fair',
        explanation: `Price is in line with the market for a ${condition} item (~₹${Math.round(expected)}).`,
    };
}

/**
 * Signals B & C — both vision calls over the SELLER'S ORIGINAL photo.
 * We run them in ONE Gemini call (cheaper, and the model reasons about claim
 * and condition together). Always uses the original photo, never the enhanced
 * one — enhancement can hide or invent detail.
 *
 * @returns {{ honestyDiff: object, claimMatch: object, blemishes: array }}
 */
export async function checkPhotoHonesty({ images, title, description, condition, productName }, options = {}) {
    const unavailable = (why) => ({
        honestyDiff: { score: 50, confidence: 0, verdict: 'unavailable', explanation: why },
        claimMatch: { score: 50, confidence: 0, verdict: 'unavailable', explanation: why },
        blemishes: [],
    });

    if (!images || images.length === 0) {
        return unavailable('No photo provided, so the photo could not be checked against the description.');
    }

    const prompt = `You are a careful, fair marketplace inspector for used goods in India.
You are shown a SELLER'S OWN photo of an item they want to sell.

Their listing claims:
- Title: ${title || '(none)'}
- Product: ${productName || '(none)'}
- Stated condition: ${condition || '(none)'}
- Description: ${description || '(none)'}

Do TWO things, looking ONLY at what is actually visible in the photo:

1. CLAIM MATCH — Does the photo plausibly show the claimed product? Be fair:
   a slightly different angle or lighting is fine. Only flag a real mismatch
   (e.g. claims "iPhone 14 Pro" but photo shows an Android, or claims a guitar
   but photo shows a speaker).

2. HONESTY DIFF — List any visible defects, wear, or damage that the description
   does NOT already mention. Be specific about LOCATION (e.g. "scuff on
   bottom-left bezel", "scratch on lid"). If the item genuinely looks consistent
   with the stated condition and nothing undisclosed is visible, return an empty
   list — do NOT invent flaws.

Respond ONLY with valid JSON in this exact shape:
{
  "claim_match": {
    "matches": true,
    "confidence": 0-100,
    "explanation": "one short sentence"
  },
  "honesty": {
    "consistent_with_condition": true,
    "confidence": 0-100,
    "undisclosed_issues": [
      { "type": "scratch|dent|crack|wear|stain|missing_part|other",
        "location": "where on the item",
        "severity": "minor|moderate|major" }
    ],
    "explanation": "one short sentence, friendly and specific"
  }
}`;

    let raw;
    try {
        raw = await analyzeImages(images, prompt, { provider: options.provider });
    } catch (err) {
        return unavailable(`Photo check could not run (${err.message}). It will not affect the score.`);
    }

    const parsed = parseJSON(raw.text);
    if (!parsed || !parsed.claim_match || !parsed.honesty) {
        return unavailable('The photo check returned an unreadable result and was skipped.');
    }

    // ---- Claim match → signal ----
    const cm = parsed.claim_match;
    const claimMatch = cm.matches
        ? {
            score: 90,
            confidence: clamp(cm.confidence, 0, 100),
            verdict: 'match',
            explanation: cm.explanation || 'The photo is consistent with the described product.',
        }
        : {
            score: 20,
            confidence: clamp(cm.confidence, 0, 100),
            verdict: 'mismatch',
            explanation: cm.explanation || 'The photo may not match the described product.',
        };

    // ---- Honesty diff → signal ----
    const h = parsed.honesty;
    const issues = Array.isArray(h.undisclosed_issues) ? h.undisclosed_issues : [];
    const severityHit = issues.reduce((acc, i) => {
        if (i.severity === 'major') return acc + 35;
        if (i.severity === 'moderate') return acc + 18;
        return acc + 8; // minor
    }, 0);
    const honestyScore = clamp(100 - severityHit, 5, 100);

    const honestyDiff = {
        score: honestyScore,
        confidence: clamp(h.confidence, 0, 100),
        verdict: issues.length === 0 ? 'consistent' : 'undisclosed_issues',
        explanation: issues.length === 0
            ? (h.explanation || 'The photo looks consistent with the stated condition.')
            : (h.explanation || `${issues.length} thing(s) visible in the photo aren't mentioned in the description.`),
        // surfaced to the UI as the friendly pre-publish nudge
        issues,
    };

    // blemishes shaped to drop straight into Listing.conditionAnalysis.blemishes
    const blemishes = issues.map((i) => ({
        type: i.type || 'other',
        location: i.location || 'unspecified',
        severity: i.severity === 'major' ? 'major' : i.severity === 'moderate' ? 'moderate' : 'minor',
    }));

    return { honestyDiff, claimMatch, blemishes };
}

/**
 * Combine available signals into a final, confidence-graded Trust Score.
 * Signals with confidence 0 (unavailable) are excluded from the weighting and
 * listed under `unavailable` so the result is honest about what it couldn't check.
 *
 * @returns {{ trustScore:number, confidence:number, band:string,
 *             signals:object, unavailable:string[], blemishes:array, summary:string }}
 */
export async function computeTrustScore(listing, options = {}) {
    const { title, description, condition, price, retailPrice, productName, images } = listing;

    // Signal A (free, sync)
    const priceSanity = checkPriceSanity({ price, retailPrice, condition });

    // Signals B & C (one vision call)
    const { honestyDiff, claimMatch, blemishes } = await checkPhotoHonesty(
        { images, title, description, condition, productName },
        options
    );

    const signals = { priceSanity, honestyDiff, claimMatch };

    // Weighted blend over AVAILABLE signals only.
    let weightedSum = 0;
    let weightUsed = 0;
    const unavailable = [];
    for (const [key, sig] of Object.entries(signals)) {
        if (!sig || sig.confidence <= 0) {
            unavailable.push(key);
            continue;
        }
        // each signal's effective weight is scaled by its own confidence, so a
        // low-confidence signal moves the score less than a sure one.
        const w = (SIGNAL_WEIGHTS[key] ?? 0) * (sig.confidence / 100);
        weightedSum += sig.score * w;
        weightUsed += w;
    }

    const trustScore = weightUsed > 0 ? Math.round(weightedSum / weightUsed) : 50;

    // Overall confidence = how much of the intended signal weight we actually had.
    const totalIntendedWeight = Object.values(SIGNAL_WEIGHTS).reduce((a, b) => a + b, 0);
    const availableIntendedWeight = Object.entries(SIGNAL_WEIGHTS)
        .filter(([k]) => signals[k] && signals[k].confidence > 0)
        .reduce((a, [, w]) => a + w, 0);
    const confidence = Math.round((availableIntendedWeight / totalIntendedWeight) * 100);

    const band = trustScore >= 80 ? 'high'
        : trustScore >= 55 ? 'medium'
            : trustScore >= 35 ? 'low'
                : 'flagged';

    return {
        trustScore,
        confidence,
        band,
        signals,
        unavailable,
        blemishes,
        summary: buildSummary(band, signals, unavailable),
    };
}

function buildSummary(band, signals, unavailable) {
    const parts = [];
    if (signals.claimMatch.verdict === 'mismatch') parts.push('photo may not match the listing');
    if (signals.honestyDiff.verdict === 'undisclosed_issues') parts.push('possible undisclosed wear');
    if (signals.priceSanity.verdict === 'suspicious_low') parts.push('price unusually low');
    if (unavailable.length) parts.push(`${unavailable.length} check(s) unavailable`);

    if (band === 'high' && parts.length === 0) return 'Looks trustworthy across all checks.';
    if (parts.length === 0) return 'No specific red flags, but confidence is limited.';
    return `Worth a look: ${parts.join('; ')}.`;
}

function clamp(n, lo, hi) {
    const x = Number(n);
    if (Number.isNaN(x)) return lo;
    return Math.max(lo, Math.min(hi, x));
}
