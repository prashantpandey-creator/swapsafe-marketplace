import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Sparkles, Zap, ChevronRight, X, Loader, Search, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { listingsAPI } from '../../services/api'; // Correct API usage

const QuickSellDetails = ({
    gallery,
    setGallery,
    currentImageId,
    setCurrentImageId,
    formData,
    setFormData,
    onBack,
    onSubmit,
    isSubmitting,
    // Enhancement Props
    onEnhance,
    isEnhancing,
    enhanceStatus,
    enhanceProgress,
    useProMode,
    setUseProMode,
    // Analysis Props
    isAnalyzing,
    analysisResult,
    stockImage,
    onFetchStock,
    // Parent actions
    onAddImages // New prop for robust resizing
}) => {
    const currentImage = gallery.find(img => img.id === currentImageId);
    const [useStockImage, setUseStockImage] = useState(false);
    const [isRefining, setIsRefining] = useState(false);

    const [hasRefined, setHasRefined] = useState(false);

    // Initial Auto-fill (NO auto-refinement — wait for user to confirm name)
    useEffect(() => {
        if (analysisResult) {
            setFormData(prev => ({
                ...prev,
                title: analysisResult.title || prev.title,
                category: analysisResult.category || prev.category,
                condition: analysisResult.condition || prev.condition,
                brand: analysisResult.brand || prev.brand,
                model: analysisResult.model || prev.model,
                description: analysisResult.description || prev.description,
                askingPrice: (typeof analysisResult.price_estimate === 'number') ? analysisResult.price_estimate.toString() : prev.askingPrice
            }));
            setHasRefined(false);
        }
    }, [analysisResult]);

    // Refinement Trigger
    const handleRefinement = async () => {
        if (isRefining) return;

        const queryTitle = formData.title;
        const queryBrand = formData.brand;
        const queryModel = formData.model;

        if (!queryTitle && !queryModel) return;

        const compositeName = `${queryBrand || ''} ${queryModel || ''} ${queryTitle || ''}`.trim();
        if (!compositeName) return;

        setIsRefining(true);
        console.log("🔄 Triggering Refinement for:", compositeName);

        try {
            // Use the API service wrapper if available, or fetch with correct BASE_URL
            const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const cleanUrl = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

            const response = await fetch(`${cleanUrl}/ai/refine-listing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: compositeName,
                    condition: formData.condition,
                    conditionReport: analysisResult?.condition_report || 'Visual analysis available'
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                if (data.price_context) {
                    const usedPrice = data.price_context?.used_price;
                    const marketPrice = data.price_context?.current_market_price;
                    const marginalGain = data.price_context?.marginal_improvement;

                    Object.assign(analysisResult, {
                        market_price_context: {
                            new_price: marketPrice || null,
                            listing_price: usedPrice || null,
                            marginal_gain: marginalGain || null
                        },
                        price_estimate: (typeof usedPrice === 'number') ? usedPrice : null
                    });

                    if (usedPrice && typeof usedPrice === 'number') {
                        setFormData(prev => ({ ...prev, askingPrice: usedPrice.toString() }));
                    }
                }

                if (data.stock_image && onFetchStock) {
                    onFetchStock(compositeName);
                }
            }
        } catch (error) {
            console.error("Refinement error:", error);
        } finally {
            setIsRefining(false);
        }
    };

    const handleAddStockImage = () => {
        if (!stockImage) return;
        const newId = Date.now().toString();
        const newImage = {
            id: newId,
            src: stockImage.image_data,
            file: null,
            timestamp: Date.now(),
            status: 'enhanced',
            enhancedSrc: stockImage.image_data,
            isStock: true
        };
        setGallery(prev => [newImage, ...prev]);
        setCurrentImageId(newId);
        setUseStockImage(true);
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-black text-white font-sans overflow-hidden">

            {/* --- LEFT COLUMN: PREVIEW (60%) --- */}
            <div className="relative w-full md:w-[60%] h-[40vh] md:h-full bg-zinc-900/50 flex items-center justify-center p-8 group">
                <button onClick={onBack} className="absolute top-6 left-6 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors z-20">
                    <ChevronRight className="rotate-180 text-white" size={24} />
                </button>

                {currentImage ? (
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={currentImage.enhancedSrc || currentImage.src}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            src={currentImage.enhancedSrc || currentImage.src}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain drop-shadow-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                        />
                        {/* Loading/Enhancing Overlay */}
                        {isEnhancing && gallery.find(img => img.id === currentImageId)?.status === 'enhancing' && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-30">
                                <Loader className="animate-spin text-[var(--legion-gold)] mb-4" size={48} />
                                <p className="text-xl font-bold text-white tracking-widest font-mono-tactical animate-pulse">{enhanceStatus}</p>
                                <div className="w-64 h-1.5 bg-white/10 rounded-full mt-6 overflow-hidden">
                                    <div className="h-full bg-[var(--legion-gold)] transition-all duration-300 ease-out" style={{ width: `${enhanceProgress}%` }} />
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                ) : (
                    <div className="text-gray-500 flex flex-col items-center gap-2">
                        <AlertCircle size={32} />
                        <p>Select an image to preview</p>
                    </div>
                )}

                {/* Enhancement Controls */}
                {!currentImage?.isStock && currentImage && (
                    <div className="absolute bottom-8 flex gap-4 z-20">
                        <button
                            onClick={() => setUseProMode(!useProMode)}
                            className={`h-12 px-4 rounded-xl flex items-center gap-2 backdrop-blur-xl border transition-all ${useProMode
                                ? 'bg-[var(--legion-gold)]/10 border-[var(--legion-gold)] text-[var(--legion-gold)]'
                                : 'bg-black/60 border-white/10 text-gray-400'
                                }`}
                        >
                            <Zap size={18} className={useProMode ? 'fill-current' : ''} />
                            <span className="text-xs font-black">{useProMode ? 'PRO MODE' : 'FAST MODE'}</span>
                        </button>
                        <button
                            onClick={() => onEnhance(currentImageId)}
                            disabled={isEnhancing}
                            className="h-12 px-6 rounded-xl bg-white text-black font-black hover:bg-[var(--legion-gold)] transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                            <Sparkles size={18} fill="black" />
                            {currentImage.status === 'enhanced' ? 'REDO ENHANCE' : 'ENHANCE PHOTO'}
                        </button>
                    </div>
                )}
            </div>

            {/* --- RIGHT COLUMN: DETAILS (40%) --- */}
            <div className="w-full md:w-[40%] h-[60vh] md:h-full bg-black border-l border-white/10 flex flex-col shadow-2xl z-30">

                {/* 1. Persistent Gallery Strip (Fixed Top) */}
                <div className="p-4 border-b border-white/10 bg-black/90 backdrop-blur-xl z-20">
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {/* Add Button */}
                        <label className="flex-shrink-0 w-16 h-16 rounded-lg bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center gap-1 hover:bg-white/10 hover:border-white/40 cursor-pointer transition-all group">
                            <input
                                type="file"
                                className="hidden"
                                multiple
                                accept="image/*"
                                onChange={onAddImages}
                            />
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[var(--legion-gold)] group-hover:text-black transition-colors">
                                <Plus size={14} />
                            </div>
                            <span className="text-[9px] text-gray-400 font-bold uppercase">ADD</span>
                        </label>

                        {/* Images */}
                        {gallery.map(img => (
                            <div
                                key={img.id}
                                onClick={() => setCurrentImageId(img.id)}
                                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all group/thumb ${currentImageId === img.id
                                    ? 'border-[var(--legion-gold)] ring-2 ring-[var(--legion-gold)]/20 scale-105 z-10'
                                    : 'border-transparent opacity-60 hover:opacity-100 hover:border-white/20'
                                    }`}
                            >
                                <img src={img.enhancedSrc || img.src} className="w-full h-full object-cover" />
                                {img.status === 'enhanced' && (
                                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--legion-gold)] shadow-[0_0_8px_var(--legion-gold)]"></div>
                                )}
                                {/* Remove Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newGallery = gallery.filter(g => g.id !== img.id);
                                        setGallery(newGallery);
                                        if (currentImageId === img.id) {
                                            setCurrentImageId(newGallery.length > 0 ? newGallery[0].id : null);
                                        }
                                    }}
                                    className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity z-10 hover:bg-red-400 shadow-lg"
                                >
                                    <X size={10} strokeWidth={3} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scrollable Form Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                    {/* AI Analysis Card */}
                    {(isAnalyzing || analysisResult) && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-5 rounded-xl bg-gradient-to-br from-[var(--legion-gold)]/10 to-transparent border border-[var(--legion-gold)]/20 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-20"><Sparkles size={64} className="text-[var(--legion-gold)]" /></div>

                            {isAnalyzing ? (
                                <div className="flex items-center gap-3">
                                    <Loader size={20} className="animate-spin text-[var(--legion-gold)]" />
                                    <span className="text-sm font-medium text-[var(--legion-gold)] animate-pulse">Scanning item details...</span>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-[10px] font-bold text-[var(--legion-gold)] tracking-[0.2em] mb-3">AI ANALYSIS</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">CONDITION</span>
                                            <div className="flex items-center gap-2 text-white font-bold text-sm">
                                                <div className={`w-2 h-2 rounded-full ${analysisResult?.condition === 'new' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                                {analysisResult?.condition?.toUpperCase() || 'UNKNOWN'}
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1 leading-tight line-clamp-2">{analysisResult?.condition_report || ''}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">EST. VALUE</span>
                                            {analysisResult?.price_estimate ? (
                                                <span className="text-xl font-black text-[var(--legion-gold)] font-mono-tactical">₹{analysisResult.price_estimate}</span>
                                            ) : !hasRefined ? (
                                                <span className="text-xs text-gray-500 italic">Edit name below, then tap "Get Price"</span>
                                            ) : isRefining ? (
                                                <span className="text-sm text-gray-400 animate-pulse">Estimating...</span>
                                            ) : (
                                                <span className="text-sm text-gray-500">---</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Get Price & Stock Button */}
                                    {!hasRefined && !isRefining && (
                                        <button
                                            onClick={() => { setHasRefined(true); handleRefinement(); }}
                                            className="mt-4 w-full py-2.5 rounded-lg bg-gradient-to-r from-[var(--legion-gold)]/20 to-[var(--legion-gold)]/10 border border-[var(--legion-gold)]/30 text-[var(--legion-gold)] text-xs font-bold tracking-wider hover:from-[var(--legion-gold)]/30 hover:to-[var(--legion-gold)]/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Search size={14} />
                                            GET PRICE & STOCK IMAGE
                                        </button>
                                    )}
                                    {isRefining && (
                                        <div className="mt-4 flex items-center justify-center gap-2 py-2">
                                            <Loader size={14} className="animate-spin text-[var(--legion-gold)]" />
                                            <span className="text-xs text-[var(--legion-gold)] animate-pulse">Finding price & stock image...</span>
                                        </div>
                                    )}

                                    {stockImage && !useStockImage && (
                                        <div onClick={handleAddStockImage} className="mt-4 pt-3 border-t border-[var(--legion-gold)]/10 flex items-center gap-3 cursor-pointer group">
                                            <img src={stockImage.image_data} className="w-8 h-8 rounded bg-white/10" />
                                            <div className="flex-1">
                                                <span className="text-xs text-blue-300 font-bold group-hover:underline">Stock Photo Found</span>
                                                <span className="text-[10px] text-gray-500 block">Tap to use professional image</span>
                                            </div>
                                            <ArrowRight size={14} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* Form Fields */}
                    <div className="space-y-5">
                        <h2 className="font-cinzel text-xl text-white border-b border-white/10 pb-2">Listing Details</h2>

                        <div className="space-y-4">
                            {/* Brand & Model */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 ml-1">BRAND</label>
                                    <input value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} onBlur={handleRefinement}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-[var(--legion-gold)] outline-none transition-colors" placeholder="Brand" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 ml-1">MODEL</label>
                                    <input value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} onBlur={handleRefinement}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-[var(--legion-gold)] outline-none transition-colors" placeholder="Model" />
                                </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 ml-1">TITLE</label>
                                <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} onBlur={handleRefinement}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-[var(--legion-gold)] outline-none transition-colors" placeholder="Item Title" />
                            </div>

                            {/* Price & Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 ml-1">PRICE (₹)</label>
                                    <input type="number" value={formData.askingPrice} onChange={e => setFormData({ ...formData, askingPrice: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-lg font-bold text-[var(--legion-gold)] focus:border-[var(--legion-gold)] outline-none transition-colors" placeholder="0" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 ml-1">CATEGORY</label>
                                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:border-[var(--legion-gold)] outline-none transition-colors appearance-none">
                                        <option value="">Select...</option>
                                        <option value="electronics">Electronics</option>
                                        <option value="fashion">Fashion</option>
                                        <option value="home">Home</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Condition */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 ml-1">CONDITION</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['new', 'good', 'fair'].map(c => (
                                        <button key={c} onClick={() => setFormData({ ...formData, condition: c })}
                                            className={`py-2 rounded-lg text-xs font-bold uppercase border transition-all ${formData.condition === c
                                                ? 'bg-[var(--legion-gold)] text-black border-[var(--legion-gold)]' : 'bg-white/5 text-gray-500 border-transparent hover:bg-white/10'}`}>
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 ml-1">DESCRIPTION</label>
                                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm min-h-[100px] focus:border-[var(--legion-gold)] outline-none transition-colors" placeholder="Describe your item..." />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="p-4 border-t border-white/10 bg-black/90 backdrop-blur-xl">
                    <button onClick={onSubmit} disabled={isSubmitting}
                        className="w-full h-14 bg-[var(--legion-gold)] hover:bg-yellow-400 text-black font-black text-lg rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 group">
                        {isSubmitting ? <Loader className="animate-spin" /> : (
                            <><span>POST LISTING</span><ArrowRight className="group-hover:translate-x-1 transition-transform" strokeWidth={3} /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickSellDetails;
