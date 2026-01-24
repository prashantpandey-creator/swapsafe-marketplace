import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { mockListings, formatPrice, safeZones } from '../data/mockData'
import './Checkout.css'

function Checkout() {
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { isAuthenticated, user } = useAuth()

    const [product, setProduct] = useState(null)
    const [step, setStep] = useState(1) // 1: Review, 2: Delivery/Meetup, 3: Payment, 4: Confirm
    const [deliveryMethod, setDeliveryMethod] = useState(searchParams.get('method') || 'meetup')
    const [isProcessing, setIsProcessing] = useState(false)
    const [orderComplete, setOrderComplete] = useState(false)

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
    const [paymentMethod, setPaymentMethod] = useState('card')
    const [cardDetails, setCardDetails] = useState({
        number: '',
        expiry: '',
        cvv: '',
        name: ''
    })

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/checkout/${id}` } })
            return
        }

        const found = mockListings.find(l => l.id === id)
        setProduct(found)
    }, [id, isAuthenticated, navigate])

    if (!product) {
        return <div className="checkout-loading">Loading...</div>
    }

    const {
        title,
        price,
        images,
        seller,
        location,
        deliveryAvailable,
        meetupAvailable
    } = product

    // Calculate fees
    const platformFee = Math.round(price * 0.02) // 2% platform fee
    const shippingFee = deliveryMethod === 'delivery' ? 149 : 0
    const total = price + platformFee + shippingFee

    const filteredZones = safeZones.filter(z =>
        z.city.toLowerCase() === location.city.toLowerCase()
    )

    const canProceed = () => {
        switch (step) {
            case 1:
                return true
            case 2:
                if (deliveryMethod === 'meetup') {
                    return meetupDate && meetupTime && selectedZone
                } else {
                    return shippingAddress.address && shippingAddress.city &&
                        shippingAddress.state && shippingAddress.pincode && shippingAddress.phone
                }
            case 3:
                if (paymentMethod === 'card') {
                    return cardDetails.number.length >= 16 && cardDetails.expiry &&
                        cardDetails.cvv.length >= 3 && cardDetails.name
                }
                return true // UPI doesn't require card details
            default:
                return true
        }
    }

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1)
        } else {
            handlePayment()
        }
    }

    const handlePayment = async () => {
        setIsProcessing(true)

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000))

        setIsProcessing(false)
        setOrderComplete(true)
    }

    if (orderComplete) {
        return (
            <div className="checkout-success container">
                <div className="success-content">
                    <div className="success-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h1>Payment Successful!</h1>
                    <p className="success-message">
                        Your payment of <strong>{formatPrice(total)}</strong> has been securely held in escrow.
                    </p>

                    <div className="escrow-status">
                        <div className="escrow-step completed">
                            <span className="step-icon">✓</span>
                            <span>Payment Received</span>
                        </div>
                        <div className="escrow-line"></div>
                        <div className="escrow-step active">
                            <span className="step-icon">2</span>
                            <span>Held in Escrow</span>
                        </div>
                        <div className="escrow-line"></div>
                        <div className="escrow-step">
                            <span className="step-icon">3</span>
                            <span>{deliveryMethod === 'meetup' ? 'Meet & Exchange' : 'Item Shipped'}</span>
                        </div>
                        <div className="escrow-line"></div>
                        <div className="escrow-step">
                            <span className="step-icon">4</span>
                            <span>Release to Seller</span>
                        </div>
                    </div>

                    {deliveryMethod === 'meetup' && (
                        <div className="meetup-confirmation">
                            <h3>Meetup Details</h3>
                            <div className="meetup-info">
                                <p><strong>Date:</strong> {new Date(meetupDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                <p><strong>Time:</strong> {meetupTime}</p>
                                <p><strong>Location:</strong> {selectedZone?.name}</p>
                            </div>
                        </div>
                    )}

                    <div className="success-actions">
                        <Link to={`/track/ORD${Date.now()}`} className="btn btn-primary btn-lg">
                            Track Order
                        </Link>
                        <Link to="/browse" className="btn btn-secondary">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="checkout-page">
            <div className="container">
                <h1>Checkout</h1>

                {/* Progress Steps */}
                <div className="checkout-progress">
                    <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <span className="step-number">1</span>
                        <span className="step-label">Review</span>
                    </div>
                    <div className="progress-line"></div>
                    <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                        <span className="step-number">2</span>
                        <span className="step-label">{deliveryMethod === 'meetup' ? 'Meetup' : 'Shipping'}</span>
                    </div>
                    <div className="progress-line"></div>
                    <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                        <span className="step-number">3</span>
                        <span className="step-label">Payment</span>
                    </div>
                </div>

                <div className="checkout-grid">
                    {/* Main Content */}
                    <div className="checkout-main">
                        {/* Step 1: Review */}
                        {step === 1 && (
                            <div className="checkout-section animate-fadeIn">
                                <h2>Review Your Order</h2>

                                <div className="product-review-card">
                                    <img src={images[0]} alt={title} />
                                    <div className="product-details">
                                        <h3>{title}</h3>
                                        <p className="seller-info">
                                            Sold by <strong>{seller.name}</strong>
                                            {seller.verified && <span className="verified-badge">✓ Verified</span>}
                                        </p>
                                        <p className="location-info">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                            {location.city}, {location.state}
                                        </p>
                                    </div>
                                    <div className="product-price">
                                        {formatPrice(price)}
                                    </div>
                                </div>

                                {/* Delivery Method Selection */}
                                <div className="delivery-selection">
                                    <h3>Select Delivery Method</h3>
                                    <div className="delivery-options">
                                        {meetupAvailable && (
                                            <label className={`delivery-option ${deliveryMethod === 'meetup' ? 'selected' : ''}`}>
                                                <input
                                                    type="radio"
                                                    value="meetup"
                                                    checked={deliveryMethod === 'meetup'}
                                                    onChange={() => setDeliveryMethod('meetup')}
                                                />
                                                <div className="option-content">
                                                    <div className="option-icon">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                            <circle cx="9" cy="7" r="4" />
                                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                        </svg>
                                                    </div>
                                                    <div className="option-text">
                                                        <strong>Safe Meetup</strong>
                                                        <span>Meet at a verified public location</span>
                                                    </div>
                                                    <span className="option-price-tag">Free</span>
                                                </div>
                                            </label>
                                        )}

                                        {deliveryAvailable && (
                                            <label className={`delivery-option ${deliveryMethod === 'delivery' ? 'selected' : ''}`}>
                                                <input
                                                    type="radio"
                                                    value="delivery"
                                                    checked={deliveryMethod === 'delivery'}
                                                    onChange={() => setDeliveryMethod('delivery')}
                                                />
                                                <div className="option-content">
                                                    <div className="option-icon">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="1" y="3" width="15" height="13" />
                                                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                                            <circle cx="5.5" cy="18.5" r="2.5" />
                                                            <circle cx="18.5" cy="18.5" r="2.5" />
                                                        </svg>
                                                    </div>
                                                    <div className="option-text">
                                                        <strong>Home Delivery</strong>
                                                        <span>Delivered to your doorstep in 3-5 days</span>
                                                    </div>
                                                    <span className="option-price-tag">₹149</span>
                                                </div>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Meetup / Shipping */}
                        {step === 2 && deliveryMethod === 'meetup' && (
                            <div className="checkout-section animate-fadeIn">
                                <h2>Schedule Meetup</h2>
                                <p className="section-desc">Choose a safe location and time to meet the seller</p>

                                <div className="meetup-form">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Select Date</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={meetupDate}
                                                onChange={(e) => setMeetupDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Select Time</label>
                                            <select
                                                className="form-select"
                                                value={meetupTime}
                                                onChange={(e) => setMeetupTime(e.target.value)}
                                            >
                                                <option value="">Choose time</option>
                                                <option value="10:00 AM">10:00 AM</option>
                                                <option value="11:00 AM">11:00 AM</option>
                                                <option value="12:00 PM">12:00 PM</option>
                                                <option value="02:00 PM">02:00 PM</option>
                                                <option value="03:00 PM">03:00 PM</option>
                                                <option value="04:00 PM">04:00 PM</option>
                                                <option value="05:00 PM">05:00 PM</option>
                                                <option value="06:00 PM">06:00 PM</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Safe Meeting Location</label>
                                        <div className="safe-zones">
                                            {filteredZones.length > 0 ? (
                                                filteredZones.map(zone => (
                                                    <label
                                                        key={zone.id}
                                                        className={`zone-card ${selectedZone?.id === zone.id ? 'selected' : ''}`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="zone"
                                                            checked={selectedZone?.id === zone.id}
                                                            onChange={() => setSelectedZone(zone)}
                                                        />
                                                        <div className="zone-icon">
                                                            {zone.type === 'Mall' && '🏬'}
                                                            {zone.type === 'Police Station' && '🚔'}
                                                            {zone.type === 'Cafe' && '☕'}
                                                        </div>
                                                        <div className="zone-info">
                                                            <strong>{zone.name}</strong>
                                                            <span>{zone.type}</span>
                                                        </div>
                                                    </label>
                                                ))
                                            ) : (
                                                <p className="no-zones">No pre-approved zones in {location.city}. Seller will suggest a location.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="safety-reminder">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                        <div>
                                            <strong>Safety First</strong>
                                            <p>Meet during daylight hours in busy public places. Bring a friend if possible.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && deliveryMethod === 'delivery' && (
                            <div className="checkout-section animate-fadeIn">
                                <h2>Shipping Address</h2>
                                <p className="section-desc">Enter your delivery address</p>

                                <div className="shipping-form">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Full Name</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={shippingAddress.name}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                                                placeholder="Enter your full name"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Phone Number</label>
                                            <input
                                                type="tel"
                                                className="form-input"
                                                value={shippingAddress.phone}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                                                placeholder="+91 98765 43210"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Address</label>
                                        <textarea
                                            className="form-textarea"
                                            value={shippingAddress.address}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                                            placeholder="House no., Building, Street, Area"
                                            rows={3}
                                        ></textarea>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">City</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={shippingAddress.city}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                                placeholder="City"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">State</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={shippingAddress.state}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                                                placeholder="State"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Pincode</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={shippingAddress.pincode}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                                                placeholder="6-digit pincode"
                                                maxLength={6}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Payment */}
                        {step === 3 && (
                            <div className="checkout-section animate-fadeIn">
                                <h2>Payment Method</h2>
                                <p className="section-desc">Your payment will be held in escrow until you confirm delivery</p>

                                <div className="payment-methods">
                                    <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            value="card"
                                            checked={paymentMethod === 'card'}
                                            onChange={() => setPaymentMethod('card')}
                                        />
                                        <div className="payment-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                                <line x1="1" y1="10" x2="23" y2="10" />
                                            </svg>
                                        </div>
                                        <span>Credit/Debit Card</span>
                                    </label>

                                    <label className={`payment-option ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            value="upi"
                                            checked={paymentMethod === 'upi'}
                                            onChange={() => setPaymentMethod('upi')}
                                        />
                                        <div className="payment-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                                <line x1="12" y1="18" x2="12.01" y2="18" />
                                            </svg>
                                        </div>
                                        <span>UPI</span>
                                    </label>

                                    <label className={`payment-option ${paymentMethod === 'netbanking' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            value="netbanking"
                                            checked={paymentMethod === 'netbanking'}
                                            onChange={() => setPaymentMethod('netbanking')}
                                        />
                                        <div className="payment-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="12" y1="1" x2="12" y2="23" />
                                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                            </svg>
                                        </div>
                                        <span>Net Banking</span>
                                    </label>
                                </div>

                                {paymentMethod === 'card' && (
                                    <div className="card-form animate-fadeIn">
                                        <div className="form-group">
                                            <label className="form-label">Card Number</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={cardDetails.number}
                                                onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                                                placeholder="1234 5678 9012 3456"
                                            />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Expiry Date</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={cardDetails.expiry}
                                                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                                    placeholder="MM/YY"
                                                    maxLength={5}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">CVV</label>
                                                <input
                                                    type="password"
                                                    className="form-input"
                                                    value={cardDetails.cvv}
                                                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                                    placeholder="•••"
                                                    maxLength={4}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Name on Card</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={cardDetails.name}
                                                onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                                                placeholder="As shown on card"
                                            />
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'upi' && (
                                    <div className="upi-info animate-fadeIn">
                                        <p>You'll be redirected to your UPI app to complete the payment.</p>
                                    </div>
                                )}

                                <div className="escrow-reminder">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        <path d="M9 12l2 2 4-4" />
                                    </svg>
                                    <div>
                                        <strong>Escrow Protection</strong>
                                        <p>Your payment is protected. Funds are released to seller only after you confirm receipt.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <aside className="checkout-sidebar">
                        <div className="order-summary card">
                            <div className="card-header">
                                <h3>Order Summary</h3>
                            </div>
                            <div className="card-body">
                                <div className="summary-product">
                                    <img src={images[0]} alt={title} />
                                    <div>
                                        <p className="product-name">{title.substring(0, 50)}...</p>
                                        <p className="product-seller">by {seller.name}</p>
                                    </div>
                                </div>

                                <div className="summary-lines">
                                    <div className="summary-line">
                                        <span>Item Price</span>
                                        <span>{formatPrice(price)}</span>
                                    </div>
                                    <div className="summary-line">
                                        <span>Platform Fee (2%)</span>
                                        <span>{formatPrice(platformFee)}</span>
                                    </div>
                                    {deliveryMethod === 'delivery' && (
                                        <div className="summary-line">
                                            <span>Shipping</span>
                                            <span>{formatPrice(shippingFee)}</span>
                                        </div>
                                    )}
                                    <div className="summary-line total">
                                        <span>Total</span>
                                        <span>{formatPrice(total)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="card-footer">
                                <button
                                    className="btn btn-primary w-full"
                                    onClick={handleNext}
                                    disabled={!canProceed() || isProcessing}
                                >
                                    {isProcessing ? (
                                        <>
                                            <span className="spinner"></span>
                                            Processing...
                                        </>
                                    ) : step < 3 ? (
                                        'Continue'
                                    ) : (
                                        `Pay ${formatPrice(total)}`
                                    )}
                                </button>

                                {step > 1 && (
                                    <button
                                        className="btn btn-ghost w-full"
                                        onClick={() => setStep(step - 1)}
                                        disabled={isProcessing}
                                    >
                                        Back
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="trust-badges">
                            <div className="trust-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <span>Secure Payment</span>
                            </div>
                            <div className="trust-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                                <span>Escrow Protected</span>
                            </div>
                            <div className="trust-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Buyer Guarantee</span>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}

export default Checkout
