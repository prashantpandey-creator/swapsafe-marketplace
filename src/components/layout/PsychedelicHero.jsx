import React, { useEffect, useRef } from 'react';

const PsychedelicHero = () => {
    const canvasRef = useRef(null);

    // Simple primality test for the visual effect
    const isPrime = (num) => {
        if (num <= 1) return false;
        if (num <= 3) return true;
        if (num % 2 === 0 || num % 3 === 0) return false;
        for (let i = 5; i * i <= num; i += 6) {
            if (num % i === 0 || num % (i + 2) === 0) return false;
        }
        return true;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let time = 0;

        // Configuration
        let width, height, centerX, centerY;
        const particles = [];
        const maxParticles = 3000; // Total points in the spiral

        // Mouse state with easing
        const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            centerX = width / 2;
            centerY = height / 2;
            mouse.targetX = centerX;
            mouse.targetY = centerY;
        };

        window.addEventListener('resize', resize);
        resize();

        // Pre-calculate Prime Status for efficiency
        // We simulate "infinite" scroll by cycling indices, but let's just keep a fixed set 
        // and animate their parameters for the "psychedelic" feel.
        const primeMap = new Uint8Array(maxParticles);
        for (let i = 0; i < maxParticles; i++) {
            primeMap[i] = isPrime(i) ? 1 : 0;
        }

        const handleMouseMove = (e) => {
            mouse.targetX = e.clientX;
            mouse.targetY = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const animate = () => {
            // "Non-colours" - clear with slight fade for trails? 
            // The user asked for "non-colours", implying monochrome/void. 
            // Let's do a hard clear or very fast fade for a crisp, mathematical look.
            ctx.fillStyle = 'rgba(5, 5, 10, 0.2)'; // Very deep void, slight trail
            ctx.fillRect(0, 0, width, height);

            time += 0.005; // Time flows slowly

            // Smooth mouse follow
            mouse.x += (mouse.targetX - mouse.x) * 0.05;
            mouse.y += (mouse.targetY - mouse.y) * 0.05;

            // Calculate offset based on mouse interaction (Parallax/Warp)
            const offsetX = (mouse.x - centerX) * 0.5;
            const offsetY = (mouse.y - centerY) * 0.5;

            ctx.save();
            ctx.translate(centerX, centerY);

            // GLOBAL ROTATION: The Spiral turns
            ctx.rotate(time * 0.2);

            // THE PRIME SPIRAL GENERATOR
            // Formula: Logarithmic / Sacks Spiral hybrid
            // r = c * sqrt(n)
            // theta = n * 2 * PI / Phi (Golden Angle)
            const goldenAngle = Math.PI * (3 - Math.sqrt(5));

            // Dynamic Zoom/Breathing
            const zoom = 5 + Math.sin(time * 0.5) * 1;

            for (let i = 1; i < maxParticles; i++) {
                // Determine visuals based on Prime nature
                const isP = primeMap[i];

                // Radius (distance from center)
                // We add 'time' to 'i' to make particles flow OUTWARD from the singularity
                // Modulo keeps them in a loop, but we need seamless flow.
                // Let's just create a static structure that rotates and breathes, 
                // OR animate 'i' to simulate flow. Let's try static structure first, it's more hypnotic.

                const r = zoom * Math.sqrt(i);

                // Angle
                // Mouse interaction: distort the angle slightly based on distance to mouse?
                // Let's keep angle pure math.
                const theta = i * goldenAngle;

                // Cartesian conversion
                let x = r * Math.cos(theta);
                let y = r * Math.sin(theta);

                // MOUSE INTERACTION: Repulsion / Black Hole effect
                // Calculate distance of point from MOUSE (relative to center)
                // We have to reverse the translation/rotation to map mouse accurately? 
                // Simpler: Just shift the center point (done via translate + offset)
                // Let's add a "Warp" effect based on mouse distance from center

                const distFromCenter = Math.sqrt(x * x + y * y);

                // Draw
                ctx.beginPath();

                if (isP) {
                    // PRIME NUMBER: Bright, White, Larger
                    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, 1500 / distFromCenter)})`; // Fade inner/outer
                    // Make primes sparkle
                    if (Math.random() > 0.95) ctx.fillStyle = '#fff';
                    const size = Math.max(0.5, 3 - distFromCenter / 500);
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                } else {
                    // COMPOSITE: Dim, Gray, Small
                    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.1, 500 / distFromCenter)})`;
                    ctx.arc(x, y, 0.5, 0, Math.PI * 2);
                }

                ctx.fill();
            }

            ctx.restore();

            // Connect lines between nearby primes? (Constellation effect)
            // Computationally expensive for JS canvas, user wants "Prime Spiral function".
            // The pure dotted spiral is the most accurate representation.

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return < canvas ref={canvasRef} className="absolute inset-0 z-0 bg-black" />;
};

export default PsychedelicHero;
