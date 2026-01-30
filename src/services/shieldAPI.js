/**
 * Legion Shield API Service
 * Frontend interface for trust scoring and fraud detection
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('swapsafe_token');

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
        throw new Error(data.error || 'Shield API request failed');
    }

    return data;
};

export const shieldAPI = {
    /**
     * Get a user's trust score
     */
    getTrustScore: async (userId) => {
        return await apiRequest(`/shield/trust-score/${userId}`);
    },

    /**
     * Get current user's trust score
     */
    getMyTrustScore: async () => {
        return await apiRequest('/shield/my-trust-score');
    },

    /**
     * Analyze a listing for fraud signals
     */
    analyzeListing: async (listingId, deepScan = false) => {
        return await apiRequest('/shield/analyze-listing', {
            method: 'POST',
            body: JSON.stringify({ listingId, deepScan })
        });
    },

    /**
     * Pre-submission check for new listings
     */
    preSubmitCheck: async (listingData) => {
        return await apiRequest('/shield/pre-submit-check', {
            method: 'POST',
            body: JSON.stringify(listingData)
        });
    },

    /**
     * Scan a message for phishing/scam patterns
     */
    scanMessage: async (message) => {
        return await apiRequest('/shield/scan-message', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
    },

    /**
     * Report a suspicious user or listing
     */
    report: async (type, targetId, reason, details = '') => {
        return await apiRequest('/shield/report', {
            method: 'POST',
            body: JSON.stringify({ type, targetId, reason, details })
        });
    },

    /**
     * Get Shield system status
     */
    getStatus: async () => {
        return await apiRequest('/shield/status');
    }
};

export default shieldAPI;
