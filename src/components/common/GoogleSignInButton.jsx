import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function GoogleSignInButton({ onSuccess, onError }) {
    const buttonRef = useRef(null)
    const { googleLogin } = useAuth()
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return

        const existing = document.getElementById('google-gsi-script')
        if (existing) {
            if (window.google?.accounts?.id) {
                initGoogle()
            } else {
                existing.addEventListener('load', initGoogle)
            }
            return
        }

        const script = document.createElement('script')
        script.id = 'google-gsi-script'
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = initGoogle
        document.head.appendChild(script)
    }, [])

    function initGoogle() {
        if (!window.google?.accounts?.id || !buttonRef.current) return

        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
        })

        window.google.accounts.id.renderButton(buttonRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            width: buttonRef.current.offsetWidth || 380,
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
        })

        setLoaded(true)
    }

    async function handleCredentialResponse(response) {
        const result = await googleLogin(response.credential)
        if (result.success) {
            onSuccess?.()
        } else {
            onError?.(result.error)
        }
    }

    if (!GOOGLE_CLIENT_ID) return null

    return (
        <div
            ref={buttonRef}
            style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                minHeight: 44,
                opacity: loaded ? 1 : 0.5,
                transition: 'opacity 0.3s',
            }}
        />
    )
}

export default GoogleSignInButton
