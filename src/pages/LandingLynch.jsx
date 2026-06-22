import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Sparkles, Users } from 'lucide-react'
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
        <motion.div initial={{ opacity:0, y:18 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:index*0.06, duration:0.4 }}>
            <Link to={`/product/${listing._id}`} style={{ textDecoration:'none', display:'block' }}>
                <div style={{ width:'100%', background:'rgba(6,2,2,0.84)', border:'1px solid rgba(195,25,25,0.32)', borderRadius:10, padding:11, backdropFilter:'blur(16px)', boxShadow:'0 8px 32px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)', cursor:'pointer', transition:'transform 0.22s, border-color 0.22s, box-shadow 0.22s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.borderColor='rgba(220,40,40,0.7)'; e.currentTarget.style.boxShadow='0 16px 44px rgba(195,25,25,0.25), 0 6px 18px rgba(0,0,0,0.7)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor='rgba(195,25,25,0.32)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)' }}
                >
                    <div style={{ width:'100%', aspectRatio:'1/1', borderRadius:6, overflow:'hidden', marginBottom:9, background:'rgba(18,8,8,0.9)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {listing.images?.[0] ? <img src={listing.images[0]} alt={listing.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:26, opacity:0.25 }}>◈</span>}
                    </div>
                    <p style={{ color:'rgba(240,220,210,0.9)', fontSize:12, fontWeight:500, lineHeight:1.3, margin:'0 0 7px', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', minHeight:'2.6em' }}>{listing.title}</p>
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
        <div style={{ width:'100%', background:'rgba(6,2,2,0.84)', border:'1px solid rgba(195,25,25,0.15)', borderRadius:10, padding:11, backdropFilter:'blur(16px)' }}>
            <div style={{ width:'100%', aspectRatio:'1/1', background:'rgba(195,25,25,0.05)', borderRadius:6, marginBottom:9, animation:'lPulse 1.8s ease-in-out infinite' }} />
            <div style={{ height:10, background:'rgba(255,255,255,0.05)', borderRadius:4, marginBottom:7, width:'75%', animation:'lPulse 1.8s ease-in-out infinite 0.2s' }} />
            <div style={{ height:15, background:'rgba(201,168,76,0.08)', borderRadius:4, width:'45%', animation:'lPulse 1.8s ease-in-out infinite 0.4s' }} />
        </div>
    )
}

const CATEGORIES = [
    { name: 'Electronics', icon: '◈', slug: 'electronics' },
    { name: 'Fashion',     icon: '✦', slug: 'fashion'     },
    { name: 'Home',        icon: '◇', slug: 'home'        },
    { name: 'Collectibles',icon: '✧', slug: 'collectibles'},
]

export default function LandingLynch() {
    const [listings, setListings] = useState([])
    const [loading, setLoading]   = useState(true)
    const [query, setQuery]       = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        let cancelled = false
        listingsAPI.getAll({ limit: 8 })
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

            <div style={{ position:'relative', minHeight:'calc(100vh - 80px)' }}>

                {/* ── HERO ROOM — compact 80vh, fits in viewport ── */}
                <section style={{ position:'relative', height:'min(80vh, 720px)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                    {/* Vignette over the room canvas */}
                    <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 45%, transparent 38%, rgba(3,1,1,0.6) 100%)', pointerEvents:'none', zIndex:1 }} />

                    <motion.div
                        initial={{ opacity:0, y:-14 }}
                        animate={{ opacity:1, y:0 }}
                        transition={{ duration:0.65 }}
                        style={{ textAlign:'center', width:'min(640px, 92vw)', zIndex:10, position:'relative' }}
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

                    {/* Scroll cue */}
                    <motion.div
                        animate={{ y:[0, 8, 0] }}
                        transition={{ duration:1.8, repeat:Infinity }}
                        style={{ position:'absolute', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:10, color:'rgba(245,215,195,0.4)', fontSize:10, letterSpacing:'0.28em', textTransform:'uppercase', fontFamily:'Georgia, serif', pointerEvents:'none' }}
                    >
                        ↓ Enter the Lodge
                    </motion.div>
                </section>

                {/* ── FEATURED ITEMS ── */}
                <section style={{ padding:'80px 24px 60px', position:'relative', zIndex:5 }}>
                    <div style={{ maxWidth:1200, margin:'0 auto' }}>
                        <motion.div initial={{ opacity:0, y:14 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} style={{ textAlign:'center', marginBottom:36 }}>
                            <p style={{ fontFamily:'Georgia, serif', letterSpacing:'0.3em', color:'rgba(195,25,25,0.7)', fontSize:11, textTransform:'uppercase', margin:'0 0 10px' }}>
                                ⟡ Featured ⟡
                            </p>
                            <h2 style={{ color:'#F5EEE6', fontSize:'clamp(24px,3.5vw,38px)', fontFamily:'Georgia, serif', fontWeight:700, margin:0, letterSpacing:'0.02em' }}>
                                Items in the Lodge
                            </h2>
                        </motion.div>

                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:18 }}>
                            {loading
                                ? [0,1,2,3,4,5,6,7].map(i => <SkeletonCard key={i} />)
                                : listings.length > 0
                                    ? listings.map((l, i) => <ProductCard key={l._id} listing={l} index={i} />)
                                    : <p style={{ gridColumn:'1/-1', textAlign:'center', color:'rgba(195,25,25,0.5)', fontSize:13 }}>The room is empty. <Link to="/sell/quick" style={{ color:'#C9A84C' }}>Be the first to list.</Link></p>
                            }
                        </div>

                        {listings.length > 0 && (
                            <div style={{ textAlign:'center', marginTop:36 }}>
                                <Link to="/browse" style={{ color:'rgba(245,215,195,0.7)', fontSize:12, letterSpacing:'0.24em', textTransform:'uppercase', textDecoration:'none', fontFamily:'Georgia, serif', borderBottom:'1px solid rgba(195,25,25,0.4)', paddingBottom:4 }}>
                                    See all items →
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── CATEGORIES ── */}
                <section style={{ padding:'40px 24px 60px', position:'relative', zIndex:5 }}>
                    <div style={{ maxWidth:1200, margin:'0 auto' }}>
                        <motion.div initial={{ opacity:0, y:14 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} style={{ textAlign:'center', marginBottom:32 }}>
                            <p style={{ fontFamily:'Georgia, serif', letterSpacing:'0.3em', color:'rgba(195,25,25,0.7)', fontSize:11, textTransform:'uppercase', margin:'0 0 10px' }}>
                                ✦ Wander ✦
                            </p>
                            <h2 style={{ color:'#F5EEE6', fontSize:'clamp(22px,3vw,32px)', fontFamily:'Georgia, serif', fontWeight:700, margin:0 }}>
                                Categories
                            </h2>
                        </motion.div>

                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:14 }}>
                            {CATEGORIES.map((c, i) => (
                                <motion.div key={c.slug} initial={{ opacity:0, y:14 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.08, duration:0.4 }}>
                                    <Link to={`/browse/${c.slug}`} style={{ display:'block', padding:'28px 20px', background:'rgba(6,2,2,0.78)', border:'1px solid rgba(195,25,25,0.3)', borderRadius:12, textDecoration:'none', textAlign:'center', backdropFilter:'blur(14px)', transition:'all 0.25s' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(220,40,40,0.7)'; e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 14px 38px rgba(195,25,25,0.2)' }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(195,25,25,0.3)'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}
                                    >
                                        <div style={{ fontSize:32, color:'rgba(201,168,76,0.85)', marginBottom:10 }}>{c.icon}</div>
                                        <div style={{ color:'#F5EEE6', fontSize:14, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'Georgia, serif' }}>{c.name}</div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── TRUST / SHIELD ── */}
                <section style={{ padding:'60px 24px 80px', position:'relative', zIndex:5 }}>
                    <div style={{ maxWidth:980, margin:'0 auto', textAlign:'center' }}>
                        <motion.div initial={{ opacity:0, y:14 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }}>
                            <p style={{ fontFamily:'Georgia, serif', letterSpacing:'0.3em', color:'rgba(195,25,25,0.7)', fontSize:11, textTransform:'uppercase', margin:'0 0 10px' }}>
                                ⌖ The Shield ⌖
                            </p>
                            <h2 style={{ color:'#F5EEE6', fontSize:'clamp(24px,3.5vw,36px)', fontFamily:'Georgia, serif', fontWeight:700, margin:'0 0 16px' }}>
                                Zero-fraud guarantee
                            </h2>
                            <p style={{ color:'rgba(245,215,195,0.7)', fontSize:14, lineHeight:1.7, margin:'0 0 32px', maxWidth:600, marginLeft:'auto', marginRight:'auto' }}>
                                Every listing verified by AI. Every payment held in escrow until you confirm.
                                Every seller carries a digital passport. The Lodge protects its own.
                            </p>
                        </motion.div>

                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:18, marginBottom:32 }}>
                            {[
                                { icon: Shield,    title:'Verified Listings', body:'AI checks every photo and claim before going live.' },
                                { icon: Sparkles,  title:'Escrow Payments',   body:'Funds released only after you confirm the item.' },
                                { icon: Users,     title:'Trust Score',       body:'Every member carries a transparent reputation graph.' },
                            ].map((f, i) => (
                                <motion.div key={f.title} initial={{ opacity:0, y:14 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1, duration:0.45 }} style={{ padding:24, background:'rgba(6,2,2,0.78)', border:'1px solid rgba(195,25,25,0.28)', borderRadius:12, textAlign:'left', backdropFilter:'blur(14px)' }}>
                                    <f.icon size={22} color="#C9A84C" style={{ marginBottom:12 }} />
                                    <h3 style={{ color:'#F5EEE6', fontSize:15, fontWeight:600, margin:'0 0 8px', letterSpacing:'0.04em' }}>{f.title}</h3>
                                    <p style={{ color:'rgba(245,215,195,0.6)', fontSize:12.5, lineHeight:1.55, margin:0 }}>{f.body}</p>
                                </motion.div>
                            ))}
                        </div>

                        <Link to="/shield" style={{ display:'inline-block', padding:'12px 28px', background:'rgba(195,25,25,0.85)', color:'#F5EEE6', borderRadius:8, fontSize:13, fontWeight:600, textDecoration:'none', border:'1px solid rgba(220,40,40,0.4)', boxShadow:'0 6px 22px rgba(195,25,25,0.22)', letterSpacing:'0.04em' }}>
                            Read the Shield protocol
                        </Link>
                    </div>
                </section>

                {/* Byline */}
                <p style={{ textAlign:'center', padding:'30px 24px', margin:0, color:'rgba(245,215,195,0.3)', fontSize:10, letterSpacing:'0.28em', textTransform:'uppercase', fontFamily:'Georgia, serif' }}>
                    The owls are not what they seem
                </p>
            </div>
        </>
    )
}
