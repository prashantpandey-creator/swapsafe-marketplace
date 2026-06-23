// QuickSell.jsx - User-driven sell flow with Stitch Premium Design
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Camera, Sparkles, AlertCircle, CheckCircle, Loader, ShieldAlert, ShieldCheck } from 'lucide-react';
import CameraViewfinder from '../components/sell/CameraViewfinder';
import QuickSellLanding from '../components/sell/QuickSellLanding';
import QuickSellDetails from '../components/sell/QuickSellDetails';
import SpiralBackground from '../components/common/SpiralBackground';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { listingsAPI, uploadImage, jobsAPI, aiAPI } from '../services/api';
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
    const [proCleanupQuota, setProCleanupQuota] = useState(null);

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

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhanceStatus, setEnhanceStatus] = useState('');
    const [enhanceProgress, setEnhanceProgress] = useState(0);
    const [localError, setLocalError] = useState(''); // Renamed to avoid conflict with toast error

    // Async Job State
    const [jobId, setJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null);
    const [jobProgress, setJobProgress] = useState(0);

    // Trust Score nudge — shown before publish when AI finds issues
    const [trustNudge, setTrustNudge] = useState(null); // { trustScore, band, issues[], summary }
    const [pendingListingData, setPendingListingData] = useState(null); // held while nudge is shown

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

    // Show loading while checking auth (must be after all hooks)
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--void-deep)]">
                <Loader className="animate-spin text-legion-gold" size={48} />
            </div>
        );
    }

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

            const enhanceAbort = new AbortController();
            const enhanceTimer = setTimeout(() => enhanceAbort.abort(), 30000);

            const response = await fetch(`${API_URL}/ai/enhance-photo`, {
                method: 'POST',
                body: formDataPayload,
                signal: enhanceAbort.signal,
            });

            clearTimeout(enhanceTimer);
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
                            enhancedSrc: result.image_data,
                            lowQuality: !!result.low_quality,
                            alphaQuality: result.alpha_quality ?? null
                        } : img
                    ));

                    if (result.low_quality) {
                        // Cutout is uncertain (cluttered/low-contrast photo). Don't
                        // block — just nudge the seller toward a cleaner shot.
                        success("Enhanced — but the cutout looks rough. A photo against a plain wall works best.");
                    } else {
                        success("Enhanced successfully!");
                    }
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

    const proCleanupPhoto = async (targetId) => {
        const targetImage = gallery.find(img => img.id === targetId);
        if (!targetImage || !targetImage.file) return;

        const imgDims = await new Promise(resolve => {
            const im = new Image();
            im.onload = () => resolve({ w: im.naturalWidth, h: im.naturalHeight });
            im.onerror = () => resolve(null);
            im.src = targetImage.src;
        });
        if (imgDims && Math.min(imgDims.w, imgDims.h) < 400) {
            info(`Image is only ${imgDims.w}×${imgDims.h}px — cleanup may produce artifacts. Try a higher-res photo.`);
        }

        setGallery(prev => prev.map(img =>
            img.id === targetId ? { ...img, status: 'enhancing' } : img
        ));

        setIsEnhancing(true);
        setEnhanceStatus('Pro Cleanup — removing hands...');
        setEnhanceProgress(5);

        try {
            const formDataPayload = new FormData();
            formDataPayload.append('file', targetImage.file);

            const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

            const token = localStorage.getItem('swapsafe_token');

            const progressInterval = setInterval(() => {
                setEnhanceProgress(prev => prev >= 90 ? prev : prev + 1.5);
            }, 500);

            const cleanupAbort = new AbortController();
            const cleanupTimer = setTimeout(() => cleanupAbort.abort(), 45000);

            const response = await fetch(`${API_URL}/ai/pro-cleanup`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formDataPayload,
                signal: cleanupAbort.signal,
            });

            clearTimeout(cleanupTimer);
            clearInterval(progressInterval);

            const remaining = response.headers.get('ratelimit-remaining');
            if (remaining !== null) setProCleanupQuota(parseInt(remaining, 10));

            if (response.status === 429) {
                throw new Error('Daily pro cleanup limit reached. Try again tomorrow!');
            }

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.image_data) {
                    setEnhanceProgress(100);
                    setGallery(prev => prev.map(img =>
                        img.id === targetId ? {
                            ...img,
                            status: 'enhanced',
                            enhancedSrc: result.image_data,
                            cleanupTier: result.tier || 'free',
                            lowQuality: result.tier === 'free-fallback',
                            alphaQuality: null,
                        } : img
                    ));

                    const elapsed = (result.processing_time_ms / 1000).toFixed(1);
                    if (result.tier === 'pro') {
                        success(`Pro cleanup — hand removed & upscaled (${elapsed}s)`);
                    } else if (result.tier === 'pro-fallback') {
                        info(`Background cleaned — hand removal unavailable right now (${elapsed}s)`);
                    } else {
                        success(`Background removed & cleaned (${elapsed}s) — upgrade to Pro for hand removal!`);
                    }
                } else {
                    throw new Error(result.error || 'No image data');
                }
            } else {
                throw new Error('Server error');
            }
        } catch (err) {
            console.error('Pro cleanup failed:', err);
            setGallery(prev => prev.map(img =>
                img.id === targetId ? { ...img, status: 'error' } : img
            ));
            error(err.message || 'Pro cleanup failed');
        } finally {
            setTimeout(() => {
                setIsEnhancing(false);
                setEnhanceProgress(0);
            }, 1000);
        }
    };

    // Actually post the listing to the backend (called after trust nudge is dismissed or skipped)
    const publishListing = async (data, trustResult) => {
        const payload = {
            ...data,
            trustScore: trustResult?.trustScore,
            trustBand: trustResult?.band,
            conditionBlemishes: trustResult?.blemishes || [],
        };

        const response = await listingsAPI.create(payload);

        if (response.jobId) {
            setJobId(response.jobId);
            setJobStatus(response.status);
            setJobProgress(0);
        } else {
            navigate('/my-listings', { state: { success: true } });
        }
    };

    const handleSubmit = async () => {
        if (!formData.askingPrice) {
            error("Please enter a price");
            return;
        }

        setIsSubmitting(true);
        setLocalError('');

        try {
            // Sort: selected image first
            const sortedGallery = [...gallery].sort((a, b) => {
                if (a.id === currentImageId) return -1;
                if (b.id === currentImageId) return 1;
                return 0;
            });

            // Upload images to Cloudinary
            const uploadedImageUrls = await Promise.all(sortedGallery.map(async (img) => {
                let fileToUpload = img.file;

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
                    // uploadImage() returns the URL string directly
                    return await uploadImage(fileToUpload);
                }
                return null;
            }));

            const validUrls = uploadedImageUrls.filter(Boolean);

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
                currency: 'INR',
                location: { city: 'Bangalore', state: 'Karnataka' },
            };

            // Run trust score against the ORIGINAL (first) photo URL.
            // Fail-open: if the call errors we skip the nudge and publish anyway.
            let trustResult = null;
            try {
                const originalImages = sortedGallery
                    .filter(img => !img.isStock && img.src)
                    .map(img => img.src)
                    .slice(0, 1);

                trustResult = await aiAPI.trustScore({
                    title: listingData.title,
                    description: listingData.description,
                    condition: listingData.condition,
                    price: listingData.price,
                    productName: formData.brand ? `${formData.brand} ${formData.model || ''}`.trim() : listingData.title,
                    images: originalImages.length ? originalImages : [validUrls[0]],
                });
            } catch (_) {
                // trust check is advisory — never block publish
            }

            // If the AI found real issues, show the nudge first
            const hasIssues = trustResult?.signals?.honestyDiff?.verdict === 'undisclosed_issues'
                || trustResult?.signals?.claimMatch?.verdict === 'mismatch';

            if (hasIssues && trustResult) {
                setPendingListingData(listingData);
                setTrustNudge(trustResult);
                setIsSubmitting(false);
                return;
            }

            // No issues (or check unavailable) — publish straight away
            await publishListing(listingData, trustResult);

        } catch (err) {
            console.error(err);
            setLocalError(err.message || "Failed to create listing");
            setIsSubmitting(false);
        }
    };

    // User acknowledged the nudge and wants to publish anyway
    const handlePublishAnyway = async () => {
        if (!pendingListingData) return;
        setTrustNudge(null);
        setIsSubmitting(true);
        try {
            await publishListing(pendingListingData, null);
        } catch (err) {
            setLocalError(err.message || "Failed to create listing");
            setIsSubmitting(false);
        }
        setPendingListingData(null);
    };

    // User wants to go back and fix the description
    const handleEditFromNudge = () => {
        setTrustNudge(null);
        setPendingListingData(null);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black overflow-hidden font-sans">
            <SpiralBackground />

            {/* Trust Nudge Modal */}
            <AnimatePresence>
                {trustNudge && (
                    <motion.div
                        key="trust-nudge"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.85)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md rounded-2xl p-6"
                            style={{ background: 'var(--void-surface)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <ShieldAlert size={24} className="text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-white font-semibold text-lg leading-snug">
                                        A couple of things to mention
                                    </h3>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {trustNudge.summary}
                                    </p>
                                </div>
                            </div>

                            {trustNudge.signals?.claimMatch?.verdict === 'mismatch' && (
                                <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                    <p className="text-red-300 text-sm font-medium">Photo mismatch</p>
                                    <p className="text-red-200/70 text-xs mt-0.5">
                                        {trustNudge.signals.claimMatch.explanation}
                                    </p>
                                </div>
                            )}

                            {trustNudge.signals?.honestyDiff?.issues?.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-amber-400 text-sm font-medium mb-2">
                                        Visible but not mentioned:
                                    </p>
                                    <ul className="space-y-1.5">
                                        {trustNudge.signals.honestyDiff.issues.map((issue, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                                <span className="text-amber-400/70 mt-0.5">•</span>
                                                <span>
                                                    <span className="capitalize">{issue.type}</span>
                                                    {issue.location ? ` — ${issue.location}` : ''}
                                                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                                                        issue.severity === 'major' ? 'bg-red-500/20 text-red-300' :
                                                        issue.severity === 'moderate' ? 'bg-amber-500/20 text-amber-300' :
                                                        'bg-gray-500/20 text-gray-400'
                                                    }`}>{issue.severity}</span>
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-gray-500 text-xs mt-2">
                                        Adding these to your description builds buyer trust and reduces disputes.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 mt-2">
                                <button
                                    onClick={handleEditFromNudge}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                                    style={{ background: 'var(--legion-gold)', color: '#000' }}
                                >
                                    Update description
                                </button>
                                <button
                                    onClick={handlePublishAnyway}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                                    style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'var(--text-secondary)' }}
                                >
                                    Publish anyway
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                            onProCleanup={proCleanupPhoto}
                            proCleanupQuota={proCleanupQuota}
                            userPlan={user?.plan || 'free'}
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
