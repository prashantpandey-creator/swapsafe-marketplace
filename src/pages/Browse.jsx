import { useState, useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/common/ProductCard'
import { mockListings, categories, conditions, formatPrice } from '../data/mockData'
import './Browse.css'

function Browse() {
    const { category } = useParams()
    const [searchParams, setSearchParams] = useSearchParams()

    const [filters, setFilters] = useState({
        category: category || searchParams.get('category') || '',
        condition: searchParams.get('condition') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        location: searchParams.get('location') || '',
        sortBy: searchParams.get('sort') || 'newest',
        deliveryOnly: searchParams.get('delivery') === 'true',
        verifiedOnly: searchParams.get('verified') === 'true'
    })

    const [viewMode, setViewMode] = useState('grid')
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
    const searchQuery = searchParams.get('search') || ''

    // Update category from URL params
    useEffect(() => {
        if (category) {
            setFilters(prev => ({ ...prev, category }))
        }
    }, [category])

    // Filter and sort listings
    const filteredListings = useMemo(() => {
        let result = [...mockListings]

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(listing =>
                listing.title.toLowerCase().includes(query) ||
                listing.description.toLowerCase().includes(query)
            )
        }

        // Category filter
        if (filters.category) {
            result = result.filter(listing => listing.category === filters.category)
        }

        // Condition filter
        if (filters.condition) {
            result = result.filter(listing => listing.condition === filters.condition)
        }

        // Price range filter
        if (filters.minPrice) {
            result = result.filter(listing => listing.price >= parseInt(filters.minPrice))
        }
        if (filters.maxPrice) {
            result = result.filter(listing => listing.price <= parseInt(filters.maxPrice))
        }

        // Location filter
        if (filters.location) {
            result = result.filter(listing =>
                listing.location.city.toLowerCase().includes(filters.location.toLowerCase()) ||
                listing.location.state.toLowerCase().includes(filters.location.toLowerCase())
            )
        }

        // Delivery available filter
        if (filters.deliveryOnly) {
            result = result.filter(listing => listing.deliveryAvailable)
        }

        // Verified only filter
        if (filters.verifiedOnly) {
            result = result.filter(listing => listing.aiVerified)
        }

        // Sort
        switch (filters.sortBy) {
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                break
            case 'oldest':
                result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                break
            case 'price-low':
                result.sort((a, b) => a.price - b.price)
                break
            case 'price-high':
                result.sort((a, b) => b.price - a.price)
                break
            case 'popular':
                result.sort((a, b) => b.views - a.views)
                break
            default:
                break
        }

        return result
    }, [filters, searchQuery])

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const clearFilters = () => {
        setFilters({
            category: '',
            condition: '',
            minPrice: '',
            maxPrice: '',
            location: '',
            sortBy: 'newest',
            deliveryOnly: false,
            verifiedOnly: false
        })
        setSearchParams({})
    }

    const activeFilterCount = Object.entries(filters).filter(
        ([key, value]) => value && key !== 'sortBy' && value !== false
    ).length

    const currentCategory = categories.find(c => c.slug === filters.category)

    return (
        <div className="browse-page">
            {/* Page Header */}
            <div className="browse-header">
                <div className="container">
                    <div className="browse-header-content">
                        <div>
                            <h1>
                                {currentCategory ? currentCategory.name : searchQuery ? `Results for "${searchQuery}"` : 'Browse All Items'}
                            </h1>
                            <p>{filteredListings.length} items found</p>
                        </div>

                        <div className="browse-header-actions">
                            {/* Sort Dropdown */}
                            <select
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className="form-select sort-select"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="popular">Most Popular</option>
                            </select>

                            {/* View Toggle */}
                            <div className="view-toggle">
                                <button
                                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                    onClick={() => setViewMode('grid')}
                                    title="Grid View"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="7" height="7" />
                                        <rect x="14" y="3" width="7" height="7" />
                                        <rect x="14" y="14" width="7" height="7" />
                                        <rect x="3" y="14" width="7" height="7" />
                                    </svg>
                                </button>
                                <button
                                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={() => setViewMode('list')}
                                    title="List View"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="8" y1="6" x2="21" y2="6" />
                                        <line x1="8" y1="12" x2="21" y2="12" />
                                        <line x1="8" y1="18" x2="21" y2="18" />
                                        <line x1="3" y1="6" x2="3.01" y2="6" />
                                        <line x1="3" y1="12" x2="3.01" y2="12" />
                                        <line x1="3" y1="18" x2="3.01" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            {/* Mobile Filter Toggle */}
                            <button
                                className="mobile-filter-toggle btn btn-secondary"
                                onClick={() => setIsMobileFilterOpen(true)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                </svg>
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="filter-count">{activeFilterCount}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="browse-content container">
                {/* Sidebar Filters */}
                <aside className={`browse-sidebar ${isMobileFilterOpen ? 'open' : ''}`}>
                    <div className="sidebar-header">
                        <h3>Filters</h3>
                        {activeFilterCount > 0 && (
                            <button className="clear-filters" onClick={clearFilters}>
                                Clear All
                            </button>
                        )}
                        <button
                            className="close-sidebar"
                            onClick={() => setIsMobileFilterOpen(false)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Category Filter */}
                    <div className="filter-group">
                        <h4>Category</h4>
                        <div className="filter-options">
                            <label className="filter-option">
                                <input
                                    type="radio"
                                    name="category"
                                    checked={!filters.category}
                                    onChange={() => handleFilterChange('category', '')}
                                />
                                <span>All Categories</span>
                            </label>
                            {categories.map(cat => (
                                <label key={cat.id} className="filter-option">
                                    <input
                                        type="radio"
                                        name="category"
                                        checked={filters.category === cat.slug}
                                        onChange={() => handleFilterChange('category', cat.slug)}
                                    />
                                    <span>
                                        {cat.icon} {cat.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Condition Filter */}
                    <div className="filter-group">
                        <h4>Condition</h4>
                        <div className="filter-options">
                            <label className="filter-option">
                                <input
                                    type="radio"
                                    name="condition"
                                    checked={!filters.condition}
                                    onChange={() => handleFilterChange('condition', '')}
                                />
                                <span>Any Condition</span>
                            </label>
                            {conditions.map(cond => (
                                <label key={cond.value} className="filter-option">
                                    <input
                                        type="radio"
                                        name="condition"
                                        checked={filters.condition === cond.value}
                                        onChange={() => handleFilterChange('condition', cond.value)}
                                    />
                                    <span>{cond.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="filter-group">
                        <h4>Price Range</h4>
                        <div className="price-inputs">
                            <input
                                type="number"
                                placeholder="Min"
                                value={filters.minPrice}
                                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                className="form-input"
                            />
                            <span>to</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={filters.maxPrice}
                                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                className="form-input"
                            />
                        </div>
                        <div className="price-presets">
                            <button onClick={() => { handleFilterChange('minPrice', ''); handleFilterChange('maxPrice', '5000') }}>
                                Under ₹5K
                            </button>
                            <button onClick={() => { handleFilterChange('minPrice', '5000'); handleFilterChange('maxPrice', '25000') }}>
                                ₹5K - ₹25K
                            </button>
                            <button onClick={() => { handleFilterChange('minPrice', '25000'); handleFilterChange('maxPrice', '100000') }}>
                                ₹25K - ₹1L
                            </button>
                            <button onClick={() => { handleFilterChange('minPrice', '100000'); handleFilterChange('maxPrice', '') }}>
                                Above ₹1L
                            </button>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="filter-group">
                        <h4>Location</h4>
                        <input
                            type="text"
                            placeholder="Enter city or state"
                            value={filters.location}
                            onChange={(e) => handleFilterChange('location', e.target.value)}
                            className="form-input"
                        />
                    </div>

                    {/* Toggle Filters */}
                    <div className="filter-group">
                        <h4>More Options</h4>
                        <label className="filter-toggle">
                            <input
                                type="checkbox"
                                checked={filters.deliveryOnly}
                                onChange={(e) => handleFilterChange('deliveryOnly', e.target.checked)}
                            />
                            <span className="toggle-switch"></span>
                            <span>Delivery Available</span>
                        </label>
                        <label className="filter-toggle">
                            <input
                                type="checkbox"
                                checked={filters.verifiedOnly}
                                onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                            />
                            <span className="toggle-switch"></span>
                            <span>AI Verified Only</span>
                        </label>
                    </div>

                    {/* Mobile Apply Button */}
                    <button
                        className="apply-filters-btn btn btn-primary"
                        onClick={() => setIsMobileFilterOpen(false)}
                    >
                        Apply Filters
                    </button>
                </aside>

                {/* Mobile Overlay */}
                {isMobileFilterOpen && (
                    <div
                        className="sidebar-overlay"
                        onClick={() => setIsMobileFilterOpen(false)}
                    />
                )}

                {/* Listings Grid */}
                <main className="browse-main">
                    {/* Active Filters */}
                    {activeFilterCount > 0 && (
                        <div className="active-filters">
                            {filters.category && (
                                <span className="active-filter">
                                    {categories.find(c => c.slug === filters.category)?.name}
                                    <button onClick={() => handleFilterChange('category', '')}>×</button>
                                </span>
                            )}
                            {filters.condition && (
                                <span className="active-filter">
                                    {conditions.find(c => c.value === filters.condition)?.label}
                                    <button onClick={() => handleFilterChange('condition', '')}>×</button>
                                </span>
                            )}
                            {(filters.minPrice || filters.maxPrice) && (
                                <span className="active-filter">
                                    {filters.minPrice ? formatPrice(filters.minPrice) : '₹0'} - {filters.maxPrice ? formatPrice(filters.maxPrice) : 'Any'}
                                    <button onClick={() => { handleFilterChange('minPrice', ''); handleFilterChange('maxPrice', '') }}>×</button>
                                </span>
                            )}
                            {filters.location && (
                                <span className="active-filter">
                                    {filters.location}
                                    <button onClick={() => handleFilterChange('location', '')}>×</button>
                                </span>
                            )}
                            {filters.deliveryOnly && (
                                <span className="active-filter">
                                    Delivery Available
                                    <button onClick={() => handleFilterChange('deliveryOnly', false)}>×</button>
                                </span>
                            )}
                            {filters.verifiedOnly && (
                                <span className="active-filter">
                                    AI Verified
                                    <button onClick={() => handleFilterChange('verifiedOnly', false)}>×</button>
                                </span>
                            )}
                        </div>
                    )}

                    {filteredListings.length > 0 ? (
                        <div className={`listings-grid ${viewMode === 'list' ? 'list-view' : 'grid grid-4'}`}>
                            {filteredListings.map(listing => (
                                <ProductCard key={listing.id} product={listing} />
                            ))}
                        </div>
                    ) : (
                        <div className="no-results">
                            <div className="no-results-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                    <path d="M8 8l6 6M14 8l-6 6" />
                                </svg>
                            </div>
                            <h3>No items found</h3>
                            <p>Try adjusting your filters or search query</p>
                            <button className="btn btn-primary" onClick={clearFilters}>
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default Browse
