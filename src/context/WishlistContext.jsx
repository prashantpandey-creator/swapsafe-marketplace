import { createContext, useContext, useState, useEffect } from 'react'
// import { toast } from 'react-hot-toast'

const WishlistContext = createContext()

export function useWishlist() {
    return useContext(WishlistContext)
}

export function WishlistProvider({ children }) {
    const [wishlist, setWishlist] = useState(() => {
        try {
            const saved = localStorage.getItem('swapsafe_wishlist')
            return saved ? JSON.parse(saved) : []
        } catch (error) {
            console.error('Failed to parse wishlist from storage:', error)
            return []
        }
    })

    useEffect(() => {
        localStorage.setItem('swapsafe_wishlist', JSON.stringify(wishlist))
    }, [wishlist])

    const addToWishlist = (product) => {
        setWishlist(prev => {
            if (prev.find(item => (item._id || item.id) === (product._id || product.id))) {
                return prev
            }
            return [...prev, product]
        })
    }

    const removeFromWishlist = (productId) => {
        setWishlist(prev => prev.filter(item => (item._id || item.id) !== productId))
    }

    const isInWishlist = (productId) => {
        return !!wishlist.find(item => (item._id || item.id) === productId)
    }

    const toggleWishlist = (product) => {
        const id = product._id || product.id
        if (isInWishlist(id)) {
            removeFromWishlist(id)
            return false // Removed
        } else {
            addToWishlist(product)
            return true // Added
        }
    }

    const value = {
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist
    }

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    )
}
