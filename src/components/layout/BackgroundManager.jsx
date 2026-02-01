import { useLocation } from 'react-router-dom';
import InteractiveMandala from './InteractiveMandala';

const BackgroundManager = ({ currentTheme }) => {
    const location = useLocation();

    // STRICT: Only show on Home Page AND Classic Theme
    if (location.pathname !== '/' || currentTheme !== 'classic') {
        return null; // Minimal, Esoteric, Mystical all hide the mandala
    }

    return <InteractiveMandala variant="home" />;
};

export default BackgroundManager;
