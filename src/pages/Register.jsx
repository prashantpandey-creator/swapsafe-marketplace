import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, UserPlus, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import GoogleSignInButton from '../components/common/GoogleSignInButton'
import logoV2 from '../assets/buyers_legion_logo_v2.png'
import './Auth.css'

function Register() {
    const navigate = useNavigate()
    const { register, isLoading } = useAuth()

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    })
    const [formError, setFormError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [acceptTerms, setAcceptTerms] = useState(false)

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
        if (formError) setFormError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setFormError('')

        if (!formData.name || !formData.email || !formData.password) {
            setFormError('Please fill in all required fields')
            return
        }
        if (formData.password.length < 8) {
            setFormError('Password must be at least 8 characters')
            return
        }
        if (formData.password !== formData.confirmPassword) {
            setFormError('Passwords do not match')
            return
        }
        if (!acceptTerms) {
            setFormError('Please accept the terms and conditions')
            return
        }

        const result = await register(formData)
        if (result.success) {
            navigate('/shop-setup')
        } else {
            setFormError(result.error)
        }
    }

    const pwStrength = (() => {
        const p = formData.password
        if (!p) return null
        if (p.length < 6) return { label: 'Weak', color: '#ef4444', width: '25%' }
        if (p.length < 8) return { label: 'Fair', color: '#f59e0b', width: '50%' }
        if (p.length < 12 || !/[^a-zA-Z0-9]/.test(p)) return { label: 'Good', color: '#3b82f6', width: '75%' }
        return { label: 'Strong', color: '#10b981', width: '100%' }
    })()

    return (
        <div className="auth-page">
            <motion.div
                className="auth-container auth-container--wide"
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
                        <h1 className="auth-title">Create account</h1>
                        <p className="auth-subtitle">Join India's most trusted marketplace</p>
                    </div>

                    <GoogleSignInButton
                        onSuccess={() => navigate('/shop-setup')}
                        onError={(err) => setFormError(err)}
                    />

                    <div className="auth-divider-row">
                        <span className="auth-divider-line" />
                        <span className="auth-divider-text">or sign up with email</span>
                        <span className="auth-divider-line" />
                    </div>

                    {formError && (
                        <motion.div
                            className="auth-error"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                        >
                            {formError}
                        </motion.div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit} noValidate>
                        <div className="auth-field">
                            <label className="auth-label">Full Name <span className="auth-required">*</span></label>
                            <input
                                type="text"
                                name="name"
                                className="auth-input"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                autoComplete="name"
                                autoFocus
                            />
                        </div>

                        <div className="auth-field">
                            <label className="auth-label">Email <span className="auth-required">*</span></label>
                            <input
                                type="email"
                                name="email"
                                className="auth-input"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                            />
                        </div>

                        <div className="auth-field">
                            <label className="auth-label">Phone <span className="auth-optional">(optional)</span></label>
                            <input
                                type="tel"
                                name="phone"
                                className="auth-input"
                                placeholder="+91 98765 43210"
                                value={formData.phone}
                                onChange={handleChange}
                                autoComplete="tel"
                            />
                        </div>

                        <div className="auth-row">
                            <div className="auth-field">
                                <label className="auth-label">Password <span className="auth-required">*</span></label>
                                <div className="auth-input-wrap">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        className="auth-input"
                                        placeholder="Min 8 characters"
                                        value={formData.password}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                    />
                                    <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                                {pwStrength && (
                                    <div className="auth-pw-strength">
                                        <div className="auth-pw-bar">
                                            <div style={{ width: pwStrength.width, background: pwStrength.color }} />
                                        </div>
                                        <span style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                                    </div>
                                )}
                            </div>

                            <div className="auth-field">
                                <label className="auth-label">Confirm Password <span className="auth-required">*</span></label>
                                <div className="auth-input-wrap">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        name="confirmPassword"
                                        className="auth-input"
                                        placeholder="Repeat password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                    />
                                    <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                                        {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                                {formData.confirmPassword && (
                                    <p className="auth-pw-match" style={{ color: formData.password === formData.confirmPassword ? '#10b981' : '#ef4444' }}>
                                        {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                                    </p>
                                )}
                            </div>
                        </div>

                        <label className="auth-checkbox">
                            <div
                                className={`auth-checkbox-box ${acceptTerms ? 'auth-checkbox-box--checked' : ''}`}
                                onClick={() => setAcceptTerms(v => !v)}
                            >
                                {acceptTerms && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span>
                                I agree to the{' '}
                                <Link to="/terms" className="auth-link">Terms of Service</Link>
                                {' '}and{' '}
                                <Link to="/privacy" className="auth-link">Privacy Policy</Link>
                            </span>
                        </label>

                        <button type="submit" className="auth-btn-primary" disabled={isLoading}>
                            {isLoading
                                ? <span className="auth-spinner" />
                                : <><UserPlus size={16} /> Create Account</>
                            }
                        </button>
                    </form>

                    <p className="auth-footer-text">
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link">Sign in</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}

export default Register
