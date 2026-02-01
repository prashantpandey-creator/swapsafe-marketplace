import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Box, Download, Sun, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { aiAPI, uploadImage } from '../services/api';
import './ThreeDStudio.css'; // We'll assume basic styles or reuse existing

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

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImage(URL.createObjectURL(file));
        setImageFile(file);
        setModelData(null);
        setError(null);
    };

    const handleGenerate = async () => {
        if (!imageFile) return;

        setIsProcessing(true);
        setError(null);

        try {
            // 1. Upload image to get URL
            const validImageUrl = await uploadImage(imageFile);

            // 2. Call AI Generation (Simulated)
            const result = await aiAPI.generate3D(validImageUrl);

            if (result.success) {
                setModelData(result);
            } else {
                throw new Error(result.error || 'Generation failed');
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to generate model. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 container mx-auto text-white">
            <header className="mb-12 text-center">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-legion-gold/20 mb-4">
                    <Box className="w-8 h-8 text-legion-gold" />
                </div>
                <h1 className="text-4xl font-bold mb-2">AI 3D Studio</h1>
                <p className="text-gray-400 max-w-lg mx-auto">
                    Transform your gear photos into interactive 3D models specifically for the marketplace.
                </p>
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

                            {!modelData && (
                                <button
                                    onClick={handleGenerate}
                                    disabled={isProcessing}
                                    className="btn btn-primary px-8 py-3 w-full max-w-xs flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <span className="spinner w-5 h-5 border-2 border-current rounded-full animate-spin border-t-transparent" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Box className="w-5 h-5" /> Generate 3D Model
                                        </>
                                    )}
                                </button>
                            )}

                            {error && <p className="text-red-400 mt-4">{error}</p>}
                        </div>
                    )}
                </div>

                {/* Preview Section */}
                <div className="bg-legion-card border border-white/10 rounded-2xl p-1 relative overflow-hidden flex flex-col min-h-[400px]">
                    {modelData ? (
                        <div className="relative w-full h-full flex flex-col">
                            {/* Model Viewer would go here - using iframe or model-viewer tag */}
                            {/* Since we don't have the script tag for model-viewer in index.html likely, 
                                we'll use an iframe or just an image preview for the simulation if tag fails, 
                                but let's try to output the web-component if checking index.html 
                                We'll assume basic HTML5 support or standard <img> fallback */}
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
                                    <h3 className="font-bold text-lg">Ready to Export</h3>
                                    <p className="text-xs text-gray-400">Compatible with AR/VR viewers</p>
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
                                    <p className="text-white font-medium animate-pulse">Constructing 3D Mesh...</p>
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
