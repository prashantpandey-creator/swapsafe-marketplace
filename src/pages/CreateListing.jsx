import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Sparkles, X, DollarSign, Tag, MapPin, Loader, CheckCircle, ChevronRight, Zap, TrendingUp, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIEngineStatusBadge } from '../components/ai/AIEngineStatus';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, aiAPI, uploadImage } from '../services/api';

// Simplified Categories for Guardian Marketplace
const CATEGORIES = [
    { id: 'electronics', name: 'Electronics', icon: '📱' },
    { id: 'fashion', name: 'Fashion', icon: '👕' },
    { id: 'home', name: 'Home & Living', icon: '🏠' },
    { id: 'sports', name: 'Sports & Outdoors', icon: '⚽' },
    { id: 'books', name: 'Books & Media', icon: '📚' },
    { id: 'other', name: 'Other', icon: '📦' }
];

const CONDITIONS = [
    { id: 'new', label: 'Brand New', desc: 'Unused, in original packaging' },
    { id: 'like-new', label: 'Like New', desc: 'Minimal use, no visible wear' },
    { id: 'good', label: 'Good', desc: 'Some signs of use, fully functional' },
    { id: 'fair', label: 'Fair', desc: 'Visible wear, works perfectly' }
];

const CreateListing = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    // Image State
    const [productImage, setProductImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    // AI State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [priceEstimate, setPriceEstimate] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        condition: 'good',
        price: '',
        location: { city: '', state: '' }
    });

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Handle Image Upload
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setProductImage(objectUrl);
        setImageFile(file);

        // Trigger AI Analysis
        analyzeProductImage(file);
    };

    // AI Analysis - Get suggestions and price estimate
    const analyzeProductImage = async (file) => {
        setIsAnalyzing(true);
        setAiSuggestions(null);
        setPriceEstimate(null);

        try {
            // Call AI to analyze the image
            const analysis = await aiAPI.analyzeImage(file);

            setAiSuggestions(analysis);

            // Auto-fill form with AI suggestions
            setFormData(prev => ({
                ...prev,
                title: analysis.title || prev.title,
                category: analysis.category || prev.category,
                condition: analysis.condition || prev.condition
            }));

            // Set price estimate
            if (analysis.estimatedPrice) {
                setPriceEstimate({
                    suggested: analysis.estimatedPrice,
                    retail: analysis.originalPrice,
                    confidence: analysis.confidence,
                    reasoning: analysis.reasoning
                });

                // Auto-fill suggested price
                setFormData(prev => ({
                    ...prev,
                    price: analysis.estimatedPrice.toString()
                }));
            }
        } catch (error) {
            console.error('AI Analysis failed:', error);
            // Continue without AI - user can fill manually
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Re-estimate price when category/condition changes
    const getNewPriceEstimate = async () => {
        if (!formData.title || !formData.category || !formData.condition) return;

        try {
            const result = await aiAPI.estimatePrice({
                title: formData.title,
                description: formData.description,
                category: formData.category,
                condition: formData.condition
            });

            if (result.success && result.estimate) {
                setPriceEstimate({
                    suggested: result.estimate.value,
                    retail: result.estimate.retailPrice,
                    confidence: result.estimate.confidence,
                    reasoning: result.estimate.reasoning
                });
            }
        } catch (error) {
            console.error('Price estimation failed:', error);
        }
    };

    // Form Validation
    const validateForm = () => {
        const newErrors = {};
        if (!productImage) newErrors.image = 'Please add a photo of your item';
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.category) newErrors.category = 'Select a category';
        if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Enter a valid price';
        if (!formData.location.city.trim()) newErrors.city = 'City is required';
        if (!formData.location.state.trim()) newErrors.state = 'State is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit Listing
    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            // Upload image to Cloudinary
            let imageUrl = productImage;
            if (imageFile) {
                try {
                    imageUrl = await uploadImage(imageFile);
                } catch (uploadError) {
                    console.warn('Image upload failed, using local URL:', uploadError);
                }
            }

            const listingData = {
                title: formData.title.trim(),
                description: formData.description.trim() || `${formData.title} in ${formData.condition} condition.`,
                category: formData.category,
                condition: formData.condition,
                price: parseFloat(formData.price),
                originalPrice: priceEstimate?.retail || 0,
                images: [imageUrl],
                location: formData.location
            };

            await listingsAPI.create(listingData);
            navigate('/my-listings', { state: { success: true } });

        } catch (error) {
            console.error('Create listing error:', error);
            setErrors({ submit: error.message || 'Failed to create listing. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen pt-16 pb-24 bg-[var(--void-deep)]">
            {/* Header */}
            <div className="sticky top-16 z-40 bg-[var(--void-deep)]/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-white">Sell Your Item</h1>
                    <AIEngineStatusBadge size="sm" showLabel={false} />
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">

                {/* === SECTION 1: PHOTO === */}
                <section className="glass-panel p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--legion-gold)]/20 flex items-center justify-center">
                            <Camera className="text-[var(--legion-gold)]" size={20} />
                        </div>
                        <div>
                            <h2 className="text-white font-semibold">Add Photo</h2>
                            <p className="text-gray-500 text-xs">Snap a clear photo of your item</p>
                        </div>
                    </div>

                    {/* Image Preview / Upload */}
                    <div
                        className={`relative aspect-square rounded-xl border-2 border-dashed overflow-hidden transition-all
                            ${productImage
                                ? 'border-[var(--legion-gold)]/30 bg-black/20'
                                : 'border-white/20 bg-white/5 hover:border-[var(--legion-gold)] hover:bg-white/10 cursor-pointer'
                            }
                            ${errors.image ? 'border-red-500/50' : ''}
                        `}
                        onClick={() => !productImage && cameraInputRef.current?.click()}
                    >
                        {productImage ? (
                            <>
                                <img
                                    src={productImage}
                                    alt="Product"
                                    className="w-full h-full object-contain p-4"
                                />
                                {/* Remove Button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setProductImage(null); setImageFile(null); setAiSuggestions(null); setPriceEstimate(null); }}
                                    className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-red-500/80 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <X size={16} className="text-white" />
                                </button>

                                {/* AI Analyzing Overlay */}
                                <AnimatePresence>
                                    {isAnalyzing && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center"
                                        >
                                            <Sparkles className="text-[var(--legion-gold)] animate-pulse mb-3" size={32} />
                                            <p className="text-white text-sm font-medium">AI Analyzing...</p>
                                            <p className="text-gray-400 text-xs mt-1">Detecting item & estimating price</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                                    <Camera size={28} className="text-gray-400" />
                                </div>
                                <p className="text-white font-medium mb-1">Tap to take photo</p>
                                <p className="text-gray-500 text-xs">or upload from gallery</p>
                            </div>
                        )}
                    </div>

                    {/* Upload Buttons */}
                    {!productImage && (
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button
                                onClick={() => cameraInputRef.current?.click()}
                                className="flex items-center justify-center gap-2 py-3 bg-[var(--legion-gold)] text-black font-semibold rounded-lg hover:bg-[var(--legion-gold)]/90 transition-colors"
                            >
                                <Camera size={18} />
                                Camera
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center justify-center gap-2 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
                            >
                                <Upload size={18} />
                                Gallery
                            </button>
                        </div>
                    )}

                    {errors.image && <p className="text-red-400 text-xs mt-2">{errors.image}</p>}

                    {/* Hidden Inputs */}
                    <input type="file" ref={cameraInputRef} onChange={handleImageUpload} accept="image/*" capture="environment" className="hidden" />
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </section>

                {/* === SECTION 2: PRICE ESTIMATION (AI) === */}
                <AnimatePresence>
                    {priceEstimate && (
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="glass-panel p-5 border-[var(--legion-gold)]/30"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <TrendingUp className="text-green-400" size={20} />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-white font-semibold">AI Price Oracle</h2>
                                    <p className="text-gray-500 text-xs">{priceEstimate.confidence}% confidence</p>
                                </div>
                                <Sparkles className="text-[var(--legion-gold)]" size={20} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-500/10 rounded-lg p-4 text-center">
                                    <p className="text-gray-400 text-xs mb-1">Suggested Price</p>
                                    <p className="text-2xl font-bold text-green-400">₹{priceEstimate.suggested?.toLocaleString()}</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4 text-center">
                                    <p className="text-gray-400 text-xs mb-1">Retail Value</p>
                                    <p className="text-2xl font-bold text-white">₹{priceEstimate.retail?.toLocaleString()}</p>
                                </div>
                            </div>

                            {priceEstimate.reasoning && (
                                <p className="text-gray-400 text-xs mt-4 leading-relaxed">
                                    💡 {priceEstimate.reasoning}
                                </p>
                            )}
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* === SECTION 3: ITEM DETAILS === */}
                <section className="glass-panel p-5">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <Package className="text-purple-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-white font-semibold">Item Details</h2>
                            <p className="text-gray-500 text-xs">Describe what you're selling</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-gray-400 text-xs font-medium mb-2">TITLE *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="What are you selling?"
                                className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[var(--legion-gold)] transition-colors
                                    ${errors.title ? 'border-red-500/50' : 'border-white/10'}
                                `}
                            />
                            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-gray-400 text-xs font-medium mb-2">CATEGORY *</label>
                            <div className="grid grid-cols-3 gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => { setFormData({ ...formData, category: cat.id }); setTimeout(getNewPriceEstimate, 100); }}
                                        className={`py-3 px-2 rounded-lg text-center transition-all text-sm
                                            ${formData.category === cat.id
                                                ? 'bg-[var(--legion-gold)] text-black font-semibold'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }
                                        `}
                                    >
                                        <span className="text-lg block mb-1">{cat.icon}</span>
                                        <span className="text-[10px]">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                            {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
                        </div>

                        {/* Condition */}
                        <div>
                            <label className="block text-gray-400 text-xs font-medium mb-2">CONDITION</label>
                            <div className="grid grid-cols-2 gap-2">
                                {CONDITIONS.map(cond => (
                                    <button
                                        key={cond.id}
                                        type="button"
                                        onClick={() => { setFormData({ ...formData, condition: cond.id }); setTimeout(getNewPriceEstimate, 100); }}
                                        className={`py-3 px-3 rounded-lg text-left transition-all
                                            ${formData.condition === cond.id
                                                ? 'bg-[var(--legion-gold)]/20 border-[var(--legion-gold)] border text-white'
                                                : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                                            }
                                        `}
                                    >
                                        <span className="font-medium text-sm block">{cond.label}</span>
                                        <span className="text-[10px] text-gray-500">{cond.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-gray-400 text-xs font-medium mb-2">YOUR PRICE (₹) *</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0"
                                    className={`w-full bg-white/5 border rounded-lg pl-10 pr-4 py-3 text-white text-xl font-bold placeholder-gray-600 focus:outline-none focus:border-[var(--legion-gold)] transition-colors
                                        ${errors.price ? 'border-red-500/50' : 'border-white/10'}
                                    `}
                                />
                            </div>
                            {priceEstimate && formData.price && (
                                <p className={`text-xs mt-2 ${parseFloat(formData.price) < priceEstimate.suggested * 0.8 ? 'text-yellow-400' : 'text-green-400'}`}>
                                    {parseFloat(formData.price) < priceEstimate.suggested * 0.8
                                        ? '⚠️ Price is below recommended range'
                                        : parseFloat(formData.price) > priceEstimate.suggested * 1.2
                                            ? '📈 Price is above typical market value'
                                            : '✓ Great price for quick sale'
                                    }
                                </p>
                            )}
                            {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price}</p>}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-gray-400 text-xs font-medium mb-2">DESCRIPTION (Optional)</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Add more details about your item..."
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[var(--legion-gold)] transition-colors resize-none"
                            />
                        </div>

                        {/* Location */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-gray-400 text-xs font-medium mb-2">CITY *</label>
                                <input
                                    type="text"
                                    value={formData.location.city}
                                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
                                    placeholder="Mumbai"
                                    className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[var(--legion-gold)] transition-colors
                                        ${errors.city ? 'border-red-500/50' : 'border-white/10'}
                                    `}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs font-medium mb-2">STATE *</label>
                                <input
                                    type="text"
                                    value={formData.location.state}
                                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, state: e.target.value } })}
                                    placeholder="Maharashtra"
                                    className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[var(--legion-gold)] transition-colors
                                        ${errors.state ? 'border-red-500/50' : 'border-white/10'}
                                    `}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Error Display */}
                {errors.submit && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <p className="text-red-400 text-sm">{errors.submit}</p>
                    </div>
                )}

            </div>

            {/* Fixed Bottom Submit Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-[var(--void-deep)]/95 backdrop-blur-xl border-t border-white/10 p-4">
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || isAnalyzing}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                            ${isSubmitting || isAnalyzing
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-[var(--legion-gold)] text-black hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]'
                            }
                        `}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader className="animate-spin" size={20} />
                                Creating Listing...
                            </>
                        ) : (
                            <>
                                <Zap size={20} />
                                List for ₹{formData.price ? parseFloat(formData.price).toLocaleString() : '0'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateListing;
