import React from 'react';
import { Camera, Image as ImageIcon, Zap, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const QuickSellLanding = ({ onSelectCamera, onSelectGallery, isAutoDetect, setIsAutoDetect, gallery = [], onContinue }) => {
    const hasPhotos = gallery.length > 0;

    return (
        <div className="flex flex-col h-full relative">
            {/* Header / Title Area */}
            <div className="pt-12 px-6 pb-8 z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-3"
                >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--legion-gold)] to-yellow-600 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.3)] mb-2">
                        <Zap size={24} className="text-black fill-black" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-1">QUICK SELL</h1>
                        <p className="text-xs text-[var(--legion-gold)] font-mono-tactical tracking-[0.2em] opacity-80">AI-POWERED MARKETPLACE</p>
                    </div>
                </motion.div>
            </div>

            {/* Existing Photos Banner */}
            {hasPhotos && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-6 mb-4 z-10"
                >
                    <button
                        onClick={onContinue}
                        className="w-full group relative h-20 rounded-2xl overflow-hidden border border-[var(--legion-gold)]/40 bg-[var(--legion-gold)]/5 backdrop-blur-xl shadow-lg transition-all hover:border-[var(--legion-gold)] hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] flex items-center px-6 gap-4"
                    >
                        {/* Mini thumbnails */}
                        <div className="flex -space-x-2">
                            {gallery.slice(0, 3).map(img => (
                                <img key={img.id} src={img.enhancedSrc || img.src} className="w-10 h-10 rounded-lg object-cover border-2 border-black" />
                            ))}
                        </div>
                        <div className="text-left flex-1">
                            <h3 className="text-sm font-bold text-white leading-tight flex items-center gap-2">
                                <CheckCircle size={14} className="text-[var(--legion-gold)]" />
                                {gallery.length} photo{gallery.length > 1 ? 's' : ''} ready
                            </h3>
                            <p className="text-xs text-[var(--legion-gold)]/70 font-medium mt-0.5">Tap to continue editing your listing</p>
                        </div>
                        <ArrowRight size={20} className="text-[var(--legion-gold)] group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            )}

            {/* Main Action Area - Compact Grid */}
            <div className="flex-1 px-6 flex flex-col justify-start pt-4 gap-4 z-10">

                {hasPhotos && (
                    <p className="text-xs text-gray-500 text-center font-medium uppercase tracking-wider">Or add more photos</p>
                )}

                {/* Camera Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onSelectCamera}
                    className="group relative h-24 rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl shadow-lg transition-all hover:border-[var(--legion-gold)]/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)] flex items-center px-6 gap-6"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[var(--legion-gold)] group-hover:text-black transition-colors duration-300 shrink-0">
                        <Camera size={24} className="text-white group-hover:text-black transition-colors" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-white leading-tight">Capture Product</h3>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">Use Camera + AI Enhancement</p>
                    </div>
                </motion.button>

                {/* Gallery Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onSelectGallery}
                    className="group relative h-24 rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl shadow-lg transition-all hover:border-[var(--legion-blue)]/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] flex items-center px-6 gap-6"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[var(--legion-blue)] group-hover:text-white transition-colors duration-300 shrink-0">
                        <ImageIcon size={24} className="text-white group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-white leading-tight">Import from Gallery</h3>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">Select existing photos</p>
                    </div>
                </motion.button>
            </div>

            {/* Bottom Controls: Auto-Detect Toggle */}
            <div className="absolute bottom-12 left-0 right-0 px-8 flex justify-center z-20">
                <button
                    onClick={() => setIsAutoDetect(!isAutoDetect)}
                    className={`flex items-center gap-3 px-5 py-3 rounded-full backdrop-blur-md border transition-all duration-300 ${isAutoDetect
                        ? 'bg-[var(--legion-gold-dim)] border-[var(--legion-gold)] text-[var(--legion-gold)] shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : 'bg-black/60 border-white/10 text-gray-400 hover:bg-black/80'
                        }`}
                >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${isAutoDetect ? 'bg-[var(--legion-gold)] text-black' : 'bg-white/10 text-gray-500'}`}>
                        {isAutoDetect && <Sparkles size={12} fill="black" />}
                    </div>
                    <span className="text-xs font-bold tracking-widest font-mono-tactical">AUTO-DETECT IS {isAutoDetect ? 'ON' : 'OFF'}</span>
                </button>
            </div>
        </div>
    );
};

export default QuickSellLanding;
