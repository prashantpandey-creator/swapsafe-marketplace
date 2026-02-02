import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Share2, Eye, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';

const ListingSuccess = ({ onClose }) => {
    useEffect(() => {
        // Trigger confetti on mount
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#FFD700', '#F4C025', '#FFFFFF']
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#FFD700', '#F4C025', '#FFFFFF']
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-full max-w-md bg-[#0A0A0F] border border-[#FFD700]/20 rounded-3xl overflow-hidden relative shadow-[0_0_50px_rgba(255,215,0,0.1)]"
            >
                {/* Glow Effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FFD700]/10 blur-[100px] pointer-events-none"></div>

                <div className="p-8 text-center relative z-10">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Success Icon */}
                    <div className="relative inline-block mb-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-white/10 to-transparent flex items-center justify-center border border-white/5 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="w-20 h-20 bg-[#22C55E]/20 rounded-full flex items-center justify-center"
                            >
                                <Check size={40} className="text-[#22C55E]" strokeWidth={3} />
                            </motion.div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-[#0A0A0F] rounded-full p-1.5">
                            <div className="bg-[#FFD700] rounded-full p-1.5 shadow-lg">
                                <span className="text-[10px] font-bold text-black uppercase tracking-wider block px-1">Live</span>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Listing Published!</h2>
                    <p className="text-gray-400 text-sm mb-8">
                        Your item is now live on the marketplace.
                        <br />Get ready for offers!
                    </p>

                    {/* Action Cards */}
                    <div className="space-y-3 mb-8">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700]">
                                <Share2 size={20} />
                            </div>
                            <div>
                                <h4 className="text-white font-medium text-sm">Share Listing</h4>
                                <p className="text-gray-500 text-xs">Boost visibility by 3x</p>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h4 className="text-white font-medium text-sm">Schedule Meetup</h4>
                                <p className="text-gray-500 text-xs">Set availability for buyers</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-[#FFD700] hover:bg-[#E5C100] text-black font-bold rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all active:scale-[0.98]"
                    >
                        View My Listing
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ListingSuccess;
