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
                            <Link to="/forgot-password" className="form-link">Forgot password?</Link>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isLoading}>
                            {isLoading ? 'Logging in...' : 'Log In'}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>or continue with</span>
                    </div>

                    <div className="social-buttons">
                        <button className="btn btn-secondary social-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>
                        <button className="btn btn-secondary social-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                            </svg>
                            GitHub
                        </button>
                    </div>

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
    )
}

export default Login
