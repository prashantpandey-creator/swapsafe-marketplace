import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, Search, User, MessageSquare, ShoppingBag, Settings, LogOut, Home, Heart, Plus, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

import logo from '../../assets/buyers_legion_logo.png';

const Header = ({ currentTheme, toggleTheme }) => {
    const { user, isAuthenticated, logout } = useAuth();
    const { items: cartItems } = useCart();
    const location = useLocation();

    // State for scroll effect and menus
    const [isScrolled, setIsScrolled] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Kept for fallback or extra options

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menus on route change
    useEffect(() => {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
    }, [location]);

    return (
        <>
            {/* --- TOP GLASS NAV (Desktop & Mobile Top Bar) --- */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 pt-2 pb-4
                    ${isScrolled ? 'bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}
            >
                <div className="container mx-auto max-w-7xl">
                    <div className="flex items-center justify-between gap-4">

                        {/* 1. Left: Mobile Menu / Logo */}
                        <div className="flex items-center gap-3">
                            <Link to="/" className="flex items-center gap-2 group">
                                <div className="relative w-8 h-8">
                                    <Shield className="w-full h-full text-legion-gold fill-legion-gold/20" />
                                    <div className="absolute inset-0 bg-legion-gold/20 blur-lg rounded-full animate-pulse"></div>
                                </div>
                                <span className="text-xl font-extrabold tracking-tight text-white hidden md:block">
                                    SwapSafe
                                </span>
                            </Link>
                        </div>

                        {/* 2. Center: Search Bar (Expanded on Desktop, Compact on Mobile) */}
                        <div className="flex-1 max-w-xl mx-auto">
                            <label className="flex w-full cursor-text items-center gap-3 rounded-full bg-white/5 border border-white/10 px-4 h-10 md:h-12 focus-within:border-legion-gold/50 focus-within:bg-white/10 transition-all group">
                                <Search className="text-gray-400 group-focus-within:text-legion-gold w-5 h-5" />
                                <input
                                    className="flex-1 bg-transparent border-none p-0 text-sm md:text-base font-medium text-white placeholder:text-gray-500 focus:ring-0"
                                    placeholder="Search verified products..."
                                    type="text"
                                />
                            </label>
                        </div>

                        {/* 3. Right: User Profile & Desktop Nav */}
                        <div className="flex items-center gap-3 md:gap-6 justify-end w-auto">
                            {/* Desktop Links */}
                            <nav className="hidden md:flex items-center gap-6">
                                <Link to="/browse" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Marketplace</Link>
                                <Link to="/shield" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Shield</Link>
                            </nav>

                            {/* Cart Icon */}
                            <Link to="/cart" className="relative p-2 text-gray-400 hover:text-white transition-colors">
                                <ShoppingBag size={22} />
                                {cartItems.length > 0 && (
                                    <span className="absolute top-0 right-0 w-4 h-4 bg-legion-gold text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {cartItems.length}
                                    </span>
                                )}
                            </Link>

                            {/* User Avatar / Auth */}
                            {isAuthenticated && user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/5 border border-white/10 overflow-hidden hover:border-legion-gold/50 transition-colors"
                                    >
                                        {user.avatar ? (
                                            <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="text-gray-400" size={20} />
                                        )}
                                        <div className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-legion-gold border-2 border-[#0A0A0F]"></div>
                                    </button>

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {isUserMenuOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute right-0 top-full mt-2 w-64 bg-[#1A1A23] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 origin-top-right"
                                                >
                                                    <div className="px-4 py-3 border-b border-white/5 mb-2">
                                                        <p className="text-sm font-bold text-white truncate">{user.name}</p>
                                                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Link to="/my-listings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                                                            <ShoppingBag size={16} /> My Listings
                                                        </Link>
                                                        <Link to="/messages" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                                                            <MessageSquare size={16} /> Messages
                                                        </Link>
                                                        <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                                                            <Settings size={16} /> Settings
                                                        </Link>
                                                        <div className="h-px bg-white/5 my-1" />
                                                        <button
                                                            onClick={logout}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                                        >
                                                            <LogOut size={16} /> Logout
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <Link to="/login" className="hidden md:block btn-primary px-5 py-2 text-sm">
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>


            {/* --- BOTTOM DOCK (Mobile Only) --- */}
            {/* Matches Stitch 'home_feed.html' Bottom Dock design */}
            <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0A0A0F]/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex items-center gap-8 shadow-2xl shadow-black/50">
                <Link to="/" className={`flex flex-col items-center gap-1 group transition-colors ${location.pathname === '/' ? 'text-legion-gold' : 'text-gray-400 hover:text-white'}`}>
                    <Home size={24} className={location.pathname === '/' ? 'fill-current' : ''} />
                    <span className={`w-1 h-1 rounded-full ${location.pathname === '/' ? 'bg-legion-gold' : 'bg-transparent'}`}></span>
                </Link>

                <Link to="/browse" className={`flex flex-col items-center gap-1 group transition-colors ${location.pathname === '/browse' ? 'text-legion-gold' : 'text-gray-400 hover:text-white'}`}>
                    <Search size={24} />
                    <span className={`w-1 h-1 rounded-full ${location.pathname === '/browse' ? 'bg-legion-gold' : 'bg-transparent'}`}></span>
                </Link>

                {/* Center Add Button - Floats above */}
                <Link to="/sell" className="flex items-center justify-center w-14 h-14 bg-legion-gold rounded-full text-black shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-105 transition-transform -mt-8 border-4 border-[#0A0A0F]">
                    <Plus size={28} strokeWidth={2.5} />
                </Link>

                <Link to="/messages" className={`flex flex-col items-center gap-1 group transition-colors ${location.pathname === '/messages' ? 'text-legion-gold' : 'text-gray-400 hover:text-white'}`}>
                    <MessageSquare size={24} className={location.pathname === '/messages' ? 'fill-current' : ''} />
                    <span className={`w-1 h-1 rounded-full ${location.pathname === '/messages' ? 'bg-legion-gold' : 'bg-transparent'}`}></span>
                </Link>

                <Link to={isAuthenticated ? "/profile" : "/login"} className={`flex flex-col items-center gap-1 group transition-colors ${location.pathname.includes('/profile') ? 'text-legion-gold' : 'text-gray-400 hover:text-white'}`}>
                    <User size={24} className={location.pathname.includes('/profile') ? 'fill-current' : ''} />
                    <span className={`w-1 h-1 rounded-full ${location.pathname.includes('/profile') ? 'bg-legion-gold' : 'bg-transparent'}`}></span>
                </Link>
            </nav>
        </>
    );
};

export default Header;
