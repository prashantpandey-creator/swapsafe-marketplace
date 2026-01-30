import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { listingsAPI } from '../services/api'
import { formatPrice, getTimeAgo, getConditionColor, conditions } from '../data/mockData'
import GuardianBadge from '../components/trust/GuardianBadge'
import TrustIndicators from '../components/trust/TrustIndicators'
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
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchProduct = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const response = await listingsAPI.getById(id)
                setProduct(response.listing || response)
            } catch (err) {
                console.error('Failed to fetch product:', err)
                setError('Failed to load product')
                setProduct(null)
            } finally {
                setIsLoading(false)
            }
        }
        fetchProduct()
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
                    {/* Left Column: Image Gallery */}
                    <div className="product-gallery">
                        <div className="main-image glass-panel">
                            <img src={images[selectedImage]} alt={title} />

                            {aiVerified && (
                                <div className="absolute top-4 left-4 z-10">
                                    <GuardianBadge level="verified" animated={true} />
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

                    {/* Center Column: Product Details */}
                    <div className="product-info-section">
                        <div className="product-header">
                            <div className="flex items-center gap-3 mb-3">
                                <span className={`condition-tag badge badge-${getConditionColor(condition)}`}>
                                    {conditionInfo?.label}
                                </span>
                                {aiVerified && <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z" /></svg>
                                    Guardian Verified
                                </span>}
                            </div>

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

                        <div className="description-content glass-panel p-6 rounded-xl">
                            <p>{description}</p>
                        </div>

                        <div className="product-specs glass-panel p-6 rounded-xl">
                            <h3>Item Details</h3>
                            <div className="specs-grid">
                                <div className="spec-item">
                                    <span className="spec-label">Condition</span>
                                    <span className="spec-value">{conditionInfo?.label}</span>
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

                    {/* Right Column: Actions & Trust */}
                    <aside className="product-sidebar">
                        {/* Pricing & Buy */}
                        <div className="pricing-card glass-panel p-6 rounded-xl border border-glass-border">
                            <div className="price-row mb-4">
                                <span className="current-price text-4xl font-bold">{formatPrice(price)}</span>
                                {originalPrice && (
                                    <span className="original-price text-lg text-slate-500 line-through ml-2">{formatPrice(originalPrice)}</span>
                                )}
                            </div>

                            {!isOwnListing ? (
                                <div className="action-buttons flex flex-col gap-3">
                                    <button className="btn btn-primary w-full py-4 text-lg font-bold shadow-lg shadow-primary-500/20" onClick={handleBuyNow}>
                                        Buy Now
                                    </button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            className={`btn ${isInCart(id) ? 'btn-secondary' : 'btn-outline'}`}
                                            onClick={handleAddToCart}
                                            disabled={isInCart(id)}
                                        >
                                            {isInCart(id) ? 'In Cart' : 'Add to Cart'}
                                        </button>
                                        <button className="btn btn-secondary" onClick={handleContact}>
                                            Chat
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <Link to="/dashboard?tab=listings" className="btn btn-secondary w-full">
                                    Manage Listing
                                </Link>
                            )}
                        </div>

                        {/* Seller Card */}
                        <div className="seller-card glass-panel p-5 rounded-xl border border-glass-border">
                            <Link to={`/profile/${seller._id || seller.id}`} className="flex items-center gap-4 mb-4">
                                <img src={seller.avatar || 'https://via.placeholder.com/50'} alt={seller.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-glass-border" />
                                <div>
                                    <div className="font-bold flex items-center gap-1">
                                        {seller.name}
                                        {(seller.verified || seller.isVerified) && (
                                            <GuardianBadge
                                                level={seller.rating >= 4.8 ? 'gold' : seller.rating >= 4.5 ? 'silver' : 'verified'}
                                                showLabel={false}
                                            />
                                        )}
                                    </div>
                                    <div className="text-sm text-slate-400 flex items-center gap-1">
                                        <span className="text-amber-400">★</span> {seller.rating || 0} • {seller.totalSales || 0} sales
                                    </div>
                                </div>
                            </Link>
                            <div className="text-xs text-slate-500 border-t border-glass-border pt-3 mt-3 flex justify-between">
                                <span>Response time</span>
                                <span className="text-slate-300">Within 1 hr</span>
                            </div>
                        </div>

                        {/* Guardian Trust Indicators */}
                        <TrustIndicators />
                    </aside>
                </div>
            </div>

            {/* Contact Modal */}
            {showContactModal && (
                <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
                    <div className="modal glass-panel border border-glass-border" onClick={e => e.stopPropagation()}>
                        <div className="modal-header border-b border-glass-border pb-4 mb-4">
                            <h3 className="text-xl font-bold">Message Seller</h3>
                        </div>
                        <div className="modal-body mb-6">
                            <textarea
                                className="w-full bg-slate-900/50 border border-glass-border rounded-lg p-3 text-slate-200 focus:border-primary-500 outline-none"
                                placeholder="Hi, I'm interested in this item..."
                                rows={4}
                            ></textarea>
                        </div>
                        <div className="modal-footer flex justify-end gap-3">
                            <button className="btn btn-secondary" onClick={() => setShowContactModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={() => {
                                setShowContactModal(false)
                                navigate(`/messages?product=${id}`)
                            }}>Send</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductDetail
