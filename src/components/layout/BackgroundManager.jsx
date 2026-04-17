import SpiralBackground from '../common/SpiralBackground';
import EsotericBackground from './EsotericBackground';
import MysticalBackground from './MysticalBackground';
import VoidBackground from './VoidBackground';
import MinimalBackground from './MinimalBackground';
import PsychedelicBackground from './PsychedelicBackground';
import LynchBackground from './LynchBackground';

const BackgroundManager = ({ currentTheme }) => {
    // Each theme has its own canvas background
    switch (currentTheme) {
        case 'classic':
            return <SpiralBackground />;
        case 'esoteric':
            return <EsotericBackground />;
        case 'mystical':
            return <MysticalBackground />;
        case 'void':
            return <VoidBackground />;
        case 'minimal':
            return <MinimalBackground />;
        case 'psychedelic':
            return <PsychedelicBackground />;
        case 'lynch':
            return <LynchBackground />;
        default:
            return null;
    }
};

export default BackgroundManager;
