import React, { useRef, useEffect } from 'react';

const InteractiveMandala = ({ variant = 'home' }) => {
    const canvasRef = useRef(null);
    const isAuto = useRef(true); // Start in autopilot mode

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        let particles = [];
        let tick = 0;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const handleMouseMove = (e) => {
            isAuto.current = false; // User took control
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        // Add touch support for "taking control" on mobile tap
        window.addEventListener('touchstart', (e) => {
            isAuto.current = false;
            mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        });

        handleResize();

        // PARTICLE SYSTEM (Class definitions omitted for brevity, implied same)
        // ... (Keep existing Particle class)

        const drawMandala = () => {
            tick++;

            const { width, height } = canvas;
            const cx = width / 2;
            const cy = height / 2;

            // AUTOPILOT LOGIC
            if (isAuto.current) {
                // Lissajous figure for organic wandering
                const time = tick * 0.005;
                const radiusX = width * 0.3;
                const radiusY = height * 0.3;

                mouseRef.current = {
                    x: cx + Math.sin(time) * radiusX,
                    y: cy + Math.cos(time * 1.5) * radiusY
                };
            }

            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;
            constructor(x, y, angle, speed) {
                this.x = x;
                this.y = y;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                this.age = 0;
                this.life = 400 + Math.random() * 200; // Lives long enough to reach edge
            }

            update(mouse) {
                this.x += this.vx;
                this.y += this.vy;
                this.age++;

                // Slight "attraction" to mouse? 
                // Or "steering" towards mouse
                // Let's make it subtle: gravity well
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.hypot(dx, dy);

                if (dist > 50) {
                    this.vx += (dx / dist) * 0.005;
                    this.vy += (dy / dist) * 0.005;
                }
            }

            draw(ctx) {
                const alpha = Math.max(0, 1 - (this.age / this.life));
                ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const drawMandala = () => {
            tick++;

            const { width, height } = canvas;
            const cx = width / 2;
            const cy = height / 2;
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;

            // Clear trails
            ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
            ctx.fillRect(0, 0, width, height);

            // --- SPAWN NEW PARTICLES ---
            // Slowly and deliberately
            if (tick % 5 === 0) { // Every 5 frames
                const spawnCount = 4;
                for (let i = 0; i < spawnCount; i++) {
                    // Bias angle towards mouse?
                    const angleToMouse = Math.atan2(my - cy, mx - cx);
                    // Random angle but weighted? No, let's do full spread
                    // But maybe faster towards mouse

                    const angle = (Math.random() * Math.PI * 2);
                    const speed = 0.5 + Math.random() * 0.5;

                    // If angle is close to mouse angle, boost speed?
                    const angleDiff = Math.abs(angle - angleToMouse);
                    let finalSpeed = speed;
                    if (angleDiff < 1) finalSpeed += 1; // Faster towards mouse

                    particles.push(new Particle(cx, cy, angle, finalSpeed));
                }
            }

            // --- UPDATE & DRAW & CONNECT ---
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.15)';
            ctx.lineWidth = 1;

            // Spatial Partitioning (Grid) for performance? 
            // Naive N^2 is fine for < 300 particles
            if (particles.length > 500) particles.shift(); // Cap count

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.update({ x: mx, y: my });

                // Draw Connections (The "Connected" part)
                // Connect to neighbors close by
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < 6000) { // ~80px max dist
                        const alpha = 1 - (distSq / 6000);

                        // Color based on distance to center (Rainbow Web)
                        const distToCenter = Math.hypot(p.x - cx, p.y - cy);
                        const hue = (tick * 0.5 + distToCenter * 0.5) % 360;

                        ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha * 0.3})`;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }

                if (p.age > p.life) {
                    particles.splice(i, 1);
                    i--;
                } else {
                    p.draw(ctx);
                }
            }

            // --- CENTER GLOW ---
            ctx.beginPath();
            ctx.arc(cx, cy, 10 + Math.sin(tick * 0.1) * 5, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(35, 100%, 70%, 0.8)`;
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'orange';
            ctx.fill();
            ctx.shadowBlur = 0;

            animationFrameId = requestAnimationFrame(drawMandala);
        };

        drawMandala();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [variant]); // Re-run effect if variant changes

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
