import LynchBackground from './LynchBackground';
import WhiteBackground from './WhiteBackground';

const BackgroundManager = ({ currentTheme }) => {
    // Two themes only:
    //   'white' — professional, sleek, boho-modern (default)
    //   'lynch' — creative David Lynch theme
    switch (currentTheme) {
        case 'lynch':
            return <LynchBackground />;
        case 'white':
        default:
            return <WhiteBackground />;
    }
};

export default BackgroundManager;
