import { Link } from 'react-router-dom';
import { formatPrice, getTimeAgo, getConditionColor } from '../../data/mockData';
import GuardianBadge from '../trust/GuardianBadge';
import { useWishlist } from '../../context/WishlistContext';
import { Heart, Eye, MapPin, CheckCircle } from 'lucide-react';
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
    // Defensive coding: seller might be an empty object, or the destructuring default might be overridden by null
    const safeSeller = seller || {}
    const sellerVerified = safeSeller.verified || safeSeller.isVerified
    const sellerRating = safeSeller.rating || 0
    // ... existing avatar logic ...
    const sellerAvatar = safeSeller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeSeller.name || 'User')}&background=8b5cf6&color=fff`

    // Handle missing images
    const imageUrl = images.length > 0 ? images[0] : 'https://via.placeholder.com/400x400/1a1a2e/8b5cf6?text=No+Image'

    const { isInWishlist, toggleWishlist } = useWishlist()
    const isLiked = isInWishlist(productId)

    const handleWishlistToggle = (e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleWishlist(product)
    }

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
                    <button
                        className={`action-btn ${isLiked ? 'bg-pink-500 text-white border-pink-500' : ''}`}
                        title={isLiked ? "Remove from Wishlist" : "Add to Wishlist"}
                        onClick={handleWishlistToggle}
                    >
                        <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                    </button>
                    <button className="action-btn" title="Quick View" onClick={(e) => e.preventDefault()}>
                        <Eye size={18} />
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
                        <img src={sellerAvatar} alt={safeSeller.name || 'Seller'} className="seller-avatar" />
                        <span className="seller-name">
                            {safeSeller.name || 'Anonymous'}
                            {sellerVerified && (
                                <CheckCircle size={14} className="verified-icon text-legion-gold fill-legion-gold/20" />
                            )}
                        </span>
                    </div>

                    <div className="product-location">
                        <MapPin size={12} />
                        <span>{location.city || 'Unknown'}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default ProductCard
