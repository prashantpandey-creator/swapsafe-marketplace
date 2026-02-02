import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
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

import BackgroundManager from './components/layout/BackgroundManager'
import ServerWaker from './components/common/ServerWaker'

function App() {
    // Theme State (Default to 'esoteric')
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'esoteric')

    const toggleTheme = () => {
        let newTheme = 'classic'
        if (theme === 'classic') newTheme = 'esoteric'
        else if (theme === 'esoteric') newTheme = 'mystical'
        else if (theme === 'mystical') newTheme = 'void'
        else if (theme === 'void') newTheme = 'minimal'
        else if (theme === 'minimal') newTheme = 'classic'

        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
    }

    // Apply theme to body
    useEffect(() => {
        document.body.className = '' // Clear existing
        document.body.classList.add(`theme-${theme}`)
    }, [theme])

    return (
        <AuthProvider>
            <CartProvider>
                <WishlistProvider>
                    <Router>
                        <BackgroundManager currentTheme={theme} />
                        <ServerWaker />
                        <div className="app" style={{ position: 'relative', zIndex: 1 }}>
                            <Header currentTheme={theme} toggleTheme={toggleTheme} />
                            <main className="main-content" style={{ paddingTop: '80px' }}>
                                <Routes>
                                    <Route path="/" element={<Landing />} />
                                    <Route path="/browse" element={<Browse />} />
                                    <Route path="/search" element={<Browse />} />
                                    <Route path="/browse/:category" element={<Browse />} />
                                    <Route path="/product/:id" element={<ProductDetail />} />
                                    <Route path="/sell" element={<SellLanding />} />
                                    <Route path="/sell/quick" element={<QuickSell />} />
                                    <Route path="/sell/studio" element={<StudioMode />} />
                                    <Route path="/sell/classic" element={<CreateListing />} />
                                    <Route path="/profile/:id" element={<Profile />} />
                                    <Route path="/messages" element={<Messages />} />
                                    <Route path="/messages/:conversationId" element={<Messages />} />
                                    <Route path="/cart" element={<Cart />} />
                                    <Route path="/checkout/:id" element={<Checkout />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/shop-setup" element={<ShopSetup />} />
                                    <Route path="/my-listings" element={<MyListings />} />
                                    <Route path="/tracker/:orderId" element={<TrackOrder />} />
                                    <Route path="/settings" element={<Settings />} />
                                    <Route path="/edit-listing/:id" element={<EditListing />} />
                                    <Route path="/studio" element={<ThreeDStudio />} />
                                    <Route path="/shield" element={<SwapSafeShield />} />
                                </Routes>
                            </main>
                            <Footer />
                        </div>
                    </Router>
                </WishlistProvider>
            </CartProvider>
        </AuthProvider>
    )
}

export default App
