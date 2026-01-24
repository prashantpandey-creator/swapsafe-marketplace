import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/common/ProductCard'
import { mockListings, mockTransactions, formatPrice } from '../data/mockData'
import './Dashboard.css'

function Dashboard() {
    const [searchParams] = useSearchParams()
    const { user, isAuthenticated } = useAuth()
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')

    const userListings = mockListings.filter(l => l.seller.id === '1').slice(0, 4)
    const userTransactions = mockTransactions

    const stats = [
        { label: 'Total Sales', value: '₹2.4L', icon: '💰', trend: '+12%' },
        { label: 'Active Listings', value: '8', icon: '📦', trend: '+2' },
        { label: 'Total Views', value: '3.2K', icon: '👁️', trend: '+24%' },
        { label: 'Rating', value: '4.8', icon: '⭐', trend: '+0.2' },
    ]

    if (!isAuthenticated) {
        return (
            <div className="dashboard-auth-required container">
                <h2>Please log in to access your dashboard</h2>
                <Link to="/login" className="btn btn-primary">Log In</Link>
            </div>
        )
    }

    return (
        <div className="dashboard-page">
            <div className="container">
                {/* Header */}
                <div className="dashboard-header">
                    <div className="user-welcome">
                        <img src={user?.avatar} alt={user?.name} className="avatar avatar-xl" />
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
                            </section>

                            {/* My Listings */}
                            <section className="dashboard-section">
                                <div className="section-header">
                                    <h2>Your Listings</h2>
                                    <button className="btn btn-ghost" onClick={() => setActiveTab('listings')}>View All</button>
                                </div>
                                <div className="listings-grid grid grid-4">
                                    {userListings.map(listing => (
                                        <ProductCard key={listing.id} product={listing} />
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'listings' && (
                        <div className="listings-tab animate-fadeIn">
                            <div className="tab-header">
                                <h2>My Listings ({userListings.length})</h2>
                                <Link to="/sell" className="btn btn-primary">Add New</Link>
                            </div>
                            <div className="listings-grid grid grid-4">
                                {userListings.map(listing => (
                                    <ProductCard key={listing.id} product={listing} />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="orders-tab animate-fadeIn">
                            <h2>Order History</h2>
                            <div className="transactions-list">
                                {userTransactions.map(txn => (
                                    <div key={txn.id} className="transaction-item card">
                                        <img src={txn.listing.images[0]} alt={txn.listing.title} />
                                        <div className="txn-details">
                                            <h4>{txn.listing.title}</h4>
                                            <p>Order ID: {txn.id}</p>
                                            <p>Date: {new Date(txn.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="txn-status">
                                            <span className={`badge badge-${txn.status === 'completed' ? 'success' : 'warning'}`}>
                                                {txn.status === 'escrow' ? 'In Escrow' : 'Completed'}
                                            </span>
                                            <span className="txn-amount">{formatPrice(txn.amount)}</span>
                                        </div>
                                        <Link to={`/track/${txn.id}`} className="btn btn-secondary btn-sm">
                                            Track
                                        </Link>
                                    </div>
                                ))}
                            </div>
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
