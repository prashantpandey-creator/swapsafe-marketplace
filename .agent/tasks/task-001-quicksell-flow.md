# TASK-001: Fix QuickSell Flow

## Objective
Make QuickSell require product details (brand/model/category) BEFORE allowing AI photo enhancement.

## File Lock
- **MODIFY:** `src/pages/QuickSell.jsx`
- **READ-ONLY:** `server/routes/ai.js`, `src/services/api.js`
- **AVOID:** (files other agents edit)

## Context
Currently, users can click "Enhance Photo" before entering any product details. The AI enhancement should use product knowledge, so we need the flow to be:
1. Upload photo
2. Enter brand + model + category
3. THEN unlock AI enhancement

## Detailed Steps

### 1. Add Helper Function
Add a `canEnhancePhoto()` function that checks:
```javascript
const canEnhancePhoto = () => {
    return productImage && imageFile && formData.brand && formData.model && formData.category;
};
```

### 2. Update Small Enhance Button
Find the overlay enhance button (around line 433-441) and replace with a hint:
```jsx
{!enhancedImage && productImage && !isEnhancing && !canEnhancePhoto() && (
    <div className="absolute bottom-3 left-3 bg-black/60 text-gray-300 text-xs px-3 py-1.5 rounded-full">
        Fill in brand & model to enhance
    </div>
)}
```

### 3. Update Big Enhance Card
Change condition from `(formData.brand || formData.model)` to `canEnhancePhoto()`.

### 4. Add Progress Hint
Show what's missing when user partially fills form:
```jsx
{!canEnhancePhoto() && (formData.brand || formData.model || formData.category) && (
    <div>Need: {!formData.brand && 'Brand '}{!formData.model && 'Model '}{!formData.category && 'Category'}</div>
)}
```

## Verification
- Build with `npm run build`
- Test: Upload image → enhancement locked
- Enter brand/model/category → enhancement unlocks

## Agent Instructions
Copy this entire file and paste into a new agent conversation window to begin this task.
