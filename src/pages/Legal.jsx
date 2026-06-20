import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

function Legal() {
    const { pathname } = useLocation()
    const isTerms = pathname === '/terms'

    return (
        <div style={{ minHeight: '100vh', padding: '6rem 1rem 4rem' }}>
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ maxWidth: 720, margin: '0 auto' }}
            >
                <Link
                    to="/register"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', textDecoration: 'none', marginBottom: '2rem', fontSize: '0.9rem' }}
                >
                    <ArrowLeft size={14} /> Back to registration
                </Link>

                <div style={{
                    background: 'rgba(8,8,16,0.7)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16,
                    padding: '2.5rem',
                    backdropFilter: 'blur(16px)',
                }}>
                    <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        {isTerms ? 'Terms of Service' : 'Privacy Policy'}
                    </h1>
                    <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '2rem' }}>
                        Last updated: June 2026
                    </p>

                    {isTerms ? (
                        <div style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '0.9rem' }}>
                            <h2 style={{ color: '#e2e8f0', fontSize: '1.1rem', margin: '1.5rem 0 0.75rem' }}>1. Acceptance</h2>
                            <p>By creating an account on Buyers Legion (SwapSafe), you agree to these terms. If you do not agree, do not use the platform.</p>

                            <h2 style={{ color: '#e2e8f0', fontSize: '1.1rem', margin: '1.5rem 0 0.75rem' }}>2. Accounts</h2>
                            <p>You must provide accurate information when registering. You are responsible for maintaining the security of your account. Guest accounts expire after 7 days.</p>

                            <h2 style={{ color: '#e2e8f0', fontSize: '1.1rem', margin: '1.5rem 0 0.75rem' }}>3. Listings & Transactions</h2>
                            <p>Sellers are responsible for the accuracy of their listings. Buyers Legion provides the platform but is not a party to transactions between users. All sales are between the buyer and seller.</p>

                            <h2 style={{ color: '#e2e8f0', fontSize: '1.1rem', margin: '1.5rem 0 0.75rem' }}>4. Prohibited Items</h2>
                            <p>You may not list stolen goods, counterfeit items, weapons, drugs, or any items prohibited by applicable law.</p>

                            <h2 style={{ color: '#e2e8f0', fontSize: '1.1rem', margin: '1.5rem 0 0.75rem' }}>5. Trust & Safety</h2>
                            <p>The Legion Shield system monitors listing quality and user behavior. Accounts that violate these terms may be suspended or banned.</p>

                            <h2 style={{ color: '#e2e8f0', fontSize: '1.1rem', margin: '1.5rem 0 0.75rem' }}>6. Limitation of Liability</h2>
                            <p>The platform is provided "as is." We are not responsible for losses arising from transactions between users, service downtime, or inaccuracies in AI-generated content (price estimates, item verification).</p>
                        </div>
                    ) : (
                        <div style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '0.9rem' }}>
                            <h2 style={{ color: '#e2e8f0', fontSize: '1.1rem', margin: '1.5rem 0 0.75rem' }}>1. Data We Collect</h2>
                            <p>We collect your name, email, phone (optional), and listing data. Images uploaded for listings are stored on Cloudinary. We do not sell your personal data.</p>

                            <h2 style={{ color: '#e2e8f0', fontSize: '1.1rem', margin: '1.5rem 0 0.75rem' }}>2. How We Use Your Data</h2>
                            <p>Your data is used to operate the marketplace: authenticate your account, display your listings, enable buyer-seller communication, and power AI features (price estimation, image analysis).</p>

                            <h2 style={{ color: '#e2e8f0', fontSize: '1.1rem', margin: '1.5rem 0 0.75rem' }}>3. AI Processing</h2>
                            <p>Product images may be processed by AI services (Gemini Vision, Groq) for item identification, price estimation, and background removal. These services receive the image data but do not retain it beyond processing.</p>

                            <h2 style={{ color: '#e2e8f0', fontSize: '1.1rem', margin: '1.5rem 0 0.75rem' }}>4. Cookies & Storage</h2>
                            <p>We use localStorage to persist your login session (JWT token) and theme preference. No third-party tracking cookies are used.</p>

                            <h2 style={{ color: '#e2e8f0', fontSize: '1.1rem', margin: '1.5rem 0 0.75rem' }}>5. Data Retention</h2>
                            <p>Account data is retained while your account is active. Guest accounts and their data are automatically purged after 7 days. You may request account deletion via Settings.</p>

                            <h2 style={{ color: '#e2e8f0', fontSize: '1.1rem', margin: '1.5rem 0 0.75rem' }}>6. Contact</h2>
                            <p>For privacy questions, contact the project maintainer through the GitHub repository.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

export default Legal
