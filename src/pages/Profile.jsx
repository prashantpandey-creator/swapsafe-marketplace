import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listingsAPI, authAPI } from '../services/api'
import ProductCard from '../components/common/ProductCard'
import GuardianBadge from '../components/trust/GuardianBadge'
import './Profile.css'

function Profile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user: currentUser, isAuthenticated } = useAuth()

    const [profileUser, setProfileUser] = useState(null)
    const [activeTab, setActiveTab] = useState('listings')
    const [userListings, setUserListings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const isOwnProfile = !id || id === 'me' || (currentUser && currentUser.id === id)

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true)
            setError(null)
            try {
                let userIdToFetch = id

                // Handle "me" or empty ID
                if (!id || id === 'me') {
                    if (!isAuthenticated) {
                        navigate('/login')
                        return
                    }
                    userIdToFetch = currentUser.id
                    setProfileUser(currentUser)
                }

                // Fetch Listings
                const listingsResponse = await listingsAPI.getByUser(userIdToFetch)
                setUserListings(listingsResponse.listings || [])

                // If looking at someone else, we might need to fetch their public profile details
                // (assuming listing response populates seller, or we have a getPublicProfile endpoint)
                // For now, if we are viewing "me", we have data. 
                // If viewing others, we rely on the listings fetching or needing a specific user endpoint.

                if (userIdToFetch !== currentUser?.id) {
                    // Since we don't have a direct 'getUser' API yet, we might rely on the first listing's seller info
                    // OR ideally add a 'getUser' endpoint.
                    // Fallback: If listings exist, grab seller info from first listing
                    if (listingsResponse.listings && listingsResponse.listings.length > 0) {
                        setProfileUser(listingsResponse.listings[0].seller)
                    } else {
                        // If no listings, we can't easily get user info without a specific API. 
                        // Check if we requested to add getUser to text?
                        // For now, let's assume valid ID.
                    }
                }

            } catch (err) {
                console.error("Failed to load profile:", err)
                setError("Failed to load profile data.")
            } finally {
                setLoading(false)
            }
        }

        fetchProfileData()
    }, [id, isAuthenticated, currentUser, navigate])


    if (loading) return <div className="container" style={{ padding: '100px', textAlign: 'center' }}>Loading Profile...</div>

    if (error || !profileUser) {
        return (
            <div className="profile-not-found container">
                <h2>User Not Found</h2>
                <p>We couldn't locate this profile. They might not have any active listings yet.</p>
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
                        <img
                            src={profileUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser.name)}&background=6366f1&color=fff`}
                            alt={profileUser.name}
                            className="profile-avatar"
                        />
                        <div className="profile-details">
                            <h1>
                                {profileUser.name}
                                {profileUser.isVerified && (
                                    <div className="ml-2">
                                        <GuardianBadge
                                            level={profileUser.rating >= 4.8 ? 'gold' : profileUser.rating >= 4.5 ? 'silver' : 'verified'}
                                            showLabel={true}
                                        />
                                    </div>
                                )}
                            </h1>
                            <p className="profile-meta">
                                <span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    Member since {new Date(profileUser.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                </span>
                                {profileUser.location && (
                                    <span>
                                        📍 {profileUser.location.city}, {profileUser.location.state}
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="profile-stats">
                            <div className="stat">
                                <span className="stat-value">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    {profileUser.rating || 0}
                                </span>
                                <span className="stat-label">Rating</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{profileUser.totalSales || 0}</span>
                                <span className="stat-label">Sales</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{userListings.length}</span>
                                <span className="stat-label">Listings</span>
                            </div>
                        </div>
                    </div>
                    {isOwnProfile && (
                        <div style={{ padding: '20px', textAlign: 'right' }}>
                            <Link to="/sell" className="btn btn-primary">Create New Listing</Link>
                        </div>
                    )}
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
                        <>
                            {userListings.length > 0 ? (
                                <div className="listings-grid grid grid-4">
                                    {userListings.map(listing => (
                                        <ProductCard key={listing._id || listing.id} product={listing} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-muted">No active listings found.</p>
                                    {isOwnProfile && (
                                        <Link to="/sell" className="btn btn-primary mt-4">Start Selling</Link>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="reviews-section">
                            <div className="text-center py-10 text-muted">
                                No reviews yet.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Profile
