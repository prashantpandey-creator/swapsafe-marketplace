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

// Full verification report card
export const VerificationReport = ({
    deviceInfo = {},
    checks = {},
    digitalTwinId = null,
    verifiedAt = null
}) => {
    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center">
                    <Shield className="w-8 h-8 text-green-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">SwapSafe Verified</h3>
                    {verifiedAt && (
                        <p className="text-gray-400 text-sm">
                            Verified {new Date(verifiedAt).toLocaleDateString()}
                        </p>
                    )}
                </div>
            </div>

            {/* Device Info */}
            {deviceInfo.model && (
                <div className="bg-black/30 rounded-xl p-4">
                    <p className="text-white font-medium">{deviceInfo.model}</p>
                    {deviceInfo.imei && (
                        <p className="text-gray-500 text-sm font-mono mt-1">
                            IMEI: {deviceInfo.imei.slice(0, 6)}••••••{deviceInfo.imei.slice(-2)}
                        </p>
                    )}
                </div>
            )}

            {/* Verification Checks */}
            <div className="space-y-3">
                {Object.entries(VERIFICATION_CHECKS).map(([key, check]) => {
                    const passed = checks[key] !== false;
                    const Icon = check.icon;

                    return (
                        <motion.div
                            key={key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-colors
                ${passed
                                    ? 'bg-green-500/10 border border-green-500/20'
                                    : 'bg-red-500/10 border border-red-500/20'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                ${passed ? 'bg-green-500/20' : 'bg-red-500/20'}`}
                            >
                                {passed
                                    ? <CheckCircle className="w-4 h-4 text-green-400" />
                                    : <AlertCircle className="w-4 h-4 text-red-400" />
                                }
                            </div>
                            <div className="flex-1">
                                <p className={`font-medium ${passed ? 'text-green-400' : 'text-red-400'}`}>
                                    {check.label}
                                </p>
                                <p className="text-gray-500 text-xs">{check.description}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Digital Twin ID */}
            {digitalTwinId && (
                <div className="border-t border-white/10 pt-4">
                    <p className="text-gray-400 text-xs mb-2">Digital Twin ID</p>
                    <p className="font-mono text-sm text-[var(--legion-gold)] bg-black/30 rounded-lg px-3 py-2">
                        {digitalTwinId}
                    </p>
                </div>
            )}
        </div>
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
