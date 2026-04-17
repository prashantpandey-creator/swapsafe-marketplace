import React, { useRef, useEffect, useState } from 'react';

const PsychedelicBackground = () => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const animationRef = useRef(null);

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

        mouseRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        // Golden ratio
        const PHI = (1 + Math.sqrt(5)) / 2;

        // ─── Floating orbs ───────────────────────────────────────────────────────
        class Orb {
            constructor(w, h) { this.reset(w, h); }

            reset(w, h) {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.radius = 40 + Math.random() * 120;
                this.hue = Math.random() * 360;
                this.hueSpeed = (Math.random() - 0.5) * 0.4;
                this.vx = (Math.random() - 0.5) * 0.3;
                this.vy = (Math.random() - 0.5) * 0.3;
                this.opacity = 0.02 + Math.random() * 0.06;
                this.pulsePhase = Math.random() * Math.PI * 2;
                this.pulseSpeed = 0.01 + Math.random() * 0.02;
            }

            update(w, h, dt) {
                this.hue = (this.hue + this.hueSpeed * dt) % 360;
                this.pulsePhase += this.pulseSpeed * dt;
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                if (this.x < -this.radius * 2) this.x = w + this.radius;
                if (this.x > w + this.radius * 2) this.x = -this.radius;
                if (this.y < -this.radius * 2) this.y = h + this.radius;
                if (this.y > h + this.radius * 2) this.y = -this.radius;
            }

            draw(ctx) {
                const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
                const r = this.radius * pulse;
                const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
                grad.addColorStop(0, `hsla(${this.hue}, 100%, 65%, ${this.opacity * 1.5})`);
                grad.addColorStop(0.4, `hsla(${(this.hue + 40) % 360}, 90%, 55%, ${this.opacity * 0.7})`);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // ─── Fibonacci / golden-ratio spiral ─────────────────────────────────────
        class GoldenSpiral {
            constructor() {
                this.rotation = 0;
                this.baseHue = 270; // violet start
            }

            draw(ctx, cx, cy, tick) {
                this.rotation -= 0.0003;
                const maxPoints = 220;

                ctx.save();
                for (let i = 0; i < maxPoints; i++) {
                    const angle = -i * 0.13 + this.rotation;
                    const radius = Math.pow(PHI, i * 0.042) * 3;

                    if (radius > Math.max(ctx.canvas.width, ctx.canvas.height)) break;

                    const x = cx + Math.cos(angle) * radius;
                    const y = cy + Math.sin(angle) * radius;

                    const hue = (this.baseHue + tick * 0.04 + i * 0.6) % 360;
                    const alpha = Math.max(0, 0.25 - i * 0.0008);
                    const size = Math.max(0.3, 1.5 - i * 0.004);

                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fillStyle = `hsla(${hue}, 90%, 65%, ${alpha})`;
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = `hsla(${hue}, 100%, 70%, ${alpha * 0.6})`;
                    ctx.fill();
                }
                ctx.shadowBlur = 0;
                ctx.restore();
            }
        }

        // ─── Pulsing ring system ──────────────────────────────────────────────────
        class RingSystem {
            constructor() {
                this.rings = [];
                for (let i = 0; i < 8; i++) {
                    this.rings.push({
                        phase: (i / 8) * Math.PI * 2,
                        speed: 0.008 + i * 0.002,
                        baseRadius: 60 + i * 45,
                        hueOffset: i * 40,
                        lineWidth: 0.5 + i * 0.15
                    });
                }
            }

            draw(ctx, cx, cy, tick) {
                this.rings.forEach(ring => {
                    ring.phase += ring.speed;
                    const pulse = Math.sin(ring.phase) * 0.25 + 0.75;
                    const r = ring.baseRadius * pulse;
                    const hue = (270 + tick * 0.03 + ring.hueOffset) % 360;
                    const alpha = Math.max(0, 0.18 - (ring.baseRadius / 800));

                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${alpha})`;
                    ctx.lineWidth = ring.lineWidth;
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = `hsla(${hue}, 100%, 70%, ${alpha * 0.5})`;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                });
            }
        }

        // ─── Particle field ───────────────────────────────────────────────────────
        class ParticleField {
            constructor(w, h, count = 60) {
                this.particles = Array.from({ length: count }, () => this.spawn(w, h));
            }

            spawn(w, h) {
                return {
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    hue: Math.random() * 360,
                    size: 0.5 + Math.random() * 1.5,
                    alpha: 0.1 + Math.random() * 0.35,
                    twinkle: Math.random() * Math.PI * 2,
                    twinkleSpeed: 0.02 + Math.random() * 0.04
                };
            }

            update(w, h, dt) {
                this.particles.forEach(p => {
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.twinkle += p.twinkleSpeed * dt;
                    p.hue = (p.hue + 0.3 * dt) % 360;
                    if (p.x < 0) p.x = w;
                    if (p.x > w) p.x = 0;
                    if (p.y < 0) p.y = h;
                    if (p.y > h) p.y = 0;
                });
            }

            draw(ctx) {
                this.particles.forEach(p => {
                    const t = Math.sin(p.twinkle) * 0.4 + 0.6;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
                    ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${p.alpha * t})`;
                    ctx.fill();
                });
            }
        }

        // ─── Bindu (central point) ────────────────────────────────────────────────
        function drawBindu(ctx, cx, cy, tick) {
            const pulse = Math.sin(tick * 0.03) * 0.5 + 0.5;
            const size = 2 + pulse * 2;

            // Outer glow
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40 + pulse * 20);
            grad.addColorStop(0, `hsla(280, 100%, 80%, 0.4)`);
            grad.addColorStop(0.3, `hsla(260, 100%, 65%, 0.12)`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, 60 + pulse * 20, 0, Math.PI * 2);
            ctx.fill();

            // Core dot
            ctx.beginPath();
            ctx.arc(cx, cy, size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(280, 100%, 85%, 0.9)`;
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(191, 0, 255, 0.9)';
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // ─── Init scene objects ───────────────────────────────────────────────────
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        const orbs = Array.from({ length: 12 }, () => new Orb(canvas.width, canvas.height));
        const spiral = new GoldenSpiral();
        const rings = new RingSystem();
        const particles = new ParticleField(canvas.width, canvas.height, 80);

        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);

        // ─── Render loop ──────────────────────────────────────────────────────────
        let lastTime = 0;

        const render = (timestamp) => {
            if (!isRunning || !canvas) return;

            if (!lastTime) lastTime = timestamp;
            const rawDt = (timestamp - lastTime) / 1000;
            lastTime = timestamp;
            // Clamp to avoid huge jumps on tab-hidden resume
            const dt = Math.min(rawDt, 0.05) * 60;

            tick += dt;

            const w = canvas.width;
            const h = canvas.height;

            // Slow fade creates trailing glow — partial clear instead of full clear
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, w, h);

            // Mouse offset
            const cx = w / 2;
            const cy = h / 2;
            const dx = mouseRef.current.x - cx;
            const dy = mouseRef.current.y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const centerX = cx + (dx / dist) * Math.min(dist * 0.01, 15);
            const centerY = cy + (dy / dist) * Math.min(dist * 0.01, 15);

            // Background deep purple vignette
            const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(w, h) * 0.7);
            bgGrad.addColorStop(0, 'rgba(25, 0, 45, 0.06)');
            bgGrad.addColorStop(0.5, 'rgba(10, 0, 20, 0.04)');
            bgGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);

            // Orbs (additive blending for glow)
            ctx.globalCompositeOperation = 'lighter';
            orbs.forEach(orb => { orb.update(w, h, dt); orb.draw(ctx); });
            ctx.globalCompositeOperation = 'source-over';

            // Rings
            rings.draw(ctx, centerX, centerY, tick);

            // Spiral (additive)
            ctx.globalCompositeOperation = 'lighter';
            spiral.draw(ctx, centerX, centerY, tick);
            ctx.globalCompositeOperation = 'source-over';

            // Particles
            particles.update(w, h, dt);
            particles.draw(ctx);

            // Bindu center
            drawBindu(ctx, centerX, centerY, tick);

            animationRef.current = requestAnimationFrame(render);
        };

        render(0);

        return () => {
            isRunning = false;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isMobile]); // ← isMobile only; no isInitialized state needed

    if (isMobile) {
        return (
            <div style={{
                position: 'fixed',
                top: 0, left: 0,
                width: '100%', height: '100%',
                zIndex: 0,
                background: 'radial-gradient(ellipse at center, #1a002e 0%, #0d0015 40%, #000000 100%)',
                pointerEvents: 'none'
            }} />
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

export default PsychedelicBackground;
