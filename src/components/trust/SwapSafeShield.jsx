/**
 * SwapSafeShield Component
 * Based on Stitch design: SwapSafe Shield Protection screen
 * Explains buyer protection and builds trust
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Shield,
    CheckCircle,
    Lock,
    Phone,
    ArrowRight,
    Sparkles,
    BadgeCheck
} from 'lucide-react';

const PROTECTION_FEATURES = [
    {
        icon: Shield,
        title: 'Money-Back Guarantee',
        description: 'Full refund if item doesn\'t match the listing',
        color: 'gold'
    },
    {
        icon: CheckCircle,
        title: 'Verified Authenticity',
        description: 'Every item checked against stolen databases',
        color: 'green'
    },
    {
        icon: Lock,
        title: 'Secure Payments',
        description: 'Payment held safely until you confirm receipt',
        color: 'blue'
    },
    {
        icon: Phone,
        title: '24/7 Support',
        description: 'Real humans ready to help anytime',
        color: 'purple'
    }
];

const TRUST_STATS = [
    { value: '₹2.3 Cr+', label: 'Protected' },
    { value: '99.8%', label: 'Match Rate' },
    { value: '12.5K+', label: 'Verified Sellers' }
];

const HOW_IT_WORKS = [
    { step: 1, title: 'Buy Verified', icon: BadgeCheck },
    { step: 2, title: 'Inspect on Delivery', icon: Sparkles },
    { step: 3, title: 'Confirm or Return', icon: CheckCircle }
];

export const SwapSafeShield = ({ onGetStarted, compact = false }) => {
    const colorMap = {
        gold: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400',
        green: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400',
        blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
        purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400'
    };

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 rounded-xl p-4 flex items-center gap-3"
            >
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                    <p className="text-white font-medium text-sm">SwapSafe Shield Protected</p>
                    <p className="text-gray-400 text-xs">Money-back guarantee included</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500" />
            </motion.div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
            >
                <div className="relative inline-block mb-6">
                    <motion.div
                        animate={{
                            boxShadow: ['0 0 20px rgba(255,215,0,0.3)', '0 0 40px rgba(255,215,0,0.5)', '0 0 20px rgba(255,215,0,0.3)']
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-24 h-24 bg-gradient-to-br from-[var(--legion-gold)] to-amber-600 rounded-3xl flex items-center justify-center mx-auto"
                    >
                        <Shield className="w-12 h-12 text-black" />
                    </motion.div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">100% Protected Purchases</h2>
                <p className="text-gray-400 max-w-md mx-auto">
                    Every verified purchase is backed by our SwapSafe Shield guarantee
                </p>
            </motion.div>

            {/* Protection Features */}
            <div className="grid gap-4">
                {PROTECTION_FEATURES.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`bg-gradient-to-r ${colorMap[feature.color]} border rounded-xl p-4 flex items-center gap-4`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-black/30`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">{feature.title}</h3>
                                <p className="text-gray-400 text-sm">{feature.description}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Trust Stats */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                    {TRUST_STATS.map((stat) => (
                        <div key={stat.label}>
                            <p className="text-2xl font-bold text-[var(--legion-gold)]">{stat.value}</p>
                            <p className="text-gray-400 text-xs">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* How It Works */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white text-center">How It Works</h3>
                <div className="flex items-center justify-center gap-2">
                    {HOW_IT_WORKS.map((step, idx) => {
                        const Icon = step.icon;
                        return (
                            <React.Fragment key={step.step}>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + idx * 0.15 }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                        <Icon className="w-5 h-5 text-[var(--legion-gold)]" />
                                    </div>
                                    <p className="text-xs text-gray-400">{step.title}</p>
                                </motion.div>
                                {idx < HOW_IT_WORKS.length - 1 && (
                                    <ArrowRight className="w-4 h-4 text-gray-600 mx-2" />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* CTA */}
            {onGetStarted && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onGetStarted}
                    className="w-full py-4 bg-[var(--legion-gold)] text-black font-bold rounded-xl flex items-center justify-center gap-2"
                >
                    <Shield className="w-5 h-5" />
                    Start Shopping Protected
                </motion.button>
            )}
        </div>
    );
};

// Mini banner for product pages
export const ShieldBanner = () => (
    <Link to="/shield" className="block">
        <div className="bg-gradient-to-r from-green-500/10 via-[var(--legion-gold)]/10 to-green-500/10 border border-green-500/20 rounded-xl p-4 hover:border-green-400/40 transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-green-400 flex-shrink-0" />
                <div className="flex-1">
                    <p className="text-white font-medium group-hover:text-[var(--legion-gold)] transition-colors">SwapSafe Shield Protection</p>
                    <p className="text-gray-400 text-sm">Money-back guarantee if item doesn't match</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </div>
        </div>
    </Link>
);

export default SwapSafeShield;
