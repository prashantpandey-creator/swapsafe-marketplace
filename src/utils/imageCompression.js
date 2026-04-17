/**
 * Client-side image compression utility
 * Compresses images before upload to reduce bandwidth and improve performance
 */

/**
 * Compress an image file to a target size
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxSizeMB - Maximum file size in MB (default: 2)
 * @param {number} options.maxWidthOrHeight - Maximum width or height (default: 1920)
 * @param {number} options.quality - Image quality 0-1 (default: 0.8)
 * @returns {Promise<File>} Compressed image file
 */
export async function compressImage(file, options = {}) {
    const {
        maxSizeMB = 2,
        maxWidthOrHeight = 1920,
        quality = 0.8
    } = options;

    // If file is already small enough, return it
    if (file.size / 1024 / 1024 < maxSizeMB) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidthOrHeight) {
                        height = (height * maxWidthOrHeight) / width;
                        width = maxWidthOrHeight;
                    }
                } else {
                    if (height > maxWidthOrHeight) {
                        width = (width * maxWidthOrHeight) / height;
                        height = maxWidthOrHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Canvas to Blob conversion failed'));
                            return;
                        }

                        // Create new file from blob
                        const compressedFile = new File(
                            [blob],
                            file.name,
                            {
                                type: file.type,
                                lastModified: Date.now()
                            }
                        );

                        resolve(compressedFile);
                    },
                    file.type,
                    quality
                );
            };

            img.onerror = () => reject(new Error('Image load failed'));
            img.src = e.target.result;
        };

        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
    });
}

/**
 * Validate image file
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateImageFile(file, options = {}) {
    const {
        maxSizeMB = 10,
        allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    } = options;

    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
        };
    }

    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > maxSizeMB) {
        return {
            valid: false,
            error: `File too large (${sizeMB.toFixed(1)}MB). Maximum: ${maxSizeMB}MB`
        };
    }

    return { valid: true, error: null };
}

/**
 * Get image dimensions
 * @param {File} file - Image file
 * @returns {Promise<{width: number, height: number}>}
 */
export function getImageDimensions(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Convert image to base64
 * @param {File} file - Image file
 * @returns {Promise<string>} Base64 string
 */
export function imageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}
