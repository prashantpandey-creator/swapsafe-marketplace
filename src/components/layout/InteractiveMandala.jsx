import React, { useRef, useEffect } from 'react';

const InteractiveMandala = ({ variant = 'home' }) => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let time = 0;
        let bloom = 0;

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
            // HIGH SPEED & TRIPPY
            time += 0.005;

            if (bloom < 1) bloom += 0.005;
            const activeBloom = bloom * (2 - bloom);

            const { width, height } = canvas;
            const cx = width / 2;
            const cy = height / 2;
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;

            // TRIPPY TRAILS: Don't fully clear the canvas
            // Using a low opacity fill creates a "motion blur" / dream trail effect
            ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
            ctx.fillRect(0, 0, width, height);

            ctx.lineWidth = 2; // Thicker electronic lines

            const nx = (mx / width) - 0.5;
            const ny = (my / height) - 0.5;
            const mouseDist = Math.hypot(nx, ny);

            // --- LAYER 1: NEON PHYLLOTAXIS (Electronic Seeds) ---
            const dots = 300 * activeBloom;
            const spread = 5 + Math.sin(time * 2) * 2; // Breathing spread

            for (let i = 0; i < dots; i++) {
                const r = spread * Math.sqrt(i) * (1 + mouseDist);
                const theta = i * GOLDEN_ANGLE + time * 0.5;

                const x = cx + r * Math.cos(theta);
                const y = cy + r * Math.sin(theta);

                const hue = (time * 100 + i * 0.5) % 360; // RGB Rainbow Cycle
                ctx.fillStyle = `hsla(${hue}, 100%, 70%, 0.8)`;

                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, TAU);
                ctx.fill();
            }

            // --- LAYER 2: HYPER ROSE CURVES (The Trippy Flower) ---
            // Overlapping high-frequency rose curves
            const roseLayers = 3;
            const kBase = 4;

            for (let j = 0; j < roseLayers; j++) {
                ctx.beginPath();
                const radius = 200 * (j + 1) * activeBloom;
                const phase = (time * (j + 1)) + (j * TAU / 3);
                const k = kBase + Math.sin(time * 0.5 + j) * 2; // Morphing number of petals

                // Electronic Color Palette: Cyan, Magenta, Electric Gold
                const layerHue = (time * 50 + j * 120) % 360;
                ctx.strokeStyle = `hsla(${layerHue}, 100%, 60%, 0.4)`;
                ctx.shadowBlur = 10;
                ctx.shadowColor = `hsla(${layerHue}, 100%, 50%, 0.8)`;

                for (let theta = 0; theta < TAU * k; theta += 0.05) {
                    // Rose Equation: r = cos(k * theta)
                    // Distorted by mouse
                    const distortion = Math.sin(theta * 10 + time * 5) * (mouseDist * 50);
                    const r = (radius * Math.cos(k * theta)) + distortion;

                    const x = cx + r * Math.cos(theta + phase);
                    const y = cy + r * Math.sin(theta + phase);

                    if (theta === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.shadowBlur = 0; // Reset
            }

            // --- LAYER 3: ELECTRIC ARCS (The Connectivity) ---
            // Random lightning-like connections
            if (Math.random() > 0.8) {
                const lightningPoints = 5;
                ctx.beginPath();
                const angleStart = Math.random() * TAU;
                let lx = cx + Math.cos(angleStart) * 100;
                let ly = cy + Math.sin(angleStart) * 100;
                ctx.moveTo(lx, ly);

                for (let p = 0; p < lightningPoints; p++) {
                    lx += (Math.random() - 0.5) * 150;
                    ly += (Math.random() - 0.5) * 150;
                    ctx.lineTo(lx, ly);
                }
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.lineWidth = 2; // Reset
            }

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
