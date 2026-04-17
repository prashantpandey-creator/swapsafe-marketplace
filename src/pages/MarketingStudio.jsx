import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, Image as ImageIcon, Download, RefreshCw, Wand2, Search } from 'lucide-react';
import { aiAPI } from '../services/api';

const MarketingStudio = () => {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [resultImage, setResultImage] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Form State
    const [productName, setProductName] = useState('');
    const [prompt, setPrompt] = useState('');

    const fileInputRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setResultImage(null); // Reset result
        }
    };

    const handleGenerate = async () => {
        if (!image || !prompt) return;

        setIsGenerating(true);
        setResultImage(null);

        try {
            const formData = new FormData();
            formData.append('file', image);
            formData.append('prompt', prompt);
            formData.append('product_name', productName); // Triggers Quantum Retrieval
            formData.append('return_binary', 'true');

            const blob = await aiAPI.generateMarketingImage(formData);
            const resultUrl = URL.createObjectURL(blob);
            setResultImage(resultUrl);

        } catch (error) {
            console.error("Generation failed:", error);
            alert("Failed to generate image. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--void-deep)] text-white p-4 pb-24">
            {/* Header */}
            <div className="max-w-4xl mx-auto py-6 mb-8 border-b border-white/10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Quantum Studio 2D
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Generative Marketing Assets • RAG Style Transfer • 4K Upscale
                    </p>
                </div>
                <Wand2 className="text-purple-400 opacity-50" size={32} />
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* LEFT COLUMN: CONTROLS */}
                <div className="space-y-6">

                    {/* 1. Image Upload */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${preview ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                            }`}
                    >
                        {preview ? (
                            <img src={preview} alt="Upload" className="w-full h-full object-contain rounded-lg p-2" />
                        ) : (
                            <>
                                <Upload className="text-gray-400 mb-2" size={32} />
                                <p className="text-gray-400 text-sm">Upload Product Photo</p>
                            </>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </div>

                    {/* 2. Quantum Context (Product Name) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Search size={14} className="text-blue-400" />
                            Product Name (For Official Style)
                        </label>
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="e.g. Bose QuietComfort 45"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors placeholder-gray-600"
                        />
                        <p className="text-[10px] text-gray-500">
                            *Auto-fetches official company photos to steal their lighting/style.
                        </p>
                    </div>

                    {/* 3. Prompt */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Sparkles size={14} className="text-purple-400" />
                            Creative Prompt
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. sitting on a wooden desk, sunset lighting, cozy vibe..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 h-32 resize-none focus:outline-none focus:border-purple-500/50 transition-colors placeholder-gray-600"
                        />
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={!image || !prompt || isGenerating}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isGenerating
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] shadow-lg shadow-purple-900/20'
                            }`}
                    >
                        {isGenerating ? (
                            <>
                                <RefreshCw className="animate-spin" size={20} />
                                Quantum Processing...
                            </>
                        ) : (
                            <>
                                <Wand2 size={20} />
                                Generate High-Res Asset
                            </>
                        )}
                    </button>

                </div>

                {/* RIGHT COLUMN: RESULT */}
                <div className="bg-black/20 rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {isGenerating ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center"
                            >
                                <div className="relative w-24 h-24 mx-auto mb-6">
                                    <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping" />
                                    <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Engaging Quantum Portal</h3>
                                <p className="text-gray-500 text-sm">Retrieving Style DNA • Upscaling to 4K</p>
                            </motion.div>
                        ) : resultImage ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full h-full flex flex-col gap-4"
                            >
                                <div className="relative flex-1 rounded-xl overflow-hidden border border-white/10 group">
                                    <img src={resultImage} alt="Generated" className="w-full h-full object-contain bg-black/50" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-6">
                                        <a
                                            href={resultImage}
                                            download={`quantum_gen_${Date.now()}.png`}
                                            className="px-6 py-3 bg-white text-black font-bold rounded-full flex items-center gap-2 hover:bg-gray-200"
                                        >
                                            <Download size={18} />
                                            Download 4K
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500 px-2">
                                    <span>Model: SD 1.5 + RAG</span>
                                    <span>Upscaler: Real-ESRGAN</span>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="text-center text-gray-600">
                                <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Result will appear here</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
};

export default MarketingStudio;
