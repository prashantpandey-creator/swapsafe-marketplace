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

        let bloom = 0;

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
            // SLOW & CONTROLLED
            time += 0.0005; // Very slow evolution
            tick += 0.02;   // Gentle pulsing, not crazy flickering

            // Slow Bloom: Takes about 15-20 seconds to reach full majesty
            if (bloom < 1) bloom += 0.001;
            const activeBloom = bloom; // Linear is fine for slow growth

            const { width, height } = canvas;
            const cx = width / 2;
            const cy = height / 2;
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;

            const maxRadius = Math.max(width, height) * 0.6;

            // Clear with slightly more opacity for cleaner trails
            ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
            ctx.fillRect(0, 0, width, height);

            ctx.lineWidth = 1.5;

            const nx = (mx / width) - 0.5;
            const ny = (my / height) - 0.5;
            const mouseDist = Math.hypot(nx, ny);

            // --- GENERATION LOOP ---
            const waveCount = 12;

            for (let i = 0; i < waveCount; i++) {
                // Slower wave travel
                const loopProgress = (time * 0.2 + (i / waveCount)) % 1;

                // The radius is constrained by the Bloom factor
                // This makes it literally "grow" from center to edge over time
                const currentRadius = loopProgress * maxRadius * activeBloom;

                // Birth threshold
                if (currentRadius < 2) continue;

                ctx.beginPath();

                const alpha = Math.sin(loopProgress * PI);

                // Gentle Ethereal Colors
                const hue = (tick * 2 + i * 30 + currentRadius * 0.2) % 360;
                ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha * 0.8})`;

                // Rose Curve Logic
                // k morphs extremely slowly
                const kBase = 3 + (currentRadius * 0.01) + Math.sin(time * 0.5) * 2;

                const resolution = 0.05;
                const rotation = time * (i % 2 === 0 ? 1 : -1) * 0.2;

                for (let theta = 0; theta < TAU * Math.ceil(kBase + 2); theta += resolution) {
                    const k = kBase + (mouseDist * 2);

                    // Subtle Vibration (Not "Crazy")
                    const jitter = Math.sin(tick + theta * 10) * (currentRadius * 0.005);
                    const r = (currentRadius * Math.cos(k * theta)) + jitter;

                    const x = cx + r * Math.cos(theta + rotation);
                    const y = cy + r * Math.sin(theta + rotation);

                    if (theta === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            // --- CENTER SOURCE ---
            const centerPulse = 5 + Math.sin(tick) * 2; // Subtle pulse
            ctx.beginPath();
            ctx.arc(cx, cy, centerPulse, 0, TAU);
            ctx.fillStyle = `hsla(${tick * 5}, 100%, 80%, 0.8)`;
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'white';
            ctx.fill();
            ctx.shadowBlur = 0;

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
