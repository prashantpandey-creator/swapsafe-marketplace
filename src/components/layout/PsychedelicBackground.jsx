import React, { useRef, useEffect, useState } from 'react';

const PsychedelicBackground = () => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isMobile) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let tick = 0;

        mouseRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        // --- Psychedelic Ring System ---
        const rings = [];
        const RING_COUNT = 40;
        const waves = [];
        const WAVE_COUNT = 200;

        class PulseRing {
            constructor(w, h) {
                this.cx = w / 2;
                this.cy = h / 2;
                this.radius = 0;
                this.maxRadius = Math.max(w, h) * 0.8;
                this.speed = 0.4 + Math.random() * 1.2;
                this.life = 0;
                this.hue = 260 + Math.random() * 60; // purple range 260-320
                this.width = 1 + Math.random() * 3;
                this.wobble = Math.random() * Math.PI * 2;
                this.wobbleSpeed = 0.01 + Math.random() * 0.03;
                this.segments = 6 + Math.floor(Math.random() * 6);
            }

            reset(w, h) {
                this.cx = w / 2;
                this.cy = h / 2;
                this.radius = 0;
                this.life = 0;
                this.speed = 0.4 + Math.random() * 1.2;
                this.hue = 260 + Math.random() * 60;
                this.width = 1 + Math.random() * 3;
                this.wobble = Math.random() * Math.PI * 2;
                this.segments = 6 + Math.floor(Math.random() * 6);
            }

            update(w, h, mouse) {
                this.life++;
                this.radius += this.speed;
                this.wobble += this.wobbleSpeed;

                // Mouse influence: shift center slightly toward mouse
                const dx = mouse.x - w / 2;
                const dy = mouse.y - h / 2;
                this.cx = w / 2 + dx * 0.05 * Math.sin(this.life * 0.02);
                this.cy = h / 2 + dy * 0.05 * Math.cos(this.life * 0.02);

                if (this.radius > this.maxRadius) {
                    this.reset(w, h);
                }
            }

            draw(ctx, tick) {
                const alpha = Math.max(0, 1 - this.radius / this.maxRadius);
                if (alpha <= 0) return;

                // Draw as segmented psychedelic ring with wobble
                ctx.save();
                ctx.translate(this.cx, this.cy);

                for (let i = 0; i < this.segments; i++) {
                    const angle = (Math.PI * 2 / this.segments) * i + this.wobble;
                    const nextAngle = (Math.PI * 2 / this.segments) * (i + 1) + this.wobble;
                    const wobbleR = this.radius + Math.sin(tick * 0.03 + i * 1.5) * 8;

                    ctx.beginPath();
                    ctx.arc(0, 0, wobbleR, angle, nextAngle);
                    ctx.strokeStyle = `hsla(${this.hue + i * 10 + tick * 0.5}, 100%, ${60 + Math.sin(tick * 0.05) * 15}%, ${alpha * 0.6})`;
                    ctx.lineWidth = this.width;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = `hsla(${this.hue}, 100%, 60%, ${alpha * 0.5})`;
                    ctx.stroke();
                }

                ctx.restore();
            }
        }

        class NeonWave {
            constructor(w, h) {
                this.reset(w, h, true);
            }

            reset(w, h, initial = false) {
                const cx = w / 2;
                const cy = h / 2;

                if (initial) {
                    this.x = cx + (Math.random() - 0.5) * w;
                    this.y = cy + (Math.random() - 0.5) * h;
                } else {
                    // Emanate from center
                    this.x = cx + (Math.random() - 0.5) * 30;
                    this.y = cy + (Math.random() - 0.5) * 30;
                }

                const angle = Math.atan2(this.y - cy, this.x - cx) + (Math.random() - 0.5) * 0.5;
                this.speed = 0.3 + Math.random() * 2;
                this.vx = Math.cos(angle) * this.speed;
                this.vy = Math.sin(angle) * this.speed;

                this.life = 0;
                this.maxLife = 300 + Math.random() * 400;

                // Neon purple palette
                const palette = [
                    '#bf00ff', '#8b00ff', '#cc00ff', '#e040fb',
                    '#d500f9', '#aa00ff', '#7c4dff', '#b388ff',
                    '#ea80fc', '#ce93d8', '#f50057', '#d000ff'
                ];
                this.color = palette[Math.floor(Math.random() * palette.length)];
                this.size = 1 + Math.random() * 2;
                this.trail = [];
                this.phase = Math.random() * Math.PI * 2;
            }

            update(w, h, mouse, tick) {
                this.life++;

                // Spiral outward with sinusoidal wobble
                const cx = w / 2;
                const cy = h / 2;
                const dx = this.x - cx;
                const dy = this.y - cy;
                const dist = Math.hypot(dx, dy);

                // Add spiral rotation
                const perpX = -dy / (dist || 1);
                const perpY = dx / (dist || 1);
                this.vx += perpX * 0.008;
                this.vy += perpY * 0.008;

                // Sinusoidal wave motion
                this.x += this.vx + Math.sin(tick * 0.02 + this.phase) * 0.3;
                this.y += this.vy + Math.cos(tick * 0.02 + this.phase) * 0.3;

                // Mouse attraction
                const mdx = mouse.x - this.x;
                const mdy = mouse.y - this.y;
                const mdist = Math.hypot(mdx, mdy);
                if (mdist > 30 && mdist < 400) {
                    const force = (400 - mdist) / 400;
                    this.vx += (mdx / mdist) * force * 0.03;
                    this.vy += (mdy / mdist) * force * 0.03;
                }

                this.vx *= 0.997;
                this.vy *= 0.997;

                // Trail
                if (this.life % 2 === 0) {
                    this.trail.push({ x: this.x, y: this.y });
                    if (this.trail.length > 25) this.trail.shift();
                }

                const margin = 80;
                if (this.life > this.maxLife ||
                    this.x < -margin || this.x > w + margin ||
                    this.y < -margin || this.y > h + margin) {
                    this.reset(w, h);
                }
            }

            draw(ctx) {
                if (this.trail.length < 2) return;

                const alpha = Math.min(1, this.life / 30) * Math.max(0, 1 - this.life / this.maxLife);

                ctx.beginPath();
                ctx.moveTo(this.trail[0].x, this.trail[0].y);
                for (let i = 1; i < this.trail.length; i++) {
                    ctx.lineTo(this.trail[i].x, this.trail[i].y);
                }
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.size;
                ctx.globalAlpha = alpha * 0.7;
                ctx.stroke();
                ctx.globalAlpha = 1;

                // Glow dot at head
                const head = this.trail[this.trail.length - 1];
                ctx.beginPath();
                ctx.arc(head.x, head.y, this.size * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 12;
                ctx.shadowColor = this.color;
                ctx.globalAlpha = alpha;
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            }
        }

        const init = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            rings.length = 0;
            waves.length = 0;

            for (let i = 0; i < RING_COUNT; i++) {
                const ring = new PulseRing(canvas.width, canvas.height);
                ring.radius = (ring.maxRadius / RING_COUNT) * i; // stagger
                ring.life = i * 10;
                rings.push(ring);
            }
            for (let i = 0; i < WAVE_COUNT; i++) {
                waves.push(new NeonWave(canvas.width, canvas.height));
            }
        };
        init();

        const render = () => {
            tick++;

            // Dark fade with purple tint
            ctx.fillStyle = 'rgba(5, 0, 15, 0.06)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            // Central glow pulse
            const glowSize = 150 + Math.sin(tick * 0.02) * 50;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize);
            grad.addColorStop(0, `hsla(280, 100%, 60%, ${0.08 + Math.sin(tick * 0.03) * 0.04})`);
            grad.addColorStop(0.5, `hsla(290, 100%, 40%, 0.03)`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.globalCompositeOperation = 'lighter';

            // Draw rings
            rings.forEach(r => {
                r.update(canvas.width, canvas.height, { x: mx, y: my });
                r.draw(ctx, tick);
            });

            // Draw waves with 4-way symmetry
            waves.forEach(w => {
                w.update(canvas.width, canvas.height, { x: mx, y: my }, tick);
                w.draw(ctx);

                // Mirror symmetry for psychedelic kaleidoscope
                const segments = 4;
                for (let i = 1; i < segments; i++) {
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate((Math.PI * 2 / segments) * i);
                    ctx.translate(-cx, -cy);
                    w.draw(ctx);
                    ctx.restore();
                }
            });

            ctx.globalCompositeOperation = 'source-over';

            animationFrameId = requestAnimationFrame(render);
        };

        const handleResize = () => init();
        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isMobile]);

    if (isMobile) {
        return (
            <div style={{
                position: 'fixed',
                top: 0, left: 0,
                width: '100%', height: '100%',
                zIndex: 0,
                background: 'radial-gradient(ellipse at center, #1a002e 0%, #0d0015 40%, #020005 100%)',
                pointerEvents: 'none'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '300px', height: '300px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(191,0,255,0.2) 0%, rgba(139,0,255,0.1) 40%, transparent 70%)',
                    animation: 'psychPulse 3s ease-in-out infinite',
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
                background: '#05000f'
            }}
        />
    );
};

export default PsychedelicBackground;
