import React, { useRef, useEffect } from 'react';

const InteractiveMandala = ({ variant = 'home' }) => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Two time scales
        let time = 0; // Slow, for geometry evolution
        let tick = 0; // Fast, for flickering/electricity

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
            // TIME SCALES
            time += 0.002; // Medium generation speed (was 0.005)
            tick += 0.1;   // Fast flicker speed

            if (bloom < 1) bloom += 0.005;
            const activeBloom = bloom * (2 - bloom);

            const { width, height } = canvas;
            const cx = width / 2;
            const cy = height / 2;
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;

            // CLEARING: Increased opacity to clean up the "mess"
            // 0.25 allows some trails but keeps it readable
            ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
            ctx.fillRect(0, 0, width, height);

            ctx.lineWidth = 2;

            const nx = (mx / width) - 0.5;
            const ny = (my / height) - 0.5;
            const mouseDist = Math.hypot(nx, ny);

            // --- LAYER 1: STABLE PHYLLOTAXIS (The Base) ---
            const dots = 300 * activeBloom;
            const spread = 6;

            for (let i = 0; i < dots; i++) {
                const r = spread * Math.sqrt(i) * (1 + mouseDist * 0.5);
                const theta = i * GOLDEN_ANGLE + time * 0.2; // Slow rotation

                const x = cx + r * Math.cos(theta);
                const y = cy + r * Math.sin(theta);

                // Color flickers fast (using 'tick')
                const hue = (tick * 10 + i * 0.5) % 360;
                ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.6)`;

                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, TAU);
                ctx.fill();
            }

            // --- LAYER 2: MORPHING GEOMETRY (The "Generation") ---
            // We want to see the pattern "generating" => k changing smoothly
            const roseLayers = 3;
            const maxRadius = 350;

            for (let j = 0; j < roseLayers; j++) {
                ctx.beginPath();
                const layerIndex = j + 1;
                const radius = (maxRadius / roseLayers) * layerIndex * activeBloom;

                const rotation = time * (0.5 / layerIndex);

                // The "Generation" logic: k evolves over time
                // Patters shift from 4 petals -> 8 -> 6 etc.
                const kBase = 4 + Math.sin(time * 0.5) * 3;

                // Fast flicker color
                const layerHue = (tick * 5 + j * 90) % 360;
                ctx.strokeStyle = `hsla(${layerHue}, 100%, 65%, 0.5)`;

                // Electric Jitter (Fast tick)
                const jitter = Math.sin(tick * 2 + j) * 2;
                ctx.shadowBlur = 10 + jitter;
                ctx.shadowColor = `hsla(${layerHue}, 100%, 50%, 0.8)`;

                const resolution = 0.05;
                for (let theta = 0; theta < TAU * Math.ceil(kBase + 2); theta += resolution) {
                    // Rose Equation: r = cos(k * theta)
                    // The "k" is the gene of the flower
                    const k = kBase + (mouseDist * 2);

                    const r = radius * Math.cos(k * theta);

                    const x = cx + r * Math.cos(theta + rotation);
                    const y = cy + r * Math.sin(theta + rotation);

                    if (theta === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // --- LAYER 3: HIGH SPEED DATA STREAMS (The "Fast" part) ---
            // Orbiting electrons that move VERY fast
            const particles = 12;
            const orbitR = 400 * activeBloom;

            for (let p = 0; p < particles; p++) {
                // Moving fast around the ring
                const angle = (p / particles) * TAU + (tick * 0.05);
                const x = cx + orbitR * Math.cos(angle);
                const y = cy + orbitR * Math.sin(angle);

                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, TAU);
                ctx.fill();

                // Connect to center briefly to show "beams"
                if (Math.random() > 0.95) {
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(x, y);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
                    ctx.stroke();
                }
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
