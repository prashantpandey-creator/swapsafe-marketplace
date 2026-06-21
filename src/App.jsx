import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { ToastProvider } from './context/ToastContext'
import { useAuth } from './context/AuthContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Landing from './pages/Landing'
import Browse from './pages/Browse'
import ProductDetail from './pages/ProductDetail'
import CreateListing from './pages/CreateListing'
import SellLanding from './pages/SellLanding'
import QuickSell from './pages/QuickSell'
import StudioMode from './pages/StudioMode'
import Profile from './pages/Profile'
import Messages from './pages/Messages'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import ShopSetup from './pages/ShopSetup'
import MyListings from './pages/MyListings'
import TrackOrder from './pages/TrackOrder'
import Settings from './pages/Settings'
import EditListing from './pages/EditListing'
import Cart from './pages/Cart'
import ThreeDStudio from './pages/ThreeDStudio'
import SwapSafeShield from './pages/SwapSafeShield'
import MarketingStudio from './pages/MarketingStudio'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import Legal from './pages/Legal'
import Community from './pages/Community'
import PostDetail from './pages/PostDetail'
import CommunityProfile from './pages/CommunityProfile'
import BackgroundManager from './components/layout/BackgroundManager'
import LynchAudioPlayer from './components/layout/LynchAudioPlayer'
import ServerWaker from './components/common/ServerWaker'

// Redirects unauthenticated users to /login, preserving intended destination
function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth()
    const location = useLocation()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-[var(--legion-gold)] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children
}

// Redirects already-authenticated users away from login/register
function PublicOnlyRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) return null

    if (isAuthenticated) {
        return <Navigate to="/" replace />
    }

    return children
}

function App() {
    const [theme, setTheme] = useState(() => {
        // Two themes only: 'classic' (professional gold/obsidian, default) and 'lynch' (creative midnight crimson).
        // Migrate any legacy theme value to 'classic'.
        const stored = localStorage.getItem('theme')
        return stored === 'lynch' || stored === 'classic' ? stored : 'classic'
    })

    const toggleTheme = () => {
        const newTheme = theme === 'classic' ? 'lynch' : 'classic'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
    }

    useEffect(() => {
        document.body.className = ''
        document.body.classList.add(`theme-${theme}`)
    }, [theme])

    return (
        <ErrorBoundary>
            <AuthProvider>
                <CartProvider>
                    <WishlistProvider>
                        <ToastProvider>
                            <Router>
                                <BackgroundManager currentTheme={theme} />
                                <LynchAudioPlayer active={theme === 'lynch'} />
                                <ServerWaker />
                                <div className="app" style={{ position: 'relative', zIndex: 1 }}>
                                    <Header currentTheme={theme} toggleTheme={toggleTheme} />
                                    <main className="main-content" style={{ paddingTop: 'calc(80px + env(safe-area-inset-top, 0px))' }}>
                                        <Routes>
                                            {/* Public routes */}
                                            <Route path="/" element={<Landing />} />
                                            <Route path="/browse" element={<Browse />} />
                                            <Route path="/search" element={<Browse />} />
                                            <Route path="/browse/:category" element={<Browse />} />
                                            <Route path="/product/:id" element={<ProductDetail />} />
                                            <Route path="/sell" element={<SellLanding />} />
                                            <Route path="/sell/quick" element={<QuickSell />} />
                                            <Route path="/sell/studio" element={<StudioMode />} />
                                            <Route path="/profile/:id" element={<Profile />} />
                                            <Route path="/cart" element={<Cart />} />
                                            <Route path="/studio" element={<ThreeDStudio />} />
                                            <Route path="/studio/marketing" element={<MarketingStudio />} />
                                            <Route path="/shield" element={<SwapSafeShield />} />
                                            <Route path="/community" element={<Community />} />
                                            <Route path="/community/post/:id" element={<PostDetail />} />
                                            <Route path="/u/:id" element={<CommunityProfile />} />

                                            {/* Auth routes — redirect away if already logged in */}
                                            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
                                            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
                                            <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
                                            <Route path="/terms" element={<Legal />} />
                                            <Route path="/privacy" element={<Legal />} />

                                            {/* Protected routes — require login */}
                                            <Route path="/sell/classic" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
                                            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                                            <Route path="/messages/:conversationId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                                            <Route path="/checkout/:id" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                                            <Route path="/shop-setup" element={<ProtectedRoute><ShopSetup /></ProtectedRoute>} />
                                            <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
                                            <Route path="/tracker/:orderId" element={<ProtectedRoute><TrackOrder /></ProtectedRoute>} />
                                            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                                            <Route path="/edit-listing/:id" element={<ProtectedRoute><EditListing /></ProtectedRoute>} />
                                            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                                        </Routes>
                                    </main>
                                    <Footer />
                                </div>
                            </Router>
                        </ToastProvider>
                    </WishlistProvider>
                </CartProvider>
            </AuthProvider>
        </ErrorBoundary>
    )
}

export default App
