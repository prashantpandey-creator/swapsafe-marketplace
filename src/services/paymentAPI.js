/**
 * Payment API Service
 * Frontend interface for Razorpay payments and order management
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
        throw new Error(data.error || 'Payment API request failed');
    }

    return data;
};

/**
 * Load Razorpay SDK dynamically
 */
const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
        document.body.appendChild(script);
    });
};

export const paymentAPI = {
    /**
     * Get Razorpay configuration
     */
    getConfig: async () => {
        return await apiRequest('/payment/config');
    },

    /**
     * Create a new order
     */
    createOrder: async (listingId, deliveryMethod = 'meetup', deliveryAddress = null) => {
        return await apiRequest('/payment/create-order', {
            method: 'POST',
            body: JSON.stringify({ listingId, deliveryMethod, deliveryAddress })
        });
    },

    /**
     * Verify payment after Razorpay checkout
     */
    verifyPayment: async (razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId) => {
        return await apiRequest('/payment/verify', {
            method: 'POST',
            body: JSON.stringify({
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature,
                orderId
            })
        });
    },

    /**
     * Get user's orders
     */
    getOrders: async (role = 'buyer') => {
        return await apiRequest(`/payment/orders?role=${role}`);
    },

    /**
     * Get single order
     */
    getOrder: async (orderId) => {
        return await apiRequest(`/payment/orders/${orderId}`);
    },

    /**
     * Confirm delivery (releases escrow)
     */
    confirmDelivery: async (orderId) => {
        return await apiRequest('/payment/confirm-delivery', {
            method: 'POST',
            body: JSON.stringify({ orderId })
        });
    },

    /**
     * Raise dispute
     */
    raiseDispute: async (orderId, reason, details = '') => {
        return await apiRequest('/payment/raise-dispute', {
            method: 'POST',
            body: JSON.stringify({ orderId, reason, details })
        });
    },

    /**
     * Open Razorpay checkout
     */
    openCheckout: async (orderData, userInfo, onSuccess, onError) => {
        try {
            await loadRazorpayScript();

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency || 'INR',
                name: 'Buyers Legion',
                description: `Order ${orderData.orderId}`,
                order_id: orderData.razorpayOrderId,
                prefill: {
                    name: userInfo.name,
                    email: userInfo.email,
                    contact: userInfo.phone || ''
                },
                theme: {
                    color: '#fbbf24' // Legion Gold
                },
                handler: async (response) => {
                    try {
                        // Verify payment on backend
                        const verification = await paymentAPI.verifyPayment(
                            response.razorpay_order_id,
                            response.razorpay_payment_id,
                            response.razorpay_signature,
                            orderData.id
                        );
                        onSuccess(verification);
                    } catch (err) {
                        onError(err);
                    }
                },
                modal: {
                    ondismiss: () => {
                        onError(new Error('Payment cancelled by user'));
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            onError(error);
        }
    }
};

export default paymentAPI;
