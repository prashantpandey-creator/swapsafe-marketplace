/**
 * TrustBadge Component
 * Displays a user's Legion Trust Score with visual indicators
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertTriangle, Award, Star } from 'lucide-react';
import { shieldAPI } from '../../services/shieldAPI';

const TrustBadge = ({ userId, size = 'md', showDetails = false }) => {
    const [trustData, setTrustData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTrustScore = async () => {
            try {
                setLoading(true);
                const response = await shieldAPI.getTrustScore(userId);
                setTrustData(response.trustScore);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchTrustScore();
        }
    }, [userId]);

    if (loading) {
        return (
            <div className="animate-pulse flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                <div className="w-16 h-4 bg-gray-700 rounded"></div>
            </div>
        );
    }

    if (error || !trustData) {
        return null;
    }

    const sizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };

    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    const getLevelIcon = () => {
        switch (trustData.level?.name) {
            case 'Legendary': return <Award className={iconSizes[size]} />;
            case 'Trusted': return <CheckCircle className={iconSizes[size]} />;
            case 'Rising': return <Star className={iconSizes[size]} />;
            default: return <Shield className={iconSizes[size]} />;
        }
    };

    const getLevelColor = () => {
        switch (trustData.level?.name) {
            case 'Legendary': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
            case 'Trusted': return 'text-green-400 bg-green-400/20 border-green-400/30';
            case 'Rising': return 'text-blue-400 bg-blue-400/20 border-blue-400/30';
            case 'New': return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
            default: return 'text-red-400 bg-red-400/20 border-red-400/30';
        }
    };

    return (
        <div className="inline-block">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getLevelColor()} ${sizeClasses[size]}`}
            >
                {getLevelIcon()}
                <span className="font-semibold">{trustData.score}</span>
                <span className="opacity-70">{trustData.level?.name}</span>
            </motion.div>

            {showDetails && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-4 bg-slate-800/50 rounded-xl border border-white/10"
                >
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-legion-gold" />
                        Trust Breakdown
                    </h4>
                    <div className="space-y-2">
                        {trustData.breakdown?.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-400">{item.factor}</span>
                                <span className={item.points > 0 ? 'text-green-400' : 'text-gray-500'}>
                                    +{item.points} pts
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 flex justify-between font-semibold">
                        <span className="text-white">Total Score</span>
                        <span className="text-legion-gold">{trustData.score}/100</span>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default TrustBadge;
