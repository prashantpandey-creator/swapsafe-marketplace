import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/common/ProductCard'
import { listingsAPI, paymentAPI } from '../services/api'
import { mockTransactions, formatPrice } from '../data/mockData'
import './Dashboard.css'

function Dashboard() {
    const [searchParams] = useSearchParams()
    const { user, isAuthenticated } = useAuth() // Removed logout as it's not used directly here
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')

    // State for Real Data
    const [myListings, setMyListings] = useState([])
    const [myOrders, setMyOrders] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    // Mock for Transactions (Phase 2 done via API now, but leaving var for safety if render needs it)
    // const userTransactions = mockTransactions 

    useEffect(() => {
        if (isAuthenticated) {
            fetchDashboardData()
        }
    }, [isAuthenticated])

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true)
            const [listingsRes, ordersRes] = await Promise.all([
                listingsAPI.getMyListings(),
                paymentAPI.getOrders('buyer') // Fetch orders where I am the buyer
            ])
            setMyListings(listingsRes.listings || [])
            setMyOrders(ordersRes.orders || [])
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err)
            setError("Could not load dashboard data")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteListing = async (listingId) => {
        if (!window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) return

        try {
            await listingsAPI.delete(listingId)
            // Remove from local state
            setMyListings(prev => prev.filter(l => (l._id || l.id) !== listingId))
            alert("Listing deleted successfully")
        } catch (err) {
            console.error("Delete failed:", err)
            alert("Failed to delete listing")
        }
    }

    const stats = [
        { label: 'Total Sales', value: '₹0', icon: '💰', trend: '--' }, // Connected to real transactions later
        { label: 'Active Listings', value: myListings.length.toString(), icon: '📦', trend: 'Live' },
        { label: 'Total Views', value: myListings.reduce((acc, curr) => acc + (curr.views || 0), 0).toString(), icon: '👁️', trend: 'All time' },
        { label: 'Rating', value: user?.rating || 'New', icon: '⭐', trend: 'Seller' },
    ]

    if (!isAuthenticated) {
        return (
            <div className="dashboard-auth-required container">
                <h2>Please log in to access your dashboard</h2>
                <Link to="/login" className="btn btn-primary">Log In</Link>
            </div>
        )
    }

    // Helper for Listing Card Actions
    const ListingActions = ({ listing }) => (
        <div className="listing-actions-overlay absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
                to={`/edit-listing/${listing._id || listing.id}`}
                className="p-2 bg-white/90 text-slate-800 rounded-full shadow-lg hover:bg-legion-gold transition-colors"
                title="Edit Listing"
            >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </Link>
            {listing.status === 'active' && (
                <button
                    onClick={async () => {
                        if (confirm('Mark this item as Sold? This will hide it from the marketplace.')) {
                            try {
                                await listingsAPI.update(listing._id || listing.id, { status: 'sold' })
                                alert('Item marked as sold!')
                                fetchDashboardData() // Refresh
                            } catch (e) { alert('Failed to update status') }
                        }
                    }}
                    className="p-2 bg-green-500/90 text-white rounded-full shadow-lg hover:bg-green-600 transition-colors"
                    title="Mark as Sold"
                >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </button>
            )}
            <button
                onClick={() => handleDeleteListing(listing._id || listing.id)}
                className="p-2 bg-red-500/90 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                title="Delete Listing"
            >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    )

    return (
        <div className="dashboard-page">
            <div className="container">
                {/* Header */}
                <div className="dashboard-header">
                    <div className="user-welcome">
                        <img
                            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`}
                            alt={user?.name}
                            className="avatar avatar-xl"
                        />
                        <div>
                            <h1>Welcome back, {user?.name?.split(' ')[0]}!</h1>
                            <p>Here's what's happening with your account</p>
                        </div>
                    </div>
                    <Link to="/sell" className="btn btn-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Listing
                    </Link>
                </div>

                {/* Stats */}
                <div className="stats-grid">
                    {stats.map((stat, index) => (
                        <div key={index} className="stat-card card">
                            <div className="stat-icon">{stat.icon}</div>
                            <div className="stat-info">
                                <span className="stat-value">{stat.value}</span>
                                <span className="stat-label">{stat.label}</span>
                            </div>
                            <span className="stat-trend positive">{stat.trend}</span>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="dashboard-tabs">
                    <div className="tabs">
                        <button
                            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            Overview
                        </button>
                        <button
                            className={`tab ${activeTab === 'listings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('listings')}
                        >
                            My Listings
                        </button>
                        <button
                            className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            Orders
                        </button>
                        <button
                            className={`tab ${activeTab === 'earnings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('earnings')}
                        >
                            Earnings
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="dashboard-content">
                    {activeTab === 'overview' && (
                        <div className="overview-tab animate-fadeIn">
                            {/* Recent Activity */}
                            <section className="dashboard-section">
                                <div className="section-header">
                                    <h2>Recent Transactions</h2>
                                    <button className="btn btn-ghost" onClick={() => setActiveTab('orders')}>View All</button>
                                </div>
                                {userTransactions.length > 0 ? (
                                    <div className="transactions-list">
                                        {userTransactions.map(txn => (
                                            <div key={txn.id} className="transaction-item card">
                                                <img src={txn.listing.images[0]} alt={txn.listing.title} />
                                                <div className="txn-details">
                                                    <h4>{txn.listing.title}</h4>
                                                    <p>
                                                        {txn.status === 'escrow' ? 'Buyer' : 'Sold to'}: {txn.buyer.name}
                                                    </p>
                                                </div>
                                                <div className="txn-status">
                                                    <span className={`badge badge-${txn.status === 'completed' ? 'success' : 'warning'}`}>
                                                        {txn.status === 'escrow' ? 'In Escrow' : 'Completed'}
                                                    </span>
                                                    <span className="txn-amount">{formatPrice(txn.amount)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state card p-8 text-center text-gray-400">
                                        <p>No recent transactions.</p>
                                    </div>
                                )}
                            </section>

                            {/* My Listings */}
                            <section className="dashboard-section">
                                <div className="section-header">
                                    <h2>Your Listings</h2>
                                    <button className="btn btn-ghost" onClick={() => setActiveTab('listings')}>View All</button>
                                </div>
                                {isLoading ? (
                                    <div className="text-center py-8">Loading listings...</div>
                                ) : myListings.length > 0 ? (
                                    <div className="listings-grid grid grid-4">
                                        {myListings.slice(0, 4).map(listing => (
                                            <div key={listing._id || listing.id} className="relative group">
                                                <ProductCard product={listing} />
                                                <ListingActions listing={listing} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state card p-12 text-center">
                                        <p className="mb-4 text-gray-400">You haven't listed any items yet.</p>
                                        <Link to="/sell" className="btn btn-primary">Start Selling</Link>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}

                    {activeTab === 'listings' && (
                        <div className="listings-tab animate-fadeIn">
                            <div className="tab-header">
                                <h2>My Listings ({myListings.length})</h2>
                                <Link to="/sell" className="btn btn-primary">Add New</Link>
                            </div>

                            {isLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                                    <p>Loading your inventory...</p>
                                </div>
                            ) : myListings.length > 0 ? (
                                <div className="listings-grid grid grid-4">
                                    {myListings.map(listing => (
                                        <div key={listing._id || listing.id} className="relative group">
                                            <ProductCard product={listing} />
                                            <ListingActions listing={listing} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state card p-16 text-center">
                                    <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-4xl">📦</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">No Active Listings</h3>
                                    <p className="text-gray-400 mb-6">Your inventory is empty. Time to change that!</p>
                                    <Link to="/sell" className="btn btn-primary">Create Your First Listing</Link>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="orders-tab animate-fadeIn">
                            <h2>Order History</h2>
                            {isLoading ? (
                                <div className="text-center py-12">Loading orders...</div>
                            ) : myOrders.length > 0 ? (
                                <div className="transactions-list">
                                    {myOrders.map(order => (
                                        <div key={order._id} className="transaction-item card">
                                            <img src={order.listing?.images?.[0] || 'https://via.placeholder.com/150'} alt={order.listing?.title} />
                                            <div className="txn-details">
                                                <h4>{order.listing?.title || 'Unknown Item'}</h4>
                                                <p className="text-xs text-gray-400">Order ID: {order.orderId || order._id}</p>
                                                <p className="text-xs text-gray-400">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="txn-status">
                                                <span className={`badge badge-${order.status === 'completed' ? 'success' : order.status === 'paid' ? 'info' : 'warning'}`}>
                                                    {order.status === 'paid' ? 'In Escrow' : order.status}
                                                </span>
                                                <span className="txn-amount">{formatPrice(order.amount?.total || 0)}</span>
                                            </div>
                                            <Link to={`/tracker/${order._id}`} className="btn btn-secondary btn-sm">
                                                Track
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state card p-16 text-center">
                                    <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-4xl">🛍️</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">No Orders Yet</h3>
                                    <p className="text-gray-400 mb-6">You haven't purchased anything.</p>
                                    <Link to="/" className="btn btn-primary">Browse Marketplace</Link>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'earnings' && (
                        <div className="earnings-tab animate-fadeIn">
                            <h2>Earnings</h2>
                            <div className="earnings-summary card">
                                <div className="earning-item">
                                    <span className="earning-label">Total Earnings</span>
                                    <span className="earning-value">₹2,40,000</span>
                                </div>
                                <div className="earning-item">
                                    <span className="earning-label">Pending (In Escrow)</span>
                                    <span className="earning-value pending">₹89,999</span>
                                </div>
                                <div className="earning-item">
                                    <span className="earning-label">Available for Withdrawal</span>
                                    <span className="earning-value available">₹1,50,001</span>
                                </div>
                            </div>
                            <button className="btn btn-primary">Withdraw Funds</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Dashboard
