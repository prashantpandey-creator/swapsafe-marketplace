import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * SpiralBackground - Sacred Swastika Pattern
 * 
 * Simple, performant sacred geometry pattern.
 * Four arms with gentle rotation and mystical glow.
 */
const SpiralBackground = () => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        let time = 0;

        const render = () => {
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            // Clear
            ctx.fillStyle = 'rgba(10, 10, 26, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const rotation = time * 0.0002;
            const armLength = Math.min(canvas.width, canvas.height) * 0.15;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rotation);

            // Draw 4 swastika arms
            for (let i = 0; i < 4; i++) {
                ctx.save();
                ctx.rotate((i / 4) * Math.PI * 2);

                // Main arm
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(armLength, 0);
                ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Bent part
                ctx.translate(armLength, 0);
                ctx.rotate(-Math.PI / 2);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(armLength * 0.6, 0);
                ctx.stroke();

                ctx.restore();
            }

            ctx.restore();

            // Central glow
            const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100);
            glow.addColorStop(0, 'rgba(212, 175, 55, 0.3)');
            glow.addColorStop(1, 'rgba(10, 10, 26, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, cy, 100, 0, Math.PI * 2);
            ctx.fill();

            time++;
            animationRef.current = requestAnimationFrame(render);
        };

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
            transition={{ duration: 2, ease: "easeOut" }}
        />
    );
};

export default SpiralBackground;
