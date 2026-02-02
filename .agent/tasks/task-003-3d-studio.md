# TASK-003: Fix 3D Studio

## Objective
Fix 3D Studio stuck loading by adding timeout, progress steps, error handling, and demo mode indicator.

## File Lock
- **MODIFY:** `src/pages/ThreeDStudio.jsx`
- **READ-ONLY:** `src/services/api.js`
- **AVOID:** `src/pages/QuickSell.jsx` (Agent 1), `server/routes/ai.js` (Agent 2)

## Context
The 3D Studio hangs indefinitely because:
1. TripoSR returns sample models (demo mode)
2. No timeout on API calls
3. No cancel button or error handling

## Detailed Steps

### 1. Add Timeout with AbortController
```javascript
const TIMEOUT_MS = 30000;
const abortControllerRef = useRef(null);

// In handleGenerate:
abortControllerRef.current = new AbortController();
const abortTimer = setTimeout(() => {
    abortControllerRef.current?.abort();
}, TIMEOUT_MS);
```

### 2. Add Progress Steps
```javascript
const PROCESSING_STEPS = [
    { label: 'Uploading image...', duration: 2000 },
    { label: 'Analyzing depth...', duration: 3000 },
    { label: 'Generating mesh...', duration: 4000 },
    { label: 'Texturing model...', duration: 3000 },
    { label: 'Exporting GLB...', duration: 2000 }
];
```

### 3. Add Demo Mode Banner
```jsx
<div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-400 px-4 py-2 rounded-full text-sm">
    <Sparkles size={16} />
    <span>Demo Mode - Using sample 3D models</span>
</div>
```

### 4. Add Cancel Button
```jsx
<button onClick={() => abortControllerRef.current?.abort()}>
    Cancel
</button>
```

### 5. Add Error Handling with Retry
```jsx
{error && (
    <div>
        <p>{error}</p>
        <button onClick={handleGenerate}>Retry</button>
    </div>
)}
```

## Verification
- Test: Upload image, start generation, verify steps animate
- Test: Wait 30s, should timeout with error
- Test: Click Cancel, should stop immediately
- Test: Retry button should work

## Agent Instructions
Copy this entire file and paste into a new agent conversation window to begin this task.
