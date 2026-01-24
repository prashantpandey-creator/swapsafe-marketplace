import { createContext, useContext, useReducer, useEffect } from 'react'

const AuthContext = createContext(null)

const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
}

function authReducer(state, action) {
    switch (action.type) {
        case 'AUTH_START':
            return { ...state, isLoading: true, error: null }
        case 'AUTH_SUCCESS':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
                isLoading: false,
                error: null
            }
        case 'AUTH_ERROR':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload
            }
        case 'LOGOUT':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            }
        case 'UPDATE_USER':
            return { ...state, user: { ...state.user, ...action.payload } }
        default:
            return state
    }
}

// Mock user data for demo
const mockUsers = [
    {
        id: '1',
        name: 'Prashant Pandey',
        email: 'prashant@example.com',
        password: 'password123',
        phone: '+91 98765 43210',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Prashant',
        rating: 4.8,
        totalSales: 24,
        totalPurchases: 12,
        joinedDate: '2024-06-15',
        isVerified: true,
        address: {
            street: '123 MG Road',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
        }
    }
]

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState)

    // Check for existing session on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('swapsafe_user')
        if (savedUser) {
            dispatch({ type: 'AUTH_SUCCESS', payload: JSON.parse(savedUser) })
        } else {
            dispatch({ type: 'AUTH_ERROR', payload: null })
        }
    }, [])

    const login = async (email, password) => {
        dispatch({ type: 'AUTH_START' })

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        const user = mockUsers.find(u => u.email === email && u.password === password)

        if (user) {
            const { password: _, ...userWithoutPassword } = user
            localStorage.setItem('swapsafe_user', JSON.stringify(userWithoutPassword))
            dispatch({ type: 'AUTH_SUCCESS', payload: userWithoutPassword })
            return { success: true }
        } else {
            dispatch({ type: 'AUTH_ERROR', payload: 'Invalid email or password' })
            return { success: false, error: 'Invalid email or password' }
        }
    }

    const register = async (userData) => {
        dispatch({ type: 'AUTH_START' })

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        const existingUser = mockUsers.find(u => u.email === userData.email)
        if (existingUser) {
            dispatch({ type: 'AUTH_ERROR', payload: 'Email already registered' })
            return { success: false, error: 'Email already registered' }
        }

        const newUser = {
            id: Date.now().toString(),
            name: userData.name,
            email: userData.email,
            phone: userData.phone || '',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`,
            rating: 0,
            totalSales: 0,
            totalPurchases: 0,
            joinedDate: new Date().toISOString().split('T')[0],
            isVerified: false,
            address: null
        }

        localStorage.setItem('swapsafe_user', JSON.stringify(newUser))
        dispatch({ type: 'AUTH_SUCCESS', payload: newUser })
        return { success: true }
    }

    const logout = () => {
        localStorage.removeItem('swapsafe_user')
        dispatch({ type: 'LOGOUT' })
    }

    const updateProfile = async (updates) => {
        const updatedUser = { ...state.user, ...updates }
        localStorage.setItem('swapsafe_user', JSON.stringify(updatedUser))
        dispatch({ type: 'UPDATE_USER', payload: updates })
        return { success: true }
    }

    return (
        <AuthContext.Provider value={{
            ...state,
            login,
            register,
            logout,
            updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
