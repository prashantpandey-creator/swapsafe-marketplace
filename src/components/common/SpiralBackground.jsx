import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * SpiralBackground - Sacred Geometry Effect
 * 
 * Ancient mysteries of Egypt and India come alive.
 * Evolving sacred patterns emanate viscously from the center.
 * Golden spirals, lotus mandalas, and cosmic energy.
 */
const SpiralBackground = () => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Sacred colors - Gold, Deep Purple, Cosmic Blue
        const colors = {
            gold: '#D4AF37',
            amber: '#FFBF00',
            deepPurple: '#1a0a2e',
            cosmicBlue: '#0a0a1a',
            violet: '#4a1a6b',
            sacred: '#8B6914',
        };

        // Resize
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        let time = 0;

        // Golden ratio constant
        const PHI = 1.618033988749;

        // Draw a sacred spiral arm
        const drawSpiralArm = (cx, cy, startAngle, progress, hue) => {
            ctx.beginPath();
            const maxR = Math.min(canvas.width, canvas.height) * 0.45;

            for (let t = 0; t < progress * 8; t += 0.02) {
                // Golden spiral: r = a * e^(b*theta)
                const r = 5 * Math.pow(PHI, t * 0.3);
                if (r > maxR) break;

                const angle = startAngle + t;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;

                if (t === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            const alpha = 0.15 + Math.sin(time * 0.001 + startAngle) * 0.1;
            ctx.strokeStyle = `hsla(${hue}, 70%, 50%, ${alpha})`;
            ctx.lineWidth = 1.5 + Math.sin(time * 0.002) * 0.5;
            ctx.stroke();
        };

        // Draw mandala ring
        const drawMandalaRing = (cx, cy, radius, petals, rotation, alpha) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rotation);

            for (let i = 0; i < petals; i++) {
                const angle = (i / petals) * Math.PI * 2;
                ctx.save();
                ctx.rotate(angle);

                // Lotus petal shape
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(radius * 0.3, -radius * 0.15, radius, 0);
                ctx.quadraticCurveTo(radius * 0.3, radius * 0.15, 0, 0);

                const gradient = ctx.createLinearGradient(0, 0, radius, 0);
                gradient.addColorStop(0, `rgba(212, 175, 55, ${alpha * 0.8})`);
                gradient.addColorStop(0.5, `rgba(255, 191, 0, ${alpha * 0.4})`);
                gradient.addColorStop(1, `rgba(139, 105, 20, 0)`);

                ctx.fillStyle = gradient;
                ctx.fill();

                ctx.restore();
            }

            ctx.restore();
        };

        // Draw Eye of Providence / Horus inspired center
        const drawSacredEye = (cx, cy, size, pulse) => {
            // Outer glow
            const outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 2);
            outerGlow.addColorStop(0, `rgba(212, 175, 55, ${0.3 * pulse})`);
            outerGlow.addColorStop(0.3, `rgba(139, 105, 20, ${0.15 * pulse})`);
            outerGlow.addColorStop(1, 'rgba(10, 10, 26, 0)');

            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(cx, cy, size * 2, 0, Math.PI * 2);
            ctx.fill();

            // Inner eye shape
            ctx.save();
            ctx.translate(cx, cy);

            // Eye outline
            ctx.beginPath();
            ctx.ellipse(0, 0, size, size * 0.5, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(212, 175, 55, ${0.5 * pulse})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Pupil
            const pupilGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.25);
            pupilGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * pulse})`);
            pupilGrad.addColorStop(0.3, `rgba(212, 175, 55, ${0.7 * pulse})`);
            pupilGrad.addColorStop(1, `rgba(74, 26, 107, ${0.5 * pulse})`);

            ctx.beginPath();
            ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
            ctx.fillStyle = pupilGrad;
            ctx.fill();

            ctx.restore();
        };

        // Draw sacred triangles (pyramids)
        const drawSacredTriangles = (cx, cy, size, rotation, alpha) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rotation);

            // Upward triangle
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.lineTo(-size * 0.866, size * 0.5);
            ctx.lineTo(size * 0.866, size * 0.5);
            ctx.closePath();
            ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Downward triangle (interlocked - Star of David / Merkaba)
            ctx.rotate(Math.PI);
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.7);
            ctx.lineTo(-size * 0.6, size * 0.35);
            ctx.lineTo(size * 0.6, size * 0.35);
            ctx.closePath();
            ctx.strokeStyle = `rgba(139, 105, 20, ${alpha * 0.7})`;
            ctx.stroke();

            ctx.restore();
        };

        // Animation loop
        const render = () => {
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            // Clear with deep cosmic void (slight trail for viscous feel)
            ctx.fillStyle = 'rgba(10, 10, 26, 0.08)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Viscous evolution from center
            const evolution = (Math.sin(time * 0.0005) + 1) / 2; // 0-1 breathing
            const slowRotation = time * 0.0001;

            // Layer 1: Outermost golden spirals (8 arms)
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + slowRotation;
                drawSpiralArm(cx, cy, angle, 0.8 + evolution * 0.2, 45 + i * 5);
            }

            // Layer 2: Mandala rings (expanding from center)
            const ringCount = 5;
            for (let r = 0; r < ringCount; r++) {
                const baseRadius = 40 + r * 60;
                const breathe = Math.sin(time * 0.001 + r * 0.5) * 10;
                const radius = baseRadius + breathe;
                const petals = 8 + r * 4;
                const ringRotation = slowRotation * (r % 2 === 0 ? 1 : -1) * (1 + r * 0.2);
                const alpha = 0.15 - r * 0.02;

                drawMandalaRing(cx, cy, radius, petals, ringRotation, alpha);
            }

            // Layer 3: Sacred triangles / Pyramids
            const trianglePulse = Math.sin(time * 0.0015) * 0.3 + 0.5;
            drawSacredTriangles(cx, cy, 80, slowRotation * 0.5, trianglePulse * 0.3);
            drawSacredTriangles(cx, cy, 150, -slowRotation * 0.3, trianglePulse * 0.2);
            drawSacredTriangles(cx, cy, 250, slowRotation * 0.2, trianglePulse * 0.1);

            // Layer 4: The Sacred Eye at center
            const eyePulse = Math.sin(time * 0.002) * 0.3 + 0.7;
            drawSacredEye(cx, cy, 35, eyePulse);

            // Layer 5: Particle dust (subtle floating sacred symbols)
            const particleCount = 30;
            for (let i = 0; i < particleCount; i++) {
                const seed = i * 137.5; // Golden angle distribution
                const dist = 100 + (Math.sin(time * 0.0003 + seed) + 1) * 200;
                const angle = seed + time * 0.00005 * (i % 2 === 0 ? 1 : -1);
                const px = cx + Math.cos(angle) * dist;
                const py = cy + Math.sin(angle) * dist;
                const size = 1 + Math.sin(time * 0.002 + i) * 0.5;
                const alpha = 0.2 + Math.sin(time * 0.001 + i * 0.5) * 0.15;

                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(212, 175, 55, ${alpha})`;
                ctx.fill();
            }

            time++;
            animationRef.current = requestAnimationFrame(render);
        };

        // Start
        setTimeout(() => {
            setIsLoaded(true);
            render();
        }, 50);

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <motion.canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full"
            style={{
                zIndex: 0,
                background: 'rgb(10, 10, 26)',
                pointerEvents: 'none'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{
                duration: 2,
                ease: "easeOut"
            }}
        />
    );
};

export default SpiralBackground;
