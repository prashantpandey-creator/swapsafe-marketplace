import React, { useRef, useEffect } from 'react';

const InteractiveMandala = ({ variant = 'home' }) => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        let time = 0; // Geometry evolution
        let tick = 0; // Fast flicker

        // Start from 0 to allow "generation from nothing" visual on load
        let startTime = Date.now();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        handleResize();

        const PI = Math.PI;
        const TAU = PI * 2;
        const GOLDEN_ANGLE = PI * (3 - Math.sqrt(5));

        const drawMandala = () => {
            // CONSTANT FORWARD FLOW
            time += 0.003;
            tick += 0.1;

            const { width, height } = canvas;
            const cx = width / 2;
            const cy = height / 2;
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;

            const maxRadius = Math.max(width, height) * 0.6; // Go off screen

            // Dreamy trails (low opacity clear)
            ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
            ctx.fillRect(0, 0, width, height);

            ctx.lineWidth = 1.5;

            const nx = (mx / width) - 0.5;
            const ny = (my / height) - 0.5;
            const mouseDist = Math.hypot(nx, ny);

            // --- GENERATION LOOP ---
            // Create "Wavefronts" that travel from center -> out
            const waveCount = 12;

            for (let i = 0; i < waveCount; i++) {
                // Calculate radius based on time loop
                // The (i / waveCount) offsets them so they are spaced out
                const loopProgress = (time * 0.1 + (i / waveCount)) % 1;
                const currentRadius = loopProgress * maxRadius;

                // If radius is tiny, it's just being born
                if (currentRadius < 5) continue;

                ctx.beginPath();

                // Opacity fades in at center, out at edge
                const alpha = Math.sin(loopProgress * PI); // Bell curve opacity

                // Color Cycles with the radius/time
                const hue = (tick * 5 + i * 30 + currentRadius * 0.5) % 360;
                ctx.strokeStyle = `hsla(${hue}, 100%, 65%, ${alpha * 0.8})`;

                // Rose Curve Logic
                // k (petals) morphs as it expands? 
                // Let's make inner simple, outer complex
                const kBase = 3 + (currentRadius * 0.02) + Math.sin(time) * 2;

                const resolution = 0.05;
                // Rotate the whole layer
                const rotation = time * (i % 2 === 0 ? 1 : -1) * 0.5;

                for (let theta = 0; theta < TAU * Math.ceil(kBase + 2); theta += resolution) {
                    const k = kBase + (mouseDist * 5); // Mouse warps complexity

                    // r = radius * cos(k * theta)
                    // We add a little 'jitter' for the electronic feel
                    const jitter = Math.sin(tick + theta * 10) * (currentRadius * 0.02);
                    const r = (currentRadius * Math.cos(k * theta)) + jitter;

                    const x = cx + r * Math.cos(theta + rotation);
                    const y = cy + r * Math.sin(theta + rotation);

                    if (theta === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            // --- CENTER SOURCE (The Singularity) ---
            // A glowing orb where things come from
            const centerPulse = 10 + Math.sin(tick) * 5;
            ctx.beginPath();
            ctx.arc(cx, cy, centerPulse, 0, TAU);
            ctx.fillStyle = `hsla(${tick * 2}, 100%, 80%, 0.8)`;
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'white';
            ctx.fill();
            ctx.shadowBlur = 0;

            // --- OUTWARD PARTICLES ---
            const particleCount = 20;
            for (let p = 0; p < particleCount; p++) {
                const pProgress = ((time * 0.2) + (p / particleCount)) % 1;
                const pR = pProgress * maxRadius;
                const pAngle = p * GOLDEN_ANGLE + time;

                const px = cx + pR * Math.cos(pAngle);
                const py = cy + pR * Math.sin(pAngle);

                ctx.fillStyle = '#fff';
                ctx.globalAlpha = 1 - pProgress; // Fade out
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, TAU);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            animationFrameId = requestAnimationFrame(drawMandala);
        };

        drawMandala();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [variant]); // Re-run effect if variant changes

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
                background: '#0f172a'
            }}
        />
    );
};

export default InteractiveMandala;
