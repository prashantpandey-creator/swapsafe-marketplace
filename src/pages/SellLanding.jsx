// SellLanding.jsx - Dual-path sell entry point
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Camera, Box, ChevronRight, Sparkles, Clock, Star } from 'lucide-react';
import { AIEngineStatusBadge } from '../components/ai/AIEngineStatus';

const SellLanding = () => {
    const navigate = useNavigate();

    const pathCards = [
        {
            id: 'quick',
            title: 'Quick Sell',
            subtitle: 'List in 30 seconds',
            description: 'Snap one photo, AI does the rest. Perfect for everyday items.',
            icon: Zap,
            color: 'from-[var(--legion-gold)] to-amber-600',
            features: ['1 photo', 'AI price suggestion', 'Instant listing'],
            time: '~30 sec',
            action: () => navigate('/sell/quick')
        },
        {
            id: 'studio',
            title: 'Studio Mode',
            subtitle: 'Premium 3D listings',
            description: 'Create immersive 3D product views. For high-value items.',
            icon: Box,
            color: 'from-purple-500 to-indigo-600',
            features: ['360° view', '3D model', 'AR preview'],
            time: '~3 min',
            badge: 'PRO',
            action: () => navigate('/sell/studio')
        }
    ];

    return (
        <div className="min-h-screen pt-20 pb-12 bg-[var(--bg-primary)]">
            {/* Header */}
            <div className="max-w-lg mx-auto px-4 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-[var(--m-fg)]">Start Selling</h1>
                    <AIEngineStatusBadge size="sm" showLabel={false} />
                </div>
                <p className="text-[var(--m-fg-muted)]">
                    Choose how you want to list your item
                </p>
            </div>

            {/* Path Selection Cards */}
            <div className="max-w-lg mx-auto px-4 space-y-4">
                {pathCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <motion.button
                            key={card.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={card.action}
                            className="w-full text-left glass-panel p-6 hover:border-[var(--legion-gold)]/50 transition-all group"
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className="text-white" size={28} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-bold text-[var(--m-fg)]">{card.title}</h2>
                                        {card.badge && (
                                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded-full">
                                                {card.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[var(--legion-gold)] text-sm font-medium mb-2">
                                        {card.subtitle}
                                    </p>
                                    <p className="text-[var(--m-fg-muted)] text-sm mb-3">
                                        {card.description}
                                    </p>

                                    {/* Features */}
                                    <div className="flex flex-wrap gap-2">
                                        {card.features.map((feature, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 bg-[var(--m-surface)] text-[var(--m-fg-muted)] text-xs rounded-full"
                                            >
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Arrow & Time */}
                                <div className="flex flex-col items-end gap-2">
                                    <ChevronRight className="text-[var(--m-fg-subtle)] group-hover:text-[var(--legion-gold)] transition-colors" size={24} />
                                    <span className="text-[var(--m-fg-subtle)] text-xs flex items-center gap-1">
                                        <Clock size={12} />
                                        {card.time}
                                    </span>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Tips Section */}
            <div className="max-w-lg mx-auto px-4 mt-8">
                <div className="glass-panel p-5 border-[var(--legion-gold)]/20">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="text-[var(--legion-gold)]" size={18} />
                        <h3 className="text-[var(--m-fg)] font-semibold">Pro Tips for Better Sales</h3>
                    </div>

                    <ul className="space-y-2 text-sm text-[var(--m-fg-muted)]">
                        <li className="flex items-start gap-2">
                            <Star className="text-[var(--legion-gold)] mt-0.5 flex-shrink-0" size={14} />
                            <span>Include <span className="text-[var(--m-fg)]">brand name</span> and <span className="text-[var(--m-fg)]">model number</span> for accurate pricing</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Star className="text-[var(--legion-gold)] mt-0.5 flex-shrink-0" size={14} />
                            <span>Use <span className="text-[var(--m-fg)]">natural lighting</span> for the best photos</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Star className="text-[var(--legion-gold)] mt-0.5 flex-shrink-0" size={14} />
                            <span>Items priced <span className="text-[var(--m-fg)]">20-30% below retail</span> sell 3x faster</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Recent Listings Preview */}
            <div className="max-w-lg mx-auto px-4 mt-6 text-center">
                <p className="text-[var(--m-fg-subtle)] text-xs">
                    Join 2,500+ sellers on Guardian Marketplace
                </p>
            </div>
        </div>
    );
};

export default SellLanding;
