import React from 'react';
import { motion } from 'framer-motion';
import logo from '../../assets/buyers_legion_logo.png';

const TrustIndicators = () => {
    return (
        <div className="trust-card glass-panel p-5 rounded-xl border border-legion-gold/30 bg-legion-gold/5 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-legion-gold/10 blur-[50px] rounded-full pointer-events-none -mr-16 -mt-16"></div>

            <div className="flex items-center gap-3 mb-4">
                <img
                    src={logo}
                    alt="Shield"
                    className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,165,0,0.5)]"
                />
                <div>
                    <h3 className="text-sm font-black text-legion-gold uppercase tracking-wider">
                        Guardian Protected
                    </h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                        By Buyers Legion
                    </p>
                </div>
            </div>

            <ul className="space-y-3">
                <TrustItem
                    icon={<ShieldCheck />}
                    title="Verified Identity"
                    desc="Seller ID & history checked"
                />
                <TrustItem
                    icon={<Lock />}
                    title="Escrow Payment"
                    desc="Money released only when happy"
                />
                <TrustItem
                    icon={<Zap />}
                    title="Dispute Resolution"
                    desc="24/7 Guardian mediation"
                />
            </ul>
        </div>
    );
};

const TrustItem = ({ icon, title, desc }) => (
    <motion.li
        className="flex items-start gap-3"
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
    >
        <div className="mt-0.5 text-legion-gold">
            {icon}
        </div>
        <div>
            <h4 className="text-xs font-bold text-slate-200">{title}</h4>
            <p className="text-[10px] text-slate-400 leading-tight">{desc}</p>
        </div>
    </motion.li>
);

// Icons
const ShieldCheck = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
    </svg>
);

const Lock = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const Zap = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

export default TrustIndicators;
