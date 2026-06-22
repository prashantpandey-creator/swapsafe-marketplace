import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { listingsAPI } from '../services/api'

function ConditionBadge({ condition }) {
    const map = {
        'new':      { label: 'New',      color: 'rgba(80,200,120,0.9)'  },
        'like_new': { label: 'Like New', color: 'rgba(100,180,100,0.85)'},
        'good':     { label: 'Good',     color: 'rgba(201,168,76,0.9)'  },
        'fair':     { label: 'Fair',     color: 'rgba(180,120,60,0.85)' },
        'poor':     { label: 'Poor',     color: 'rgba(180,60,60,0.85)'  },
    }
    const e = map[condition?.toLowerCase()] || { label: condition || '—', color: 'rgba(140,120,120,0.8)' }
    return <span style={{ display:'inline-block', padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:700, letterSpacing:'0.06em', background:e.color, color:'#0A0505', textTransform:'uppercase' }}>{e.label}</span>
}

function ProductCard({ listing, index }) {
    return (
        <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1+index*0.1, duration:0.45 }}>
            <Link to={`/product/${listing._id}`} style={{ textDecoration:'none', display:'block' }}>
                <div style={{ width:175, background:'rgba(6,2,2,0.84)', border:'1px solid rgba(195,25,25,0.32)', borderRadius:10, padding:11, backdropFilter:'blur(16px)', boxShadow:'0 8px 32px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)', cursor:'pointer', transition:'transform 0.22s, border-color 0.22s, box-shadow 0.22s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-8px) scale(1.03)'; e.currentTarget.style.borderColor='rgba(220,40,40,0.7)'; e.currentTarget.style.boxShadow='0 20px 50px rgba(195,25,25,0.28), 0 6px 20px rgba(0,0,0,0.7)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0) scale(1)'; e.currentTarget.style.borderColor='rgba(195,25,25,0.32)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)' }}
                >
                    <div style={{ width:'100%', height:105, borderRadius:6, overflow:'hidden', marginBottom:9, background:'rgba(18,8,8,0.9)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {listing.images?.[0] ? <img src={listing.images[0]} alt={listing.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:26, opacity:0.25 }}>◈</span>}
                    </div>
                    <p style={{ color:'rgba(240,220,210,0.9)', fontSize:12, fontWeight:500, lineHeight:1.3, margin:'0 0 7px', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{listing.title}</p>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ color:'#C9A84C', fontSize:15, fontWeight:700 }}>${listing.price?.toLocaleString() ?? '—'}</span>
                        <ConditionBadge condition={listing.condition} />
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}

function SkeletonCard() {
    return (
        <div style={{ width:175, background:'rgba(6,2,2,0.84)', border:'1px solid rgba(195,25,25,0.15)', borderRadius:10, padding:11, backdropFilter:'blur(16px)' }}>
            <div style={{ width:'100%', height:105, background:'rgba(195,25,25,0.05)', borderRadius:6, marginBottom:9, animation:'lPulse 1.8s ease-in-out infinite' }} />
            <div style={{ height:10, background:'rgba(255,255,255,0.05)', borderRadius:4, marginBottom:7, width:'75%', animation:'lPulse 1.8s ease-in-out infinite 0.2s' }} />
            <div style={{ height:15, background:'rgba(201,168,76,0.08)', borderRadius:4, width:'45%', animation:'lPulse 1.8s ease-in-out infinite 0.4s' }} />
        </div>
    )
}

export default function LandingLynch() {
    const [listings, setListings] = useState([])
    const [loading, setLoading]   = useState(true)
    const [query, setQuery]       = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        let cancelled = false
        listingsAPI.getAll({ limit: 4 })
            .then(data => { if (!cancelled) setListings(Array.isArray(data) ? data : (data?.listings ?? [])) })
            .catch(() => { if (!cancelled) setListings([]) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [])

    const handleSearch = e => {
        e.preventDefault()
        navigate(query.trim() ? `/browse?q=${encodeURIComponent(query.trim())}` : '/browse')
    }

    return (
        <>
            <style>{`
                @keyframes lPulse { 0%,100%{opacity:.35} 50%{opacity:.7} }
                @keyframes lGlow  { 0%,100%{text-shadow:0 0 20px rgba(195,25,25,.45),0 0 55px rgba(195,25,25,.2)} 50%{text-shadow:0 0 34px rgba(225,45,45,.7),0 0 85px rgba(195,25,25,.35)} }
            `}</style>

            {/* Full-viewport room. Canvas background (zIndex 0) already draws curtains + floor + blue light. */}
            <div style={{ position:'relative', height:'calc(100vh - 80px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', padding:'7vh 20px 5vh', boxSizing:'border-box', overflow:'hidden' }}>

                {/* ── HERO — sits in the "back wall / curtain" zone (top ~55%) ── */}
                <motion.div
                    initial={{ opacity:0, y:-14 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ duration:0.65 }}
                    style={{ textAlign:'center', width:'min(640px, 92vw)', zIndex:10 }}
                >
                    <p style={{ fontFamily:'Georgia, serif', letterSpacing:'0.36em', color:'rgba(245,235,220,0.7)', fontSize:11, textTransform:'uppercase', margin:'0 0 14px' }}>
                        The Black Lodge Marketplace
                    </p>
                    <h1 style={{ fontSize:'clamp(40px,6.5vw,78px)', fontWeight:700, color:'#F5EEE6', lineHeight:1.04, margin:'0 0 12px', fontFamily:'Georgia, serif', animation:'lGlow 4s ease-in-out infinite' }}>
                        BuyersLegion
                    </h1>
                    <p style={{ color:'rgba(245,215,195,0.65)', fontSize:12, letterSpacing:'0.22em', textTransform:'uppercase', margin:'0 0 24px', fontFamily:'Georgia, serif' }}>
                        SwapSafe · Verified P2P
                    </p>

                    <form onSubmit={handleSearch} style={{ position:'relative', width:'100%', marginBottom:16 }}>
                        <input
                            value={query} onChange={e => setQuery(e.target.value)}
                            placeholder="Search the Lodge…"
                            style={{ width:'100%', height:48, padding:'0 126px 0 18px', background:'rgba(5,2,2,0.78)', border:'1px solid rgba(195,25,25,0.45)', borderRadius:10, color:'#F5EEE6', outline:'none', backdropFilter:'blur(18px)', fontSize:14, boxSizing:'border-box', boxShadow:'0 8px 30px rgba(195,25,25,0.18)' }}
                            onFocus={e => { e.target.style.borderColor='rgba(220,40,40,0.85)' }}
                            onBlur={e  => { e.target.style.borderColor='rgba(195,25,25,0.45)' }}
                        />
                        <button type="submit" style={{ position:'absolute', right:6, top:6, height:36, padding:'0 20px', background:'rgba(195,25,25,0.9)', color:'#F5EEE6', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', transition:'background 0.18s' }}
                            onMouseEnter={e => { e.target.style.background='rgba(225,40,40,0.98)' }}
                            onMouseLeave={e => { e.target.style.background='rgba(195,25,25,0.9)' }}
                        >Search</button>
                    </form>

                    <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
                        {[
                            { to:'/browse',     label:'Browse Items', primary:true  },
                            { to:'/sell/quick', label:'Sell Here',    primary:false },
                            { to:'/community',  label:'Community',    primary:false },
                        ].map(({ to, label, primary }) => (
                            <Link key={to} to={to} style={{ padding:'10px 22px', background: primary ? 'rgba(195,25,25,0.88)' : 'rgba(5,2,2,0.72)', border:`1px solid ${primary ? 'rgba(220,40,40,0.5)' : 'rgba(195,25,25,0.42)'}`, color:'#F5EEE6', borderRadius:8, fontSize:13, fontWeight:600, textDecoration:'none', backdropFilter:'blur(10px)', boxShadow: primary ? '0 6px 22px rgba(195,25,25,0.25)' : 'none', transition:'all 0.18s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = primary ? 'rgba(220,35,35,0.96)' : 'rgba(22,8,8,0.85)'; e.currentTarget.style.borderColor='rgba(220,40,40,0.7)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = primary ? 'rgba(195,25,25,0.88)' : 'rgba(5,2,2,0.72)'; e.currentTarget.style.borderColor = primary ? 'rgba(220,40,40,0.5)' : 'rgba(195,25,25,0.42)' }}
                            >{label}</Link>
                        ))}
                    </div>
                </motion.div>

                {/* ── PRODUCT CARDS — sit on the floor zone (bottom ~40%) ── */}
                <motion.div
                    initial={{ opacity:0, y:20 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ delay:0.2, duration:0.6 }}
                    style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap', zIndex:10, width:'min(900px, 96vw)' }}
                >
                    {loading
                        ? [0,1,2,3].map(i => <SkeletonCard key={i} />)
                        : listings.map((l, i) => <ProductCard key={l._id} listing={l} index={i} />)
                    }
                </motion.div>

                {/* Vignette — punch the edges dark so UI reads against any curtain brightness */}
                <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 42%, transparent 38%, rgba(3,1,1,0.62) 100%)', pointerEvents:'none', zIndex:5 }} />

                {/* Byline */}
                <motion.p
                    initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7, duration:0.9 }}
                    style={{ position:'absolute', bottom:18, left:24, margin:0, zIndex:10, color:'rgba(245,215,195,0.28)', fontSize:9, letterSpacing:'0.26em', textTransform:'uppercase', fontFamily:'Georgia, serif', pointerEvents:'none' }}
                >
                    The owls are not what they seem
                </motion.p>
            </div>
        </>
    )
}
