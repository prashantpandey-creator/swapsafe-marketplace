import React, { useRef, useEffect, useState } from 'react';

// Reference: Twin Peaks Red Room 3D model (Sketchfab 46430c73087e4951a6bdf2f4bd3305f4)
// Key visual facts extracted from the model thumbnail:
//   - Curtains: dense fine pleats, saturated crimson-red, fill back wall + left + right sides
//   - Floor: bold black-and-white zigzag CHEVRON (not diagonal checker) in one-point perspective
//   - Lighting: cool-neutral, slight blue cast, chromatic aberration (RGB split) effect
//   - Mood: theatrical, bright, uncanny

const C = {
    curtain: {
        // Side curtain panels: left 0..sideW, right (w-sideW)..w
        // Back wall: fills sideW..(w-sideW), top 0..backH
        sideWidthRatio: 0.22,   // each side panel
        backHeightRatio: 0.72,  // back curtain fills top 72% of canvas
        foldCount: 32,          // dense fine pleats
        strandCount: 80,
        speed: 0.3,             // sway speed (per frame at 60fps)
        // Colors — all saturated crimson
        base:      [210, 30, 28],
        lit:       [245, 60, 48],   // bright ridge highlights
        shadow:    [65,  6,  6],    // deep valley shadow
        dark:      [10,  0,  0],    // solid backing
        highlight: [255, 100, 80],  // specular peak on ridge
    },
    floor: {
        startYRatio: 0.58,   // horizon
        // Zigzag chevron: pure black-and-white, high contrast
        white: [238, 235, 230],
        black: [18,  16,  18],
        COLS: 10,    // chevron columns across floor width
        ROWS: 14,    // row bands from horizon to bottom
    },
    // Cool neutral ambient — slight blue cast as in the model
    blueLight: { r: 110, g: 145, b: 220 },
    vignette:  { opacity: 0.72 },  // strong corner darkening so UI text is readable
};

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

// ---------------------------------------------------------------------------
// CURTAIN SIDE PANEL  (dir=+1 → left panel, dir=-1 → right panel)
// ---------------------------------------------------------------------------
function drawSideCurtain(ctx, w, h, tick, edgeX, panelW, dir) {
    const { foldCount, strandCount, speed } = C.curtain;
    const spd = speed / 60;

    // Solid dark backing
    const [dk, dg, db] = C.curtain.dark;
    ctx.fillStyle = `rgb(${dk},${dg},${db})`;
    ctx.fillRect(dir === 1 ? edgeX : edgeX - panelW, 0, panelW, h);

    // Folds drawn back-to-front (outermost first)
    for (let fold = foldCount - 1; fold >= 0; fold--) {
        const t  = fold / foldCount;
        const fx = edgeX + (t * panelW * 0.95) * dir;
        const phase = fold * 0.8 + tick * spd;

        ctx.beginPath();
        ctx.moveTo(fx, 0);
        for (let y = 0; y <= h; y += 3) {
            const af = y / h;
            const sway   = Math.sin(y * 0.006 + phase)               * (2  + af * 16);
            const billow = Math.sin(y * 0.002 + tick * spd * 0.35 + fold * 0.25) * (3  + af * 24);
            const micro  = Math.sin(y * 0.016 + tick * spd * 1.1 + fold * 0.6)  * (0.8 * af);
            ctx.lineTo(fx + (sway + billow + micro) * dir, y);
        }
        const fw = (panelW / foldCount) * 1.18;
        ctx.lineTo(fx + fw * dir, h);
        ctx.lineTo(fx + fw * dir, 0);
        ctx.closePath();

        // Gradient: bright lit edge → base → shadow valley
        const g = ctx.createLinearGradient(fx, 0, fx + fw * dir, 0);
        const litBoost = fold === foldCount - 1 ? 1.3 : 1.0; // innermost fold brightest
        const [br, bg, bb] = C.curtain.base;
        const [lr, lg, lb] = C.curtain.lit;
        const [sr, sg, sb] = C.curtain.shadow;
        const [hr, hg, hb] = C.curtain.highlight;

        const hA = 1.0;
        const mA = Math.min(1, (0.95 + t * 0.05) * litBoost);
        const sA = 0.90;

        g.addColorStop(0,    `rgba(${clamp(hr)},${clamp(hg)},${clamp(hb)},${hA})`);
        g.addColorStop(0.08, `rgba(${clamp(lr)},${clamp(lg)},${clamp(lb)},${hA})`);
        g.addColorStop(0.30, `rgba(${clamp(br)},${clamp(bg)},${clamp(bb)},${mA})`);
        g.addColorStop(0.60, `rgba(${clamp(br - 30)},${clamp(bg - 4)},${clamp(bb - 4)},${mA})`);
        g.addColorStop(0.85, `rgba(${clamp(sr)},${clamp(sg)},${clamp(sb)},${sA})`);
        g.addColorStop(1,    `rgba(${clamp(sr - 8)},${clamp(sg)},${clamp(sb)},${sA})`);
        ctx.fillStyle = g;
        ctx.fill();
    }

    // Specular sweep — animated shimmer down velvet ridges
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const sweepY = (tick * 0.5 % (h * 1.5)) - h * 0.1;
    const sigma  = h * 0.20;
    for (let fold = 0; fold < foldCount; fold++) {
        const t  = fold / foldCount;
        const fx = edgeX + (t * panelW * 0.95) * dir;
        const fw = (panelW / foldCount) * 1.18;
        const ridgeX = fx + fw * 0.12 * dir;
        const sw = fw * 0.22;
        for (let y = 0; y <= h; y += 4) {
            const gAlpha = 0.50 * Math.exp(-((y - sweepY) ** 2) / (2 * sigma * sigma));
            if (gAlpha < 0.002) continue;
            const sg = ctx.createLinearGradient(ridgeX - sw * 0.5, 0, ridgeX + sw * 0.5, 0);
            sg.addColorStop(0,   'transparent');
            sg.addColorStop(0.5, `rgba(255,160,130,${gAlpha})`);
            sg.addColorStop(1,   'transparent');
            ctx.fillStyle = sg;
            ctx.fillRect(ridgeX - sw * 0.5, y, sw, 4);
        }
    }
    ctx.restore();

    // Dense velvet strand texture
    for (let s = 0; s < strandCount; s++) {
        const t  = s / strandCount;
        const sx = edgeX + (t * panelW * 0.97) * dir;
        const phase = s * 0.42 + tick * spd * 0.7;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        for (let y = 0; y <= h; y += 3) {
            const af = y / h;
            ctx.lineTo(sx + (Math.sin(y * 0.005 + phase) * (1.5 + af * 9) + Math.sin(y * 0.002 + tick * spd * 0.3) * (2 + af * 14)) * dir, y);
        }
        const cv = (s % 7) * 4;
        const [hr, hg, hb] = C.curtain.highlight;
        ctx.strokeStyle = `rgba(${clamp(hr - 15 + cv)},${hg},${hb},${0.05 + t * 0.12})`;
        ctx.lineWidth = 0.7 + (s % 3) * 0.3;
        ctx.stroke();
    }

    // Valance pelmet at top
    const vH = h * 0.10;
    ctx.beginPath();
    ctx.moveTo(dir === 1 ? edgeX : edgeX - panelW, 0);
    for (let x = 0; x <= panelW; x += 2) {
        const xPos = dir === 1 ? edgeX + x : edgeX - panelW + x;
        const droop = Math.sin((x / panelW) * Math.PI * 6 + tick * spd * 0.4) * vH * 0.16 + vH * 0.84;
        ctx.lineTo(xPos, droop);
    }
    ctx.lineTo(dir === 1 ? edgeX + panelW : edgeX, 0);
    ctx.closePath();
    const [br, bg, bb] = C.curtain.base;
    const [lr, lg, lb] = C.curtain.lit;
    const vg = ctx.createLinearGradient(dir === 1 ? edgeX : edgeX - panelW, 0, dir === 1 ? edgeX + panelW : edgeX, 0);
    vg.addColorStop(0,   `rgba(${lr},${lg},${lb},0.95)`);
    vg.addColorStop(0.5, `rgba(${br},${bg},${bb},0.92)`);
    vg.addColorStop(1,   `rgba(${C.curtain.dark[0]},${C.curtain.dark[1]},${C.curtain.dark[2]},1)`);
    ctx.fillStyle = vg;
    ctx.fill();

    // Inner edge glow
    const edgePts = [];
    for (let y = 0; y <= h; y += 2) {
        const af = y / h;
        edgePts.push({
            x: edgeX + (panelW + Math.sin(y * 0.007 + tick * spd) * (3 + af * 14) + Math.sin(y * 0.003 + tick * spd * 0.4) * (5 + af * 20)) * dir,
            y,
        });
    }
    ctx.beginPath();
    edgePts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = 'rgba(215,45,35,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(140,15,15,0.22)';
    ctx.lineWidth = 9;
    ctx.stroke();
}

// ---------------------------------------------------------------------------
// BACK WALL CURTAIN  — fills the center strip from y=0 to backH
// ---------------------------------------------------------------------------
function drawBackCurtain(ctx, w, h, tick, x0, x1, backH) {
    const panelW = x1 - x0;
    if (panelW <= 0 || backH <= 0) return;
    const { foldCount, speed } = C.curtain;
    const spd = speed / 60;

    // Backing
    const [dk, dg, db] = C.curtain.dark;
    ctx.fillStyle = `rgb(${dk},${dg},${db})`;
    ctx.fillRect(x0, 0, panelW, backH);

    // Fine folds across full back wall — subtle depth-axis sway only
    for (let fold = 0; fold < foldCount; fold++) {
        const t  = fold / foldCount;
        const fx = x0 + t * panelW;
        const fw = (panelW / foldCount) * 1.05;
        const phase = fold * 0.7 + tick * spd * 0.6;

        ctx.beginPath();
        ctx.moveTo(fx, 0);
        for (let y = 0; y <= backH; y += 3) {
            const af = y / backH;
            const sway = Math.sin(y * 0.004 + phase) * (1 + af * 4);
            ctx.lineTo(fx + sway, y);
        }
        ctx.lineTo(fx + fw, backH);
        ctx.lineTo(fx + fw, 0);
        ctx.closePath();

        const [br, bg, bb] = C.curtain.base;
        const [sr, sg, sb] = C.curtain.shadow;
        const [lr, lg, lb] = C.curtain.lit;

        // Lighting: brighter in center of back wall (facing the room light)
        const centerT = 1 - Math.abs(t - 0.5) * 2; // 1 at center, 0 at edges
        const litBoost = 0.85 + centerT * 0.35;

        const g = ctx.createLinearGradient(fx, 0, fx + fw, 0);
        g.addColorStop(0,    `rgba(${clamp(lr - 10)},${clamp(lg)},${clamp(lb)},1.0)`);
        g.addColorStop(0.25, `rgba(${clamp(br + 10)},${clamp(bg + 1)},${clamp(bb + 1)},${Math.min(1, 0.95 * litBoost)})`);
        g.addColorStop(0.55, `rgba(${clamp(br - 15)},${clamp(bg - 2)},${clamp(bb - 2)},${Math.min(1, 0.90 * litBoost)})`);
        g.addColorStop(0.80, `rgba(${clamp(sr + 8)},${sg},${sb},0.90)`);
        g.addColorStop(1,    `rgba(${sr},${sg},${sb},1.0)`);
        ctx.fillStyle = g;
        ctx.fill();
    }

    // Valance across back wall top
    const vH = backH * 0.08;
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    for (let x = 0; x <= panelW; x += 2) {
        const droop = Math.sin((x / panelW) * Math.PI * 10 + tick * spd * 0.3) * vH * 0.18 + vH * 0.82;
        ctx.lineTo(x0 + x, droop);
    }
    ctx.lineTo(x1, 0);
    ctx.closePath();
    const [lr, lg, lb] = C.curtain.lit;
    ctx.fillStyle = `rgba(${lr},${lg},${lb},0.92)`;
    ctx.fill();
}

// ---------------------------------------------------------------------------
// ZIGZAG CHEVRON FLOOR  — one-point perspective
// The zigzag pattern: each row band alternates black/white in a W/M shape.
// At the horizon all columns converge to vpX; at bottom they span full floor width.
// ---------------------------------------------------------------------------
function drawChevronFloor(ctx, w, h) {
    const cfg = C.floor;
    const floorY = h * cfg.startYRatio;
    const floorH  = h - floorY;
    if (floorH <= 0) return;

    const sideW   = w * C.curtain.sideWidthRatio;
    const floorX0 = sideW;
    const floorX1 = w - sideW;
    const floorW  = floorX1 - floorX0;

    const vpX = w / 2;
    const vpY = floorY;

    const COLS = cfg.COLS;   // number of zigzag columns (must be even)
    const ROWS = cfg.ROWS;

    const [wr, wg, wb] = cfg.white;
    const [kr, kg, kb] = cfg.black;

    // Map (colFrac 0..1, depth 0..1) → screen (x, y)
    const toX = (f, d) => vpX + (f - 0.5) * floorW * Math.max(d, 0.001);
    const toY = (d)    => vpY + d * floorH;

    // For each row and column, determine the chevron shape.
    // A chevron column at screen-space is split into two triangles (up-pointing and down-pointing)
    // Row parity determines which color is on top.
    for (let row = 0; row < ROWS; row++) {
        const dTop = row      / ROWS;
        const dBot = (row + 1) / ROWS;
        if (dBot <= 0 || dTop >= 1) continue;

        const yTop = toY(Math.max(0,   dTop));
        const yBot = toY(Math.min(1,   dBot));
        const yMid = (yTop + yBot) * 0.5;

        // Fog: near horizon fades out a bit
        const fogA = 0.55 + Math.min(1, dBot) * 0.45;

        for (let col = 0; col < COLS; col++) {
            const f0 = col       / COLS;
            const f1 = (col + 1) / COLS;
            const fm = (f0 + f1) * 0.5;  // midpoint for chevron tip

            // Four corners of this cell at top and bottom rows
            const x0t = toX(f0, dTop);
            const x1t = toX(f1, dTop);
            const x0b = toX(f0, dBot);
            const x1b = toX(f1, dBot);
            const xmt = toX(fm, dTop);   // top mid
            const xmb = toX(fm, dBot);   // bottom mid

            // Determine colors based on (row+col) parity
            // Upper triangle: tip points up (like /\)
            // Lower triangle: tip points down (like \/)
            const isEven = (row + col) % 2 === 0;
            const [upR, upG, upB] = isEven ? [wr, wg, wb] : [kr, kg, kb];
            const [dnR, dnG, dnB] = isEven ? [kr, kg, kb] : [wr, wg, wb];

            // Upper chevron: quadrilateral with a V-notch at the bottom
            // shape: x0t,yTop → x1t,yTop → xmb,yBot  (triangle pointing down into next row)
            // We draw as two triangles meeting at mid
            // Upper half (top of band): solid rectangle portion
            // Lower half: the zigzag teeth

            // Simple approach: split each cell into top-triangle and bottom-triangle
            // Upper triangle (occupies top half of row band)
            const yH = (yTop + yBot) * 0.5;

            // Upper sub-cell (from yTop to yH): upper color
            ctx.beginPath();
            ctx.moveTo(x0t, yTop);
            ctx.lineTo(x1t, yTop);
            ctx.lineTo(toX(f1, (dTop + dBot) * 0.5), yH);
            ctx.lineTo(toX(f0, (dTop + dBot) * 0.5), yH);
            ctx.closePath();
            ctx.fillStyle = `rgba(${upR},${upG},${upB},${fogA})`;
            ctx.fill();

            // Lower sub-cell: chevron (zigzag) shape
            // Up-pointing triangle: base at yH, tip at yTop-mid → creates the M/W pattern
            const xHm = toX(fm, (dTop + dBot) * 0.5);

            // Lower-left triangle (lower color, bottom-left)
            ctx.beginPath();
            ctx.moveTo(toX(f0, (dTop + dBot) * 0.5), yH);
            ctx.lineTo(xHm, yH);
            ctx.lineTo(xmb, yBot);
            ctx.lineTo(x0b, yBot);
            ctx.closePath();
            ctx.fillStyle = `rgba(${dnR},${dnG},${dnB},${fogA})`;
            ctx.fill();

            // Lower-right triangle (lower color, bottom-right)
            ctx.beginPath();
            ctx.moveTo(xHm, yH);
            ctx.lineTo(toX(f1, (dTop + dBot) * 0.5), yH);
            ctx.lineTo(x1b, yBot);
            ctx.lineTo(xmb, yBot);
            ctx.closePath();
            ctx.fillStyle = `rgba(${dnR},${dnG},${dnB},${fogA})`;
            ctx.fill();

            // Upper-pointing tip (upper color triangle pointing down into lower half)
            ctx.beginPath();
            ctx.moveTo(toX(f0, (dTop + dBot) * 0.5), yH);
            ctx.lineTo(toX(f1, (dTop + dBot) * 0.5), yH);
            ctx.lineTo(xHm, yH);   // this just makes a line; the V tip goes up
            ctx.closePath();

            // Actually draw the V tip upward into the upper sub-cell
            ctx.beginPath();
            ctx.moveTo(toX(f0, (dTop + dBot) * 0.5), yH);
            ctx.lineTo(xHm, yTop + (yH - yTop) * 0.1);  // tip pointing up
            ctx.lineTo(toX(f1, (dTop + dBot) * 0.5), yH);
            ctx.closePath();
            ctx.fillStyle = `rgba(${dnR},${dnG},${dnB},${fogA})`;
            ctx.fill();
        }
    }

    // Horizon line — faint separator
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sideW, floorY);
    ctx.lineTo(w - sideW, floorY);
    ctx.stroke();
}

// ---------------------------------------------------------------------------
// CHROMATIC ABERRATION — RGB split on edges, the Lodge's signature weirdness
// ---------------------------------------------------------------------------
function drawChromaticAberration(ctx, w, h, tick) {
    // Random glitch strips
    if (Math.random() > 0.985) {
        const y      = Math.random() * h;
        const stripH = 1 + Math.random() * 4;
        const offset = 2 + Math.random() * 3;
        const alpha  = 0.06 + Math.random() * 0.08;
        ctx.fillStyle = `rgba(255,0,0,${alpha})`;
        ctx.fillRect(offset, y, w, stripH);
        ctx.fillStyle = `rgba(0,0,255,${alpha})`;
        ctx.fillRect(-offset, y, w, stripH);
    }

    // Persistent subtle left-edge RGB split (like the model's table legs)
    const edgeSplit = ctx.createLinearGradient(0, 0, w * 0.08, 0);
    edgeSplit.addColorStop(0,    'rgba(255,0,0,0.04)');
    edgeSplit.addColorStop(0.5,  'rgba(0,0,255,0.04)');
    edgeSplit.addColorStop(1,    'transparent');
    ctx.fillStyle = edgeSplit;
    ctx.fillRect(0, 0, w * 0.08, h);
}

// ---------------------------------------------------------------------------
// COOL BLUE KEY LIGHT — the signature Lynch cold wash
// ---------------------------------------------------------------------------
function drawBlueLight(ctx, w, h, tick) {
    const { r, g, b } = C.blueLight;
    // Central cool radial (brightest top-center, fading out)
    const pulse = Math.sin(tick * 0.008) * 0.5 + 0.5;
    const alpha = 0.18 + pulse * 0.06;

    const grad = ctx.createRadialGradient(w * 0.5, 0, 0, w * 0.5, h * 0.4, h * 0.9);
    grad.addColorStop(0,   `rgba(${r},${g},${b},${alpha})`);
    grad.addColorStop(0.4, `rgba(${r},${g},${b},${alpha * 0.45})`);
    grad.addColorStop(1,   'transparent');

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Soft-light pass — cools midtones without darkening
    const softGrad = ctx.createRadialGradient(w * 0.5, 0, 0, w * 0.5, h * 0.5, h * 1.0);
    softGrad.addColorStop(0,   'rgba(80,120,200,0.12)');
    softGrad.addColorStop(0.6, 'rgba(80,120,200,0.06)');
    softGrad.addColorStop(1,   'transparent');
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = softGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'source-over';
}

// ---------------------------------------------------------------------------
// VIGNETTE — dark corners so UI content remains readable
// ---------------------------------------------------------------------------
function drawVignette(ctx, w, h) {
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, h * 0.1, w * 0.5, h * 0.45, Math.max(w, h) * 0.82);
    grad.addColorStop(0,   'transparent');
    grad.addColorStop(0.55,'rgba(0,0,0,0.25)');
    grad.addColorStop(1,   `rgba(0,0,0,${C.vignette.opacity})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
}

// ---------------------------------------------------------------------------
// FILM GRAIN + SCANLINES
// ---------------------------------------------------------------------------
function drawGrain(ctx, w, h) {
    for (let i = 0; i < 20; i++) {
        if (Math.random() > 0.65) {
            ctx.fillStyle = `rgba(200,200,220,${0.008 + Math.random() * 0.018})`;
            ctx.fillRect(Math.random() * w, Math.random() * (h - 20), 1, 5 + Math.random() * 18);
        }
    }
    // 3 faint scanlines drifting down
    for (let i = 0; i < 3; i++) {
        const speed = 0.25 + i * 0.12;
        ctx.fillStyle = 'rgba(120,120,140,0.012)';
        ctx.fillRect(0, 0, w, h);  // replace with actual scanline
    }
}

// ---------------------------------------------------------------------------
// DUST MOTES — tiny floating particles in the beam
// ---------------------------------------------------------------------------
class DustMote {
    constructor(w, h) { this.init(w, h); }
    init(w, h) {
        this.x    = Math.random() * w;
        this.y    = Math.random() * h;
        this.size = 0.8 + Math.random() * 1.8;
        this.op   = 0.015 + Math.random() * 0.04;
        this.vx   = (Math.random() - 0.5) * 0.03;
        this.vy   = (Math.random() - 0.5) * 0.03;
        this.ph   = Math.random() * Math.PI * 2;
        this.spd  = 0.003 + Math.random() * 0.005;
    }
    update(w, h, dt) {
        this.ph += this.spd * dt;
        this.x  += this.vx * dt + Math.sin(this.ph) * 0.08;
        this.y  += this.vy * dt + Math.cos(this.ph) * 0.06;
        if (this.x < -5 || this.x > w + 5 || this.y < -5 || this.y > h + 5) this.init(w, h);
    }
    draw(ctx) {
        const twinkle = Math.sin(this.ph * 2) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(220,215,240,${this.op * twinkle})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
const LynchBackground = () => {
    const canvasRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);
    const animRef   = useRef(null);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        if (isMobile) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let running = true;
        let tick    = 0;
        let lastT   = 0;

        // Size canvas
        const resize = () => {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Dust motes
        const dust = Array.from({ length: 35 }, () => new DustMote(canvas.width, canvas.height));

        const render = (ts) => {
            if (!running) return;
            if (!lastT) lastT = ts;
            const dt  = Math.min((ts - lastT) / 1000 * 60, 4); // dt in ~frames, capped
            lastT = ts;
            tick += dt;

            const w = canvas.width;
            const h = canvas.height;

            // Base fill — warm deep-crimson gradient, already luminous
            const baseFill = ctx.createLinearGradient(0, 0, 0, h);
            baseFill.addColorStop(0,   'rgb(75,8,8)');
            baseFill.addColorStop(0.6, 'rgb(30,4,4)');
            baseFill.addColorStop(1,   'rgb(8,2,2)');
            ctx.fillStyle = baseFill;
            ctx.fillRect(0, 0, w, h);

            // ── Floor (drawn first, under curtains) ──
            drawChevronFloor(ctx, w, h);

            // ── Back wall curtain ──
            const sideW  = w * C.curtain.sideWidthRatio;
            const backH  = h * C.curtain.backHeightRatio;
            drawBackCurtain(ctx, w, h, tick, sideW, w - sideW, backH);

            // ── Side curtain panels ──
            drawSideCurtain(ctx, w, h, tick, 0, sideW, 1);     // left
            drawSideCurtain(ctx, w, h, tick, w, sideW, -1);    // right

            // ── Cool blue key light ──
            drawBlueLight(ctx, w, h, tick);

            // ── Dust motes ──
            dust.forEach(d => { d.update(w, h, dt); d.draw(ctx); });

            // ── Chromatic aberration ──
            drawChromaticAberration(ctx, w, h, tick);

            // ── Film grain ──
            drawGrain(ctx, w, h);

            // ── Vignette (last — darkens edges for readability) ──
            drawVignette(ctx, w, h);

            animRef.current = requestAnimationFrame(render);
        };

        animRef.current = requestAnimationFrame(render);

        return () => {
            running = false;
            window.removeEventListener('resize', resize);
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [isMobile]);

    // Mobile fallback: static gradient that evokes the room
    if (isMobile) {
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                background: `
                    linear-gradient(180deg,
                        rgb(160,18,18) 0%,
                        rgb(120,12,12) 40%,
                        rgb(14,10,14)  70%,
                        rgb(6,2,2)    100%)
                `,
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(110,145,220,0.18) 0%, transparent 60%)',
                }} />
            </div>
        );
    }

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed', top: 0, left: 0,
                width: '100%', height: '100%',
                zIndex: 0, pointerEvents: 'none',
            }}
        />
    );
};

export default LynchBackground;
