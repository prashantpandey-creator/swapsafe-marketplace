// AI Engine Status Indicator - Shows real-time status of Python AI Engine
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Wifi, WifiOff, Activity, AlertCircle } from 'lucide-react';

const AI_ENGINE_URL = import.meta.env.VITE_AI_ENGINE_URL || 'http://localhost:8000';

/**
 * Hook to check AI Engine health
 */
export function useAIEngineStatus(pollInterval = 10000) {
    const [status, setStatus] = useState('checking'); // checking, online, offline, degraded
    const [details, setDetails] = useState(null);
    const [lastCheck, setLastCheck] = useState(null);

    useEffect(() => {
        let mounted = true;

        const checkHealth = async () => {
            try {
                const response = await fetch(`${AI_ENGINE_URL}/health`, {
                    signal: AbortSignal.timeout(5000)
                });

                if (!mounted) return;

                if (response.ok) {
                    const data = await response.json();
                    setStatus('online');
                    setDetails(data);
                } else {
                    setStatus('degraded');
                }
            } catch (error) {
                if (!mounted) return;
                setStatus('offline');
                setDetails({ error: error.message });
            }

            setLastCheck(new Date());
        };

        // Initial check
        checkHealth();

        // Set up polling
        const interval = setInterval(checkHealth, pollInterval);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [pollInterval]);

    return { status, details, lastCheck };
}

/**
 * Visual indicator component for AI Engine status
 */
export function AIEngineStatusBadge({ showLabel = true, size = 'md' }) {
    const { status, details, lastCheck } = useAIEngineStatus();

    const statusConfig = {
        checking: {
            color: 'text-gray-400',
            bg: 'bg-gray-500/20',
            border: 'border-gray-500/30',
            icon: Activity,
            label: 'Checking...',
            pulse: true
        },
        online: {
            color: 'text-[var(--signal-green)]',
            bg: 'bg-green-500/10',
            border: 'border-green-500/30',
            icon: Wifi,
            label: 'AI Online',
            pulse: false
        },
        offline: {
            color: 'text-[var(--signal-red)]',
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            icon: WifiOff,
            label: 'AI Offline',
            pulse: false
        },
        degraded: {
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/30',
            icon: AlertCircle,
            label: 'Degraded',
            pulse: true
        }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    const sizeClasses = {
        sm: 'px-2 py-1 text-[10px]',
        md: 'px-3 py-1.5 text-xs',
        lg: 'px-4 py-2 text-sm'
    };

    return (
        <motion.div
            className={`
                inline-flex items-center gap-2 rounded-full font-mono
                ${config.bg} ${config.border} border
                ${sizeClasses[size]}
            `}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            title={`Last checked: ${lastCheck?.toLocaleTimeString() || 'Never'}`}
        >
            <span className={`relative ${config.color}`}>
                <Icon size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
                {config.pulse && (
                    <span className="absolute inset-0 animate-ping">
                        <Icon size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} className="opacity-40" />
                    </span>
                )}
            </span>

            {showLabel && (
                <span className={`${config.color} font-semibold tracking-wide uppercase`}>
                    {config.label}
                </span>
            )}
        </motion.div>
    );
}

/**
 * Detailed status panel for Studio page
 */
export function AIEngineStatusPanel() {
    const { status, details } = useAIEngineStatus();

    return (
        <AnimatePresence>
            {status === 'offline' && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="glass-panel p-4 border-red-500/30 border mb-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                            <WifiOff className="text-red-400" size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-red-400 font-bold text-sm">AI Engine Offline</h4>
                            <p className="text-gray-400 text-xs">
                                The local AI engine is not running. Start it with:
                            </p>
                            <code className="text-[10px] text-[var(--legion-gold)] font-mono block mt-1">
                                sh ai-engine/start_engine.sh
                            </code>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default { useAIEngineStatus, AIEngineStatusBadge, AIEngineStatusPanel };
