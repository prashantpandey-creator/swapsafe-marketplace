import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, getTimeAgo, getConditionColor } from '../../data/mockData';
import GuardianBadge from '../trust/GuardianBadge';
import { useWishlist } from '../../context/WishlistContext';
import { Heart, Eye, MapPin, CheckCircle } from 'lucide-react';
import './ProductCard.css';

// Lynch (Twin Peaks Red Room) condition badge colors
const lynchConditionColor = (condition) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('new') || c.includes('like')) return '#6BBF59'; // green
    if (c.includes('good') || c.includes('excellent')) return '#C9A84C'; // gold
    return '#D9A441'; // amber for fair/used
};

function ProductCard({ product }) {
    const [isLynch, setIsLynch] = useState(() => document.body.classList.contains('theme-lynch'));
    useEffect(() => {
        const obs = new MutationObserver(() => setIsLynch(document.body.classList.contains('theme-lynch')));
        obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);

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

    const lynchCardStyle = isLynch ? {
        background: 'rgba(6,2,2,0.84)',
        border: '1px solid rgba(195,25,25,0.3)',
        borderRadius: 10,
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
    } : {};

    const handleLynchEnter = isLynch ? (e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.borderColor = 'rgba(220,40,40,0.7)';
        e.currentTarget.style.boxShadow = '0 20px 50px rgba(195,25,25,0.28)';
    } : undefined;

    const handleLynchLeave = isLynch ? (e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(195,25,25,0.3)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.7)';
    } : undefined;

    return (
        <Link
            to={`/product/${productId}`}
            className="product-card glass-panel"
            style={lynchCardStyle}
            onMouseEnter={handleLynchEnter}
            onMouseLeave={handleLynchLeave}
        >
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
                        <span
                            className={`condition-badge badge-${getConditionColor(condition)}`}
                            style={isLynch ? {
                                background: `${lynchConditionColor(condition)}22`,
                                color: lynchConditionColor(condition),
                                border: `1px solid ${lynchConditionColor(condition)}55`,
                                fontFamily: 'Georgia, serif',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                            } : {}}
                        >
                            {condition?.replace('-', ' ') || 'Unknown'}
                        </span>
                    </div>

                    <h3
                        className="product-title"
                        style={isLynch ? { fontFamily: 'Georgia, serif', color: '#F5EEE6', letterSpacing: '0.02em' } : {}}
                    >{title}</h3>
                </div>

                <p
                    className="product-description"
                    style={isLynch ? { color: 'rgba(245,215,195,0.6)' } : {}}
                >{description}</p>

                <div className="product-pricing">
                    <span
                        className="product-price"
                        style={isLynch ? { color: '#C9A84C', fontFamily: 'Georgia, serif', fontWeight: 700 } : {}}
                    >{formatPrice(price)}</span>
                    {originalPrice && originalPrice > price && (
                        <span className="product-original">{formatPrice(originalPrice)}</span>
                    )}
                </div>

                <div className="product-footer">
                    <div className="seller-info">
                        <img src={sellerAvatar} alt={safeSeller.name || 'Seller'} className="seller-avatar" />
                        <span
                            className="seller-name"
                            style={isLynch ? { color: 'rgba(245,215,195,0.7)', fontFamily: 'Georgia, serif' } : {}}
                        >
                            {safeSeller.name || 'Anonymous'}
                            {sellerVerified && (
                                <CheckCircle size={14} className="verified-icon text-legion-gold fill-legion-gold/20" style={isLynch ? { color: '#C9A84C' } : {}} />
                            )}
                        </span>
                    </div>

                    <div
                        className="product-location"
                        style={isLynch ? { color: 'rgba(245,215,195,0.5)', fontFamily: 'Georgia, serif' } : {}}
                    >
                        <MapPin size={12} />
                        <span>{location.city || 'Unknown'}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default ProductCard
