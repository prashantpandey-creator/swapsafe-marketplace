// CameraViewfinder.jsx - Live camera component with immersive Stitch UI
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, RotateCcw, Image, Zap, Check, Lightbulb, Grid3X3, Sparkles } from 'lucide-react';

/**
 * Live Camera Viewfinder Component
 * Uses getUserMedia for real camera access and mimics the 'quick_sell_camera.html' design
 */
const CameraViewfinder = ({
    onCapture,
    onClose,
    guideText = "Position product in frame",
    showGuide = true
}) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const [stream, setStream] = useState(null);
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' = back camera
    const [error, setError] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [aiEnabled, setAiEnabled] = useState(true); // Default to on for this UI

    // Start camera stream
    const startCamera = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }

            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = async () => {
                    try {
                        await videoRef.current?.play();
                        setIsLoading(false);
                    } catch (playError) {
                        console.error('Video play error:', playError);
                        setIsLoading(false);
                    }
                };
            } else {
                setTimeout(() => setIsLoading(false), 500);
            }
        } catch (err) {
            console.error('Camera access error:', err);
            setError(err.name === 'NotAllowedError'
                ? 'Camera access denied. Please allow camera access.'
                : 'Camera unavailable. Please upload from gallery.'
            );
            setIsLoading(false);
        }
    }, [facingMode]);

    useEffect(() => {
        startCamera();
        return () => {
            if (videoRef.current?.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, [startCamera]);

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        setIsCapturing(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.scale(-1, 1); // Mirror if front camera? Actually backend is usually standard. 
        // For environment camera we usually don't mirror. Let's stick to standard draw.
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        ctx.drawImage(video, 0, 0);

        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedImage(imageDataUrl);

        setTimeout(() => setIsCapturing(false), 200);
    };

    const confirmCapture = () => {
        if (capturedImage) {
            fetch(capturedImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
                    // Pass AI preference if we want to hook it up later
                    onCapture(capturedImage, file, { aiEnabled });
                });
        }
    };

    const handleGalleryUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            onCapture(objectUrl, file, { aiEnabled });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0A0A0F] text-white font-sans flex flex-col"
        >
            <canvas ref={canvasRef} className="hidden" />

            {/* ERROR STATE: Fallback to Gallery */}
            {error ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                        <Camera size={48} className="text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Camera Unavailable</h3>
                        <p className="text-gray-400">{error}</p>
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-primary py-4 px-8 text-black"
                    >
                        Choose from Gallery
                    </button>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">Cancel</button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                </div>
            ) : capturedImage ? (
                // --- PREVIEW STATE ---
                <div className="relative w-full h-full flex flex-col">
                    <div className="flex-1 relative bg-black">
                        <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
                    </div>
                    <div className="p-8 bg-[#0A0A0F] flex items-center justify-center gap-8">
                        <button onClick={() => setCapturedImage(null)} className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20">
                            <RotateCcw size={24} />
                        </button>
                        <button onClick={confirmCapture} className="w-20 h-20 rounded-full bg-legion-gold flex items-center justify-center text-black shadow-[0_0_30px_rgba(255,215,0,0.4)]">
                            <Check size={36} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            ) : (
                // --- LIVE VIEWFINDER STATE (Matches quick_sell_camera.html) ---
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 pt-6 z-20">
                        <div className="w-12"></div>
                        <h2 className="text-lg font-bold tracking-tight">Quick Sell</h2>
                        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Viewfinder Area */}
                    <div className="flex-1 flex flex-col relative w-full h-full pb-4 px-4 overflow-hidden">
                        <div className="relative flex-grow rounded-3xl overflow-hidden bg-gray-900 border border-white/10 shadow-2xl">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>

                            {/* Loading Spinner */}
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center z-30">
                                    <div className="flex flex-col items-center gap-3">
                                        <Camera className="animate-bounce text-legion-gold" size={40} />
                                        <span className="text-gray-400 text-sm font-medium">Initializing camera...</span>
                                    </div>
                                </div>
                            )}

                            {/* Step Indicator */}
                            <div className="absolute top-6 left-0 right-0 flex justify-center z-10 pointer-events-none">
                                <div className="bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="h-1.5 w-6 rounded-full bg-legion-gold"></div>
                                        <div className="h-1.5 w-6 rounded-full bg-white/20"></div>
                                        <div className="h-1.5 w-6 rounded-full bg-white/20"></div>
                                    </div>
                                    <span className="text-xs font-semibold text-white ml-2">Step 1 of 3</span>
                                </div>
                            </div>

                            {/* Corner Brackets */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-8 left-8 w-10 h-10 border-t-4 border-l-4 border-white/70 rounded-tl-xl drop-shadow-lg"></div>
                                <div className="absolute top-8 right-8 w-10 h-10 border-t-4 border-r-4 border-white/70 rounded-tr-xl drop-shadow-lg"></div>
                                <div className="absolute bottom-8 left-8 w-10 h-10 border-b-4 border-l-4 border-white/70 rounded-bl-xl drop-shadow-lg"></div>
                                <div className="absolute bottom-8 right-8 w-10 h-10 border-b-4 border-r-4 border-white/70 rounded-br-xl drop-shadow-lg"></div>

                                <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90 font-medium text-lg drop-shadow-md text-center mt-32">
                                    {guideText}
                                </p>
                            </div>

                            {/* AI Toggle (Visual/Functional) */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                                <button
                                    onClick={() => setAiEnabled(!aiEnabled)}
                                    className={`flex items-center gap-3 px-4 py-1.5 rounded-full border backdrop-blur-md transition-all shadow-lg ${aiEnabled
                                            ? 'bg-black/60 border-legion-gold/50'
                                            : 'bg-black/40 border-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={16} className={aiEnabled ? 'text-legion-gold fill-legion-gold' : 'text-gray-400'} />
                                        <span className="text-sm font-bold text-white whitespace-nowrap">AI Enhancement</span>
                                    </div>
                                    <div className={`relative flex items-center h-6 w-11 rounded-full p-1 duration-200 ease-in-out ${aiEnabled ? 'bg-legion-gold' : 'bg-white/20'}`}>
                                        <div className={`h-4 w-4 rounded-full bg-white shadow-sm transform duration-200 ease-in-out ${aiEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Controls Section */}
                        <div className="px-6 pt-6 pb-2 flex flex-col items-center gap-6">
                            <div className="w-full flex items-center justify-between">
                                {/* Gallery Button */}
                                <div className="flex-1 flex justify-start">
                                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 group">
                                        <div className="size-12 rounded-xl bg-white/10 border-2 border-white/20 group-hover:border-legion-gold transition flex items-center justify-center">
                                            <Image size={24} className="text-white/80" />
                                        </div>
                                        <span className="text-[10px] font-medium text-white/60">Gallery</span>
                                    </button>
                                </div>

                                /* Shutter Button */
                                <div className="flex-0 relative">
                                    <button
                                        onClick={capturePhoto}
                                        disabled={isLoading}
                                        className="relative flex items-center justify-center size-20 rounded-full border-4 border-white/20 bg-transparent active:scale-95 transition-transform duration-150"
                                    >
                                        <div className="absolute inset-0 rounded-full border-[3px] border-legion-gold opacity-100"></div>
                                        <div className="size-16 bg-white rounded-full transition-colors shadow-[0_0_15px_rgba(255,217,0,0.3)]"></div>
                                    </button>
                                </div>

                                /* Flip Camera (Placeholder functionality as switchCamera would need 'user' mode logic added back if desired, keeping simple for now or re-adding) */
                                <div className="flex-1 flex justify-end">
                                    <button
                                        onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                                        className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition"
                                    >
                                        <div className="size-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                            <RotateCcw size={24} />
                                        </div>
                                        <span className="text-[10px] font-medium">Flip</span>
                                    </button>
                                </div>
                            </div>

                            {/* Pro Tip Card */}
                            <div className="w-full relative">
                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg relative overflow-hidden">
                                    <div className="absolute -top-10 -left-10 w-20 h-20 bg-legion-gold/20 blur-3xl rounded-full pointer-events-none"></div>
                                    <div className="bg-legion-gold/20 p-2 rounded-full shrink-0 text-legion-gold">
                                        <Lightbulb size={20} className="fill-current" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <p className="text-white text-sm font-semibold leading-snug">Pro tip: Good lighting = faster sales!</p>
                                        <p className="text-white/60 text-xs leading-normal">Our AI will enhance your photo automatically.</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5">
                                <Shield size={12} className="fill-current" />
                                Powered by Guardian AI
                            </p>
                        </div>
                    </div>

                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                </>
            )}
        </motion.div>
    );
};

export default CameraViewfinder;
