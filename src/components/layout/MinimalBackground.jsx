import React, { useRef, useEffect, useState } from 'react';

const MinimalBackground = () => {
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

        // Subtle grid
        const gridSize = 60;

        // Floating dots
        const dots = [];
        const DOT_COUNT = 30;

        for (let i = 0; i < DOT_COUNT; i++) {
            dots.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: 2 + Math.random() * 3,
                pulseOffset: Math.random() * Math.PI * 2
            });
        }

        const render = () => {
            if (!isRunning || !canvas) return;

            tick++;

            // Clean gray background
            ctx.fillStyle = 'rgba(17, 24, 39, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw subtle grid
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.03)';
            ctx.lineWidth = 1;

            for (let x = 0; x < canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }

            for (let y = 0; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Draw floating dots
            dots.forEach(dot => {
                dot.x += dot.vx;
                dot.y += dot.vy;

                // Bounce off edges
                if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
                if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;

                const pulse = 0.3 + Math.sin(tick * 0.02 + dot.pulseOffset) * 0.2;

                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(99, 102, 241, ${pulse * 0.5})`;
                ctx.fill();
            });

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
                background: '#111827',
                pointerEvents: 'none'
            }}
            />
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
                background: '#111827'
            }}
        />
    );
};

export default MinimalBackground;
