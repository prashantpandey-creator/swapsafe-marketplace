# AGENT-A: Frontend Detailed Logging

## Objective
Add step-by-step status display to QuickSell enhance flow so user sees exactly what's happening.

## File Lock
- **MODIFY:** `src/pages/QuickSell.jsx`
- **AVOID:** `server/routes/ai.js` (Agent B), `ai-engine/*` (Agent C)

## Context
When user clicks "Create Pro Photo", they see loading but no feedback on what's happening or where it fails.

## Detailed Steps

### 1. Add Status State
```javascript
const [enhanceStatus, setEnhanceStatus] = useState('');
const [enhanceStage, setEnhanceStage] = useState(0);

const ENHANCE_STAGES = [
    'Preparing image...',
    'Sending to AI engine...',
    'Removing background...',
    'Adding white background...',
    'Creating showcase photo...',
    'Done!'
];
```

### 2. Update enhancePhoto Function
Add status updates at each stage:
```javascript
const enhancePhoto = async (file, productName = '') => {
    setIsEnhancing(true);
    setEnhanceError(null);
    setEnhanceStatus('Preparing image...');
    setEnhanceStage(0);

    try {
        // Stage 1: Convert to base64
        setEnhanceStatus('Converting image...');
        setEnhanceStage(1);
        const reader = new FileReader();
        // ...existing code...
        
        // Stage 2: Sending to backend
        setEnhanceStatus('Sending to AI engine...');
        setEnhanceStage(2);
        console.log('📤 Sending request to:', `${API_URL}/ai/enhance-photo`);
        
        const response = await fetch(...);
        console.log('📥 Response status:', response.status);
        
        // Stage 3: Processing response
        setEnhanceStatus('Processing response...');
        setEnhanceStage(3);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Result:', result.success, result.product_matched);
            setEnhanceStatus('Done!');
            setEnhanceStage(4);
        } else {
            const errorData = await response.json();
            console.error('❌ Error:', errorData);
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('💥 Enhance failed:', error);
        setEnhanceStatus(`Failed: ${error.message}`);
        setEnhanceError(error.message);
    }
};
```

### 3. Show Status in UI
Update the enhance button/card to show current stage:
```jsx
{isEnhancing && (
    <div className="space-y-2">
        <p className="text-sm text-gray-300">{enhanceStatus}</p>
        <div className="flex gap-1">
            {ENHANCE_STAGES.map((_, idx) => (
                <div key={idx} className={`h-1 flex-1 rounded ${idx <= enhanceStage ? 'bg-legion-gold' : 'bg-gray-700'}`} />
            ))}
        </div>
    </div>
)}
```

## Verification
- Click enhance → see each stage updating
- Console shows detailed logs
- If fails, error shows which stage failed

## Agent Instructions
Copy this entire content into a new conversation window.
