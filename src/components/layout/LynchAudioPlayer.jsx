import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const VIDEO_ID = 'ohFg6O9r8U4';
const START_SECONDS = 3;
const PLAY_DURATION = 15000;

export default function LynchAudioPlayer({ active }) {
    const playerRef = useRef(null);
    const containerRef = useRef(null);
    const timerRef = useRef(null);
    const [muted, setMuted] = useState(false);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        if (window.YT?.Player) return;
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    }, []);

    useEffect(() => {
        if (!active) {
            stop();
            return;
        }

        const init = () => {
            if (playerRef.current) {
                try {
                    playerRef.current.seekTo(START_SECONDS);
                    playerRef.current.playVideo();
                    setPlaying(true);
                    startTimer();
                } catch (_) {}
                return;
            }
            const div = containerRef.current;
            if (!div) return;
            playerRef.current = new window.YT.Player(div, {
                height: '1', width: '1', videoId: VIDEO_ID,
                playerVars: { autoplay: 0, start: START_SECONDS, controls: 0, loop: 0, rel: 0, modestbranding: 1 },
                events: {
                    onReady: (e) => {
                        e.target.setVolume(45);
                        e.target.playVideo();
                        setPlaying(true);
                        startTimer();
                    },
                },
            });
        };

        if (window.YT?.Player) init();
        else {
            const prev = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => { prev?.(); init(); };
        }

        return () => { clearTimer(); };
    }, [active]);

    const startTimer = () => {
        clearTimer();
        timerRef.current = setTimeout(() => stop(), PLAY_DURATION);
    };

    const clearTimer = () => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };

    const stop = () => {
        clearTimer();
        if (playerRef.current) {
            try { playerRef.current.stopVideo(); } catch (_) {}
        }
        setPlaying(false);
    };

    const toggle = () => {
        if (!playerRef.current) return;
        try {
            if (muted) { playerRef.current.unMute(); playerRef.current.setVolume(45); }
            else { playerRef.current.mute(); }
            setMuted(!muted);
        } catch (_) {}
    };

    if (!active) return <div ref={containerRef} style={{ position:'absolute', width:1, height:1, opacity:0, pointerEvents:'none', top:0, left:0 }} />;

    return (
        <>
            <div ref={containerRef} style={{ position:'absolute', width:1, height:1, opacity:0, pointerEvents:'none', top:0, left:0 }} />
            {playing && (
                <button onClick={toggle}
                    title={muted ? 'Unmute' : 'Mute'}
                    style={{
                        position:'fixed', bottom:24, right:24, zIndex:9999,
                        display:'flex', alignItems:'center', gap:6,
                        padding:'7px 14px 7px 10px', borderRadius:999,
                        background:'rgba(8,2,2,0.85)', border:'1px solid rgba(178,34,34,0.35)',
                        color:'rgba(220,180,160,0.9)', fontSize:11,
                        fontFamily:'inherit', letterSpacing:'0.04em',
                        cursor:'pointer', backdropFilter:'blur(8px)',
                        transition:'border-color 180ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(178,34,34,0.7)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(178,34,34,0.35)'}
                >
                    {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    Twin Peaks
                </button>
            )}
        </>
    );
}
