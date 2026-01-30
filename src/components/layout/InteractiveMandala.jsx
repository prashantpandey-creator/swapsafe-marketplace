import React, { useRef, useEffect, useState } from 'react';

const InteractiveMandala = ({ variant = 'home' }) => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(false);

    // 1. Mobile Detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 2. Canvas Animation
    useEffect(() => {
        if (isMobile) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        mouseRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        let tick = 0;
        const particles = [];
        const PARTICLE_COUNT = 100; // Optimal count for smooth FPS

        class Particle {
            constructor(cx, cy) {
                this.reset(cx, cy);
            }

            reset(cx, cy) {
                this.x = cx + (Math.random() - 0.5) * 200;
                this.y = cy + (Math.random() - 0.5) * 200;

                // Smoother, faster movement
                this.angle = Math.random() * Math.PI * 2;
                this.speed = 0.5 + Math.random() * 0.8; // Increased speed (was 0.2)

                this.vx = Math.cos(this.angle) * this.speed;
                this.vy = Math.sin(this.angle) * this.speed;

                this.life = 0;
                this.maxLife = 200 + Math.random() * 100;

                // Neon Colors (Pre-calculated strings for performance)
                const rand = Math.random();
                if (rand > 0.6) {
                    this.color = '#a855f7'; // Purple-500
                } else if (rand > 0.3) {
                    this.color = '#22d3ee'; // Cyan-400
                } else {
                    this.color = '#e879f9'; // Fuchsia-400
                }

                this.history = [];
            }

            update(width, height, mouse) {
                this.life++;

                // Gentle Mouse Attraction
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.hypot(dx, dy);

                // Swirling attraction
                if (dist > 50 && dist < 400) {
                    this.vx += (dx / dist) * 0.005;
                    this.vy += (dy / dist) * 0.005;
                }

                this.vx *= 0.98; // Less drag for more flow
                this.vy *= 0.98;

                this.x += this.vx;
                this.y += this.vy;

                if (this.life > this.maxLife || this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
                    this.reset(width / 2, height / 2);
                }

                // Shorter trails for cleaner look
                if (this.life % 2 === 0) {
                    this.history.push({ x: this.x, y: this.y });
                    if (this.history.length > 8) this.history.shift();
                }
            }

            draw(ctx) {
                // Draw lines only (High Performance: No ShadowBlur here)
                if (this.history.length > 1) {
                    ctx.beginPath();
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 1.5;
                    ctx.moveTo(this.history[0].x, this.history[0].y);
                    for (let p of this.history) ctx.lineTo(p.x, p.y);
                    ctx.stroke();
                }
            }
        }

        const init = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles.length = 0;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push(new Particle(canvas.width / 2, canvas.height / 2));
            }
        };
        init();

        const drawMandala = () => {
            tick++;

            // Fast clear with fade
            ctx.fillStyle = 'rgba(10, 10, 25, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;

            // PERFORMANCE OPTIMIZATION:
            // Use lighter composite operation for "Neon" look without expensive shadows
            ctx.globalCompositeOperation = 'lighter';

            particles.forEach(p => {
                p.update(canvas.width, canvas.height, { x: mx, y: my });

                // Draw Original
                p.draw(ctx);

                // 6-way Symmetry (Mandala)
                const segments = 6;
                for (let i = 1; i < segments; i++) {
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate((Math.PI * 2 / segments) * i);
                    ctx.translate(-cx, -cy);
                    p.draw(ctx);
                    ctx.restore();
                }
            });

            ctx.globalCompositeOperation = 'source-over';

            animationFrameId = requestAnimationFrame(drawMandala);
        };

        const handleResize = () => init();
        const handleMouseMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        drawMandala();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [variant, isMobile]);

    // MOBILE RENDER
    if (isMobile) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
                pointerEvents: 'none'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 60%)',
                }} />
            </div>
        );
    }

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
                background: '#020205'
            }}
        />
    );
};

export default InteractiveMandala;
