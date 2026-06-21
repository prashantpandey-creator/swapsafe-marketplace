import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import logoV2 from '../assets/buyers_legion_logo_v2.png'
import './Auth.css'

function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!email) {
            setError('Please enter your email address')
            return
        }
        setSubmitted(true)
    }

    return (
        <div className="auth-page">
            <motion.div
                className="auth-container"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <div className="auth-card">
                    <div className="auth-header">
                        <Link to="/" className="auth-logo-link">
                            <img src={logoV2} alt="Buyers Legion" className="auth-logo-img" />
                            <div className="auth-logo-text">
                                <span className="auth-logo-top">BUYERS</span>
                                <span className="auth-logo-bottom">LEGION</span>
                            </div>
                        </Link>
                        <h1 className="auth-title">Reset password</h1>
                        <p className="auth-subtitle">
                            {submitted
                                ? 'Check your inbox'
                                : 'Enter your email and we\'ll send you a reset link'
                            }
                        </p>
                    </div>

                    {submitted ? (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
                            <p style={{ color: 'var(--m-fg-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                If an account exists for <strong style={{ color: 'var(--m-fg)' }}>{email}</strong>,
                                you'll receive a password reset link shortly.
                            </p>
                        </div>
                    ) : (
                        <form className="auth-form" onSubmit={handleSubmit} noValidate>
                            {error && (
                                <motion.div
                                    className="auth-error"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                >
                                    {error}
                                </motion.div>
                            )}

                            <div className="auth-field">
                                <label className="auth-label">Email address</label>
                                <input
                                    type="email"
                                    className="auth-input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                                    autoComplete="email"
                                    autoFocus
                                />
                            </div>

                            <button type="submit" className="auth-btn-primary">
                                <Mail size={16} />
                                Send Reset Link
                            </button>
                        </form>
                    )}

                    <p className="auth-footer-text" style={{ marginTop: '1.5rem' }}>
                        <Link to="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ArrowLeft size={14} /> Back to sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}

export default ForgotPassword
