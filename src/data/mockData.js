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

export const mockListings = [
    {
        id: '1',
        title: 'iPhone 14 Pro Max 256GB - Deep Purple',
        description: 'Selling my iPhone 14 Pro Max in excellent condition. Comes with original box, charger, and unused earphones. Battery health at 96%. No scratches or dents. Always used with screen protector and case.',
        price: 89999,
        originalPrice: 139900,
        category: 'electronics',
        condition: 'like-new',
        images: [
            'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=600',
            'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600',
        ],
        seller: {
            id: '1',
            name: 'Rahul Sharma',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
            rating: 4.8,
            totalSales: 24,
            verified: true,
            joinedDate: '2024-01-15'
        },
        location: { city: 'Mumbai', state: 'Maharashtra' },
        createdAt: '2026-01-20T10:30:00',
        views: 342,
        likes: 28,
        featured: true,
        aiVerified: true,
        aiScore: 95,
        deliveryAvailable: true,
        meetupAvailable: true,
    },
    {
        id: '2',
        title: 'MacBook Pro 14" M2 Pro - Space Gray',
        description: 'MacBook Pro 14-inch with M2 Pro chip. 16GB RAM, 512GB SSD. Purchased in March 2024. AppleCare+ valid until 2027. Perfect for professionals and content creators.',
        price: 165000,
        originalPrice: 199900,
        category: 'electronics',
        condition: 'like-new',
        images: [
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
        ],
        seller: {
            id: '2',
            name: 'Priya Patel',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
            rating: 4.9,
            totalSales: 18,
            verified: true,
            joinedDate: '2023-11-20'
        },
        location: { city: 'Bangalore', state: 'Karnataka' },
        createdAt: '2026-01-19T14:20:00',
        views: 567,
        likes: 45,
        featured: true,
        aiVerified: true,
        aiScore: 98,
        deliveryAvailable: true,
        meetupAvailable: true,
    },
    {
        id: '3',
        title: 'Royal Enfield Classic 350 - 2022 Model',
        description: 'Well maintained Royal Enfield Classic 350 Signals edition. Single owner, service history available. New tires, recently serviced. Insurance valid till Dec 2026.',
        price: 145000,
        originalPrice: 210000,
        category: 'vehicles',
        condition: 'good',
        images: [
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
        ],
        seller: {
            id: '3',
            name: 'Vikram Singh',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram',
            rating: 4.7,
            totalSales: 5,
            verified: true,
            joinedDate: '2024-03-10'
        },
        location: { city: 'Delhi', state: 'Delhi' },
        createdAt: '2026-01-18T09:15:00',
        views: 892,
        likes: 67,
        featured: true,
        aiVerified: true,
        aiScore: 92,
        deliveryAvailable: false,
        meetupAvailable: true,
    },
    {
        id: '4',
        title: 'IKEA Malm Queen Bed with Storage',
        description: 'IKEA Malm bed frame with 4 storage boxes. Queen size. White finish. 2 years old but in excellent condition. Includes mattress (Sleepwell Ortho). Dismantling and loading help available.',
        price: 18500,
        originalPrice: 35000,
        category: 'furniture',
        condition: 'good',
        images: [
            'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600',
        ],
        seller: {
            id: '4',
            name: 'Sneha Gupta',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha',
            rating: 4.6,
            totalSales: 8,
            verified: false,
            joinedDate: '2024-06-05'
        },
        location: { city: 'Pune', state: 'Maharashtra' },
        createdAt: '2026-01-22T16:45:00',
        views: 234,
        likes: 19,
        featured: false,
        aiVerified: false,
        aiScore: null,
        deliveryAvailable: true,
        meetupAvailable: true,
    },
    {
        id: '5',
        title: 'Sony PlayStation 5 with 2 Controllers',
        description: 'PS5 Disc Edition with 2 DualSense controllers. Includes 5 games: Spider-Man 2, God of War Ragnarok, Horizon, GT7, and FC24. All in original boxes.',
        price: 42000,
        originalPrice: 55000,
        category: 'electronics',
        condition: 'like-new',
        images: [
            'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600',
        ],
        seller: {
            id: '5',
            name: 'Arjun Mehta',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun',
            rating: 4.9,
            totalSales: 12,
            verified: true,
            joinedDate: '2024-02-28'
        },
        location: { city: 'Hyderabad', state: 'Telangana' },
        createdAt: '2026-01-21T11:30:00',
        views: 456,
        likes: 38,
        featured: true,
        aiVerified: true,
        aiScore: 97,
        deliveryAvailable: true,
        meetupAvailable: true,
    },
    {
        id: '6',
        title: 'Wooden Study Table with Chair',
        description: 'Solid teak wood study table with matching chair. Perfect for work from home setup. Dimensions: 4ft x 2ft. Has 3 drawers and cable management hole.',
        price: 8500,
        originalPrice: 15000,
        category: 'furniture',
        condition: 'good',
        images: [
            'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600',
        ],
        seller: {
            id: '6',
            name: 'Anita Reddy',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anita',
            rating: 4.5,
            totalSales: 3,
            verified: false,
            joinedDate: '2024-08-12'
        },
        location: { city: 'Chennai', state: 'Tamil Nadu' },
        createdAt: '2026-01-23T08:20:00',
        views: 178,
        likes: 12,
        featured: false,
        aiVerified: false,
        aiScore: null,
        deliveryAvailable: true,
        meetupAvailable: true,
    },
    {
        id: '7',
        title: 'Nike Air Jordan 1 Retro High - Size 10',
        description: 'Authentic Nike Air Jordan 1 Retro High OG. Chicago colorway. Size UK 10 / US 11. Worn only twice. Comes with original box and extra laces.',
        price: 12500,
        originalPrice: 18000,
        category: 'clothing',
        condition: 'like-new',
        images: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
        ],
        seller: {
            id: '7',
            name: 'Karan Kapoor',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karan',
            rating: 4.8,
            totalSales: 15,
            verified: true,
            joinedDate: '2024-04-18'
        },
        location: { city: 'Mumbai', state: 'Maharashtra' },
        createdAt: '2026-01-22T19:10:00',
        views: 289,
        likes: 34,
        featured: true,
        aiVerified: true,
        aiScore: 94,
        deliveryAvailable: true,
        meetupAvailable: false,
    },
    {
        id: '8',
        title: 'Canon EOS R6 with RF 24-105mm Lens',
        description: 'Professional mirrorless camera in excellent condition. Shutter count under 5000. Includes RF 24-105mm f/4L lens, 2 batteries, charger, and camera bag.',
        price: 175000,
        originalPrice: 250000,
        category: 'electronics',
        condition: 'like-new',
        images: [
            'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600',
        ],
        seller: {
            id: '8',
            name: 'Deepak Joshi',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deepak',
            rating: 5.0,
            totalSales: 7,
            verified: true,
            joinedDate: '2023-12-01'
        },
        location: { city: 'Kolkata', state: 'West Bengal' },
        createdAt: '2026-01-20T15:40:00',
        views: 423,
        likes: 52,
        featured: true,
        aiVerified: true,
        aiScore: 99,
        deliveryAvailable: true,
        meetupAvailable: true,
    },
    {
        id: '9',
        title: 'Complete Harry Potter Book Set - Hardcover',
        description: 'Complete set of 7 Harry Potter books in hardcover. Bloomsbury UK edition. All in excellent condition, kept in bookshelf. Perfect for collectors.',
        price: 4500,
        originalPrice: 8000,
        category: 'books',
        condition: 'good',
        images: [
            'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=600',
        ],
        seller: {
            id: '9',
            name: 'Meera Nair',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meera',
            rating: 4.7,
            totalSales: 21,
            verified: true,
            joinedDate: '2024-01-30'
        },
        location: { city: 'Kochi', state: 'Kerala' },
        createdAt: '2026-01-21T13:25:00',
        views: 156,
        likes: 23,
        featured: false,
        aiVerified: false,
        aiScore: null,
        deliveryAvailable: true,
        meetupAvailable: true,
    },
    {
        id: '10',
        title: 'Decathlon Fitness Equipment Set',
        description: 'Home gym set including: adjustable dumbbells (2-20kg), resistance bands set, yoga mat, ab roller, and skipping rope. All Decathlon products.',
        price: 6500,
        originalPrice: 12000,
        category: 'sports',
        condition: 'good',
        images: [
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600',
        ],
        seller: {
            id: '10',
            name: 'Rohan Das',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan',
            rating: 4.6,
            totalSales: 9,
            verified: false,
            joinedDate: '2024-05-22'
        },
        location: { city: 'Ahmedabad', state: 'Gujarat' },
        createdAt: '2026-01-23T10:55:00',
        views: 198,
        likes: 16,
        featured: false,
        aiVerified: false,
        aiScore: null,
        deliveryAvailable: true,
        meetupAvailable: true,
    },
    {
        id: '11',
        title: 'Samsung 55" 4K QLED Smart TV',
        description: 'Samsung Q60A 55-inch QLED 4K Smart TV. 2023 model. Perfect picture quality. Includes original remote and wall mount bracket. Selling due to upgrade.',
        price: 45000,
        originalPrice: 75000,
        category: 'electronics',
        condition: 'like-new',
        images: [
            'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600',
        ],
        seller: {
            id: '1',
            name: 'Rahul Sharma',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
            rating: 4.8,
            totalSales: 24,
            verified: true,
            joinedDate: '2024-01-15'
        },
        location: { city: 'Mumbai', state: 'Maharashtra' },
        createdAt: '2026-01-24T09:00:00',
        views: 267,
        likes: 29,
        featured: true,
        aiVerified: true,
        aiScore: 96,
        deliveryAvailable: true,
        meetupAvailable: true,
    },
    {
        id: '12',
        title: 'L-Shaped Sofa Set - Grey Fabric',
        description: '6-seater L-shaped sofa in premium grey fabric. 1.5 years old. Includes 4 cushions. Perfect for living room. No stains or tears. Pet-free home.',
        price: 28000,
        originalPrice: 55000,
        category: 'furniture',
        condition: 'good',
        images: [
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
        ],
        seller: {
            id: '4',
            name: 'Sneha Gupta',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha',
            rating: 4.6,
            totalSales: 8,
            verified: false,
            joinedDate: '2024-06-05'
        },
        location: { city: 'Pune', state: 'Maharashtra' },
        createdAt: '2026-01-23T14:30:00',
        views: 312,
        likes: 25,
        featured: false,
        aiVerified: false,
        aiScore: null,
        deliveryAvailable: true,
        meetupAvailable: true,
    },
]

export const mockTransactions = [
    {
        id: 'TXN001',
        listing: mockListings[0],
        buyer: {
            id: '11',
            name: 'Amit Kumar',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit',
        },
        seller: mockListings[0].seller,
        amount: 89999,
        status: 'escrow', // pending, escrow, completed, disputed, refunded
        paymentMethod: 'card',
        createdAt: '2026-01-22T10:00:00',
        escrowReleasedAt: null,
        deliveryMethod: 'meetup',
        meetupDetails: {
            location: 'Inorbit Mall, Malad West',
            scheduledAt: '2026-01-25T15:00:00',
            status: 'scheduled'
        }
    },
    {
        id: 'TXN002',
        listing: mockListings[1],
        buyer: {
            id: '12',
            name: 'Neha Singh',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Neha',
        },
        seller: mockListings[1].seller,
        amount: 165000,
        status: 'completed',
        paymentMethod: 'upi',
        createdAt: '2026-01-15T14:00:00',
        escrowReleasedAt: '2026-01-18T11:00:00',
        deliveryMethod: 'shipping',
        shippingDetails: {
            carrier: 'BlueDart',
            awb: 'BD123456789',
            status: 'delivered',
            deliveredAt: '2026-01-18T10:30:00'
        }
    }
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
