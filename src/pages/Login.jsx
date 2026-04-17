import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'
import logo from '../assets/buyers_legion_logo.png'

function Login() {
    const navigate = useNavigate()
    const location = useLocation()
    const { login, loginAsGuest, isLoading, error } = useAuth()

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [formError, setFormError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const from = location.state?.from || '/'

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

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <Link to="/" className="auth-logo">
                            <img
                                src={logo}
                                alt="Buyers Legion"
                                className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                            />
                            <span>BUYERS<span className="text-legion-gold">LEGION</span></span>
                        </Link>
                        <h1>Welcome Back</h1>
                        <p>Log in to continue buying and selling</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {(formError || error) && (
                            <div className="form-error-banner">
                                {formError || error}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="password-input-wrapper" style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-input"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#6b7280'
                                    }}
                                >
                                    {showPassword ? (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="form-row-between">
                            <label className="form-checkbox">
                                <input type="checkbox" />
                                <span>Remember me</span>
                            </label>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isLoading}>
                            {isLoading ? 'Logging in...' : 'Log In'}
                        </button>
                    </form>

                    <div className="auth-divider">
                        {/* Guest Login Button */}
                        <button
                            type="button"
                            onClick={() => {
                                loginAsGuest()
                                navigate(from, { replace: true })
                            }}
                            className="btn btn-lg w-full"
                            style={{
                                background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.1)',
                                marginTop: '1rem'
                            }}
                        >
                            🎭 Continue as Guest
                        </button>
                        <p style={{
                            textAlign: 'center',
                            color: '#6b7280',
                            fontSize: '0.75rem',
                            marginTop: '0.5rem'
                        }}>
                            Full access to all features • No account needed
                        </p>

                        <p className="auth-footer">
                            Don't have an account? <Link to="/register">Sign up</Link>
                        </p>

                        <p className="demo-credentials">
                            <strong>Demo:</strong> prashant@buyerslegion.com / Legion@123
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
