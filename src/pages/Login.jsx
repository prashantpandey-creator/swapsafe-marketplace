import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn, Ghost } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import GoogleSignInButton from '../components/common/GoogleSignInButton'
import logoV2 from '../assets/buyers_legion_logo_v2.png'
import './Auth.css'

function Login() {
    const navigate = useNavigate()
    const location = useLocation()
    const { login, loginAsGuest, isLoading, error, clearError } = useAuth()

    const [formData, setFormData] = useState({ email: '', password: '' })
    const [formError, setFormError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [guestLoading, setGuestLoading] = useState(false)

    const from = location.state?.from?.pathname || '/'

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
        if (formError) setFormError('')
        if (error) clearError()
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setFormError('')

        if (!formData.email || !formData.password) {
            setFormError('Please fill in all fields')
            return
        }

        const result = await login(formData.email, formData.password)
        if (result.success) {
            navigate(from, { replace: true })
        } else {
            setFormError(result.error)
        }
    }

    const handleGuest = async () => {
        setGuestLoading(true)
        const result = await loginAsGuest()
        setGuestLoading(false)
        if (result.success) navigate(from, { replace: true })
    }

    const displayError = formError || error

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
                        <h1 className="auth-title">Welcome back</h1>
                        <p className="auth-subtitle">Sign in to your account</p>
                    </div>

                    {displayError && (
                        <motion.div
                            className="auth-error"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                        >
                            {displayError}
                        </motion.div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit} noValidate>
                        <div className="auth-field">
                            <label className="auth-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                className="auth-input"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                autoFocus
                            />
                        </div>

                        <div className="auth-field">
                            <div className="auth-label-row">
                                <label className="auth-label">Password</label>
                                <Link to="/forgot-password" className="auth-link-sm">Forgot password?</Link>
                            </div>
                            <div className="auth-input-wrap">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className="auth-input"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="auth-eye-btn"
                                    onClick={() => setShowPassword(v => !v)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="auth-btn-primary" disabled={isLoading}>
                            {isLoading
                                ? <span className="auth-spinner" />
                                : <><LogIn size={16} /> Sign In</>
                            }
                        </button>
                    </form>

                    <div className="auth-divider-row">
                        <span className="auth-divider-line" />
                        <span className="auth-divider-text">or</span>
                        <span className="auth-divider-line" />
                    </div>

                    <GoogleSignInButton
                        onSuccess={() => navigate(from, { replace: true })}
                        onError={(err) => setFormError(err)}
                    />

                    <button type="button" className="auth-btn-ghost" onClick={handleGuest} disabled={guestLoading}>
                        {guestLoading
                            ? <span className="auth-spinner" />
                            : <><Ghost size={16} /> Continue as Guest</>
                        }
                    </button>
                    <p className="auth-guest-note">7-day session · no account needed</p>

                    <p className="auth-footer-text">
                        Don't have an account?{' '}
                        <Link to="/register" className="auth-link">Create one</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}

export default Login
