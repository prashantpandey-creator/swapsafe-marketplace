import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Box, Download, Sun, Share2, AlertCircle, Clock, RefreshCw, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadImage } from '../services/api';
import './ThreeDStudio.css';

const ThreeDStudio = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const [image, setImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [modelData, setModelData] = useState(null);
    const [error, setError] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [timeoutWarning, setTimeoutWarning] = useState(false);
    const abortControllerRef = useRef(null);

    const PROCESSING_STEPS = [
        { label: 'Uploading image...', duration: 2000 },
        { label: 'Analyzing depth...', duration: 3000 },
        { label: 'Generating mesh...', duration: 4000 },
        { label: 'Texturing model...', duration: 3000 },
        { label: 'Exporting GLB...', duration: 2000 }
    ];

    const TIMEOUT_MS = 30000; // 30 second timeout

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImage(URL.createObjectURL(file));
        setImageFile(file);
        setModelData(null);
        setError(null);
        setCurrentStep(0);
        setTimeoutWarning(false);
    };

    const handleGenerate = async () => {
        if (!imageFile) return;

        setIsProcessing(true);
        setError(null);
        setCurrentStep(0);
        setTimeoutWarning(false);

        // Create abort controller for timeout
        abortControllerRef.current = new AbortController();

        // Setup timeout warning and abort
        const warningTimer = setTimeout(() => setTimeoutWarning(true), 15000);
        const abortTimer = setTimeout(() => {
            abortControllerRef.current?.abort();
        }, TIMEOUT_MS);

        // Animate through steps
        const stepInterval = setInterval(() => {
            setCurrentStep(prev => Math.min(prev + 1, PROCESSING_STEPS.length - 1));
        }, 2500);

        try {
            // Upload image first
            const validImageUrl = await uploadImage(imageFile);

            // Call AI Engine directly (longer timeout)
            const AI_ENGINE_URL = import.meta.env.VITE_AI_ENGINE_URL || 'http://localhost:8000';

            const formData = new FormData();
            formData.append('files', imageFile);
            formData.append('title', 'Product');
            formData.append('category', 'other');

            const response = await fetch(`${AI_ENGINE_URL}/api/v1/studio/generate-3d`, {
                method: 'POST',
                body: formData,
                signal: abortControllerRef.current.signal
            });

            clearTimeout(warningTimer);
            clearTimeout(abortTimer);
            clearInterval(stepInterval);

            if (!response.ok) {
                throw new Error(`Generation failed: ${response.status}`);
            }

            const result = await response.json();

            setModelData({
                success: true,
                modelUrl: result.model_url,
                preview: result.preview_image || image,
                isDemo: result.status === 'demo' || result.model_url?.includes('modelviewer.dev'),
                polyCount: result.poly_count || 15000
            });

        } catch (err) {
            clearTimeout(warningTimer);
            clearTimeout(abortTimer);
            clearInterval(stepInterval);

            console.error('3D Generation Error:', err);

            if (err.name === 'AbortError') {
                setError('Generation timed out. The AI engine may be busy or unavailable.');
            } else if (err.message.includes('Failed to fetch')) {
                setError('Cannot connect to AI Engine. Please check if the service is running.');
            } else {
                setError(err.message || 'Failed to generate 3D model.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = () => {
        abortControllerRef.current?.abort();
        setIsProcessing(false);
        setCurrentStep(0);
        setTimeoutWarning(false);
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 container mx-auto text-white">
            <header className="mb-12 text-center">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-legion-gold/20 mb-4">
                    <Box className="w-8 h-8 text-legion-gold" />
                </div>
                <h1 className="text-4xl font-bold mb-2">AI 3D Studio</h1>
                <p className="text-gray-400 max-w-lg mx-auto">
                    Transform your product photos into interactive 3D models.
                </p>

                {/* Demo Mode Banner */}
                <div className="mt-4 inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-full text-sm">
                    <Sparkles size={16} />
                    <span>Demo Mode - Using sample 3D models</span>
                </div>
            </header>

            <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {/* Upload Section */}
                <div className="bg-legion-card border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px]">
                    {!image ? (
                        <label className="cursor-pointer group flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-legion-gold/20 transition-colors">
                                <Upload className="w-8 h-8 text-gray-400 group-hover:text-legion-gold" />
                            </div>
                            <span className="text-xl font-medium mb-1">Upload Photo</span>
                            <span className="text-sm text-gray-500">JPG or PNG (Clear background best)</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                        </label>
                    ) : (
                        <div className="relative w-full h-full flex flex-col items-center">
                            <img src={image} alt="Input" className="max-h-[300px] object-contain rounded-lg mb-6 shadow-2xl" />

                            {!modelData && !isProcessing && (
                                <button
                                    onClick={handleGenerate}
                                    className="btn btn-primary px-8 py-3 w-full max-w-xs flex items-center justify-center gap-2"
                                >
                                    <Box className="w-5 h-5" /> Generate 3D Model
                                </button>
                            )}

                            {/* Processing State with Steps */}
                            {isProcessing && (
                                <div className="w-full max-w-xs">
                                    <div className="space-y-2 mb-4">
                                        {PROCESSING_STEPS.map((step, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex items-center gap-2 text-sm transition-all ${idx < currentStep ? 'text-green-400' :
                                                        idx === currentStep ? 'text-white' : 'text-gray-600'
                                                    }`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${idx < currentStep ? 'bg-green-400' :
                                                        idx === currentStep ? 'bg-legion-gold animate-pulse' : 'bg-gray-600'
                                                    }`} />
                                                {step.label}
                                            </div>
                                        ))}
                                    </div>

                                    {timeoutWarning && (
                                        <div className="flex items-center gap-2 text-yellow-400 text-xs mb-3">
                                            <Clock size={12} />
                                            Taking longer than expected...
                                        </div>
                                    )}

                                    <button
                                        onClick={handleCancel}
                                        className="w-full py-2 bg-white/10 text-gray-300 rounded-lg text-sm hover:bg-white/20"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {/* Error State */}
                            {error && (
                                <div className="w-full max-w-xs">
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                                        <div className="flex items-start gap-2 text-red-400">
                                            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-sm">{error}</p>
                                                <p className="text-xs mt-1 text-red-400/70">
                                                    Tip: Make sure the AI Engine is running at localhost:8000
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleGenerate}
                                        className="w-full py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={14} /> Retry
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Preview Section */}
                <div className="bg-legion-card border border-white/10 rounded-2xl p-1 relative overflow-hidden flex flex-col min-h-[400px]">
                    {modelData ? (
                        <div className="relative w-full h-full flex flex-col">
                            {/* Demo Mode Indicator */}
                            {modelData.isDemo && (
                                <div className="absolute top-3 left-3 z-10 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                                    <Sparkles size={10} />
                                    Sample Model
                                </div>
                            )}

                            <div className="flex-1 bg-black/50 rounded-xl overflow-hidden relative group">
                                <model-viewer
                                    src={modelData.modelUrl}
                                    poster={modelData.preview}
                                    alt="Generated 3D Model"
                                    auto-rotate
                                    camera-controls
                                    shadow-intensity="1"
                                    style={{ width: '100%', height: '100%', minHeight: '400px' }}
                                >
                                    <div slot="progress-bar"></div>
                                </model-viewer>

                                <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 bg-black/60 rounded-full hover:bg-legion-gold text-white hover:text-black transition-colors" title="Toggle Lighting">
                                        <Sun size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 flex justify-between items-center bg-white/5 mt-1 rounded-b-xl">
                                <div>
                                    <h3 className="font-bold text-lg">
                                        {modelData.isDemo ? 'Sample Model' : 'Ready to Export'}
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        {modelData.isDemo
                                            ? 'Real 3D generation requires TripoSR setup'
                                            : 'Compatible with AR/VR viewers'
                                        }
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <a
                                        href={modelData.modelUrl}
                                        download
                                        className="btn btn-secondary px-4 py-2 flex items-center gap-2 text-sm"
                                    >
                                        <Download size={16} /> Download .GLB
                                    </a>
                                    <button className="btn btn-primary px-4 py-2 flex items-center gap-2 text-sm">
                                        <Share2 size={16} /> Add to Listing
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-12 text-center">
                            {isProcessing ? (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 border-4 border-legion-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="text-white font-medium animate-pulse">
                                        {PROCESSING_STEPS[currentStep]?.label || 'Processing...'}
                                    </p>
                                    <p className="text-xs max-w-xs">AI is analyzing depth, texture, and geometry.</p>
                                </div>
                            ) : (
                                <>
                                    <Box className="w-16 h-16 mb-4 opacity-20" />
                                    <p>3D Model Preview will appear here</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Guide */}
            <div className="mt-16 grid md:grid-cols-3 gap-6 opacity-60">
                <div className="p-4 border border-white/10 rounded-lg">
                    <h4 className="font-bold text-white mb-2">1. Upload Image</h4>
                    <p className="text-sm">Use a high-quality photo with even lighting.</p>
                </div>
                <div className="p-4 border border-white/10 rounded-lg">
                    <h4 className="font-bold text-white mb-2">2. AI Processing</h4>
                    <p className="text-sm">Our neural engine interprets 3D shapes from 2D pixels.</p>
                </div>
                <div className="p-4 border border-white/10 rounded-lg">
                    <h4 className="font-bold text-white mb-2">3. Interactive 3D</h4>
                    <p className="text-sm">Buyers can rotate and inspect the item in 360°.</p>
                </div>
            </div>
        </div>
    );
};

export default ThreeDStudio;
