import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Search, User, MessageSquare, ShoppingBag, LogOut, Home, Plus, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import ThemeIndicator from '../common/ThemeIndicator';

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
            {/* --- DESKTOP HEADER (Minimalist) --- */}
            <header
                data-scrolled={isScrolled}
                className="m-bar fixed top-0 left-0 right-0 z-50"
                style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
                <div className="container mx-auto max-w-7xl px-6">
                    {/* True 3-column grid: center nav is centered on the page, not pushed by side widths */}
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16">

                        {/* 1. LEFT: LOGO & BRAND */}
                        <div className="flex items-center justify-self-start">
                            <Link to="/" className="flex items-center gap-2.5 group">
                                <img
                                    src={logoV2}
                                    alt="Buyers Legion"
                                    className="w-9 h-9 object-contain"
                                />
                                <span className="text-base font-semibold tracking-tight text-[var(--m-fg)] leading-none">
                                    Buyers<span className="text-[var(--m-accent)]">Legion</span>
                                </span>
                            </Link>
                        </div>

                        {/* 2. CENTER: NAVIGATION */}
                        <nav className="hidden lg:flex items-center gap-1 justify-self-center">
                            {[
                                { path: '/browse', label: 'Market', icon: ShoppingBag },
                                { path: '/community', label: 'Community', icon: Users },
                                { path: '/shield', label: 'Shield', icon: Shield },
                            ].map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    data-active={location.pathname === link.path}
                                    className="m-navlink"
                                >
                                    <link.icon size={15} />
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                        </nav>

                        {/* 3. RIGHT: ACTIONS & PROFILE */}
                        <div className="flex items-center gap-2 justify-self-end">
                            {/* Primary CTA */}
                            <Link to="/sell" className="m-btn-accent hidden lg:inline-flex">
                                <Plus size={16} strokeWidth={2.5} />
                                <span>Sell</span>
                            </Link>

                            {/* Cart */}
                            <Link to="/cart" className="m-iconbtn relative" aria-label="Cart">
                                <ShoppingBag size={19} />
                                {cartItems.length > 0 && (
                                    <span className="m-badge">{cartItems.length}</span>
                                )}
                            </Link>

                            {/* Theme toggle */}
                            <ThemeIndicator theme={currentTheme} onToggle={toggleTheme} />

                            {/* User Profile */}
                            {isAuthenticated && user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--m-surface)] border border-[var(--m-hairline)] overflow-hidden hover:border-[var(--m-accent)]/50 transition-colors"
                                        aria-label="Account menu"
                                    >
                                        {user.avatar ? (
                                            <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="text-[var(--m-fg-muted)]" size={19} />
                                        )}
                                    </button>

                                    {/* User Dropdown */}
                                    <AnimatePresence>
                                        {isUserMenuOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute right-0 top-full mt-2 w-60 bg-[#0A0A0F] border border-[var(--m-hairline)] rounded-[10px] shadow-xl p-1.5 z-50 origin-top-right"
                                                >
                                                    <div className="px-3 py-2.5 border-b border-[var(--m-hairline)] mb-1.5">
                                                        <p className="font-medium text-[var(--m-fg)] truncate text-sm">{user.name}</p>
                                                        <p className="text-xs text-[var(--m-fg-subtle)] truncate">{user.email}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <Link to="/my-listings" className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--m-fg-muted)] hover:text-[var(--m-fg)] hover:bg-[var(--m-surface)] rounded-[8px] transition-colors">
                                                            <ShoppingBag size={16} /> My Listings
                                                        </Link>
                                                        <Link to="/messages" className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--m-fg-muted)] hover:text-[var(--m-fg)] hover:bg-[var(--m-surface)] rounded-[8px] transition-colors">
                                                            <MessageSquare size={16} /> Messages
                                                        </Link>
                                                        <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--m-fg-muted)] hover:text-[var(--m-fg)] hover:bg-[var(--m-surface)] rounded-[8px] transition-colors">
                                                            <Home size={16} /> Dashboard
                                                        </Link>
                                                        <div className="h-px bg-[var(--m-hairline)] my-1.5" />
                                                        <button
                                                            onClick={logout}
                                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-[8px] transition-colors"
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
                                <Link to="/login" className="m-btn-ghost">
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* --- MOBILE NAV (Bottom Dock) --- */}
            <nav
                className="lg:hidden fixed left-1/2 -translate-x-1/2 z-50 bg-[var(--m-bar-bg)] backdrop-blur-xl border border-[var(--m-hairline)] rounded-[18px] px-3 py-3 flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
            >
                {[
                    { path: '/', icon: Home },
                    { path: '/browse', icon: Search },
                ].map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`flex items-center justify-center w-10 h-10 rounded-[10px] transition-colors ${location.pathname === link.path ? 'text-[var(--m-accent)]' : 'text-[var(--m-fg-subtle)] hover:text-[var(--m-fg)]'}`}
                    >
                        <link.icon size={21} />
                    </Link>
                ))}

                {/* Center Add Button */}
                <div className="relative flex items-center justify-center" style={{ width: '3.25rem', marginTop: '-0.5rem', marginBottom: '-0.5rem' }}>
                    <Link to="/sell" className="flex items-center justify-center w-14 h-14 bg-[var(--m-accent)] rounded-full text-black hover:brightness-110 transition-all border-4 border-[#08080B]">
                        <Plus size={26} strokeWidth={2.5} />
                    </Link>
                </div>

                {[
                    { path: '/messages', icon: MessageSquare },
                    { path: isAuthenticated ? `/profile/${user?.id}` : '/login', icon: User },
                ].map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`flex items-center justify-center w-10 h-10 rounded-[10px] transition-colors ${location.pathname.startsWith(link.path) ? 'text-[var(--m-accent)]' : 'text-[var(--m-fg-subtle)] hover:text-[var(--m-fg)]'}`}
                    >
                        <link.icon size={21} />
                    </Link>
                ))}

                {/* Mobile theme toggle */}
                <ThemeIndicator theme={currentTheme} onToggle={toggleTheme} />
            </nav>
        </>
    );
};

export default Header;
