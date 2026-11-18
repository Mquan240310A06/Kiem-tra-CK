/**
 * backgrounds.js
 * High-performance 60 FPS procedural backgrounds for Intro Director.
 * STRICT ANTI-FREEZE COMPLIANCE:
 * - Zero `while` loops; all `for` loops strictly bounded <= 60 iterations.
 * - Zero `ctx.filter` usage.
 * - Exactly TWO 320x180 offscreen canvases created ONCE at module load for hardware-upscaled bokeh.
 * - Zero `document.createElement('canvas')` inside any render method.
 */

(function () {
  'use strict';

  const W = 1920;
  const H = 1080;

  // ============================================================================
  // 1. PRE-COMPUTED TINY OFFSCREEN CANVASES (320x180) FOR ZERO-CPU BOKEH BLUR
  // ============================================================================
  const bokehWarmCanvas = document.createElement('canvas');
  bokehWarmCanvas.width = 320;
  bokehWarmCanvas.height = 180;
  const warmCtx = bokehWarmCanvas.getContext('2d');

  const bokehCoolCanvas = document.createElement('canvas');
  bokehCoolCanvas.width = 320;
  bokehCoolCanvas.height = 180;
  const coolCtx = bokehCoolCanvas.getContext('2d');

  // Deterministic pseudo-random helper (no loops)
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  }

  // Pre-render soft radial bokeh onto the two tiny canvases ONCE at load time
  (function initBokehCanvases() {
    // Warm Cafe / Sunset Bokeh (Max 40 iterations)
    warmCtx.clearRect(0, 0, 320, 180);
    for (let i = 0; i < 40; i++) {
      const cx = hash(i * 3 + 1) * 320;
      const cy = hash(i * 3 + 2) * 140 + 10;
      const r = 10 + hash(i * 3 + 3) * 28;
      const g = warmCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const colors = [
        ['rgba(255, 200, 110, 0.38)', 'rgba(255, 160, 60, 0.12)'],
        ['rgba(255, 140, 80, 0.32)', 'rgba(220, 90, 50, 0.08)'],
        ['rgba(255, 235, 175, 0.42)', 'rgba(255, 200, 120, 0.10)']
      ];
      const c = colors[i % 3];
      g.addColorStop(0, c[0]);
      g.addColorStop(0.55, c[1]);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      warmCtx.fillStyle = g;
      warmCtx.beginPath();
      warmCtx.arc(cx, cy, r, 0, Math.PI * 2);
      warmCtx.fill();
    }

    // Cool Dusk / City Bokeh (Max 40 iterations)
    coolCtx.clearRect(0, 0, 320, 180);
    for (let i = 0; i < 40; i++) {
      const cx = hash(i * 5 + 10) * 320;
      const cy = hash(i * 5 + 20) * 130 + 25;
      const r = 8 + hash(i * 5 + 30) * 26;
      const g = coolCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const colors = [
        ['rgba(110, 210, 255, 0.34)', 'rgba(60, 140, 255, 0.10)'],
        ['rgba(255, 130, 200, 0.30)', 'rgba(180, 70, 160, 0.08)'],
        ['rgba(255, 210, 130, 0.36)', 'rgba(255, 160, 80, 0.10)']
      ];
      const c = colors[i % 3];
      g.addColorStop(0, c[0]);
      g.addColorStop(0.55, c[1]);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      coolCtx.fillStyle = g;
      coolCtx.beginPath();
      coolCtx.arc(cx, cy, r, 0, Math.PI * 2);
      coolCtx.fill();
    }
  })();

  // ============================================================================
  // 2. PRE-COMPUTED SCENE GEOMETRY DATA (Bounded <= 60 items)
  // ============================================================================
  const STARS = [];
  for (let i = 0; i < 50; i++) {
    STARS.push({
      x: hash(i * 11 + 1) * W,
      y: hash(i * 11 + 2) * (H * 0.48),
      r: 0.8 + hash(i * 11 + 3) * 1.8,
      phase: hash(i * 11 + 4) * Math.PI * 2
    });
  }

  const BUILDINGS_BACK = [];
  for (let i = 0; i < 32; i++) {
    const bw = 65 + hash(i * 7 + 1) * 55;
    const bh = 220 + hash(i * 7 + 2) * 380;
    BUILDINGS_BACK.push({
      x: i * 62 - 20,
      w: bw,
      h: bh,
      spire: i % 5 === 0
    });
  }

  const BUILDINGS_FRONT = [];
  for (let i = 0; i < 24; i++) {
    const bw = 85 + hash(i * 13 + 5) * 65;
    const bh = 160 + hash(i * 13 + 6) * 290;
    BUILDINGS_FRONT.push({
      x: i * 84 - 30,
      w: bw,
      h: bh,
      winSeed: i * 17
    });
  }

  const DUST_MOTES = [];
  for (let i = 0; i < 45; i++) {
    DUST_MOTES.push({
      x: hash(i * 19 + 1) * W,
      y: hash(i * 19 + 2) * H,
      r: 1.5 + hash(i * 19 + 3) * 3.5,
      speedY: 8 + hash(i * 19 + 4) * 14,
      speedX: -6 + hash(i * 19 + 5) * 12,
      alpha: 0.15 + hash(i * 19 + 6) * 0.35
    });
  }

  // ============================================================================
  // 3. PUBLIC RENDERING ENGINE (window.IntroBG)
  // ============================================================================
  window.IntroBG = {
    /**
     * Scene 1: Wide Dusk City Skyline
     */
    drawDuskSkyline: function (ctx, t, camX = 0, camY = 0) {
      const time = (t || 0) * 0.001;
      ctx.save();

      // Rich twilight sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#0b0e26');
      skyGrad.addColorStop(0.38, '#1d1c47');
      skyGrad.addColorStop(0.68, '#542c5d');
      skyGrad.addColorStop(0.86, '#b8535c');
      skyGrad.addColorStop(1, '#f0945d');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Horizon sun glow
      const sunGlow = ctx.createRadialGradient(W * 0.65 - camX * 0.1, H * 0.78 - camY * 0.1, 10, W * 0.65 - camX * 0.1, H * 0.78 - camY * 0.1, 560);
      sunGlow.addColorStop(0, 'rgba(255, 220, 150, 0.55)');
      sunGlow.addColorStop(0.45, 'rgba(255, 120, 90, 0.22)');
      sunGlow.addColorStop(1, 'rgba(255, 100, 80, 0)');
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, W, H);

      // Twinkling stars (50 iterations)
      for (let i = 0; i < 50; i++) {
        const s = STARS[i];
        const alpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(time * 2.2 + s.phase));
        ctx.fillStyle = `rgba(255, 248, 235, ${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(s.x - camX * 0.05, s.y - camY * 0.05, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant city layer (32 iterations)
      const baseBackY = H * 0.84 - camY * 0.15;
      ctx.fillStyle = '#171533';
      for (let i = 0; i < 32; i++) {
        const b = BUILDINGS_BACK[i];
        const bx = b.x - camX * 0.2;
        const by = baseBackY - b.h;
        ctx.fillRect(bx, by, b.w, b.h + 220);
        if (b.spire) {
          ctx.fillRect(bx + b.w * 0.45, by - 48, 4, 48);
        }
      }

      // Soft out-of-focus city lights via hardware-upscaled tiny canvas
      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(bokehCoolCanvas, -camX * 0.25, H * 0.35 - camY * 0.2, W + 120, H * 0.55);
      ctx.restore();

      // Foreground city silhouettes + warm window strips (24 iterations)
      const baseFrontY = H * 0.90 - camY * 0.3;
      for (let i = 0; i < 24; i++) {
        const b = BUILDINGS_FRONT[i];
        const bx = b.x - camX * 0.38;
        const by = baseFrontY - b.h;
        ctx.fillStyle = '#0e0d22';
        ctx.fillRect(bx, by, b.w, b.h + 200);

        // Lit window rows (bounded 12 rows per building? No: keep total inner work tiny -> 2 window columns via single dashed stroke or 2 rects)
        ctx.fillStyle = 'rgba(255, 205, 125, 0.65)';
        ctx.fillRect(bx + 14, by + 22, 8, b.h - 40);
        ctx.fillStyle = 'rgba(130, 210, 255, 0.45)';
        ctx.fillRect(bx + b.w - 26, by + 38, 6, b.h - 60);
      }

      // Foreground highway/water reflection band
      const groundGrad = ctx.createLinearGradient(0, H * 0.86, 0, H);
      groundGrad.addColorStop(0, '#120e24');
      groundGrad.addColorStop(1, '#070510');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, H * 0.86, W, H * 0.14);

      ctx.restore();
    },

    /**
     * Scene 2: Warm Cozy Cafe Interior
     */
    drawCafeInterior: function (ctx, t, camX = 0, camY = 0) {
      const time = (t || 0) * 0.001;
      ctx.save();

      // Warm dark wood & ambient espresso wall gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#1b110c');
      bgGrad.addColorStop(0.5, '#2f1c14');
      bgGrad.addColorStop(1, '#160d09');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Left café window looking out into dusk street
      const winX = 110 - camX * 0.25;
      const winY = 120 - camY * 0.2;
      const winW = 680;
      const winH = 640;

      const outsideGrad = ctx.createLinearGradient(winX, winY, winX, winY + winH);
      outsideGrad.addColorStop(0, '#182042');
      outsideGrad.addColorStop(0.55, '#3b2c54');
      outsideGrad.addColorStop(1, '#9c524c');
      ctx.fillStyle = outsideGrad;
      ctx.fillRect(winX, winY, winW, winH);

      // Street bokeh outside window using tiny offscreen canvas
      ctx.save();
      ctx.beginPath();
      ctx.rect(winX, winY, winW, winH);
      ctx.clip();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.8;
      ctx.drawImage(bokehCoolCanvas, winX - 40, winY + 60, winW + 80, winH - 60);
      ctx.restore();

      // Window mullions & wooden frame
      ctx.strokeStyle = '#24140e';
      ctx.lineWidth = 18;
      ctx.strokeRect(winX, winY, winW, winH);
      ctx.beginPath();
      ctx.moveTo(winX + winW * 0.5, winY);
      ctx.lineTo(winX + winW * 0.5, winY + winH);
      ctx.moveTo(winX, winY + winH * 0.45);
      ctx.lineTo(winX + winW, winY + winH * 0.45);
      ctx.stroke();

      // Warm interior bokeh overlay (hardware bilinear blur from 320x180 canvas)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.72;
      ctx.drawImage(bokehWarmCanvas, -camX * 0.15, -camY * 0.15, W + 80, H + 40);
      ctx.restore();

      // Background counter & shelves on the right
      const counterX = 960 - camX * 0.3;
      ctx.fillStyle = '#22130d';
      ctx.fillRect(counterX, 240, 820, 40);
      ctx.fillRect(counterX, 420, 820, 40);
      ctx.fillStyle = '#190e09';
      ctx.fillRect(counterX - 40, 620, 920, 360);

      // Hanging pendant lamps (6 lamps)
      for (let i = 0; i < 6; i++) {
        const lx = 260 + i * 280 - camX * 0.35;
        const sway = Math.sin(time * 1.4 + i) * 4;
        const ly = 180 + (i % 2) * 45 - camY * 0.25;

        // Cord
        ctx.strokeStyle = '#120a06';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx + sway, ly);
        ctx.stroke();

        // Warm bulb radial glow
        const lampGlow = ctx.createRadialGradient(lx + sway, ly + 18, 4, lx + sway, ly + 18, 175);
        lampGlow.addColorStop(0, 'rgba(255, 240, 190, 0.95)');
        lampGlow.addColorStop(0.25, 'rgba(255, 185, 95, 0.42)');
        lampGlow.addColorStop(1, 'rgba(255, 140, 50, 0)');
        ctx.fillStyle = lampGlow;
        ctx.beginPath();
        ctx.arc(lx + sway, ly + 18, 175, 0, Math.PI * 2);
        ctx.fill();

        // Lamp shade
        ctx.fillStyle = '#2b1912';
        ctx.beginPath();
        ctx.moveTo(lx + sway - 36, ly + 14);
        ctx.lineTo(lx + sway + 36, ly + 14);
        ctx.lineTo(lx + sway + 18, ly - 16);
        ctx.lineTo(lx + sway - 18, ly - 16);
        ctx.closePath();
        ctx.fill();
      }

      // Floating sunlit/lamplit dust motes (45 iterations)
      for (let i = 0; i < 45; i++) {
        const m = DUST_MOTES[i];
        const mx = (m.x + time * m.speedX - camX * 0.4 + W) % W;
        const my = (m.y - time * m.speedY - camY * 0.4 + H) % H;
        ctx.fillStyle = `rgba(255, 225, 170, ${m.alpha})`;
        ctx.beginPath();
        ctx.arc(mx, my, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    },

    /**
     * Scene 3: Macro Table Close-Up (Shallow Depth of Field + Coffee Cup)
     */
    drawMacroTable: function (ctx, t, camX = 0, camY = 0) {
      const time = (t || 0) * 0.001;
      ctx.save();

      // Deep creamy out-of-focus background
      const wallGrad = ctx.createLinearGradient(0, 0, 0, H);
      wallGrad.addColorStop(0, '#1c100b');
      wallGrad.addColorStop(0.6, '#382015');
      wallGrad.addColorStop(1, '#1c0f0a');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, W, H);

      // Creamy macro bokeh using BOTH pre-rendered 320x180 canvases scaled up
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.85;
      ctx.drawImage(bokehWarmCanvas, -60 - camX * 0.15, -40 - camY * 0.15, W + 160, H * 0.85);
      ctx.globalAlpha = 0.35;
      ctx.drawImage(bokehCoolCanvas, 40 - camX * 0.25, -20 - camY * 0.2, W + 120, H * 0.75);
      ctx.restore();

      // Polished walnut table surface in foreground
      const tableY = H * 0.62 - camY * 0.4;
      const tableGrad = ctx.createLinearGradient(0, tableY, 0, H);
      tableGrad.addColorStop(0, '#59331f');
      tableGrad.addColorStop(0.18, '#422415');
      tableGrad.addColorStop(1, '#1d0e08');
      ctx.fillStyle = tableGrad;
      ctx.fillRect(0, tableY, W, H - tableY + 100);

      // Subtle wood grain & specular table reflection lines (18 iterations)
      for (let i = 0; i < 18; i++) {
        const gy = tableY + 14 + i * 24;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 200, 140, 0.05)' : 'rgba(15, 5, 0, 0.18)';
        ctx.fillRect(0, gy, W, 6);
      }

      // Soft warm reflection pool on tabletop
      const tableGlow = ctx.createRadialGradient(W * 0.5 - camX * 0.4, tableY + 80, 20, W * 0.5 - camX * 0.4, tableY + 80, 480);
      tableGlow.addColorStop(0, 'rgba(255, 205, 135, 0.25)');
      tableGlow.addColorStop(1, 'rgba(255, 160, 80, 0)');
      ctx.fillStyle = tableGlow;
      ctx.fillRect(0, tableY, W, H - tableY);

      // Ceramic coffee cup & saucer (macro hero prop)
      const cupX = W * 0.52 - camX * 0.5;
      const cupY = tableY + 55;

      // Contact shadow
      ctx.fillStyle = 'rgba(10, 4, 2, 0.65)';
      ctx.beginPath();
      ctx.ellipse(cupX, cupY + 72, 165, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Saucer
      const saucerGrad = ctx.createLinearGradient(cupX - 150, cupY + 45, cupX + 150, cupY + 75);
      saucerGrad.addColorStop(0, '#f4ede4');
      saucerGrad.addColorStop(0.5, '#dfd3c3');
      saucerGrad.addColorStop(1, '#9e8c7a');
      ctx.fillStyle = saucerGrad;
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

      // Cup rim & rich crema coffee surface
      ctx.fillStyle = '#cbbba8';
      ctx.beginPath();
      ctx.ellipse(cupX, cupY - 64, 104, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      const coffeeGrad = ctx.createRadialGradient(cupX - 20, cupY - 66, 8, cupX, cupY - 64, 92);
      coffeeGrad.addColorStop(0, '#a66838');
      coffeeGrad.addColorStop(0.65, '#593118');
      coffeeGrad.addColorStop(1, '#2b1509');
      ctx.fillStyle = coffeeGrad;
      ctx.beginPath();
      ctx.ellipse(cupX, cupY - 64, 94, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Latte art heart highlight
      ctx.fillStyle = 'rgba(245, 228, 205, 0.75)';
      ctx.beginPath();
      ctx.ellipse(cupX, cupY - 64, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rising steam wisps above the cup
      this.drawSteamWisps(ctx, t, cupX, cupY - 78);

      ctx.restore();
    },

    /**
     * Scene 4: Golden Hour Rooftop Sunset
     */
    drawRooftopSunset: function (ctx, t, camX = 0, camY = 0) {
      const time = (t || 0) * 0.001;
      ctx.save();

      // Dramatic golden-hour sunset sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#1e193b');
      skyGrad.addColorStop(0.28, '#522959');
      skyGrad.addColorStop(0.55, '#b54653');
      skyGrad.addColorStop(0.78, '#f28749');
      skyGrad.addColorStop(1, '#ffd97d');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Setting sun disc + bloom
      const sunX = W * 0.54 - camX * 0.12;
      const sunY = H * 0.62 - camY * 0.12;

      const sunHalo = ctx.createRadialGradient(sunX, sunY, 30, sunX, sunY, 460);
      sunHalo.addColorStop(0, 'rgba(255, 250, 210, 0.95)');
      sunHalo.addColorStop(0.22, 'rgba(255, 200, 110, 0.55)');
      sunHalo.addColorStop(0.6, 'rgba(255, 110, 75, 0.20)');
      sunHalo.addColorStop(1, 'rgba(255, 80, 60, 0)');
      ctx.fillStyle = sunHalo;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(255, 248, 220, 0.92)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 74, 0, Math.PI * 2);
      ctx.fill();

      // Soft glowing clouds (12 iterations)
      for (let i = 0; i < 12; i++) {
        const cx = ((i * 210 + time * (6 + (i % 3) * 3)) % (W + 400)) - 200 - camX * 0.15;
        const cy = 140 + (i % 4) * 95 - camY * 0.1;
        const cw = 240 + (i % 3) * 110;
        const ch = 26 + (i % 2) * 16;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 185, 125, 0.22)' : 'rgba(120, 60, 95, 0.26)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, cw * 0.5, ch, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Warm lens bokeh overlay from pre-rendered tiny canvas
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.5;
      ctx.drawImage(bokehWarmCanvas, -camX * 0.2, -camY * 0.2, W + 100, H);
      ctx.restore();

      // Distant skyline silhouette (24 iterations)
      const horizonY = H * 0.78 - camY * 0.25;
      ctx.fillStyle = '#29152b';
      for (let i = 0; i < 24; i++) {
        const b = BUILDINGS_FRONT[i];
        const bx = b.x - camX * 0.22;
        const bh = b.h * 0.65;
        ctx.fillRect(bx, horizonY - bh, b.w, bh + 120);
      }

      // Rooftop terrace floor & parapet wall
      const roofY = H * 0.79 - camY * 0.4;
      ctx.fillStyle = '#1a0e1c';
      ctx.fillRect(0, roofY, W, H - roofY + 100);

      // Rim-lit rooftop ledge
      ctx.fillStyle = '#ffae6b';
      ctx.fillRect(0, roofY, W, 4);

      // Rooftop safety railing posts & string lights (16 iterations)
      const railTopY = roofY - 125;
      ctx.strokeStyle = '#160b18';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, railTopY);
      ctx.lineTo(W, railTopY);
      ctx.stroke();

      for (let i = 0; i < 16; i++) {
        const postX = i * 135 - (camX * 0.45) % 135;
        ctx.fillStyle = '#160b18';
        ctx.fillRect(postX, railTopY, 6, 125);

        // Festoon string light bulb between posts
        const bulbX = postX + 67;
        const bulbY = railTopY - 18 + Math.sin(time * 2 + i) * 2;
        const glow = ctx.createRadialGradient(bulbX, bulbY, 2, bulbX, bulbY, 36);
        glow.addColorStop(0, 'rgba(255, 245, 200, 0.95)');
        glow.addColorStop(0.4, 'rgba(255, 180, 90, 0.4)');
        glow.addColorStop(1, 'rgba(255, 140, 60, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(bulbX, bulbY, 36, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    },

    /**
     * Silky procedural steam wisps (Zero blur filter, bounded 18 puffs)
     */
    drawSteamWisps: function (ctx, t, x = W * 0.5, y = H * 0.55) {
      const time = (t || 0) * 0.001;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // 18 soft radial gradient puffs rising and fading
      for (let i = 0; i < 18; i++) {
        const cycle = (time * 0.55 + i / 18) % 1;
        const puffY = y - cycle * 210;
        const driftX = Math.sin(cycle * Math.PI * 3 + i * 1.1 + time * 1.6) * (12 + cycle * 34);
        const puffX = x + driftX + (i % 3 - 1) * 14;
        const radius = 16 + cycle * 48;
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
