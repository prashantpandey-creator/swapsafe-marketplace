// API Service for SwapSafe Backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get auth token
const getToken = () => localStorage.getItem('swapsafe_token');

// Helper for API requests
const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
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
    }
};

// ============ Image Upload Helper ============

export const uploadImage = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // For now, return base64 - in production, upload to cloud storage
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const uploadImages = async (files) => {
    const uploads = Array.from(files).map(file => uploadImage(file));
    return await Promise.all(uploads);
};

export default {
    auth: authAPI,
    listings: listingsAPI,
    ai: aiAPI,
    uploadImage,
    uploadImages
};
