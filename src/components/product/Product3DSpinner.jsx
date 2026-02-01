import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rotate3d, Loader } from 'lucide-react';

const Product3DSpinner = ({ images = [], modelUrl = null }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [loadedImages, setLoadedImages] = useState(0);
    const spinnerRef = useRef(null);

    // Preload images
    useEffect(() => {
        if (!images.length) return;
        setLoadedImages(0);
        images.forEach(src => {
            const img = new Image();
            img.onload = () => setLoadedImages(prev => prev + 1);
            img.src = src;
        });
    }, [images]);

    const isFullyLoaded = images.length > 0 && loadedImages === images.length;

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.clientX || e.touches[0].clientX);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        if (!clientX) return;

        const diff = clientX - startX;
        const sensitivity = 10; // Pixels per frame change

        if (Math.abs(diff) > sensitivity) {
            const direction = diff > 0 ? -1 : 1; // Negative for intuitive spin

            setCurrentIndex(prev => {
                let next = prev + direction;
                if (next < 0) next = images.length - 1;
                if (next >= images.length) next = 0;
                return next;
            });

            setStartX(clientX);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    if (!images.length && !modelUrl) return null;

    if (modelUrl) {
        return (
            <div className="relative w-full aspect-square bg-gray-900/50 rounded-xl overflow-hidden shadow-2xl border border-[var(--glass-border)] group">
                {/* AR HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none z-10 opacity-60">
                    <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[var(--legion-gold)]" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-[var(--legion-gold)]" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-[var(--legion-gold)]" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[var(--legion-gold)]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[80%] h-[80%] border border-[var(--legion-gold-dim)] rounded-full opacity-20 border-dashed animate-[spin_60s_linear_infinite]" />
                    </div>
                </div>

                <model-viewer
                    src={modelUrl}
                    alt="3D Product Model"
                    auto-rotate
                    camera-controls
                    ar
                    shadow-intensity="1"
                    style={{ width: '100%', height: '100%' }}
                >
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur flex items-center gap-1">
                        <Rotate3d size={12} /> Live Render
                    </div>
                </model-viewer>
            </div>
        );
    }

    return (
        <div
            className="relative w-full aspect-square bg-white rounded-xl overflow-hidden cursor-grab active:cursor-grabbing border border-white/10 shadow-2xl"
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchEnd={handleMouseUp}
            ref={spinnerRef}
        >
            {/* Loading State */}
            {!isFullyLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50 backdrop-blur-sm z-20">
                    <Loader className="w-8 h-8 text-legion-gold animate-spin mb-2" />
                    <p className="text-white text-xs font-medium">Loading 3D View...</p>
                </div>
            )}

            {/* 3D Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur text-white text-xs px-3 py-1 rounded-full flex items-center gap-2 pointer-events-none z-10">
                <Rotate3d className="w-4 h-4 text-legion-gold" />
                <span>Drag to Rotate</span>
            </div>

            {/* Images */}
            {images.map((src, index) => (
                <img
                    key={index}
                    src={src}
                    alt={`View ${index + 1}`}
                    className={`absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-0 ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    draggable={false}
                />
            ))}
        </div>
    );
};

export default Product3DSpinner;
