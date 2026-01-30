/**
 * CheckoutButton Component
 * Initiates the Razorpay payment flow for a listing
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Loader2, Shield, CheckCircle } from 'lucide-react';
import { paymentAPI } from '../../services/paymentAPI';
import { useAuth } from '../../context/AuthContext';

const CheckoutButton = ({
    listingId,
    price,
    deliveryMethod = 'meetup',
    deliveryAddress = null,
    onSuccess,
    onError,
    className = ''
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('idle'); // idle, creating, paying, verifying, success

    const handleCheckout = async () => {
        if (!user) {
            onError?.(new Error('Please login to continue'));
            return;
        }

        try {
            setLoading(true);
            setStep('creating');

            // 1. Create order on backend
            const orderResponse = await paymentAPI.createOrder(
                listingId,
                deliveryMethod,
                deliveryAddress
            );

            if (!orderResponse.success) {
                throw new Error(orderResponse.error || 'Failed to create order');
            }

            setStep('paying');

            // 2. Open Razorpay checkout
            await paymentAPI.openCheckout(
                orderResponse.order,
                {
                    name: user.name,
                    email: user.email,
                    phone: user.phone
                },
                (verification) => {
                    setStep('success');
                    onSuccess?.(verification);
                },
                (error) => {
                    setStep('idle');
                    onError?.(error);
                }
            );

        } catch (error) {
            console.error('Checkout error:', error);
            setStep('idle');
            onError?.(error);
        } finally {
            setLoading(false);
        }
    };

    const getButtonContent = () => {
        switch (step) {
            case 'creating':
                return (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Creating order...</span>
                    </>
                );
            case 'paying':
                return (
                    <>
                        <CreditCard className="w-5 h-5" />
                        <span>Complete payment...</span>
                    </>
                );
            case 'success':
                return (
                    <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Payment successful!</span>
                    </>
                );
            default:
                return (
                    <>
                        <Shield className="w-5 h-5" />
                        <span>Buy Now • ₹{price?.toLocaleString('en-IN')}</span>
                    </>
                );
        }
    };

    return (
        <motion.button
            whileHover={{ scale: step === 'idle' ? 1.02 : 1 }}
            whileTap={{ scale: step === 'idle' ? 0.98 : 1 }}
            onClick={handleCheckout}
            disabled={loading || step !== 'idle'}
            className={`
                w-full flex items-center justify-center gap-3 
                px-6 py-4 rounded-xl font-bold text-lg
                transition-all duration-300
                ${step === 'success'
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-legion-gold to-yellow-500 text-slate-900 hover:shadow-lg hover:shadow-yellow-500/30'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
                ${className}
            `}
        >
            {getButtonContent()}
        </motion.button>
    );
};

export default CheckoutButton;
