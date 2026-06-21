import React from 'react';
import { Crown, Moon } from 'lucide-react';

// Minimalist theme toggle — a single icon button matching the toolbar's
// .m-iconbtn vocabulary. No emoji, no glow ring, no tooltip widget.
const ThemeIndicator = ({ theme, onToggle }) => {
    const label = theme === 'lynch' ? 'Lynch theme' : 'Classic theme';
    const Icon = theme === 'lynch' ? Moon : Crown;

    return (
        <button
            onClick={() => onToggle && onToggle()}
            className="m-iconbtn"
            title={`${label} — click to switch`}
            aria-label={`${label}. Click to switch theme.`}
        >
            <Icon size={18} />
        </button>
    );
};

export default ThemeIndicator;
