import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { listingsAPI, paymentAPI } from '../services/api'
import { formatPrice, safeZones } from '../data/mockData'
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
    const [step, setStep] = useState(1) // 1: Review, 2: Delivery/Meetup, 3: Payment, 4: Confirm
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

    if (loading) return <div className="checkout-loading">Loading...</div>
    if (products.length === 0) return <div className="checkout-loading">No items to checkout</div>

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
            if (paymentMethod === 'credits') {
                if ((user?.credits || 0) < total) throw new Error("Insufficient credits balance");

                const orderData = {
                    listingId: products[0]._id || products[0].id,
                    deliveryMethod,
                    deliveryAddress: deliveryMethod === 'delivery' ? shippingAddress : undefined
                };

                const result = await paymentAPI.createCreditOrder(orderData);
                if (result.success) orderResult = { id: result.order.orderId }
                else throw new Error(result.error || "Transaction failed");

            } else {
                await new Promise(resolve => setTimeout(resolve, 2000))
                orderResult = { id: `ORD-${Date.now()}` }
            }

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

    if (orderComplete) {
        return (
            <div className="checkout-success container">
                <div className="success-content">
                    <div className="success-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    </div>
                    <h1>Payment Successful!</h1>
                    <p className="success-message">
                        Your payment of <strong>{formatPrice(total)}</strong> has been securely held in escrow.
                    </p>
                    <div className="success-actions">
                        <Link to={`/tracker/${placedOrderId}`} className="btn btn-primary btn-lg">Track Order</Link>
                        <Link to="/browse" className="btn btn-secondary">Continue Shopping</Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="checkout-page">
            <div className="container">
                <h1>Checkout</h1>
                <div className="checkout-progress">
                    <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <span className="step-number">1</span><span className="step-label">Review</span>
                    </div>
                    <div className="progress-line"></div>
                    <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                        <span className="step-number">2</span><span className="step-label">{deliveryMethod === 'meetup' ? 'Meetup' : 'Shipping'}</span>
                    </div>
                    <div className="progress-line"></div>
                    <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                        <span className="step-number">3</span><span className="step-label">Payment</span>
                    </div>
                </div>

                <div className="checkout-grid">
                    <div className="checkout-main">
                        {step === 1 && (
                            <div className="checkout-section animate-fadeIn">
                                <h2>Review Your Order ({products.length} items)</h2>
                                {products.map((product, index) => (
                                    <div key={index} className="product-review-card mb-4">
                                        <img src={product.images?.[0] || product.image || ''} alt={product.title} />
                                        <div className="product-details">
                                            <h3>{product.title}</h3>
                                            <p className="seller-info">Sold by <strong>{product.seller?.name || 'Seller'}</strong></p>
                                        </div>
                                        <div className="product-price">{formatPrice(product.price)}</div>
                                    </div>
                                ))}
                                <div className="delivery-selection mt-8">
                                    <h3>Select Delivery Method</h3>
                                    <div className="delivery-options">
                                        <label className={`delivery-option ${deliveryMethod === 'meetup' ? 'selected' : ''}`}>
                                            <input type="radio" value="meetup" checked={deliveryMethod === 'meetup'} onChange={() => setDeliveryMethod('meetup')} />
                                            <div className="option-content">
                                                <div className="option-text"><strong>Safe Meetup</strong><span>Meet at verify location</span></div>
                                                <span className="option-price-tag">Free</span>
                                            </div>
                                        </label>
                                        <label className={`delivery-option ${deliveryMethod === 'delivery' ? 'selected' : ''}`}>
                                            <input type="radio" value="delivery" checked={deliveryMethod === 'delivery'} onChange={() => setDeliveryMethod('delivery')} />
                                            <div className="option-content">
                                                <div className="option-text"><strong>Home Delivery</strong><span>3-5 days</span></div>
                                                <span className="option-price-tag">₹149</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="checkout-section animate-fadeIn">
                                <h2>{deliveryMethod === 'meetup' ? 'Schedule Meetup' : 'Shipping Address'}</h2>
                                {deliveryMethod === 'meetup' ? (
                                    <div className="meetup-form">
                                        <label>Select Date</label>
                                        <input type="date" className="form-input mb-4" value={meetupDate} onChange={(e) => setMeetupDate(e.target.value)} />
                                        <label>Select Time</label>
                                        <select className="form-select mb-4" value={meetupTime} onChange={(e) => setMeetupTime(e.target.value)}>
                                            <option value="">Choose time</option>
                                            <option>10:00 AM</option><option>02:00 PM</option><option>06:00 PM</option>
                                        </select>
                                        <label>Safe Meeting Location</label>
                                        <div className="safe-zones">
                                            {filteredZones.map(zone => (
                                                <label key={zone.id} className={`zone-card ${selectedZone?.id === zone.id ? 'selected' : ''}`}>
                                                    <input type="radio" name="zone" checked={selectedZone?.id === zone.id} onChange={() => setSelectedZone(zone)} />
                                                    <div className="zone-info"><strong>{zone.name}</strong><span>{zone.type}</span></div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="shipping-form">
                                        {/* Simplified Shipping Form */}
                                        <input type="text" className="form-input mb-2" placeholder="Start typing address..." value={shippingAddress.address} onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })} />
                                        <input type="text" className="form-input mb-2" placeholder="City" value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} />
                                        <input type="text" className="form-input mb-2" placeholder="State" value={shippingAddress.state} onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })} />
                                        <input type="text" className="form-input mb-2" placeholder="Pincode" value={shippingAddress.pincode} onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })} />
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="checkout-section animate-fadeIn">
                                <h2>Payment Method</h2>
                                <div className="payment-methods">
                                    <label className={`payment-option ${paymentMethod === 'credits' ? 'selected' : ''}`}>
                                        <input type="radio" value="credits" checked={paymentMethod === 'credits'} onChange={() => setPaymentMethod('credits')} />
                                        <div className="payment-icon text-legion-gold">Credits</div>
                                        <div><span className="block font-bold">Legion Credits</span><span>Bal: {formatPrice(user?.credits || 0)}</span></div>
                                    </label>
                                    <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                                        <input type="radio" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                                        <div className="payment-icon">Card</div>
                                        <span>Credit/Debit Card</span>
                                    </label>
                                </div>

                                {paymentMethod === 'credits' && (
                                    <div className="bg-legion-gold/10 border border-legion-gold/30 rounded-xl p-4 mb-6">
                                        <p className="text-sm text-gray-300">Safe, Instant, Escrow-Protected.</p>
                                        {(user?.credits || 0) < total ? (
                                            <div className="text-red-400 font-bold mt-2">⚠️ Insufficient Balance</div>
                                        ) : (
                                            <div className="text-green-400 font-bold mt-2">✓ Balance Available</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <aside className="checkout-sidebar">
                        <div className="order-summary card">
                            <h3>Order Summary</h3>
                            <div className="summary-lines">
                                <div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                                <div className="summary-line total"><span>Total</span><span>{formatPrice(total)}</span></div>
                            </div>
                            <button className="btn btn-primary w-full mt-4" onClick={handleNext} disabled={!canProceed() || isProcessing}>
                                {isProcessing ? 'Processing...' : step < 3 ? 'Continue' : `Pay ${formatPrice(total)}`}
                            </button>
                            {step > 1 && <button className="btn btn-ghost w-full mt-2" onClick={() => setStep(step - 1)}>Back</button>}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}

export default Checkout
