/**
 * backgrounds.js
 * Studio-grade 1920x1080 procedural backgrounds with real Canvas depth-of-field,
 * warm volumetric lighting, parallax dusk skyline, and multi-layered curling steam.
 *
 * Exposes: window.IntroBG
 */
(function (global) {
  'use strict';

  const WIDTH = 1920;
  const HEIGHT = 1080;

  // Deterministic PRNG (Mulberry32) so cityscapes, grain, and dust never flicker
  function createRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // =========================================================================
  // Precomputed Scene Geometry (Zero per-frame allocations)
  // =========================================================================
  const SKYLINE_LAYERS = (function buildSkylineData() {
    const rng = createRng(20250410);
    const layerConfigs = [
      {
        count: 34,
        baseY: 790,
        minH: 180,
        maxH: 430,
        minW: 48,
        maxW: 96,
        color: '#21152B',
        rimColor: 'rgba(232, 141, 79, 0.14)',
        parallax: 3.5,
        windowChance: 0.28,
        windowAlpha: 0.35,
      },
      {
        count: 26,
        baseY: 830,
        minH: 170,
        maxH: 470,
        minW: 62,
        maxW: 128,
        color: '#181020',
        rimColor: 'rgba(232, 141, 79, 0.20)',
        parallax: 7.5,
        windowChance: 0.38,
        windowAlpha: 0.52,
      },
      {
        count: 19,
        baseY: 890,
        minH: 150,
        maxH: 420,
        minW: 85,
        maxW: 165,
        color: '#100B16',
        rimColor: 'rgba(244, 169, 102, 0.26)',
        parallax: 13.0,
        windowChance: 0.45,
        windowAlpha: 0.72,
      },
    ];

    return layerConfigs.map((cfg) => {
      const buildings = [];
      let cursorX = -120;
      for (let i = 0; i < cfg.count; i++) {
        const w = cfg.minW + rng() * (cfg.maxW - cfg.minW);
        const h = cfg.minH + rng() * (cfg.maxH - cfg.minH);
        const x = cursorX;
        const y = cfg.baseY - h;
        const hasSpire = rng() > 0.72;
        const spireH = hasSpire ? 18 + rng() * 44 : 0;
        const hasStepRoof = !hasSpire && rng() > 0.6;

        // Precompute illuminated window grid
        const windows = [];
        const padX = 10;
        const padY = 14;
        const stepX = 14;
        const stepY = 18;
        const winW = 7;
        const winH = 9;
        for (let wy = y + padY; wy < cfg.baseY - 24; wy += stepY) {
          const rowLitBias = rng();
          for (let wx = x + padX; wx < x + w - padX - winW; wx += stepX) {
            if (rng() < cfg.windowChance * (0.5 + rowLitBias)) {
              const warmMix = rng();
              windows.push({
                x: wx,
                y: wy,
                w: winW,
                h: winH,
                warmth: warmMix,
                phase: rng() * Math.PI * 2,
              });
            }
          }
        }

        buildings.push({
          x,
          y,
          w,
          h,
          spireH,
          hasStepRoof,
          windows,
        });
        cursorX += w * (0.68 + rng() * 0.42);
      }
      return { cfg, buildings };
    });
  })();

  const BOKEH_ORBS = (function buildBokeh() {
    const rng = createRng(99173);
    const orbs = [];
    for (let i = 0; i < 48; i++) {
      orbs.push({
        x: rng() * (WIDTH + 160) - 80,
        y: 360 + rng() * 520,
        r: 7 + rng() * 24,
        alpha: 0.10 + rng() * 0.22,
        speed: 0.25 + rng() * 0.65,
        phase: rng() * Math.PI * 2,
        hueShift: rng(),
      });
    }
    return orbs;
  })();

  const WOOD_GRAIN_LINES = (function buildWoodGrain() {
    const rng = createRng(44129);
    const lines = [];
    for (let i = 0; i < 42; i++) {
      const y = 708 + rng() * 365;
      lines.push({
        y,
        curve: (rng() - 0.5) * 14,
        alpha: 0.04 + rng() * 0.08,
        thickness: 1 + rng() * 2.2,
        xStart: -40 + rng() * 260,
        xEnd: 1620 + rng() * 340,
      });
    }
    return lines;
  })();

  const DUST_MOTES = (function buildDustMotes() {
    const rng = createRng(77315);
    const motes = [];
    for (let i = 0; i < 64; i++) {
      motes.push({
        x: rng() * WIDTH,
        y: 120 + rng() * 820,
        r: 1.4 + rng() * 3.6,
        vx: (rng() - 0.5) * 18,
        vy: -8 - rng() * 14,
        phase: rng() * Math.PI * 2,
        alpha: 0.25 + rng() * 0.55,
      });
    }
    return motes;
  })();

  // =========================================================================
  // 1. drawDuskSkyline(ctx, t, blurPx = 0)
  // =========================================================================
  function drawDuskSkyline(ctx, t, blurPx) {
    const time = typeof t === 'number' ? t : 0;
    const blur = typeof blurPx === 'number' && blurPx > 0 ? blurPx : 0;

    ctx.save();
    ctx.filter = blur > 0 ? 'blur(' + blur + 'px)' : 'none';

    // Overscan bounds prevent blurred canvas-edge darkening
    const pad = blur > 0 ? Math.ceil(blur * 2.2) : 0;

    // Multi-stop twilight gradient
    const skyGrad = ctx.createLinearGradient(0, -pad, 0, HEIGHT + pad);
    skyGrad.addColorStop(0.0, '#0F0E1D');
    skyGrad.addColorStop(0.32, '#2E1A36');
    skyGrad.addColorStop(0.64, '#9E473B');
    skyGrad.addColorStop(0.88, '#E88D4F');
    skyGrad.addColorStop(1.0, '#F3A967');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-pad, -pad, WIDTH + pad * 2, HEIGHT + pad * 2);

    // Subtle upper twilight stars
    ctx.fillStyle = 'rgba(255, 240, 220, 0.38)';
    for (let i = 0; i < 24; i++) {
      const sx = ((i * 197) % 1840) + 40;
      const sy = ((i * 89) % 240) + 28;
      const twinkle = 0.4 + 0.6 * Math.sin(time * 1.4 + i);
      ctx.globalAlpha = 0.28 * twinkle;
      ctx.beginPath();
      ctx.arc(sx, sy, (i % 3 === 0 ? 1.8 : 1.1), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Low glowing sun disk + soft radial bloom
    const sunX = 1120 + Math.sin(time * 0.08) * 6;
    const sunY = 605;

    const outerBloom = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 540);
    outerBloom.addColorStop(0.0, 'rgba(255, 232, 175, 0.72)');
    outerBloom.addColorStop(0.18, 'rgba(255, 176, 102, 0.44)');
    outerBloom.addColorStop(0.48, 'rgba(232, 112, 68, 0.16)');
    outerBloom.addColorStop(1.0, 'rgba(158, 71, 59, 0)');
    ctx.fillStyle = outerBloom;
    ctx.fillRect(sunX - 540, sunY - 540, 1080, 1080);

    const sunCore = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 96);
    sunCore.addColorStop(0.0, '#FFF8E2');
    sunCore.addColorStop(0.55, '#FFD38A');
    sunCore.addColorStop(0.85, 'rgba(244, 155, 86, 0.55)');
    sunCore.addColorStop(1.0, 'rgba(232, 141, 79, 0)');
    ctx.fillStyle = sunCore;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 96, 0, Math.PI * 2);
    ctx.fill();

    // Soft atmospheric sunset cloud bands
    ctx.fillStyle = 'rgba(255, 198, 138, 0.08)';
    for (let c = 0; c < 4; c++) {
      const cx = (c * 520 + time * (4 + c * 1.5)) % (WIDTH + 500) - 250;
      const cy = 280 + c * 74;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 240 + c * 35, 16 + c * 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3 Parallax skyscraper layers
    for (let l = 0; l < SKYLINE_LAYERS.length; l++) {
      const layer = SKYLINE_LAYERS[l];
      const cfg = layer.cfg;
      const shiftX = Math.sin(time * 0.16) * cfg.parallax;

      for (let b = 0; b < layer.buildings.length; b++) {
        const bld = layer.buildings[b];
        const bx = bld.x + shiftX;

        // Main silhouette
        ctx.fillStyle = cfg.color;
        ctx.fillRect(bx, bld.y, bld.w, bld.h + 260);

        if (bld.hasStepRoof) {
          ctx.fillRect(bx + bld.w * 0.18, bld.y - 16, bld.w * 0.64, 18);
        }
        if (bld.spireH > 0) {
          ctx.fillRect(bx + bld.w * 0.48, bld.y - bld.spireH, 3, bld.spireH + 2);
        }

        // Warm sunset rim highlight facing the sun
        ctx.fillStyle = cfg.rimColor;
        const sunOnRight = sunX > bx + bld.w * 0.5;
        ctx.fillRect(sunOnRight ? bx + bld.w - 2.5 : bx, bld.y, 2.5, bld.h);

        // Illuminated warm window grids
        for (let w = 0; w < bld.windows.length; w++) {
          const win = bld.windows[w];
          const flicker = 0.85 + 0.15 * Math.sin(time * 0.9 + win.phase);
          ctx.fillStyle =
            win.warmth > 0.35
              ? 'rgba(255, 208, 128, ' + (cfg.windowAlpha * flicker).toFixed(3) + ')'
              : 'rgba(255, 168, 92, ' + (cfg.windowAlpha * 0.8 * flicker).toFixed(3) + ')';
          ctx.fillRect(win.x + shiftX, win.y, win.w, win.h);
        }
      }

      // Warm horizon haze between mid and foreground skyscrapers
      if (l === 1) {
        const hazeGrad = ctx.createLinearGradient(0, 520, 0, 880);
        hazeGrad.addColorStop(0, 'rgba(232, 141, 79, 0)');
        hazeGrad.addColorStop(0.55, 'rgba(232, 141, 79, 0.15)');
        hazeGrad.addColorStop(1, 'rgba(28, 17, 29, 0.35)');
        ctx.fillStyle = hazeGrad;
        ctx.fillRect(-pad, 520, WIDTH + pad * 2, 360);
      }
    }

    // Soft circular bokeh lights drifting across city horizon
    for (let i = 0; i < BOKEH_ORBS.length; i++) {
      const orb = BOKEH_ORBS[i];
      const ox = orb.x + Math.sin(time * orb.speed + orb.phase) * 14;
      const oy = orb.y + Math.cos(time * orb.speed * 0.7 + orb.phase) * 8;
      const pulse = 0.78 + 0.22 * Math.sin(time * 1.3 + orb.phase);

      ctx.fillStyle =
        orb.hueShift > 0.3
          ? 'rgba(255, 205, 130, ' + (0.22 * pulse).toFixed(3) + ')'
          : 'rgba(255, 164, 102, ' + (orb.alpha * pulse).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(ox, oy, orb.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // =========================================================================
  // 2. drawCafeInterior(ctx, t, blurPx = 2)
  // =========================================================================
  function drawWallClock(ctx, cx, cy, radius, t) {
    ctx.save();

    // Subtle wall shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.arc(cx + 4, cy + 7, radius + 3, 0, Math.PI * 2);
    ctx.fill();

    // Clean minimalist white rim
    ctx.fillStyle = '#EAE2D8';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Dark dial face
    ctx.fillStyle = '#191418';
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 5, 0, Math.PI * 2);
    ctx.fill();

    // 12 minimalist hour ticks
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const inner = i % 3 === 0 ? radius - 16 : radius - 12;
      const outer = radius - 7;
      ctx.strokeStyle = i % 3 === 0 ? '#EAE2D8' : 'rgba(234, 226, 216, 0.5)';
      ctx.lineWidth = i % 3 === 0 ? 2.4 : 1.4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * inner, cy + Math.sin(ang) * inner);
      ctx.lineTo(cx + Math.cos(ang) * outer, cy + Math.sin(ang) * outer);
      ctx.stroke();
    }

    // Hands: sunset time ~ 5:42 PM + live ticking second hand
    const secTick = Math.floor(t);
    const secAng = (secTick / 60) * Math.PI * 2 - Math.PI / 2;
    const minAng = ((42 + t / 60) / 60) * Math.PI * 2 - Math.PI / 2;
    const hourAng = ((5 + 42 / 60) / 12) * Math.PI * 2 - Math.PI / 2;

    ctx.lineCap = 'round';

    // Hour hand
    ctx.strokeStyle = '#F2EBE2';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(hourAng) * (radius * 0.48), cy + Math.sin(hourAng) * (radius * 0.48));
    ctx.stroke();

    // Minute hand
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(minAng) * (radius * 0.7), cy + Math.sin(minAng) * (radius * 0.7));
    ctx.stroke();

    // Amber second hand
    ctx.strokeStyle = '#E88D4F';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(secAng) * 8, cy - Math.sin(secAng) * 8);
    ctx.lineTo(cx + Math.cos(secAng) * (radius * 0.76), cy + Math.sin(secAng) * (radius * 0.76));
    ctx.stroke();

    // Center pin
    ctx.fillStyle = '#E88D4F';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawCafeCounter(ctx, t) {
    // Kitchen / cafe counter & espresso machine silhouette on the right (x: 1440..1860, y: 460..920)
    ctx.save();

    // Back shelf silhouette
    ctx.fillStyle = '#130F13';
    ctx.fillRect(1465, 360, 380, 16);
    // Cups & canisters on shelf
    ctx.fillStyle = '#1D171C';
    ctx.fillRect(1495, 315, 28, 45);
    ctx.fillRect(1532, 326, 24, 34);
    ctx.fillRect(1576, 304, 34, 56);
    ctx.fillRect(1720, 322, 32, 38);
    ctx.fillRect(1762, 312, 36, 48);

    // Espresso machine body (y: 460..638)
    const machX = 1525;
    const machY = 460;
    const machW = 245;
    const machH = 178;

    ctx.fillStyle = '#120E12';
    ctx.fillRect(machX, machY + 18, machW, machH - 18);
    // Upper cup-warmer crown
    ctx.fillStyle = '#1C161A';
    ctx.fillRect(machX - 6, machY, machW + 12, 24);
    // Warm sunset rim reflection on machine left edge
    ctx.fillStyle = 'rgba(232, 141, 79, 0.22)';
    ctx.fillRect(machX, machY + 20, 3, machH - 22);

    // Recessed brew bay + portafilters
    ctx.fillStyle = '#0B080B';
    ctx.fillRect(machX + 26, machY + 86, machW - 52, 74);
    ctx.fillStyle = '#251D22';
    ctx.fillRect(machX + 58, machY + 78, 34, 14);
    ctx.fillRect(machX + 148, machY + 78, 34, 14);
    // Portafilter handles
    ctx.fillRect(machX + 70, machY + 90, 10, 26);
    ctx.fillRect(machX + 160, machY + 90, 10, 26);

    // Espresso cup waiting under group head
    ctx.fillStyle = '#2B2226';
    ctx.fillRect(machX + 153, machY + 132, 26, 26);

    // Glowing green & amber status LEDs
    const pulse = 0.72 + 0.28 * Math.sin(t * 2.6);
    const greenGlow = ctx.createRadialGradient(machX + 42, machY + 52, 1, machX + 42, machY + 52, 18);
    greenGlow.addColorStop(0, 'rgba(110, 245, 150, ' + (0.95 * pulse).toFixed(2) + ')');
    greenGlow.addColorStop(0.35, 'rgba(65, 210, 115, 0.35)');
    greenGlow.addColorStop(1, 'rgba(65, 210, 115, 0)');
    ctx.fillStyle = greenGlow;
    ctx.beginPath();
    ctx.arc(machX + 42, machY + 52, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7CFFA6';
    ctx.beginPath();
    ctx.arc(machX + 42, machY + 52, 3.2, 0, Math.PI * 2);
    ctx.fill();

    const amberGlow = ctx.createRadialGradient(machX + 64, machY + 52, 1, machX + 64, machY + 52, 14);
    amberGlow.addColorStop(0, 'rgba(255, 184, 88, 0.9)');
    amberGlow.addColorStop(1, 'rgba(255, 184, 88, 0)');
    ctx.fillStyle = amberGlow;
    ctx.beginPath();
    ctx.arc(machX + 64, machY + 52, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFC266';
    ctx.beginPath();
    ctx.arc(machX + 64, machY + 52, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Espresso grinder silhouette next to machine
    ctx.fillStyle = '#141014';
    ctx.fillRect(1788, 505, 58, 133);
    ctx.beginPath();
    ctx.moveTo(1784, 505);
    ctx.lineTo(1850, 505);
    ctx.lineTo(1838, 466);
    ctx.lineTo(1796, 466);
    ctx.closePath();
    ctx.fill();

    // Countertop & lower cabinet (x: 1440..1860, y: 638..920)
    ctx.fillStyle = '#251A19';
    ctx.fillRect(1440, 638, 420, 22);
    // Warm top rim highlight
    ctx.fillStyle = 'rgba(240, 175, 118, 0.24)';
    ctx.fillRect(1440, 638, 420, 3);

    ctx.fillStyle = '#120E12';
    ctx.fillRect(1454, 660, 396, 260);
    // Subtle cabinet panel grooves
    ctx.fillStyle = '#191418';
    ctx.fillRect(1474, 682, 168, 220);
    ctx.fillRect(1662, 682, 168, 220);

    ctx.restore();
  }

  function drawMinimalistChair(ctx, cx, seatY, facingRight) {
    ctx.save();
    const dir = facingRight ? 1 : -1;

    // Backrest & legs silhouette
    ctx.strokeStyle = '#120E12';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Back leg + upright backrest post
    const backX = cx - dir * 56;
    const frontX = cx + dir * 52;

    ctx.beginPath();
    ctx.moveTo(backX - dir * 10, seatY + 225);
    ctx.lineTo(backX, seatY);
    ctx.lineTo(backX - dir * 14, seatY - 148);
    ctx.stroke();

    // Front leg
    ctx.beginPath();
    ctx.moveTo(frontX + dir * 8, seatY + 225);
    ctx.lineTo(frontX, seatY + 4);
    ctx.stroke();

    // Curved wooden backrest pad
    ctx.fillStyle = '#251A19';
    ctx.beginPath();
    ctx.roundRect(backX - dir * 20 - 12, seatY - 156, 24, 68, 8);
    ctx.fill();

    // Seat cushion
    ctx.fillStyle = '#231818';
    ctx.beginPath();
    ctx.roundRect(cx - 64, seatY - 10, 128, 20, 8);
    ctx.fill();

    // Subtle warm edge highlight on seat
    ctx.fillStyle = 'rgba(232, 156, 98, 0.16)';
    ctx.fillRect(cx - 56, seatY - 10, 112, 2.5);

    ctx.restore();
  }

  function drawCafeInterior(ctx, t, blurPx) {
    const time = typeof t === 'number' ? t : 0;
    const blur = typeof blurPx === 'number' ? blurPx : 2;

    // -----------------------------------------------------------------------
    // Layer A: Background Wall, Panels, Clock & Counter (with Depth-of-Field)
    // -----------------------------------------------------------------------
    ctx.save();
    ctx.filter = blur > 0 ? 'blur(' + blur + 'px)' : 'none';
    const pad = blur > 0 ? Math.ceil(blur * 2) : 0;

    // Warm dark-charcoal interior wall
    ctx.fillStyle = '#1A1519';
    ctx.fillRect(-pad, -pad, WIDTH + pad * 2, HEIGHT + pad * 2);

    // Subtle vertical architectural wall paneling
    for (let px = 0; px < WIDTH; px += 96) {
      ctx.fillStyle = px % 192 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.16)';
      ctx.fillRect(px, 0, 4, HEIGHT);
    }

    // Floor baseboard & darker lower floor plane (y: 910..1080)
    const floorGrad = ctx.createLinearGradient(0, 900, 0, HEIGHT);
    floorGrad.addColorStop(0, '#130F13');
    floorGrad.addColorStop(1, '#0B080B');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(-pad, 905, WIDTH + pad * 2, HEIGHT - 905 + pad);

    // Subtle floor reflection pool from window
    const floorLight = ctx.createRadialGradient(800, 940, 40, 800, 960, 560);
    floorLight.addColorStop(0, 'rgba(232, 141, 79, 0.14)');
    floorLight.addColorStop(1, 'rgba(232, 141, 79, 0)');
    ctx.fillStyle = floorLight;
    ctx.fillRect(200, 905, 1200, 175);

    // Minimalist round white-rimmed wall clock (x: 130, y: 210)
    drawWallClock(ctx, 130, 210, 54, time);

    // Kitchen / cafe counter & espresso machine on right (x: 1440..1860, y: 460..920)
    drawCafeCounter(ctx, time);

    ctx.restore();

    // -----------------------------------------------------------------------
    // Layer B: Panoramic 4x2 Window (x: 240..1360, y: 120..740)
    // -----------------------------------------------------------------------
    const winX = 240;
    const winY = 120;
    const winW = 1120;
    const winH = 620;

    // Clipped dusk skyline blurred at blurPx + 5
    ctx.save();
    ctx.beginPath();
    ctx.rect(winX, winY, winW, winH);
    ctx.clip();
    drawDuskSkyline(ctx, time, blur + 5);

    // Subtle interior glass sheen across panes
    const glassGrad = ctx.createLinearGradient(winX, winY, winX + winW, winY + winH);
    glassGrad.addColorStop(0, 'rgba(255, 220, 185, 0.08)');
    glassGrad.addColorStop(0.45, 'rgba(255, 220, 185, 0.01)');
    glassGrad.addColorStop(1, 'rgba(255, 195, 135, 0.06)');
    ctx.fillStyle = glassGrad;
    ctx.fillRect(winX, winY, winW, winH);
    ctx.restore();

    // Crisp dark mullion bars (#120E12) & warm golden rim reflections along inner edges
    ctx.save();
    ctx.filter = blur > 0 ? 'blur(' + Math.max(0, blur * 0.6) + 'px)' : 'none';

    const frameThickness = 18;
    const mullionThick = 12;

    // Outer window frame
    ctx.strokeStyle = '#120E12';
    ctx.lineWidth = frameThickness;
    ctx.strokeRect(winX - frameThickness * 0.5, winY - frameThickness * 0.5, winW + frameThickness, winH + frameThickness);

    // 3 vertical inner mullions (4 columns)
    ctx.fillStyle = '#120E12';
    for (let c = 1; c < 4; c++) {
      const mx = winX + (winW / 4) * c - mullionThick * 0.5;
      ctx.fillRect(mx, winY, mullionThick, winH);
      // Warm golden rim reflection along inner edge
      ctx.fillStyle = 'rgba(244, 178, 110, 0.26)';
      ctx.fillRect(mx - 2, winY, 2, winH);
      ctx.fillStyle = '#120E12';
    }

    // 1 horizontal inner mullion (2 rows)
    const my = winY + winH * 0.5 - mullionThick * 0.5;
    ctx.fillRect(winX, my, winW, mullionThick);
    // Golden rim along top of horizontal mullion & bottom sill
    ctx.fillStyle = 'rgba(244, 178, 110, 0.34)';
    ctx.fillRect(winX, my - 2, winW, 2.5);
    ctx.fillRect(winX, winY + winH - 3, winW, 3);
    ctx.fillRect(winX, winY, 2.5, winH);
    ctx.fillRect(winX + winW - 2.5, winY, 2.5, winH);

    // Window sill ledge
    ctx.fillStyle = '#151014';
    ctx.fillRect(winX - 24, winY + winH + 6, winW + 48, 18);
    ctx.fillStyle = 'rgba(232, 141, 79, 0.2)';
    ctx.fillRect(winX - 24, winY + winH + 6, winW + 48, 2.5);
    ctx.restore();

    // -----------------------------------------------------------------------
    // Layer C: Foreground Overhead Pendant, Warm Light Cone, Table & Chairs
    // (Razor sharp for foreground characters)
    // -----------------------------------------------------------------------
    const tableX = 800;
    const tableY = 775;

    ctx.save();

    // Warm overhead pendant light cone illuminating center table
    const coneGrad = ctx.createRadialGradient(tableX, 110, 12, tableX, 620, 680);
    coneGrad.addColorStop(0.0, 'rgba(255, 214, 148, 0.34)');
    coneGrad.addColorStop(0.38, 'rgba(244, 168, 96, 0.16)');
    coneGrad.addColorStop(0.78, 'rgba(190, 96, 56, 0.05)');
    coneGrad.addColorStop(1.0, 'rgba(18, 14, 18, 0)');
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(tableX - 48, 92);
    ctx.lineTo(tableX + 48, 92);
    ctx.lineTo(tableX + 440, 980);
    ctx.lineTo(tableX - 440, 980);
    ctx.closePath();
    ctx.fill();

    // Pendant cord & minimalist lamp shade
    ctx.strokeStyle = '#0E0B0E';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tableX, 0);
    ctx.lineTo(tableX, 68);
    ctx.stroke();

    ctx.fillStyle = '#141013';
    ctx.beginPath();
    ctx.moveTo(tableX - 20, 62);
    ctx.lineTo(tableX + 20, 62);
    ctx.lineTo(tableX + 56, 98);
    ctx.lineTo(tableX - 56, 98);
    ctx.closePath();
    ctx.fill();

    // Glowing bulb rim inside pendant
    ctx.fillStyle = '#FFE2A8';
    ctx.beginPath();
    ctx.ellipse(tableX, 98, 42, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Two minimalist chairs flanking the round table
    drawMinimalistChair(ctx, 515, 815, true);
    drawMinimalistChair(ctx, 1085, 815, false);

    // Pedestal base (#141013)
    ctx.fillStyle = '#141013';
    ctx.fillRect(tableX - 16, tableY + 14, 32, 232);
    ctx.beginPath();
    ctx.ellipse(tableX, 1024, 128, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    // Subtle warm base highlight
    ctx.fillStyle = 'rgba(244, 174, 112, 0.14)';
    ctx.beginPath();
    ctx.ellipse(tableX, 1018, 116, 12, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // Center round wooden tabletop (#2D1F1D) with warm rim highlight
    ctx.fillStyle = '#1F1514';
    ctx.beginPath();
    ctx.roundRect(tableX - 210, tableY + 4, 420, 22, 10);
    ctx.fill();

    const topSurfaceGrad = ctx.createRadialGradient(tableX, tableY - 4, 24, tableX, tableY, 220);
    topSurfaceGrad.addColorStop(0.0, '#47302A');
    topSurfaceGrad.addColorStop(0.6, '#2D1F1D');
    topSurfaceGrad.addColorStop(1.0, '#221716');
    ctx.fillStyle = topSurfaceGrad;
    ctx.beginPath();
    ctx.roundRect(tableX - 214, tableY - 8, 428, 22, 10);
    ctx.fill();

    // Warm rim highlight along upper table edge
    ctx.fillStyle = 'rgba(255, 206, 146, 0.35)';
    ctx.beginPath();
    ctx.roundRect(tableX - 200, tableY - 8, 400, 3, 2);
    ctx.fill();

    ctx.restore();
  }

  // =========================================================================
  // 3. drawMacroTable(ctx, t) & drawSteamWisps(ctx, originX, originY, t, count)
  // =========================================================================
  function drawSteamWisps(ctx, originX, originY, t, count) {
    const time = typeof t === 'number' ? t : 0;
    const wispCount = typeof count === 'number' && count > 0 ? Math.floor(count) : 4;

    ctx.save();
    ctx.lineCap = 'round';

    for (let i = 0; i < wispCount; i++) {
      const phase = i * 1.65;
      const cycle = (time * 0.38 + i / wispCount) % 1; // 0..1 rising lifecycle
      const riseHeight = 145 + (i % 2) * 35;

      const x0 = originX + (i - (wispCount - 1) * 0.5) * 14 + Math.sin(time * 1.4 + phase) * 5;
      const y0 = originY - cycle * 14;

      const x1 = x0 + Math.sin(time * 1.9 + phase + 0.8) * 26;
      const y1 = y0 - riseHeight * 0.34;

      const x2 = x0 - Math.cos(time * 1.5 + phase + 1.6) * 30;
      const y2 = y0 - riseHeight * 0.7;

      const x3 = x0 + Math.sin(time * 1.2 + phase + 2.5) * 24;
      const y3 = y0 - riseHeight;

      const fadeLifecycle = Math.sin(cycle * Math.PI); // Smooth fade-in and fade-out
      const alphaTop = 0;
      const alphaMid = 0.28 * fadeLifecycle;
      const alphaBot = 0.14 * fadeLifecycle;

      const steamGrad = ctx.createLinearGradient(x0, y0, x3, y3);
      steamGrad.addColorStop(0.0, 'rgba(255, 244, 230, ' + alphaBot.toFixed(3) + ')');
      steamGrad.addColorStop(0.45, 'rgba(255, 240, 224, ' + alphaMid.toFixed(3) + ')');
      steamGrad.addColorStop(1.0, 'rgba(255, 236, 215, ' + alphaTop.toFixed(3) + ')');

      ctx.strokeStyle = steamGrad;
      ctx.lineWidth = 7 + Math.sin(time * 1.7 + phase) * 2.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
      ctx.stroke();

      // Inner brighter wispy filament
      ctx.lineWidth = 2.6;
      ctx.strokeStyle =
        'rgba(255, 250, 242, ' + (alphaMid * 0.65).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(x0 + 2, y0);
      ctx.bezierCurveTo(x1 - 5, y1, x2 + 6, y2, x3 - 3, y3);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawMacroTable(ctx, t) {
    const time = typeof t === 'number' ? t : 0;

    // 1. Heavy photographic bokeh background (blurPx = 16)
    drawDuskSkyline(ctx, time, 16);

    // Out-of-focus window mullions & warm bokeh highlights in macro background
    ctx.save();
    ctx.filter = 'blur(16px)';
    ctx.fillStyle = 'rgba(18, 12, 16, 0.85)';
    ctx.fillRect(0, 0, WIDTH, 90);
    ctx.fillRect(380, 0, 42, 720);
    ctx.fillRect(1020, 0, 42, 720);
    ctx.fillRect(1580, 0, 42, 720);
    ctx.fillRect(0, 340, WIDTH, 36);

    // Warm golden out-of-focus pendant & city glow orbs
    const macroOrb1 = ctx.createRadialGradient(420, 220, 10, 420, 220, 170);
    macroOrb1.addColorStop(0, 'rgba(255, 215, 145, 0.42)');
    macroOrb1.addColorStop(1, 'rgba(255, 215, 145, 0)');
    ctx.fillStyle = macroOrb1;
    ctx.beginPath();
    ctx.arc(420, 220, 170, 0, Math.PI * 2);
    ctx.fill();

    const macroOrb2 = ctx.createRadialGradient(1380, 290, 10, 1380, 290, 210);
    macroOrb2.addColorStop(0, 'rgba(244, 165, 95, 0.36)');
    macroOrb2.addColorStop(1, 'rgba(244, 165, 95, 0)');
    ctx.fillStyle = macroOrb2;
    ctx.beginPath();
    ctx.arc(1380, 290, 210, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Soft atmospheric vignette in upper backdrop
    const bgShade = ctx.createLinearGradient(0, 0, 0, 700);
    bgShade.addColorStop(0, 'rgba(14, 10, 16, 0.36)');
    bgShade.addColorStop(1, 'rgba(14, 10, 16, 0.12)');
    ctx.fillStyle = bgShade;
    ctx.fillRect(0, 0, WIDTH, 700);

    // 2. Razor-sharp foreground dark walnut tabletop (y: 690..1080)
    ctx.save();

    // Back horizon edge shadow/depth
    const tableGrad = ctx.createLinearGradient(0, 690, 0, HEIGHT);
    tableGrad.addColorStop(0.0, '#36231F');
    tableGrad.addColorStop(0.14, '#2A1B18');
    tableGrad.addColorStop(0.58, '#1D1312');
    tableGrad.addColorStop(1.0, '#110B0B');
    ctx.fillStyle = tableGrad;
    ctx.fillRect(0, 690, WIDTH, HEIGHT - 690);

    // Warm overhead light reflection pool on tabletop
    const poolGrad = ctx.createRadialGradient(960, 825, 40, 960, 845, 760);
    poolGrad.addColorStop(0.0, 'rgba(255, 204, 140, 0.24)');
    poolGrad.addColorStop(0.42, 'rgba(232, 148, 86, 0.11)');
    poolGrad.addColorStop(1.0, 'rgba(28, 18, 16, 0)');
    ctx.fillStyle = poolGrad;
    ctx.fillRect(0, 690, WIDTH, HEIGHT - 690);

    // Subtle walnut surface wood grain
    ctx.lineCap = 'round';
    for (let i = 0; i < WOOD_GRAIN_LINES.length; i++) {
      const g = WOOD_GRAIN_LINES[i];
      ctx.strokeStyle = 'rgba(14, 8, 8, ' + g.alpha.toFixed(3) + ')';
      ctx.lineWidth = g.thickness;
      ctx.beginPath();
      ctx.moveTo(g.xStart, g.y);
      ctx.quadraticCurveTo(960, g.y + g.curve, g.xEnd, g.y + g.curve * 0.4);
      ctx.stroke();
    }

    // Crisp rim highlight along back edge of walnut table
    const edgeRim = ctx.createLinearGradient(0, 690, WIDTH, 690);
    edgeRim.addColorStop(0.0, 'rgba(255, 200, 140, 0.08)');
    edgeRim.addColorStop(0.5, 'rgba(255, 212, 158, 0.36)');
    edgeRim.addColorStop(1.0, 'rgba(255, 200, 140, 0.08)');
    ctx.fillStyle = edgeRim;
    ctx.fillRect(0, 690, WIDTH, 3);

    ctx.restore();
  }

  // =========================================================================
  // 4. drawRooftopSunset(ctx, t)
  // =========================================================================
  function drawRooftopSunset(ctx, t) {
    const time = typeof t === 'number' ? t : 0;

    // 1. Dusk skyline behind rooftop (blurPx = 3)
    drawDuskSkyline(ctx, time, 3);

    // 2. Atmospheric sunset lens flare aligned with low sun (1120, 605)
    ctx.save();
    const sunX = 1120 + Math.sin(time * 0.08) * 6;
    const sunY = 605;

    // Horizontal warm anamorphic streak
    const streakGrad = ctx.createLinearGradient(sunX - 520, sunY, sunX + 520, sunY);
    streakGrad.addColorStop(0, 'rgba(255, 198, 128, 0)');
    streakGrad.addColorStop(0.5, 'rgba(255, 224, 168, 0.24)');
    streakGrad.addColorStop(1, 'rgba(255, 198, 128, 0)');
    ctx.fillStyle = streakGrad;
    ctx.fillRect(sunX - 520, sunY - 4, 1040, 8);

    // Soft secondary flare rings along optical axis
    const flareSpecs = [
      { tAxis: 0.28, r: 34, color: 'rgba(255, 194, 118, 0.14)' },
      { tAxis: 0.52, r: 58, color: 'rgba(232, 126, 86, 0.10)' },
      { tAxis: 0.78, r: 22, color: 'rgba(255, 230, 175, 0.16)' },
    ];
    const centerX = WIDTH * 0.5;
    const centerY = HEIGHT * 0.5;
    for (let i = 0; i < flareSpecs.length; i++) {
      const f = flareSpecs[i];
      const fx = sunX + (centerX - sunX) * f.tAxis * 1.9;
      const fy = sunY + (centerY - sunY) * f.tAxis * 1.9;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(fx, fy, f.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Floating golden dust motes
    for (let i = 0; i < DUST_MOTES.length; i++) {
      const m = DUST_MOTES[i];
      const mx = ((m.x + time * m.vx) % WIDTH + WIDTH) % WIDTH;
      const my = ((m.y + time * m.vy) % 860 + 860) % 860 + 60;
      const shimmer = 0.55 + 0.45 * Math.sin(time * 2.1 + m.phase);
      ctx.fillStyle = 'rgba(255, 214, 146, ' + (m.alpha * shimmer).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(mx, my, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. Razor-sharp foreground steel safety railing & concrete parapet wall (y: 780..1080)
    ctx.save();

    // Steel safety railing (y: 780..885)
    ctx.strokeStyle = '#141016';
    ctx.fillStyle = '#141016';

    // Top cylindrical handrail
    ctx.fillRect(0, 780, WIDTH, 14);
    // Warm golden sunset rim highlight on top handrail
    ctx.fillStyle = 'rgba(248, 178, 108, 0.45)';
    ctx.fillRect(0, 780, WIDTH, 3);

    // Mid horizontal rail
    ctx.fillStyle = '#120E14';
    ctx.fillRect(0, 830, WIDTH, 8);
    ctx.fillStyle = 'rgba(248, 178, 108, 0.22)';
    ctx.fillRect(0, 830, WIDTH, 2);

    // Vertical railing stanchions
    for (let rx = 70; rx < WIDTH; rx += 220) {
      ctx.fillStyle = '#120E14';
      ctx.fillRect(rx, 780, 12, 112);
      // Warm rim edge facing the sun
      ctx.fillStyle = 'rgba(248, 178, 108, 0.25)';
      ctx.fillRect(rx + (rx < sunX ? 9 : 0), 780, 3, 106);
      // Base flange
      ctx.fillStyle = '#0D0A0E';
      ctx.fillRect(rx - 8, 878, 28, 10);
    }

    // Parapet concrete cap & wall (y: 886..1080)
    ctx.fillStyle = '#1A131A';
    ctx.fillRect(0, 886, WIDTH, 28);
    // Cap rim highlight
    ctx.fillStyle = 'rgba(232, 148, 92, 0.30)';
    ctx.fillRect(0, 886, WIDTH, 3.5);

    const wallGrad = ctx.createLinearGradient(0, 914, 0, HEIGHT);
    wallGrad.addColorStop(0.0, '#140F15');
    wallGrad.addColorStop(1.0, '#0A070B');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 914, WIDTH, HEIGHT - 914);

    // Subtle concrete expansion joints on parapet wall
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    for (let jx = 290; jx < WIDTH; jx += 440) {
      ctx.fillRect(jx, 914, 4, HEIGHT - 914);
    }

    ctx.restore();
  }

  // =========================================================================
  // Public API
  // =========================================================================
  global.IntroBG = {
    drawDuskSkyline,
    drawCafeInterior,
    drawMacroTable,
    drawSteamWisps,
    drawRooftopSunset,
  };
})(window);
