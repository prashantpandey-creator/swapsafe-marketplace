import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';

// Minimalist "coming soon" placeholder so the Community nav link resolves to
// a real, on-brand page instead of a blank route. Swap for the real feed later.
function Community() {
    const planned = [
        { icon: MessageSquare, title: 'Buyer & seller threads', body: 'Ask about an item, share a swap, vouch for someone you traded with.' },
        { icon: ShieldCheck, title: 'Trust, earned in public', body: 'Verified swaps and Trust Scores surface the most reliable members.' },
        { icon: Sparkles, title: 'Local meetups', body: 'Find safe, nearby spots to inspect and hand over items in person.' },
    ];

    return (
        <div className="min-h-screen px-6 pt-28 pb-20">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="mx-auto max-w-2xl"
            >
                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-sm text-[var(--m-fg-subtle)] hover:text-[var(--m-fg)] transition-colors mb-10"
                >
                    <ArrowLeft size={14} /> Back home
                </Link>

                <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center justify-center w-11 h-11 rounded-[10px] bg-[var(--m-surface)] border border-[var(--m-hairline)]">
                        <Users size={20} className="text-[var(--m-accent)]" />
                    </span>
                    <h1 className="text-2xl font-semibold tracking-tight text-[var(--m-fg)]">Community</h1>
                </div>

                <p className="text-[var(--m-fg-muted)] leading-relaxed mb-10 max-w-xl">
                    A place for buyers and sellers to talk, build reputation, and trade
                    safely. It’s being built now — here’s what’s coming.
                </p>

                <div className="space-y-3">
                    {planned.map((f) => (
                        <div
                            key={f.title}
                            className="flex items-start gap-3 p-4 rounded-[10px] border border-[var(--m-hairline)] bg-[var(--m-surface)]"
                        >
                            <f.icon size={18} className="text-[var(--m-fg-muted)] mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-[var(--m-fg)]">{f.title}</p>
                                <p className="text-sm text-[var(--m-fg-subtle)] mt-0.5">{f.body}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10">
                    <Link to="/browse" className="m-btn-ghost">Browse the market meanwhile</Link>
                </div>
            </motion.div>
        </div>
    );
}

export default Community;
