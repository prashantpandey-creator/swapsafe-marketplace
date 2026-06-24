import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Shield, ArrowRight, Lock, BarChart3, Package, ShoppingBag, Gamepad2, Car, Shirt } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { listingsAPI } from '../services/api';
import ProductCard from '../components/common/ProductCard';

const CATEGORIES = [
    { name: 'Electronics', icon: Package, count: '1,240', slug: 'electronics', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=80&h=80&fit=crop&q=80' },
    { name: 'Fashion', icon: Shirt, count: '2,310', slug: 'fashion', img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=80&h=80&fit=crop&q=80' },
    { name: 'Gaming', icon: Gamepad2, count: '530', slug: 'gaming', img: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=80&h=80&fit=crop&q=80' },
    { name: 'Vehicles', icon: Car, count: '850', slug: 'vehicles', img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=80&h=80&fit=crop&q=80' },
];

const HERO_CARDS = [
    { title: 'Nike Air Max 90', price: '₹12,500', img: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&h=300&fit=crop&q=80' },
    { title: 'G-Shock DW-5600', price: '₹7,200', img: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=300&h=300&fit=crop&q=80' },
    { title: 'Sony WH-1000XM4', price: '₹18,000', img: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop&q=80' },
    { title: 'Minimalist Watch', price: '₹5,400', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop&q=80' },
];

export default function Landing() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLynch, setIsLynch] = useState(() => document.body.classList.contains('theme-lynch'));

    useEffect(() => {
        const obs = new MutationObserver(() => setIsLynch(document.body.classList.contains('theme-lynch')));
        obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        setIsLynch(document.body.classList.contains('theme-lynch'));
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        listingsAPI.getAll({ limit: 8 })
            .then(d => setProducts(d?.listings || (Array.isArray(d) ? d : [])))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, []);

    const handleSearch = (e) => {
        e?.preventDefault?.();
        if (searchTerm.trim()) navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
        else navigate('/browse');
    };

    if (isLynch) {
        return (
            <div className="min-h-screen overflow-x-hidden">
                <section className="relative min-h-[90vh] flex items-center justify-center pt-20" style={{ borderBottom: '1px solid rgba(195,25,25,0.3)' }}>
                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[var(--m-surface)] border border-[var(--m-hairline)] mb-8 backdrop-blur-sm">
                                <Shield className="w-4 h-4 text-legion-gold" />
                                <span className="text-[var(--m-fg-muted)] text-sm font-medium">Every item verified. Every transaction protected.</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
                                BUY & SELL <br />
                                <span className="text-legion-gold" style={{ textShadow: '0 0 40px rgba(195,25,25,0.4)' }}>VERIFIED GEAR</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-[var(--m-fg-muted)] max-w-2xl mx-auto mb-10 font-light">
                                The safest marketplace for second-hand electronics, fashion, and collectibles.
                            </p>
                            <div className="max-w-2xl mx-auto relative mb-12" style={{ boxShadow: '0 4px 40px rgba(195,25,25,0.15)' }}>
                                <input type="text" placeholder="Search for iPhone 15, Jordan 1s, PS5..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch(e)}
                                    className="w-full h-14 pl-6 pr-32 rounded-[10px] bg-[var(--m-surface)] border border-[var(--m-hairline)] text-white placeholder-[var(--m-fg-subtle)] focus:outline-none focus:border-legion-gold/50 transition-all backdrop-blur-md" />
                                <button onClick={handleSearch} className="absolute right-1 top-1 h-12 px-8 bg-legion-gold text-black font-bold rounded-[10px] hover:brightness-110 transition-all flex items-center gap-2">
                                    <Search className="w-5 h-5" /> Search
                                </button>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4 mb-16">
                                <Link to="/browse" className="px-8 py-4 bg-legion-gold text-black font-bold rounded-[10px] hover:brightness-110 transition-all flex items-center gap-2">
                                    Start Shopping <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link to="/sell" className="px-8 py-4 bg-[var(--m-surface)] border border-[var(--m-hairline)] text-white font-bold rounded-[10px] hover:bg-[var(--m-surface-strong)] transition-all">
                                    Sell Your Items
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>
                <section className="py-12 bg-black/20">
                    <div className="container mx-auto px-4">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'serif', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(235,215,200,0.9)' }}>Suggested For You</h2>
                                <p className="text-[var(--m-fg-muted)] text-sm">Hand-picked gear from top sellers</p>
                            </div>
                            <Link to="/browse" className="text-legion-gold hover:text-white transition-colors text-sm font-medium">View More</Link>
                        </div>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[1,2,3,4].map(i => <div key={i} className="bg-[var(--m-surface)] rounded-[12px] h-[350px] animate-pulse" />)}
                            </div>
                        ) : (
                            <div style={{ perspective: '1200px', perspectiveOrigin: '50% 0%' }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" style={{ transform: 'rotateX(8deg) translateZ(-40px)', transformStyle: 'preserve-3d' }}>
                                    {products.length > 0 ? products.slice(0,4).map((p, i) => {
                                        const depths = [{ transform:'translateZ(20px) rotateY(3deg)' },{ transform:'translateZ(10px)' },{ transform:'translateZ(10px)' },{ transform:'translateZ(20px) rotateY(-3deg)' }];
                                        return <div key={p._id||p.id} style={depths[i]||{}}><ProductCard product={p} /></div>;
                                    }) : <p className="text-[var(--m-fg-muted)] col-span-full text-center py-10">No listings yet.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        );
    }

    // ─── CLASSIC LIGHT THEME ─── editorial, dense, conversion-optimized
    return (
        <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>

            {/* ── SEARCH BAR ── */}
            <div style={{ borderBottom: '0.5px solid var(--m-hairline)', background: 'var(--bg-card)', padding: '14px 0' }}>
                <div className="container mx-auto px-4 flex items-center gap-3">
                    <form onSubmit={handleSearch} className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--m-fg-subtle)' }} />
                        <input
                            type="text"
                            placeholder="Search 12,500+ verified listings..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', height: 38, padding: '0 16px 0 34px',
                                border: '0.5px solid var(--m-hairline)', borderRadius: 8,
                                background: 'var(--bg-primary)', fontSize: 13,
                                color: 'var(--m-fg)', outline: 'none',
                            }}
                        />
                    </form>
                    <div className="flex gap-1 overflow-x-auto">
                        {['All', 'Electronics', 'Fashion', 'Gaming', 'Vehicles'].map((c, i) => (
                            <button key={c} onClick={() => c === 'All' ? navigate('/browse') : navigate(`/browse/${c.toLowerCase()}`)}
                                style={{
                                    fontSize: 11, padding: '5px 11px', borderRadius: 6, whiteSpace: 'nowrap',
                                    fontWeight: i === 0 ? 500 : 400, cursor: 'pointer',
                                    background: i === 0 ? 'rgba(158,124,12,0.08)' : 'var(--m-surface)',
                                    color: i === 0 ? 'var(--m-accent)' : 'var(--m-fg-muted)',
                                    border: i === 0 ? '0.5px solid rgba(158,124,12,0.18)' : '0.5px solid transparent',
                                }}
                            >{c}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── HERO SPLIT — text left, products right ── */}
            <div style={{ borderBottom: '0.5px solid var(--m-hairline)', display: 'grid', gridTemplateColumns: '1fr 1fr' }} className="md:grid hidden">
                <div style={{ padding: '28px 32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <h1 style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.22, letterSpacing: '-0.03em', color: 'var(--m-fg)', marginBottom: 10 }}>
                            The safest way to buy & sell verified gear
                        </h1>
                        <p style={{ fontSize: 14, color: 'var(--m-fg-muted)', lineHeight: 1.55, marginBottom: 20 }}>
                            Every listing is AI-verified. Every transaction is escrow-protected. Zero-fraud guarantee or your money back.
                        </p>
                        <div className="flex gap-2 mb-6">
                            <Link to="/browse" style={{ background: 'var(--m-fg)', color: 'var(--bg-card)', fontSize: 12, fontWeight: 500, padding: '9px 20px', borderRadius: 7, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                Start shopping <ArrowRight size={14} />
                            </Link>
                            <Link to="/sell" style={{ background: 'transparent', color: 'var(--m-fg-muted)', fontSize: 12, padding: '9px 20px', borderRadius: 7, border: '0.5px solid var(--m-hairline)', textDecoration: 'none' }}>
                                List an item
                            </Link>
                        </div>
                        <div className="flex gap-6" style={{ paddingTop: 18, borderTop: '0.5px solid var(--m-hairline)' }}>
                            {[
                                { val: '12.5K', label: 'Verified sellers' },
                                { val: '₹2.3 Cr+', label: 'Protected value' },
                                { val: '99.8%', label: 'Match rate' },
                                { val: '0', label: 'Fraud cases' },
                            ].map(s => (
                                <div key={s.label}>
                                    <strong style={{ fontSize: 17, fontWeight: 500, color: 'var(--m-fg)', display: 'block' }}>{s.val}</strong>
                                    <span style={{ fontSize: 10, color: 'var(--m-fg-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--m-hairline)' }}>
                    {HERO_CARDS.map(c => (
                        <Link to="/browse" key={c.title} style={{ background: 'var(--bg-card)', padding: 12, display: 'flex', flexDirection: 'column', textDecoration: 'none', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-primary)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                        >
                            <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 6, overflow: 'hidden', background: 'var(--bg-secondary)', marginBottom: 8 }}>
                                <img src={c.img} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: 'var(--m-fg-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>{c.title}</span>
                                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--m-fg)' }}>{c.price}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Mobile hero — stacked */}
            <div className="md:hidden px-4 py-8">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.22, letterSpacing: '-0.02em', color: 'var(--m-fg)', marginBottom: 8 }}>
                        The safest way to buy & sell verified gear
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--m-fg-muted)', lineHeight: 1.5, marginBottom: 16 }}>
                        AI-verified listings. Escrow-protected transactions. Zero-fraud guarantee.
                    </p>
                    <div className="flex gap-2 mb-4">
                        <Link to="/browse" style={{ background: 'var(--m-fg)', color: 'var(--bg-card)', fontSize: 12, fontWeight: 500, padding: '10px 20px', borderRadius: 7, textDecoration: 'none', flex: 1, textAlign: 'center' }}>
                            Start shopping
                        </Link>
                        <Link to="/sell" style={{ background: 'transparent', color: 'var(--m-fg-muted)', fontSize: 12, padding: '10px 20px', borderRadius: 7, border: '0.5px solid var(--m-hairline)', textDecoration: 'none', flex: 1, textAlign: 'center' }}>
                            List an item
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* ── TRENDING — product grid ── */}
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center" style={{ padding: '24px 0 14px' }}>
                    <h2 style={{ fontSize: 13, fontWeight: 500, color: 'var(--m-fg)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Trending now</h2>
                    <Link to="/browse" style={{ fontSize: 11, color: 'var(--m-fg-subtle)', textDecoration: 'none' }}>
                        See all listings <ArrowRight size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    </Link>
                </div>
            </div>
            <div className="container mx-auto px-4 pb-6">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ borderRadius: 10, overflow: 'hidden', border: '0.5px solid var(--m-hairline)' }}>
                        {[1,2,3,4].map(i => <div key={i} style={{ background: 'var(--bg-card)', aspectRatio: '1', padding: 12 }}><div style={{ background: 'var(--bg-secondary)', borderRadius: 6, width: '100%', height: '60%' }} className="animate-pulse" /></div>)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {products.length > 0 ? products.slice(0, 8).map(p => (
                            <ProductCard key={p._id || p.id} product={p} />
                        )) : (
                            <p style={{ color: 'var(--m-fg-muted)', gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>No listings available yet.</p>
                        )}
                    </div>
                )}
            </div>

            {/* ── CATEGORIES — pill row ── */}
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center" style={{ padding: '8px 0 14px' }}>
                    <h2 style={{ fontSize: 13, fontWeight: 500, color: 'var(--m-fg)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Categories</h2>
                    <Link to="/browse" style={{ fontSize: 11, color: 'var(--m-fg-subtle)', textDecoration: 'none' }}>
                        Browse all <ArrowRight size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pb-6">
                    {CATEGORIES.map(cat => (
                        <Link to={`/browse/${cat.slug}`} key={cat.slug}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                                background: 'var(--bg-card)', borderRadius: 10,
                                border: '0.5px solid var(--m-hairline)', textDecoration: 'none',
                                transition: 'border-color 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.14)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--m-hairline)'}
                        >
                            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                                <img src={cat.img} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div>
                                <strong style={{ fontSize: 12, fontWeight: 500, display: 'block', color: 'var(--m-fg)' }}>{cat.name}</strong>
                                <span style={{ fontSize: 10, color: 'var(--m-fg-subtle)' }}>{cat.count} items</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── TRUST BAR ── */}
            <div style={{ borderTop: '0.5px solid var(--m-hairline)', borderBottom: '0.5px solid var(--m-hairline)', background: 'var(--bg-card)' }}>
                <div className="container mx-auto grid grid-cols-1 md:grid-cols-3" style={{ gap: 0 }}>
                    {[
                        { Icon: Shield, color: 'var(--m-accent)', bg: 'rgba(158,124,12,0.06)', title: 'AI-verified listings', desc: 'Every photo checked for authenticity' },
                        { Icon: Lock, color: '#1B7340', bg: '#EDFAF2', title: 'Escrow protection', desc: 'Funds released only after you confirm' },
                        { Icon: BarChart3, color: '#1B5A73', bg: '#EDF4FA', title: 'Trust score', desc: 'AI fraud detection on every deal' },
                    ].map(({ Icon, color, bg, title, desc }, i) => (
                        <div key={title} style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14, borderRight: i < 2 ? '0.5px solid var(--m-hairline)' : 'none' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color, flexShrink: 0 }}>
                                <Icon size={16} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: 12, fontWeight: 500, color: 'var(--m-fg)', margin: 0 }}>{title}</h4>
                                <p style={{ fontSize: 10, color: 'var(--m-fg-subtle)', margin: '2px 0 0' }}>{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
