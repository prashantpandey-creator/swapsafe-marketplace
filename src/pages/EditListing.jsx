import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { listingsAPI, uploadImages, aiAPI } from '../services/api'
import { categories, conditions } from '../data/mockData'
import './CreateListing.css' // Reusing the same styles

function EditListing() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        condition: '',
        price: '',
        originalPrice: '',
        images: [],
        location: {
            city: '',
            state: '',
            zip: ''
        },
        deliveryOptions: {
            meetup: true,
            shipping: false
        }
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [imageFiles, setImageFiles] = useState([])
    const [previewUrls, setPreviewUrls] = useState([])
    const [step, setStep] = useState(1)

    // Load existing listing data
    useEffect(() => {
        const fetchListing = async () => {
            try {
                const response = await listingsAPI.getById(id)
                const listing = response.listing || response

                // Populate form
                setFormData({
                    title: listing.title,
                    description: listing.description,
                    category: listing.category,
                    condition: listing.condition,
                    price: listing.price,
                    originalPrice: listing.originalPrice || '',
                    images: listing.images || [],
                    location: listing.location || { city: '', state: '', zip: '' },
                    deliveryOptions: listing.deliveryOptions || { meetup: true, shipping: false }
                })

                // Set previews for existing images
                setPreviewUrls(listing.images || [])
            } catch (err) {
                console.error("Failed to fetch listing:", err)
                alert("Could not load listing details")
                navigate('/dashboard')
            } finally {
                setIsLoading(false)
            }
        }
        fetchListing()
    }, [id, navigate])

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login')
        }
    }, [isAuthenticated, navigate])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleLocationChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            location: {
                ...prev.location,
                [name]: value
            }
        }))
    }

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files)
        if (files.length + previewUrls.length > 5) {
            alert("Maximum 5 images allowed")
            return
        }

        setImageFiles(prev => [...prev, ...files])

        // Create previews
        const newPreviews = files.map(file => URL.createObjectURL(file))
        setPreviewUrls(prev => [...prev, ...newPreviews])
    }

    const removeImage = (index) => {
        // If it's an existing image (URL string)
        if (typeof previewUrls[index] === 'string' && !previewUrls[index].startsWith('blob:')) {
            setFormData(prev => ({
                ...prev,
                images: prev.images.filter((_, i) => i !== index)
            }))
        } else {
            // It's a new file, calculate offset to remove from imageFiles
            // This logic is tricky if mixing old and new deletes. 
            // Simplified: We construct the final list at submit time.
            // For now, removing from preview is enough visually, but we need to track it.

            // Correct approach: Maintain a "kept existing images" list and a "new files" list
            // But for simplicity in this artifact, let's just allow clearing and re-adding if complex editing is needed.
            // Or better: Just calculate index relative to total.

            const numExisting = formData.images.length
            if (index >= numExisting) {
                const fileIndex = index - numExisting
                setImageFiles(prev => prev.filter((_, i) => i !== fileIndex))
            }
        }

        setPreviewUrls(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            let finalImages = [...formData.images] // Start with existing images

            // Upload new images if any
            if (imageFiles.length > 0) {
                const uploadedUrls = await uploadImages(imageFiles)
                finalImages = [...finalImages, ...uploadedUrls]
            }

            const listingData = {
                ...formData,
                images: finalImages,
                price: Number(formData.price),
                originalPrice: formData.originalPrice ? Number(formData.originalPrice) : 0
            }

            await listingsAPI.update(id, listingData)
            navigate('/dashboard?tab=listings')
        } catch (error) {
            console.error('Update failed:', error)
            alert('Failed to update listing: ' + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) return <div className="text-center py-20">Loading...</div>

    return (
        <div className="create-listing-page pt-24 pb-12 min-h-screen bg-legion-bg">
            <div className="container max-w-3xl mx-auto px-4">
                <div className="bg-legion-card border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <h1 className="text-3xl font-bold text-white mb-8">Edit Listing</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Images Section */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-300">Images</label>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                                {previewUrls.map((url, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group border border-white/10">
                                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </div>
                                ))}
                                {previewUrls.length < 5 && (
                                    <label className="aspect-square rounded-lg border-2 border-dashed border-white/20 hover:border-legion-gold flex flex-col items-center justify-center cursor-pointer transition-colors text-gray-400 hover:text-legion-gold">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        <span className="text-xs">Add Photo</span>
                                        <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-legion-gold outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-legion-gold outline-none resize-none"
                                    required
                                ></textarea>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-legion-gold outline-none appearance-none"
                                    required
                                >
                                    <option value="" disabled>Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Condition</label>
                                <select
                                    name="condition"
                                    value={formData.condition}
                                    onChange={handleInputChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-legion-gold outline-none appearance-none"
                                    required
                                >
                                    <option value="" disabled>Select Condition</option>
                                    {conditions.map(cond => (
                                        <option key={cond.value} value={cond.value}>{cond.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Price & Location */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Price (₹)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-legion-gold outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.location.city}
                                    onChange={handleLocationChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-legion-gold outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-legion-gold text-legion-bg font-bold px-8 py-3 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default EditListing
