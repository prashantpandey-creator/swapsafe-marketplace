// PriceOracle.jsx - Enhanced price display with real market data
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ExternalLink, Sparkles, AlertCircle, CheckCircle, Loader, HelpCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Price Oracle Component
 * Fetches AI-estimated market prices (completely free!)
 */
const PriceOracle = ({
    productTitle,
    category,
    condition,
    userPrice,
    onPriceChange,
    onSuggestedPrice
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [priceData, setPriceData] = useState(null);
    const [comparison, setComparison] = useState(null);
    const [error, setError] = useState(null);
    const [showOriginalPriceInput, setShowOriginalPriceInput] = useState(false);
    const [originalPrice, setOriginalPrice] = useState('');

    // Fetch market prices when product title changes
    useEffect(() => {
        if (productTitle && productTitle.length > 5) {
            fetchMarketPrices();
        }
    }, [productTitle, category, originalPrice]);

    // Update comparison when user price changes
    useEffect(() => {
        if (priceData && userPrice > 0) {
            calculateComparison();
        }
    }, [userPrice, priceData, condition]);

    const fetchMarketPrices = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('swapsafe_token');
            const params = new URLSearchParams({
                q: productTitle,
                category: category || '',
                condition: condition || 'good',
                originalPrice: originalPrice || ''
            });

            const response = await fetch(`${API_URL}/price/lookup?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success) {
                setPriceData(data.data);

                // Auto-suggest price based on condition
                if (data.data.suggestedRange && onSuggestedPrice) {
                    const conditionMultipliers = {
                        'new': 0.9,
                        'like-new': 0.75,
                        'good': 0.6,
                        'fair': 0.45
                    };
                    const multiplier = conditionMultipliers[condition] || 0.6;
                    const suggestedPrice = Math.round(data.data.retailPrice * multiplier);
                    onSuggestedPrice(suggestedPrice);
                }
            } else {
                setError(data.error || 'Could not fetch prices');
            }
        } catch (err) {
            console.error('Price lookup error:', err);
            setError('Unable to fetch market prices');
        } finally {
            setIsLoading(false);
        }
    };

    const calculateComparison = async () => {
        if (!priceData || !userPrice) return;

        try {
            const token = localStorage.getItem('swapsafe_token');
            const response = await fetch(`${API_URL}/price/compare`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userPrice: parseFloat(userPrice),
                    retailPrice: priceData.retailPrice,
                    condition: condition
                })
            });

            const data = await response.json();
            if (data.success) {
                setComparison(data.comparison);
            }
        } catch (err) {
            console.error('Comparison error:', err);
        }
    };

    if (!productTitle || productTitle.length < 5) {
        return (
            <div className="glass-panel p-5 border-white/10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center">
                        <TrendingUp className="text-gray-500" size={20} />
                    </div>
                    <div>
                        <h3 className="text-gray-400 font-semibold">Price Oracle</h3>
                        <p className="text-gray-600 text-xs">Enter product name to see market prices</p>
                    </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 text-center">
                    <p className="text-gray-500 text-sm">
                        💡 Tip: Include brand and model for accurate pricing
                    </p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-5 border-[var(--legion-gold)]/30"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="text-green-400" size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        Price Oracle
                        {isLoading && <Loader size={14} className="animate-spin text-[var(--legion-gold)]" />}
                    </h3>
                    <p className="text-gray-500 text-xs">
                        {priceData?.source === 'serper' ? 'Real market data' : 'AI estimate'}
                    </p>
                </div>
                <Sparkles className="text-[var(--legion-gold)]" size={20} />
            </div>

            {isLoading ? (
                <div className="text-center py-6">
                    <Loader className="animate-spin mx-auto mb-2 text-[var(--legion-gold)]" size={24} />
                    <p className="text-gray-400 text-sm">Analyzing price...</p>
                </div>
            ) : error ? (
                <div className="bg-red-500/10 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="text-red-400" size={20} />
                    <p className="text-red-400 text-sm flex-1">{error}</p>
                    <button
                        onClick={fetchMarketPrices}
                        className="text-[var(--legion-gold)] text-sm underline"
                    >
                        Retry
                    </button>
                </div>
            ) : priceData ? (
                <>
                    {/* Confidence & Source Indicator */}
                    {priceData.confidence && priceData.confidence < 70 && (
                        <div className="mb-4 bg-yellow-500/10 rounded-lg p-3 flex items-center gap-3">
                            <HelpCircle className="text-yellow-400 flex-shrink-0" size={18} />
                            <div className="flex-1">
                                <p className="text-yellow-400 text-sm">
                                    Low confidence estimate ({priceData.confidence}%)
                                </p>
                                <button
                                    onClick={() => setShowOriginalPriceInput(!showOriginalPriceInput)}
                                    className="text-xs text-[var(--legion-gold)] underline mt-1"
                                >
                                    Know the retail price? Enter it for accuracy
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Optional Original Price Input */}
                    <AnimatePresence>
                        {showOriginalPriceInput && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4"
                            >
                                <label className="block text-gray-400 text-xs mb-2">
                                    Original Retail Price (₹)
                                </label>
                                <input
                                    type="number"
                                    value={originalPrice}
                                    onChange={(e) => setOriginalPrice(e.target.value)}
                                    placeholder="e.g., 24990"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:border-[var(--legion-gold)]"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Price Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white/5 rounded-lg p-4 text-center">
                            <p className="text-gray-400 text-xs mb-1">Retail Price</p>
                            <p className="text-2xl font-bold text-white">
                                ₹{priceData.retailPrice?.toLocaleString()}
                            </p>
                            {priceData.amazon && (
                                <a
                                    href={priceData.amazon.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-[var(--legion-gold)] flex items-center justify-center gap-1 mt-1"
                                >
                                    Amazon <ExternalLink size={10} />
                                </a>
                            )}
                        </div>

                        <div className="bg-green-500/10 rounded-lg p-4 text-center border border-green-500/30">
                            <p className="text-gray-400 text-xs mb-1">Suggested Price</p>
                            <p className="text-2xl font-bold text-green-400">
                                ₹{priceData.suggestedRange?.max?.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-gray-500">
                                for {condition || 'good'} condition
                            </p>
                        </div>
                    </div>

                    {/* Savings Visualization */}
                    <AnimatePresence>
                        {comparison && comparison.savingsPercent > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4"
                            >
                                <div className="bg-green-500/10 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-green-400 font-bold">
                                            🎉 {comparison.buyerMessage}
                                        </span>
                                    </div>

                                    {/* Savings bar */}
                                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(comparison.savingsPercent, 100)}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-green-500 to-green-400"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Verdict */}
                    {comparison && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg ${comparison.verdictColor === 'green' ? 'bg-green-500/10 text-green-400' :
                            comparison.verdictColor === 'yellow' ? 'bg-yellow-500/10 text-yellow-400' :
                                'bg-red-500/10 text-red-400'
                            }`}>
                            {comparison.verdictColor === 'green' ?
                                <CheckCircle size={16} /> :
                                <AlertCircle size={16} />
                            }
                            <span className="text-sm font-medium">{comparison.verdict}</span>
                        </div>
                    )}

                    {/* Price Range Info */}
                    {priceData.suggestedRange && (
                        <p className="text-gray-500 text-xs mt-4 text-center">
                            Fair price range: ₹{priceData.suggestedRange.min?.toLocaleString()} - ₹{priceData.suggestedRange.max?.toLocaleString()}
                        </p>
                    )}
                </>
            ) : null}
        </motion.div>
    );
};

export default PriceOracle;
