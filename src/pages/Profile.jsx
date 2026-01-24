import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ProductCard from '../components/common/ProductCard'
import { mockListings } from '../data/mockData'
import './Profile.css'

function Profile() {
    const { id } = useParams()
    const [user, setUser] = useState(null)
    const [activeTab, setActiveTab] = useState('listings')
    const [userListings, setUserListings] = useState([])

    useEffect(() => {
        // Find user from mock data
        const listing = mockListings.find(l => l.seller.id === id)
        if (listing) {
            setUser(listing.seller)
            setUserListings(mockListings.filter(l => l.seller.id === id))
        }
    }, [id])

    if (!user) {
        return (
            <div className="profile-not-found container">
                <h2>User Not Found</h2>
                <Link to="/browse" className="btn btn-primary">Browse Items</Link>
            </div>
        )
    }

    return (
        <div className="profile-page">
            <div className="container">
                {/* Profile Header */}
                <div className="profile-header card">
                    <div className="profile-cover"></div>
                    <div className="profile-info">
                        <img src={user.avatar} alt={user.name} className="profile-avatar" />
                        <div className="profile-details">
                            <h1>
                                {user.name}
                                {user.verified && (
                                    <span className="verified-badge" title="Verified Seller">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </svg>
                                    </span>
                                )}
                            </h1>
                            <p className="profile-meta">
                                <span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    Member since {new Date(user.joinedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                </span>
                            </p>
                        </div>
                        <div className="profile-stats">
                            <div className="stat">
                                <span className="stat-value">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    {user.rating}
                                </span>
                                <span className="stat-label">Rating</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{user.totalSales}</span>
                                <span className="stat-label">Sales</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{userListings.length}</span>
                                <span className="stat-label">Listings</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'listings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('listings')}
                    >
                        Listings ({userListings.length})
                    </button>
                    <button
                        className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reviews')}
                    >
                        Reviews
                    </button>
                </div>

                {/* Content */}
                <div className="profile-content">
                    {activeTab === 'listings' && (
                        <div className="listings-grid grid grid-4">
                            {userListings.map(listing => (
                                <ProductCard key={listing.id} product={listing} />
                            ))}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="reviews-section">
                            <div className="review-item card">
                                <div className="review-header">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Buyer1" alt="Reviewer" className="avatar" />
                                    <div>
                                        <strong>Amit Kumar</strong>
                                        <div className="review-rating">
                                            {'★'.repeat(5)}
                                        </div>
                                    </div>
                                    <span className="review-date">2 weeks ago</span>
                                </div>
                                <p>Great seller! Item was exactly as described. Smooth transaction and quick response.</p>
                            </div>
                            <div className="review-item card">
                                <div className="review-header">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Buyer2" alt="Reviewer" className="avatar" />
                                    <div>
                                        <strong>Neha Singh</strong>
                                        <div className="review-rating">
                                            {'★'.repeat(5)}
                                        </div>
                                    </div>
                                    <span className="review-date">1 month ago</span>
                                </div>
                                <p>Excellent communication and the meetup was very convenient. Highly recommended!</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Profile
