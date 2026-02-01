import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Shield, Users, Zap, ArrowRight, Award, Box } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { listingsAPI } from '../services/api';
import ProductCard from '../components/common/ProductCard';

const Landing = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                // Fetch random or featured listings
                const data = await listingsAPI.getAll({ limit: 4 });
                setSuggestedProducts(data.listings || []);
            } catch (err) {
                console.error("Failed to fetch suggestions", err);
            } finally {
                setLoadingSuggestions(false);
            }
        };
        fetchSuggestions();
    }, []);

    const handleSearch = () => {
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
        }
    };

    return (
        <div className="min-h-screen overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center justify-center pt-20">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <motion.div
                        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-legion-gold/20 rounded-full blur-[100px]"
                        animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] bg-legion-accent/20 rounded-full blur-[120px]"
                        animate={{ x: [0, -50, 0], y: [0, 100, 0] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-legion-gold animate-pulse"></span>
                            <span className="text-gray-300 text-sm font-medium">The #1 Trusted Marketplace Community</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight tracking-tight">
                            JOIN THE <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-legion-gold via-yellow-200 to-legion-gold animate-gradient-x">
                                BROTHERHOOD
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 font-light">
                            Buy, sell, and trade with confidence. A revolutionary marketplace built on <span className="text-white font-semibold">trust</span>, <span className="text-white font-semibold">AI verification</span>, and <span className="text-white font-semibold">community</span>.
                        </p>

                        {/* Search Bar */}
                        <div className="max-w-3xl mx-auto relative mb-12 group">
                            <input
                                type="text"
                                placeholder="What are you looking for today?"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full h-16 pl-6 pr-32 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-legion-gold/50 focus:bg-white/10 transition-all backdrop-blur-md shadow-2xl"
                            />
                            <button
                                onClick={handleSearch}
                                className="absolute right-2 top-2 h-12 px-8 bg-legion-gold text-legion-bg font-bold rounded-xl hover:bg-yellow-400 transition-colors flex items-center gap-2"
                            >
                                <Search className="w-5 h-5" />
                                <span>Search</span>
                            </button>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-wrap justify-center gap-4 mb-16">
                            <Link to="/studio" className="btn btn-outline flex items-center gap-2">
                                <Box className="w-5 h-5" /> Try AI 3D Studio
                            </Link>
                            <Link to="/sell" className="btn btn-primary flex items-center gap-2">
                                Start Selling
                            </Link>
                        </div>

                        {/* Stats / Trust Indicators */}
                        <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-gray-400">
                            <div className="flex items-center gap-3">
                                <Shield className="w-6 h-6 text-legion-accent" />
                                <span className="text-lg">AI Verified Listings</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Users className="w-6 h-6 text-legion-gold" />
                                <span className="text-lg">10k+ Legion Members</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Zap className="w-6 h-6 text-purple-400" />
                                <span className="text-lg">Instant Transitions</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Suggested Products Section */}
            <section className="py-12 bg-black/20">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Suggested For You</h2>
                            <p className="text-gray-400 text-sm">Hand-picked gear from top sellers</p>
                        </div>
                        <Link to="/browse" className="text-legion-gold hover:text-white transition-colors text-sm font-medium">
                            View More
                        </Link>
                    </div>

                    {loadingSuggestions ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-white/5 rounded-2xl h-[350px] animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {suggestedProducts.length > 0 ? (
                                suggestedProducts.map((product) => (
                                    <ProductCard key={product.id || product._id} product={product} />
                                ))
                            ) : (
                                <p className="text-gray-400 col-span-full text-center py-10">
                                    No suggestions available right now. Check back later!
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Explore Categories</h2>
                            <p className="text-gray-400">Find exactly what you need from our trusted sellers.</p>
                        </div>
                        <Link to="/browse" className="text-legion-gold hover:text-white transition-colors flex items-center gap-2 font-medium">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {categories.map((cat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -10 }}
                                className="group relative overflow-hidden rounded-2xl aspect-[4/5] cursor-pointer"
                                onClick={() => navigate(`/browse/${cat.name.toLowerCase()}`)}
                            >
                                <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-legion-bg via-legion-bg/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                                <div className="absolute bottom-0 left-0 w-full p-6">
                                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-legion-gold transition-colors">{cat.name}</h3>
                                    <p className="text-gray-300 text-sm">{cat.count} listings</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature Section: The Shield */}
            <section className="py-24 bg-legion-card/30 relative border-y border-white/5">
                <div className="container mx-auto px-4 lg:flex items-center gap-16">
                    <div className="lg:w-1/2 mb-12 lg:mb-0">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            className="relative aspect-square max-w-md mx-auto"
                        >
                            <div className="absolute inset-0 bg-legion-gold/20 rounded-full blur-[80px] animate-pulse" />
                            <Shield className="w-full h-full text-legion-gold drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]" strokeWidth={1} />
                        </motion.div>
                    </div>
                    <div className="lg:w-1/2">
                        <span className="text-legion-gold font-bold tracking-wider text-sm uppercase mb-2 block">Safety First</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">The Ironclad Shield of Trust</h2>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            We don't just facilitate trades; we guarantee them. With our proprietary AI verification system and Aadhaar-backed identity checks, fraud isn't just unlikely—it's impossible.
                        </p>

                        <div className="space-y-6">
                            {[
                                { title: "AI Price Estimation", desc: "Get fair market value instantly." },
                                { title: "Verified Identity", desc: "Know exactly who you're dealing with." },
                                { title: "Secure Payments", desc: "Funds held in escrow until you verify the item." }
                            ].map((feature, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-legion-gold/30 transition-colors">
                                    <div className="w-12 h-12 rounded-full bg-legion-gold/10 flex items-center justify-center shrink-0">
                                        <Award className="w-6 h-6 text-legion-gold" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg">{feature.title}</h4>
                                        <p className="text-gray-400">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const categories = [
    { name: "Electronics", count: "1.2k", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80" },
    { name: "Vehicles", count: "850", image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80" },
    { name: "Fashion", count: "2.3k", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80" },
    { name: "Gaming", count: "500", image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80" },
];

export default Landing;
