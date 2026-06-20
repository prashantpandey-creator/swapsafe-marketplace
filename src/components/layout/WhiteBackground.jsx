import React, { useRef, useEffect, useState } from 'react';

/**
 * WhiteBackground — professional, sleek, boho-modern white theme.
 * Warm off-white canvas with slow-drifting organic blobs and a faint
 * grain overlay. Designed to read as premium/editorial, not flashy.
 * Mobile falls back to a static warm-white gradient (no canvas).
 */
const WhiteBackground = () => {
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

        // Boho-modern earthy accent palette (muted terracotta, sand, sage, clay)
        const palette = [
            'rgba(214, 178, 156, 0.28)', // sand
            'rgba(198, 162, 140, 0.24)', // clay
            'rgba(176, 186, 168, 0.22)', // sage
            'rgba(224, 199, 187, 0.26)', // blush
            'rgba(205, 190, 168, 0.22)', // oat
        ];

        // Large soft drifting blobs
        const blobs = [];
        const BLOB_COUNT = 5;
        for (let i = 0; i < BLOB_COUNT; i++) {
            blobs.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: 180 + Math.random() * 220,
                vx: (Math.random() - 0.5) * 0.18,
                vy: (Math.random() - 0.5) * 0.18,
                color: palette[i % palette.length],
                phase: Math.random() * Math.PI * 2,
            });
        }

        const render = () => {
            if (!isRunning || !canvas) return;
            tick++;

            // Warm off-white base
            ctx.fillStyle = '#faf7f2';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Soft drifting blobs (radial gradients)
            blobs.forEach((b) => {
                b.x += b.vx;
                b.y += b.vy;
                if (b.x < -b.radius) b.x = canvas.width + b.radius;
                if (b.x > canvas.width + b.radius) b.x = -b.radius;
                if (b.y < -b.radius) b.y = canvas.height + b.radius;
                if (b.y > canvas.height + b.radius) b.y = -b.radius;

                const breathe = b.radius * (1 + Math.sin(tick * 0.005 + b.phase) * 0.08);
                const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, breathe);
                grad.addColorStop(0, b.color);
                grad.addColorStop(1, 'rgba(250, 247, 242, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(b.x, b.y, breathe, 0, Math.PI * 2);
                ctx.fill();
            });

            // Very faint thin accent line (editorial detail)
            ctx.strokeStyle = 'rgba(160, 140, 120, 0.06)';
            ctx.lineWidth = 1;
            const lineGap = 140;
            for (let y = lineGap; y < canvas.height; y += lineGap) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            isRunning = false;
            window.removeEventListener('resize', resize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isMobile]);

    if (isMobile) {
        return (
            <div
                style={{
                    position: 'fixed',
                    top: 0, left: 0,
                    width: '100%', height: '100%',
                    zIndex: 0,
                    background: 'linear-gradient(135deg, #faf7f2 0%, #f3ece2 50%, #f7f1ea 100%)',
                    pointerEvents: 'none',
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
                background: '#faf7f2',
            }}
        />
    );
};

export default WhiteBackground;
