import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Check, MapPin, MessageSquare, ShoppingBag, Heart, Share2, AlertTriangle, Package, Calendar, Flag } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { listingsAPI, shieldAPI } from '../services/api'
import { formatPrice, getTimeAgo, getConditionColor, conditions } from '../data/mockData'
import GuardianBadge from '../components/trust/GuardianBadge'
import './ProductDetail.css'

function ProductDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { isAuthenticated, user } = useAuth()
    const { addToCart, isInCart } = useCart()

    const [product, setProduct] = useState(null)
    const [selectedImage, setSelectedImage] = useState(0)
    const [showContactModal, setShowContactModal] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [id])

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
            <div className="min-h-screen pt-24 pb-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legion-gold"></div>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen pt-24 pb-12 container mx-auto px-4 text-center">
                <h2 className="text-2xl font-bold mb-4">Item Not Found</h2>
                <p className="text-gray-400 mb-6">The listing you are looking for has been removed or sold.</p>
                <Link to="/browse" className="btn btn-primary">Back to Market</Link>
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
        images = [],
        seller = {}, // Safe access
        location,
        createdAt,
        aiVerified,
        views,
        deliveryAvailable,
        deliveryOptions
    } = product

    const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
    const conditionInfo = conditions.find(c => c.value === condition)
    const isOwnListing = user?.id === (seller._id || seller.id)
    const safeSeller = seller || {}

    const handleBuyNow = () => {
        if (!isAuthenticated) return navigate('/login', { state: { from: `/product/${id}` } })
        navigate(`/checkout/${id}`)
    }

    const handleAddToCart = () => {
        if (!isAuthenticated) return navigate('/login', { state: { from: `/product/${id}` } })
        addToCart({
            id: product._id || product.id,
            title: product.title,
            price: product.price,
            image: product.images[0],
            seller: safeSeller,
            deliveryMethod: deliveryAvailable ? 'shipping' : 'meetup'
        })
    }

    const handleContact = () => {
        if (!isAuthenticated) return navigate('/login', { state: { from: `/product/${id}` } })
        setShowContactModal(true)
    }

    return (
        <div className="pt-24 pb-12 min-h-screen bg-legion-bg">
            <div className="container mx-auto px-4">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                    <Link to="/" className="hover:text-legion-gold transition-colors">Home</Link>
                    <span>/</span>
                    <Link to="/browse" className="hover:text-legion-gold transition-colors">Marketplace</Link>
                    <span>/</span>
                    <span className="text-gray-500 truncate max-w-[200px]">{title}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* --- LEFT COLUMN: IMAGES (Span 7) --- */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Main Image Stage */}
                        <div className="relative aspect-[4/3] bg-legion-card rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
                            <img
                                src={images[selectedImage] || 'https://via.placeholder.com/800'}
                                alt={title}
                                className="w-full h-full object-contain bg-black/50"
                            />

                            {/* Overlay Badges */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                {aiVerified && (
                                    <GuardianBadge level="verified" animated={true} />
                                )}
                                {discount > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                        {discount}% OFF
                                    </span>
                                )}
                            </div>

                            <button className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-red-500 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                                <Heart size={20} />
                            </button>
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-legion-gold shadow-lg shadow-legion-gold/20' : 'border-transparent opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Description Block */}
                        <div className="bg-legion-card border border-white/10 rounded-2xl p-6 md:p-8 mt-8">
                            <h3 className="text-xl font-bold text-white mb-4">Description</h3>
                            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-line">
                                {description}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
                                <div>
                                    <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Condition</span>
                                    <span className={`text-sm font-medium px-2 py-1 rounded bg-white/5 inline-block text-${getConditionColor(condition)}-400`}>
                                        {conditionInfo?.label || condition}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Category</span>
                                    <span className="text-sm font-medium text-white capitalize">{category}</span>
                                </div>
                                <div>
                                    <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Listed</span>
                                    <span className="text-sm font-medium text-white">{getTimeAgo(createdAt)}</span>
                                </div>
                                <div>
                                    <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Views</span>
                                    <span className="text-sm font-medium text-white">{views || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: INFO & ACTIONS (Span 5) --- */}
                    <div className="lg:col-span-5 space-y-6">

                        {/* Title Block */}
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h1 className="text-3xl font-black text-white leading-tight">{title}</h1>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <MapPin size={14} />
                                <span>{location?.city || 'Unknown Location'}, {location?.state}</span>
                            </div>
                        </div>

                        {/* Price Card */}
                        <div className="bg-legion-card border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            {/* Background Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-legion-gold/5 blur-[50px] rounded-full pointer-events-none"></div>

                            <div className="flex items-end gap-3 mb-6">
                                <span className="text-4xl font-bold text-white">{formatPrice(price)}</span>
                                {originalPrice && (
                                    <span className="text-lg text-gray-500 line-through mb-1.5">{formatPrice(originalPrice)}</span>
                                )}
                            </div>

                            {!isOwnListing ? (
                                <div className="space-y-3">
                                    <button
                                        onClick={handleBuyNow}
                                        className="w-full bg-legion-gold hover:bg-yellow-500 text-legion-bg font-bold text-lg py-4 rounded-xl shadow-lg shadow-legion-gold/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                    >
                                        <Shield size={20} className="text-legion-bg" />
                                        Secure Buy
                                    </button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={isInCart(product._id || product.id)}
                                            className={`w-full font-bold py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${isInCart(product._id || product.id)
                                                ? 'bg-white/10 border-transparent text-gray-400 cursor-not-allowed'
                                                : 'border-white/20 hover:border-white text-white bg-transparent'
                                                }`}
                                        >
                                            <ShoppingBag size={18} />
                                            {isInCart(product._id || product.id) ? 'In Cart' : 'Add to Cart'}
                                        </button>
                                        <button
                                            onClick={handleContact}
                                            className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <MessageSquare size={18} />
                                            Chat
                                        </button>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!isAuthenticated) return navigate('/login')
                                            const reason = prompt("Why are you reporting this listing? (e.g. Fraud, Counterfeit, Spam)")
                                            if (reason) {
                                                try {
                                                    await shieldAPI.report({
                                                        type: 'listing',
                                                        targetId: product._id || product.id,
                                                        reason,
                                                        details: 'User reported via Product Page'
                                                    })
                                                    alert("Report submitted. Thank you for keeping SwapSafe secure.")
                                                } catch (err) {
                                                    alert("Failed to submit report. Please try again.")
                                                }
                                            }
                                        }}
                                        className="w-full text-gray-500 hover:text-red-400 text-sm py-2 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Flag size={14} />
                                        Report this listing
                                    </button>
                                </div>
                            ) : (
                                <Link to="/dashboard" className="block w-full text-center bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all">
                                    Manage Your Listing
                                </Link>
                            )}

                            {/* Safety Note */}
                            <div className="mt-6 flex items-start gap-3 bg-legion-gold/5 p-3 rounded-lg border border-legion-gold/10">
                                <Shield className="text-legion-gold shrink-0 mt-0.5" size={16} />
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    <span className="text-legion-gold font-bold">SwapSafe Guarantee:</span> Your money is held in escrow until you confirm the item is as described.
                                </p>
                            </div>
                        </div>

                        {/* Seller Card */}
                        <div className="bg-legion-card border border-white/10 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Seller Information</h3>
                            <Link to={`/profile/${safeSeller._id || safeSeller.id}`} className="flex items-center gap-4 group">
                                <div className="relative">
                                    <img
                                        src={safeSeller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeSeller.name || 'User')}`}
                                        alt={safeSeller.name}
                                        className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-legion-gold transition-all"
                                    />
                                    {(safeSeller.verified || safeSeller.isVerified) && (
                                        <div className="absolute -bottom-1 -right-1 bg-legion-bg rounded-full p-0.5">
                                            <GuardianBadge level="verified" showLabel={false} size="sm" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg text-white group-hover:text-legion-gold transition-colors">{safeSeller.name || 'Anonymous User'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                                        <span className="flex items-center gap-1 text-yellow-400">
                                            ★ {safeSeller.rating || 0}
                                        </span>
                                        <span>•</span>
                                        <span>{safeSeller.totalSales || 0} sales</span>
                                    </div>
                                </div>
                                <div className="text-gray-500 group-hover:text-white transition-colors">
                                    →
                                </div>
                            </Link>

                            {/* Delivery Options */}
                            <div className="bg-legion-card border border-white/10 rounded-2xl p-6 mt-6">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Delivery Options</h3>
                                <div className="space-y-3">
                                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${deliveryAvailable ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/5 border-red-500/10 opacity-50'}`}>
                                        <Package className={deliveryAvailable ? 'text-green-400' : 'text-red-400'} size={20} />
                                        <div>
                                            <span className="block text-sm font-bold text-white">Nationwide Shipping</span>
                                            <span className="text-xs text-gray-400">{deliveryAvailable ? 'Available via Secure Courier' : 'Not available for this item'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl border bg-white/5 border-white/10">
                                        <div className="relative">
                                            <MapPin className="text-gray-300" size={20} />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-bold text-white">Local Meetup</span>
                                            <span className="text-xs text-gray-400">Meet in {location?.city} (Public Safe Zones Rec.)</span>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/messages/${product.id || product._id}`}
                                        state={{
                                            seller: product.seller,
                                            product: {
                                                title: product.title,
                                                images: product.images,
                                                id: product.id || product._id
                                            }
                                        }}
                                        className="flex items-center gap-3 p-3 rounded-xl border bg-legion-gold/10 border-legion-gold/20 hover:bg-legion-gold/20 transition-colors cursor-pointer"
                                    >
                                        <MessageSquare className="text-legion-gold" size={20} />
                                        <div>
                                            <span className="block text-sm font-bold text-white">Chat with Seller</span>
                                            <span className="text-xs text-gray-400">Discuss details or negotiate</span>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Contact Modal */}
            {showContactModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowContactModal(false)}></div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-legion-card border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                    >
                        <h3 className="text-xl font-bold text-white mb-4">Message Seller</h3>
                        <textarea
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:border-legion-gold outline-none resize-none min-h-[120px]"
                            placeholder={`Hi ${safeSeller.name}, is this item still available?`}
                            autoFocus
                        ></textarea>
                        <div className="flex gap-3 mt-4 justify-end">
                            <button
                                onClick={() => setShowContactModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowContactModal(false)
                                    navigate(`/messages?product=${id}`)
                                }}
                                className="bg-legion-gold text-legion-bg font-bold px-6 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
                            >
                                Send Message
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

export default ProductDetail
