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
                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--m-surface)' }}>
                    <ShoppingBag size={48} style={{ color: 'var(--m-fg-subtle)' }} />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--m-fg)' }}>Your cart is empty</h2>
                <p className="mb-8 max-w-md" style={{ color: 'var(--m-fg-muted)' }}>
                    Looks like you haven't added any items yet. Explore the marketplace to find unique treasures.
                </p>
                <Link to="/browse" className="m-btn-accent px-8 py-3">
                    Start Exploring
                </Link>
            </div>
        )
    }

    return (
        <div className="container py-8">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3" style={{ color: 'var(--m-fg)' }}>
                <ShoppingBag style={{ color: 'var(--m-accent)' }} />
                Your Cart
                <span className="text-lg font-normal ml-2" style={{ color: 'var(--m-fg-muted)' }}>({items.length} items)</span>
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
                                className="glass-panel p-4 flex gap-4 group transition-all"
                                style={{ borderColor: 'var(--m-hairline)', borderRadius: 'var(--m-radius)' }}
                            >
                                <Link to={`/product/${item.id}`} className="shrink-0 w-24 h-24 overflow-hidden" style={{ borderRadius: 'var(--m-radius)', background: 'var(--m-surface)' }}>
                                    <img
                                        src={item.images?.[0] || item.image || 'https://via.placeholder.com/150'}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </Link>

                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start gap-4">
                                            <Link to={`/product/${item.id}`} className="text-lg font-semibold line-clamp-1 transition-colors" style={{ color: 'var(--m-fg)', transitionDuration: 'var(--m-ease)' }}>
                                                {item.title}
                                            </Link>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="transition-colors p-1"
                                                style={{ color: 'var(--m-fg-subtle)', transitionDuration: 'var(--m-ease)' }}
                                                title="Remove item"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        <p className="text-sm mt-1" style={{ color: 'var(--m-fg-muted)' }}>Sold by {item.seller?.name || 'Unknown Seller'}</p>
                                    </div>

                                    <div className="flex justify-between items-end mt-2">
                                        <div className="font-bold text-lg" style={{ color: 'var(--m-accent)' }}>
                                            {formatPrice(item.price)}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <button
                        onClick={clearCart}
                        className="text-sm transition-colors flex items-center gap-2 mt-4"
                        style={{ color: 'var(--m-fg-muted)', transitionDuration: 'var(--m-ease)' }}
                    >
                        <Trash2 size={14} /> Clear Cart
                    </button>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="glass-panel p-6 sticky top-24" style={{ borderRadius: 'var(--m-radius)' }}>
                        <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--m-fg)' }}>Order Summary</h3>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between" style={{ color: 'var(--m-fg-muted)' }}>
                                <span>Subtotal ({items.length} items)</span>
                                <span>{formatPrice(total)}</span>
                            </div>
                            <div className="flex justify-between" style={{ color: 'var(--m-fg-muted)' }}>
                                <span>Processing Fee (2%)</span>
                                <span>{formatPrice(platformFee)}</span>
                            </div>
                            <div className="flex justify-between" style={{ color: 'var(--m-fg-muted)' }}>
                                <span>Shipping</span>
                                <span className="text-xs" style={{ color: 'var(--m-fg-subtle)' }}>(Calculated at checkout)</span>
                            </div>
                            <div className="h-px my-4" style={{ background: 'var(--m-hairline)' }}></div>
                            <div className="flex justify-between font-bold text-lg" style={{ color: 'var(--m-fg)' }}>
                                <span>Est. Total</span>
                                <span>{formatPrice(finalTotal)}</span>
                            </div>
                        </div>

                        <Link
                            to="/checkout/cart"
                            className="m-btn-accent w-full py-3 flex items-center justify-center gap-2 font-bold mb-4"
                        >
                            Proceed to Checkout <ArrowRight size={18} />
                        </Link>

                        <div className="flex items-center gap-2 justify-center text-xs py-2 border" style={{ color: 'var(--m-fg-muted)', background: 'var(--m-surface)', borderColor: 'var(--m-hairline)', borderRadius: 'var(--m-radius)' }}>
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
