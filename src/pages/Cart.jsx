import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../data/mockData'
import './Browse.css' // Reusing glass styles

function Cart() {
    const { items, removeFromCart, total, clearCart } = useCart()

    const platformFee = Math.round(total * 0.02)
    const finalTotal = total + platformFee

    if (items.length === 0) {
        return (
            <div className="container min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag size={48} className="text-gray-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
                <p className="text-gray-400 mb-8 max-w-md">
                    Looks like you haven't added any items yet. Explore the marketplace to find unique treasures.
                </p>
                <Link to="/browse" className="btn btn-primary px-8 py-3">
                    Start Exploring
                </Link>
            </div>
        )
    }

    return (
        <div className="container py-8">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <ShoppingBag className="text-legion-gold" />
                Your Cart
                <span className="text-lg font-normal text-gray-400 ml-2">({items.length} items)</span>
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items List */}
                <div className="lg:col-span-2 space-y-4">
                    <AnimatePresence>
                        {items.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-legion-card border border-white/10 rounded-xl p-4 flex gap-4 group hover:border-white/20 transition-all"
                            >
                                <Link to={`/product/${item.id}`} className="shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-white/5">
                                    <img
                                        src={item.images?.[0] || item.image || 'https://via.placeholder.com/150'}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </Link>

                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start gap-4">
                                            <Link to={`/product/${item.id}`} className="text-lg font-semibold text-white hover:text-legion-gold transition-colors line-clamp-1">
                                                {item.title}
                                            </Link>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                                title="Remove item"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">Sold by {item.seller?.name || 'Unknown Seller'}</p>
                                    </div>

                                    <div className="flex justify-between items-end mt-2">
                                        <div className="text-legion-gold font-bold text-lg">
                                            {formatPrice(item.price)}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <button
                        onClick={clearCart}
                        className="text-red-400 text-sm hover:text-red-300 transition-colors flex items-center gap-2 mt-4"
                    >
                        <Trash2 size={14} /> Clear Cart
                    </button>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-legion-card border border-white/10 rounded-xl p-6 sticky top-24">
                        <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-gray-300">
                                <span>Subtotal ({items.length} items)</span>
                                <span>{formatPrice(total)}</span>
                            </div>
                            <div className="flex justify-between text-gray-300">
                                <span>Processing Fee (2%)</span>
                                <span>{formatPrice(platformFee)}</span>
                            </div>
                            <div className="flex justify-between text-gray-300">
                                <span>Shipping</span>
                                <span className="text-xs text-gray-500">(Calculated at checkout)</span>
                            </div>
                            <div className="h-px bg-white/10 my-4"></div>
                            <div className="flex justify-between text-white font-bold text-lg">
                                <span>Est. Total</span>
                                <span>{formatPrice(finalTotal)}</span>
                            </div>
                        </div>

                        <Link
                            to="/checkout/cart" // Special ID 'cart' triggers multi-item checkout
                            className="btn btn-primary w-full py-3 flex items-center justify-center gap-2 font-bold mb-4"
                        >
                            Proceed to Checkout <ArrowRight size={18} />
                        </Link>

                        <div className="flex items-center gap-2 justify-center text-xs text-green-400 bg-green-400/10 py-2 rounded-lg border border-green-400/20">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            Secure Escrow Payment
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Cart
