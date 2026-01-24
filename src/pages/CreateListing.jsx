import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { categories, conditions } from '../data/mockData'
import './CreateListing.css'

function CreateListing() {
    const navigate = useNavigate()
    const { isAuthenticated, user } = useAuth()

    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
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
            state: ''
        },
        deliveryAvailable: true,
        meetupAvailable: true
    })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/sell' } })
        }
    }, [isAuthenticated, navigate])

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files)
        const imageUrls = files.map(file => URL.createObjectURL(file))
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...imageUrls].slice(0, 6)
        }))
    }

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }))
    }

    const validateStep = (stepNum) => {
        const newErrors = {}

        if (stepNum === 1) {
            if (!formData.title.trim()) newErrors.title = 'Title is required'
            if (!formData.description.trim()) newErrors.description = 'Description is required'
            if (!formData.category) newErrors.category = 'Please select a category'
            if (!formData.condition) newErrors.condition = 'Please select condition'
        }

        if (stepNum === 2) {
            if (formData.images.length === 0) newErrors.images = 'At least one image is required'
        }

        if (stepNum === 3) {
            if (!formData.price) newErrors.price = 'Price is required'
            if (!formData.location.city) newErrors.city = 'City is required'
            if (!formData.location.state) newErrors.state = 'State is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateStep(step)) {
            if (step < 4) {
                setStep(step + 1)
            }
        }
    }

    const handleSubmit = async () => {
        if (!validateStep(3)) return

        setIsSubmitting(true)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000))

        setIsSubmitting(false)
        setStep(4) // Success step
    }

    if (step === 4) {
        return (
            <div className="create-listing-success container">
                <div className="success-content">
                    <div className="success-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h1>Listing Created!</h1>
                    <p>Your item is now live and visible to thousands of buyers.</p>

                    <div className="ai-verification-notice">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <div>
                            <strong>AI Verification in Progress</strong>
                            <p>Our AI is analyzing your listing for authenticity. You'll get a verified badge if approved.</p>
                        </div>
                    </div>

                    <div className="success-actions">
                        <button onClick={() => navigate('/dashboard?tab=listings')} className="btn btn-primary btn-lg">
                            View My Listings
                        </button>
                        <button onClick={() => { setStep(1); setFormData({ title: '', description: '', category: '', condition: '', price: '', originalPrice: '', images: [], location: { city: '', state: '' }, deliveryAvailable: true, meetupAvailable: true }); }} className="btn btn-secondary">
                            Create Another
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="create-listing-page">
            <div className="container">
                <div className="listing-header">
                    <h1>Sell Your Item</h1>
                    <p>Create a listing in minutes and reach thousands of buyers</p>
                </div>

                {/* Progress */}
                <div className="listing-progress">
                    <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                        <span>1</span>
                        Details
                    </div>
                    <div className="progress-line"></div>
                    <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                        <span>2</span>
                        Photos
                    </div>
                    <div className="progress-line"></div>
                    <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                        <span>3</span>
                        Pricing
                    </div>
                </div>

                <div className="listing-form-container">
                    {/* Step 1: Details */}
                    {step === 1 && (
                        <div className="listing-step animate-fadeIn">
                            <h2>Item Details</h2>

                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input
                                    type="text"
                                    className={`form-input ${errors.title ? 'error' : ''}`}
                                    placeholder="e.g., iPhone 14 Pro Max 256GB - Space Black"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    maxLength={100}
                                />
                                <span className="char-count">{formData.title.length}/100</span>
                                {errors.title && <span className="form-error">{errors.title}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description *</label>
                                <textarea
                                    className={`form-textarea ${errors.description ? 'error' : ''}`}
                                    placeholder="Describe your item in detail. Include brand, model, condition, what's included, reason for selling, etc."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={6}
                                    maxLength={2000}
                                ></textarea>
                                <span className="char-count">{formData.description.length}/2000</span>
                                {errors.description && <span className="form-error">{errors.description}</span>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Category *</label>
                                    <select
                                        className={`form-select ${errors.category ? 'error' : ''}`}
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.slug}>{cat.icon} {cat.name}</option>
                                        ))}
                                    </select>
                                    {errors.category && <span className="form-error">{errors.category}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Condition *</label>
                                    <select
                                        className={`form-select ${errors.condition ? 'error' : ''}`}
                                        value={formData.condition}
                                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                    >
                                        <option value="">Select condition</option>
                                        {conditions.map(cond => (
                                            <option key={cond.value} value={cond.value}>{cond.label} - {cond.description}</option>
                                        ))}
                                    </select>
                                    {errors.condition && <span className="form-error">{errors.condition}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Photos */}
                    {step === 2 && (
                        <div className="listing-step animate-fadeIn">
                            <h2>Add Photos</h2>
                            <p className="step-desc">Add up to 6 photos. The first photo will be the cover image.</p>

                            <div className="photo-grid">
                                {formData.images.map((img, index) => (
                                    <div key={index} className="photo-item">
                                        <img src={img} alt={`Upload ${index + 1}`} />
                                        <button className="remove-photo" onClick={() => removeImage(index)}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                        {index === 0 && <span className="cover-label">Cover</span>}
                                    </div>
                                ))}

                                {formData.images.length < 6 && (
                                    <label className="photo-upload">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageUpload}
                                        />
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                        <span>Add Photo</span>
                                    </label>
                                )}
                            </div>
                            {errors.images && <span className="form-error">{errors.images}</span>}

                            <div className="photo-tips">
                                <h4>Photo Tips</h4>
                                <ul>
                                    <li>Use natural lighting for best results</li>
                                    <li>Show the item from multiple angles</li>
                                    <li>Include close-ups of any defects</li>
                                    <li>Don't use stock images</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Pricing & Location */}
                    {step === 3 && (
                        <div className="listing-step animate-fadeIn">
                            <h2>Set Your Price</h2>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Selling Price (₹) *</label>
                                    <input
                                        type="number"
                                        className={`form-input ${errors.price ? 'error' : ''}`}
                                        placeholder="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                    {errors.price && <span className="form-error">{errors.price}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Original Price (₹)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Optional"
                                        value={formData.originalPrice}
                                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                    />
                                    <span className="form-hint">Show buyers how much they save</span>
                                </div>
                            </div>

                            <h3>Location</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">City *</label>
                                    <input
                                        type="text"
                                        className={`form-input ${errors.city ? 'error' : ''}`}
                                        placeholder="e.g., Mumbai"
                                        value={formData.location.city}
                                        onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
                                    />
                                    {errors.city && <span className="form-error">{errors.city}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">State *</label>
                                    <input
                                        type="text"
                                        className={`form-input ${errors.state ? 'error' : ''}`}
                                        placeholder="e.g., Maharashtra"
                                        value={formData.location.state}
                                        onChange={(e) => setFormData({ ...formData, location: { ...formData.location, state: e.target.value } })}
                                    />
                                    {errors.state && <span className="form-error">{errors.state}</span>}
                                </div>
                            </div>

                            <h3>Delivery Options</h3>
                            <div className="delivery-toggles">
                                <label className="toggle-option">
                                    <input
                                        type="checkbox"
                                        checked={formData.meetupAvailable}
                                        onChange={(e) => setFormData({ ...formData, meetupAvailable: e.target.checked })}
                                    />
                                    <span className="toggle-switch"></span>
                                    <div>
                                        <strong>Safe Meetup</strong>
                                        <p>Allow buyers to meet you at a safe location</p>
                                    </div>
                                </label>

                                <label className="toggle-option">
                                    <input
                                        type="checkbox"
                                        checked={formData.deliveryAvailable}
                                        onChange={(e) => setFormData({ ...formData, deliveryAvailable: e.target.checked })}
                                    />
                                    <span className="toggle-switch"></span>
                                    <div>
                                        <strong>Home Delivery</strong>
                                        <p>Ship to buyer's address</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="listing-navigation">
                        {step > 1 && (
                            <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>
                                Back
                            </button>
                        )}

                        {step < 3 ? (
                            <button className="btn btn-primary" onClick={handleNext}>
                                Continue
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Publishing...' : 'Publish Listing'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CreateListing
