import React from 'react';
import { motion } from 'framer-motion';

/**
 * GuardianBadge Component
 * 
 * Displays the "Guardian" protection status.
 * Used on product cards, trusted seller profiles, and checkout.
 * 
 * @param {string} level - 'verified', 'premium', 'divine'
 * @param {boolean} showLabel - Whether to show the text label
 * @param {boolean} animated - Whether to enable pulse animation
 */
const GuardianBadge = ({ level = 'verified', showLabel = true, animated = false }) => {

    // Guardian Figure (Stylized Vector Avatar with Black Teeka)
    // Using the public assets path for browser compatibility
    const guardianImage = "/assets/guardian-avatar.png";

    const getBadgeStyle = () => {
        switch (level) {
            case 'divine':
                return {
                    borderColor: 'var(--guardian-gold)',
                    color: 'var(--guardian-gold)',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(124, 58, 237, 0.1))',
                    boxShadow: '0 0 15px var(--guardian-gold-glow)'
                };
            case 'premium':
                return {
                    borderColor: 'var(--guardian-primary-light)',
                    color: 'var(--guardian-primary-light)',
                    background: 'rgba(124, 58, 237, 0.1)',
                    boxShadow: '0 0 10px rgba(124, 58, 237, 0.2)'
                };
            case 'verified':
            default:
                return {
                    borderColor: 'var(--guardian-safe)',
                    color: 'var(--guardian-safe)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    boxShadow: '0 0 10px var(--guardian-safe-glow)'
                };
        }
    };

    return (
        <motion.div
            className={`guardian-badge ${animated ? 'animate-guardian' : ''}`}
            initial={animated ? { scale: 0.9, opacity: 0 } : {}}
            animate={animated ? { scale: 1, opacity: 1 } : {}}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '20px',
                border: '1px solid',
                backdropFilter: 'blur(4px)',
                ...getBadgeStyle()
            }}
        >
            {/* Guardian Icon / Shield */}
            <div className="relative w-4 h-4 flex items-center justify-center">
                {level === 'divine' ? (
                    <img src={guardianImage} alt="Guardian" className="w-full h-full rounded-full object-cover" />
                ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                    </svg>
                )}
            </div>

            {showLabel && (
                <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    {level === 'divine' ? 'Guardian Protected' : 'Verified Safe'}
                </span>
            )}
        </motion.div>
    );
};

export default GuardianBadge;
