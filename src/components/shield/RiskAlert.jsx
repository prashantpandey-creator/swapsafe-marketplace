/**
 * RiskAlert Component
 * Displays fraud detection warnings for listings
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, CheckCircle, X, ShieldAlert } from 'lucide-react';

const RiskAlert = ({ analysis, onDismiss }) => {
    if (!analysis || analysis.isClean) {
        return null;
    }

    const getLevelConfig = () => {
        switch (analysis.riskLevel?.level) {
            case 'high':
                return {
                    icon: <ShieldAlert className="w-6 h-6" />,
                    bg: 'bg-red-500/10 border-red-500/30',
                    iconColor: 'text-red-500',
                    title: 'High Risk Listing'
                };
            case 'medium':
                return {
                    icon: <AlertTriangle className="w-6 h-6" />,
                    bg: 'bg-yellow-500/10 border-yellow-500/30',
                    iconColor: 'text-yellow-500',
                    title: 'Proceed with Caution'
                };
            default:
                return {
                    icon: <AlertCircle className="w-6 h-6" />,
                    bg: 'bg-blue-500/10 border-blue-500/30',
                    iconColor: 'text-blue-500',
                    title: 'Minor Concerns Detected'
                };
        }
    };

    const config = getLevelConfig();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`relative rounded-xl border p-4 ${config.bg}`}
            >
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="absolute top-3 right-3 text-gray-400 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                <div className="flex gap-4">
                    <div className={config.iconColor}>{config.icon}</div>
                    <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">{config.title}</h4>
                        <p className="text-gray-300 text-sm mb-3">{analysis.recommendation}</p>

                        {analysis.flags?.length > 0 && (
                            <div className="space-y-2">
                                {analysis.flags.map((flag, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 text-sm text-gray-400"
                                    >
                                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                                        <span>{flag.message}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-4 flex items-center gap-4 text-sm">
                            <span className="text-gray-400">
                                Risk Score: <span className={config.iconColor}>{analysis.riskScore}/100</span>
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RiskAlert;
