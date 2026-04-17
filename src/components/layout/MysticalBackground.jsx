import React, { useRef, useEffect, useState } from 'react';

const MysticalBackground = () => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isMobile) return;
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let isRunning = true;
        let tick = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Stars
        const stars = [];
        const STAR_COUNT = 200;

        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.01 + Math.random() * 0.02
            });
        }

        // Nebula clouds
        const clouds = [];
        const CLOUD_COUNT = 5;

        for (let i = 0; i < CLOUD_COUNT; i++) {
            clouds.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: 150 + Math.random() * 200,
                hue: 180 + Math.random() * 60, // Cyan to blue range
                alpha: 0.02 + Math.random() * 0.03,
                driftX: (Math.random() - 0.5) * 0.2,
                driftY: (Math.random() - 0.5) * 0.2
            });
        }

        const render = () => {
            if (!isRunning || !canvas) return;

            tick++;

            // Deep space background with fade
            ctx.fillStyle = 'rgba(5, 10, 20, 0.03)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            // Draw nebula clouds
            clouds.forEach(cloud => {
                cloud.x += cloud.driftX;
                cloud.y += cloud.driftY;

                // Wrap around
                if (cloud.x < -cloud.radius) cloud.x = canvas.width + cloud.radius;
                if (cloud.x > canvas.width + cloud.radius) cloud.x = -cloud.radius;
                if (cloud.y < -cloud.radius) cloud.y = canvas.height + cloud.radius;
                if (cloud.y > canvas.height + cloud.radius) cloud.y = -cloud.radius;

                const gradient = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.radius);
                gradient.addColorStop(0, `hsla(${cloud.hue}, 80%, 60%, ${cloud.alpha})`);
                gradient.addColorStop(0.5, `hsla(${cloud.hue}, 70%, 40%, ${cloud.alpha * 0.5})`);
                gradient.addColorStop(1, 'transparent');

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            });

            // Draw stars
            stars.forEach(star => {
                star.twinkle += star.speed;

                const brightness = 0.3 + Math.sin(star.twinkle) * 0.3 + Math.sin(star.twinkle * 2.3) * 0.2;
                const size = star.size * (0.8 + Math.sin(star.twinkle * 1.7) * 0.3);

                ctx.beginPath();
                ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200, 240, 255, ${brightness})`;
                ctx.shadowBlur = 8;
                ctx.shadowColor = `rgba(34, 211, 238, ${brightness * 0.5})`;
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            // Central aurora
            const auroraRadius = 250 + Math.sin(tick * 0.01) * 50;
            const auroraGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, auroraRadius);
            auroraGradient.addColorStop(0, `hsla(180, 100%, 70%, ${0.05 + Math.sin(tick * 0.02) * 0.02})`);
            auroraGradient.addColorStop(0.5, `hsla(200, 100%, 60%, 0.02)`);
            auroraGradient.addColorStop(1, 'transparent');

            ctx.fillStyle = auroraGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            isRunning = false;
            window.removeEventListener('resize', resize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isMobile]);

    if (isMobile) {
        return (
            <div style={{
                position: 'fixed',
                top: 0, left: 0,
                width: '100%', height: '100%',
                zIndex: 0,
                background: 'radial-gradient(ellipse at center, #0a1428 0%, #050a14 40%, #000205 100%)',
                pointerEvents: 'none'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '300px', height: '300px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, rgba(6,182,212,0.08) 40%, transparent 70%)',
                    animation: 'mysticalPulse 4s ease-in-out infinite',
                }} />
            </div>
        );
    }

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0, left: 0,
                width: '100%', height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
                background: '#020810'
            }}
        />
    );
};

export default MysticalBackground;
