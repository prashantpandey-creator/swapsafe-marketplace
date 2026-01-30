import { Link } from 'react-router-dom';
import { formatPrice, getTimeAgo, getConditionColor } from '../../data/mockData';
import GuardianBadge from '../trust/GuardianBadge';
import './ProductCard.css';

function ProductCard({ product }) {
    // ... existing destructuring ...
    const {
        _id,
        id,
        title,
        price,
        originalPrice,
        condition,
        images = [],
        seller = {},
        location = {},
        createdAt,
        aiVerified,
        deliveryAvailable,
        deliveryOptions,
        featured,
        description
    } = product

    const productId = _id || id
    const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
    const hasDelivery = deliveryAvailable || deliveryOptions?.shipping
    const sellerVerified = seller.verified || seller.isVerified
    const sellerRating = seller.rating || 0
    // ... existing avatar logic ...
    const sellerAvatar = seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name || 'User')}&background=8b5cf6&color=fff`

    // Handle missing images
    const imageUrl = images.length > 0 ? images[0] : 'https://via.placeholder.com/400x400/1a1a2e/8b5cf6?text=No+Image'

    return (
        <Link to={`/product/${productId}`} className="product-card">
            <div className="product-image">
                <img
                    src={imageUrl}
                    alt={title}
                    loading="lazy"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/400x400/1a1a2e/8b5cf6?text=No+Image';
                    }}
                />

                {/* Badges */}
                {featured && (
                    <span className="product-badge featured">Featured</span>
                )}

                {discount > 0 && (
                    <span className="product-badge discount">-{discount}%</span>
                )}

                {/* Guardian Verification Badge - Top Right */}
                {aiVerified && (
                    <div className="absolute top-2 right-2 z-10">
                        <GuardianBadge level="verified" showLabel={false} animated={true} />
                    </div>
                )}

                {/* Quick Actions Overlay (Hover) */}
                <div className="product-actions">
                    <button className="action-btn" title="Add to Wishlist" onClick={(e) => e.preventDefault()}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </button>
                    <button className="action-btn" title="Quick View" onClick={(e) => e.preventDefault()}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="product-info">
                <div>
                    <div className="product-meta-header">
                        <span className={`condition-badge badge-${getConditionColor(condition)}`}>
                            {condition?.replace('-', ' ') || 'Unknown'}
                        </span>
                    </div>

                    <h3 className="product-title">{title}</h3>
                </div>

                <p className="product-description">{description}</p>

                <div className="product-pricing">
                    <span className="product-price">{formatPrice(price)}</span>
                    {originalPrice && originalPrice > price && (
                        <span className="product-original">{formatPrice(originalPrice)}</span>
                    )}
                </div>

                <div className="product-footer">
                    <div className="seller-info">
                        <img src={sellerAvatar} alt={seller.name || 'Seller'} className="seller-avatar" />
                        <span className="seller-name">
                            {seller.name || 'Anonymous'}
                            {sellerVerified && (
                                <svg viewBox="0 0 24 24" fill="currentColor" className="verified-icon">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                            )}
                        </span>
                    </div>

                    <div className="product-location">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{location.city || 'Unknown'}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default ProductCard
