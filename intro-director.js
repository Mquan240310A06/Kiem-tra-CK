/**
 * backgrounds.js
 * High-performance 60 FPS procedural backgrounds for Intro Director (window.IntroBG).
 *
 * STRICT ANTI-FREEZE COMPLIANCE:
 * 1. ZERO `while` loops anywhere; every `for` loop is strictly bounded (N <= 60).
 * 2. ZERO `ctx.filter` usage (prevents Chromium main-thread GPU/CPU stalls).
 * 3. Exactly TWO tiny `320x180` offscreen canvases created ONCE at script load
 *    for hardware-interpolated bilinear bokeh blur via `ctx.drawImage(...)`.
 * 4. ZERO `document.createElement('canvas')` calls inside any render function.
 */

(function () {
  'use strict';

  const W = 1920;
  const H = 1080;

  // ============================================================================
  // 1. TWO TINY OFFSCREEN CANVASES (320x180) CREATED ONCE AT SCRIPT LOAD
  // ============================================================================
  const tinyWarmBokeh = document.createElement('canvas');
  tinyWarmBokeh.width = 320;
  tinyWarmBokeh.height = 180;
  const warmCtx = tinyWarmBokeh.getContext('2d');

  const tinyCoolBokeh = document.createElement('canvas');
  tinyCoolBokeh.width = 320;
  tinyCoolBokeh.height = 180;
  const coolCtx = tinyCoolBokeh.getContext('2d');

  // Deterministic pseudo-random helper (zero loops)
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  }

  // Draw soft radial-gradient bokeh circles onto the two 320x180 canvases ONCE
  (function prebakeBokeh() {
    // Canvas 1: Warm amber/gold bokeh for cafe & sunset (36 circles, <= 60)
    warmCtx.clearRect(0, 0, 320, 180);
    for (let i = 0; i < 36; i++) {
      const cx = hash(i * 3 + 1) * 320;
      const cy = hash(i * 3 + 2) * 150 + 10;
      const r = 10 + hash(i * 3 + 3) * 26;
      const g = warmCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
      if (i % 3 === 0) {
        g.addColorStop(0, 'rgba(255, 225, 145, 0.42)');
        g.addColorStop(0.55, 'rgba(255, 175, 80, 0.14)');
      } else if (i % 3 === 1) {
        g.addColorStop(0, 'rgba(255, 160, 85, 0.34)');
        g.addColorStop(0.55, 'rgba(230, 95, 50, 0.10)');
      } else {
        g.addColorStop(0, 'rgba(255, 240, 195, 0.38)');
        g.addColorStop(0.55, 'rgba(255, 200, 115, 0.12)');
      }
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      warmCtx.fillStyle = g;
      warmCtx.beginPath();
      warmCtx.arc(cx, cy, r, 0, Math.PI * 2);
      warmCtx.fill();
    }

    // Canvas 2: Cool cyan/magenta/amber twilight bokeh for city skyline (36 circles, <= 60)
    coolCtx.clearRect(0, 0, 320, 180);
    for (let i = 0; i < 36; i++) {
      const cx = hash(i * 5 + 11) * 320;
      const cy = hash(i * 5 + 22) * 140 + 20;
      const r = 8 + hash(i * 5 + 33) * 24;
      const g = coolCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
      if (i % 3 === 0) {
        g.addColorStop(0, 'rgba(110, 215, 255, 0.36)');
        g.addColorStop(0.55, 'rgba(55, 140, 255, 0.10)');
      } else if (i % 3 === 1) {
        g.addColorStop(0, 'rgba(255, 130, 200, 0.30)');
        g.addColorStop(0.55, 'rgba(185, 70, 155, 0.08)');
      } else {
        g.addColorStop(0, 'rgba(255, 210, 125, 0.35)');
        g.addColorStop(0.55, 'rgba(255, 155, 75, 0.10)');
      }
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      coolCtx.fillStyle = g;
      coolCtx.beginPath();
      coolCtx.arc(cx, cy, r, 0, Math.PI * 2);
      coolCtx.fill();
    }
  })();

  // ============================================================================
  // 2. PRE-COMPUTED SCENE GEOMETRY (Strictly bounded <= 60 items)
  // ============================================================================
  const STARS = [];
  for (let i = 0; i < 45; i++) {
    STARS.push({
      x: hash(i * 7 + 1) * W,
      y: hash(i * 7 + 2) * (H * 0.46),
      r: 0.9 + hash(i * 7 + 3) * 1.7,
      phase: hash(i * 7 + 4) * Math.PI * 2
    });
  }

  const SKYLINE_BACK = [];
  for (let i = 0; i < 30; i++) {
    SKYLINE_BACK.push({
      x: i * 66 - 20,
      w: 68 + hash(i * 11 + 1) * 52,
      h: 210 + hash(i * 11 + 2) * 370,
      hasSpire: i % 5 === 0
    });
  }

  const SKYLINE_FRONT = [];
  for (let i = 0; i < 24; i++) {
    SKYLINE_FRONT.push({
      x: i * 84 - 24,
      w: 82 + hash(i * 13 + 3) * 60,
      h: 165 + hash(i * 13 + 4) * 280
    });
  }

  const DUST_MOTES = [];
  for (let i = 0; i < 40; i++) {
    DUST_MOTES.push({
      x: hash(i * 17 + 1) * W,
      y: hash(i * 17 + 2) * H,
      r: 1.5 + hash(i * 17 + 3) * 3.2,
      vx: -7 + hash(i * 17 + 4) * 14,
      vy: 7 + hash(i * 17 + 5) * 13,
      alpha: 0.14 + hash(i * 17 + 6) * 0.32
    });
  }

  // ============================================================================
  // 3. PUBLIC RENDERING METHODS (window.IntroBG)
  // ============================================================================
  window.IntroBG = {
    /**
     * Wide Dusk City Skyline
     */
    drawDuskSkyline: function (ctx, t, camX = 0, camY = 0) {
      const time = (t || 0) * 0.001;
      ctx.save();

      // Twilight sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#090d24');
      skyGrad.addColorStop(0.38, '#1c1b46');
      skyGrad.addColorStop(0.68, '#532b5c');
      skyGrad.addColorStop(0.86, '#b6525a');
      skyGrad.addColorStop(1, '#ef935c');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Horizon sunset glow
      const sunX = W * 0.64 - camX * 0.1;
      const sunY = H * 0.78 - camY * 0.1;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 540);
      sunGlow.addColorStop(0, 'rgba(255, 225, 155, 0.55)');
      sunGlow.addColorStop(0.45, 'rgba(255, 125, 90, 0.22)');
      sunGlow.addColorStop(1, 'rgba(255, 95, 75, 0)');
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, W, H);

      // Twinkling stars (45 iterations, <= 60)
      for (let i = 0; i < 45; i++) {
        const s = STARS[i];
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(time * 2.1 + s.phase));
        ctx.fillStyle = `rgba(255, 248, 235, ${a.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(s.x - camX * 0.05, s.y - camY * 0.05, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant city towers (30 iterations, <= 60)
      const backBaseY = H * 0.84 - camY * 0.15;
      ctx.fillStyle = '#171533';
      for (let i = 0; i < 30; i++) {
        const b = SKYLINE_BACK[i];
        const bx = b.x - camX * 0.2;
        const by = backBaseY - b.h;
        ctx.fillRect(bx, by, b.w, b.h + 200);
        if (b.hasSpire) {
          ctx.fillRect(bx + b.w * 0.46, by - 45, 4, 45);
        }
      }

      // Zero-CPU hardware-upscaled city bokeh (320x180 -> 1920x1080)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.65;
      ctx.drawImage(tinyCoolBokeh, 0, 0, W, H);
      ctx.restore();

      // Foreground buildings (24 iterations, <= 60)
      const frontBaseY = H * 0.90 - camY * 0.3;
      for (let i = 0; i < 24; i++) {
        const b = SKYLINE_FRONT[i];
        const bx = b.x - camX * 0.36;
        const by = frontBaseY - b.h;
        ctx.fillStyle = '#0e0d21';
        ctx.fillRect(bx, by, b.w, b.h + 200);

        // Warm lit vertical window strips
        ctx.fillStyle = 'rgba(255, 205, 125, 0.62)';
        ctx.fillRect(bx + 14, by + 22, 8, b.h - 40);
        ctx.fillStyle = 'rgba(125, 210, 255, 0.42)';
        ctx.fillRect(bx + b.w - 24, by + 36, 6, b.h - 56);
      }

      // Foreground base silhouette
      ctx.fillStyle = '#080612';
      ctx.fillRect(0, H * 0.88, W, H * 0.12);

      ctx.restore();
    },

    /**
     * Cozy Warm Cafe Interior
     */
    drawCafeInterior: function (ctx, t, camX = 0, camY = 0) {
      const time = (t || 0) * 0.001;
      ctx.save();

      // Warm espresso timber background
      const wallGrad = ctx.createLinearGradient(0, 0, 0, H);
      wallGrad.addColorStop(0, '#1a100b');
      wallGrad.addColorStop(0.5, '#2e1b13');
      wallGrad.addColorStop(1, '#150c08');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, W, H);

      // Left café window overlooking dusk city
      const winX = 110 - camX * 0.25;
      const winY = 120 - camY * 0.2;
      const winW = 680;
      const winH = 640;

      const winGrad = ctx.createLinearGradient(winX, winY, winX, winY + winH);
      winGrad.addColorStop(0, '#171f40');
      winGrad.addColorStop(0.55, '#3b2c54');
      winGrad.addColorStop(1, '#9c524c');
      ctx.fillStyle = winGrad;
      ctx.fillRect(winX, winY, winW, winH);

      // Upscaled cool street bokeh inside window clip
      ctx.save();
      ctx.beginPath();
      ctx.rect(winX, winY, winW, winH);
      ctx.clip();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.8;
      ctx.drawImage(tinyCoolBokeh, 0, 0, W, H);
      ctx.restore();

      // Window frame & mullions (4x2 panes)
      ctx.strokeStyle = '#23130d';
      ctx.lineWidth = 16;
      ctx.strokeRect(winX, winY, winW, winH);
      ctx.beginPath();
      ctx.moveTo(winX + winW * 0.5, winY);
      ctx.lineTo(winX + winW * 0.5, winY + winH);
      ctx.moveTo(winX, winY + winH * 0.5);
      ctx.lineTo(winX + winW, winY + winH * 0.5);
      ctx.stroke();

      // Zero-CPU hardware-upscaled warm interior bokeh (320x180 -> 1920x1080)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.72;
      ctx.drawImage(tinyWarmBokeh, 0, 0, W, H);
      ctx.restore();

      // Right wooden shelves & counter
      const shelfX = 960 - camX * 0.3;
      ctx.fillStyle = '#22130d';
      ctx.fillRect(shelfX, 240, 820, 38);
      ctx.fillRect(shelfX, 420, 820, 38);
      ctx.fillStyle = '#180d09';
      ctx.fillRect(shelfX - 40, 620, 920, 360);

      // Hanging pendant lamps (6 iterations, <= 60)
      for (let i = 0; i < 6; i++) {
        const lx = 260 + i * 280 - camX * 0.35;
        const sway = Math.sin(time * 1.4 + i) * 4;
        const ly = 180 + (i % 2) * 44 - camY * 0.25;

        ctx.strokeStyle = '#120a06';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx + sway, ly);
        ctx.stroke();

        const glow = ctx.createRadialGradient(lx + sway, ly + 18, 4, lx + sway, ly + 18, 170);
        glow.addColorStop(0, 'rgba(255, 240, 190, 0.92)');
        glow.addColorStop(0.28, 'rgba(255, 185, 95, 0.40)');
        glow.addColorStop(1, 'rgba(255, 140, 50, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(lx + sway, ly + 18, 170, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2b1810';
        ctx.beginPath();
        ctx.moveTo(lx + sway - 35, ly + 14);
        ctx.lineTo(lx + sway + 35, ly + 14);
        ctx.lineTo(lx + sway + 18, ly - 15);
        ctx.lineTo(lx + sway - 18, ly - 15);
        ctx.closePath();
        ctx.fill();
      }

      // Floating warm dust motes (40 iterations, <= 60)
      for (let i = 0; i < 40; i++) {
        const m = DUST_MOTES[i];
        const mx = ((m.x + time * m.vx - camX * 0.4) % W + W) % W;
        const my = ((m.y - time * m.vy - camY * 0.4) % H + H) % H;
        ctx.fillStyle = `rgba(255, 225, 170, ${m.alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(mx, my, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    },

    /**
     * Macro Table Close-Up with Shallow Depth-of-Field Bokeh & Ceramic Coffee Cup
     */
    drawMacroTable: function (ctx, t, camX = 0, camY = 0) {
      ctx.save();

      // Deep espresso backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#1b0f0a');
      bgGrad.addColorStop(0.6, '#361f14');
      bgGrad.addColorStop(1, '#1b0e09');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Silky 60 FPS shallow-DOF bokeh via hardware bilinear upscale of tiny canvases
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.85;
      ctx.drawImage(tinyWarmBokeh, 0, 0, W, H);
      ctx.globalAlpha = 0.35;
      ctx.drawImage(tinyCoolBokeh, 0, 0, W, H);
      ctx.restore();

      // Foreground walnut tabletop
      const tableY = H * 0.62 - camY * 0.4;
      const tableGrad = ctx.createLinearGradient(0, tableY, 0, H);
      tableGrad.addColorStop(0, '#58321e');
      tableGrad.addColorStop(0.2, '#412314');
      tableGrad.addColorStop(1, '#1c0d07');
      ctx.fillStyle = tableGrad;
      ctx.fillRect(0, tableY, W, H - tableY + 100);

      // Subtle wood grain lines (16 iterations, <= 60)
      for (let i = 0; i < 16; i++) {
        const gy = tableY + 14 + i * 25;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 200, 140, 0.05)' : 'rgba(15, 5, 0, 0.18)';
        ctx.fillRect(0, gy, W, 6);
      }

      // Ceramic coffee mug & saucer
      const cupX = W * 0.52 - camX * 0.5;
      const cupY = tableY + 55;

      // Shadow
      ctx.fillStyle = 'rgba(10, 4, 2, 0.65)';
      ctx.beginPath();
      ctx.ellipse(cupX, cupY + 72, 165, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Saucer
      ctx.fillStyle = '#dfd3c3';
      ctx.beginPath();
      ctx.ellipse(cupX, cupY + 58, 148, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cup handle
      ctx.strokeStyle = '#e5dacb';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(cupX + 98, cupY - 8, 34, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();

      // Cup body
      const cupGrad = ctx.createLinearGradient(cupX - 105, cupY - 70, cupX + 105, cupY + 50);
      cupGrad.addColorStop(0, '#fffaf2');
      cupGrad.addColorStop(0.55, '#e8ddd0');
      cupGrad.addColorStop(1, '#ab9886');
      ctx.fillStyle = cupGrad;
      ctx.beginPath();
      ctx.moveTo(cupX - 104, cupY - 64);
      ctx.bezierCurveTo(cupX - 98, cupY + 55, cupX - 55, cupY + 62, cupX, cupY + 62);
      ctx.bezierCurveTo(cupX + 55, cupY + 62, cupX + 98, cupY + 55, cupX + 104, cupY - 64);
      ctx.closePath();
      ctx.fill();

      // Coffee surface
      ctx.fillStyle = '#cbbba8';
      ctx.beginPath();
      ctx.ellipse(cupX, cupY - 64, 104, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#593118';
      ctx.beginPath();
      ctx.ellipse(cupX, cupY - 64, 94, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rising steam wisps
      this.drawSteamWisps(ctx, t, cupX, cupY - 78);

      ctx.restore();
    },

    /**
     * Golden Hour Rooftop Sunset
     */
    drawRooftopSunset: function (ctx, t, camX = 0, camY = 0) {
      const time = (t || 0) * 0.001;
      ctx.save();

      // Golden hour sunset sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#1e193b');
      skyGrad.addColorStop(0.28, '#522959');
      skyGrad.addColorStop(0.55, '#b54653');
      skyGrad.addColorStop(0.78, '#f28749');
      skyGrad.addColorStop(1, '#ffd97d');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Sun disc & bloom
      const sunX = W * 0.54 - camX * 0.12;
      const sunY = H * 0.62 - camY * 0.12;
      const halo = ctx.createRadialGradient(sunX, sunY, 25, sunX, sunY, 450);
      halo.addColorStop(0, 'rgba(255, 250, 210, 0.95)');
      halo.addColorStop(0.25, 'rgba(255, 200, 110, 0.52)');
      halo.addColorStop(0.6, 'rgba(255, 110, 75, 0.18)');
      halo.addColorStop(1, 'rgba(255, 80, 60, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(255, 248, 220, 0.92)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 72, 0, Math.PI * 2);
      ctx.fill();

      // Hardware-upscaled warm bokeh overlay (320x180 -> 1920x1080)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.52;
      ctx.drawImage(tinyWarmBokeh, 0, 0, W, H);
      ctx.restore();

      // Distant city silhouette (24 iterations, <= 60)
      const horizonY = H * 0.78 - camY * 0.25;
      ctx.fillStyle = '#28142a';
      for (let i = 0; i < 24; i++) {
        const b = SKYLINE_FRONT[i];
        const bx = b.x - camX * 0.22;
        const bh = b.h * 0.65;
        ctx.fillRect(bx, horizonY - bh, b.w, bh + 120);
      }

      // Rooftop terrace floor & rim-lit ledge
      const roofY = H * 0.79 - camY * 0.4;
      ctx.fillStyle = '#190d1b';
      ctx.fillRect(0, roofY, W, H - roofY + 100);
      ctx.fillStyle = '#ffae6b';
      ctx.fillRect(0, roofY, W, 4);

      // Rooftop railing posts & string lights (16 iterations, <= 60)
      const railY = roofY - 125;
      ctx.strokeStyle = '#160b18';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, railY);
      ctx.lineTo(W, railY);
      ctx.stroke();

      for (let i = 0; i < 16; i++) {
        const postX = i * 135 - (camX * 0.45) % 135;
        ctx.fillStyle = '#160b18';
        ctx.fillRect(postX, railY, 6, 125);

        const bulbX = postX + 67;
        const bulbY = railY - 16 + Math.sin(time * 2 + i) * 2;
        const g = ctx.createRadialGradient(bulbX, bulbY, 2, bulbX, bulbY, 34);
        g.addColorStop(0, 'rgba(255, 245, 200, 0.95)');
        g.addColorStop(0.4, 'rgba(255, 180, 90, 0.38)');
        g.addColorStop(1, 'rgba(255, 140, 60, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bulbX, bulbY, 34, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    },

    /**
     * Silky procedural steam wisps (Zero blur filter, bounded 18 puffs <= 60)
     */
    drawSteamWisps: function (ctx, t, x = W * 0.5, y = H * 0.55) {
      const time = (t || 0) * 0.001;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      for (let i = 0; i < 18; i++) {
        const cycle = (time * 0.55 + i / 18) % 1;
        const puffY = y - cycle * 210;
        const driftX = Math.sin(cycle * Math.PI * 3 + i * 1.1 + time * 1.6) * (12 + cycle * 32);
        const puffX = x + driftX + ((i % 3) - 1) * 14;
        const radius = 16 + cycle * 46;
        const alpha = Math.sin(cycle * Math.PI) * 0.16;

        if (alpha > 0.005) {
          const g = ctx.createRadialGradient(puffX, puffY, 0, puffX, puffY, radius);
          g.addColorStop(0, `rgba(255, 248, 240, ${alpha.toFixed(3)})`);
          g.addColorStop(0.55, `rgba(245, 230, 215, ${(alpha * 0.45).toFixed(3)})`);
          g.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(puffX, puffY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  };
})();
