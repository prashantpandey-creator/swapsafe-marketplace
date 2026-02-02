# Future AI Strategy: The "Honest Studio" Pipeline

This document outlines the roadmap for Phase 2 and Phase 3 of the AI Engine. These phases aim to solve the fundamental tension in P2P marketplaces: **Professionalism vs. Honesty**.

## 🔹 Phase 2: True-to-Life Composite (The "Honest Studio" Shot)
**"Professional lighting, but your actual item."**

### 💡 Usefulness (Why do this?)
-   **Problem**: Stock photos (Phase 1) look perfect but are misleading—they don't show the actual scratch on the soundbar. User photos are honest but often look terrible (dim lighting, messy room).
-   **Solution**: A composite image that uses the *composition* of a stock photo but the *surface texture* of the user's item.
-   **Value**:
    -   **Trust**: Buyers see the actual condition (scratches included).
    -   **Premium Feel**: The item looks like it was photographed in a pro studio.
    -   **No "Catfishing"**: Drastically reduces returns/disputes.

### 🛠️ Technical Implementation
We will use **Stable Diffusion (SDXL)** with **ControlNet** and **IP-Adapter**.

1.  **Inputs**:
    *   **Stock Image** (from Phase 1): Provides the "Pose" (Angle/Perspective) and "Lighting Reference".
    *   **User Raw Photo**: Provides the "Texture" (Scratches/Stickers/Wear).
2.  **Pipeline**:
    *   **ControlNet (Depth/Canny)**: Extracts the geometry of the Stock Image. This forces the AI to generate an image with the exact same professional angle.
    *   **IP-Adapter (Image Prompt)**: Feeds the *features* of the User's Photo into the generation. It tells the AI "Make the surface look like *this specific* soundbar".
    *   **Inpainting**: We effectively "paint" the user's texture onto the stock photo's 3D geometry.
3.  **Result**: An image that has the stock photo's perfect white background and lighting, but the actual device's wear and tear.

---

## 🔹 Phase 3: AI Condition Analysis & Pricing
**"An expert appraiser in your pocket."**

### 💡 Usefulness (Why do this?)
-   **Problem**: Sellers guess prices ("I bought it for $500, so $450 is fair... right?"). Buyers don't trust condition ratings ("Seller says 'Good', but it looks 'Fair'").
-   **Solution**: AI analyzes the photos to objectively grade condition and suggest a fair market price.
-   **Value**:
    -   **Standardization**: "Good Condition" means the same thing for everyone.
    -   **Fair Pricing**: Helps sellers sell faster by not overpricing.
    -   **Transparency**: auto-generated "Defect Report" builds massive buyer confidence.

### 🛠️ Technical Implementation
We will use a **Multi-Modal Vision Model** (e.g., GPT-4o, Gemini Pro Vision, or LLaVA).

1.  **Input**: 3-5 raw photos from the user (uploaded in `QuickSell`).
2.  **Process**:
    *   **Defect Detection**: The Vision Model scans for specific visual features: *scratches, dents, discoloration, rust, cracked screens*.
    *   **Categorization**: It tags defects by severity (Minor/Major/Critical).
    *   **Grading**: Assigns a standard grade (Mint / Excellent / Good / Fair / Poor).
3.  **Pricing Algorithm**:
    *   **Base Price**: Fetches current market price (from eBay/Google Shopping API) for the *new* item.
    *   **Depreciation Logic**: Applies a depreciation curve based on the AI Grade (e.g., Fair = -40% of market value).
4.  **Output**: A structured report.
    ```json
    {
      "condition": "Good",
      "defects": ["Minor scratch on left bezel", "Fading on volume button"],
      "estimated_value": "$120 - $140",
      "confidence": "High"
    }
    ```
