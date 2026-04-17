import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeIndicator = ({ theme, onToggle }) => {
    const [isHovered, setIsHovered] = useState(false);
    const timeoutRef = useRef(null);

    const themeNames = {
        classic: 'Classic - Sacred Geometry',
        esoteric: 'Esoteric - Hindu Mystical',
        mystical: 'Mystical - Ethereal Cyan',
        void: 'Void - Deep Black',
        minimal: 'Minimal - Clean Gray',
        psychedelic: 'Psychedelic - Neon Purple',
        lynch: 'Lynch - Surreal Crimson'
    };

    const themeColors = {
        classic: '#D4AF37',
        esoteric: '#FF9933',
        mystical: '#22D3EE',
        void: '#EF4444',
        minimal: '#6366F1',
        psychedelic: '#bf00ff',
        lynch: '#B22222'
    };

    const themeIcons = {
        classic: '🌀',
        esoteric: '🕉️',
        mystical: '✨',
        void: '⚫',
        minimal: '⚪',
        psychedelic: '⚡',
        lynch: '🦉'
    };

    const color = themeColors[theme] || '#ffffff';

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => setIsHovered(false), 200);
    };

    const handleClick = () => {
        if (onToggle) onToggle();
    };

    return (
        <div
            className="relative inline-flex items-center justify-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Clickable theme dot button */}
            <button
                onClick={handleClick}
                title="Switch theme"
                className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                aria-label={`Current theme: ${themeNames[theme] || theme}. Click to switch.`}
            >
                <span className="text-base leading-none select-none">
                    {themeIcons[theme] || '🎨'}
                </span>
            </button>

            {/* Glow ring beneath the icon */}
            <span
                className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ boxShadow: `0 0 12px ${color}` }}
            />

            {/* Tooltip: theme name */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 right-0 z-[100] pointer-events-none whitespace-nowrap"
                    >
                        <div
                            className="px-3 py-1.5 rounded-lg backdrop-blur-xl border shadow-lg"
                            style={{
                                backgroundColor: 'rgba(10, 10, 15, 0.95)',
                                borderColor: color,
                                boxShadow: `0 0 16px ${color}40`
                            }}
                        >
                            <p className="text-xs font-medium" style={{ color }}>
                                {themeNames[theme] || theme}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Click to cycle</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ThemeIndicator;
