import { useState } from 'react';
import { useToast } from '../context/ToastContext';

export const useProductAnalysis = () => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [stockImage, setStockImage] = useState(null);
    const { error: showError } = useToast();

    const analyzeImage = async (file) => {
        console.log('🔍 Frontend: analyzeImage called with file:', file ? file.name : 'null');
        setIsAnalyzing(true);
        setAnalysisResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;
            console.log('🚀 Sending analysis request to:', `${API_URL}/ai/analyze-image`);

            const response = await fetch(`${API_URL}/ai/analyze-image`, {
                method: 'POST',
                body: formData
            });

            console.log('📨 Response status:', response.status);

            if (!response.ok) throw new Error('Analysis failed');

            const result = await response.json();
            console.log('✅ Analysis result:', result);

            if (result.status === 'success' && result.analysis) {
                // Check if the analysis itself contains an error (e.g. from Supervisor)
                if (result.analysis.error) {
                    console.error('❌ AI Analysis Error:', result.analysis.error);
                    throw new Error(result.analysis.error);
                }

                setAnalysisResult(result.analysis);
                return result.analysis;
            } else {
                throw new Error(result.message || 'Unknown error');
            }
        } catch (err) {
            console.error('❌ Analysis error:', err);
            showError("Auto-detect failed. Please enter details manually.");
            return null;
        } finally {
            setIsAnalyzing(false);
        }
    };

    const fetchStockImage = async (productName) => {
        try {
            const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;
            const response = await fetch(`${API_URL}/ai/fetch-stock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productName })
            });

            if (!response.ok) throw new Error('Stock fetch failed');

            const result = await response.json();
            if (result.image_data) {
                setStockImage(result);
                return result;
            }
        } catch (err) {
            console.error('Stock fetch error:', err);
            showError("Could not find stock image");
        }
        return null;
    };

    return {
        isAnalyzing,
        analysisResult,
        setAnalysisResult,
        stockImage,
        setStockImage,
        analyzeImage,
        fetchStockImage
    };
};
