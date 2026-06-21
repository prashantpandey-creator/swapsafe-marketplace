import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const VIDEO_ID = 'ohFg6O9r8U4';
const START_SECONDS = 3;

export default function LynchAudioPlayer({ active }) {
    const playerRef = useRef(null);
    const containerRef = useRef(null);
    const readyRef = useRef(false);
    const [muted, setMuted] = useState(false);
    const [visible, setVisible] = useState(false);

    // Load YouTube IFrame API once
    useEffect(() => {
        if (window.YT && window.YT.Player) return;
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    }, []);

    // Create / destroy player when active changes
    useEffect(() => {
        if (!active) {
            if (playerRef.current) {
                try { playerRef.current.stopVideo(); } catch (_) {}
            }
            setVisible(false);
            return;
        }

        const initPlayer = () => {
            if (playerRef.current) {
                try { playerRef.current.seekTo(START_SECONDS); playerRef.current.playVideo(); } catch (_) {}
                setVisible(true);
                return;
            }
            playerRef.current = new window.YT.Player(containerRef.current, {
                height: '1',
                width: '1',
                videoId: VIDEO_ID,
                playerVars: {
                    autoplay: 1,
                    start: START_SECONDS,
                    controls: 0,
                    loop: 1,
                    playlist: VIDEO_ID,
                    rel: 0,
                    modestbranding: 1,
                },
                events: {
                    onReady: (e) => {
                        readyRef.current = true;
                        e.target.setVolume(55);
                        e.target.playVideo();
                        setVisible(true);
                    },
                },
            });
        };

        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            const prev = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (prev) prev();
                initPlayer();
            };
        }
    }, [active]);

    const toggleMute = () => {
        if (!playerRef.current) return;
        try {
            if (muted) {
                playerRef.current.unMute();
                playerRef.current.setVolume(55);
            } else {
                playerRef.current.mute();
            }
            setMuted(!muted);
        } catch (_) {}
    };

    return (
        <>
            {/* Hidden iframe mount point — always in DOM so ref is stable */}
            <div ref={containerRef} style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', top: 0, left: 0 }} />

            {/* Mute toggle pill */}
            <button
                onClick={toggleMute}
                title={muted ? 'Unmute Twin Peaks theme' : 'Mute Twin Peaks theme'}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px 7px 10px',
                    borderRadius: '999px',
                    background: 'rgba(8, 2, 2, 0.82)',
                    border: '1px solid rgba(178, 34, 34, 0.35)',
                    color: 'rgba(220, 180, 160, 0.9)',
                    fontSize: '11px',
                    fontFamily: 'inherit',
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                    transition: 'border-color 180ms, background 180ms',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(178,34,34,0.7)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(178,34,34,0.35)'}
            >
                {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                Twin Peaks
            </button>
        </>
    );
}
