import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
    const currentYear = new Date().getFullYear()

    const categories = [
        { name: 'Electronics', path: '/browse/electronics' },
        { name: 'Furniture', path: '/browse/furniture' },
        { name: 'Clothing', path: '/browse/clothing' },
        { name: 'Vehicles', path: '/browse/vehicles' },
        { name: 'Books', path: '/browse/books' },
        { name: 'Sports', path: '/browse/sports' },
    ]

    const companyLinks = [
        { name: 'About Us', path: '/about' },
        { name: 'How it Works', path: '/how-it-works' },
        { name: 'Trust & Safety', path: '/safety' },
        { name: 'Careers', path: '/careers' },
        { name: 'Press', path: '/press' },
    ]

    const supportLinks = [
        { name: 'Help Center', path: '/help' },
        { name: 'Contact Us', path: '/contact' },
        { name: 'FAQs', path: '/faqs' },
        { name: 'Shipping Info', path: '/shipping' },
        { name: 'Returns', path: '/returns' },
    ]

    const legalLinks = [
        { name: 'Terms of Service', path: '/terms' },
        { name: 'Privacy Policy', path: '/privacy' },
        { name: 'Cookie Policy', path: '/cookies' },
    ]

    return (
        <footer className="footer">
            <div className="footer-container">
                {/* Main Footer Grid */}
                <div className="footer-grid">
                    {/* Brand Section */}
                    <div className="footer-brand">
                        <Link to="/" className="footer-logo">
                            <div className="logo-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                    <path d="M2 17l10 5 10-5" />
                                    <path d="M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="logo-text">SwapSafe</span>
                        </Link>
                        <p className="footer-tagline">
                            Buy and sell used items safely with escrow protection, verified sellers, and secure meetups.
                        </p>

                        {/* Social Links */}
                        <div className="footer-social">
                            <a href="#" className="social-link" aria-label="Facebook">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                                </svg>
                            </a>
                            <a href="#" className="social-link" aria-label="Twitter">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                                </svg>
                            </a>
                            <a href="#" className="social-link" aria-label="Instagram">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                </svg>
                            </a>
                            <a href="#" className="social-link" aria-label="LinkedIn">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                                    <rect x="2" y="9" width="4" height="12" />
                                    <circle cx="4" cy="4" r="2" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="footer-section">
                        <h4 className="footer-title">Categories</h4>
                        <ul className="footer-links">
                            {categories.map(link => (
                                <li key={link.name}>
                                    <Link to={link.path}>{link.name}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div className="footer-section">
                        <h4 className="footer-title">Company</h4>
                        <ul className="footer-links">
                            {companyLinks.map(link => (
                                <li key={link.name}>
                                    <Link to={link.path}>{link.name}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="footer-section">
                        <h4 className="footer-title">Support</h4>
                        <ul className="footer-links">
                            {supportLinks.map(link => (
                                <li key={link.name}>
                                    <Link to={link.path}>{link.name}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="footer-section footer-newsletter">
                        <h4 className="footer-title">Stay Updated</h4>
                        <p className="newsletter-text">
                            Get the latest deals and marketplace tips.
                        </p>
                        <form className="newsletter-form">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="newsletter-input"
                            />
                            <button type="submit" className="btn btn-primary">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="footer-trust">
                    <div className="trust-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M9 12l2 2 4-4" />
                        </svg>
                        <span>Secure Escrow</span>
                    </div>
                    <div className="trust-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9 12l2 2 4-4" />
                        </svg>
                        <span>Verified Sellers</span>
                    </div>
                    <div className="trust-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        <span>Safe Payments</span>
                    </div>
                    <div className="trust-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>Safe Meetups</span>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="footer-bottom">
                    <p className="copyright">
                        © {currentYear} SwapSafe. All rights reserved.
                    </p>
                    <div className="footer-legal">
                        {legalLinks.map((link, index) => (
                            <span key={link.name}>
                                <Link to={link.path}>{link.name}</Link>
                                {index < legalLinks.length - 1 && <span className="divider">•</span>}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
