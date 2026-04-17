import React from 'react';
import { X, Plus, Sparkles, Loader } from 'lucide-react';

const ImageGalleryStrip = ({ images, currentImageId, onSelect, onRemove, onAdd }) => {
    return (
        <div className="w-full overflow-x-auto pb-4 px-1 scrollbar-hide">
            <div className="flex gap-3 min-w-min">
                {/* Add Button */}
                <button
                    onClick={onAdd}
                    className="flex-shrink-0 w-20 h-20 rounded-xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center gap-1 hover:bg-white/10 hover:border-white/40 transition-all group"
                >
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[var(--legion-gold)] group-hover:text-black transition-colors">
                        <Plus size={18} />
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono-tactical uppercase">Add</span>
                </button>

                {/* Images */}
                {images.map(img => (
                    <div
                        key={img.id}
                        onClick={() => onSelect(img.id)}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${currentImageId === img.id
                                ? 'border-[var(--legion-gold)] shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-105 z-10'
                                : 'border-transparent hover:border-white/20 opacity-80 hover:opacity-100'
                            }`}
                    >
                        <img
                            src={img.enhancedSrc || img.src}
                            alt="Thumbnail"
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />

                        {/* Status Indicators */}
                        {img.status === 'enhancing' && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                                <Loader size={20} className="animate-spin text-[var(--legion-gold)]" />
                            </div>
                        )}

                        {img.enhancedSrc && (
                            <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-md rounded-md px-1 py-0.5 border border-[var(--legion-gold)]/30">
                                <Sparkles size={10} className="text-[var(--legion-gold)] fill-[var(--legion-gold)]" />
                            </div>
                        )}

                        {/* Remove Button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
                            className="absolute top-1 right-1 p-1 bg-black/50 backdrop-blur-md rounded-full hover:bg-red-500/90 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                            <X size={12} className="text-white" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ImageGalleryStrip;
