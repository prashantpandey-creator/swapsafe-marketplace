/**
 * SwapSafe Shield Protection Page
 * Based on Stitch design: SwapSafe Shield Protection screen
 * Explains buyer protection, trust features, and how the verification system works
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    Shield,
    CheckCircle,
    Lock,
    Phone,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    BadgeCheck,
    Users,
    Fingerprint,
    Eye,
    CreditCard,
    Truck,
    MessageCircle,
    Clock,
    Award
} from 'lucide-react';

// Protection features
const PROTECTION_FEATURES = [
    {
        icon: Shield,
        title: 'Money-Back Guarantee',
        description: 'Full refund if the item doesn\'t match the listing description. No questions asked within 48 hours of delivery.',
        color: 'gold'
    },
    {
        icon: Fingerprint,
        title: 'Digital Twin Verification',
        description: 'Every item gets a unique digital identity. IMEI/Serial numbers verified against global databases.',
        color: 'purple'
    },
    {
        icon: CheckCircle,
        title: 'Not Stolen Guarantee',
        description: 'We check every device against police databases and carrier blacklists before listing.',
        color: 'green'
    },
    {
        icon: Lock,
        title: 'Secure Escrow Payments',
        description: 'Your payment is held safely until you confirm receipt and satisfaction with your purchase.',
        color: 'blue'
    },
    {
        icon: Eye,
        title: 'AI Condition Analysis',
        description: 'Our AI analyzes product photos to verify condition matches the seller\'s description.',
        color: 'cyan'
    },
    {
        icon: Phone,
        title: '24/7 Support',
        description: 'Real humans ready to help anytime. Chat, call, or email - we\'ve got your back.',
        color: 'orange'
    }
];

// Trust stats
const TRUST_STATS = [
    { value: '₹2.3 Cr+', label: 'Protected Transactions', icon: CreditCard },
    { value: '99.8%', label: 'Authenticity Match Rate', icon: BadgeCheck },
    { value: '12.5K+', label: 'Verified Sellers', icon: Users },
    { value: '<2 hrs', label: 'Avg. Dispute Resolution', icon: Clock }
];

// How it works steps
const HOW_IT_WORKS = [
    {
        step: 1,
        title: 'Seller Lists Item',
        description: 'Seller uploads photos and provides IMEI/serial number',
        icon: Sparkles
    },
    {
        step: 2,
        title: 'We Verify',
        description: 'AI + database checks confirm authenticity and condition',
        icon: Shield
    },
    {
        step: 3,
        title: 'You Buy Protected',
        description: 'Payment held in escrow until you\'re satisfied',
        icon: Lock
    },
    {
        step: 4,
        title: 'Inspect & Confirm',
        description: 'Check your item, then release payment to seller',
        icon: CheckCircle
    }
];

// FAQ items
const FAQ_ITEMS = [
    {
        question: 'What if the item doesn\'t match the description?',
        answer: 'You have 48 hours after delivery to report any issues. If the item doesn\'t match, you get a full refund - no questions asked.'
    },
    {
        question: 'How do you verify devices aren\'t stolen?',
        answer: 'We check IMEI/serial numbers against GSMA databases, carrier blacklists, and police stolen property records before any listing goes live.'
    },
    {
        question: 'What is a Digital Twin?',
        answer: 'A Digital Twin is a unique digital identity for your item. It includes verified specs, ownership history, and condition reports - creating an unforgeable record of authenticity.'
    },
    {
        question: 'How does escrow payment work?',
        answer: 'When you buy, your payment is held securely by SwapSafe. The seller only receives payment after you confirm the item arrived as described.'
    }
];

function SwapSafeShieldPage() {
    const navigate = useNavigate();

    const colorMap = {
        gold: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400',
        green: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400',
        blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
        purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
        cyan: 'from-cyan-500/20 to-teal-500/20 border-cyan-500/30 text-cyan-400',
        orange: 'from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-400'
    };

    return (
        <div className="min-h-screen bg-legion-bg pt-20 pb-16">
            {/* Back Button */}
            <div className="container mx-auto px-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Back</span>
                </button>
            </div>

            <div className="container mx-auto px-4 max-w-4xl">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <motion.div
                        animate={{
                            boxShadow: ['0 0 30px rgba(255,215,0,0.2)', '0 0 60px rgba(255,215,0,0.4)', '0 0 30px rgba(255,215,0,0.2)']
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-28 h-28 bg-gradient-to-br from-[var(--legion-gold)] to-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
                    >
                        <Shield className="w-14 h-14 text-black" />
                    </motion.div>

                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                        SwapSafe Shield
                    </h1>
                    <p className="text-xl text-[var(--legion-gold)] font-medium mb-4">
                        100% Protected Purchases
                    </p>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Every verified purchase on SwapSafe is backed by our comprehensive protection guarantee.
                        Buy with confidence knowing we've got your back.
                    </p>
                </motion.div>

                {/* Trust Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 mb-12"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        {TRUST_STATS.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label} className="space-y-2">
                                    <div className="w-12 h-12 bg-[var(--legion-gold)]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Icon className="w-6 h-6 text-[var(--legion-gold)]" />
                                    </div>
                                    <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                                    <p className="text-gray-400 text-sm">{stat.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Protection Features */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-12"
                >
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">
                        Your Protection Includes
                    </h2>
                    <div className="grid gap-4">
                        {PROTECTION_FEATURES.map((feature, idx) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + idx * 0.1 }}
                                    className={`bg-gradient-to-r ${colorMap[feature.color]} border rounded-xl p-5 flex items-start gap-4`}
                                >
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-black/30 flex-shrink-0">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{feature.title}</h3>
                                        <p className="text-gray-300 text-sm mt-1">{feature.description}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* How It Works */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-legion-card border border-white/10 rounded-2xl p-6 md:p-8 mb-12"
                >
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">
                        How SwapSafe Shield Works
                    </h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        {HOW_IT_WORKS.map((step, idx) => {
                            const Icon = step.icon;
                            return (
                                <div key={step.step} className="relative text-center">
                                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                                        <Icon className="w-7 h-7 text-[var(--legion-gold)]" />
                                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--legion-gold)] text-black text-xs font-bold rounded-full flex items-center justify-center">
                                            {step.step}
                                        </span>
                                    </div>
                                    <h3 className="text-white font-bold mb-2">{step.title}</h3>
                                    <p className="text-gray-400 text-sm">{step.description}</p>

                                    {idx < HOW_IT_WORKS.length - 1 && (
                                        <div className="hidden md:block absolute top-8 -right-3 text-gray-600">
                                            <ArrowRight size={20} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* FAQ Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mb-12"
                >
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        {FAQ_ITEMS.map((faq, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 + idx * 0.1 }}
                                className="bg-white/5 border border-white/10 rounded-xl p-5"
                            >
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                                    <MessageCircle size={18} className="text-[var(--legion-gold)]" />
                                    {faq.question}
                                </h3>
                                <p className="text-gray-400 text-sm pl-7">{faq.answer}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="text-center"
                >
                    <Link
                        to="/browse"
                        className="inline-flex items-center gap-3 bg-[var(--legion-gold)] text-black font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-[var(--legion-gold)]/20 hover:bg-yellow-400 transition-all transform hover:scale-105"
                    >
                        <Shield className="w-5 h-5" />
                        Start Shopping Protected
                        <ArrowRight className="w-5 h-5" />
                    </Link>

                    <p className="text-gray-500 text-sm mt-4">
                        Every purchase on SwapSafe is automatically protected
                    </p>
                </motion.div>

                {/* Trust Badge Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-16 pt-8 border-t border-white/10 flex items-center justify-center gap-6 flex-wrap text-gray-500 text-sm"
                >
                    <div className="flex items-center gap-2">
                        <Lock size={16} />
                        <span>SSL Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Award size={16} />
                        <span>Verified Platform</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users size={16} />
                        <span>50K+ Happy Users</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default SwapSafeShieldPage;
