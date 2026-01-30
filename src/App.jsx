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
import Profile from './pages/Profile'
import Messages from './pages/Messages'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import ShopSetup from './pages/ShopSetup'
import Dashboard from './pages/Dashboard'
import TrackOrder from './pages/TrackOrder'
import Settings from './pages/Settings'
import EditListing from './pages/EditListing'

import BackgroundManager from './components/layout/BackgroundManager'
import ServerWaker from './components/common/ServerWaker'
// ... imports ...

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <WishlistProvider>
                    <Router>
                        <BackgroundManager />
                        <ServerWaker />
                        <div className="app" style={{ position: 'relative', zIndex: 1 }}>
                            <Header />
                            <main className="main-content" style={{ paddingTop: '80px' }}>
                                <Routes>
                                    <Route path="/" element={<Landing />} />
                                    <Route path="/browse" element={<Browse />} />
                                    <Route path="/search" element={<Browse />} />
                                    <Route path="/browse/:category" element={<Browse />} />
                                    <Route path="/product/:id" element={<ProductDetail />} />
                                    <Route path="/sell" element={<CreateListing />} />
                                    <Route path="/profile/:id" element={<Profile />} />
                                    <Route path="/messages" element={<Messages />} />
                                    <Route path="/messages/:conversationId" element={<Messages />} />
                                    <Route path="/checkout/:id" element={<Checkout />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/shop-setup" element={<ShopSetup />} />
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/tracker/:orderId" element={<TrackOrder />} />
                                    <Route path="/settings" element={<Settings />} />
                                    <Route path="/edit-listing/:id" element={<EditListing />} />
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
