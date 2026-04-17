// QuickSell.jsx - User-driven sell flow with Stitch Premium Design
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Camera, Sparkles, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import CameraViewfinder from '../components/sell/CameraViewfinder';
import QuickSellLanding from '../components/sell/QuickSellLanding';
import QuickSellDetails from '../components/sell/QuickSellDetails';
import SpiralBackground from '../components/common/SpiralBackground';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { listingsAPI, uploadImage, jobsAPI } from '../services/api';
import { useProductAnalysis } from '../hooks/useProductAnalysis';

const QuickSell = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading } = useAuth();
    const { success, error, info } = useToast();

    // Auth guard: redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login', { state: { from: '/sell/quick', message: 'Please log in to create a listing' } });
        }
    }, [isAuthenticated, isLoading, navigate]);

    const {
        analyzeImage,
        isAnalyzing,
        analysisResult: aiAnalysisResult, // Renamed to avoid conflict with local state
        stockImage,
        fetchStockImage,
        setStockImage
    } = useProductAnalysis();

    const fileInputRef = useRef(null);

    // Flow: capture → details
    const [step, setStep] = useState('capture');
    const [showCamera, setShowCamera] = useState(false);
    const [isAutoDetect, setIsAutoDetect] = useState(true);

    // Image Gallery State
    const [gallery, setGallery] = useState([]);
    const [currentImageId, setCurrentImageId] = useState(null);
    const [useProMode, setUseProMode] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        askingPrice: '',
        category: '',
        condition: 'good',
        brand: '',
        model: ''
    });

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--void-deep)]">
                <Loader className="animate-spin text-legion-gold" size={48} />
            </div>
        );
    }

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhanceStatus, setEnhanceStatus] = useState('');
    const [enhanceProgress, setEnhanceProgress] = useState(0);
    const [localError, setLocalError] = useState(''); // Renamed to avoid conflict with toast error

    // Async Job State
    const [jobId, setJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null);
    const [jobProgress, setJobProgress] = useState(0);

    // Poll for job status
    useEffect(() => {
        let interval;
        if (jobId && jobStatus !== 'completed' && jobStatus !== 'failed') {
            interval = setInterval(async () => {
                try {
                    const status = await jobsAPI.getStatus(jobId);
                    setJobStatus(status.status);
                    setJobProgress(status.progress || 0);

                    if (status.status === 'completed') {
                        clearInterval(interval);
                        // Navigate to the created listing
                        navigate('/my-listings', { state: { success: true } });
                    }

                    if (status.status === 'failed') {
                        clearInterval(interval);
                        setLocalError(status.error || 'Listing creation failed');
                        setIsSubmitting(false);
                        setJobId(null);
                    }
                } catch (err) {
                    console.error('Polling error:', err);
                    setLocalError('Failed to get job status.');
                    clearInterval(interval);
                    setIsSubmitting(false);
                    setJobId(null);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [jobId, jobStatus, navigate]);

    // --- Actions ---

    const addToGallery = async (src, file = null) => {
        const newId = Date.now().toString() + Math.random().toString().slice(2);
        const newImage = {
            id: newId,
            src,
            file, // Original File object
            timestamp: Date.now(),
            status: 'original',
            enhancedSrc: null
        };

        setGallery(prev => [newImage, ...prev]);
        setCurrentImageId(newId);

        // Auto-Detect if enabled
        if (isAutoDetect && file && !aiAnalysisResult) {
            info("Auto-detecting product details...");
            await analyzeImage(file);
        }
    };

    // Helper: Resize Image to max 1500px
    const resizeImage = (file) => new Promise((resolve) => {
        // Fail-safe timeout: Return original if resizing takes > 2 seconds
        const timeoutId = setTimeout(() => {
            console.warn("⚠️ Resize timed out, using original:", file.name);
            resolve({ src: URL.createObjectURL(file), file });
        }, 2000);

        if (!file.type.startsWith('image/')) {
            clearTimeout(timeoutId);
            resolve({ src: URL.createObjectURL(file), file });
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                clearTimeout(timeoutId);
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_SIZE = 1500;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve({ src: URL.createObjectURL(file), file });
                        return;
                    }
                    const resizedFile = new File([blob], file.name, { type: 'image/jpeg' });
                    resolve({
                        src: canvas.toDataURL('image/jpeg', 0.85),
                        file: resizedFile
                    });
                }, 'image/jpeg', 0.85);
            };

            img.onerror = () => {
                clearTimeout(timeoutId);
                console.warn("⚠️ Image load failed, using original:", file.name);
                resolve({ src: URL.createObjectURL(file), file });
            };
        };

        reader.onerror = () => {
            clearTimeout(timeoutId);
            console.warn("⚠️ FileReader failed, using original:", file.name);
            resolve({ src: URL.createObjectURL(file), file });
        };
    });

    const handleCameraCapture = async (blob) => {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const { src, file: resizedFile } = await resizeImage(file);
        addToGallery(src, resizedFile);
        setShowCamera(false);
        setStep('details');
    };

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        console.log("📸 Frontend: Processing", files.length, "images...");

        // Process all files
        const processedImages = await Promise.all(files.map(async (file) => {
            try {
                const result = await resizeImage(file);
                console.log("   ✅ Resized:", file.name, "->", result.file.size, "bytes");
                return result;
            } catch (err) {
                console.error("   ❌ Resize Failed:", file.name, err);
                return null;
            }
        }));

        processedImages.filter(Boolean).forEach(({ src, file }) => {
            addToGallery(src, file);
        });
        setStep('details');
    };

    const enhancePhoto = async (targetId) => {
        const targetImage = gallery.find(img => img.id === targetId);
        if (!targetImage || !targetImage.file) return;

        // Update status in gallery
        setGallery(prev => prev.map(img =>
            img.id === targetId ? { ...img, status: 'enhancing' } : img
        ));

        setIsEnhancing(true);
        const file = targetImage.file;
        setEnhanceStatus(useProMode ? 'Neuro-Studio Processing...' : 'Removing background...');
        setEnhanceProgress(10);

        try {
            // Stage 1: Convert to base64 for preview (already done via src)
            setEnhanceProgress(30);

            // Stage 2: Send to backend
            const formDataPayload = new FormData();
            formDataPayload.append('file', file);
            // Add context images
            gallery.forEach(img => {
                if (img.file && img.file !== file) {
                    formDataPayload.append('secondary_files', img.file);
                }
            });

            const pName = formData.title || aiAnalysisResult?.title || '';
            formDataPayload.append('product_name', pName);
            formDataPayload.append('category', formData.category);
            formDataPayload.append('mode', useProMode ? 'pro' : 'fast');

            const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

            // Simulation
            const progressInterval = setInterval(() => {
                setEnhanceProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + (useProMode ? 2 : 10);
                });
            }, 500);

            const response = await fetch(`${API_URL}/ai/enhance-photo`, {
                method: 'POST',
                body: formDataPayload
            });

            clearInterval(progressInterval);

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.image_data) {
                    setEnhanceProgress(100);

                    // Update Gallery Item
                    setGallery(prev => prev.map(img =>
                        img.id === targetId ? {
                            ...img,
                            status: 'enhanced',
                            enhancedSrc: result.image_data
                        } : img
                    ));

                    success("Enhanced successfully!");
                } else {
                    throw new Error(result.error || 'No image data');
                }
            } else {
                throw new Error('Server Error');
            }
        } catch (err) {
            console.error('Enhance failed:', err);
            setGallery(prev => prev.map(img =>
                img.id === targetId ? { ...img, status: 'error' } : img
            ));
            error("Enhancement failed");
        } finally {
            setTimeout(() => {
                setIsEnhancing(false);
                setEnhanceProgress(0);
            }, 1000);
        }
    };

    const handleSubmit = async () => {
        if (!formData.askingPrice) {
            error("Please enter a price");
            return;
        }

        setIsSubmitting(true);
        setLocalError(''); // Clear previous errors

        try {
            // Sort: Selected image first
            const sortedGallery = [...gallery].sort((a, b) => {
                if (a.id === currentImageId) return -1;
                if (b.id === currentImageId) return 1;
                return 0;
            });

            // Upload images
            const uploadedImageUrls = await Promise.all(sortedGallery.map(async (img) => {
                let fileToUpload = img.file;

                // If enhanced/stock (base64) and no file, convert to file
                if ((img.status === 'enhanced' || img.isStock) && img.enhancedSrc) {
                    const res = await fetch(img.enhancedSrc);
                    const blob = await res.blob();
                    fileToUpload = new File([blob], `enhanced-${img.id}.png`, { type: 'image/png' });
                }

                if (!fileToUpload && img.src.startsWith('blob:')) {
                    const res = await fetch(img.src);
                    const blob = await res.blob();
                    fileToUpload = new File([blob], `original-${img.id}.jpg`, { type: 'image/jpeg' });
                }

                if (fileToUpload) {
                    const uploadRes = await uploadImage(fileToUpload);
                    return uploadRes.url;
                }
                return null;
            }));

            const validUrls = uploadedImageUrls.filter(url => url !== null);

            if (validUrls.length === 0) {
                throw new Error("No images to upload");
            }

            const listingData = {
                title: formData.title,
                description: formData.description || aiAnalysisResult?.description || `Selling ${formData.title}`,
                price: parseFloat(formData.askingPrice),
                category: formData.category || 'other',
                condition: formData.condition,
                images: validUrls,
                brand: formData.brand,
                model: formData.model,
                currency: 'INR', // Default
                location: {
                    type: 'Point',
                    coordinates: [77.5946, 12.9716] // Default Bangalore
                }
            };

            const response = await listingsAPI.create(listingData);

            // Handle async response
            if (response.jobId) {
                setJobId(response.jobId);
                setJobStatus(response.status);
                setJobProgress(0);
                // Don't navigate yet, let the polling effect handle it
            } else {
                // Fallback for sync response (if any)
                navigate('/my-listings', { state: { success: true } });
            }

        } catch (err) {
            console.error(err);
            setLocalError(err.message || "Failed to create listing");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black overflow-hidden font-sans">
            <SpiralBackground />

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*"
                id="hidden-input"
                onChange={handleGalleryUpload}
            />

            <AnimatePresence mode="wait">
                {showCamera ? (
                    <motion.div
                        key="camera"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black"
                    >
                        <CameraViewfinder
                            onCapture={handleCameraCapture}
                            onClose={() => setShowCamera(false)}
                        />
                    </motion.div>
                ) : step === 'capture' ? (
                    <motion.div
                        key="landing"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="h-full"
                    >
                        <QuickSellLanding
                            onSelectCamera={() => setShowCamera(true)}
                            onSelectGallery={() => fileInputRef.current.click()}
                            isAutoDetect={isAutoDetect}
                            setIsAutoDetect={setIsAutoDetect}
                            gallery={gallery}
                            onContinue={() => setStep('details')}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="details"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="h-full"
                    >
                        <QuickSellDetails
                            gallery={gallery}
                            setGallery={setGallery}
                            currentImageId={currentImageId}
                            setCurrentImageId={setCurrentImageId}
                            formData={formData}
                            setFormData={setFormData}
                            onBack={() => setStep('capture')}
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                            // Enhancer
                            onEnhance={enhancePhoto}
                            isEnhancing={isEnhancing}
                            enhanceStatus={enhanceStatus}
                            enhanceProgress={enhanceProgress}
                            useProMode={useProMode}
                            setUseProMode={setUseProMode}
                            // Analyzer
                            isAnalyzing={isAnalyzing}
                            analysisResult={aiAnalysisResult} // Use renamed prop
                            stockImage={stockImage}
                            onFetchStock={fetchStockImage}
                            // Added Prop for Robust Resizing
                            onAddImages={handleGalleryUpload}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Async Progress Overlay */}
            <AnimatePresence>
                {jobId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
                    >
                        <div className="bg-legion-card p-8 rounded-2xl max-w-md w-full border border-white/10 shadow-2xl">
                            <div className="text-center mb-6">
                                <Sparkles className="w-12 h-12 text-legion-gold mx-auto mb-4 animate-pulse" />
                                <h3 className="text-2xl font-bold text-white mb-2">Creating Your Listing</h3>
                                <p className="text-gray-400">AI is analyzing and optimizing your listing...</p>
                            </div>

                            <div className="relative pt-1">
                                <div className="flex mb-2 items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-legion-gold bg-legion-gold/10">
                                            {jobStatus === 'queued' && 'Queued'}
                                            {jobStatus === 'active' && 'Processing'}
                                            {jobStatus === 'completed' && 'Done!'}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-semibold inline-block text-legion-gold">
                                            {Math.round(jobProgress)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${jobProgress}%` }}
                                        transition={{ duration: 0.5 }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-legion-gold to-yellow-600"
                                    ></motion.div>
                                </div>
                                <p className="text-center text-xs text-gray-500 mt-2">
                                    {jobProgress < 30 ? 'Uploading images...' :
                                        jobProgress < 60 ? 'Analyzing with Gemini AI...' :
                                            'Finalizing details...'}
                                </p>
                            </div>
                            {localError && (
                                <div className="mt-4 text-center text-red-500 text-sm">
                                    <AlertCircle className="inline-block w-4 h-4 mr-1" />
                                    {localError}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuickSell;
