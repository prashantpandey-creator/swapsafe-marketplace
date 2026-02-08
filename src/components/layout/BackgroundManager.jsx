import { useLocation } from 'react-router-dom';
import InteractiveMandala from './InteractiveMandala';
import PsychedelicBackground from './PsychedelicBackground';

const BackgroundManager = ({ currentTheme }) => {
    const location = useLocation();

    // Psychedelic theme shows its background on all pages
    if (currentTheme === 'psychedelic') {
        return <PsychedelicBackground />;
    }

    // Classic mandala only on home page
    if (location.pathname !== '/' || currentTheme !== 'classic') {
        return null;
    }

    return <InteractiveMandala variant="home" />;
};

export default BackgroundManager;
