import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { listingsAPI } from '../services/api'

const MODEL_ID = '46430c73087e4951a6bdf2f4bd3305f4'
const EMBED = `https://sketchfab.com/models/${MODEL_ID}/embed?autostart=1&ui_stop=0&ui_inspector=0&ui_watermark=0&ui_watermark_link=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=0&dnt=1&camera=0&autospin=0&preload=1`

function Badge({ condition }) {
    const map = { new:'rgba(80,200,120,0.9)', like_new:'rgba(100,180,100,0.85)', good:'rgba(201,168,76,0.9)', fair:'rgba(180,120,60,0.85)', poor:'rgba(180,60,60,0.85)' }
    const label = condition?.replace('_',' ') || '—'
    const bg = map[condition?.toLowerCase()] || 'rgba(140,120,120,0.8)'
    return <span style={{ padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:700, letterSpacing:'0.06em', background:bg, color:'#0A0505', textTransform:'uppercase' }}>{label}</span>
}

function Card({ listing, i }) {
    return (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6+i*0.1, duration:0.45 }}>
            <Link to={`/product/${listing._id}`} style={{ textDecoration:'none', display:'block' }}>
                <div style={{ width:168, background:'rgba(5,1,1,0.86)', border:'1px solid rgba(195,25,25,0.3)', borderRadius:10, padding:10, backdropFilter:'blur(18px)', boxShadow:'0 8px 32px rgba(0,0,0,0.7)', cursor:'pointer', transition:'transform 0.2s,border-color 0.2s,box-shadow 0.2s' }}
                    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-7px) scale(1.03)';e.currentTarget.style.borderColor='rgba(220,40,40,0.7)';e.currentTarget.style.boxShadow='0 20px 50px rgba(195,25,25,0.28)'}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0) scale(1)';e.currentTarget.style.borderColor='rgba(195,25,25,0.3)';e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.7)'}}
                >
                    <div style={{ width:'100%', height:100, borderRadius:6, overflow:'hidden', marginBottom:8, background:'rgba(18,8,8,0.9)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {listing.images?.[0] ? <img src={listing.images[0]} alt={listing.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:22, opacity:0.2 }}>◈</span>}
                    </div>
                    <p style={{ color:'rgba(240,220,210,0.9)', fontSize:11.5, fontWeight:500, lineHeight:1.3, margin:'0 0 6px', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{listing.title}</p>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ color:'#C9A84C', fontSize:14, fontWeight:700 }}>${listing.price?.toLocaleString()??'—'}</span>
                        <Badge condition={listing.condition} />
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}

export default function LandingLynch() {
    const [listings, setListings] = useState([])
    const [ready, setReady] = useState(false)
    const [query, setQuery] = useState('')
    const navigate = useNavigate()
    const iframeRef = useRef(null)
    const timerRef = useRef(null)

    useEffect(() => {
        listingsAPI.getAll({ limit:4 })
            .then(d => setListings(Array.isArray(d) ? d : (d?.listings??[])))
            .catch(() => setListings([]))
        return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }, [])

    const handleLoad = () => {
        timerRef.current = setTimeout(() => setReady(true), 1200)
    }

    const handleSearch = e => {
        e.preventDefault()
        navigate(query.trim() ? `/browse?q=${encodeURIComponent(query.trim())}` : '/browse')
    }

    return (
        <>
            <style>{`
                @keyframes lGlow { 0%,100%{text-shadow:0 0 22px rgba(195,25,25,.5),0 0 60px rgba(195,25,25,.22)} 50%{text-shadow:0 0 36px rgba(225,45,45,.75),0 0 90px rgba(195,25,25,.38)} }
                @keyframes lEnter { from{opacity:0;letter-spacing:0.6em} to{opacity:1;letter-spacing:0.36em} }
                @keyframes spin { to{transform:rotate(360deg)} }
            `}</style>

            <div style={{ position:'relative', height:'calc(100vh - 80px)', overflow:'hidden', background:'#030101' }}>

                {/* ── THE REAL 3D ROOM ── */}
                <iframe
                    ref={iframeRef}
                    src={EMBED}
                    title="Twin Peaks Red Room"
                    allow="autoplay; fullscreen; xr-spatial-tracking"
                    allowFullScreen
                    onLoad={handleLoad}
                    style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none', opacity: ready ? 1 : 0, transition:'opacity 1.4s ease', pointerEvents:'auto' }}
                />

                {/* Loading screen */}
                <AnimatePresence>
                    {!ready && (
                        <motion.div exit={{ opacity:0 }} transition={{ duration:0.8 }}
                            style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#030101', zIndex:20 }}
                        >
                            <div style={{ width:28, height:28, border:'2px solid rgba(195,25,25,0.2)', borderTop:'2px solid rgba(195,25,25,0.8)', borderRadius:'50%', animation:'spin 0.9s linear infinite', marginBottom:20 }} />
                            <p style={{ fontFamily:'Georgia,serif', letterSpacing:'0.36em', color:'rgba(245,235,220,0.6)', fontSize:11, textTransform:'uppercase', margin:0, animation:'lEnter 1.2s ease forwards' }}>
                                Entering the Lodge
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Edge vignette — softens iframe edges, keeps UI readable */}
                <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 42%, transparent 42%, rgba(3,1,1,0.55) 100%)', pointerEvents:'none', zIndex:5 }} />
                {/* Top fade — hero text zone */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'45%', background:'linear-gradient(180deg, rgba(3,1,1,0.45) 0%, transparent 100%)', pointerEvents:'none', zIndex:5 }} />
                {/* Bottom fade — card zone */}
                <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'38%', background:'linear-gradient(0deg, rgba(3,1,1,0.62) 0%, transparent 100%)', pointerEvents:'none', zIndex:5 }} />

                {/* ── HERO TEXT ── floats over back wall of the room */}
                <AnimatePresence>
                    {ready && (
                        <motion.div
                            initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.75 }}
                            style={{ position:'absolute', top:'10%', left:'50%', transform:'translateX(-50%)', textAlign:'center', zIndex:10, width:'min(640px,92vw)', pointerEvents:'none' }}
                        >
                            <p style={{ fontFamily:'Georgia,serif', letterSpacing:'0.36em', color:'rgba(245,235,220,0.7)', fontSize:11, textTransform:'uppercase', margin:'0 0 14px' }}>
                                The Black Lodge Marketplace
                            </p>
                            <h1 style={{ fontSize:'clamp(40px,6.5vw,78px)', fontWeight:700, color:'#F5EEE6', lineHeight:1.04, margin:'0 0 10px', fontFamily:'Georgia,serif', animation:'lGlow 4s ease-in-out infinite' }}>
                                BuyersLegion
                            </h1>
                            <p style={{ color:'rgba(245,215,195,0.6)', fontSize:11, letterSpacing:'0.22em', textTransform:'uppercase', margin:0, fontFamily:'Georgia,serif' }}>
                                SwapSafe · Verified P2P
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── SEARCH + CTAs ── mid-room, horizon line */}
                <AnimatePresence>
                    {ready && (
                        <motion.div
                            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25, duration:0.65 }}
                            style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:10, width:'min(520px,88vw)' }}
                        >
                            <form onSubmit={handleSearch} style={{ position:'relative', marginBottom:14 }}>
                                <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search the Lodge…"
                                    style={{ width:'100%', height:46, padding:'0 118px 0 16px', background:'rgba(4,1,1,0.8)', border:'1px solid rgba(195,25,25,0.45)', borderRadius:9, color:'#F5EEE6', outline:'none', backdropFilter:'blur(20px)', fontSize:14, boxSizing:'border-box', boxShadow:'0 8px 32px rgba(195,25,25,0.18)' }}
                                    onFocus={e=>{e.target.style.borderColor='rgba(220,40,40,0.85)'}}
                                    onBlur={e=>{e.target.style.borderColor='rgba(195,25,25,0.45)'}}
                                />
                                <button type="submit" style={{ position:'absolute', right:5, top:5, height:36, padding:'0 18px', background:'rgba(195,25,25,0.92)', color:'#F5EEE6', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer' }}
                                    onMouseEnter={e=>{e.target.style.background='rgba(225,40,40,0.98)'}}
                                    onMouseLeave={e=>{e.target.style.background='rgba(195,25,25,0.92)'}}
                                >Search</button>
                            </form>
                            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                                {[{to:'/browse',label:'Browse Items',p:true},{to:'/sell/quick',label:'Sell Here',p:false},{to:'/community',label:'Community',p:false}].map(({to,label,p})=>(
                                    <Link key={to} to={to} style={{ padding:'9px 20px', background: p?'rgba(195,25,25,0.88)':'rgba(4,1,1,0.75)', border:`1px solid ${p?'rgba(220,40,40,0.5)':'rgba(195,25,25,0.42)'}`, color:'#F5EEE6', borderRadius:8, fontSize:13, fontWeight:600, textDecoration:'none', backdropFilter:'blur(12px)', boxShadow: p?'0 6px 22px rgba(195,25,25,0.25)':'none' }}
                                        onMouseEnter={e=>{e.currentTarget.style.background=p?'rgba(220,35,35,0.96)':'rgba(20,6,6,0.88)';e.currentTarget.style.borderColor='rgba(220,40,40,0.7)'}}
                                        onMouseLeave={e=>{e.currentTarget.style.background=p?'rgba(195,25,25,0.88)':'rgba(4,1,1,0.75)';e.currentTarget.style.borderColor=p?'rgba(220,40,40,0.5)':'rgba(195,25,25,0.42)'}}
                                    >{label}</Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── PRODUCT CARDS ── on the room floor */}
                <AnimatePresence>
                    {ready && listings.length > 0 && (
                        <motion.div
                            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5, duration:0.7 }}
                            style={{ position:'absolute', bottom:'4%', left:'50%', transform:'translateX(-50%)', display:'flex', gap:14, zIndex:10, flexWrap:'nowrap', justifyContent:'center' }}
                        >
                            {listings.slice(0,4).map((l,i) => <Card key={l._id} listing={l} i={i} />)}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Byline */}
                {ready && (
                    <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1, duration:1 }}
                        style={{ position:'absolute', bottom:16, left:22, margin:0, zIndex:10, color:'rgba(245,215,195,0.28)', fontSize:9, letterSpacing:'0.26em', textTransform:'uppercase', fontFamily:'Georgia,serif', pointerEvents:'none' }}
                    >
                        The owls are not what they seem
                    </motion.p>
                )}
            </div>
        </>
    )
}
