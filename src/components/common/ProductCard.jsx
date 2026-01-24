import { Link } from 'react-router-dom'
import { formatPrice, getTimeAgo, getConditionColor } from '../../data/mockData'
import './ProductCard.css'

function ProductCard({ product }) {
    const {
        id,
        title,
        price,
        originalPrice,
        condition,
        images,
        seller,
        location,
        createdAt,
        aiVerified,
        deliveryAvailable,
        featured
    } = product

    const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0

    return (
        <Link to={`/product/${id}`} className="product-card card">
            <div className="product-image">
                <img src={images[0]} alt={title} loading="lazy" />

                {/* Badges */}
                {featured && (
                    <span className="product-badge featured">Featured</span>
                )}

                {discount > 0 && (
                    <span className="product-badge discount">-{discount}%</span>
                )}

                {aiVerified && (
                    <span className="product-verified" title="AI Verified">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12l2 2 4-4" />
                        </svg>
                    </span>
                )}

                {/* Quick Actions */}
                <div className="product-actions">
                    <button className="action-btn" title="Add to Wishlist" onClick={(e) => e.preventDefault()}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="product-info">
                <div className="product-meta">
                    <span className={`condition-badge badge badge-${getConditionColor(condition)}`}>
                        {condition.replace('-', ' ')}
                    </span>
                    {deliveryAvailable && (
                        <span className="delivery-badge">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                <rect x="1" y="3" width="15" height="13" />
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                <circle cx="5.5" cy="18.5" r="2.5" />
                                <circle cx="18.5" cy="18.5" r="2.5" />
                            </svg>
                            Delivery
                        </span>
                    )}
                </div>

                <h3 className="product-title">{title}</h3>

                <div className="product-pricing">
                    <span className="product-price">{formatPrice(price)}</span>
                    {originalPrice && (
                        <span className="product-original">{formatPrice(originalPrice)}</span>
                    )}
                </div>

                <div className="product-footer">
                    <div className="seller-info">
                        <img src={seller.avatar} alt={seller.name} className="seller-avatar" />
                        <div>
                            <span className="seller-name">
                                {seller.name}
                                {seller.verified && (
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="verified-icon">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                )}
                            </span>
                            <span className="seller-rating">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                                {seller.rating}
                            </span>
                        </div>
                    </div>

                    <div className="product-location">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{location.city}</span>
                    </div>
                </div>

                <div className="product-time">
                    {getTimeAgo(createdAt)}
                </div>
            </div>
        </Link>
    )
}

export default ProductCard
