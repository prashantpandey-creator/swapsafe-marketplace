import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

/**
 * ConsciousEnergy - An interactive metaball canvas effect
 * Creates a sentient, viscous flame-like energy that trails the mouse cursor
 * with heavy, delayed resistance. Uses a gooey metaball algorithm for seamless merging.
 */
const ConsciousEnergy = () => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', {
            alpha: true,
            willReadFrequently: true // Required for pixel manipulation
        });

        // Configuration for the conscious energy effect
        const config = {
            numBlobs: 8,                    // Number of metaball blobs
            blobRadiusMin: 30,              // Minimum blob radius
            blobRadiusMax: 80,              // Maximum blob radius
            viscosity: 0.03,                // How slowly blobs follow (lower = more viscous)
            mouseInfluence: 0.15,           // How strongly mouse affects the core
            threshold: 0.5,                 // Metaball threshold for merging
            pulseSpeed: 0.002,              // Speed of organic pulsing
            colorCycle: 0.0003,             // Color cycling speed
            glowLayers: 4,                  // Number of glow passes
        };

        // Deep void background color
        const voidColor = { r: 2, g: 2, b: 8 };

        // Color palette for the conscious energy (ethereal purples, cyans, deep magentas)
        const colorPalette = [
            { r: 120, g: 50, b: 200 },   // Deep violet
            { r: 60, g: 180, b: 220 },   // Ethereal cyan
            { r: 180, g: 60, b: 180 },   // Magenta
            { r: 40, g: 100, b: 180 },   // Deep blue
            { r: 150, g: 80, b: 220 },   // Purple
        ];

        // Metaball class - each blob has position, velocity, and organic behavior
        class MetaBlob {
            constructor(centerX, centerY, index, total) {
                this.index = index;

                // Distribute blobs in a circular pattern around center
                const angle = (index / total) * Math.PI * 2;
                const distanceFromCenter = 50 + Math.random() * 80;

                this.x = centerX + Math.cos(angle) * distanceFromCenter;
                this.y = centerY + Math.sin(angle) * distanceFromCenter;
                this.targetX = this.x;
                this.targetY = this.y;

                // Base properties
                this.baseRadius = config.blobRadiusMin + Math.random() * (config.blobRadiusMax - config.blobRadiusMin);
                this.radius = this.baseRadius;

                // Movement properties
                this.velocityX = 0;
                this.velocityY = 0;
                this.orbitAngle = angle;
                this.orbitSpeed = 0.0005 + Math.random() * 0.001;
                this.orbitRadius = 60 + Math.random() * 40;

                // Organic pulsing
                this.pulseOffset = Math.random() * Math.PI * 2;
                this.pulseAmplitude = 0.15 + Math.random() * 0.15;

                // Viscosity variance - some blobs are more "sticky" than others
                this.viscosity = config.viscosity * (0.5 + Math.random() * 1.0);

                // Color assignment
                this.colorIndex = index % colorPalette.length;
            }

            update(time, mouseX, mouseY, centerX, centerY) {
                // Calculate orbit target around mouse position
                this.orbitAngle += this.orbitSpeed;

                // Blend between center and mouse position based on distance
                const mouseDist = Math.hypot(mouseX - centerX, mouseY - centerY);
                const maxDist = Math.min(canvas.width, canvas.height) * 0.4;
                const mouseWeight = Math.min(mouseDist / maxDist, 1) * config.mouseInfluence;

                const anchorX = centerX + (mouseX - centerX) * mouseWeight * (1 + this.index * 0.1);
                const anchorY = centerY + (mouseY - centerY) * mouseWeight * (1 + this.index * 0.1);

                // Add orbital motion
                const orbitX = Math.cos(this.orbitAngle + this.index) * this.orbitRadius;
                const orbitY = Math.sin(this.orbitAngle + this.index * 1.3) * this.orbitRadius * 0.7;

                this.targetX = anchorX + orbitX;
                this.targetY = anchorY + orbitY;

                // Viscous following - heavy, delayed movement
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;

                // Apply viscous damping
                this.velocityX += dx * this.viscosity;
                this.velocityY += dy * this.viscosity;

                // Dampen velocity for fluid, heavy feel
                this.velocityX *= 0.92;
                this.velocityY *= 0.92;

                this.x += this.velocityX;
                this.y += this.velocityY;

                // Organic pulsing radius
                const pulse = Math.sin(time * config.pulseSpeed + this.pulseOffset);
                const breathe = Math.sin(time * config.pulseSpeed * 0.5 + this.pulseOffset * 2);
                this.radius = this.baseRadius * (1 + pulse * this.pulseAmplitude + breathe * 0.05);
            }
        }

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Mouse tracking with interpolation
        const handleMouseMove = (e) => {
            mouseRef.current.targetX = e.clientX;
            mouseRef.current.targetY = e.clientY;
        };

        const handleTouchMove = (e) => {
            if (e.touches.length > 0) {
                mouseRef.current.targetX = e.touches[0].clientX;
                mouseRef.current.targetY = e.touches[0].clientY;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);

        // Initialize at center
        mouseRef.current.x = window.innerWidth / 2;
        mouseRef.current.y = window.innerHeight / 2;
        mouseRef.current.targetX = mouseRef.current.x;
        mouseRef.current.targetY = mouseRef.current.y;

        // Create metablobs
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        let blobs = [];
        for (let i = 0; i < config.numBlobs; i++) {
            blobs.push(new MetaBlob(centerX, centerY, i, config.numBlobs));
        }

        // Create offscreen canvas for metaball rendering
        const offCanvas = document.createElement('canvas');
        const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

        // Calculate metaball field value at a point
        const getMetaballValue = (px, py, blobs) => {
            let sum = 0;
            for (const blob of blobs) {
                const dx = px - blob.x;
                const dy = py - blob.y;
                const distSq = dx * dx + dy * dy;
                // Metaball function: r² / d²
                sum += (blob.radius * blob.radius) / (distSq + 1);
            }
            return sum;
        };

        // Get interpolated color based on which blobs contribute most
        const getBlendedColor = (px, py, blobs, time) => {
            let totalWeight = 0;
            let r = 0, g = 0, b = 0;

            for (const blob of blobs) {
                const dx = px - blob.x;
                const dy = py - blob.y;
                const distSq = dx * dx + dy * dy;
                const weight = (blob.radius * blob.radius) / (distSq + 1);

                const color = colorPalette[blob.colorIndex];
                r += color.r * weight;
                g += color.g * weight;
                b += color.b * weight;
                totalWeight += weight;
            }

            if (totalWeight > 0) {
                r /= totalWeight;
                g /= totalWeight;
                b /= totalWeight;
            }

            // Add subtle color cycling
            const cycle = Math.sin(time * config.colorCycle) * 0.15 + 0.85;

            return {
                r: Math.min(255, r * cycle),
                g: Math.min(255, g * cycle),
                b: Math.min(255, b * cycle)
            };
        };

        let time = 0;

        // Main render function using software metaball rendering
        const render = () => {
            // Smooth mouse interpolation
            mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
            mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            // Update all blobs
            for (const blob of blobs) {
                blob.update(time, mouseRef.current.x, mouseRef.current.y, centerX, centerY);
            }

            // Clear with void color and slight trail effect
            ctx.fillStyle = `rgba(${voidColor.r}, ${voidColor.g}, ${voidColor.b}, 0.25)`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Calculate bounds for rendering (optimization)
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            for (const blob of blobs) {
                minX = Math.min(minX, blob.x - blob.radius * 3);
                maxX = Math.max(maxX, blob.x + blob.radius * 3);
                minY = Math.min(minY, blob.y - blob.radius * 3);
                maxY = Math.max(maxY, blob.y + blob.radius * 3);
            }

            // Clamp to canvas
            minX = Math.max(0, Math.floor(minX));
            maxX = Math.min(canvas.width, Math.ceil(maxX));
            minY = Math.max(0, Math.floor(minY));
            maxY = Math.min(canvas.height, Math.ceil(maxY));

            const renderWidth = maxX - minX;
            const renderHeight = maxY - minY;

            if (renderWidth > 0 && renderHeight > 0) {
                // Resize offscreen canvas for render region
                offCanvas.width = renderWidth;
                offCanvas.height = renderHeight;

                const imageData = offCtx.createImageData(renderWidth, renderHeight);
                const data = imageData.data;

                // Resolution scaling for performance
                const step = 2;

                for (let y = 0; y < renderHeight; y += step) {
                    for (let x = 0; x < renderWidth; x += step) {
                        const px = minX + x;
                        const py = minY + y;

                        const value = getMetaballValue(px, py, blobs);

                        if (value > config.threshold) {
                            const color = getBlendedColor(px, py, blobs, time);

                            // Apply intensity based on metaball value
                            const intensity = Math.min(1, (value - config.threshold) * 2);
                            const alpha = intensity * 255;

                            // Fill the stepped pixels
                            for (let dy = 0; dy < step && y + dy < renderHeight; dy++) {
                                for (let dx = 0; dx < step && x + dx < renderWidth; dx++) {
                                    const idx = ((y + dy) * renderWidth + (x + dx)) * 4;
                                    data[idx] = color.r * intensity;
                                    data[idx + 1] = color.g * intensity;
                                    data[idx + 2] = color.b * intensity;
                                    data[idx + 3] = alpha;
                                }
                            }
                        }
                    }
                }

                offCtx.putImageData(imageData, 0, 0);

                // Draw glow layers
                ctx.save();
                for (let i = config.glowLayers; i > 0; i--) {
                    const scale = 1 + i * 0.08;
                    const alpha = 0.15 / i;
                    ctx.globalAlpha = alpha;
                    ctx.filter = `blur(${i * 6}px)`;
                    ctx.drawImage(
                        offCanvas,
                        minX - (renderWidth * (scale - 1)) / 2,
                        minY - (renderHeight * (scale - 1)) / 2,
                        renderWidth * scale,
                        renderHeight * scale
                    );
                }
                ctx.restore();

                // Draw main layer with slight blur for gooey feel
                ctx.save();
                ctx.filter = 'blur(2px)';
                ctx.drawImage(offCanvas, minX, minY);
                ctx.restore();

                // Draw sharp core
                ctx.globalAlpha = 0.8;
                ctx.drawImage(offCanvas, minX, minY);
                ctx.globalAlpha = 1;
            }

            // Add inner core glow at center of mass
            let comX = 0, comY = 0;
            for (const blob of blobs) {
                comX += blob.x;
                comY += blob.y;
            }
            comX /= blobs.length;
            comY /= blobs.length;

            // Pulsing inner core
            const corePulse = Math.sin(time * 0.003) * 0.3 + 0.7;
            const coreRadius = 20 + corePulse * 15;

            const coreGradient = ctx.createRadialGradient(
                comX, comY, 0,
                comX, comY, coreRadius * 2
            );
            coreGradient.addColorStop(0, `rgba(255, 220, 255, ${0.4 * corePulse})`);
            coreGradient.addColorStop(0.3, `rgba(180, 120, 220, ${0.2 * corePulse})`);
            coreGradient.addColorStop(1, 'rgba(100, 50, 150, 0)');

            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(comX, comY, coreRadius * 2, 0, Math.PI * 2);
            ctx.fill();

            time++;
            animationRef.current = requestAnimationFrame(render);
        };

        // Start animation after brief delay
        setTimeout(() => {
            setIsLoaded(true);
            render();
        }, 100);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
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
                background: 'rgb(2, 2, 8)',
                pointerEvents: 'none'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{
                duration: 2.0,
                ease: "easeInOut"
            }}
        />
    );
};

export default ConsciousEnergy;
