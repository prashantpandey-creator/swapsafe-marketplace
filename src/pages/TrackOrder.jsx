import { useParams, Link } from 'react-router-dom'
import { formatPrice } from '../data/mockData'
import './TrackOrder.css'

function TrackOrder() {
    const { orderId } = useParams()

    const order = {
        id: orderId,
        product: {
            title: 'iPhone 14 Pro Max 256GB - Deep Purple',
            image: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400',
            price: 89999
        },
        seller: {
            name: 'Rahul Sharma',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul'
        },
        status: 'meetup-scheduled',
        deliveryMethod: 'meetup',
        escrowStatus: 'holding',
        createdAt: '2026-01-22T10:00:00',
        meetup: {
            date: '2026-01-25',
            time: '3:00 PM',
            location: 'Inorbit Mall, Malad West, Mumbai'
        }
    }

    const timeline = [
        { status: 'completed', title: 'Order Placed', description: 'Payment received and held in escrow', date: 'Jan 22, 10:00 AM' },
        { status: 'completed', title: 'Seller Confirmed', description: 'Seller accepted the order', date: 'Jan 22, 10:30 AM' },
        { status: 'active', title: 'Meetup Scheduled', description: 'Meet at Inorbit Mall on Jan 25', date: 'Jan 25, 3:00 PM' },
        { status: 'pending', title: 'Item Received', description: 'Confirm when you receive the item', date: '' },
        { status: 'pending', title: 'Payment Released', description: 'Funds released to seller', date: '' },
    ]

    return (
        <div className="track-order-page">
            <div className="container">
                <div className="track-header">
                    <Link to="/dashboard?tab=orders" className="back-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Orders
                    </Link>
                    <h1>Order #{orderId}</h1>
                </div>

                <div className="track-grid">
                    {/* Order Details */}
                    <div className="order-card card">
                        <div className="card-body">
                            <div className="order-product">
                                <img src={order.product.image} alt={order.product.title} />
                                <div>
                                    <h3>{order.product.title}</h3>
                                    <p className="order-price">{formatPrice(order.product.price)}</p>
                                    <div className="order-seller">
                                        <img src={order.seller.avatar} alt="" className="avatar avatar-sm" />
                                        <span>Sold by {order.seller.name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="escrow-status-card">
                                <div className="escrow-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                </div>
                                <div className="escrow-info">
                                    <strong>Payment Secured in Escrow</strong>
                                    <p>{formatPrice(order.product.price)} will be released to seller after you confirm receipt</p>
                                </div>
                            </div>

                            {order.deliveryMethod === 'meetup' && order.meetup && (
                                <div className="meetup-details">
                                    <h4>Meetup Details</h4>
                                    <div className="detail-row">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        <span>{new Date(order.meetup.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} at {order.meetup.time}</span>
                                    </div>
                                    <div className="detail-row">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        <span>{order.meetup.location}</span>
                                    </div>
                                </div>
                            )}

                            <div className="order-actions">
                                <button className="btn btn-primary">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Confirm Receipt
                                </button>
                                <button className="btn btn-secondary">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                    Contact Seller
                                </button>
                                <button className="btn btn-ghost">
                                    Report Issue
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="timeline-card card">
                        <div className="card-header">
                            <h3>Order Timeline</h3>
                        </div>
                        <div className="card-body">
                            <div className="timeline">
                                {timeline.map((step, index) => (
                                    <div key={index} className={`timeline-item ${step.status}`}>
                                        <div className="timeline-marker">
                                            {step.status === 'completed' ? (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            ) : step.status === 'active' ? (
                                                <span className="pulse-ring"></span>
                                            ) : null}
                                        </div>
                                        <div className="timeline-content">
                                            <strong>{step.title}</strong>
                                            <p>{step.description}</p>
                                            {step.date && <span className="timeline-date">{step.date}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TrackOrder
