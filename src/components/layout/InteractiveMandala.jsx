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
        const PARTICLE_COUNT = 80; // Reduced count for performance

        class Particle {
            constructor(cx, cy) {
                this.cx = cx;
                this.cy = cy;
                this.angle = Math.random() * Math.PI * 2;
                this.radius = Math.random() * 200;
                this.speed = 0.002 + Math.random() * 0.003;
                this.size = 1 + Math.random() * 2;
                this.hue = Math.random() * 30 + 30; // Golds/Oranges
            }

            update() {
                this.angle += this.speed;
                // Gentle pulse
                this.currRadius = this.radius + Math.sin(tick * 0.05) * 10;
            }

            draw(ctx) {
                const x = this.cx + Math.cos(this.angle) * this.currRadius;
                const y = this.cy + Math.sin(this.angle) * this.currRadius;

                ctx.fillStyle = `hsla(${this.hue}, 80%, 60%, 0.6)`;
                ctx.beginPath();
                ctx.arc(x, y, this.size, 0, Math.PI * 2);
                ctx.fill();

                // Symmetry - Draw 6 clones
                for (let i = 1; i < 6; i++) {
                    const rotAngle = this.angle + (Math.PI * 2 / 6) * i;
                    const rx = this.cx + Math.cos(rotAngle) * this.currRadius;
                    const ry = this.cy + Math.sin(rotAngle) * this.currRadius;
                    ctx.beginPath();
                    ctx.arc(rx, ry, this.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Init Particles
        const init = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push(new Particle(canvas.width / 2, canvas.height / 2));
            }
        };
        init();

        const drawMandala = () => {
            tick++;

            // Fade effect for trails
            ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Mouse interaction - slightly shift center
            const cx = canvas.width / 2 + (mouseRef.current.x - canvas.width / 2) * 0.05;
            const cy = canvas.height / 2 + (mouseRef.current.y - canvas.height / 2) * 0.05;

            particles.forEach(p => {
                p.cx = cx;
                p.cy = cy;
                p.update();
                p.draw(ctx);
            });

            // Center Glow
            ctx.beginPath();
            ctx.arc(cx, cy, 20 + Math.sin(tick * 0.1) * 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 165, 0, 0.2)';
            ctx.filter = 'blur(10px)';
            ctx.fill();
            ctx.filter = 'none';

            animationFrameId = requestAnimationFrame(drawMandala);
        };

        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('mousemove', handleMouseMove);
        drawMandala();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [variant, isMobile]);

    // MOBILE RENDER (CSS Only, Lightweight)
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
                pointerEvents: 'none'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(234, 179, 8, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 4s infinite ease-in-out'
                }} />
                <style>{`
                    @keyframes pulse {
                        0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
                        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
                        100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
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
