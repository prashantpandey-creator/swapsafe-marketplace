// QuickSell.jsx - User-driven sell flow with Stitch Premium Design
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Sparkles, Loader, ChevronLeft, Zap, CheckCircle, AlertCircle, Package, MapPin, Image as ImageIcon, Search, Info, Maximize2, Plus, Smartphone, Shirt, Home, Trophy, Book, Box } from 'lucide-react';
import CameraViewfinder from '../components/sell/CameraViewfinder';
import SpiralBackground from '../components/common/SpiralBackground';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { listingsAPI, uploadImage } from '../services/api';

// Categories with enhanced icons
const CATEGORIES = [
    { id: 'electronics', name: 'Electronics', icon: <Smartphone size={20} />, examples: 'Phones, Laptops' },
    { id: 'fashion', name: 'Fashion', icon: <Shirt size={20} />, examples: 'Clothes, Shoes' },
    { id: 'home', name: 'Home', icon: <Home size={20} />, examples: 'Furniture' },
    { id: 'sports', name: 'Sports', icon: <Trophy size={20} />, examples: 'Gear, Equipment' },
    { id: 'books', name: 'Books', icon: <Book size={20} />, examples: 'Textbooks' },
    { id: 'other', name: 'Other', icon: <Box size={20} />, examples: 'Misc' }
];

const CONDITIONS = [
    { id: 'new', label: 'Brand New', desc: 'Sealed/Unused', multiplier: 0.90 },
    { id: 'like-new', label: 'Like New', desc: 'Used 1-2 times', multiplier: 0.75 },
    { id: 'good', label: 'Good', desc: 'Regular use', multiplier: 0.55 },
    { id: 'fair', label: 'Fair', desc: 'Visible wear', multiplier: 0.35 }
];

const QuickSell = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { success, error, info } = useToast();
    const fileInputRef = useRef(null);

    // Flow: capture → details → price → confirm
    const [step, setStep] = useState('capture');
    const [showCamera, setShowCamera] = useState(false);

    // Image Gallery State
    const [gallery, setGallery] = useState([]);
    const [useProMode, setUseProMode] = useState(true); // Default to SOTA

    // Helper: Add image to gallery
    const addToGallery = (src, type, file = null, isMain = false) => {
        setGallery(prev => {
            const newImage = {
                id: Date.now().toString() + Math.random().toString().slice(2),
                src,
                type,
                file,
                isMain: isMain || prev.length === 0,
                timestamp: Date.now()
            };
            if (newImage.isMain) {
                return [...prev.map(img => ({ ...img, isMain: false })), newImage];
            }
            return [...prev, newImage];
        });
    };

    // Form State
    const [formData, setFormData] = useState({
        title: '', brand: '', model: '', category: '', condition: '',
        originalPrice: '', askingPrice: '', location: { city: '', state: '' }
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // AI Enhancement State
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhanceStatus, setEnhanceStatus] = useState('');

    // AI Enhance photo
    const enhancePhoto = async (file, productName = '') => {
        if (!file) return;
        setIsEnhancing(true);
        setEnhanceStatus('Preparing image...');

        try {
            // Stage 1: Convert to base64
            const reader = new FileReader();
            const base64Promise = new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
            });
            reader.readAsDataURL(file);
            await base64Promise;

            // Stage 2: Send to backend
            setEnhanceStatus('Sending to AI engine...');

            const formDataPayload = new FormData();
            formDataPayload.append('file', file);
            gallery.forEach(img => {
                if (img.file && img.file !== file) {
                    formDataPayload.append('secondary_files', img.file);
                }
            });
            formDataPayload.append('product_name', productName || `${formData.brand} ${formData.model}`);
            formDataPayload.append('brand', formData.brand);
            formDataPayload.append('model', formData.model);
            formDataPayload.append('category', formData.category);
            formDataPayload.append('mode', useProMode ? 'pro' : 'fast');

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/ai/enhance-photo`, {
                method: 'POST',
                body: formDataPayload
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.image_data) {
                    setEnhanceStatus('Complete!');
                    addToGallery(result.image_data, 'enhanced', null, true);
                    success("Photo enhanced successfully!");
                } else {
                    throw new Error('No image data in response');
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (err) {
            console.error('Enhance failed:', err);
            setEnhanceStatus('');
            error(`Enhancement failed: ${err.message || 'Unknown error'}`);
        } finally {
            setIsEnhancing(false);
        }
    };

    // Handle camera capture
    const handleCameraCapture = async (imageUrl, file) => {
        setShowCamera(false);
        addToGallery(imageUrl, 'original', file, true);
        setStep('details');
        info("Photo captured. Enhancing recommended.");
    };

    // Handle Gallery Upload with Validation
    const handleGalleryUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation: Type
        if (!file.type.startsWith('image/')) {
            error("Please upload an image file (JPG, PNG)");
            return;
        }

        // Validation: Size (Max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            error("File too large. Max size is 5MB.");
            return;
        }

        const url = URL.createObjectURL(file);
        addToGallery(url, 'original', file, true);
        setStep('details');
        success("Image uploaded successfully");
    };

    // Submit listing
    const handleSubmit = async () => {
        if (!formData.askingPrice) {
            setErrors({ askingPrice: 'Required' });
            error("Please enter a price");
            return;
        }

        setIsSubmitting(true);

        try {
            const sortedGallery = [...gallery].sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0));
            const images = [];

            for (const img of sortedGallery) {
                if (img.type === 'original' && img.file) {
                    try {
                        const uploadedUrl = await uploadImage(img.file);
                        images.push(uploadedUrl);
                    } catch (uploadError) {
                        console.warn('Upload failed, using local URL', uploadError);
                        images.push(img.src);
                    }
                } else {
                    images.push(img.src);
                }
            }

            if (images.length === 0) {
                setErrors({ image: 'At least one image is required' });
                error("Please add at least one photo");
                setIsSubmitting(false);
                return;
            }

            const title = [formData.brand, formData.model, formData.title].filter(Boolean).join(' ').trim() || 'Product';

            const listingData = {
                title,
                description: `${title} in ${formData.condition} condition.`,
                category: formData.category,
                condition: formData.condition,
                price: parseFloat(formData.askingPrice),
                images,
                location: formData.location || { city: 'Unknown', state: '' },
                originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
            };

            await listingsAPI.create(listingData);
            success("Listing published successfully!");
            navigate('/my-listings', { state: { success: true } });

        } catch (err) {
            console.error('Submit error:', err);
            error(err.message || 'Failed to create listing. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ... [Rest of the render code remains largely the same, just updated refs/vars] ...

    return (
        <div className="min-h-screen text-white font-sans selection:bg-[var(--legion-gold-dim)] overflow-hidden relative">
            {/* Global Animated Background */}
            <SpiralBackground />

            <AnimatePresence>
                {showCamera && (
                    <CameraViewfinder
                        onCapture={handleCameraCapture}
                        onClose={() => setShowCamera(false)}
                        guideText="Center your item"
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="sticky top-0 z-40 bg-[var(--void-deep)]/80 backdrop-blur-xl border-b border-white/5 pt-safe">
                <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-base font-bold tracking-wide font-mono-tactical text-[var(--legion-gold)]">SELL ITEM</h1>
                    <div className="w-10"></div> {/* Spacer */}
                </div>
            </div>

            <main className="max-w-md mx-auto px-4 py-6 relative z-10 pb-32">
                <AnimatePresence mode="wait">
                    {step === 'capture' ? (
                        <motion.div
                            key="capture"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2 mt-8">
                                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                                    What are you selling?
                                </h2>
                                <p className="text-gray-400 text-sm">Snap a photo and we'll help you list it.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setShowCamera(true)}
                                    className="aspect-square rounded-3xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center gap-4 group hover:border-[var(--legion-gold)]/50 transition-all shadow-xl hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                                >
                                    <div className="w-16 h-16 rounded-full bg-[var(--void-deep)] flex items-center justify-center border border-white/10 group-hover:border-[var(--legion-gold)] transition-colors">
                                        <Camera size={32} className="text-white group-hover:text-[var(--legion-gold)] transition-colors" />
                                    </div>
                                    <span className="font-bold text-lg tracking-wide">Camera</span>
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center gap-4 group hover:bg-white/10 transition-all"
                                >
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                        <ImageIcon size={32} className="text-gray-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <span className="font-medium text-gray-300 tracking-wide">Gallery</span>
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-8"
                        >
                            {/* Image Preview Area */}
                            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl group">
                                {gallery.length > 0 ? (
                                    <img
                                        src={gallery.find(img => img.isMain)?.src || gallery[0]?.src}
                                        alt="Main"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">No Image</div>
                                )}

                                {/* Loading / Status Overlay */}
                                {isEnhancing && (
                                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                        <Loader className="animate-spin text-[var(--legion-gold)] mb-3" size={32} />
                                        <p className="text-white font-bold tracking-wide">{enhanceStatus}</p>
                                        <p className="text-gray-400 text-xs mt-1 font-mono-tactical">
                                            {useProMode ? 'SEARCHING NEURAL NETWORKS...' : 'FAST ENHANCEMENT PROTOCOL'}
                                        </p>
                                    </div>
                                )}

                                {/* Controls Overlay */}
                                <div className="absolute bottom-4 right-4 left-4 flex items-center justify-between z-10">
                                    {/* Pro Mode Toggle */}
                                    <button
                                        onClick={() => setUseProMode(!useProMode)}
                                        className={`px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-bold transition-all flex items-center gap-1.5 ${useProMode
                                            ? 'bg-[var(--legion-gold-dim)] border-[var(--legion-gold)] text-[var(--legion-gold)]'
                                            : 'bg-black/40 border-white/10 text-gray-400'}`}
                                    >
                                        <Zap size={12} className={useProMode ? 'fill-current' : ''} />
                                        {useProMode ? 'PRO MODE' : 'FAST'}
                                    </button>

                                    <div className="flex gap-2">
                                        {/* Enhance Button */}
                                        {gallery.length > 0 && !isEnhancing && (
                                            <button
                                                onClick={() => {
                                                    const mainImg = gallery.find(img => img.isMain) || gallery[0];
                                                    if (mainImg.file) enhancePhoto(mainImg.file);
                                                }}
                                                disabled={isEnhancing}
                                                className="p-3 rounded-full bg-[var(--legion-gold)] text-black shadow-[0_0_20px_var(--legion-gold-glow)] hover:scale-110 transition-transform"
                                            >
                                                <Sparkles size={20} />
                                            </button>
                                        )}

                                        {/* Add More Button */}
                                        <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-colors">
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Horizontal Category Scroller (Stitch Design) */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 tracking-wider mb-3 block uppercase font-mono-tactical">Category</label>
                                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sticky">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setFormData({ ...formData, category: cat.id })}
                                            className={`flex flex-col items-center gap-2 min-w-[80px] p-3 rounded-2xl border transition-all ${formData.category === cat.id
                                                ? 'bg-[var(--legion-gold)] text-black border-[var(--legion-gold)] shadow-[0_0_20px_var(--legion-gold-glow)] scale-105'
                                                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="bg-transparent">{cat.icon}</div>
                                            <span className="text-[10px] font-bold">{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Details Form with Glassmorphism */}
                            <div className="space-y-5 p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 tracking-wider uppercase font-mono-tactical">Title</label>
                                    <input
                                        type="text"
                                        placeholder="What are you selling?"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-transparent border-b border-white/10 py-3 text-xl font-medium placeholder-gray-600 focus:border-[var(--legion-gold)] focus:outline-none transition-colors"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs font-bold text-gray-500 tracking-wider uppercase font-mono-tactical">Brand</label>
                                        <input
                                            type="text"
                                            placeholder="Brand"
                                            value={formData.brand}
                                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                            className="w-full bg-transparent border-b border-white/10 py-2 text-base focus:border-[var(--legion-gold)] focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs font-bold text-gray-500 tracking-wider uppercase font-mono-tactical">Model</label>
                                        <input
                                            type="text"
                                            placeholder="Model"
                                            value={formData.model}
                                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                                            className="w-full bg-transparent border-b border-white/10 py-2 text-base focus:border-[var(--legion-gold)] focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Condition Chips */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 tracking-wider mb-3 block uppercase font-mono-tactical">Condition</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CONDITIONS.map(cond => (
                                            <button
                                                key={cond.id}
                                                onClick={() => setFormData({ ...formData, condition: cond.id })}
                                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${formData.condition === cond.id
                                                    ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                                                    : 'bg-transparent text-gray-400 border-white/20 hover:border-white/40'
                                                    }`}
                                            >
                                                {cond.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="pt-2">
                                    <label className="text-xs font-bold text-[var(--legion-gold)] tracking-wider mb-2 block uppercase font-mono-tactical">Price</label>
                                    <div className="relative">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-light text-gray-500">$</span>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={formData.askingPrice}
                                            onChange={e => setFormData({ ...formData, askingPrice: e.target.value })}
                                            className="w-full bg-transparent border-none pl-6 text-4xl font-bold text-white placeholder-gray-700 focus:ring-0 p-0 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-8 sticky bottom-6 z-20">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[var(--legion-gold)] to-yellow-500 text-black font-extrabold text-lg shadow-[0_0_40px_var(--legion-gold-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader className="animate-spin" /> : <Zap className="fill-current" />}
                                    <span className="tracking-wider">POST LISTING</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
        </div>
    );
};

export default QuickSell;
