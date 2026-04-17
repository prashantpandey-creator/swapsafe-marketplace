import React, { useRef, useEffect, useState } from 'react';

const VoidBackground = () => {
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

        // Electric pulses from center
        const pulses = [];

        class VoidPulse {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = canvas.width / 2;
                this.y = canvas.height / 2;
                this.radius = 0;
                this.maxRadius = Math.max(canvas.width, canvas.height) * 0.7;
                this.speed = 1 + Math.random() * 2;
                this.alpha = 0.4 + Math.random() * 0.3;
                this.width = 0.5 + Math.random() * 1.5;
            }

            update() {
                this.radius += this.speed;
                if (this.radius > this.maxRadius) {
                    this.reset();
                }
            }

            draw(ctx) {
                const alpha = this.alpha * (1 - this.radius / this.maxRadius);
                if (alpha <= 0) return;

                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.3})`;
                ctx.lineWidth = this.width;
                ctx.stroke();
            }
        }

        for (let i = 0; i < 8; i++) {
            const pulse = new VoidPulse();
            pulse.radius = (pulse.maxRadius / 8) * i;
            pulses.push(pulse);
        }

        // Red electrical sparks
        const sparks = [];

        class Spark {
            constructor() {
                this.reset();
            }

            reset() {
                this.angle = Math.random() * Math.PI * 2;
                this.distance = 50 + Math.random() * 200;
                this.speed = 0.5 + Math.random() * 1;
                this.life = 0;
                this.maxLife = 100 + Math.random() * 150;
                this.size = 1 + Math.random() * 2;
            }

            update() {
                this.life++;
                this.distance += this.speed;
                this.angle += 0.02;

                if (this.life > this.maxLife) {
                    this.reset();
                }
            }

            draw(ctx, cx, cy) {
                const alpha = Math.min(1, this.life / 20) * Math.max(0, 1 - this.life / this.maxLife);

                const x = cx + Math.cos(this.angle) * this.distance;
                const y = cy + Math.sin(this.angle) * this.distance;

                ctx.beginPath();
                ctx.arc(x, y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 100, 100, ${alpha * 0.8})`;
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        for (let i = 0; i < 30; i++) {
            sparks.push(new Spark());
        }

        const render = () => {
            if (!isRunning || !canvas) return;

            tick++;

            // Deep void fade
            ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            // Central void core
            const coreSize = 80 + Math.sin(tick * 0.03) * 20;
            const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize);
            coreGradient.addColorStop(0, `rgba(239, 68, 68, ${0.15 + Math.sin(tick * 0.02) * 0.05})`);
            coreGradient.addColorStop(0.5, `rgba(220, 38, 38, 0.05)`);
            coreGradient.addColorStop(1, 'transparent');

            ctx.fillStyle = coreGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw pulses
            pulses.forEach(p => {
                p.update();
                p.draw(ctx);
            });

            // Draw sparks
            sparks.forEach(s => {
                s.update();
                s.draw(ctx, cx, cy);
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
                background: 'radial-gradient(ellipse at center, #1a0000 0%, #000000 40%, #000000 100%)',
                pointerEvents: 'none'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '300px', height: '300px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.08) 40%, transparent 70%)',
                    animation: 'voidPulse 3s ease-in-out infinite',
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
                background: '#000000'
            }}
        />
    );
};

export default VoidBackground;
