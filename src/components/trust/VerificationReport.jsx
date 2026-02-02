import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, Lock, Smartphone, CloudOff, AlertCircle, Copy, Flag, Fingerprint } from 'lucide-react';

const VerificationReport = ({
    deviceInfo = {},
    checks = {},
    digitalTwinId = null,
    verifiedAt = null
}) => {
    // Animation variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="bg-[#0A0A0F] text-white rounded-3xl overflow-hidden max-w-lg mx-auto border border-white/5 shadow-2xl">
            {/* Header */}
            <div className="bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="text-green-500 fill-green-500/20" size={20} />
                    <h1 className="text-lg font-bold tracking-tight">Verification Report</h1>
                </div>
                {verifiedAt && (
                    <span className="text-xs text-gray-400 font-mono">
                        {new Date(verifiedAt).toLocaleDateString()}
                    </span>
                )}
            </div>

            <main className="p-6 space-y-6">
                {/* Hero Section: Shield */}
                <div className="flex flex-col items-center justify-center gap-4 py-4">
                    <div className="relative flex items-center justify-center">
                        {/* Outer glow ring simulation */}
                        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl scale-150 opacity-20 animate-pulse"></div>
                        <motion.div
                            animate={{ scale: [1, 1.05, 1], filter: ["drop-shadow(0 0 15px rgba(34,197,94,0.3))", "drop-shadow(0 0 25px rgba(34,197,94,0.6))", "drop-shadow(0 0 15px rgba(34,197,94,0.3))"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Shield size={100} className="text-green-500 fill-green-500/10 stroke-[0.5]" />
                            <Check size={40} className="absolute inset-0 m-auto text-green-400" strokeWidth={3} />
                        </motion.div>
                    </div>
                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-lg">
                            SwapSafe Verified
                        </h2>
                        <p className="text-white/60 text-sm font-medium">
                            Comprehensive 50-point inspection passed
                        </p>
                    </div>
                </div>

                {/* Device Info Card (Glassmorphic) */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                    className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-lg relative overflow-hidden group"
                >
                    {/* Subtle gradient shine effect */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-white/10 transition-colors duration-500"></div>

                    <div className="flex flex-col gap-4 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-1">Device Verified</p>
                                <h3 className="text-xl font-bold text-legion-gold">{deviceInfo.model || "Unknown Device"}</h3>
                                <p className="text-white/80 text-sm mt-0.5">
                                    {deviceInfo.storage || "Storage N/A"} • {deviceInfo.color || "Color N/A"}
                                </p>
                            </div>
                            <Smartphone className="text-white/20" size={40} strokeWidth={1} />
                        </div>

                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                        <div className="grid grid-cols-1 gap-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-white/50">IMEI</span>
                                {deviceInfo.imei ? (
                                    <span className="font-mono text-white/90 tracking-wide bg-black/30 px-2 py-0.5 rounded border border-white/5">
                                        {deviceInfo.imei.slice(0, 6)}••••••{deviceInfo.imei.slice(-2)}
                                    </span>
                                ) : (
                                    <span className="text-white/30">N/A</span>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white/50">Details</span>
                                <span className="text-white/90">{deviceInfo.condition || "Used"} Condition</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Verification Checklist */}
                <motion.div variants={container} initial="hidden" animate="visible" className="space-y-3">
                    <h3 className="text-white/90 text-sm font-bold uppercase tracking-wider px-1">Checklist Summary</h3>

                    <CheckItem
                        icon={Check}
                        label="IMEI Valid"
                        sub="Whitelisted in global database"
                        passed={checks.imei !== false}
                    />
                    <CheckItem
                        icon={Shield}
                        label="Not Stolen"
                        sub="Global GSMA blocklist clear"
                        passed={checks.notStolen !== false}
                    />
                    <CheckItem
                        icon={Lock}
                        label="Carrier Status"
                        sub="Unlocked & fully paid off"
                        passed={checks.carrier !== false}
                    />
                    <CheckItem
                        icon={CloudOff}
                        label="iCloud Status"
                        sub="Activation Lock is OFF"
                        passed={checks.icloud !== false}
                    />
                    <CheckItem
                        icon={Check}
                        label="Condition Match"
                        sub="Grade A confirmed by inspector"
                        passed={checks.condition !== false}
                    />
                </motion.div>

                {/* Digital Twin ID */}
                {digitalTwinId && (
                    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mt-2">
                        <p className="text-white/50 text-xs uppercase tracking-wider text-center mb-2">Digital Twin Identity</p>
                        <button
                            onClick={() => { navigator.clipboard.writeText(digitalTwinId); alert("Copied ID!"); }}
                            className="w-full flex items-center justify-between gap-3 bg-black/40 border border-white/10 rounded-full px-5 py-3 group hover:border-green-500/30 transition-colors"
                        >
                            <Fingerprint className="text-white/30 group-hover:text-green-500 transition-colors" size={20} />
                            <span className="font-mono text-sm text-white/70 truncate flex-1 text-center group-hover:text-white transition-colors">
                                {digitalTwinId}
                            </span>
                            <Copy className="text-white/30 group-hover:text-white transition-colors" size={18} />
                        </button>
                    </motion.div>
                )}

                {/* Footer Actions */}
                <div className="mt-4 pt-6 pb-4 border-t border-white/5 flex flex-col gap-4">
                    <button className="w-full py-3.5 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 hover:border-white/40 transition-all flex items-center justify-center gap-2">
                        <Flag size={18} />
                        Report Issue
                    </button>
                    <div className="flex items-start gap-3 px-2">
                        <Shield className="text-legion-gold mt-0.5 shrink-0" size={20} fill="currentColor" />
                        <p className="text-xs leading-relaxed text-white/50">
                            This verification is backed by our <span className="text-legion-gold font-medium">SwapSafe Shield guarantee</span>. If the device differs from this report, you are covered for a full refund.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

const CheckItem = ({ icon: Icon, label, sub, passed }) => (
    <motion.div
        variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
        className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
    >
        <div className={`flex items-center justify-center size-8 rounded-full shrink-0 shadow-[0_0_10px_rgba(19,236,73,0.2)] ${passed ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            <Icon size={18} strokeWidth={3} />
        </div>
        <div className="flex flex-col">
            <span className="text-white font-semibold text-base">{label}</span>
            <span className="text-white/40 text-xs">{sub}</span>
        </div>
        {!passed && <AlertCircle className="ml-auto text-red-500" size={20} />}
    </motion.div>
);

export default VerificationReport;
