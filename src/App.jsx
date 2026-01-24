import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import Browse from './pages/Browse'
import ProductDetail from './pages/ProductDetail'
import CreateListing from './pages/CreateListing'
import Profile from './pages/Profile'
import Messages from './pages/Messages'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import TrackOrder from './pages/TrackOrder'

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router basename="/swapsafe-marketplace">
                    <div className="app">
                        <Header />
                        <main className="main-content">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/browse" element={<Browse />} />
                                <Route path="/browse/:category" element={<Browse />} />
                                <Route path="/product/:id" element={<ProductDetail />} />
                                <Route path="/sell" element={<CreateListing />} />
                                <Route path="/profile/:id" element={<Profile />} />
                                <Route path="/messages" element={<Messages />} />
                                <Route path="/messages/:conversationId" element={<Messages />} />
                                <Route path="/checkout/:id" element={<Checkout />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/track/:orderId" element={<TrackOrder />} />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                </Router>
            </CartProvider>
        </AuthProvider>
    )
}

export default App
