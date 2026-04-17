import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Check, AlertCircle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { usePhotoEnhancement } from '../../hooks/usePhotoEnhancement';
import LoadingSpinner from '../common/LoadingSpinner';

const PhotoUploadZone = ({ onPhotoEnhanced, productName, category }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const fileInputRef = useRef(null);

    const {
        enhancePhoto,
        reset,
        isEnhancing,
        progress,
        error,
        originalImage,
        enhancedImage
    } = usePhotoEnhancement();

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find(file => file.type.startsWith('image/'));

        if (imageFile) {
            await processFile(imageFile);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            await processFile(file);
        }
    };

    const processFile = async (file) => {
        const result = await enhancePhoto(file, {
            productName,
            category
        });

        if (result.success) {
            setShowComparison(true);
            if (onPhotoEnhanced) {
                onPhotoEnhanced(result);
            }
        }
    };

    const handleReset = () => {
        reset();
        setShowComparison(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {!originalImage && !isEnhancing && (
                    <motion.div
                        key="upload-zone"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ${isDragging
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <div className="flex flex-col items-center gap-4">
                            <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'
                                }`}>
                                <Upload className={`w-12 h-12 ${isDragging ? 'text-white' : 'text-gray-400 dark:text-gray-500'
                                    }`} />
                            </div>

                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    {isDragging ? 'Drop your photo here' : 'Upload Product Photo'}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    Drag and drop or click to browse
                                </p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Choose File
                                </button>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Sparkles className="w-4 h-4" />
                                <span>AI will automatically remove background and enhance quality</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {isEnhancing && (
                    <motion.div
                        key="enhancing"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex flex-col items-center gap-6">
                            <LoadingSpinner size="lg" text="" />

                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Enhancing Your Photo
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    AI is removing background and optimizing quality...
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full max-w-md">
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                                    {progress}% Complete
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
                                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-1">
                                    Enhancement Failed
                                </h3>
                                <p className="text-red-700 dark:text-red-300 mb-4">
                                    {error}
                                </p>
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {showComparison && originalImage && enhancedImage && (
                    <motion.div
                        key="comparison"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-full">
                                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Enhancement Complete!
                                </h3>
                            </div>
                            <button
                                onClick={handleReset}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Before/After Comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <ImageIcon className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Original
                                    </span>
                                </div>
                                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
                                    <img
                                        src={originalImage}
                                        alt="Original"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Enhanced
                                    </span>
                                </div>
                                <div className="relative aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-900 border-2 border-purple-500">
                                    <img
                                        src={enhancedImage}
                                        alt="Enhanced"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleReset}
                                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Upload Different Photo
                            </button>
                            <button
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                Use Enhanced Photo
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PhotoUploadZone;
