// StudioMode.jsx - Guided multi-angle capture for 3D model generation
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronLeft, Box, Check, RotateCw, Sparkles, Loader, ChevronRight, Play, X, Image as ImageIcon } from 'lucide-react';
import CameraViewfinder from '../components/sell/CameraViewfinder';
import Product3DSpinner from '../components/product/Product3DSpinner';
import PriceOracle from '../components/sell/PriceOracle';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, uploadImage } from '../services/api';

// Capture angles for 3D reconstruction
const CAPTURE_ANGLES = [
    { id: 'front', name: 'Front View', instruction: 'Face the front of your item', icon: '📷' },
    { id: 'left', name: 'Left Side', instruction: 'Rotate item 90° to show left side', icon: '⬅️' },
    { id: 'back', name: 'Back View', instruction: 'Rotate item to show the back', icon: '🔄' },
    { id: 'right', name: 'Right Side', instruction: 'Rotate item to show right side', icon: '➡️' },
    { id: 'top', name: 'Top View', instruction: 'Capture from above (optional)', icon: '⬆️', optional: true },
    { id: 'detail', name: 'Detail Shot', instruction: 'Any important details/logos', icon: '🔍', optional: true }
];

const CATEGORIES = [
    { id: 'electronics', name: 'Electronics', icon: '📱' },
    { id: 'fashion', name: 'Fashion', icon: '👕' },
    { id: 'home', name: 'Home', icon: '🏠' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'books', name: 'Books', icon: '📚' },
    { id: 'other', name: 'Other', icon: '📦' }
];

const StudioMode = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef(null);

    // UI State
    const [step, setStep] = useState('intro'); // intro, capture, generating, details
    const [showCamera, setShowCamera] = useState(false);
    const [currentAngle, setCurrentAngle] = useState(0);

    // Image State
    const [capturedImages, setCapturedImages] = useState({});
    const [modelUrl, setModelUrl] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationStatus, setGenerationStatus] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        condition: 'good',
        price: '',
        location: { city: '', state: '' }
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Handle camera capture for current angle
    const handleCapture = (imageUrl, file) => {
        setShowCamera(false);

        const angleId = CAPTURE_ANGLES[currentAngle].id;
        setCapturedImages(prev => ({
            ...prev,
            [angleId]: { url: imageUrl, file }
        }));

        // Move to next angle or generate
        if (currentAngle < CAPTURE_ANGLES.length - 1) {
            setCurrentAngle(prev => prev + 1);
        }
    };

    // Skip optional angle
    const skipAngle = () => {
        if (currentAngle < CAPTURE_ANGLES.length - 1) {
            setCurrentAngle(prev => prev + 1);
        }
    };

    // Retake specific angle
    const retakeAngle = (angleIndex) => {
        setCurrentAngle(angleIndex);
        setShowCamera(true);
    };

    // Check if minimum required angles are captured
    const hasMinimumImages = () => {
        const requiredAngles = CAPTURE_ANGLES.filter(a => !a.optional);
        return requiredAngles.every(a => capturedImages[a.id]);
    };

    // Generate 3D Model
    const generate3DModel = async () => {
        setStep('generating');
        setIsGenerating(true);
        setGenerationProgress(0);

        const progressSteps = [
            { progress: 10, status: 'Uploading images...' },
            { progress: 25, status: 'Analyzing geometry...' },
            { progress: 50, status: 'Building mesh...' },
            { progress: 75, status: 'Applying textures...' },
            { progress: 90, status: 'Optimizing for web...' },
            { progress: 100, status: 'Complete!' }
        ];

        try {
            // Simulate progress while calling API
            for (let i = 0; i < progressSteps.length; i++) {
                await new Promise(r => setTimeout(r, 800));
                setGenerationProgress(progressSteps[i].progress);
                setGenerationStatus(progressSteps[i].status);
            }

            // Actually call the AI engine
            const imageFiles = Object.values(capturedImages).map(img => img.file);
            const formDataPayload = new FormData();

            imageFiles.forEach((file, index) => {
                formDataPayload.append('files', file, `view_${index}.jpg`);
            });
            formDataPayload.append('title', formData.title || 'Product');
            formDataPayload.append('category', formData.category || 'other');

            // Use env variable for AI engine URL (local dev or Cloudflare Tunnel in production)
            const AI_ENGINE_URL = import.meta.env.VITE_AI_ENGINE_URL || 'http://localhost:8000';
            const response = await fetch(`${AI_ENGINE_URL}/api/v1/studio/generate-3d`, {
                method: 'POST',
                body: formDataPayload
            });

            if (response.ok) {
                const result = await response.json();
                setModelUrl(result.model_url);
            } else {
                // No 3D model available - will use image spinner instead
                console.log('3D generation unavailable, using image spinner');
                setModelUrl(null);
            }

            setStep('details');
        } catch (error) {
            console.error('3D Generation error:', error);
            // Fall back to image spinner (no astronaut!)
            setModelUrl(null);
            setStep('details');
        } finally {
            setIsGenerating(false);
        }
    };

    // Handle gallery upload
    const handleGalleryUpload = (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach((file, index) => {
            const url = URL.createObjectURL(file);
            const angleId = CAPTURE_ANGLES[index]?.id;
            if (angleId) {
                setCapturedImages(prev => ({
                    ...prev,
                    [angleId]: { url, file }
                }));
            }
        });
        if (files.length > 0) {
            setCurrentAngle(Math.min(files.length, CAPTURE_ANGLES.length - 1));
        }
    };

    // Submit listing
    const handleSubmit = async () => {
        if (!formData.title || !formData.price || !formData.category) {
            setErrors({ submit: 'Please fill all required fields' });
            return;
        }

        setIsSubmitting(true);

        try {
            // Get primary image URL
            const primaryImage = capturedImages.front?.url || Object.values(capturedImages)[0]?.url;

            const listingData = {
                title: formData.title.trim(),
                description: formData.description || `${formData.title} - Premium 3D listing`,
                category: formData.category,
                condition: formData.condition,
                price: parseFloat(formData.price),
                images: Object.values(capturedImages).map(img => img.url),
                modelUrl: modelUrl,
                location: formData.location
            };

            await listingsAPI.create(listingData);
            navigate('/my-listings', { state: { success: true } });

        } catch (error) {
            console.error('Submit error:', error);
            setErrors({ submit: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const capturedCount = Object.keys(capturedImages).length;
    const requiredCount = CAPTURE_ANGLES.filter(a => !a.optional).length;

    return (
        <div className="min-h-screen bg-[var(--void-deep)]">
            {/* Camera Viewfinder */}
            <AnimatePresence>
                {showCamera && (
                    <CameraViewfinder
                        onCapture={handleCapture}
                        onClose={() => setShowCamera(false)}
                        guideText={CAPTURE_ANGLES[currentAngle]?.instruction}
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
                        <h1 className="text-lg font-bold text-white">3D Studio</h1>
                        <p className="text-gray-500 text-xs">Create immersive product views</p>
                    </div>
                    <Box className="text-purple-400" size={20} />
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
                <AnimatePresence mode="wait">
                    {/* INTRO */}
                    {step === 'intro' && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            <div className="text-center py-8">
                                <div className="w-24 h-24 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
                                    <Box size={40} className="text-purple-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">3D Model Generator</h2>
                                <p className="text-gray-400 max-w-xs mx-auto">
                                    Capture your item from multiple angles to create an interactive 3D view
                                </p>
                            </div>

                            {/* Angle Preview Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                {CAPTURE_ANGLES.slice(0, 6).map((angle, idx) => (
                                    <div key={angle.id} className="aspect-square bg-white/5 rounded-lg flex flex-col items-center justify-center border border-white/10">
                                        <span className="text-2xl mb-1">{angle.icon}</span>
                                        <span className="text-xs text-gray-500">{angle.name}</span>
                                        {angle.optional && <span className="text-[8px] text-gray-600">Optional</span>}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setStep('capture')}
                                className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                            >
                                <Play size={20} />
                                Start Scanning
                            </button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-3 bg-white/10 text-white font-medium rounded-xl flex items-center justify-center gap-2"
                            >
                                <ImageIcon size={18} />
                                Upload Multiple Photos
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleGalleryUpload}
                                className="hidden"
                            />
                        </motion.div>
                    )}

                    {/* CAPTURE */}
                    {step === 'capture' && (
                        <motion.div
                            key="capture"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Progress */}
                            <div className="text-center mb-4">
                                <p className="text-gray-400 text-sm mb-2">
                                    Photo {capturedCount + 1} of {CAPTURE_ANGLES.length}
                                </p>
                                <div className="flex gap-1 justify-center">
                                    {CAPTURE_ANGLES.map((_, idx) => (
                                        <div key={idx} className={`w-8 h-1 rounded-full ${capturedImages[CAPTURE_ANGLES[idx].id]
                                            ? 'bg-purple-500'
                                            : idx === currentAngle
                                                ? 'bg-white/50'
                                                : 'bg-white/10'
                                            }`} />
                                    ))}
                                </div>
                            </div>

                            {/* Current Angle Info */}
                            <div className="glass-panel p-6 text-center">
                                <span className="text-4xl mb-4 block">{CAPTURE_ANGLES[currentAngle]?.icon}</span>
                                <h3 className="text-xl font-bold text-white mb-2">{CAPTURE_ANGLES[currentAngle]?.name}</h3>
                                <p className="text-gray-400">{CAPTURE_ANGLES[currentAngle]?.instruction}</p>
                            </div>

                            {/* Captured Images Grid */}
                            <div className="grid grid-cols-4 gap-2">
                                {CAPTURE_ANGLES.map((angle, idx) => (
                                    <div
                                        key={angle.id}
                                        onClick={() => capturedImages[angle.id] && retakeAngle(idx)}
                                        className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer ${capturedImages[angle.id]
                                            ? 'border-purple-500/50'
                                            : 'border-white/10 bg-white/5'
                                            }`}
                                    >
                                        {capturedImages[angle.id] ? (
                                            <img src={capturedImages[angle.id].url} alt={angle.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-gray-600 text-lg">{angle.icon}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setShowCamera(true)}
                                    className="py-4 bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                                >
                                    <Camera size={20} />
                                    Capture
                                </button>

                                {CAPTURE_ANGLES[currentAngle]?.optional && (
                                    <button
                                        onClick={skipAngle}
                                        className="py-4 bg-white/10 text-white font-medium rounded-xl"
                                    >
                                        Skip
                                    </button>
                                )}
                            </div>

                            {/* Generate Button */}
                            {hasMinimumImages() && (
                                <button
                                    onClick={generate3DModel}
                                    className="w-full py-4 bg-gradient-to-r from-[var(--legion-gold)] to-amber-600 text-black font-bold rounded-xl flex items-center justify-center gap-2"
                                >
                                    <Sparkles size={20} />
                                    Generate 3D Model ({capturedCount} photos)
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* GENERATING */}
                    {step === 'generating' && (
                        <motion.div
                            key="generating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="py-12 text-center"
                        >
                            <div className="w-32 h-32 mx-auto mb-8 relative">
                                <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full" />
                                <motion.div
                                    className="absolute inset-0 border-4 border-t-purple-500 rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                />
                                <div className="absolute inset-4 bg-purple-500/20 rounded-full flex items-center justify-center">
                                    <Box className="text-purple-400" size={40} />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">Generating 3D Model</h2>
                            <p className="text-gray-400 mb-6">{generationStatus}</p>

                            {/* Progress Bar */}
                            <div className="max-w-xs mx-auto mb-8">
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${generationProgress}%` }}
                                    />
                                </div>
                                <p className="text-right text-sm text-gray-500 mt-1">{generationProgress}%</p>
                            </div>

                            {/* Image Preview Grid */}
                            <div className="flex justify-center gap-2 flex-wrap">
                                {Object.values(capturedImages).slice(0, 4).map((img, idx) => (
                                    <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden opacity-60">
                                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* DETAILS (with 3D Preview) */}
                    {step === 'details' && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* 3D Model or Image Spinner Preview */}
                            <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-500/30">
                                {/* Always pass captured images - shows 3D model if available, otherwise 360° image spinner */}
                                <Product3DSpinner
                                    modelUrl={modelUrl}
                                    images={Object.values(capturedImages).map(i => i.url)}
                                />
                            </div>

                            {/* Price Oracle */}
                            <PriceOracle
                                productTitle={formData.title}
                                category={formData.category}
                                condition={formData.condition}
                                userPrice={formData.price}
                                onSuggestedPrice={(p) => setFormData({ ...formData, price: p.toString() })}
                            />

                            {/* Form */}
                            <div className="glass-panel p-5 space-y-4">
                                <h3 className="text-white font-semibold flex items-center gap-2">
                                    <Box className="text-purple-400" size={18} />
                                    Listing Details
                                </h3>

                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Product Title *"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600"
                                />

                                <div className="grid grid-cols-3 gap-2">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setFormData({ ...formData, category: cat.id })}
                                            className={`py-2 rounded-lg text-center ${formData.category === cat.id
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-white/5 text-gray-400'
                                                }`}
                                        >
                                            <span className="block">{cat.icon}</span>
                                            <span className="text-[10px]">{cat.name}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="Price"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white text-xl font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={formData.location.city}
                                        onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
                                        placeholder="City"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600"
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

                            {errors.submit && (
                                <p className="text-red-400 text-sm text-center">{errors.submit}</p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Fixed Bottom CTA */}
            {step === 'details' && (
                <div className="fixed bottom-0 left-0 right-0 bg-[var(--void-deep)]/95 backdrop-blur-xl border-t border-white/10 p-4">
                    <div className="max-w-lg mx-auto">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 ${isSubmitting
                                ? 'bg-gray-600 text-gray-400'
                                : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader className="animate-spin" size={20} />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Box size={20} />
                                    List with 3D View
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudioMode;
