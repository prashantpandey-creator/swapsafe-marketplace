import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css' // Reusing auth styles for consistency

function ShopSetup() {
    const navigate = useNavigate()
    const { user, updateProfile } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [shopName, setShopName] = useState('')
    const [upiId, setUpiId] = useState('')
    const [bio, setBio] = useState('')
    const [avatar, setAvatar] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setAvatar(file)
            setAvatarPreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)

        // Simulate API call to update user profile with shop details
        try {
            await updateProfile({
                shopName,
                upiId,
                bio,
                isSeller: true,
                onboardingCompleted: true,
                avatar: avatarPreview || user?.avatar // In real app, upload file first
            })

            // Success animation or delay?
            setTimeout(() => {
                navigate('/dashboard')
            }, 1000)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card shop-setup-card">
                    <div className="auth-header">
                        <h1>Setup Your Shop</h1>
                        <p>Create your digital storefront on SwapSafe</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {/* Avatar Upload */}
                        <div className="avatar-upload-section">
                            <div className="avatar-preview">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Shop Avatar" />
                                ) : (
                                    <div className="avatar-placeholder">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                )}
                                <label className="avatar-edit-btn">
                                    <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </label>
                            </div>
                            <span className="upload-hint">Upload Shop Logo</span>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Shop Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Vikram's Vintage Vault"
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">UPI ID (for payments) *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., name@okhdfcbank"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Bio</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Tell buyers about your shop..."
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                            ></textarea>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isLoading}>
                            {isLoading ? 'Setting up...' : 'Launch Shop 🚀'}
                        </button>

                        <button type="button" className="btn btn-text w-full mt-2" onClick={() => navigate('/dashboard')}>
                            Skip for now
                        </button>
                    </form>
                </div>
            </div>

            <style>{`
                .shop-setup-card {
                    max-width: 500px;
                }
                .avatar-upload-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .avatar-preview {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px dashed rgba(255, 255, 255, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    margin-bottom: 0.5rem;
                    overflow: hidden;
                }
                .avatar-preview img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .avatar-placeholder {
                    color: rgba(255, 255, 255, 0.3);
                    width: 40%;
                    height: 40%;
                }
                .avatar-edit-btn {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 32px;
                    height: 32px;
                    background: var(--primary-color);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    transition: transform 0.2s;
                }
                .avatar-edit-btn:hover {
                    transform: scale(1.1);
                }
                .upload-hint {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.875rem;
                }
            `}</style>
        </div>
    )
}

export default ShopSetup
