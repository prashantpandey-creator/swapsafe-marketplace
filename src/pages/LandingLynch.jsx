import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { listingsAPI } from '../services/api'

const MODEL_ID = '46430c73087e4951a6bdf2f4bd3305f4'
const SKETCHFAB_API = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js'

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

function loadSketchfabScript() {
    return new Promise((resolve, reject) => {
        if (window.Sketchfab) return resolve(window.Sketchfab)
        const existing = document.querySelector(`script[src="${SKETCHFAB_API}"]`)
        if (existing) {
            existing.addEventListener('load', () => resolve(window.Sketchfab))
            existing.addEventListener('error', reject)
            return
        }
        const s = document.createElement('script')
        s.src = SKETCHFAB_API
        s.async = true
        s.onload = () => resolve(window.Sketchfab)
        s.onerror = reject
        document.head.appendChild(s)
    })
}

export default function LandingLynch() {
    const [listings, setListings] = useState([])
    const [ready, setReady] = useState(false)
    const [query, setQuery] = useState('')
    const navigate = useNavigate()
    const iframeRef = useRef(null)
    const apiRef = useRef(null)

    useEffect(() => {
        listingsAPI.getAll({ limit:4 })
            .then(d => setListings(Array.isArray(d) ? d : (d?.listings??[])))
            .catch(() => setListings([]))
    }, [])

    // Boot the Sketchfab viewer with a LOCKED camera + real "loaded" event
    useEffect(() => {
        let cancelled = false
        loadSketchfabScript().then((Sketchfab) => {
            if (cancelled || !iframeRef.current) return
            const client = new Sketchfab('1.12.1', iframeRef.current)
            client.init(MODEL_ID, {
                autostart: 1,
                preload: 1,
                ui_stop: 0, ui_inspector: 0, ui_watermark: 0, ui_watermark_link: 0,
                ui_ar: 0, ui_help: 0, ui_settings: 0, ui_vr: 0, ui_fullscreen: 0,
                ui_annotations: 0, ui_controls: 0, ui_hint: 0, ui_loading: 0,
                ui_infos: 0, scrollwheel: 0, double_click: 0, dnt: 1,
                success: (api) => {
                    apiRef.current = api
                    api.start()
                    api.addEventListener('viewerready', () => {
                        // FREEZE the camera — no zoom, no pan, no flying into the curtains
                        try { api.setEnableCameraConstraints(true, () => {}) } catch (_) {}
                        try {
                            api.setCameraConstraints({
                                usePanConstraints: true,
                                useZoomConstraints: true,
                                useYawConstraints: true,
                                usePitchConstraints: true,
                                zoomIn: 0, zoomOut: 0,
                                left: 0, right: 0, up: 0, down: 0,
                            }, () => {})
                        } catch (_) {}
                        // Belt-and-suspenders: kill orbit interaction outright
                        try { api.setUserInteraction?.(false) } catch (_) {}
                        if (!cancelled) setReady(true)
                    })
                },
                error: () => { if (!cancelled) setReady(true) },
            })
        }).catch(() => { if (!cancelled) setReady(true) })
        return () => { cancelled = true }
    }, [])

    const handleSearch = e => {
        e.preventDefault()
        navigate(query.trim() ? `/browse?q=${encodeURIComponent(query.trim())}` : '/browse')
    }

    return (
        <>
            <style>{`
                @keyframes lGlow { 0%,100%{text-shadow:0 0 22px rgba(195,25,25,.5),0 0 60px rgba(195,25,25,.22)} 50%{text-shadow:0 0 36px rgba(225,45,45,.75),0 0 90px rgba(195,25,25,.38)} }
                @keyframes lEnter { from{opacity:0;letter-spacing:0.6em} to{opacity:1;letter-spacing:0.36em} }
                @keyframes lFlicker { 0%,100%{opacity:.85} 8%{opacity:.4} 10%{opacity:.9} 40%{opacity:.7} 42%{opacity:1} }
                @keyframes lShimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(220%)} }
                @keyframes lFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
            `}</style>

            {/* Solid backdrop so the OLD canvas curtains never bleed through during load */}
            <div style={{ position:'fixed', inset:0, background:'#0a0204', zIndex:0, pointerEvents:'none' }} />

            <div style={{ position:'relative', height:'calc(100vh - 80px)', overflow:'hidden', background:'#0a0204' }}>

                {/* ── THE REAL 3D ROOM (Viewer API, camera locked) ── */}
                <iframe
                    ref={iframeRef}
                    title="Twin Peaks Red Room"
                    allow="autoplay; fullscreen; xr-spatial-tracking"
                    allowFullScreen
                    style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none', opacity: ready ? 1 : 0, transition:'opacity 1.6s ease', pointerEvents:'none' }}
                />

                {/* Loading screen — a curtain that parts to reveal the Lodge */}
                <AnimatePresence>
                    {!ready && (
                        <motion.div exit={{ opacity:0 }} transition={{ duration:1 }}
                            style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:20, overflow:'hidden' }}
                        >
                            {/* Velvet curtain halves */}
                            <motion.div exit={{ x:'-100%' }} transition={{ duration:1.1, ease:[0.7,0,0.3,1] }}
                                style={{ position:'absolute', top:0, left:0, bottom:0, width:'50%', background:'linear-gradient(90deg, #2a0606 0%, #5e0d0d 45%, #7a1414 100%)', boxShadow:'inset -40px 0 80px rgba(0,0,0,0.6)' }} />
                            <motion.div exit={{ x:'100%' }} transition={{ duration:1.1, ease:[0.7,0,0.3,1] }}
                                style={{ position:'absolute', top:0, right:0, bottom:0, width:'50%', background:'linear-gradient(270deg, #2a0606 0%, #5e0d0d 45%, #7a1414 100%)', boxShadow:'inset 40px 0 80px rgba(0,0,0,0.6)' }} />

                            {/* Center plate */}
                            <div style={{ position:'relative', zIndex:2, textAlign:'center', animation:'lFloat 4s ease-in-out infinite' }}>
                                <p style={{ fontFamily:'Georgia,serif', letterSpacing:'0.5em', color:'rgba(245,225,205,0.85)', fontSize:10, textTransform:'uppercase', margin:'0 0 14px', animation:'lFlicker 3s infinite' }}>
                                    Welcome
                                </p>
                                <h2 style={{ fontFamily:'Georgia,serif', fontWeight:700, fontSize:'clamp(28px,5vw,52px)', color:'#F5EEE6', margin:'0 0 18px', letterSpacing:'0.04em', textShadow:'0 0 30px rgba(195,25,25,0.6)' }}>
                                    The Black Lodge
                                </h2>
                                {/* Progress shimmer bar */}
                                <div style={{ width:200, height:2, margin:'0 auto', background:'rgba(195,25,25,0.25)', borderRadius:2, overflow:'hidden', position:'relative' }}>
                                    <div style={{ position:'absolute', top:0, left:0, height:'100%', width:'45%', background:'linear-gradient(90deg, transparent, #C9A84C, transparent)', animation:'lShimmer 1.4s ease-in-out infinite' }} />
                                </div>
                                <p style={{ fontFamily:'Georgia,serif', letterSpacing:'0.3em', color:'rgba(245,225,205,0.5)', fontSize:9, textTransform:'uppercase', margin:'16px 0 0' }}>
                                    Drawing back the curtains
                                </p>
                            </div>
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
