import LynchBackground from './LynchBackground';

const BackgroundManager = ({ currentTheme }) => {
    // Two themes only:
    //   'classic' — professional gold/obsidian (default, handled by body CSS)
    //   'lynch' — creative midnight crimson theme (canvas)
    switch (currentTheme) {
        case 'lynch':
            return <LynchBackground />;
        case 'classic':
        default:
            return null; // CSS radial-gradient takes over for classic gold/obsidian theme
    }
};

export default BackgroundManager;
