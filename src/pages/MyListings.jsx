import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/common/ProductCard'
import { listingsAPI } from '../services/api'
import { Plus, Trash2, Edit } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import ListingSuccess from '../components/sell/ListingSuccess'

const MyListings = () => {
    const { user, isAuthenticated } = useAuth()
    const [myListings, setMyListings] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showSuccess, setShowSuccess] = useState(false)

    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        if (location.state?.success) {
            setShowSuccess(true)
            // Clear the state so it doesn't show on refresh
            window.history.replaceState({}, document.title)
        }
    }, [location])

    useEffect(() => {
        if (isAuthenticated) {
            fetchListings()
        }
    }, [isAuthenticated])

    const fetchListings = async () => {
        try {
            setIsLoading(true)
            const response = await listingsAPI.getMyListings()
            setMyListings(response.listings || [])
        } catch (err) {
            console.error("Failed to fetch listings:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this listing permanently?")) return
        try {
            await listingsAPI.delete(id)
            setMyListings(prev => prev.filter(l => (l._id || l.id) !== id))
        } catch (error) {
            console.error(error)
            alert("Failed to delete")
        }
    }

    if (!isAuthenticated) return null

    return (
        <div className="min-h-screen pt-24 pb-12">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Listings</h1>
                        <p className="text-gray-400">Manage your active inventory ({myListings.length})</p>
                    </div>
                    <Link to="/sell" className="btn btn-primary flex items-center gap-2">
                        <Plus className="w-5 h-5" /> New Listing
                    </Link>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-[350px] bg-white/5 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : myListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {myListings.map(listing => (
                            <div key={listing._id || listing.id} className="relative group">
                                <ProductCard product={listing} />
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link
                                        to={`/edit-listing/${listing._id || listing.id}`}
                                        className="p-2 bg-white/90 text-black rounded-full shadow hover:bg-legion-gold transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(listing._id || listing.id)}
                                        className="p-2 bg-red-500/90 text-white rounded-full shadow hover:bg-red-600 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-2">No active listings</h3>
                        <p className="text-gray-400 mb-6">You haven't listed anything yet.</p>
                        <Link to="/sell" className="btn btn-outline">Create First Listing</Link>
                    </div>
                )}
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccess && (
                    <ListingSuccess onClose={() => setShowSuccess(false)} />
                )}
            </AnimatePresence>
        </div>
    )
}

export default MyListings
