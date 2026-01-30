import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, Search, User, MessageSquare, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Header = () => {
    const { user, logout } = useAuth();
    const { cartItems } = useCart();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-legion-bg/90 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-5'
                }`}
        >
            <div className="container mx-auto px-4 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="relative">
                        <Shield className="w-8 h-8 text-legion-gold fill-legion-gold/20" />
                        <motion.div
                            className="absolute inset-0 bg-legion-gold/40 blur-lg rounded-full"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                    </div>
                    <span className="text-2xl font-black tracking-tight text-white group-hover:text-legion-gold transition-colors">
                        BUYERS<span className="text-legion-gold">LEGION</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link to="/browse" className="text-gray-300 hover:text-white font-medium transition-colors">Marketplace</Link>
                    <Link to="/community" className="text-gray-300 hover:text-white font-medium transition-colors">Brotherhood</Link>
                    <Link to="/sell" className="text-gray-300 hover:text-white font-medium transition-colors">Sell Item</Link>
                </nav>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <Link to="/search" className="p-2 text-gray-300 hover:text-legion-gold transition-colors">
                        <Search className="w-5 h-5" />
                    </Link>

                    {user ? (
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
                            <div className="relative group">
                                <Link to="/dashboard">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-legion-gold to-yellow-600 p-[2px]">
                                        <div className="w-full h-full rounded-full bg-legion-card flex items-center justify-center overflow-hidden">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-5 h-5 text-gray-300" />
                                            )}
                                        </div>
                                    </div>
                                </Link>
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
                            {user ? (
                                <>
                                    <Link to="/dashboard" className="text-gray-300 hover:text-white py-2">Dashboard</Link>
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
