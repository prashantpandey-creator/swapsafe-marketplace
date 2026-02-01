// CameraViewfinder.jsx - Live camera component with real viewfinder
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, RotateCcw, Image, Zap, Check } from 'lucide-react';

/**
 * Live Camera Viewfinder Component
 * Uses getUserMedia for real camera access instead of file picker
 */
const CameraViewfinder = ({
    onCapture,
    onClose,
    guideText = "Center your item",
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

    // Start camera stream
    const startCamera = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Stop any existing stream first
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }

            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },  // More conservative resolution
                    height: { ideal: 720 }
                },
                audio: false
            };

            console.log('📷 Requesting camera access...');
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('✅ Camera access granted');

            setStream(mediaStream);

            // Wait for video element to be ready
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;

                // Use onloadedmetadata instead of immediate play
                videoRef.current.onloadedmetadata = async () => {
                    try {
                        await videoRef.current?.play();
                        console.log('✅ Video playback started');
                        setIsLoading(false);
                    } catch (playError) {
                        console.error('Video play error:', playError);
                        // Still mark as loaded, video might autoplay
                        setIsLoading(false);
                    }
                };
            } else {
                // Video ref not ready, still mark as loaded
                setTimeout(() => setIsLoading(false), 500);
            }
        } catch (err) {
            console.error('Camera access error:', err);
            setError(err.name === 'NotAllowedError'
                ? 'Camera access denied. Please allow camera access.'
                : err.name === 'NotFoundError'
                    ? 'No camera found on this device.'
                    : `Camera error: ${err.message || 'Unknown error'}`
            );
            setIsLoading(false);
        }
    }, [facingMode]);

    // Initialize camera on mount
    useEffect(() => {
        startCamera();

        // Cleanup on unmount - must access current stream
        return () => {
            if (videoRef.current?.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                console.log('🔴 Camera stopped on cleanup');
            }
        };
    }, []);

    // Switch camera when facingMode changes (but not on initial mount)
    const [isInitialMount, setIsInitialMount] = useState(true);
    useEffect(() => {
        if (isInitialMount) {
            setIsInitialMount(false);
            return;
        }
        if (!error) {
            startCamera();
        }
    }, [facingMode]);

    // Toggle between front and back camera
    const switchCamera = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    // Capture photo from video stream
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        setIsCapturing(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0);

        // Get image as data URL
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedImage(imageDataUrl);

        // Flash effect
        setTimeout(() => setIsCapturing(false), 200);
    };

    // Confirm captured photo
    const confirmCapture = () => {
        if (capturedImage) {
            // Convert data URL to blob for upload
            fetch(capturedImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
                    onCapture(capturedImage, file);
                });
        }
    };

    // Retake photo
    const retakePhoto = () => {
        setCapturedImage(null);
    };

    // Handle gallery upload
    const handleGalleryUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            onCapture(objectUrl, file);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
        >
            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 left-4 z-50 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white"
            >
                <X size={24} />
            </button>

            {/* Main content */}
            <div className="relative w-full h-full">
                {error ? (
                    // Error state - show gallery upload
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                            <Camera size={40} className="text-red-400" />
                        </div>
                        <h3 className="text-white text-xl font-bold mb-2">Camera Unavailable</h3>
                        <p className="text-gray-400 mb-8">{error}</p>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-[var(--legion-gold)] text-black font-bold py-4 px-8 rounded-xl flex items-center gap-3"
                        >
                            <Image size={20} />
                            Choose from Gallery
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleGalleryUpload}
                            className="hidden"
                        />
                    </div>
                ) : capturedImage ? (
                    // Captured image preview
                    <div className="relative w-full h-full">
                        <img
                            src={capturedImage}
                            alt="Captured"
                            className="w-full h-full object-contain"
                        />

                        {/* Action buttons */}
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
                            <button
                                onClick={retakePhoto}
                                className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center text-white border border-white/20"
                            >
                                <RotateCcw size={24} />
                            </button>
                            <button
                                onClick={confirmCapture}
                                className="w-20 h-20 bg-[var(--legion-gold)] rounded-full flex items-center justify-center text-black shadow-[0_0_30px_rgba(212,175,55,0.5)]"
                            >
                                <Check size={32} />
                            </button>
                        </div>
                    </div>
                ) : (
                    // Live viewfinder
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />

                        {/* Loading overlay */}
                        <AnimatePresence>
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black flex items-center justify-center"
                                >
                                    <div className="text-center">
                                        <Camera size={48} className="text-[var(--legion-gold)] mx-auto mb-4 animate-pulse" />
                                        <p className="text-gray-400">Starting camera...</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Capture flash effect */}
                        <AnimatePresence>
                            {isCapturing && (
                                <motion.div
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: 0 }}
                                    className="absolute inset-0 bg-white pointer-events-none"
                                />
                            )}
                        </AnimatePresence>

                        {/* Guide overlay */}
                        {showGuide && !isLoading && (
                            <div className="absolute inset-0 pointer-events-none">
                                {/* Center guide square */}
                                <div className="absolute inset-8 border-2 border-white/30 rounded-2xl">
                                    {/* Corner brackets */}
                                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[var(--legion-gold)] rounded-tl-lg" />
                                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[var(--legion-gold)] rounded-tr-lg" />
                                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[var(--legion-gold)] rounded-bl-lg" />
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[var(--legion-gold)] rounded-br-lg" />
                                </div>

                                {/* Guide text */}
                                <div className="absolute top-16 left-0 right-0 text-center">
                                    <span className="bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium">
                                        {guideText}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="absolute bottom-8 left-0 right-0">
                            <div className="flex items-center justify-center gap-8">
                                {/* Gallery button */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center text-white border border-white/20"
                                >
                                    <Image size={20} />
                                </button>

                                {/* Capture button */}
                                <button
                                    onClick={capturePhoto}
                                    disabled={isLoading}
                                    className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg disabled:opacity-50"
                                >
                                    <div className="w-16 h-16 rounded-full border-4 border-black/20" />
                                </button>

                                {/* Switch camera button */}
                                <button
                                    onClick={switchCamera}
                                    className="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center text-white border border-white/20"
                                >
                                    <RotateCcw size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleGalleryUpload}
                            className="hidden"
                        />
                    </>
                )}
            </div>
        </motion.div>
    );
};

export default CameraViewfinder;
