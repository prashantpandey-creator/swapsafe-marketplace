import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BackgroundManager = () => {
    const location = useLocation();

    useEffect(() => {
        // Create the background element if it doesn't exist
        let bgElement = document.getElementById('guardian-bg');
        if (!bgElement) {
            bgElement = document.createElement('div');
            bgElement.id = 'guardian-bg';
            bgElement.style.position = 'fixed';
            bgElement.style.top = '0';
            bgElement.style.left = '0';
            bgElement.style.width = '100%';
            bgElement.style.height = '100%';
            bgElement.style.zIndex = '0';
            bgElement.style.backgroundSize = 'cover';
            bgElement.style.backgroundPosition = 'center center';
            bgElement.style.backgroundRepeat = 'no-repeat';
            bgElement.style.transition = 'all 0.5s ease';
            bgElement.style.backgroundColor = 'var(--bg-void)'; // Fallback color

            // Ensure app content is transparent above it
            const app = document.querySelector('.app');
            if (app) {
                app.style.position = 'relative';
                app.style.zIndex = '1';
                app.style.backgroundColor = 'transparent';
            }
            document.body.prepend(bgElement);
        }

        let bgImage = '';
        let opacity = '1'; // Full visibility by default

        // Logic for different routes
        if (location.pathname.startsWith('/product/')) {
            // "Guruji-inspired" Guardian (Correct Art)
            // Use gradient overlay for integration
            bgImage = 'linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.8)), url("/assets/guardian-guruji.png")';
        } else if (location.pathname === '/browse' || location.pathname.startsWith('/browse/')) {
            // Esoteric Browse
            bgImage = 'linear-gradient(rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.9)), url("/assets/esoteric-bg-browse.png")';
        } else if (location.pathname === '/') {
            // Esoteric Home
            bgImage = 'linear-gradient(rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.7)), url("/assets/esoteric-bg-home.png")';
        } else {
            bgImage = 'linear-gradient(rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.9)), url("/assets/esoteric-bg-home.png")';
            opacity = '0.5';
        }

        // Apply changes
        // If image is changing, fade out then in? Or just crossfade if simple.
        // Simple assignment with transition works for opacity/image change.
        if (bgImage !== 'none') {
            bgElement.style.backgroundImage = bgImage;
            bgElement.style.opacity = opacity;
        } else {
            bgElement.style.opacity = '0';
        }

    }, [location.pathname]);

    return null;
};

export default BackgroundManager;
