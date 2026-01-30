import { useEffect } from 'react';

/**
 * ServerWaker Component
 * 
 * Purpose: Mitigate "Cold Start" delays on Free Tier hosting (Render).
 * Action: Silently pings the /health endpoint when the app loads.
 * Result: If the server is sleeping, this wakes it up while the user is browsing/logging in.
 */
function ServerWaker() {
    useEffect(() => {
        const wakeUpServer = async () => {
            try {
                // We use fetch directly to avoid the timeout logic in api.js wrappers if successful,
                // but we want it to be fire-and-forget.
                // Also, API_URL might need to be imported or constructed.
                const healthEndpoint = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/health`;

                console.log('⏰ ServerWaker: Pinging backend to wake up...');
                await fetch(healthEndpoint, { method: 'GET' });
                console.log('☀️ ServerWaker: Backend is awake!');
            } catch (error) {
                // It's okay if this fails (e.g. network error), we just want to trigger the wake-up
                console.log('💤 ServerWaker: Ping failed (Server might be waking up...)');
            }
        };

        wakeUpServer();
    }, []);

    return null; // Render nothing
}

export default ServerWaker;
