import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { mockListings, formatPrice, getTimeAgo, getConditionColor, conditions } from '../data/mockData'
import './ProductDetail.css'

function ProductDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { isAuthenticated, user } = useAuth()
    const { addToCart, isInCart } = useCart()

    const [product, setProduct] = useState(null)
    const [selectedImage, setSelectedImage] = useState(0)
    const [showContactModal, setShowContactModal] = useState(false)
    const [deliveryMethod, setDeliveryMethod] = useState('meetup')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            const found = mockListings.find(l => l.id === id)
            setProduct(found)
            setIsLoading(false)
        }, 500)
    }, [id])

    if (isLoading) {
        return (
            <div className="product-detail-loading">
                <div className="skeleton" style={{ width: '100%', height: '400px' }}></div>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="product-not-found container">
                <h2>Product Not Found</h2>
                <p>The item you're looking for doesn't exist or has been removed.</p>
                <Link to="/browse" className="btn btn-primary">Browse Items</Link>
            </div>
        )
    }

    const {
        title,
        description,
        price,
        originalPrice,
        category,
        condition,
        images,
        seller,
        location,
        createdAt,
        views,
        likes,
        aiVerified,
        aiScore,
        deliveryAvailable,
        meetupAvailable
    } = product

    const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
    const conditionInfo = conditions.find(c => c.value === condition)
    const isOwnListing = user?.id === seller.id

    const handleBuyNow = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/product/${id}` } })
            return
        }
        navigate(`/checkout/${id}?method=${deliveryMethod}`)
    }

    const handleAddToCart = () => {
        addToCart({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.images[0],
            seller: product.seller,
            deliveryMethod
        })
    }

    const handleContact = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/product/${id}` } })
            return
        }
        setShowContactModal(true)
    }

    return (
        <div className="product-detail">
            <div className="container">
                {/* Breadcrumb */}
                <nav className="breadcrumb">
                    <Link to="/">Home</Link>
                    <span>/</span>
                    <Link to="/browse">Browse</Link>
                    <span>/</span>
                    <Link to={`/browse/${category}`}>{category}</Link>
                    <span>/</span>
                    <span>{title.substring(0, 30)}...</span>
                </nav>

                <div className="product-detail-grid">
                    {/* Image Gallery */}
                    <div className="product-gallery">
                        <div className="main-image">
                            <img src={images[selectedImage]} alt={title} />

                            {aiVerified && (
                                <div className="ai-verified-badge">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    AI Verified
                                    <span className="ai-score">{aiScore}%</span>
                                </div>
                            )}

                            {discount > 0 && (
                                <span className="discount-badge">-{discount}% OFF</span>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="thumbnail-list">
                                {images.map((img, index) => (
                                    <button
                                        key={index}
                                        className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                                        onClick={() => setSelectedImage(index)}
                                    >
                                        <img src={img} alt={`${title} - ${index + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="product-info-section">
                        <div className="product-header">
                            <span className={`condition-tag badge badge-${getConditionColor(condition)}`}>
                                {conditionInfo?.label}
                            </span>
                            <h1>{title}</h1>

                            <div className="product-meta-row">
                                <span className="meta-item">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    {views} views
                                </span>
                                <span className="meta-item">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                    {likes} likes
                                </span>
                                <span className="meta-item">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    {getTimeAgo(createdAt)}
                                </span>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="pricing-card card-glass">
                            <div className="price-row">
                                <span className="current-price">{formatPrice(price)}</span>
                                {originalPrice && (
                                    <span className="original-price">{formatPrice(originalPrice)}</span>
                                )}
                            </div>

                            {discount > 0 && (
                                <p className="savings">You save {formatPrice(originalPrice - price)} ({discount}% off)</p>
                            )}
                        </div>

                        {/* Delivery Options */}
                        <div className="delivery-options">
                            <h3>How do you want to get it?</h3>
                            <div className="option-cards">
                                {meetupAvailable && (
                                    <label className={`option-card ${deliveryMethod === 'meetup' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="delivery"
                                            value="meetup"
                                            checked={deliveryMethod === 'meetup'}
                                            onChange={() => setDeliveryMethod('meetup')}
                                        />
                                        <div className="option-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                        </div>
                                        <div className="option-info">
                                            <strong>Safe Meetup</strong>
                                            <span>Meet at a safe public location</span>
                                        </div>
                                        <span className="option-price">Free</span>
                                    </label>
                                )}

                                {deliveryAvailable && (
                                    <label className={`option-card ${deliveryMethod === 'delivery' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="delivery"
                                            value="delivery"
                                            checked={deliveryMethod === 'delivery'}
                                            onChange={() => setDeliveryMethod('delivery')}
                                        />
                                        <div className="option-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="1" y="3" width="15" height="13" />
                                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                                <circle cx="5.5" cy="18.5" r="2.5" />
                                                <circle cx="18.5" cy="18.5" r="2.5" />
                                            </svg>
                                        </div>
                                        <div className="option-info">
                                            <strong>Home Delivery</strong>
                                            <span>Delivered to your doorstep</span>
                                        </div>
                                        <span className="option-price">Varies</span>
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Escrow Info */}
                        <div className="escrow-info card-glass">
                            <div className="escrow-header">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                                <strong>Protected by SwapSafe Escrow</strong>
                            </div>
                            <p>Your payment is held securely until you receive and approve the item. Full refund if the item is not as described.</p>
                        </div>

                        {/* Action Buttons */}
                        {!isOwnListing && (
                            <div className="action-buttons">
                                <button className="btn btn-primary btn-lg" onClick={handleBuyNow}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                    Buy Now - Secure Payment
                                </button>

                                <div className="secondary-actions">
                                    <button
                                        className={`btn ${isInCart(id) ? 'btn-secondary' : 'btn-outline'}`}
                                        onClick={handleAddToCart}
                                        disabled={isInCart(id)}
                                    >
                                        {isInCart(id) ? 'Added to Cart' : 'Add to Cart'}
                                    </button>
                                    <button className="btn btn-secondary" onClick={handleContact}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                        Message Seller
                                    </button>
                                </div>
                            </div>
                        )}

                        {isOwnListing && (
                            <div className="own-listing-notice">
                                <p>This is your listing</p>
                                <Link to="/dashboard?tab=listings" className="btn btn-secondary">
                                    Manage Listing
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="product-sidebar">
                        {/* Seller Card */}
                        <div className="seller-card card">
                            <div className="card-header">
                                <h3>Seller</h3>
                            </div>
                            <div className="card-body">
                                <Link to={`/profile/${seller.id}`} className="seller-profile">
                                    <img src={seller.avatar} alt={seller.name} className="avatar avatar-lg" />
                                    <div className="seller-details">
                                        <strong>
                                            {seller.name}
                                            {seller.verified && (
                                                <svg viewBox="0 0 24 24" fill="currentColor" className="verified-icon">
                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                </svg>
                                            )}
                                        </strong>
                                        <span className="seller-stats">
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                            {seller.rating} • {seller.totalSales} sales
                                        </span>
                                    </div>
                                </Link>

                                <div className="seller-meta">
                                    <div className="meta-row">
                                        <span>Member since</span>
                                        <span>{new Date(seller.joinedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    <div className="meta-row">
                                        <span>Response time</span>
                                        <span>Usually within 1 hour</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Card */}
                        <div className="location-card card">
                            <div className="card-header">
                                <h3>Location</h3>
                            </div>
                            <div className="card-body">
                                <div className="location-info">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    <span>{location.city}, {location.state}</span>
                                </div>
                                <div className="map-placeholder">
                                    <span>Map will be shown during meetup scheduling</span>
                                </div>
                            </div>
                        </div>

                        {/* Safety Tips */}
                        <div className="safety-card card">
                            <div className="card-header">
                                <h3>Safety Tips</h3>
                            </div>
                            <div className="card-body">
                                <ul className="safety-list">
                                    <li>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Meet in safe, public places
                                    </li>
                                    <li>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Inspect item before payment
                                    </li>
                                    <li>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Use only in-app payments
                                    </li>
                                    <li>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Report suspicious activity
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Description Section */}
                <div className="product-description">
                    <h2>Description</h2>
                    <div className="description-content">
                        <p>{description}</p>
                    </div>

                    <div className="product-specs">
                        <h3>Item Details</h3>
                        <div className="specs-grid">
                            <div className="spec-item">
                                <span className="spec-label">Condition</span>
                                <span className="spec-value">{conditionInfo?.label} - {conditionInfo?.description}</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">Category</span>
                                <span className="spec-value" style={{ textTransform: 'capitalize' }}>{category}</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">Listed</span>
                                <span className="spec-value">{new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">Item ID</span>
                                <span className="spec-value">#{id}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Modal */}
            {showContactModal && (
                <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Message Seller</h3>
                            <button className="close-btn" onClick={() => setShowContactModal(false)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="message-product-preview">
                                <img src={images[0]} alt={title} />
                                <div>
                                    <strong>{title}</strong>
                                    <span>{formatPrice(price)}</span>
                                </div>
                            </div>
                            <textarea
                                className="form-textarea"
                                placeholder="Hi, I'm interested in this item. Is it still available?"
                                rows={4}
                            ></textarea>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowContactModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={() => {
                                setShowContactModal(false)
                                navigate(`/messages?product=${id}`)
                            }}>
                                Send Message
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductDetail
