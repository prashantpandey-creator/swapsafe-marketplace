// API Service for SwapSafe Backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔌 API Service Initialized');
console.log('🌍 API URL:', API_URL);

// Helper to get auth token
const getToken = () => localStorage.getItem('swapsafe_token');

// Helper for API requests
const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const config = {
        signal: controller.signal,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    console.log(`📡 Fetching: ${API_URL}${endpoint}`);

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        clearTimeout(id);

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ API Error Response:', data);
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        clearTimeout(id);
        console.error(`💥 Network/Fetch Error for ${endpoint}:`, error);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Server might be down.');
        }
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to server. Please check your connection.');
        }
        throw error;
    }
};

// ============ Auth API ============

export const authAPI = {
    register: async (name, email, password) => {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });

        if (data.token) {
            localStorage.setItem('swapsafe_token', data.token);
        }

        return data;
    },

    login: async (email, password) => {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.token) {
            localStorage.setItem('swapsafe_token', data.token);
        }

        return data;
    },

    logout: () => {
        localStorage.removeItem('swapsafe_token');
        localStorage.removeItem('swapsafe_user');
    },

    getProfile: async () => {
        return await apiRequest('/auth/me');
    },

    updateProfile: async (profileData) => {
        return await apiRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }
};

// ============ Listings API ============

export const listingsAPI = {
    getAll: async (filters = {}) => {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value);
            }
        });

        const queryString = params.toString();
        return await apiRequest(`/listings${queryString ? `?${queryString}` : ''}`);
    },

    getById: async (id) => {
        return await apiRequest(`/listings/${id}`);
    },

    create: async (listingData) => {
        return await apiRequest('/listings', {
            method: 'POST',
            body: JSON.stringify(listingData)
        });
    },

    update: async (id, listingData) => {
        return await apiRequest(`/listings/${id}`, {
            method: 'PUT',
            body: JSON.stringify(listingData)
        });
    },

    delete: async (id) => {
        return await apiRequest(`/listings/${id}`, {
            method: 'DELETE'
        });
    },

    getByUser: async (userId) => {
        return await apiRequest(`/listings/user/${userId}`);
    },

    getMyListings: async () => {
        return await apiRequest('/listings/my/all');
    }
};

// ============ AI API ============

export const aiAPI = {
    estimatePrice: async (itemData) => {
        return await apiRequest('/ai/estimate-price', {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
    },

    verifyItem: async (listingId, listingImages, receivedImages) => {
        return await apiRequest('/ai/verify-item', {
            method: 'POST',
            body: JSON.stringify({ listingId, listingImages, receivedImages })
        });
    },

    getRetailPrice: async (title, category, brand) => {
        return await apiRequest('/ai/get-retail-price', {
            method: 'POST',
            body: JSON.stringify({ title, category, brand })
        });
    },

    analyzeImage: async (imageBlob) => {
        // Mock implementation for demo - in real app, send to backend/Gemini
        console.log('🧠 Analyzing image with Gemini Vision...');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing

        // Return mock data for a "detected" item
        return {
            title: "Sony WH-1000XM4 Wireless Noise Cancelling Headphones",
            category: "electronics",
            condition: "like-new",
            estimatedPrice: 18500,
            originalPrice: 24990,
            confidence: 94,
            features: ["Noise Cancellation", "30hr Battery", "Black"],
            reasoning: "Image matches Sony XM4 design. Earcups show minimal wear. Accessories included."
        };
    },

    generate3D: async (imageUrl) => {
        return await apiRequest('/ai/generate-3d', {
            method: 'POST',
            body: JSON.stringify({ imageUrl })
        });
    },

    removeBackground: async (imageUrl) => {
        return await apiRequest('/ai/remove-background', {
            method: 'POST',
            body: JSON.stringify({ imageUrl })
        });
    }
};

// ============ Payment/Order API ============

export const paymentAPI = {
    createOrder: async (orderData) => {
        return await apiRequest('/payment/create-order', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    },

    createCreditOrder: async (orderData) => {
        return await apiRequest('/payment/create-credit-order', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    },

    verifyPayment: async (paymentData) => {
        return await apiRequest('/payment/verify', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    },

    getOrders: async (role = 'buyer') => {
        return await apiRequest(`/payment/orders?role=${role}`);
    },

    getOrderById: async (id) => {
        return await apiRequest(`/payment/orders/${id}`);
    },

    confirmDelivery: async (orderId) => {
        return await apiRequest('/payment/confirm-delivery', {
            method: 'POST',
            body: JSON.stringify({ orderId })
        });
    }
};

// ============ Shield/Safety API ============

export const shieldAPI = {
    report: async (reportData) => {
        return await apiRequest('/shield/report', {
            method: 'POST',
            body: JSON.stringify(reportData)
        });
    },

    getTrustScore: async (userId) => {
        return await apiRequest(`/shield/trust-score/${userId}`);
    },

    analyzeListing: async (data) => {
        return await apiRequest('/shield/analyze-listing', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};

// ============ Image Upload Helper ============

// Image Upload Helper
export const uploadImage = async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
            ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
    }

    return data.url; // Returns Cloudinary URL
};

export const uploadImages = async (files) => {
    const uploads = Array.from(files).map(file => uploadImage(file));
    return await Promise.all(uploads);
};

export default {
    auth: authAPI,
    listings: listingsAPI,
    ai: aiAPI,
    payment: paymentAPI,
    shield: shieldAPI,
    uploadImage,
    uploadImages
};
