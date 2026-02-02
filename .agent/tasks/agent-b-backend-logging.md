# AGENT-B: Backend Request Logging

## Objective
Add detailed logging to Node.js backend /enhance-photo route to trace the request flow.

## File Lock
- **MODIFY:** `server/routes/ai.js`
- **AVOID:** `src/pages/QuickSell.jsx` (Agent A), `ai-engine/*` (Agent C)

## Context
Backend receives request from frontend and proxies to Python AI engine. Need to log each step.

## Detailed Steps

### 1. Update /enhance-photo Route
Add detailed console logs at each step:

```javascript
router.post('/enhance-photo', async (req, res) => {
    console.log('═══════════════════════════════════════');
    console.log('🎨 ENHANCE-PHOTO REQUEST RECEIVED');
    console.log('═══════════════════════════════════════');
    
    const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';
    console.log('🌐 AI Engine URL:', AI_ENGINE_URL);

    try {
        const { imageData, productName, fileName, brand, model, category } = req.body;
        
        console.log('📥 Request body:');
        console.log('  - productName:', productName);
        console.log('  - brand:', brand);
        console.log('  - model:', model);
        console.log('  - category:', category);
        console.log('  - imageData length:', imageData?.length || 0);
        console.log('  - fileName:', fileName);

        if (!imageData) {
            console.log('❌ FAILED: No imageData');
            return res.status(400).json({...});
        }

        // ProductDatabase lookup
        console.log('🔍 Looking up ProductDatabase...');
        // ... existing lookup code ...
        console.log('📦 Product match:', !!productMatch);
        console.log('🖼️ Reference URL:', referenceImageUrl || 'none');

        // Convert base64
        console.log('🔄 Converting base64 to buffer...');
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        console.log('📊 Buffer size:', imageBuffer.length, 'bytes');

        // Create FormData
        console.log('📝 Creating FormData for Python...');
        const FormData = (await import('form-data')).default;
        const formData = new FormData();
        formData.append('file', imageBuffer, { filename: fileName || 'image.jpg', contentType: 'image/jpeg' });
        // ... append other fields ...

        // Send to Python
        console.log('📤 Sending to Python AI Engine...');
        console.log('   URL:', `${AI_ENGINE_URL}/api/v1/studio/enhance`);
        
        const startTime = Date.now();
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${AI_ENGINE_URL}/api/v1/studio/enhance`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });
        
        console.log('📥 Python response in', Date.now() - startTime, 'ms');
        console.log('   Status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Python error:', errorText);
            throw new Error(`AI Engine returned ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ SUCCESS');
        console.log('   - image_data length:', result.image_data?.length || 0);
        console.log('═══════════════════════════════════════');

        res.json({...});

    } catch (error) {
        console.log('💥 ERROR:', error.message);
        console.log('═══════════════════════════════════════');
        // ... error handling ...
    }
});
```

## Verification
- Trigger enhance from frontend
- Check server terminal for detailed logs
- Identify exact failure point

## Agent Instructions
Copy this entire content into a new conversation window.
