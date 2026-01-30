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

        // Initialize mouse in center
        mouseRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        let tick = 0;
        const particles = [];
        const PARTICLE_COUNT = 120; // Good balance

        class Particle {
            constructor(cx, cy) {
                this.reset(cx, cy);
            }

            reset(cx, cy) {
                this.x = cx + (Math.random() - 0.5) * 100;
                this.y = cy + (Math.random() - 0.5) * 100;

                // Slow Movement
                this.angle = Math.random() * Math.PI * 2;
                this.speed = 0.2 + Math.random() * 0.5; // Slower
                this.vx = Math.cos(this.angle) * this.speed;
                this.vy = Math.sin(this.angle) * this.speed;

                this.life = 0;
                this.maxLife = 300 + Math.random() * 200;

                // Deep Neon Colors
                const rand = Math.random();
                if (rand > 0.6) {
                    this.color = `hsla(280, 100%, 60%, 1)`; // Neon Purple
                    this.shadow = '#d8b4fe';
                } else if (rand > 0.3) {
                    this.color = `hsla(180, 100%, 70%, 1)`; // Cyan/Silver Glow
                    this.shadow = '#bae6fd';
                } else {
                    this.color = `hsla(320, 100%, 60%, 1)`; // Deep Pink/Magenta
                    this.shadow = '#fbcfe8';
                }

                this.history = [];
            }

            update(width, height, mouse) {
                this.life++;

                // Mouse Attraction (Gravity Well)
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.hypot(dx, dy);

                // Gentle pull towards mouse if far away
                if (dist > 100) {
                    this.vx += (dx / dist) * 0.002;
                    this.vy += (dy / dist) * 0.002;
                }

                // Drag/Friction to prevent wild orbiting
                this.vx *= 0.99;
                this.vy *= 0.99;

                this.x += this.vx;
                this.y += this.vy;

                // Reset if dead or out of bounds (wrapped logic)
                if (this.life > this.maxLife) {
                    this.reset(width / 2, height / 2);
                }

                // Trail history for lines
                if (this.life % 3 === 0) {
                    this.history.push({ x: this.x, y: this.y });
                    if (this.history.length > 10) this.history.shift(); // Longer trails
                }
            }

            draw(ctx) {
                // Draw ONLY lines, no dots
                if (this.history.length > 1) {
                    ctx.beginPath();
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 1.5;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    // Glow effect
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = this.color;

                    ctx.moveTo(this.history[0].x, this.history[0].y);
                    for (let p of this.history) ctx.lineTo(p.x, p.y);
                    ctx.stroke();

                    ctx.shadowBlur = 0; // Reset
                }
            }
        }

        // Init Particles
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

            // Fade trails deeply for "deep" look
            ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;

            ctx.globalCompositeOperation = 'lighter'; // Neon blending

            particles.forEach(p => {
                p.update(canvas.width, canvas.height, { x: mx, y: my });

                // Draw Original
                p.draw(ctx);

                // SYMMETRY: Rotational clones (Mandala effect)
                // 6-way symmetry for that "Mandala" feel
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

            ctx.globalCompositeOperation = 'source-over'; // Reset blend mode

            // Central Core - Deep Glowing
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#d8b4fe'; // Purple glow
            ctx.fill();
            ctx.shadowBlur = 0;

            animationFrameId = requestAnimationFrame(drawMandala);
        };

        const handleResize = () => init();

        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        drawMandala();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [variant, isMobile]);

    // MOBILE RENDER - Deep animated gradients
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
                pointerEvents: 'none',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                    animation: 'pulse 5s infinite ease-in-out'
                }} />
                <style>{`
                    @keyframes pulse {
                        0% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
                        50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
                        100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
                    }
                `}</style>
            </div>
        );
    }

    // DESKTOP RENDER
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
                background: '#020205' // Very dark base
            }}
        />
    );
};

export default InteractiveMandala;
