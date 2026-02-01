// QuickSell.jsx - User-driven sell flow (no AI auto-detection)
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Sparkles, Loader, ChevronLeft, Zap, CheckCircle, AlertCircle, Package, MapPin, Image as ImageIcon, Search, Info } from 'lucide-react';
import CameraViewfinder from '../components/sell/CameraViewfinder';
import PriceOracle from '../components/sell/PriceOracle';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, uploadImage } from '../services/api';

// Categories
const CATEGORIES = [
    { id: 'electronics', name: 'Electronics', icon: '📱', examples: 'Phones, Laptops, Headphones' },
    { id: 'fashion', name: 'Fashion', icon: '👕', examples: 'Clothes, Shoes, Bags' },
    { id: 'home', name: 'Home', icon: '🏠', examples: 'Furniture, Appliances' },
    { id: 'sports', name: 'Sports', icon: '⚽', examples: 'Equipment, Gear' },
    { id: 'books', name: 'Books', icon: '📚', examples: 'Textbooks, Novels' },
    { id: 'other', name: 'Other', icon: '📦', examples: 'Everything else' }
];

const CONDITIONS = [
    { id: 'new', label: 'Brand New', desc: 'Sealed/Unused', multiplier: 0.90 },
    { id: 'like-new', label: 'Like New', desc: 'Used 1-2 times', multiplier: 0.75 },
    { id: 'good', label: 'Good', desc: 'Regular use, works great', multiplier: 0.55 },
    { id: 'fair', label: 'Fair', desc: 'Visible wear, fully functional', multiplier: 0.35 }
];

const QuickSell = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef(null);

    // Flow: capture → details → price → confirm
    const [step, setStep] = useState('capture');
    const [showCamera, setShowCamera] = useState(false);

    // Image State
    const [productImage, setProductImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    // Form State - USER PROVIDES EVERYTHING
    const [formData, setFormData] = useState({
        title: '',
        brand: '',
        model: '',
        category: '',
        condition: '',
        originalPrice: '', // What user paid originally
        askingPrice: '',   // What user wants to sell for
        location: { city: '', state: '' }
    });

    // Price lookup state
    const [isPriceLooking, setIsPriceLooking] = useState(false);
    const [priceData, setPriceData] = useState(null);
    const [priceError, setPriceError] = useState(null);

    // Submission State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // AI Enhancement State
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhancedImage, setEnhancedImage] = useState(null);
    const [enhanceError, setEnhanceError] = useState(null);

    // AI Enhance photo - removes background, adds white background
    // Optional productName helps AI understand what to extract
    const enhancePhoto = async (file, productName = '') => {
        setIsEnhancing(true);
        setEnhanceError(null);

        try {
            const formDataPayload = new FormData();
            formDataPayload.append('file', file);

            // Add product name if available for better segmentation
            if (productName) {
                formDataPayload.append('product_name', productName);
                console.log(`🎯 Enhancing with context: ${productName}`);
            }

            const response = await fetch('http://localhost:8000/api/v1/studio/enhance', {
                method: 'POST',
                body: formDataPayload
            });

            if (response.ok) {
                const result = await response.json();
                if (result.status === 'success' && result.image_data) {
                    setEnhancedImage(result.image_data);
                    console.log('✅ Photo enhanced with white background!');
                    return result.image_data;
                }
            }

            console.warn('Enhancement unavailable, using original');
            return null;
        } catch (error) {
            console.error('Enhancement error:', error);
            setEnhanceError('Could not enhance photo');
            return null;
        } finally {
            setIsEnhancing(false);
        }
    };


    // Handle camera capture - save image (no auto-enhance, user needs to enter details first)
    const handleCameraCapture = async (imageUrl, file) => {
        setShowCamera(false);
        setProductImage(imageUrl);
        setImageFile(file);
        setStep('details');
        // NO auto-enhance - wait for user to enter product name first
    };

    // Gallery upload
    const handleGalleryUpload = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setProductImage(url);
            setImageFile(file);
            setStep('details');
            // NO auto-enhance - wait for user to enter product name first
        }
    };


    // Construct search query from user inputs
    const getSearchQuery = () => {
        const parts = [formData.brand, formData.model, formData.title].filter(Boolean);
        return parts.join(' ').trim();
    };

    // Lookup price using exact user inputs
    const lookupPrice = async () => {
        const query = getSearchQuery();
        if (!query || query.length < 3) {
            setPriceError('Enter brand and model to search prices');
            return;
        }

        setIsPriceLooking(true);
        setPriceError(null);

        try {
            const token = localStorage.getItem('swapsafe_token');
            const params = new URLSearchParams({
                q: query,
                category: formData.category || '',
                condition: formData.condition || 'good',
                originalPrice: formData.originalPrice || ''
            });

            const response = await fetch(`http://localhost:5000/api/price/lookup?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success) {
                setPriceData(data.data);

                // Auto-suggest asking price based on condition
                if (data.data.retailPrice && formData.condition) {
                    const cond = CONDITIONS.find(c => c.id === formData.condition);
                    const suggestedPrice = Math.round(data.data.retailPrice * (cond?.multiplier || 0.55));
                    setFormData(prev => ({
                        ...prev,
                        askingPrice: prev.askingPrice || suggestedPrice.toString()
                    }));
                }
            } else {
                setPriceError(data.error || 'Could not find price');
            }
        } catch (error) {
            console.error('Price lookup error:', error);
            setPriceError('Price lookup failed. Try entering original price manually.');
        } finally {
            setIsPriceLooking(false);
        }
    };

    // Check if we have enough info to search
    const canSearchPrice = () => {
        const query = getSearchQuery();
        return query.length >= 3 && formData.category;
    };

    // Form validation
    const validateDetails = () => {
        const newErrors = {};
        if (!formData.title.trim() && !formData.model.trim()) {
            newErrors.title = 'Enter product name or model';
        }
        if (!formData.category) newErrors.category = 'Select a category';
        if (!formData.condition) newErrors.condition = 'Select condition';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validatePrice = () => {
        const newErrors = {};
        if (!formData.askingPrice || parseFloat(formData.askingPrice) <= 0) {
            newErrors.askingPrice = 'Enter your selling price';
        }
        if (!formData.location.city.trim()) newErrors.city = 'Enter your city';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Move to price step
    const goToPriceStep = () => {
        if (validateDetails()) {
            setStep('price');
            // Auto-trigger price lookup
            if (canSearchPrice()) {
                lookupPrice();
            }
        }
    };

    // Submit listing
    const handleSubmit = async () => {
        if (!validatePrice()) return;

        setIsSubmitting(true);

        try {
            // Prefer enhanced image (white background) if available
            let imageUrl = enhancedImage || productImage;

            // If we have the original file and no enhanced version, upload original
            if (imageFile && !enhancedImage) {
                try {
                    imageUrl = await uploadImage(imageFile);
                } catch (uploadError) {
                    console.warn('Upload failed, using local URL');
                }
            }


            const title = [formData.brand, formData.model, formData.title]
                .filter(Boolean)
                .join(' ')
                .trim() || 'Product';

            const listingData = {
                title,
                description: `${title} in ${formData.condition} condition.`,
                category: formData.category,
                condition: formData.condition,
                price: parseFloat(formData.askingPrice),
                images: [imageUrl],
                location: formData.location,
                originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
                retailPrice: priceData?.retailPrice || null
            };

            await listingsAPI.create(listingData);
            navigate('/my-listings', { state: { success: true } });

        } catch (error) {
            console.error('Submit error:', error);
            setErrors({ submit: error.message || 'Failed to create listing' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--void-deep)]">
            {/* Camera */}
            <AnimatePresence>
                {showCamera && (
                    <CameraViewfinder
                        onCapture={handleCameraCapture}
                        onClose={() => setShowCamera(false)}
                        guideText="Center your item in the frame"
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="sticky top-0 z-40 bg-[var(--void-deep)]/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <button onClick={() => navigate('/sell')} className="w-10 h-10 flex items-center justify-center text-gray-400">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-white">Quick Sell</h1>
                        <p className="text-gray-500 text-xs">
                            {step === 'capture' && 'Step 1: Take a photo'}
                            {step === 'details' && 'Step 2: Enter product details'}
                            {step === 'price' && 'Step 3: Set your price'}
                        </p>
                    </div>
                    <Zap className="text-[var(--legion-gold)]" size={20} />
                </div>

                {/* Progress */}
                <div className="max-w-lg mx-auto px-4 pb-4">
                    <div className="flex gap-2">
                        {['capture', 'details', 'price'].map((s, i) => (
                            <div
                                key={s}
                                className={`h-1 flex-1 rounded-full transition-colors ${['capture', 'details', 'price'].indexOf(step) >= i
                                    ? 'bg-[var(--legion-gold)]'
                                    : 'bg-white/10'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
                <AnimatePresence mode="wait">
                    {/* STEP 1: CAPTURE */}
                    {step === 'capture' && (
                        <motion.div
                            key="capture"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center py-8">
                                <div className="w-24 h-24 mx-auto bg-[var(--legion-gold)]/20 rounded-full flex items-center justify-center mb-6">
                                    <Camera size={40} className="text-[var(--legion-gold)]" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Take a Photo</h2>
                                <p className="text-gray-400 max-w-xs mx-auto">
                                    Snap a clear photo of your item
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setShowCamera(true)}
                                    className="py-6 bg-[var(--legion-gold)] text-black font-bold rounded-xl flex flex-col items-center gap-2"
                                >
                                    <Camera size={28} />
                                    <span>Camera</span>
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="py-6 bg-white/10 text-white font-medium rounded-xl flex flex-col items-center gap-2"
                                >
                                    <ImageIcon size={28} />
                                    <span>Gallery</span>
                                </button>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleGalleryUpload}
                                className="hidden"
                            />
                        </motion.div>
                    )}

                    {/* STEP 2: DETAILS - User provides everything */}
                    {step === 'details' && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {/* Image Preview - Shows enhanced version when ready */}
                            <div className={`aspect-video rounded-xl overflow-hidden relative ${enhancedImage ? 'bg-white' : 'bg-gradient-to-b from-gray-800 to-gray-900'}`}>
                                <img
                                    src={enhancedImage || productImage}
                                    alt="Product"
                                    className="w-full h-full object-contain"
                                />

                                {/* Enhancement Status Overlay */}
                                {isEnhancing && (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                                        <Loader className="animate-spin text-[var(--legion-gold)] mb-3" size={32} />
                                        <p className="text-white text-sm font-medium">Removing background...</p>
                                        <p className="text-gray-400 text-xs mt-1">Creating pro showcase photo</p>
                                    </div>
                                )}

                                {/* Enhanced Badge */}
                                {enhancedImage && !isEnhancing && (
                                    <div className="absolute top-3 left-3 bg-green-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                                        <Sparkles size={12} />
                                        Pro Photo Ready
                                    </div>
                                )}

                                {/* Retake Button */}
                                <button
                                    onClick={() => {
                                        setStep('capture');
                                        setEnhancedImage(null);
                                        setProductImage(null);
                                    }}
                                    className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                                >
                                    <Camera size={16} />
                                </button>

                                {/* Toggle Original/Enhanced */}
                                {enhancedImage && !isEnhancing && (
                                    <button
                                        onClick={() => setEnhancedImage(null)}
                                        className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full hover:bg-black/70 transition"
                                    >
                                        View Original
                                    </button>
                                )}
                                {!enhancedImage && productImage && !isEnhancing && (
                                    <button
                                        onClick={() => imageFile && enhancePhoto(imageFile, `${formData.brand} ${formData.model} ${formData.title}`.trim())}
                                        className="absolute bottom-3 left-3 bg-[var(--legion-gold)]/90 text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1"
                                    >
                                        <Sparkles size={12} />
                                        Enhance Photo
                                    </button>
                                )}
                            </div>

                            {/* Enhancement Error */}
                            {enhanceError && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-yellow-400 text-sm">
                                    ⚠️ {enhanceError} - Using original photo
                                </div>
                            )}

                            {/* Info Banner */}
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
                                <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                                <div>
                                    <p className="text-blue-400 text-sm font-medium">For accurate pricing</p>
                                    <p className="text-gray-400 text-xs mt-1">
                                        Enter the exact brand and model. We'll search current online prices.
                                    </p>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="glass-panel p-5 space-y-5">
                                {/* Brand */}
                                <div>
                                    <label className="block text-gray-400 text-xs font-medium mb-2">
                                        BRAND <span className="text-gray-600">(e.g., Sony, Apple, Nike)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        placeholder="Sony"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[var(--legion-gold)]"
                                    />
                                </div>

                                {/* Model */}
                                <div>
                                    <label className="block text-gray-400 text-xs font-medium mb-2">
                                        MODEL <span className="text-gray-600">(e.g., WH-1000XM4, iPhone 14)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.model}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                        placeholder="WH-1000XM4"
                                        className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[var(--legion-gold)] ${errors.title ? 'border-red-500/50' : 'border-white/10'}`}
                                    />
                                    {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                                </div>

                                {/* Title (optional extra description) */}
                                <div>
                                    <label className="block text-gray-400 text-xs font-medium mb-2">
                                        EXTRA DETAILS <span className="text-gray-600">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Noise cancelling headphones, black color"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[var(--legion-gold)]"
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-gray-400 text-xs font-medium mb-2">CATEGORY *</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, category: cat.id })}
                                                className={`py-3 rounded-lg text-center transition-all ${formData.category === cat.id
                                                    ? 'bg-[var(--legion-gold)] text-black font-semibold'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className="text-lg block">{cat.icon}</span>
                                                <span className="text-[10px]">{cat.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
                                </div>

                                {/* Condition */}
                                <div>
                                    <label className="block text-gray-400 text-xs font-medium mb-2">CONDITION *</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CONDITIONS.map(cond => (
                                            <button
                                                key={cond.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, condition: cond.id })}
                                                className={`py-3 px-4 rounded-lg text-left transition-all ${formData.condition === cond.id
                                                    ? 'bg-[var(--legion-gold)]/20 border-[var(--legion-gold)] border-2 text-white'
                                                    : 'bg-white/5 border border-white/10 text-gray-400'
                                                    }`}
                                            >
                                                <span className="font-medium block">{cond.label}</span>
                                                <span className="text-xs opacity-70">{cond.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {errors.condition && <p className="text-red-400 text-xs mt-1">{errors.condition}</p>}
                                </div>

                                {/* Original Price (optional but helpful) */}
                                <div>
                                    <label className="block text-gray-400 text-xs font-medium mb-2">
                                        ORIGINAL PURCHASE PRICE <span className="text-gray-600">(helps with accurate pricing)</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                        <input
                                            type="number"
                                            value={formData.originalPrice}
                                            onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                            placeholder="What you paid for it"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:border-[var(--legion-gold)]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* CREATE PRO PHOTO - Amazon Style */}
                            {!enhancedImage && productImage && (formData.brand || formData.model) && (
                                <div className="bg-gradient-to-r from-[var(--legion-gold)]/20 to-transparent border border-[var(--legion-gold)]/30 rounded-xl p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-[var(--legion-gold)]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="text-[var(--legion-gold)]" size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-white font-bold mb-1">Create Pro Photo</h3>
                                            <p className="text-gray-400 text-sm mb-4">
                                                AI will analyze "{(formData.brand + ' ' + formData.model).trim()}" and create an Amazon-style product photo with clean white background.
                                            </p>
                                            <button
                                                onClick={() => imageFile && enhancePhoto(imageFile, `${formData.brand} ${formData.model} ${formData.title}`.trim())}
                                                disabled={isEnhancing}
                                                className="w-full py-3 bg-[var(--legion-gold)] text-black font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {isEnhancing ? (
                                                    <>
                                                        <Loader className="animate-spin" size={18} />
                                                        Creating Pro Photo...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={18} />
                                                        Remove Background & Create Pro Photo
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Pro Photo Created Success */}
                            {enhancedImage && (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
                                    <CheckCircle className="text-green-400" size={24} />
                                    <div>
                                        <p className="text-green-400 font-medium">Pro Photo Created!</p>
                                        <p className="text-gray-400 text-sm">Amazon-style white background applied</p>
                                    </div>
                                </div>
                            )}

                            {/* Next Button */}
                            <button
                                onClick={goToPriceStep}
                                className="w-full py-4 bg-[var(--legion-gold)] text-black font-bold rounded-xl flex items-center justify-center gap-2"
                            >
                                <Search size={20} />
                                Find Price & Continue
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 3: PRICE */}
                    {step === 'price' && (
                        <motion.div
                            key="price"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {/* Product Summary */}
                            <div className="glass-panel p-4 flex gap-4">
                                <img
                                    src={productImage}
                                    alt="Product"
                                    className="w-20 h-20 object-cover rounded-lg bg-gray-800"
                                />
                                <div className="flex-1">
                                    <h3 className="text-white font-semibold">
                                        {formData.brand} {formData.model}
                                    </h3>
                                    <p className="text-gray-400 text-sm">{formData.title}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded">
                                            {CATEGORIES.find(c => c.id === formData.category)?.name}
                                        </span>
                                        <span className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded">
                                            {CONDITIONS.find(c => c.id === formData.condition)?.label}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep('details')}
                                    className="text-[var(--legion-gold)] text-sm"
                                >
                                    Edit
                                </button>
                            </div>

                            {/* Price Lookup Result */}
                            {isPriceLooking ? (
                                <div className="glass-panel p-6 text-center">
                                    <Loader className="animate-spin mx-auto mb-3 text-[var(--legion-gold)]" size={32} />
                                    <p className="text-white font-medium">Searching online prices...</p>
                                    <p className="text-gray-400 text-sm mt-1">Checking {getSearchQuery()}</p>
                                </div>
                            ) : priceData ? (
                                <div className="glass-panel p-5 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="text-green-400" size={18} />
                                        <span className="text-green-400 font-medium">Price Found!</span>
                                        <span className="text-gray-500 text-xs ml-auto">
                                            Source: {priceData.source || 'web'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 rounded-lg p-4 text-center">
                                            <p className="text-gray-400 text-xs mb-1">Retail Price</p>
                                            <p className="text-2xl font-bold text-white">
                                                ₹{priceData.retailPrice?.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-green-500/10 rounded-lg p-4 text-center border border-green-500/30">
                                            <p className="text-gray-400 text-xs mb-1">Suggested Resale</p>
                                            <p className="text-2xl font-bold text-green-400">
                                                ₹{priceData.suggestedRange?.max?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {priceData.confidence && (
                                        <div className="text-center text-gray-500 text-xs">
                                            Confidence: {priceData.confidence}% • {priceData.note}
                                        </div>
                                    )}
                                </div>
                            ) : priceError ? (
                                <div className="glass-panel p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertCircle className="text-yellow-400" size={18} />
                                        <span className="text-yellow-400 font-medium">Couldn't find exact price</span>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-4">{priceError}</p>
                                    <button
                                        onClick={lookupPrice}
                                        className="w-full py-2 bg-white/10 text-white rounded-lg text-sm"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : (
                                <div className="glass-panel p-5 text-center">
                                    <p className="text-gray-400">Enter details to search for current prices</p>
                                    <button
                                        onClick={lookupPrice}
                                        disabled={!canSearchPrice()}
                                        className="mt-4 px-6 py-2 bg-[var(--legion-gold)] text-black rounded-lg font-medium disabled:opacity-50"
                                    >
                                        Search Price
                                    </button>
                                </div>
                            )}

                            {/* User's Asking Price */}
                            <div className="glass-panel p-5">
                                <label className="block text-white font-medium mb-3">
                                    Your Selling Price *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">₹</span>
                                    <input
                                        type="number"
                                        value={formData.askingPrice}
                                        onChange={(e) => setFormData({ ...formData, askingPrice: e.target.value })}
                                        placeholder="0"
                                        className={`w-full bg-white/5 border rounded-xl pl-12 pr-4 py-4 text-white text-3xl font-bold placeholder-gray-600 focus:border-[var(--legion-gold)] ${errors.askingPrice ? 'border-red-500/50' : 'border-white/10'}`}
                                    />
                                </div>
                                {errors.askingPrice && <p className="text-red-400 text-xs mt-2">{errors.askingPrice}</p>}

                                {/* Savings Display */}
                                {priceData?.retailPrice && formData.askingPrice && (
                                    <div className="mt-4 bg-green-500/10 rounded-lg p-3 text-center">
                                        <span className="text-green-400 font-medium">
                                            Buyers save {Math.round((1 - (parseFloat(formData.askingPrice) / priceData.retailPrice)) * 100)}%
                                            (₹{(priceData.retailPrice - parseFloat(formData.askingPrice)).toLocaleString()})
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Location */}
                            <div className="glass-panel p-5">
                                <label className="block text-white font-medium mb-3 flex items-center gap-2">
                                    <MapPin size={18} />
                                    Pickup Location
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={formData.location.city}
                                        onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
                                        placeholder="City *"
                                        className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white placeholder-gray-600 ${errors.city ? 'border-red-500/50' : 'border-white/10'}`}
                                    />
                                    <input
                                        type="text"
                                        value={formData.location.state}
                                        onChange={(e) => setFormData({ ...formData, location: { ...formData.location, state: e.target.value } })}
                                        placeholder="State"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600"
                                    />
                                </div>
                            </div>

                            {/* Error */}
                            {errors.submit && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
                                    <AlertCircle className="text-red-400" size={20} />
                                    <p className="text-red-400 text-sm">{errors.submit}</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Fixed Bottom CTA */}
            {step === 'price' && (
                <div className="fixed bottom-0 left-0 right-0 bg-[var(--void-deep)]/95 backdrop-blur-xl border-t border-white/10 p-4">
                    <div className="max-w-lg mx-auto">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isSubmitting
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-[var(--legion-gold)] text-black hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader className="animate-spin" size={20} />
                                    Creating Listing...
                                </>
                            ) : (
                                <>
                                    <Zap size={20} />
                                    List for ₹{formData.askingPrice ? parseFloat(formData.askingPrice).toLocaleString() : '0'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickSell;
