import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { listingsAPI, paymentAPI } from '../services/api'
import { formatPrice, safeZones } from '../data/mockData'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Truck, MapPin, CreditCard, CheckCircle, ChevronRight, Lock, Loader, ArrowLeft } from 'lucide-react'
import './Checkout.css'

function Checkout() {
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { isAuthenticated, user } = useAuth()
    const { items: cartItems, clearCart, total: cartTotal } = useCart()

    const isCartCheckout = id === 'cart'
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [step, setStep] = useState(1)
    const [deliveryMethod, setDeliveryMethod] = useState(searchParams.get('method') || 'meetup')
    const [isProcessing, setIsProcessing] = useState(false)
    const [orderComplete, setOrderComplete] = useState(false)
    const [placedOrderId, setPlacedOrderId] = useState(null)

    // Meetup details
    const [meetupDate, setMeetupDate] = useState('')
    const [meetupTime, setMeetupTime] = useState('')
    const [selectedZone, setSelectedZone] = useState(null)

    // Shipping details
    const [shippingAddress, setShippingAddress] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    })

    // Payment details
    const [paymentMethod, setPaymentMethod] = useState('credits')
    const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' })

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/checkout/${id}` } })
            return
        }

        const loadProducts = async () => {
            setLoading(true)
            if (isCartCheckout) {
                if (cartItems.length === 0) {
                    navigate('/cart')
                    return
                }
                setProducts(cartItems)
            } else {
                try {
                    const item = await listingsAPI.getById(id).catch(() => null)
                    if (item) {
                        setProducts([item])
                    } else {
                        const { mockListings } = await import('../data/mockData')
                        const found = mockListings.find(l => l.id === id)
                        if (found) setProducts([found])
                    }
                } catch (err) {
                    console.error("Error loading product", err)
                }
            }
            setLoading(false)
        }

        loadProducts()
    }, [id, isAuthenticated, navigate, isCartCheckout, cartItems])

    // Calculate totals
    const subtotal = products.reduce((sum, item) => sum + item.price, 0)
    const platformFee = Math.round(subtotal * 0.02)
    const shippingFee = deliveryMethod === 'delivery' ? 149 : 0
    const total = subtotal + platformFee + shippingFee

    const primaryLocation = products[0]?.location || { city: 'Mumbai' }
    const filteredZones = safeZones.filter(z =>
        z.city.toLowerCase() === (primaryLocation.city?.toLowerCase() || '')
    )

    const canProceed = () => {
        switch (step) {
            case 1: return true
            case 2:
                if (deliveryMethod === 'meetup') return meetupDate && meetupTime && selectedZone
                else return shippingAddress.address && shippingAddress.city && shippingAddress.state && shippingAddress.pincode && shippingAddress.phone
            case 3:
                if (paymentMethod === 'card') return cardDetails.number.length >= 16 && cardDetails.expiry && cardDetails.cvv.length >= 3 && cardDetails.name
                return true
            default: return true
        }
    }

    const handleNext = () => {
        if (step < 3) setStep(step + 1)
        else handlePayment()
    }

    const handlePayment = async () => {
        setIsProcessing(true)
        try {
            let orderResult;
            // Simulate processing
            await new Promise(resolve => setTimeout(resolve, 2000))
            orderResult = { id: `ORD-${Date.now()}` }

            setPlacedOrderId(orderResult.id)
            if (isCartCheckout) clearCart()
            setOrderComplete(true)
        } catch (error) {
            console.error("Payment failed", error)
            alert(error.message || "Payment failed. Please try again.")
        } finally {
            setIsProcessing(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen pt-24 flex items-center justify-center">
            <Loader className="w-8 h-8 text-legion-gold animate-spin" />
        </div>
    )

    if (orderComplete) {
        return (
            <div className="min-h-screen pt-24 pb-20 px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xl mx-auto bg-legion-card border border-green-500/20 rounded-2xl p-8 text-center"
                >
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
                    <p className="text-gray-400 mb-8">
                        Your payment of <span className="text-white font-bold">{formatPrice(total)}</span> has been securely held in escrow.
                    </p>

                    <div className="bg-white/5 rounded-xl p-4 mb-8 text-left">
                        <p className="text-sm text-gray-500 mb-1">Order ID</p>
                        <p className="text-white font-mono">{placedOrderId}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link to={`/tracker/${placedOrderId}`} className="w-full py-4 bg-legion-gold text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors">
                            Track Order
                        </Link>
                        <Link to="/browse" className="w-full py-4 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
                            Continue Shopping
                        </Link>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 bg-legion-bg">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-white">Secure Checkout</h1>
                    <div className="ml-auto flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
                        <Lock size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">Encrypted</span>
                    </div>
                </div>

                {/* Trust / Escrow Banner */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-900/40 to-green-900/10 border border-green-500/20 p-4 mb-8">
                    <div className="flex gap-4 items-start">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                            <Shield size={20} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <h4 className="text-sm font-bold text-white">Escrow Protection Active</h4>
                            <p className="text-sm text-gray-300 leading-relaxed">Your money is held safely in escrow until you verify and approve the device.</p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Progress Steps */}
                        <div className="flex items-center justify-between mb-8 px-4">
                            {[
                                { num: 1, label: 'Review' },
                                { num: 2, label: 'Delivery' },
                                { num: 3, label: 'Payment' }
                            ].map((s) => (
                                <div key={s.num} className={`flex items-center gap-3 ${step >= s.num ? 'text-legion-gold' : 'text-gray-600'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= s.num ? 'border-legion-gold bg-legion-gold/10' : 'border-gray-700 bg-transparent'}`}>
                                        {s.num}
                                    </div>
                                    <span className="hidden sm:block font-medium">{s.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Step 1: Review */}
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="bg-legion-card border border-white/10 rounded-2xl p-6">
                                    <h2 className="text-xl font-bold text-white mb-6">Order Items</h2>
                                    {products.map((product, idx) => (
                                        <div key={idx} className="glass-panel rounded-2xl p-4 flex gap-4 items-center shadow-lg shadow-black/20 mb-4 border border-white/5 bg-black/20">
                                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#222] border border-white/5">
                                                <img src={product.images?.[0] || product.image} alt={product.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex flex-col flex-1 gap-1">
                                                <h3 className="font-bold text-white text-base leading-snug">{product.title}</h3>
                                                <p className="text-sm text-gray-400">Sold by {product.seller?.name || 'Verified Seller'}</p>
                                                <div className="mt-1 flex items-center justify-between">
                                                    <span className="text-lg font-extrabold text-white">{formatPrice(product.price)}</span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Shield size={12} className="text-green-500" />
                                                    <span className="text-xs font-medium text-green-400">SwapSafe Shield</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="mt-8 pt-6 border-t border-white/10">
                                        <h3 className="text-lg font-bold text-white mb-4">Choose Delivery Method</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${deliveryMethod === 'meetup' ? 'border-legion-gold bg-legion-gold/5' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                                                <input type="radio" className="hidden" checked={deliveryMethod === 'meetup'} onChange={() => setDeliveryMethod('meetup')} />
                                                <div className="flex items-center gap-3 mb-2">
                                                    <MapPin className={deliveryMethod === 'meetup' ? 'text-legion-gold' : 'text-gray-400'} />
                                                    <span className="font-bold text-white">Safe Meetup</span>
                                                </div>
                                                <p className="text-sm text-gray-400">Meet at a verified SwapSafe Zone</p>
                                                <p className="text-green-400 text-sm font-bold mt-2">Free</p>
                                            </label>

                                            <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${deliveryMethod === 'delivery' ? 'border-legion-gold bg-legion-gold/5' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                                                <input type="radio" className="hidden" checked={deliveryMethod === 'delivery'} onChange={() => setDeliveryMethod('delivery')} />
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Truck className={deliveryMethod === 'delivery' ? 'text-legion-gold' : 'text-gray-400'} />
                                                    <span className="font-bold text-white">Secure Delivery</span>
                                                </div>
                                                <p className="text-sm text-gray-400">Insured shipping via Delhivery</p>
                                                <p className="text-white text-sm font-bold mt-2">₹149</p>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Delivery Details */}
                        {step === 2 && (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="bg-legion-card border border-white/10 rounded-2xl p-6">
                                    <h2 className="text-xl font-bold text-white mb-6">
                                        {deliveryMethod === 'meetup' ? 'Schedule Meetup' : 'Shipping Address'}
                                    </h2>

                                    {deliveryMethod === 'meetup' ? (
                                        <div className="space-y-6">
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-2">Preferred Date</label>
                                                    <input type="date" value={meetupDate} onChange={(e) => setMeetupDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-legion-gold outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-2">Preferred Time</label>
                                                    <select value={meetupTime} onChange={(e) => setMeetupTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-legion-gold outline-none">
                                                        <option value="">Select Time</option>
                                                        <option>10:00 AM</option>
                                                        <option>02:00 PM</option>
                                                        <option>06:00 PM</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm text-gray-400 mb-3">Select Safe Zone</label>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {filteredZones.map(zone => (
                                                        <div
                                                            key={zone.id}
                                                            onClick={() => setSelectedZone(zone)}
                                                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedZone?.id === zone.id ? 'border-legion-gold bg-legion-gold/5' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                                                        >
                                                            <strong className="block text-white mb-1">{zone.name}</strong>
                                                            <span className="text-xs text-gray-400">{zone.type} • {zone.city}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <input type="text" placeholder="Full Name" value={shippingAddress.name} onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-legion-gold outline-none" />
                                            <input type="text" placeholder="Full Address" value={shippingAddress.address} onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-legion-gold outline-none" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="text" placeholder="City" value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-legion-gold outline-none" />
                                                <input type="text" placeholder="Pincode" value={shippingAddress.pincode} onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-legion-gold outline-none" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Payment */}
                        {step === 3 && (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="bg-legion-card border border-white/10 rounded-2xl p-6">
                                    <h2 className="text-xl font-bold text-white mb-6">Payment Method</h2>

                                    <div className="space-y-4">
                                        <label className={`relative flex cursor-pointer items-center justify-between p-4 rounded-xl border transition-all ${paymentMethod === 'credits' ? 'bg-legion-gold/5 border-legion-gold' : 'border-white/10 hover:bg-white/5'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2C2C35] text-legion-gold">
                                                    <Shield size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">Legion Credits</span>
                                                    <span className="text-xs text-legion-gold">Balance: {formatPrice(user?.credits || 0)}</span>
                                                </div>
                                            </div>
                                            <input type="radio" className="hidden" checked={paymentMethod === 'credits'} onChange={() => setPaymentMethod('credits')} />
                                            <div className={paymentMethod === 'credits' ? 'text-legion-gold' : 'text-gray-600'}>
                                                {paymentMethod === 'credits' ? <CheckCircle size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                                            </div>
                                        </label>

                                        <label className={`relative flex cursor-pointer items-center justify-between p-4 rounded-xl border transition-all ${paymentMethod === 'card' ? 'bg-legion-gold/5 border-legion-gold' : 'border-white/10 hover:bg-white/5'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2C2C35] text-gray-400">
                                                    <CreditCard size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">Credit / Debit Card</span>
                                                    <span className="text-xs text-gray-400">Instantly processing via Stripe</span>
                                                </div>
                                            </div>
                                            <input type="radio" className="hidden" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                                            <div className={paymentMethod === 'card' ? 'text-legion-gold' : 'text-gray-600'}>
                                                {paymentMethod === 'card' ? <CheckCircle size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                                            </div>
                                        </label>
                                    </div>

                                    {paymentMethod === 'card' && (
                                        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                                            <div className="space-y-4">
                                                <input type="text" placeholder="Card Number" value={cardDetails.number} onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-legion-gold outline-none" />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input type="text" placeholder="MM/YY" value={cardDetails.expiry} onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-legion-gold outline-none" />
                                                    <input type="text" placeholder="CVV" value={cardDetails.cvv} onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-legion-gold outline-none" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-legion-card border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-6">Order Summary</h3>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Platform Fee</span>
                                    <span>{formatPrice(platformFee)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Shipping</span>
                                    <span>{deliveryMethod === 'delivery' ? formatPrice(shippingFee) : 'Free'}</span>
                                </div>
                                <div className="border-t border-white/10 pt-3 flex justify-between text-white font-bold text-lg">
                                    <span>Total</span>
                                    <span className="text-legion-gold">{formatPrice(total)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={!canProceed() || isProcessing}
                                className="w-full py-4 bg-legion-gold text-black font-bold rounded-xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <Loader className="animate-spin" />
                                ) : (
                                    <>
                                        {step === 3 ? `Pay ${formatPrice(total)}` : 'Continue'}
                                        <ChevronRight size={20} />
                                    </>
                                )}
                            </button>

                            <div className="mt-6 flex items-center gap-2 text-xs text-gray-500 justify-center">
                                <Lock size={12} />
                                <span>Payments are 100% encrypted & secure</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0F]/90 backdrop-blur-xl border-t border-white/10 px-6 py-4 pb-8 z-40 transform translate-y-0 transition-transform">
                <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total to Pay</span>
                        <span className="text-xl font-extrabold text-white">{formatPrice(total)}</span>
                    </div>
                    <button
                        onClick={handleNext}
                        disabled={!canProceed() || isProcessing}
                        className="flex-1 max-w-md bg-legion-gold hover:bg-yellow-400 text-black font-bold h-12 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,192,37,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                    >
                        {isProcessing ? (
                            <Loader className="animate-spin" size={20} />
                        ) : (
                            <>
                                <Lock size={18} />
                                {step === 3 ? `Pay ${formatPrice(total)}` : 'Continue'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Checkout
