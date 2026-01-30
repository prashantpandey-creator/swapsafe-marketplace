import { useLocation } from 'react-router-dom';
import InteractiveMandala from './InteractiveMandala';

const BackgroundManager = () => {
    const location = useLocation();

    // STRICT: Only show on Home Page
    if (location.pathname !== '/') {
        return null;
    }

    return <InteractiveMandala variant="home" />;
};

export default BackgroundManager;
