import { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '../services/api'

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
        case 'CLEAR_ERROR':
            return { ...state, error: null }
        default:
            return state
    }
}

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState)

    // Check for existing session on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('swapsafe_token')
            const savedUser = localStorage.getItem('swapsafe_user')

            if (token && savedUser) {
                try {
                    // Verify token with backend
                    const data = await authAPI.getProfile()
                    localStorage.setItem('swapsafe_user', JSON.stringify(data.user))
                    dispatch({ type: 'AUTH_SUCCESS', payload: data.user })
                } catch (error) {
                    // Token invalid, clear storage
                    localStorage.removeItem('swapsafe_token')
                    localStorage.removeItem('swapsafe_user')
                    dispatch({ type: 'AUTH_ERROR', payload: null })
                }
            } else if (savedUser) {
                // Fallback to local storage if no token (legacy)
                dispatch({ type: 'AUTH_SUCCESS', payload: JSON.parse(savedUser) })
            } else {
                dispatch({ type: 'AUTH_ERROR', payload: null })
            }
        }

        checkAuth()
    }, [])

    const login = async (email, password) => {
        dispatch({ type: 'AUTH_START' })

        try {
            const data = await authAPI.login(email, password)
            localStorage.setItem('swapsafe_user', JSON.stringify(data.user))
            dispatch({ type: 'AUTH_SUCCESS', payload: data.user })
            return { success: true }
        } catch (error) {
            const errorMessage = error.message || 'Invalid email or password'
            dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
            return { success: false, error: errorMessage }
        }
    }

    const register = async (userData) => {
        dispatch({ type: 'AUTH_START' })

        try {
            const data = await authAPI.register(userData.name, userData.email, userData.password)
            localStorage.setItem('swapsafe_user', JSON.stringify(data.user))
            dispatch({ type: 'AUTH_SUCCESS', payload: data.user })
            return { success: true }
        } catch (error) {
            const errorMessage = error.message || 'Registration failed'
            dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
            return { success: false, error: errorMessage }
        }
    }

    const logout = () => {
        authAPI.logout()
        localStorage.removeItem('swapsafe_user')
        dispatch({ type: 'LOGOUT' })
    }

    // Guest login - gives full access without backend authentication
    const loginAsGuest = () => {
        const guestUser = {
            _id: 'guest_' + Date.now(),
            name: 'Guest User',
            email: 'guest@buyerslegion.com',
            isGuest: true,
            createdAt: new Date().toISOString(),
            // Give guest all permissions for demo purposes
            canSell: true,
            canBuy: true,
            avatar: null
        }
        localStorage.setItem('swapsafe_user', JSON.stringify(guestUser))
        dispatch({ type: 'AUTH_SUCCESS', payload: guestUser })
        return { success: true }
    }

    const updateProfile = async (updates) => {
        try {
            const data = await authAPI.updateProfile(updates)
            localStorage.setItem('swapsafe_user', JSON.stringify(data.user))
            dispatch({ type: 'UPDATE_USER', payload: data.user })
            return { success: true }
        } catch (error) {
            // Fallback to local update if API fails
            const updatedUser = { ...state.user, ...updates }
            localStorage.setItem('swapsafe_user', JSON.stringify(updatedUser))
            dispatch({ type: 'UPDATE_USER', payload: updates })
            return { success: true }
        }
    }

    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' })
    }

    return (
        <AuthContext.Provider value={{
            ...state,
            login,
            loginAsGuest,
            register,
            logout,
            updateProfile,
            clearError
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
