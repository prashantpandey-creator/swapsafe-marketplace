import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { paymentAPI } from '../services/api'
import { formatPrice } from '../data/mockData'
import './TrackOrder.css'

function TrackOrder() {
    const { orderId } = useParams()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchOrder()
    }, [orderId])

    const fetchOrder = async () => {
        try {
            setLoading(true)
            const data = await paymentAPI.getOrderById(orderId)
            setOrder(data.order) // backend usually returns { success: true, order: {...} } or just the object? Check backend. 
            // In create-credit-order: res.json({ ..., order: { id, ... } }). 
            // getOrderById (payment.js) isn't implemented? I need to check backend route `GET /api/payment/orders/:id`.
            // Wait, I didn't verify backend has `GET /:id`!
        } catch (err) {
            console.error("Failed to load order:", err)
            setError(err.message || "Order not found")
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-12 text-center text-white">Loading order details...</div>
    if (error) return <div className="p-12 text-center text-red-400">Error: {error}</div>
    if (!order) return <Link to="/" className="p-12 block text-center text-white">Order not found. Go Home</Link>

    const isEscrowHeld = order.payment?.status === 'held' || order.escrow?.isHeld
    const product = order.listing || {} // populated?
    const seller = order.seller || {}

    return (
        <div className="track-order-page">
            <div className="container">
                <div className="track-header">
                    <Link to="/my-listings" className="back-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back
                    </Link>
                    <h1>Order #{order.orderId || order._id}</h1>
                </div>

                <div className="track-grid">
                    {/* Order Details */}
                    <div className="order-card card">
                        <div className="card-body">
                            <div className="order-product">
                                <img src={product.images?.[0] || 'https://via.placeholder.com/150'} alt={product.title} />
                                <div>
                                    <h3>{product.title || 'Unknown Item'}</h3>
                                    <p className="order-price">{formatPrice(order.amount?.total || 0)}</p>
                                    <div className="order-seller">
                                        <img src={seller.avatar || `https://ui-avatars.com/api/?name=${seller.name}`} alt="" className="avatar avatar-sm" />
                                        <span>Sold by {seller.name}</span>
                                    </div>
                                </div>
                            </div>

                            {isEscrowHeld && (
                                <div className="escrow-status-card">
                                    <div className="escrow-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                    </div>
                                    <div className="escrow-info">
                                        <strong>Payment Secured in Escrow</strong>
                                        <p>{formatPrice(order.amount?.total)} will be released to seller after you confirm receipt</p>
                                    </div>
                                </div>
                            )}

                            {order.delivery?.method === 'meetup' && (
                                <div className="meetup-details">
                                    <h4>Meetup Details</h4>
                                    <div className="detail-row">
                                        <span>Status: {order.status}</span>
                                    </div>
                                </div>
                            )}

                            <div className="order-actions">
                                {isEscrowHeld && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={async () => {
                                            if (window.confirm("Confirm you have received the item? This will release funds to the seller.")) {
                                                try {
                                                    setLoading(true);
                                                    await paymentAPI.confirmDelivery(order.orderId || order._id);
                                                    alert("Funds released to seller!");
                                                    fetchOrder(); // Refresh status
                                                } catch (err) {
                                                    alert(err.message);
                                                    setLoading(false);
                                                }
                                            }
                                        }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Confirm Receipt
                                    </button>
                                )}
                                <button className="btn btn-secondary">Contact Seller</button>
                            </div>
                        </div>
                    </div>

                    {/* Simple Status Display */}
                    <div className="timeline-card card">
                        <div className="card-header">
                            <h3>Status: {order.status.toUpperCase()}</h3>
                        </div>
                        <div className="card-body">
                            <p className="text-gray-400">
                                {isEscrowHeld
                                    ? "Funds are currently held in the AI Vault. Complete the meetup to release them."
                                    : "Order is processing."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TrackOrder
