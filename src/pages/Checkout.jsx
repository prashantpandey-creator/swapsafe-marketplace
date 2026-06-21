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
    const [razorpayKey, setRazorpayKey] = useState(null)

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
                        console.warn('Listing not found for checkout:', id)
                    }
                } catch (err) {
                    console.error("Error loading product", err)
                }
            }
            setLoading(false)
        }

        const loadPaymentConfig = async () => {
            try {
                const config = await paymentAPI.getConfig()
                setRazorpayKey(config.keyId)
            } catch (err) {
                console.error('Failed to load payment config:', err)
            }
        }

        loadProducts()
        loadPaymentConfig()
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
        if (!products || products.length === 0) {
            alert('No items to checkout.')
            return
        }
        setIsProcessing(true)
        try {
            const listingId = products[0]?._id || products[0]?.id
            const deliveryAddress = deliveryMethod === 'delivery' ? shippingAddress : null

            if (paymentMethod === 'credits') {
                const result = await paymentAPI.createCreditOrder({
                    listingId,
                    deliveryMethod,
                    deliveryAddress
                })

                if (result.success) {
                    setPlacedOrderId(result.order.orderId)
                    if (isCartCheckout) clearCart()
                    setOrderComplete(true)
                } else {
                    throw new Error(result.message || 'Payment failed')
                }
            } else {
                if (!razorpayKey) {
                    throw new Error('Payment gateway not available')
                }

                const orderData = await paymentAPI.createOrder({
                    listingId,
                    deliveryMethod,
                    deliveryAddress
                })

                const options = {
                    key: razorpayKey,
                    amount: orderData.order.amount,
                    currency: orderData.order.currency,
                    name: 'Guardian Market',
                    description: products[0]?.title,
                    order_id: orderData.order.razorpayOrderId,
                    handler: async function (response) {
                        try {
                            const verification = await paymentAPI.verifyPayment({
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                                orderId: orderData.order.id
                            })

                            if (verification.success) {
                                setPlacedOrderId(verification.order.orderId)
                                if (isCartCheckout) clearCart()
                                setOrderComplete(true)
                            } else {
                                throw new Error('Payment verification failed')
                            }
                        } catch (err) {
                            alert(err.message || 'Payment verification failed')
                        } finally {
                            setIsProcessing(false)
                        }
                    },
                    modal: {
                        ondismiss: function () {
                            setIsProcessing(false)
                        }
                    },
                    prefill: {
                        name: user?.name,
                        email: user?.email,
                        contact: user?.phone || ''
                    },
                    theme: {
                        color: '#D4AF37'
                    }
                }

                const rzp = new window.Razorpay(options)
                rzp.on('payment.failed', function (response) {
                    alert('Payment failed: ' + response.error.description)
                    setIsProcessing(false)
                })
                rzp.open()
                return
            }
        } catch (error) {
            console.error("Payment failed", error)
            alert(error.message || "Payment failed. Please try again.")
        } finally {
            if (paymentMethod === 'credits') {
                setIsProcessing(false)
            }
        }
    }

    if (loading) return (
        <div className="min-h-screen pt-24 flex items-center justify-center">
            <Loader className="w-8 h-8 animate-spin" style={{ color: 'var(--m-accent)' }} />
        </div>
    )

    if (orderComplete) {
        return (
            <div className="min-h-screen pt-24 pb-20 px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xl mx-auto p-8 text-center"
                    style={{ background: 'var(--m-surface-strong)', border: '1px solid var(--m-hairline)', borderRadius: 'var(--m-radius)' }}
                >
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(74,222,128,0.1)' }}>
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--m-fg)' }}>Payment Successful!</h1>
                    <p className="mb-8" style={{ color: 'var(--m-fg-muted)' }}>
                        Your payment of <span className="font-bold" style={{ color: 'var(--m-fg)' }}>{formatPrice(total)}</span> has been securely held in escrow.
                    </p>

                    <div className="p-4 mb-8 text-left" style={{ background: 'var(--m-surface)', borderRadius: 'var(--m-radius)' }}>
                        <p className="text-sm mb-1" style={{ color: 'var(--m-fg-subtle)' }}>Order ID</p>
                        <p className="font-mono" style={{ color: 'var(--m-fg)' }}>{placedOrderId}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link to={`/tracker/${placedOrderId}`} className="m-btn-accent w-full py-4 font-bold text-center block" style={{ borderRadius: 'var(--m-radius)' }}>
                            Track Order
                        </Link>
                        <Link to="/browse" className="m-btn-ghost w-full py-4 font-bold text-center block" style={{ borderRadius: 'var(--m-radius)' }}>
                            Continue Shopping
                        </Link>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-24 pb-20 px-4">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="m-iconbtn">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--m-fg)' }}>Secure Checkout</h1>
                    <div className="ml-auto flex items-center gap-2 text-green-400 px-3 py-1" style={{ background: 'rgba(74,222,128,0.08)', borderRadius: 'var(--m-radius)', border: '1px solid var(--m-hairline)' }}>
                        <Lock size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">Encrypted</span>
                    </div>
                </div>

                {/* Trust / Escrow Banner */}
                <div className="p-4 mb-8" style={{ borderRadius: 'var(--m-radius)', background: 'var(--m-surface)', border: '1px solid var(--m-hairline)' }}>
                    <div className="flex gap-4 items-start">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-green-400" style={{ background: 'rgba(74,222,128,0.1)' }}>
                            <Shield size={20} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <h4 className="text-sm font-bold" style={{ color: 'var(--m-fg)' }}>Escrow Protection Active</h4>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--m-fg-muted)' }}>Your money is held safely in escrow until you verify and approve the device.</p>
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
                                <div key={s.num} className="flex items-center gap-3" style={{ color: step >= s.num ? 'var(--m-accent)' : 'var(--m-fg-subtle)' }}>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{
                                        border: `2px solid ${step >= s.num ? 'var(--m-accent)' : 'var(--m-hairline)'}`,
                                        background: step >= s.num ? 'rgba(212,175,55,0.1)' : 'transparent'
                                    }}>
                                        {s.num}
                                    </div>
                                    <span className="hidden sm:block font-medium">{s.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Step 1: Review */}
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="checkout-section p-6" style={{ background: 'var(--m-surface-strong)', border: '1px solid var(--m-hairline)', borderRadius: 'var(--m-radius)' }}>
                                    <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--m-fg)' }}>Order Items</h2>
                                    {products.map((product, idx) => (
                                        <div key={idx} className="product-review-card p-4 flex gap-4 items-center mb-4" style={{ background: 'var(--m-surface)', border: '1px solid var(--m-hairline)', borderRadius: 'var(--m-radius)' }}>
                                            <div className="h-20 w-20 shrink-0 overflow-hidden" style={{ borderRadius: 'var(--m-radius)', background: 'var(--m-surface-strong)', border: '1px solid var(--m-hairline)' }}>
                                                <img src={product.images?.[0] || product.image} alt={product.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex flex-col flex-1 gap-1">
                                                <h3 className="font-bold text-base leading-snug" style={{ color: 'var(--m-fg)' }}>{product.title}</h3>
                                                <p className="text-sm" style={{ color: 'var(--m-fg-muted)' }}>Sold by {product.seller?.name || 'Verified Seller'}</p>
                                                <div className="mt-1 flex items-center justify-between">
                                                    <span className="text-lg font-bold" style={{ color: 'var(--m-fg)' }}>{formatPrice(product.price)}</span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Shield size={12} className="text-green-500" />
                                                    <span className="text-xs font-medium text-green-400">SwapSafe Shield</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--m-hairline)' }}>
                                        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--m-fg)' }}>Choose Delivery Method</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <label className="cursor-pointer p-4 transition-all" style={{
                                                borderRadius: 'var(--m-radius)',
                                                border: `2px solid ${deliveryMethod === 'meetup' ? 'var(--m-accent)' : 'var(--m-hairline)'}`,
                                                background: deliveryMethod === 'meetup' ? 'rgba(212,175,55,0.05)' : 'var(--m-surface)'
                                            }}>
                                                <input type="radio" className="hidden" checked={deliveryMethod === 'meetup'} onChange={() => setDeliveryMethod('meetup')} />
                                                <div className="flex items-center gap-3 mb-2">
                                                    <MapPin style={{ color: deliveryMethod === 'meetup' ? 'var(--m-accent)' : 'var(--m-fg-muted)' }} />
                                                    <span className="font-bold" style={{ color: 'var(--m-fg)' }}>Safe Meetup</span>
                                                </div>
                                                <p className="text-sm" style={{ color: 'var(--m-fg-muted)' }}>Meet at a verified SwapSafe Zone</p>
                                                <p className="text-green-400 text-sm font-bold mt-2">Free</p>
                                            </label>

                                            <label className="cursor-pointer p-4 transition-all" style={{
                                                borderRadius: 'var(--m-radius)',
                                                border: `2px solid ${deliveryMethod === 'delivery' ? 'var(--m-accent)' : 'var(--m-hairline)'}`,
                                                background: deliveryMethod === 'delivery' ? 'rgba(212,175,55,0.05)' : 'var(--m-surface)'
                                            }}>
                                                <input type="radio" className="hidden" checked={deliveryMethod === 'delivery'} onChange={() => setDeliveryMethod('delivery')} />
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Truck style={{ color: deliveryMethod === 'delivery' ? 'var(--m-accent)' : 'var(--m-fg-muted)' }} />
                                                    <span className="font-bold" style={{ color: 'var(--m-fg)' }}>Secure Delivery</span>
                                                </div>
                                                <p className="text-sm" style={{ color: 'var(--m-fg-muted)' }}>Insured shipping via Delhivery</p>
                                                <p className="text-sm font-bold mt-2" style={{ color: 'var(--m-fg)' }}>₹149</p>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Delivery Details */}
                        {step === 2 && (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="checkout-section p-6" style={{ background: 'var(--m-surface-strong)', border: '1px solid var(--m-hairline)', borderRadius: 'var(--m-radius)' }}>
                                    <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--m-fg)' }}>
                                        {deliveryMethod === 'meetup' ? 'Schedule Meetup' : 'Shipping Address'}
                                    </h2>

                                    {deliveryMethod === 'meetup' ? (
                                        <div className="space-y-6">
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm mb-2" style={{ color: 'var(--m-fg-muted)' }}>Preferred Date</label>
                                                    <input type="date" value={meetupDate} onChange={(e) => setMeetupDate(e.target.value)} className="w-full p-3 outline-none" style={{ background: 'var(--m-surface)', border: '1px solid var(--m-hairline)', borderRadius: 'var(--m-radius)', color: 'var(--m-fg)', transition: 'border-color var(--m-ease)' }} />
                                                </div>
                                                <div>
                                                    <label className="block text-sm mb-2" style={{ color: 'var(--m-fg-muted)' }}>Preferred Time</label>
                                                    <select value={meetupTime} onChange={(e) => setMeetupTime(e.target.value)} className="w-full p-3 outline-none" style={{ background: 'var(--m-surface)', border: '1px solid var(--m-hairline)', borderRadius: 'var(--m-radius)', color: 'var(--m-fg)', transition: 'border-color var(--m-ease)' }}>
                                                        <option value="">Select Time</option>
                                                        <option>10:00 AM</option>
                                                        <option>02:00 PM</option>
                                                        <option>06:00 PM</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm mb-3" style={{ color: 'var(--m-fg-muted)' }}>Select Safe Zone</label>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {filteredZones.map(zone => (
                                                        <div
                                                            key={zone.id}
                                                            onClick={() => setSelectedZone(zone)}
                                                            className="p-4 cursor-pointer transition-all"
                                                            style={{
                                                                borderRadius: 'var(--m-radius)',
                                                                border: `1px solid ${selectedZone?.id === zone.id ? 'var(--m-accent)' : 'var(--m-hairline)'}`,
                                                                background: selectedZone?.id === zone.id ? 'rgba(212,175,55,0.05)' : 'var(--m-surface)'
                                                            }}
                                                        >
                                                            <strong className="block mb-1" style={{ color: 'var(--m-fg)' }}>{zone.name}</strong>
                                                            <span className="text-xs" style={{ color: 'var(--m-fg-muted)' }}>{zone.type} • {zone.city}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <input type="text" placeholder="Full Name" value={shippingAddress.name} onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })} className="w-full p-3 outline-none" style={{ background: 'var(--m-surface)', border: '1px solid var(--m-hairline)', borderRadius: 'var(--m-radius)', color: 'var(--m-fg)', transition: 'border-color var(--m-ease)' }} />
                                            <input type="text" placeholder="Full Address" value={shippingAddress.address} onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })} className="w-full p-3 outline-none" style={{ background: 'var(--m-surface)', border: '1px solid var(--m-hairline)', borderRadius: 'var(--m-radius)', color: 'var(--m-fg)', transition: 'border-color var(--m-ease)' }} />
                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="text" placeholder="City" value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} className="w-full p-3 outline-none" style={{ background: 'var(--m-surface)', border: '1px solid var(--m-hairline)', borderRadius: 'var(--m-radius)', color: 'var(--m-fg)', transition: 'border-color var(--m-ease)' }} />
                                                <input type="text" placeholder="Pincode" value={shippingAddress.pincode} onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })} className="w-full p-3 outline-none" style={{ background: 'var(--m-surface)', border: '1px solid var(--m-hairline)', borderRadius: 'var(--m-radius)', color: 'var(--m-fg)', transition: 'border-color var(--m-ease)' }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Payment */}
                        {step === 3 && (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="checkout-section p-6" style={{ background: 'var(--m-surface-strong)', border: '1px solid var(--m-hairline)', borderRadius: 'var(--m-radius)' }}>
                                    <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--m-fg)' }}>Payment Method</h2>

                                    <div className="space-y-4">
                                        <label className="relative flex cursor-pointer items-center justify-between p-4 transition-all" style={{
                                            borderRadius: 'var(--m-radius)',
                                            border: `1px solid ${paymentMethod === 'credits' ? 'var(--m-accent)' : 'var(--m-hairline)'}`,
                                            background: paymentMethod === 'credits' ? 'rgba(212,175,55,0.05)' : 'transparent'
                                        }}>
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center" style={{ borderRadius: 'var(--m-radius)', background: 'var(--m-surface)', color: 'var(--m-accent)' }}>
                                                    <Shield size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold" style={{ color: 'var(--m-fg)' }}>Legion Credits</span>
                                                    <span className="text-xs" style={{ color: 'var(--m-accent)' }}>Balance: {formatPrice(user?.credits || 0)}</span>
                                                </div>
                                            </div>
                                            <input type="radio" className="hidden" checked={paymentMethod === 'credits'} onChange={() => setPaymentMethod('credits')} />
                                            <div style={{ color: paymentMethod === 'credits' ? 'var(--m-accent)' : 'var(--m-fg-subtle)' }}>
                                                {paymentMethod === 'credits' ? <CheckCircle size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                                            </div>
                                        </label>

                                        <label className="relative flex cursor-pointer items-center justify-between p-4 transition-all" style={{
                                            borderRadius: 'var(--m-radius)',
                                            border: `1px solid ${paymentMethod === 'card' ? 'var(--m-accent)' : 'var(--m-hairline)'}`,
                                            background: paymentMethod === 'card' ? 'rgba(212,175,55,0.05)' : 'transparent'
                                        }}>
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center" style={{ borderRadius: 'var(--m-radius)', background: 'var(--m-surface)', color: 'var(--m-fg-muted)' }}>
                                                    <CreditCard size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold" style={{ color: 'var(--m-fg)' }}>Credit / Debit Card</span>
                                                    <span className="text-xs" style={{ color: 'var(--m-fg-muted)' }}>Instantly processing via Stripe</span>
                                                </div>
                                            </div>
                                            <input type="radio" className="hidden" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                                            <div style={{ color: paymentMethod === 'card' ? 'var(--m-accent)' : 'var(--m-fg-subtle)' }}>
                                                {paymentMethod === 'card' ? <CheckCircle size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                                            </div>
                                        </label>
                                    </div>

                                    {paymentMethod === 'card' && (
                                        <div className="mt-6 p-4" style={{ background: 'var(--m-surface)', borderRadius: 'var(--m-radius)', border: '1px solid var(--m-hairline)' }}>
                                            <div className="space-y-4">
                                                <input type="text" placeholder="Card Number" value={cardDetails.number} onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })} className="w-full p-3 outline-none" style={{ background: 'var(--m-surface-strong)', border: '1px solid var(--m-hairline)', borderRadius: 'var(--m-radius)', color: 'var(--m-fg)', transition: 'border-color var(--m-ease)' }} />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input type="text" placeholder="MM/YY" value={cardDetails.expiry} onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })} className="w-full p-3 outline-none" style={{ background: 'var(--m-surface-strong)', border: '1px solid var(--m-hairline)', borderRadius: 'var(--m-radius)', color: 'var(--m-fg)', transition: 'border-color var(--m-ease)' }} />
                                                    <input type="text" placeholder="CVV" value={cardDetails.cvv} onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })} className="w-full p-3 outline-none" style={{ background: 'var(--m-surface-strong)', border: '1px solid var(--m-hairline)', borderRadius: 'var(--m-radius)', color: 'var(--m-fg)', transition: 'border-color var(--m-ease)' }} />
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
                        <div className="sticky top-24 p-6" style={{ background: 'var(--m-surface-strong)', border: '1px solid var(--m-hairline)', borderRadius: 'var(--m-radius)' }}>
                            <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--m-fg)' }}>Order Summary</h3>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between" style={{ color: 'var(--m-fg-muted)' }}>
                                    <span>Subtotal</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between" style={{ color: 'var(--m-fg-muted)' }}>
                                    <span>Platform Fee</span>
                                    <span>{formatPrice(platformFee)}</span>
                                </div>
                                <div className="flex justify-between" style={{ color: 'var(--m-fg-muted)' }}>
                                    <span>Shipping</span>
                                    <span>{deliveryMethod === 'delivery' ? formatPrice(shippingFee) : 'Free'}</span>
                                </div>
                                <div className="pt-3 flex justify-between font-bold text-lg" style={{ borderTop: '1px solid var(--m-hairline)', color: 'var(--m-fg)' }}>
                                    <span>Total</span>
                                    <span style={{ color: 'var(--m-accent)' }}>{formatPrice(total)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={!canProceed() || isProcessing}
                                className="m-btn-accent w-full py-4 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ borderRadius: 'var(--m-radius)', transition: 'var(--m-ease)' }}
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

                            <div className="mt-6 flex items-center gap-2 text-xs justify-center" style={{ color: 'var(--m-fg-subtle)' }}>
                                <Lock size={12} />
                                <span>Payments are 100% encrypted &amp; secure</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl px-6 py-4 pb-8 z-40" style={{ background: 'rgba(10,10,15,0.9)', borderTop: '1px solid var(--m-hairline)' }}>
                <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--m-fg-muted)' }}>Total to Pay</span>
                        <span className="text-xl font-bold" style={{ color: 'var(--m-fg)' }}>{formatPrice(total)}</span>
                    </div>
                    <button
                        onClick={handleNext}
                        disabled={!canProceed() || isProcessing}
                        className="m-btn-accent flex-1 max-w-md h-12 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ borderRadius: 'var(--m-radius)', transition: 'var(--m-ease)' }}
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
