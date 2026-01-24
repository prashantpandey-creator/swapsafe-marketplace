import { createContext, useContext, useReducer, useEffect } from 'react'

const CartContext = createContext(null)

const initialState = {
    items: [],
    total: 0
}

function cartReducer(state, action) {
    switch (action.type) {
        case 'ADD_ITEM': {
            const existingItem = state.items.find(item => item.id === action.payload.id)
            if (existingItem) {
                return state // Item already in cart
            }
            const newItems = [...state.items, action.payload]
            return {
                items: newItems,
                total: newItems.reduce((sum, item) => sum + item.price, 0)
            }
        }
        case 'REMOVE_ITEM': {
            const newItems = state.items.filter(item => item.id !== action.payload)
            return {
                items: newItems,
                total: newItems.reduce((sum, item) => sum + item.price, 0)
            }
        }
        case 'CLEAR_CART':
            return initialState
        case 'LOAD_CART':
            return action.payload
        default:
            return state
    }
}

export function CartProvider({ children }) {
    const [state, dispatch] = useReducer(cartReducer, initialState)

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('swapsafe_cart')
        if (savedCart) {
            dispatch({ type: 'LOAD_CART', payload: JSON.parse(savedCart) })
        }
    }, [])

    // Save cart to localStorage on changes
    useEffect(() => {
        localStorage.setItem('swapsafe_cart', JSON.stringify(state))
    }, [state])

    const addToCart = (item) => {
        dispatch({ type: 'ADD_ITEM', payload: item })
    }

    const removeFromCart = (itemId) => {
        dispatch({ type: 'REMOVE_ITEM', payload: itemId })
    }

    const clearCart = () => {
        dispatch({ type: 'CLEAR_CART' })
    }

    const isInCart = (itemId) => {
        return state.items.some(item => item.id === itemId)
    }

    return (
        <CartContext.Provider value={{
            ...state,
            addToCart,
            removeFromCart,
            clearCart,
            isInCart,
            itemCount: state.items.length
        }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
