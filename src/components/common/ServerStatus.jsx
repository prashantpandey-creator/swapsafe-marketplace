
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Activity, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ServerStatus = () => {
    const [status, setStatus] = useState({ backend: 'checking', ai_engine: 'checking' });
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Dynamic API URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const checkStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/status`);
            if (res.ok) {
                const data = await res.json();
                setStatus({ backend: data.backend, ai_engine: data.ai_engine });
            } else {
                setStatus({ backend: 'offline', ai_engine: 'offline' });
            }
        } catch (error) {
            setStatus({ backend: 'offline', ai_engine: 'offline' });
        }
    };

    const startEngine = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/start-ai-engine`, { method: 'POST' });
            if (res.ok) {
                // Poll more frequently for a bit
                let attempts = 0;
                const interval = setInterval(async () => {
                    await checkStatus();
                    attempts++;
                    if (attempts > 10) clearInterval(interval);
                }, 2000);
            }
        } catch (error) {
            console.error("Failed to start engine:", error);
        } finally {
            setTimeout(() => setIsLoading(false), 2000);
        }
    };

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    // Determine Icon & Color
    const isOnline = status.ai_engine === 'online';
    const isOffline = status.ai_engine === 'offline';

    let Icon = Wifi;
    let colorClass = "text-green-500";
    let statusText = "System Online";

    if (isOffline) {
        Icon = WifiOff;
        colorClass = "text-red-500";
        statusText = "AI Engine Offline";
    } else if (isLoading) {
        Icon = RefreshCw;
        colorClass = "text-orange-400 animate-spin";
        statusText = "Starting Engine...";
    }

    return (
        <div className="relative">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors ${colorClass}`}
            >
                <Icon size={20} className={isLoading ? "animate-spin" : ""} />
                {/* Status Dot */}
                <span className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#050505] ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}>
                    {isOnline && <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>}
                </span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-3 w-64 bg-[#0A0A0F] border border-white/10 rounded-xl shadow-2xl p-4 z-50 backdrop-blur-3xl ring-1 ring-white/5"
                        >
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <Activity size={16} className="text-[var(--legion-gold)]" />
                                System Status
                            </h3>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">Backend API</span>
                                    <span className={status.backend === 'online' ? "text-green-400" : "text-red-400"}>
                                        {status.backend.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">AI Engine (Python)</span>
                                    <span className={status.ai_engine === 'online' ? "text-green-400" : "text-red-400"}>
                                        {status.ai_engine.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {isOffline && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={startEngine}
                                    disabled={isLoading}
                                    className="mt-4 w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    {isLoading ? (
                                        <><span>Starting...</span><RefreshCw size={12} className="animate-spin" /></>
                                    ) : (
                                        <><span>Start AI Engine</span><Zap size={12} /></>
                                    )}
                                </motion.button>
                            )}

                            {isOnline && (
                                <div className="mt-3 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-bold text-center">
                                    All Systems Operational
                                </div>
                            )}

                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ServerStatus;
