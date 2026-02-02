/**
 * VerificationBadge Component
 * Based on Stitch design: Verification Report screen
 * Shows trust indicators for verified products
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertCircle, Smartphone, Lock, Check } from 'lucide-react';

// Verification status types
const VERIFICATION_CHECKS = {
    imei: { label: 'IMEI Verified', icon: Smartphone, description: 'Device registered in global database' },
    notStolen: { label: 'Not Stolen', icon: Shield, description: 'Cleared by theft database' },
    carrier: { label: 'Carrier Unlocked', icon: Lock, description: 'No outstanding bills' },
    icloud: { label: 'iCloud Clear', icon: CheckCircle, description: 'Ready to activate' },
    condition: { label: 'Condition Verified', icon: Check, description: 'AI analysis matches listing' }
};

// Simple badge for product cards
export const VerificationBadge = ({ isVerified = true, size = 'small' }) => {
    const sizes = {
        small: 'text-xs px-2 py-1',
        medium: 'text-sm px-3 py-1.5',
        large: 'text-base px-4 py-2'
    };

    if (!isVerified) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`inline-flex items-center gap-1.5 rounded-full ${sizes[size]} 
        bg-green-500/20 border border-green-500/30 text-green-400`}
        >
            <Shield size={size === 'small' ? 12 : 16} className="fill-current" />
            <span className="font-medium">SwapSafe Verified</span>
        </motion.div>
    );
};



// Compact inline badge for listings
export const VerifiedSellerBadge = ({ sellerName, rating, verified = true }) => {
    return (
        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--legion-gold)] to-amber-600 rounded-full flex items-center justify-center text-black font-bold">
                {sellerName?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="flex-1">
                <p className="text-white font-medium">{sellerName}</p>
                <div className="flex items-center gap-2">
                    <span className="text-yellow-400 text-sm">★ {rating}</span>
                    {verified && (
                        <span className="text-green-400 text-xs flex items-center gap-1">
                            <Shield size={10} /> Verified
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerificationBadge;
