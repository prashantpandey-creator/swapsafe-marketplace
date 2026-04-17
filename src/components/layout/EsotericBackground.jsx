import React, { useRef, useEffect, useState } from 'react';

const EsotericBackground = () => {
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

        // Resize canvas
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Colors
        const saffron = '#FF9933';
        const sacredRed = '#DC143C';
        const golden = '#FFD700';
        const deepOrange = '#FF6B35';

        // Draw Om symbol (ॐ)
        const drawOm = (ctx, x, y, size, alpha, rotation) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);

            ctx.strokeStyle = saffron;
            ctx.lineWidth = size * 0.08;
            ctx.shadowColor = saffron;
            ctx.shadowBlur = 15;
            ctx.globalAlpha = alpha;

            const scale = size / 100;

            // Draw simplified Om using arcs and curves
            ctx.beginPath();

            // Top curve (ChandraBindu)
            ctx.arc(20 * scale, -30 * scale, 8 * scale, Math.PI, 0);
            ctx.stroke();

            // Main body curves
            ctx.beginPath();
            ctx.arc(0, 0, 25 * scale, Math.PI * 0.8, Math.PI * 0.2, true);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(-5 * scale, 15 * scale, 20 * scale, Math.PI * 1.3, Math.PI * 0.5, true);
            ctx.stroke();

            // Bottom curve
            ctx.beginPath();
            ctx.moveTo(-15 * scale, 35 * scale);
            ctx.quadraticCurveTo(0, 45 * scale, 15 * scale, 35 * scale);
            ctx.stroke();

            ctx.restore();
        };

        // Interactive Lotus Flower
        class LotusFlower {
            constructor() {
                this.petals = [];
                this.petalCount = 32;
                this.layers = 5;
                this.mouseX = 0;
                this.mouseY = 0;
                this.initializePetals();
            }

            initializePetals() {
                this.petals = [];
                for (let layer = 0; layer < this.layers; layer++) {
                    const layerPetals = [];
                    const petalsInLayer = this.petalCount - layer * 4;

                    for (let i = 0; i < petalsInLayer; i++) {
                        layerPetals.push({
                            angle: (Math.PI * 2 / petalsInLayer) * i,
                            baseSize: 100 + layer * 40,
                            currentSize: 100 + layer * 40,
                            phase: Math.random() * Math.PI * 2,
                            layer: layer
                        });
                    }
                    this.petals.push(layerPetals);
                }
            }

            update(tick, cx, cy, mouseX, mouseY) {
                // Calculate mouse influence
                const dx = mouseX - cx;
                const dy = mouseY - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const mouseInfluence = Math.max(0, 1 - dist / 500);

                this.petals.forEach((layer, layerIndex) => {
                    layer.forEach(petal => {
                        // Breathing animation
                        const breath = Math.sin(tick * 0.02 + petal.phase) * 0.15;

                        // Mouse response - petals bloom toward mouse
                        const angleToMouse = Math.atan2(dy, dx);
                        const angleDiff = Math.atan2(
                            Math.sin(angleToMouse - petal.angle),
                            Math.cos(angleToMouse - petal.angle)
                        );

                        // Petals closer to mouse direction bloom more
                        const proximityEffect = Math.max(0, Math.cos(angleDiff)) * mouseInfluence * 0.5;

                        petal.currentSize = petal.baseSize * (1 + breath + proximityEffect);
                    });
                });
            }

            draw(ctx, cx, cy, tick) {
                this.petals.forEach((layer, layerIndex) => {
                    const rotation = tick * 0.0003 * (layerIndex % 2 === 0 ? 1 : -1);

                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(rotation);

                    layer.forEach(petal => {
                        ctx.save();
                        ctx.rotate(petal.angle);

                        const size = petal.currentSize;

                        // Lotus petal shape with gradient
                        ctx.beginPath();
                        ctx.moveTo(0, 0);

                        // Create elegant petal curve
                        const cp1x = size * 0.15;
                        const cp1y = -size * 0.2;
                        const endX = 0;
                        const endY = -size;
                        const cp2x = -size * 0.15;
                        const cp2y = -size * 0.2;

                        ctx.bezierCurveTo(cp1x, cp1y, endX, endY, 0, 0);
                        ctx.bezierCurveTo(cp2x, cp2y, endX, endY, 0, 0);

                        // Gradient fill based on layer depth
                        const hue = 30 + layerIndex * 5; // Saffron to golden
                        const gradient = ctx.createRadialGradient(0, -size * 0.3, 0, 0, -size * 0.3, size);
                        gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${0.25 - layerIndex * 0.03})`);
                        gradient.addColorStop(0.5, `hsla(${hue + 10}, 90%, 60%, ${0.15 - layerIndex * 0.02})`);
                        gradient.addColorStop(1, 'transparent');

                        ctx.fillStyle = gradient;
                        ctx.fill();

                        // Petal outline
                        ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${0.3 - layerIndex * 0.04})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();

                        ctx.restore();
                    });

                    ctx.restore();
                });

                // Center bindu
                const binduSize = 8 + Math.sin(tick * 0.04) * 2;
                const binduGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, binduSize);
                binduGradient.addColorStop(0, `rgba(255, 215, 0, ${0.8 + Math.sin(tick * 0.03) * 0.2})`);
                binduGradient.addColorStop(0.5, 'rgba(255, 153, 51, 0.4)');
                binduGradient.addColorStop(1, 'transparent');

                ctx.beginPath();
                ctx.arc(cx, cy, binduSize, 0, Math.PI * 2);
                ctx.fillStyle = binduGradient;
                ctx.shadowBlur = 20;
                ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        // Sparkles
        class Sparkle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = 1 + Math.random() * 2;
                this.life = 0;
                this.maxLife = 100 + Math.random() * 150;
                this.phase = Math.random() * Math.PI * 2;

                const colors = [saffron, sacredRed, golden, deepOrange];
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = -0.5 - Math.random() * 0.5;
            }

            update(mouseX, mouseY) {
                this.life++;

                // Drift upward with sparkle effect
                this.x += this.vx + Math.sin(this.life * 0.05 + this.phase) * 0.5;
                this.y += this.vy;

                // Mouse attraction
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 200) {
                    const force = (200 - dist) / 200;
                    this.vx += (dx / dist) * force * 0.02;
                    this.vy += (dy / dist) * force * 0.02;
                }

                if (this.life > this.maxLife || this.y < 0) {
                    this.reset();
                    this.y = canvas.height + 10;
                }
            }

            draw(ctx) {
                const alpha = Math.min(1, this.life / 20) * Math.max(0, 1 - this.life / this.maxLife);
                const twinkle = 0.5 + Math.sin(this.life * 0.1 + this.phase) * 0.5;

                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * twinkle, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = alpha * 0.8;
                ctx.shadowBlur = 8;
                ctx.shadowColor = this.color;
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            }
        }

        // Initialize
        const lotus = new LotusFlower();
        const sparkles = [];
        const SPARKLE_COUNT = 80;

        for (let i = 0; i < SPARKLE_COUNT; i++) {
            sparkles.push(new Sparkle());
        }

        // Mouse tracking
        let mouseX = canvas.width / 2;
        let mouseY = canvas.height / 2;

        const handleMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Main render loop
        const render = () => {
            if (!isRunning || !canvas) return;

            tick++;

            // Clear with fade effect
            ctx.fillStyle = 'rgba(10, 5, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            // Draw sparkles
            sparkles.forEach(sparkle => {
                sparkle.update(mouseX, mouseY);
                sparkle.draw(ctx);
            });

            // Draw lotus flower (mouse-interactive)
            lotus.update(tick, cx, cy, mouseX, mouseY);
            lotus.draw(ctx, cx, cy, tick);

            // Draw rotating Om symbols in corners
            const positions = [
                { x: canvas.width * 0.15, y: canvas.height * 0.15 },
                { x: canvas.width * 0.85, y: canvas.height * 0.15 },
                { x: canvas.width * 0.15, y: canvas.height * 0.85 },
                { x: canvas.width * 0.85, y: canvas.height * 0.85 }
            ];

            positions.forEach((pos, index) => {
                const omSize = 80 + Math.sin(tick * 0.03 + index) * 10;
                const omRotation = tick * 0.001 * (index % 2 === 0 ? 1 : -1);
                const omAlpha = 0.3 + Math.sin(tick * 0.02 + index) * 0.15;
                drawOm(ctx, pos.x, pos.y, omSize, omAlpha, omRotation);
            });

            // Central Om (largest, slowest)
            const centralOmSize = 150 + Math.sin(tick * 0.02) * 20;
            const centralOmRotation = tick * -0.0003;
            drawOm(ctx, cx, cy, centralOmSize, 0.5, centralOmRotation);

            // Radial glow
            const glowSize = 200 + Math.sin(tick * 0.015) * 50;
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize);
            gradient.addColorStop(0, `rgba(255, 153, 51, ${0.08 + Math.sin(tick * 0.02) * 0.03})`);
            gradient.addColorStop(0.5, 'rgba(220, 20, 60, 0.03)');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            isRunning = false;
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
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
                background: 'radial-gradient(ellipse at center, #1a0500 0%, #0a0200 40%, #000000 100%)',
                pointerEvents: 'none'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '300px', height: '300px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,153,51,0.2) 0%, rgba(220,20,60,0.1) 40%, transparent 70%)',
                    animation: 'esotericPulse 3s ease-in-out infinite',
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
                background: '#050200'
            }}
        />
    );
};

export default EsotericBackground;
