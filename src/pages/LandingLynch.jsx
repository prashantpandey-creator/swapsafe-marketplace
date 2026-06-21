import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { listingsAPI } from '../services/api'

// ── Condition badge ───────────────────────────────────────────────────────────
function ConditionBadge({ condition }) {
    const map = {
        'new':      { label: 'New',      color: 'rgba(80,200,120,0.85)' },
        'like_new': { label: 'Like New', color: 'rgba(100,180,100,0.8)' },
        'good':     { label: 'Good',     color: 'rgba(201,168,76,0.85)' },
        'fair':     { label: 'Fair',     color: 'rgba(180,120,60,0.8)'  },
        'poor':     { label: 'Poor',     color: 'rgba(180,60,60,0.8)'   },
    }
    const entry = map[condition?.toLowerCase()] || { label: condition || '—', color: 'rgba(140,120,120,0.7)' }
    return (
        <span style={{
            display: 'inline-block',
            padding: '2px 7px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.05em',
            background: entry.color,
            color: '#0C0606',
            textTransform: 'uppercase',
        }}>
            {entry.label}
        </span>
    )
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div style={{
            width: 200,
            background: 'rgba(8,4,4,0.85)',
            border: '1px solid rgba(195,25,25,0.2)',
            borderRadius: 10,
            padding: 12,
            backdropFilter: 'blur(8px)',
        }}>
            <div style={{ width: '100%', height: 130, background: 'rgba(195,25,25,0.06)', borderRadius: 6, marginBottom: 10, animation: 'lynchPulse 1.8s ease-in-out infinite' }} />
            <div style={{ height: 11, background: 'rgba(195,25,25,0.08)', borderRadius: 4, marginBottom: 8, width: '80%', animation: 'lynchPulse 1.8s ease-in-out infinite 0.2s' }} />
            <div style={{ height: 16, background: 'rgba(201,168,76,0.12)', borderRadius: 4, width: '50%', animation: 'lynchPulse 1.8s ease-in-out infinite 0.4s' }} />
        </div>
    )
}

// ── Product card ──────────────────────────────────────────────────────────────
function FloorCard({ listing, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.15, duration: 0.55, ease: 'easeOut' }}
        >
            <Link to={`/product/${listing._id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                    width: 200,
                    background: 'rgba(8,4,4,0.88)',
                    border: '1px solid rgba(195,25,25,0.28)',
                    borderRadius: 10,
                    padding: 12,
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s',
                    boxShadow: '0 14px 34px rgba(0,0,0,0.55)',
                }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(195,25,25,0.7)'
                        e.currentTarget.style.transform = 'translateY(-6px)'
                        e.currentTarget.style.boxShadow = '0 20px 44px rgba(195,25,25,0.22), 0 6px 18px rgba(0,0,0,0.6)'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(195,25,25,0.28)'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 14px 34px rgba(0,0,0,0.55)'
                    }}
                >
                    <div style={{ width: '100%', height: 130, borderRadius: 6, overflow: 'hidden', marginBottom: 10, background: 'rgba(22,10,10,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {listing.images?.[0]
                            ? <img src={listing.images[0]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            : <span style={{ fontSize: 28, opacity: 0.3 }}>◈</span>}
                    </div>
                    <p style={{ color: 'rgba(235,215,200,0.88)', fontSize: 13, fontWeight: 500, lineHeight: 1.35, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {listing.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{ color: '#C9A84C', fontSize: 16, fontWeight: 700, letterSpacing: '0.02em' }}>
                            ${listing.price?.toLocaleString() ?? '—'}
                        </span>
                        <ConditionBadge condition={listing.condition} />
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LandingLynch() {
    const [listings, setListings] = useState([])
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        listingsAPI.getAll({ limit: 4 })
            .then(data => {
                if (cancelled) return
                const arr = Array.isArray(data) ? data : (data?.listings ?? [])
                setListings(arr.slice(0, 4))
            })
            .catch(() => { if (!cancelled) setListings([]) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [])

    const handleSearch = (e) => {
        e.preventDefault()
        navigate(query.trim() ? `/browse?q=${encodeURIComponent(query.trim())}` : '/browse')
    }

    return (
        <>
            <style>{`
                @keyframes lynchPulse { 0%,100%{opacity:.4} 50%{opacity:.75} }
                @keyframes lynchGlow {
                    0%,100% { text-shadow: 0 0 18px rgba(195,25,25,.3), 0 0 42px rgba(195,25,25,.12); }
                    50%     { text-shadow: 0 0 28px rgba(220,40,40,.5), 0 0 60px rgba(195,25,25,.22); }
                }
            `}</style>

            {/* Single centered column. Background canvas shows through (it's zIndex 0). */}
            <div style={{
                position: 'relative',
                minHeight: 'calc(100vh - 80px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                textAlign: 'center',
                padding: '6vh 20px 4vh',
                boxSizing: 'border-box',
            }}>

                {/* ── Hero ── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    style={{ width: 'min(620px, 94vw)', marginBottom: '5vh' }}
                >
                    <p style={{
                        fontFamily: 'Georgia, serif',
                        letterSpacing: '0.34em',
                        color: 'rgba(245,240,232,0.62)',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        margin: '0 0 16px',
                    }}>
                        The Black Lodge Marketplace
                    </p>

                    <h1 style={{
                        fontSize: 'clamp(40px, 7vw, 78px)',
                        fontWeight: 700,
                        color: '#F5F0E8',
                        lineHeight: 1.04,
                        margin: '0 0 12px',
                        fontFamily: 'Georgia, serif',
                        letterSpacing: '0.03em',
                        animation: 'lynchGlow 4s ease-in-out infinite',
                    }}>
                        BuyersLegion
                    </h1>

                    <p style={{
                        color: 'rgba(245,220,200,0.7)',
                        fontSize: 13,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        margin: '0 0 28px',
                        fontFamily: 'Georgia, serif',
                    }}>
                        SwapSafe · Verified P2P
                    </p>

                    {/* Search bar */}
                    <form onSubmit={handleSearch} style={{ position: 'relative', width: '100%', margin: '0 auto 22px' }}>
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search the Lodge…"
                            style={{
                                width: '100%', height: 50, padding: '0 128px 0 20px',
                                background: 'rgba(8,4,4,0.78)', border: '1px solid rgba(195,25,25,0.42)',
                                borderRadius: 10, color: '#F5F0E8', outline: 'none',
                                backdropFilter: 'blur(14px)', fontSize: 15, boxSizing: 'border-box',
                                boxShadow: '0 8px 30px rgba(195,25,25,0.12)',
                            }}
                            onFocus={e => { e.target.style.borderColor = 'rgba(220,40,40,0.8)' }}
                            onBlur={e => { e.target.style.borderColor = 'rgba(195,25,25,0.42)' }}
                        />
                        <button type="submit" style={{
                            position: 'absolute', right: 6, top: 6, height: 38, padding: '0 22px',
                            background: 'rgba(195,25,25,0.88)', color: '#F5F0E8', border: 'none',
                            borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.03em',
                            transition: 'background 0.2s',
                        }}
                            onMouseEnter={e => { e.target.style.background = 'rgba(225,40,40,0.95)' }}
                            onMouseLeave={e => { e.target.style.background = 'rgba(195,25,25,0.88)' }}
                        >
                            Search
                        </button>
                    </form>

                    {/* CTA row */}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/browse" style={ctaPrimary}>Browse Items</Link>
                        <Link to="/sell/quick" style={ctaGhost}>Sell Here</Link>
                        <Link to="/community" style={ctaGhost}>Community</Link>
                    </div>
                </motion.div>

                {/* ── Featured listings sitting "in the room" ── */}
                <div style={{ width: 'min(1000px, 96vw)' }}>
                    <p style={{
                        fontFamily: 'Georgia, serif',
                        letterSpacing: '0.22em',
                        color: 'rgba(245,240,232,0.5)',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        margin: '0 0 20px',
                    }}>
                        ⟡ Featured in the Lodge ⟡
                    </p>

                    <div style={{
                        display: 'flex',
                        gap: 20,
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        perspective: '1400px',
                    }}>
                        {loading
                            ? [0, 1, 2, 3].map(i => <SkeletonCard key={i} />)
                            : listings.length > 0
                                ? listings.map((l, i) => <FloorCard key={l._id} listing={l} index={i} />)
                                : (
                                    <p style={{ color: 'rgba(195,25,25,0.5)', fontSize: 13, letterSpacing: '0.1em' }}>
                                        The room is empty. <Link to="/sell/quick" style={{ color: '#C9A84C' }}>Be the first to list.</Link>
                                    </p>
                                )}
                    </div>
                </div>

                {/* Byline */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.8 }}
                    style={{
                        marginTop: '5vh',
                        color: 'rgba(245,220,200,0.32)',
                        fontSize: 10,
                        letterSpacing: '0.24em',
                        textTransform: 'uppercase',
                        fontFamily: 'Georgia, serif',
                    }}
                >
                    The owls are not what they seem
                </motion.p>
            </div>
        </>
    )
}

const ctaPrimary = {
    padding: '11px 26px',
    background: 'rgba(195,25,25,0.85)',
    color: '#F5F0E8',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    letterSpacing: '0.03em',
    border: '1px solid rgba(220,40,40,0.4)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 6px 22px rgba(195,25,25,0.2)',
}

const ctaGhost = {
    padding: '11px 26px',
    background: 'rgba(8,4,4,0.72)',
    border: '1px solid rgba(195,25,25,0.42)',
    color: '#F5F0E8',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    letterSpacing: '0.03em',
    backdropFilter: 'blur(8px)',
}
