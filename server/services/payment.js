/**
 * Razorpay Payment Service
 * Handles payments, escrow, and commission splits for Buyers Legion
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Razorpay
let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('✅ Razorpay initialized');
} else {
    console.log('⚠️ Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
}

// Platform commission percentage
const PLATFORM_COMMISSION = 5; // 5%

/**
 * Create a Razorpay order
 */
export async function createOrder(amount, currency = 'INR', receipt, notes = {}) {
    if (!razorpay) {
        throw new Error('Razorpay not initialized. Check your API keys.');
    }

    const options = {
        amount: Math.round(amount * 100), // Razorpay uses paise
        currency,
        receipt,
        notes,
        payment_capture: 1 // Auto-capture
    };

    try {
        const order = await razorpay.orders.create(options);
        return {
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt
        };
    } catch (error) {
        console.error('Razorpay order creation failed:', error);
        throw new Error(`Payment order creation failed: ${error.message}`);
    }
}

/**
 * Verify payment signature
 */
export function verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    if (!process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay secret not configured');
    }

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    const isValid = expectedSignature === razorpaySignature;

    return {
        isValid,
        message: isValid ? 'Payment verified successfully' : 'Payment verification failed'
    };
}

/**
 * Get payment details
 */
export async function getPaymentDetails(paymentId) {
    if (!razorpay) {
        throw new Error('Razorpay not initialized');
    }

    try {
        const payment = await razorpay.payments.fetch(paymentId);
        return {
            id: payment.id,
            amount: payment.amount / 100, // Convert from paise
            currency: payment.currency,
            status: payment.status,
            method: payment.method,
            email: payment.email,
            contact: payment.contact,
            createdAt: new Date(payment.created_at * 1000)
        };
    } catch (error) {
        console.error('Failed to fetch payment:', error);
        throw error;
    }
}

/**
 * Calculate commission split
 */
export function calculateCommission(itemPrice, deliveryFee = 0) {
    const platformFee = Math.round(itemPrice * PLATFORM_COMMISSION / 100);
    const sellerAmount = itemPrice - platformFee;
    const total = itemPrice + deliveryFee;

    return {
        itemPrice,
        deliveryFee,
        platformFee,
        platformPercent: PLATFORM_COMMISSION,
        sellerAmount,
        total
    };
}

/**
 * Process refund
 */
export async function processRefund(paymentId, amount, notes = {}) {
    if (!razorpay) {
        throw new Error('Razorpay not initialized');
    }

    try {
        const refund = await razorpay.payments.refund(paymentId, {
            amount: Math.round(amount * 100), // Convert to paise
            notes
        });

        return {
            success: true,
            refundId: refund.id,
            amount: refund.amount / 100,
            status: refund.status
        };
    } catch (error) {
        console.error('Refund failed:', error);
        throw new Error(`Refund failed: ${error.message}`);
    }
}

/**
 * Check if Razorpay is configured
 */
export function isConfigured() {
    return !!razorpay;
}

/**
 * Get Razorpay Key ID for frontend
 */
export function getKeyId() {
    return process.env.RAZORPAY_KEY_ID;
}

export default {
    createOrder,
    verifyPayment,
    getPaymentDetails,
    calculateCommission,
    processRefund,
    isConfigured,
    getKeyId
};
