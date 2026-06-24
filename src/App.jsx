import { useState, useEffect, lazy, Suspense } from 'react'
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
import ServerWaker from './components/common/ServerWaker'

const LandingLynch = lazy(() => import('./pages/LandingLynch'))
const BackgroundManager = lazy(() => import('./components/layout/BackgroundManager'))
const LynchAudioPlayer = lazy(() => import('./components/layout/LynchAudioPlayer'))

const Browse = lazy(() => import('./pages/Browse'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const CreateListing = lazy(() => import('./pages/CreateListing'))
const SellLanding = lazy(() => import('./pages/SellLanding'))
const QuickSell = lazy(() => import('./pages/QuickSell'))
const StudioMode = lazy(() => import('./pages/StudioMode'))
const Profile = lazy(() => import('./pages/Profile'))
const Messages = lazy(() => import('./pages/Messages'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ShopSetup = lazy(() => import('./pages/ShopSetup'))
const MyListings = lazy(() => import('./pages/MyListings'))
const TrackOrder = lazy(() => import('./pages/TrackOrder'))
const Settings = lazy(() => import('./pages/Settings'))
const EditListing = lazy(() => import('./pages/EditListing'))
const Cart = lazy(() => import('./pages/Cart'))
const ThreeDStudio = lazy(() => import('./pages/ThreeDStudio'))
const SwapSafeShield = lazy(() => import('./pages/SwapSafeShield'))
const MarketingStudio = lazy(() => import('./pages/MarketingStudio'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Legal = lazy(() => import('./pages/Legal'))
const Community = lazy(() => import('./pages/Community'))
const PostDetail = lazy(() => import('./pages/PostDetail'))
const CommunityProfile = lazy(() => import('./pages/CommunityProfile'))

// In Lynch mode the landing renders its own Sketchfab 3D room, so the canvas
// LynchBackground must NOT paint behind it (the old curtains bleed through the
// iframe during load). Suppress the canvas only on '/' in Lynch mode.
function RoutedBackground({ theme }) {
    const location = useLocation()
    if (theme === 'lynch' && location.pathname === '/') return null
    return <BackgroundManager currentTheme={theme} />
}

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
                                <Suspense fallback={null}>
                                    <RoutedBackground theme={theme} />
                                    <LynchAudioPlayer active={theme === 'lynch'} />
                                </Suspense>
                                <ServerWaker />
                                <div className="app" style={{ position: 'relative', zIndex: 1 }}>
                                    <Header currentTheme={theme} toggleTheme={toggleTheme} />
                                    <main className="main-content" style={{ paddingTop: 'calc(80px + env(safe-area-inset-top, 0px))' }}>
                                        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="w-6 h-6 border-2 border-[var(--legion-gold)] border-t-transparent rounded-full animate-spin" /></div>}>
                                        <Routes>
                                            {/* Public routes */}
                                            <Route path="/" element={theme === 'lynch' ? <LandingLynch /> : <Landing />} />
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
                                        </Suspense>
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
