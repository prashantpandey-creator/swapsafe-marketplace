import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, Search, User, MessageSquare, ShoppingBag, Settings, LogOut, Home, Heart, Plus, MapPin, Eye, EyeOff, Sparkles, MinusCircle, Moon, Zap, Flame, Bell, Gavel, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import ThemeIndicator from '../common/ThemeIndicator';
import ServerStatus from '../common/ServerStatus';

import logoV2 from '../../assets/buyers_legion_logo_v2.png';

const Header = ({ currentTheme, toggleTheme }) => {
    const { user, isAuthenticated, logout } = useAuth();
    const { items: cartItems } = useCart();
    const location = useLocation();

    // State for scroll effect and menus
    const [isScrolled, setIsScrolled] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            {/* --- DESKTOP HEADER (Tactical Glass) --- */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent
                    ${isScrolled
                        ? 'bg-[#050505]/80 backdrop-blur-xl border-white/5 py-3'
                        : 'bg-gradient-to-b from-black/80 to-transparent py-5'}`}
            >
                <div className="container mx-auto max-w-7xl px-6">
                    <div className="flex items-center justify-between">

                        {/* 1. LEFT: LOGO & BRAND */}
                        <div className="flex items-center gap-4 w-1/4">
                            <Link to="/" className="flex items-center gap-3 group">
                                <div className="relative w-12 h-12">
                                    <div className="absolute inset-0 bg-[var(--legion-gold)]/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <img
                                        src={logoV2}
                                        alt="Buyers Legion"
                                        className="relative w-full h-full object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-heading text-xl font-bold tracking-[0.15em] text-white leading-none group-hover:text-[var(--legion-gold)] transition-colors">
                                        BUYERS
                                    </span>
                                    <span className="font-heading text-xl font-bold tracking-[0.15em] text-[var(--legion-gold)] leading-none">
                                        LEGION
                                    </span>
                                </div>
                            </Link>
                        </div>

                        {/* 2. CENTER: TACTICAL NAVIGATION */}
                        <nav className="hidden md:flex items-center justify-center gap-1 bg-white/5 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/5">
                            {[
                                { path: '/browse', label: 'MARKET', icon: ShoppingBag },
                                { path: '/auctions', label: 'AUCTIONS', icon: Gavel }, // Placeholder route
                                { path: '/community', label: 'COMMUNITY', icon: Users }, // Placeholder route
                                { path: '/shield', label: 'SHIELD', icon: Shield },
                            ].map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`relative px-5 py-2.5 rounded-full text-xs font-bold tracking-wider transition-all duration-300 flex items-center gap-2 group overflow-hidden ${location.pathname === link.path
                                        ? 'text-black bg-[var(--legion-gold)] shadow-[0_0_15px_rgba(245,197,66,0.3)]'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <link.icon size={14} className={location.pathname === link.path ? 'stroke-[2.5px]' : ''} />
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                        </nav>

                        {/* 3. RIGHT: ACTIONS & PROFILE */}
                        <div className="flex items-center justify-end gap-4 w-1/4">
                            {/* Create Listing Button */}
                            <Link
                                to="/sell"
                                className="hidden lg:flex items-center gap-2 bg-[var(--legion-gold)] hover:bg-yellow-400 text-black px-5 py-2.5 rounded-lg text-xs font-black tracking-wider shadow-[0_0_15px_rgba(245,197,66,0.2)] hover:shadow-[0_0_25px_rgba(245,197,66,0.4)] transition-all transform hover:-translate-y-0.5"
                            >
                                <Plus size={16} strokeWidth={3} />
                                <span>SELL</span>
                            </Link>



                            {/* Icons Group */}
                            <div className="flex items-center gap-2 border-l border-white/10 pl-4 ml-2">
                                <ServerStatus /> {/* Add ServerStatus Here */}

                                {/* Theme toggle */}
                                <ThemeIndicator theme={currentTheme} onToggle={toggleTheme} />

                                <Link to="/cart" className="relative p-2 text-gray-400 hover:text-white transition-colors group">
                                    <ShoppingBag size={20} />
                                    {cartItems.length > 0 && (
                                        <span className="absolute top-0 right-0 w-4 h-4 bg-[var(--legion-gold)] text-black text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                                            {cartItems.length}
                                        </span>
                                    )}
                                </Link>

                                <button className="p-2 text-gray-400 hover:text-[var(--legion-gold)] transition-colors relative">
                                    <Bell size={20} />
                                    <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                </button>
                            </div>

                            {/* User Profile */}
                            {isAuthenticated && user ? (
                                <div className="relative ml-2">
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-white/5 border border-white/10 overflow-hidden hover:border-[var(--legion-gold)]/50 transition-all group"
                                    >
                                        {user.avatar ? (
                                            <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="text-gray-400 group-hover:text-white" size={20} />
                                        )}
                                    </button>

                                    {/* User Dropdown */}
                                    <AnimatePresence>
                                        {isUserMenuOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute right-0 top-full mt-3 w-64 bg-[#0A0A0F] border border-white/10 rounded-xl shadow-2xl p-2 z-50 origin-top-right backdrop-blur-3xl ring-1 ring-white/5"
                                                >
                                                    <div className="px-4 py-3 border-b border-white/5 mb-2 bg-white/5 rounded-lg">
                                                        <p className="font-heading font-bold text-white truncate text-base">{user.name}</p>
                                                        <p className="text-xs text-gray-400 truncate font-mono">{user.email}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Link to="/my-listings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                                            <ShoppingBag size={16} /> My Listings
                                                        </Link>
                                                        <Link to="/messages" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                                            <MessageSquare size={16} /> Messages
                                                        </Link>
                                                        <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                                            <Home size={16} /> Dashboard
                                                        </Link>
                                                        <div className="h-px bg-white/5 my-2" />
                                                        <button
                                                            onClick={logout}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
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
                                <Link to="/login" className="ml-2 px-6 py-2 rounded-lg border border-white/10 text-sm font-bold text-white hover:bg-white/5 hover:border-[var(--legion-gold)]/50 transition-all uppercase tracking-wider">
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* --- MOBILE NAV (Bottom Dock) --- */}
            <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0A0A0F]/90 backdrop-blur-xl border border-white/10 rounded-full px-4 py-3 flex items-center gap-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
                {[
                    { path: '/', icon: Home },
                    { path: '/browse', icon: Search },
                ].map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`flex flex-col items-center gap-1 group transition-colors ${location.pathname === link.path ? 'text-[var(--legion-gold)]' : 'text-gray-500'}`}
                    >
                        <link.icon size={22} className={location.pathname === link.path ? 'fill-current' : ''} />
                    </Link>
                ))}

                {/* Center Add Button */}
                <Link to="/sell" className="flex items-center justify-center w-14 h-14 bg-[var(--legion-gold)] rounded-full text-black shadow-[0_0_20px_rgba(245,197,66,0.4)] hover:scale-110 transition-transform -mt-10 border-4 border-[#0A0A0F]">
                    <Plus size={28} strokeWidth={2.5} />
                </Link>

                {[
                    { path: '/messages', icon: MessageSquare },
                    { path: isAuthenticated ? '/profile' : '/login', icon: User },
                ].map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`flex flex-col items-center gap-1 group transition-colors ${location.pathname.startsWith(link.path) ? 'text-[var(--legion-gold)]' : 'text-gray-500'}`}
                    >
                        <link.icon size={22} className={location.pathname.startsWith(link.path) ? 'fill-current' : ''} />
                    </Link>
                ))}

                {/* Mobile theme toggle */}
                <ThemeIndicator theme={currentTheme} onToggle={toggleTheme} />
            </nav>
        </>
    );
};

export default Header;
