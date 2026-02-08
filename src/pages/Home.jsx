import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import ProductCard from '../components/common/ProductCard'
import SpiralBackground from '../components/common/SpiralBackground'
import { listingsAPI } from '../services/api'
import { categories } from '../data/mockData'
import './Home.css'

function Home() {
    const [searchQuery, setSearchQuery] = useState('')
    const [featuredListings, setFeaturedListings] = useState([])
    const [recentListings, setRecentListings] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const response = await listingsAPI.getAll({ sort: 'newest' })
                const listings = response.listings || []
                // Featured listings = verified ones or first few
                setFeaturedListings(listings.filter(l => l.aiVerified || l.featured).slice(0, 8))
                setRecentListings(listings.slice(0, 8))
            } catch (err) {
                console.error('Failed to fetch listings:', err)
                setFeaturedListings([])
                setRecentListings([])
            } finally {
                setLoading(false)
            }
        }
        fetchListings()
    }, [])

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            navigate(`/browse?search=${encodeURIComponent(searchQuery)}`)
        }
    }

    const stats = [
        { value: '50K+', label: 'Active Listings' },
        { value: '25K+', label: 'Happy Users' },
        { value: '₹10Cr+', label: 'Transactions' },
        { value: '4.9★', label: 'User Rating' },
    ]

    return (
        <div className="home">
            <SpiralBackground />

            {/* Hero Section - Buyers Legion Theme with Spiral Background */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

                <div className="relative z-10 container mx-auto px-4 text-center">
                    {/* Legion Shield Logo */}
                    <div className="mb-8 animate-float">
                        <img
                            src="/assets/legion_shield.png"
                            alt="Buyers Legion Shield"
                            className="w-32 h-32 mx-auto drop-shadow-[0_0_50px_rgba(255,215,0,0.5)]"
                        />
                    </div>

                    <div className="hero-badge animate-fadeIn mb-6 inline-block">
                        <span className="bg-black/40 backdrop-blur-md border border-[var(--legion-gold)]/30 text-[var(--legion-gold)] px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                            Join the Brotherhood
                        </span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-[var(--legion-gold)] to-white drop-shadow-2xl">
                        BUYERS<br />LEGION
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
                        The elite marketplace for the chosen few. <br />
                        <span className="text-[var(--legion-gold)] font-bold">Secure. Verified. Eternal.</span>
                    </p>

                    {/* Hero Search */}
                    <form className="max-w-2xl mx-auto mb-12 relative group" onSubmit={handleSearch}>
                        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--legion-gold)] to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative flex items-center bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 p-2 shadow-2xl">
                            <Search className="ml-4 text-gray-400" size={24} />
                            <input
                                type="text"
                                placeholder="Search the vault..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-none text-white px-4 py-3 focus:ring-0 placeholder-gray-500 text-lg"
                            />
                            <button type="submit" className="bg-[var(--legion-gold)] text-black font-bold px-8 py-3 rounded-xl hover:bg-white hover:scale-105 transition-all">
                                SEARCH
                            </button>
                        </div>
                    </form>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        {stats.map((stat, index) => (
                            <div key={index} className="bg-black/30 backdrop-blur-sm border border-white/5 p-4 rounded-xl">
                                <span className="block text-3xl font-bold text-white">{stat.value}</span>
                                <span className="text-xs text-[var(--legion-gold)] uppercase tracking-wider">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Floating Guruji Guardian - Absolute Position */}
                <div className="absolute bottom-0 right-0 z-20 pointer-events-none hidden lg:block opacity-90">
                    <img
                        src="/assets/guruji_main.png"
                        alt="Guardian Protector"
                        className="h-[600px] w-auto object-contain drop-shadow-[0_0_100px_rgba(0,0,0,0.8)] filter brightness-110 contrast-110"
                    />
                </div>
            </section>

            {/* How It Works */}
            <section className="section how-it-works">
                <div className="container">
                    <div className="section-header">
                        <h2>How SwapSafe Works</h2>
                        <p>Simple, secure, and transparent</p>
                    </div>

                    <div className="steps-grid">
                        <div className="step-card">
                            <div className="step-number">1</div>
                            <div className="step-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                            </div>
                            <h3>Find or List</h3>
                            <p>Browse thousands of items or list your own in minutes</p>
                        </div>

                        <div className="step-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </div>

                        <div className="step-card">
                            <div className="step-number">2</div>
                            <div className="step-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                    <line x1="1" y1="10" x2="23" y2="10" />
                                </svg>
                            </div>
                            <h3>Secure Payment</h3>
                            <p>Pay safely through our escrow system - money held until you're happy</p>
                        </div>

                        <div className="step-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </div>

                        <div className="step-card">
                            <div className="step-number">3</div>
                            <div className="step-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                            </div>
                            <h3>Meet or Deliver</h3>
                            <p>Schedule a safe meetup or opt for doorstep delivery</p>
                        </div>

                        <div className="step-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </div>

                        <div className="step-card">
                            <div className="step-number">4</div>
                            <div className="step-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9 12l2 2 4-4" />
                                </svg>
                            </div>
                            <h3>Confirm & Rate</h3>
                            <p>Confirm delivery and payment is released to seller</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="section categories-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Browse by Category</h2>
                        <Link to="/browse" className="btn btn-secondary">View All</Link>
                    </div>

                    <div className="categories-grid">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                to={`/browse/${category.slug}`}
                                className="category-card"
                            >
                                <div className="category-icon" style={{ background: category.gradient }}>
                                    <span>{category.icon}</span>
                                </div>
                                <h3>{category.name}</h3>
                                <p>{category.count} items</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Listings */}
            <section className="section featured-section">
                <div className="container">
                    <div className="section-header">
                        <div>
                            <h2>Featured Listings</h2>
                            <p>Hand-picked quality items from verified sellers</p>
                        </div>
                        <Link to="/browse?featured=true" className="btn btn-secondary">View All</Link>
                    </div>

                    <div className="listings-grid grid grid-4">
                        {featuredListings.map((listing) => (
                            <ProductCard key={listing._id || listing.id} product={listing} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Recent Listings */}
            <section className="section recent-section">
                <div className="container">
                    <div className="section-header">
                        <div>
                            <h2>Just Listed</h2>
                            <p>Fresh items added by our community</p>
                        </div>
                        <Link to="/browse?sort=newest" className="btn btn-secondary">View All</Link>
                    </div>

                    <div className="listings-grid grid grid-4">
                        {recentListings.map((listing) => (
                            <ProductCard key={listing._id || listing.id} product={listing} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Section - Guardian Theme */}
            <section className="section trust-section relative overflow-hidden">
                {/* Background Ornament - Trishul */}
                <div className="absolute top-0 right-[-10%] opacity-10 pointer-events-none rotate-12">
                    <img src="/assets/guardian_trishul.png" alt="Trishul" className="w-[800px] h-auto" />
                </div>

                <div className="container relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        {/* Left: Text Content */}
                        <div className="flex-1 space-y-8">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tighter">
                                    The Guardian <span className="text-[var(--legion-gold)]">Protector</span>
                                </h2>
                                <p className="text-xl text-gray-400 font-light border-l-4 border-[var(--legion-gold)] pl-6">
                                    "In the Legion, we do not just trade. We protect. Every transaction is watched over by the Guardian Protocol."
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors group">
                                    <h4 className="flex items-center gap-3 text-2xl font-bold text-white mb-2 group-hover:text-[var(--legion-gold)] transition-colors">
                                        <div className="bg-[var(--legion-gold)] h-2 w-2 rounded-full"></div>
                                        Escrow Shield
                                    </h4>
                                    <p className="text-gray-400 pl-5">Payments are held in the sacred vault. Funds are only released when you, the buyer, are satisfied.</p>
                                </div>

                                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors group">
                                    <h4 className="flex items-center gap-3 text-2xl font-bold text-white mb-2 group-hover:text-[var(--legion-gold)] transition-colors">
                                        <div className="bg-[var(--legion-gold)] h-2 w-2 rounded-full"></div>
                                        AI Oracle
                                    </h4>
                                    <p className="text-gray-400 pl-5">Our all-seeing AI analyzes every listing pixel-by-pixel to banish fakes and verify authenticity.</p>
                                </div>
                            </div>

                            <Link to="/shield" className="inline-flex items-center gap-2 text-[var(--legion-gold)] font-bold uppercase tracking-widest hover:gap-4 transition-all">
                                Read the Manifesto <span className="text-xl">→</span>
                            </Link>
                        </div>

                        {/* Right: Guardian Visual */}
                        <div className="flex-1 relative">
                            <div className="relative z-10 animate-float">
                                <img
                                    src="/assets/guruji_main.png"
                                    alt="Guardian of the Legion"
                                    className="w-full max-w-lg mx-auto drop-shadow-[0_0_60px_rgba(255,215,0,0.2)]"
                                />
                            </div>
                            {/* Glowing Aura */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--legion-gold)]/20 rounded-full blur-[100px] -z-10"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section cta-section">
                <div className="container">
                    <div className="cta-card">
                        <div className="cta-content">
                            <h2>Ready to Start Selling?</h2>
                            <p>Turn your unused items into cash. List for free and reach thousands of buyers.</p>
                            <div className="cta-buttons">
                                <Link to="/sell" className="btn btn-primary btn-lg">
                                    Start Selling
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </Link>
                                <Link to="/browse" className="btn btn-secondary btn-lg">
                                    Browse Items
                                </Link>
                            </div>
                        </div>
                        <div className="cta-decoration">
                            <div className="deco-circle deco-circle-1"></div>
                            <div className="deco-circle deco-circle-2"></div>
                            <div className="deco-circle deco-circle-3"></div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Home
