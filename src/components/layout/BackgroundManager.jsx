import { useLocation } from 'react-router-dom';
import InteractiveMandala from './InteractiveMandala';

const BackgroundManager = () => {
    const location = useLocation();

    let variant = 'home';
    if (location.pathname.startsWith('/product/')) {
        variant = 'product'; // Minimal + Gold
    } else if (location.pathname.startsWith('/browse')) {
        variant = 'browse'; // Minimal + Blue
    } else if (location.pathname !== '/') {
        variant = 'minimal'; // Minimal
    }
    // Default is 'home' (Full intensity)

    return <InteractiveMandala variant={variant} />;
};

export default BackgroundManager;
