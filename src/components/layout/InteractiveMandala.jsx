import React, { useRef, useEffect, useState } from 'react';

const InteractiveMandala = ({ variant = 'home' }) => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(false);

    // 1. Mobile Detection (Run once on mount)
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 2. Canvas Animation (Only run if NOT mobile)
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
        const PARTICLE_COUNT = 150; // Increased for density

        class Particle {
            constructor(cx, cy) {
                this.reset(cx, cy);
            }

            reset(cx, cy) {
                this.x = cx + (Math.random() - 0.5) * 50; // Start dense in center
                this.y = cy + (Math.random() - 0.5) * 50;

                // ORTHOGONAL MOVEMENT (Maze-like)
                const dir = Math.floor(Math.random() * 4); // 0: right, 1: down, 2: left, 3: up
                const speed = 0.5 + Math.random() * 1.5;

                this.vx = (dir === 0 ? 1 : dir === 2 ? -1 : 0) * speed;
                this.vy = (dir === 1 ? 1 : dir === 3 ? -1 : 0) * speed;

                this.life = 0;
                this.maxLife = 200 + Math.random() * 200;

                // Palette: Gold, Purple, Silver
                const rand = Math.random();
                if (rand > 0.6) {
                    this.color = `hsla(35, 100%, 70%, 0.8)`; // Gold
                } else if (rand > 0.3) {
                    this.color = `hsla(270, 70%, 65%, 0.8)`; // Purple
                } else {
                    this.color = `hsla(210, 20%, 90%, 0.8)`; // Silver
                }

                this.size = 1 + Math.random() * 2;
                this.history = []; // For trail lines
            }

            update(width, height) {
                this.life++;
                this.x += this.vx;
                this.y += this.vy;

                // Change direction randomly (90 deg turns)
                if (this.life % 40 === 0 && Math.random() > 0.5) {
                    if (this.vx !== 0) {
                        this.vx = 0;
                        this.vy = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random());
                    } else {
                        this.vy = 0;
                        this.vx = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random());
                    }
                }

                // Wrap around or bounce? Let's spread.
                if (this.x < 0 || this.x > width || this.y < 0 || this.y > height || this.life > this.maxLife) {
                    this.reset(width / 2, height / 2); // Regenerate at center
                }

                // Trail history
                if (this.life % 5 === 0) {
                    this.history.push({ x: this.x, y: this.y });
                    if (this.history.length > 5) this.history.shift();
                }
            }

            draw(ctx) {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();

                // Draw maze trails
                if (this.history.length > 1) {
                    ctx.beginPath();
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(this.history[0].x, this.history[0].y);
                    for (let p of this.history) ctx.lineTo(p.x, p.y);
                    ctx.stroke();
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

            // Nice trails effect without full clear
            ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            particles.forEach(p => {
                p.update(canvas.width, canvas.height);
                p.draw(ctx);

                // SYMMETRY: Rotational clones to create Mandala
                // We draw the same particle at rotated positions
                const segments = 8;
                for (let i = 1; i < segments; i++) {
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate((Math.PI * 2 / segments) * i);
                    ctx.translate(-cx, -cy);
                    p.draw(ctx);
                    ctx.restore();
                }
            });

            // Active Central Core (Regenerative Source)
            ctx.beginPath();
            ctx.arc(cx, cy, 5 + Math.sin(tick * 0.05) * 3, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${270 + Math.sin(tick * 0.02) * 30}, 80%, 70%, 1)`; // Pulsing Purple
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#8b5cf6';
            ctx.fill();
            ctx.shadowBlur = 0;

            animationFrameId = requestAnimationFrame(drawMandala);
        };

        const handleResize = () => init();
        window.addEventListener('resize', handleResize);
        drawMandala();

        return () => {
            window.removeEventListener('resize', handleResize);
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
                background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
                pointerEvents: 'none',
                overflow: 'hidden'
            }}>
                {/* Purple/Gold/Silver Orbs */}
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />

                <style>{`
                    .orb {
                        position: absolute;
                        border-radius: 50%;
                        filter: blur(40px);
                        opacity: 0.4;
                        animation: float 10s infinite ease-in-out;
                    }
                    .orb-1 {
                        top: 20%; left: 20%; width: 200px; height: 200px;
                        background: #fbbf24; /* Gold */
                    }
                    .orb-2 {
                        bottom: 20%; right: 20%; width: 250px; height: 250px;
                        background: #8b5cf6; /* Purple */
                        animation-delay: -2s;
                    }
                    .orb-3 {
                        top: 50%; left: 50%; width: 150px; height: 150px;
                        background: #e2e8f0; /* Silver */
                        transform: translate(-50%, -50%);
                        animation-delay: -5s;
                    }
                    @keyframes float {
                        0%, 100% { transform: translate(0, 0) scale(1); }
                        33% { transform: translate(30px, -50px) scale(1.1); }
                        66% { transform: translate(-20px, 20px) scale(0.9); }
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
                background: '#0f172a'
            }}
        />
    );
};

export default InteractiveMandala;
