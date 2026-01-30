import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Twitter, Facebook, Instagram, Linkedin, Heart } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-legion-bg border-t border-white/10 pt-20 pb-10">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div>
                        <Link to="/" className="flex items-center gap-2 mb-6 group">
                            <Shield className="w-8 h-8 text-legion-gold" />
                            <span className="text-2xl font-black text-white">
                                BUYERS<span className="text-legion-gold">LEGION</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            The Brotherhood of Verified Traders. <br />
                            Buy, sell, and connect in a marketplace built on honor, trust, and advanced AI protection.
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-legion-gold hover:text-legion-bg transition-all">
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-6">Marketplace</h4>
                        <ul className="space-y-4">
                            <li><Link to="/browse" className="text-gray-400 hover:text-legion-gold transition-colors">Browse Listings</Link></li>
                            <li><Link to="/sell" className="text-gray-400 hover:text-legion-gold transition-colors">Sell an Item</Link></li>
                            <li><Link to="/categories" className="text-gray-400 hover:text-legion-gold transition-colors">Categories</Link></li>
                            <li><Link to="/community" className="text-gray-400 hover:text-legion-gold transition-colors">Community Feed</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-6">Support & Legal</h4>
                        <ul className="space-y-4">
                            <li><Link to="/help" className="text-gray-400 hover:text-legion-gold transition-colors">Help Center</Link></li>
                            <li><Link to="/safety" className="text-gray-400 hover:text-legion-gold transition-colors">Trust & Safety</Link></li>
                            <li><Link to="/privacy" className="text-gray-400 hover:text-legion-gold transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="text-gray-400 hover:text-legion-gold transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-6">Stay Connected</h4>
                        <p className="text-gray-400 mb-4">Join the legion news network.</p>
                        <form className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-legion-gold flex-1"
                            />
                            <button className="bg-legion-gold text-legion-bg font-bold px-4 py-3 rounded-lg hover:bg-yellow-400 transition-colors">
                                Join
                            </button>
                        </form>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">
                        © {currentYear} Buyers Legion. All rights reserved.
                    </p>
                    <p className="text-gray-500 text-sm flex items-center gap-1">
                        Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for the Brotherhood.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
