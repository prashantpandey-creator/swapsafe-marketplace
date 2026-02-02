import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, Search, User, MessageSquare, ShoppingBag, Settings, LogOut, Eye, EyeOff, Sparkles, MinusCircle, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import GuardianBadge from '../trust/GuardianBadge';

import logo from '../../assets/buyers_legion_logo.png';

const Header = ({ currentTheme, toggleTheme }) => {
    const { user, isAuthenticated, logout } = useAuth();
    const { items: cartItems } = useCart();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile and user menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
    }, [location]);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-legion-bg/90 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-5'
                }`}
        >
            <div className="container mx-auto px-4 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="relative w-10 h-10">
                        <motion.div
                            className="absolute inset-0 bg-legion-gold/50 blur-xl rounded-full"
                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                        <Shield className="w-full h-full text-legion-gold relative z-10 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" fill="currentColor" fillOpacity={0.2} />
                    </div>
                    <span className="text-2xl font-black tracking-tight text-white group-hover:text-legion-gold transition-colors">
                        SWAP<span className="text-legion-gold">SAFE</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link to="/browse" className="text-gray-300 hover:text-white font-medium transition-colors text-sm uppercase tracking-wide">Marketplace</Link>
                    <Link to="/sell" className="text-gray-300 hover:text-white font-medium transition-colors text-sm uppercase tracking-wide">Sell</Link>
                    <Link to="/shield" className="text-legion-gold hover:text-white font-medium transition-colors text-sm uppercase tracking-wide flex items-center gap-1">
                        <Shield size={14} /> Shield
                    </Link>
                </nav>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <Link to="/search" className="p-2 text-gray-300 hover:text-legion-gold transition-colors">
                        <Search className="w-5 h-5" />
                    </Link>

                    {/* Protection Indicator */}
                    <div className="hidden lg:flex items-center">
                        {/* Simplified protection badge */}
                        <div className="flex items-center gap-2 px-3 py-1 bg-legion-gold/10 rounded-full border border-legion-gold/20">
                            <span className="w-2 h-2 rounded-full bg-legion-gold animate-pulse"></span>
                            <span className="text-xs font-bold text-legion-gold">VERIFIED</span>
                        </div>
                    </div>

                    {isAuthenticated && user ? (
                        <>
                            <Link to="/messages" className="p-2 text-gray-300 hover:text-legion-gold transition-colors relative">
                                <MessageSquare className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </Link>
                            <Link to="/cart" className="p-2 text-gray-300 hover:text-legion-gold transition-colors relative">
                                <ShoppingBag className="w-5 h-5" />
                                {cartItems.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-legion-gold text-legion-bg text-xs font-bold rounded-full flex items-center justify-center">
                                        {cartItems.length}
                                    </span>
                                )}
                            </Link>
                            <div className="relative">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="relative z-50 focus:outline-none"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-legion-gold to-yellow-600 p-[2px] transition-transform hover:scale-105 active:scale-95">
                                        <div className="w-full h-full rounded-full bg-legion-card flex items-center justify-center overflow-hidden">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-5 h-5 text-gray-300" />
                                            )}
                                        </div>
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isUserMenuOpen && (
                                        <>
                                            {/* Backdrop to close on click outside */}
                                            <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />

                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 top-full mt-2 w-56 bg-legion-card border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-2"
                                            >
                                                <div className="px-4 py-3 border-b border-white/10 mb-2">
                                                    <p className="text-sm font-bold text-white truncate">
                                                        {user?.isGuest ? '🎭 Guest User' : user?.name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 truncate">
                                                        {user?.isGuest ? 'Browsing as guest' : user?.email}
                                                    </p>
                                                </div>

                                                <Link to="/my-listings" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                                                    <ShoppingBag size={16} /> My Listings
                                                </Link>

                                                <Link to="/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                                                    <Settings size={16} /> Settings
                                                </Link>

                                                <div className="border-t border-white/10 my-2"></div>

                                                <button
                                                    onClick={logout}
                                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                                                >
                                                    <LogOut size={16} /> Logout
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link to="/login" className="text-white hover:text-legion-gold font-medium transition-colors">
                                Login
                            </Link>
                            <Link to="/register" className="btn-primary py-2 px-4 shadow-lg shadow-legion-gold/20">
                                Join Legion
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-legion-card border-t border-white/10"
                    >
                        <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
                            <Link to="/browse" className="text-gray-300 hover:text-white py-2">Marketplace</Link>
                            <Link to="/community" className="text-gray-300 hover:text-white py-2">Brotherhood</Link>
                            <Link to="/sell" className="text-gray-300 hover:text-white py-2">Sell Item</Link>
                            <hr className="border-white/10" />
                            {isAuthenticated && user ? (
                                <>
                                    <Link to="/my-listings" className="text-gray-300 hover:text-white py-2">My Listings</Link>
                                    <button onClick={logout} className="text-red-400 text-left py-2">Logout</button>
                                </>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <Link to="/login" className="btn-secondary text-center">Login</Link>
                                    <Link to="/register" className="btn-primary text-center">Join Legion</Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
