import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProductCard from '../components/common/ProductCard'
import { mockListings, categories } from '../data/mockData'
import './Home.css'

function Home() {
    const [searchQuery, setSearchQuery] = useState('')
    const [featuredListings, setFeaturedListings] = useState([])
    const [recentListings, setRecentListings] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        // Simulate fetching data
        setFeaturedListings(mockListings.filter(l => l.featured).slice(0, 8))
        setRecentListings(mockListings.slice(0, 8))
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
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-gradient"></div>
                    <div className="hero-particles">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="particle" style={{
                                '--delay': `${Math.random() * 5}s`,
                                '--x': `${Math.random() * 100}%`,
                                '--y': `${Math.random() * 100}%`,
                                '--size': `${Math.random() * 4 + 2}px`
                            }}></div>
                        ))}
                    </div>
                </div>

                <div className="hero-content container">
                    <div className="hero-badge animate-fadeIn">
                        <span className="badge badge-primary">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            Secure Escrow Protection
                        </span>
                    </div>

                    <h1 className="hero-title">
                        Buy & Sell Used Items
                        <span className="text-gradient"> Safely</span>
                    </h1>

                    <p className="hero-subtitle">
                        India's most trusted marketplace for pre-owned items.
                        Secure payments, verified sellers, and safe meetups.
                    </p>

                    {/* Hero Search */}
                    <form className="hero-search" onSubmit={handleSearch}>
                        <div className="search-wrapper">
                            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search for electronics, furniture, vehicles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                            <button type="submit" className="btn btn-primary btn-lg">
                                Search
                            </button>
                        </div>
                        <div className="search-tags">
                            <span>Popular:</span>
                            <Link to="/browse?search=iphone" className="tag">iPhone</Link>
                            <Link to="/browse?search=laptop" className="tag">Laptop</Link>
                            <Link to="/browse?search=furniture" className="tag">Furniture</Link>
                            <Link to="/browse?search=bike" className="tag">Bike</Link>
                        </div>
                    </form>

                    {/* Stats */}
                    <div className="hero-stats">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-item">
                                <span className="stat-value">{stat.value}</span>
                                <span className="stat-label">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Floating Elements */}
                <div className="hero-floating">
                    <div className="floating-card floating-card-1 animate-float">
                        <div className="floating-icon">💰</div>
                        <span>Secure Payments</span>
                    </div>
                    <div className="floating-card floating-card-2 animate-float" style={{ animationDelay: '1s' }}>
                        <div className="floating-icon">🤝</div>
                        <span>Safe Meetups</span>
                    </div>
                    <div className="floating-card floating-card-3 animate-float" style={{ animationDelay: '2s' }}>
                        <div className="floating-icon">✅</div>
                        <span>Verified Items</span>
                    </div>
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
                            <ProductCard key={listing.id} product={listing} />
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
                            <ProductCard key={listing.id} product={listing} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="section trust-section">
                <div className="container">
                    <div className="trust-content">
                        <div className="trust-text">
                            <h2>Why Choose SwapSafe?</h2>
                            <p>We've built the most trusted platform for buying and selling used items</p>

                            <div className="trust-features">
                                <div className="trust-feature">
                                    <div className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4>Escrow Protection</h4>
                                        <p>Your payment is held securely until you confirm the item is as described</p>
                                    </div>
                                </div>

                                <div className="trust-feature">
                                    <div className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4>AI Verification</h4>
                                        <p>Our AI detects fake listings and verifies product authenticity</p>
                                    </div>
                                </div>

                                <div className="trust-feature">
                                    <div className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4>Safe Meetup Zones</h4>
                                        <p>Pre-approved public locations for in-person exchanges</p>
                                    </div>
                                </div>

                                <div className="trust-feature">
                                    <div className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="1" y="3" width="15" height="13" />
                                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                            <circle cx="5.5" cy="18.5" r="2.5" />
                                            <circle cx="18.5" cy="18.5" r="2.5" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4>Doorstep Delivery</h4>
                                        <p>Opt for shipping with tracking and insurance options</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="trust-visual">
                            <div className="visual-card">
                                <div className="visual-header">
                                    <span className="pulse-dot"></span>
                                    <span>Transaction Protected</span>
                                </div>
                                <div className="visual-body">
                                    <div className="visual-row">
                                        <span>Buyer Payment</span>
                                        <span className="badge badge-success">Received</span>
                                    </div>
                                    <div className="visual-row">
                                        <span>Escrow Status</span>
                                        <span className="badge badge-warning">Holding</span>
                                    </div>
                                    <div className="visual-row">
                                        <span>Item Delivered</span>
                                        <span className="badge badge-info">Pending</span>
                                    </div>
                                </div>
                                <div className="visual-footer">
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: '66%' }}></div>
                                    </div>
                                    <span>2 of 3 steps complete</span>
                                </div>
                            </div>
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
