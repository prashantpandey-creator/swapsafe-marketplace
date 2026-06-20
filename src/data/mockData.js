// Mock data for the marketplace

export const categories = [
    { id: 1, name: 'Electronics', slug: 'electronics', icon: '📱', count: 2450, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 2, name: 'Furniture', slug: 'furniture', icon: '🛋️', count: 1820, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 3, name: 'Vehicles', slug: 'vehicles', icon: '🚗', count: 980, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 4, name: 'Clothing', slug: 'clothing', icon: '👕', count: 3200, gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 5, name: 'Books', slug: 'books', icon: '📚', count: 1540, gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { id: 6, name: 'Sports', slug: 'sports', icon: '⚽', count: 890, gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
]

export const conditions = [
    { value: 'like-new', label: 'Like New', description: 'Barely used, excellent condition' },
    { value: 'good', label: 'Good', description: 'Minor signs of wear' },
    { value: 'fair', label: 'Fair', description: 'Visible wear but fully functional' },
    { value: 'poor', label: 'Poor', description: 'Heavy wear, may need repairs' },
]


export const safeZones = [
    { id: 1, name: 'Inorbit Mall, Malad', city: 'Mumbai', type: 'Mall', lat: 19.1873, lng: 72.8392 },
    { id: 2, name: 'Phoenix Marketcity', city: 'Mumbai', type: 'Mall', lat: 19.0863, lng: 72.8903 },
    { id: 3, name: 'Starbucks, Linking Road', city: 'Mumbai', type: 'Cafe', lat: 19.0654, lng: 72.8323 },
    { id: 4, name: 'Bandra Police Station', city: 'Mumbai', type: 'Police Station', lat: 19.0544, lng: 72.8355 },
    { id: 5, name: 'Koramangala Police Station', city: 'Bangalore', type: 'Police Station', lat: 12.9352, lng: 77.6245 },
    { id: 6, name: 'Forum Mall', city: 'Bangalore', type: 'Mall', lat: 12.9347, lng: 77.6106 },
    { id: 7, name: 'Select Citywalk', city: 'Delhi', type: 'Mall', lat: 28.5289, lng: 77.2190 },
    { id: 8, name: 'Sarojini Nagar Police Station', city: 'Delhi', type: 'Police Station', lat: 28.5774, lng: 77.1945 },
]

// Helper function to format price in INR
export const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(price)
}

// Helper function to get time ago
export const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    }

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit)
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`
        }
    }

    return 'Just now'
}

// Helper function to get condition badge color
export const getConditionColor = (condition) => {
    const colors = {
        'like-new': 'success',
        'good': 'info',
        'fair': 'warning',
        'poor': 'error'
    }
    return colors[condition] || 'info'
}
