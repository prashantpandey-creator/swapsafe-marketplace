import { useState, useCallback } from 'react';
import { compressImage, validateImageFile } from '../utils/imageCompression';

/**
 * Custom hook for photo enhancement with BiRefNet
 * Handles upload, compression, API calls, retries, and error handling
 */
export const usePhotoEnhancement = () => {
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [originalImage, setOriginalImage] = useState(null);
    const [enhancedImage, setEnhancedImage] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds

    /**
     * Sleep utility for retry delays
     */
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    /**
     * Enhance a photo with automatic retries
     */
    const enhancePhoto = useCallback(async (file, options = {}) => {
        setIsEnhancing(true);
        setError(null);
        setProgress(10);

        try {
            // Step 1: Validate file
            const validation = validateImageFile(file, {
                maxSizeMB: 10,
                allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            });

            if (!validation.valid) {
                throw new Error(validation.error);
            }

            setProgress(20);

            // Step 2: Compress image
            const compressedFile = await compressImage(file, {
                maxSizeMB: 2,
                maxWidthOrHeight: 1920,
                quality: 0.85
            });

            setProgress(30);

            // Store original
            const originalUrl = URL.createObjectURL(compressedFile);
            setOriginalImage(originalUrl);

            // Step 3: Upload with retries
            let lastError = null;
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    setProgress(30 + (attempt - 1) * 20);

                    const formData = new FormData();
                    formData.append('file', compressedFile);

                    // Add optional parameters
                    if (options.productName) {
                        formData.append('product_name', options.productName);
                    }
                    if (options.category) {
                        formData.append('category', options.category);
                    }

                    const response = await fetch(`${API_BASE_URL}/ai/enhance-photo`, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            // Let browser set Content-Type with boundary for multipart
                        },
                        signal: AbortSignal.timeout(60000) // 60 second timeout
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    setProgress(80);

                    // Get enhanced image from JSON response
                    const data = await response.json();

                    if (!data.success || !data.image_data) {
                        throw new Error(data.error || 'Enhancement returned no image data');
                    }

                    const enhancedUrl = data.image_data;
                    setEnhancedImage(enhancedUrl);

                    setProgress(100);
                    setIsEnhancing(false);

                    return {
                        success: true,
                        originalUrl,
                        enhancedUrl,
                        originalSize: file.size,
                        compressedSize: compressedFile.size
                    };

                } catch (err) {
                    lastError = err;
                    console.error(`Enhancement attempt ${attempt}/${MAX_RETRIES} failed:`, err);

                    if (attempt < MAX_RETRIES) {
                        // Wait before retry
                        await sleep(RETRY_DELAY * attempt);
                    }
                }
            }

            // All retries failed
            throw new Error(`Enhancement failed after ${MAX_RETRIES} attempts: ${lastError.message}`);

        } catch (err) {
            console.error('Photo enhancement error:', err);
            setError(err.message);
            setIsEnhancing(false);
            setProgress(0);

            return {
                success: false,
                error: err.message
            };
        }
    }, [API_BASE_URL]);

    /**
     * Reset state
     */
    const reset = useCallback(() => {
        setIsEnhancing(false);
        setProgress(0);
        setError(null);
        if (originalImage) URL.revokeObjectURL(originalImage);
        if (enhancedImage) URL.revokeObjectURL(enhancedImage);
        setOriginalImage(null);
        setEnhancedImage(null);
    }, [originalImage, enhancedImage]);

    return {
        enhancePhoto,
        reset,
        isEnhancing,
        progress,
        error,
        originalImage,
        enhancedImage
    };
};
