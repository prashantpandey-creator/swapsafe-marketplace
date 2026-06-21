import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { listingsAPI } from '../services/api'

// ── Torchiere lamp SVG ────────────────────────────────────────────────────────
function Torchiere({ style }) {
    return (
        <svg
            viewBox="0 0 40 220"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block', ...style }}
            aria-hidden="true"
        >
            {/* Flared shade (top cone, open upward) */}
            <polygon
                points="4,60 36,60 28,30 12,30"
                fill="rgba(22,14,14,0.95)"
                stroke="rgba(195,25,25,0.18)"
                strokeWidth="0.5"
            />
            {/* Inner glow of shade */}
            <polygon
                points="7,59 33,59 27,32 13,32"
                fill="rgba(195,25,25,0.08)"
            />
            {/* Thin stem */}
            <rect
                x="18"
                y="60"
                width="4"
                height="140"
                fill="rgba(22,14,14,0.95)"
                stroke="rgba(195,25,25,0.12)"
                strokeWidth="0.3"
            />
            {/* Base foot */}
            <ellipse
                cx="20"
                cy="205"
                rx="12"
                ry="4"
                fill="rgba(22,14,14,0.95)"
            />
            {/* Warm glow bloom above shade */}
            <ellipse
                cx="20"
                cy="30"
                rx="14"
                ry="8"
                fill="rgba(195,120,25,0.07)"
            />
        </svg>
    )
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div style={{
            width: 180,
            background: 'rgba(8,4,4,0.85)',
            border: '1px solid rgba(195,25,25,0.2)',
            borderRadius: 8,
            padding: 12,
            backdropFilter: 'blur(8px)',
        }}>
            <div style={{
                width: '100%',
                height: 110,
                background: 'rgba(195,25,25,0.06)',
                borderRadius: 6,
                marginBottom: 10,
                animation: 'lynchPulse 1.8s ease-in-out infinite',
            }} />
            <div style={{
                height: 11,
                background: 'rgba(195,25,25,0.08)',
                borderRadius: 4,
                marginBottom: 8,
                width: '80%',
                animation: 'lynchPulse 1.8s ease-in-out infinite 0.2s',
            }} />
            <div style={{
                height: 16,
                background: 'rgba(201,168,76,0.12)',
                borderRadius: 4,
                width: '50%',
                animation: 'lynchPulse 1.8s ease-in-out infinite 0.4s',
            }} />
        </div>
    )
}

// ── Condition badge ───────────────────────────────────────────────────────────
function ConditionBadge({ condition }) {
    const map = {
        'new':           { label: 'New',        color: 'rgba(80,200,120,0.85)' },
        'like_new':      { label: 'Like New',   color: 'rgba(100,180,100,0.8)' },
        'good':          { label: 'Good',       color: 'rgba(201,168,76,0.85)' },
        'fair':          { label: 'Fair',       color: 'rgba(180,120,60,0.8)'  },
        'poor':          { label: 'Poor',       color: 'rgba(180,60,60,0.8)'   },
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

// ── Product card that lives on the floor ──────────────────────────────────────
function FloorCard({ listing, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.2, duration: 0.55, ease: 'easeOut' }}
        >
            <Link
                to={`/product/${listing._id}`}
                style={{ textDecoration: 'none', display: 'block' }}
            >
                <div style={{
                    width: 180,
                    background: 'rgba(8,4,4,0.88)',
                    border: '1px solid rgba(195,25,25,0.28)',
                    borderRadius: 8,
                    padding: 12,
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    transition: 'border-color 0.25s, box-shadow 0.25s',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(195,25,25,0.65)'
                        e.currentTarget.style.boxShadow = '0 6px 32px rgba(195,25,25,0.18), 0 2px 12px rgba(0,0,0,0.6)'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(195,25,25,0.28)'
                        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.5)'
                    }}
                >
                    {/* Image */}
                    <div style={{
                        width: '100%',
                        height: 110,
                        borderRadius: 6,
                        overflow: 'hidden',
                        marginBottom: 10,
                        background: 'rgba(22,10,10,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {listing.images?.[0] ? (
                            <img
                                src={listing.images[0]}
                                alt={listing.title}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                            />
                        ) : (
                            <span style={{ fontSize: 28, opacity: 0.3 }}>◈</span>
                        )}
                    </div>

                    {/* Title */}
                    <p style={{
                        color: 'rgba(235,215,200,0.85)',
                        fontSize: 12,
                        fontWeight: 500,
                        lineHeight: 1.35,
                        marginBottom: 7,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        letterSpacing: '0.01em',
                    }}>
                        {listing.title}
                    </p>

                    {/* Price + condition */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{
                            color: '#C9A84C',
                            fontSize: 15,
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                        }}>
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
        listingsAPI.getAll({ limit: 3 })
            .then(data => {
                if (cancelled) return
                // API may return { listings: [...] } or a bare array
                const arr = Array.isArray(data) ? data : (data?.listings ?? [])
                setListings(arr.slice(0, 3))
            })
            .catch(() => {
                if (!cancelled) setListings([])
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [])

    const handleSearch = (e) => {
        e.preventDefault()
        if (query.trim()) navigate(`/browse?q=${encodeURIComponent(query.trim())}`)
        else navigate('/browse')
    }

    return (
        <>
            {/* Keyframes injected once */}
            <style>{`
                @keyframes lynchPulse {
                    0%, 100% { opacity: 0.4; }
                    50%       { opacity: 0.75; }
                }
                @keyframes lynchFadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes lynchGlow {
                    0%, 100% { text-shadow: 0 0 16px rgba(195,25,25,0.25), 0 0 32px rgba(195,25,25,0.1); }
                    50%      { text-shadow: 0 0 24px rgba(195,25,25,0.4),  0 0 48px rgba(195,25,25,0.18); }
                }
                @keyframes lynchBarGlow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(195,25,25,0); }
                    50%      { box-shadow: 0 0 18px 2px rgba(195,25,25,0.12); }
                }
            `}</style>

            {/* Root — sits above the canvas background (canvas is zIndex 0, app wrapper is zIndex 1) */}
            <div style={{
                position: 'relative',
                minHeight: 'calc(100vh - 80px)',   // account for header
                overflow: 'hidden',
            }}>

                {/* ── Perspective room wrapper ── */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    perspective: '800px',
                    perspectiveOrigin: '50% 62%',
                }}>

                    {/* ── Floor plane — cards sit here ── */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '5%',
                        right: '5%',
                        height: '48%',
                        transform: 'rotateX(58deg)',
                        transformOrigin: 'bottom center',
                        transformStyle: 'preserve-3d',
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'flex-end',
                        paddingBottom: 28,
                    }}>
                        {loading
                            ? [0, 1, 2].map(i => <SkeletonCard key={i} />)
                            : listings.length > 0
                                ? listings.map((l, i) => <FloorCard key={l._id} listing={l} index={i} />)
                                : [0, 1, 2].map(i => (
                                    /* Empty seat silhouette */
                                    <div key={i} style={{
                                        width: 180,
                                        height: 130,
                                        border: '1px dashed rgba(195,25,25,0.15)',
                                        borderRadius: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <span style={{ color: 'rgba(195,25,25,0.2)', fontSize: 22 }}>◈</span>
                                    </div>
                                ))
                        }
                    </div>
                </div>

                {/* ── Torchiere lamps (decorative, absolute over the room) ── */}
                {/* Left lamp */}
                <Torchiere style={{
                    position: 'absolute',
                    left: '13%',
                    top: '18%',
                    width: 38,
                    height: '42vh',
                    pointerEvents: 'none',
                    filter: 'drop-shadow(0 0 6px rgba(195,80,25,0.18))',
                    zIndex: 4,
                }} />
                {/* Right lamp */}
                <Torchiere style={{
                    position: 'absolute',
                    right: '12%',
                    top: '13%',
                    width: 44,
                    height: '46vh',
                    pointerEvents: 'none',
                    filter: 'drop-shadow(0 0 8px rgba(195,80,25,0.2))',
                    zIndex: 4,
                }} />

                {/* ── Center hero text (back-wall zone) ── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    style={{
                        position: 'absolute',
                        top: '10%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        textAlign: 'center',
                        zIndex: 10,
                        width: 'min(560px, 92vw)',
                    }}
                >
                    <p style={{
                        fontFamily: 'Georgia, serif',
                        letterSpacing: '0.32em',
                        color: 'rgba(235,215,200,0.55)',
                        fontSize: 10,
                        textTransform: 'uppercase',
                        marginBottom: 14,
                        marginTop: 0,
                    }}>
                        The Black Lodge Marketplace
                    </p>

                    <h1 style={{
                        fontSize: 'clamp(26px,5.5vw,54px)',
                        fontWeight: 700,
                        color: '#F5F0E8',
                        lineHeight: 1.08,
                        margin: '0 0 8px',
                        fontFamily: 'Georgia, serif',
                        letterSpacing: '0.04em',
                        animation: 'lynchGlow 4s ease-in-out infinite',
                    }}>
                        BuyersLegion
                    </h1>

                    <p style={{
                        color: 'rgba(195,25,25,0.65)',
                        fontSize: 12,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        margin: '0 0 22px',
                        fontFamily: 'Georgia, serif',
                    }}>
                        SwapSafe ✦ P2P
                    </p>

                    {/* Search bar */}
                    <form
                        onSubmit={handleSearch}
                        style={{ position: 'relative', width: '100%', margin: '0 auto' }}
                    >
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search the Lodge…"
                            style={{
                                width: '100%',
                                height: 46,
                                padding: '0 124px 0 18px',
                                background: 'rgba(8,4,4,0.72)',
                                border: '1px solid rgba(195,25,25,0.38)',
                                borderRadius: 8,
                                color: '#F5F0E8',
                                outline: 'none',
                                backdropFilter: 'blur(14px)',
                                fontSize: 14,
                                letterSpacing: '0.02em',
                                boxSizing: 'border-box',
                                animation: 'lynchBarGlow 4s ease-in-out infinite',
                            }}
                            onFocus={e => {
                                e.target.style.borderColor = 'rgba(195,25,25,0.7)'
                            }}
                            onBlur={e => {
                                e.target.style.borderColor = 'rgba(195,25,25,0.38)'
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                position: 'absolute',
                                right: 5,
                                top: 5,
                                height: 36,
                                padding: '0 18px',
                                background: 'rgba(195,25,25,0.82)',
                                color: '#F5F0E8',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                letterSpacing: '0.04em',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => { e.target.style.background = 'rgba(220,35,35,0.92)' }}
                            onMouseLeave={e => { e.target.style.background = 'rgba(195,25,25,0.82)' }}
                        >
                            Search
                        </button>
                    </form>
                </motion.div>

                {/* ── Horizon CTA bar ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    style={{
                        position: 'absolute',
                        bottom: '44%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 10,
                        zIndex: 20,
                        flexWrap: 'nowrap',
                    }}
                >
                    <Link
                        to="/browse"
                        style={{
                            padding: '8px 20px',
                            background: 'rgba(195,25,25,0.78)',
                            color: '#F5F0E8',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            letterSpacing: '0.03em',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(195,25,25,0.3)',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,35,35,0.9)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(195,25,25,0.78)' }}
                    >
                        Browse Items
                    </Link>

                    <Link
                        to="/sell/quick"
                        style={{
                            padding: '8px 20px',
                            background: 'rgba(8,4,4,0.72)',
                            border: '1px solid rgba(195,25,25,0.4)',
                            color: '#F5F0E8',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            letterSpacing: '0.03em',
                            backdropFilter: 'blur(8px)',
                            transition: 'border-color 0.2s, background 0.2s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'rgba(195,25,25,0.75)'
                            e.currentTarget.style.background = 'rgba(30,10,10,0.85)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'rgba(195,25,25,0.4)'
                            e.currentTarget.style.background = 'rgba(8,4,4,0.72)'
                        }}
                    >
                        Sell Here
                    </Link>

                    <Link
                        to="/community"
                        style={{
                            padding: '8px 20px',
                            background: 'rgba(8,4,4,0.72)',
                            border: '1px solid rgba(195,25,25,0.4)',
                            color: '#F5F0E8',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            letterSpacing: '0.03em',
                            backdropFilter: 'blur(8px)',
                            transition: 'border-color 0.2s, background 0.2s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'rgba(195,25,25,0.75)'
                            e.currentTarget.style.background = 'rgba(30,10,10,0.85)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'rgba(195,25,25,0.4)'
                            e.currentTarget.style.background = 'rgba(8,4,4,0.72)'
                        }}
                    >
                        Community
                    </Link>
                </motion.div>

                {/* ── Subtle vignette to push edges into darkness ── */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at 50% 55%, transparent 38%, rgba(4,2,2,0.55) 100%)',
                    pointerEvents: 'none',
                    zIndex: 3,
                }} />

                {/* ── Floor-level ambient glow (crimson horizon line) ── */}
                <div style={{
                    position: 'absolute',
                    bottom: '43%',
                    left: '15%',
                    right: '15%',
                    height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(195,25,25,0.25) 30%, rgba(195,25,25,0.25) 70%, transparent)',
                    pointerEvents: 'none',
                    zIndex: 5,
                }} />

                {/* ── "Aired in this room" byline, bottom left ── */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.8 }}
                    style={{
                        position: 'absolute',
                        bottom: 20,
                        left: 24,
                        color: 'rgba(195,25,25,0.3)',
                        fontSize: 9,
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        fontFamily: 'Georgia, serif',
                        margin: 0,
                        zIndex: 20,
                        pointerEvents: 'none',
                    }}
                >
                    The owls are not what they seem
                </motion.p>
            </div>
        </>
    )
}
