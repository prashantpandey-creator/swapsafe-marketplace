import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { categories, conditions } from '../data/mockData'
import { listingsAPI, aiAPI, uploadImages } from '../services/api'
import './CreateListing.css'

function CreateListing() {
    const navigate = useNavigate()
    const { isAuthenticated, user } = useAuth()
    const fileInputRef = useRef(null)

    // Step 0: Magic Upload, 1: Details, 2: Photos (Review), 3: Pricing
    const [step, setStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isEstimating, setIsEstimating] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    // AI Data
    const [aiEstimate, setAiEstimate] = useState(null)
    const [analysisData, setAnalysisData] = useState(null)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        condition: '', // Default to Good?
        price: '',
        originalPrice: '',
        images: [],
        imageFiles: [],
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

    // --- Actions ---

    const handleMagicUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        // 1. Show Analysis Interaction
        setIsAnalyzing(true)
        const imageUrl = URL.createObjectURL(file)

        // Add to state immediately for preview
        setFormData(prev => ({
            ...prev,
            images: [imageUrl],
            imageFiles: [file]
        }))

        try {
            // 2. Call AI (Mocked for now)
            const analysis = await aiAPI.analyzeImage(file)

            // 3. Process Result
            setAnalysisData(analysis)
            setAiEstimate({
                value: analysis.estimatedPrice,
                retailPrice: analysis.originalPrice,
                confidence: analysis.confidence,
                reasoning: analysis.reasoning,
                priceRange: { low: analysis.estimatedPrice * 0.9, high: analysis.estimatedPrice * 1.1 }
            })

            // 4. Smooth Transition (Simulate delay if API is too fast)
            setTimeout(() => {
                setFormData(prev => ({
                    ...prev,
                    title: analysis.title,
                    category: analysis.category,
                    condition: analysis.condition,
                    description: prev.description || `${analysis.title}. ${analysis.features.join('. ')}.`,
                    price: analysis.estimatedPrice.toString(),
                    originalPrice: analysis.originalPrice.toString()
                }))
                setIsAnalyzing(false)
                setStep(1) // Go to Details Review
            }, 2000)

        } catch (error) {
            console.error(error)
            setErrors({ main: 'AI could not identify the item. Please fill details manually.' })
            setIsAnalyzing(false)
            setStep(1)
        }
    }

    const handleSkipMagic = () => {
        setStep(1)
    }

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files)
        const imageUrls = files.map(file => URL.createObjectURL(file))
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...imageUrls].slice(0, 6),
            imageFiles: [...prev.imageFiles, ...files].slice(0, 6)
        }))
    }

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
            imageFiles: prev.imageFiles.filter((_, i) => i !== index)
        }))
    }

    // --- Validation & Nav ---

    const validateStep = (stepNum) => {
        const newErrors = {}
        if (stepNum === 1) {
            if (!formData.title.trim()) newErrors.title = 'Title is required'
            if (!formData.category) newErrors.category = 'Category required'
            if (!formData.condition) newErrors.condition = 'Condition required'
        }
        if (stepNum === 3) {
            if (!formData.price) newErrors.price = 'Price is required'
            if (!formData.location.city) newErrors.city = 'City required'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateStep(step)) setStep(step + 1)
    }

    const handleSubmit = async () => {
        if (!validateStep(3)) return
        setIsSubmitting(true)
        try {
            // Upload Strategy: In real app, upload to Cloudinary here
            // For MVP, we send base64 or assuming backend handles it
            let imageUrls = formData.images
            if (formData.imageFiles.length > 0) {
                imageUrls = await uploadImages(formData.imageFiles)
            }

            await listingsAPI.create({
                ...formData,
                price: Number(formData.price),
                originalPrice: Number(formData.originalPrice),
                images: imageUrls,
                location: formData.location, // Simplified
                deliveryOptions: {
                    meetup: formData.meetupAvailable,
                    shipping: formData.deliveryAvailable
                },
                // Add AI metadata
                aiMetadata: analysisData ? {
                    detected: analysisData.title,
                    confidence: analysisData.confidence
                } : null
            })
            setStep(4) // Success
        } catch (error) {
            setErrors({ submit: error.message || 'Failed to create listing' })
        } finally {
            setIsSubmitting(false)
        }
    }

    // --- RENDERERS ---

    // 1. AI Scanning Overlay
    if (isAnalyzing) {
        return (
            <div className="ai-scanning-overlay">
                <div className="scanner-container">
                    <div className="scanner-glow"></div>
                    <div className="scanner-circle">
                        <img src={formData.images[0]} alt="Scanning" className="scanning-image" />
                        <div className="scan-line"></div>
                    </div>
                    <h2>Identifying Item...</h2>
                    <div className="scan-text">
                        <span className="typewriter">Analyzing Shape...</span>
                        <span className="typewriter delay-1">Checking Market Prices...</span>
                    </div>
                </div>
            </div>
        )
    }

    // 2. Success Screen
    if (step === 4) {
        return (
            <div className="create-listing-success container">
                <div className="success-content glass-panel">
                    <div className="success-icon animate-bounce">
                        <span className="shield-check">🛡️</span>
                    </div>
                    <h1>Listing Protected & Live!</h1>
                    <p>Your item is now visible to the Buyers Legion.</p>
                    <div className="success-actions">
                        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">Go to Dashboard</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="create-listing-page">
            <div className="container">

                {/* Header / Progress - Hidden on Step 0 for immersion */}
                {step > 0 && (
                    <div className="listing-progress-compact">
                        <button className="back-btn" onClick={() => setStep(step - 1)}>← Back</button>
                        <div className="steps-dots">
                            {[1, 2, 3].map(s => <div key={s} className={`dot ${step >= s ? 'active' : ''}`} />)}
                        </div>
                    </div>
                )}

                <div className="listing-form-container glass-panel">

                    {/* STEP 0: MAGIC CAMERA (Entry) */}
                    {step === 0 && (
                        <div className="magic-upload-step">
                            <div className="magic-header">
                                <span className="magic-icon">✨</span>
                                <h1>Snap & Sell</h1>
                                <p>Upload one photo. Our AI will fill the details for you.</p>
                            </div>

                            <div
                                className="upload-zone"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="upload-content">
                                    <div className="camera-icon-large">📸</div>
                                    <span className="upload-cta">Tap to Upload Photo</span>
                                    <span className="upload-sub">We'll remove the background & estimate price.</span>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleMagicUpload}
                                    accept="image/*"
                                    hidden
                                />
                            </div>

                            <button onClick={handleSkipMagic} className="btn-text">
                                I'll enter details manually
                            </button>
                        </div>
                    )}

                    {/* STEP 1: REVIEW DETAILS (Auto-Filled) */}
                    {step === 1 && (
                        <div className="listing-step animate-fadeIn">
                            <div className="step-header">
                                <h2>Is this correct?</h2>
                                {analysisData && <span className="ai-badge">✨ AI Filled</span>}
                            </div>

                            {/* Title */}
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    className="form-input"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Item Title"
                                />
                            </div>

                            {/* Tags / Category */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        className="form-select"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">Select</option>
                                        {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Condition</label>
                                    <select
                                        className="form-select"
                                        value={formData.condition}
                                        onChange={e => setFormData({ ...formData, condition: e.target.value })}
                                    >
                                        <option value="">Select</option>
                                        {conditions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    className="form-textarea"
                                    rows={4}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <button className="btn btn-primary full-width" onClick={handleNext}>
                                Looks Good, Next →
                            </button>
                        </div>
                    )}

                    {/* STEP 2: PHOTOS (Add More) */}
                    {step === 2 && (
                        <div className="listing-step animate-fadeIn">
                            <h2>Photos</h2>
                            <p>Here is your cover photo. Add more angles if you like.</p>

                            <div className="photo-grid">
                                {formData.images.map((img, i) => (
                                    <div key={i} className="photo-item">
                                        <img src={img} alt="" />
                                        <button className="remove-btn" onClick={() => removeImage(i)}>×</button>
                                        {i === 0 && <span className="cover-badge">Cover</span>}
                                    </div>
                                ))}
                                <label className="add-photo-btn">
                                    +
                                    <input type="file" multiple onChange={handleImageUpload} hidden />
                                </label>
                            </div>

                            <button className="btn btn-primary full-width" onClick={handleNext}>
                                Next: Pricing →
                            </button>
                        </div>
                    )}

                    {/* STEP 3: PRICING (AI Suggestion) */}
                    {step === 3 && (
                        <div className="listing-step animate-fadeIn">
                            <h2>Set Price</h2>

                            {aiEstimate && (
                                <div className="price-oracle-card">
                                    <div className="oracle-header">
                                        <span className="oracle-icon">🔮</span>
                                        <div>
                                            <h4>Oracle Suggestion</h4>
                                            <p>{aiEstimate.reasoning}</p>
                                        </div>
                                    </div>
                                    <div className="oracle-price">
                                        ₹{aiEstimate.value?.toLocaleString()}
                                    </div>
                                    <button
                                        className="btn btn-sm btn-outline"
                                        onClick={() => setFormData({ ...formData, price: aiEstimate.value })}
                                    >
                                        Apply Price
                                    </button>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Your Price (₹)</label>
                                <input
                                    type="number"
                                    className="form-input price-input"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Location (City)</label>
                                <input
                                    className="form-input"
                                    value={formData.location.city}
                                    onChange={e => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
                                    placeholder="e.g. Mumbai"
                                />
                            </div>

                            {errors.submit && <p className="error-text">{errors.submit}</p>}

                            <button
                                className="btn btn-primary full-width btn-lg"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Listing...' : 'Publish Listing'}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}

export default CreateListing
