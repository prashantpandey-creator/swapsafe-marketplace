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

        // Start mouse in center
        mouseRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        let tick = 0;
        const particles = [];
        const PARTICLE_COUNT = 150; // Increased density for full coverage

        class Particle {
            constructor(w, h) {
                this.reset(w, h, true);
            }

            reset(w, h, initial = false) {
                // Spawn source: Mix of center and random spots near center
                const cx = w / 2;
                const cy = h / 2;

                // Determine start position (emanating source)
                if (initial) {
                    this.x = Math.random() * w;
                    this.y = Math.random() * h;
                } else {
                    this.x = cx + (Math.random() - 0.5) * 50;
                    this.y = cy + (Math.random() - 0.5) * 50;
                }

                // Emanating Direction (Outwards)
                const angle = Math.atan2(this.y - cy, this.x - cx) + (Math.random() - 0.5);
                this.speed = 0.5 + Math.random() * 1.5; // Varied speed

                this.vx = Math.cos(angle) * this.speed;
                this.vy = Math.sin(angle) * this.speed;

                this.life = 0;
                this.maxLife = 400 + Math.random() * 400; // Long life to reach edges

                // Color Palette: Deep Neon
                const palette = ['#a855f7', '#06b6d4', '#ec4899', '#8b5cf6'];
                this.color = palette[Math.floor(Math.random() * palette.length)];

                this.history = []; // Trail
            }

            update(width, height, mouse) {
                this.life++;

                // 1. Base Emanating Movement
                this.x += this.vx;
                this.y += this.vy;

                // 2. Mouse Interaction: "Stretch" and "Steer"
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.hypot(dx, dy);
                const force = Math.max(0, (600 - dist) / 600); // Effect range

                if (dist > 20) {
                    // Pull velocity towards mouse slightly (Steering)
                    this.vx += (dx / dist) * force * 0.02;
                    this.vy += (dy / dist) * force * 0.02;
                }

                // 3. Friction to keep things controlled
                this.vx *= 0.995;
                this.vy *= 0.995;

                // 4. Reset if completely off screen OR too old
                // Allow going slightly off screen before reset to ensure full coverage
                const margin = 100;
                if (this.life > this.maxLife ||
                    this.x < -margin || this.x > width + margin ||
                    this.y < -margin || this.y > height + margin) {
                    this.reset(width, height);
                }

                // 5. Trail history
                if (this.life % 2 === 0) {
                    this.history.push({ x: this.x, y: this.y });
                    if (this.history.length > 20) this.history.shift(); // Longer trails for "stretching" look
                }
            }

            draw(ctx) {
                if (this.history.length > 1) {
                    ctx.beginPath();
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 1; // Fine lines

                    // Draw flowing curve
                    ctx.moveTo(this.history[0].x, this.history[0].y);
                    for (let p of this.history) {
                        ctx.lineTo(p.x, p.y);
                    }
                    ctx.stroke();
                }
            }
        }

        const init = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles.length = 0;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push(new Particle(canvas.width, canvas.height));
            }
        };
        init();

        const drawMandala = () => {
            tick++;

            // Slow fade for persistent trails (Light painting effect)
            ctx.fillStyle = 'rgba(2, 2, 10, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;

            ctx.globalCompositeOperation = 'lighter';

            particles.forEach(p => {
                p.update(canvas.width, canvas.height, { x: mx, y: my });

                // Draw Original
                p.draw(ctx);

                // Rotational Symmetry - Spreads the pattern everywhere
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
        const handleMouseMove = (e) => {
            // Smooth mouse interpolation could reside here
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
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
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
