(function () {
  const W = 1920;
  const H = 1080;
  const TOTAL_DURATION = 18.5;

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - clamp01(t), 3);
  }

  function easeInOutCubic(t) {
    const x = clamp01(t);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  function hash(n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return s - Math.floor(s);
  }

  // Safe rounded-rectangle path primitive using arcTo (never calls native ctx.roundRect)
  function roundRect(ctx, x, y, w, h, r) {
    const rad = Math.min(Math.max(0, r), Math.abs(w) * 0.5, Math.abs(h) * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  // =========================================================================
  // PROCEDURAL WEB AUDIO SFX (Finger Snap & Apple Table Thud)
  // =========================================================================
  let audioCtx = null;

  function unlockAudio() {
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      if (!audioCtx) audioCtx = new AudioCtor();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(function () {});
      }
    } catch (_) {}
  }

  function playSnapSFX() {
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const bufSize = Math.floor(audioCtx.sampleRate * 0.05);
      const buffer = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.16));
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.Q.setValueAtTime(2.6, now);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start(now);

      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1750, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.036);
      oscGain.gain.setValueAtTime(0.35, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.042);
    } catch (_) {}
  }

  function playThudSFX(vol) {
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.11);
      gain.gain.setValueAtTime(vol || 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (_) {}
  }

  // =========================================================================
  // SHARED BACKGROUNDS, PROPS & CHARACTER RIGS
  // =========================================================================
  function drawTwilightSkyAndCity(ctx, t, horizonY) {
    const sky = ctx.createLinearGradient(0, 0, 0, horizonY + 120);
    sky.addColorStop(0, '#131126');
    sky.addColorStop(0.42, '#3D1E3B');
    sky.addColorStop(0.76, '#C85A32');
    sky.addColorStop(1, '#F59E0B');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizonY + 120);

    // Low glowing sun
    const sunX = 1120;
    const sunY = horizonY - 36;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 18, sunX, sunY, 480);
    sunGlow.addColorStop(0, 'rgba(255, 245, 210, 0.96)');
    sunGlow.addColorStop(0.18, 'rgba(253, 186, 116, 0.72)');
    sunGlow.addColorStop(0.5, 'rgba(200, 90, 50, 0.25)');
    sunGlow.addColorStop(1, 'rgba(19, 17, 38, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 480, 0, Math.PI * 2);
    ctx.fill();

    // Distant city skyline silhouettes
    const layers = [
      { count: 24, minH: 85, maxH: 225, fill: 'rgba(34, 18, 38, 0.65)', lights: false },
      { count: 16, minH: 75, maxH: 280, fill: 'rgba(16, 13, 24, 0.94)', lights: true }
    ];

    for (let l = 0; l < layers.length; l++) {
      const layer = layers[l];
      const step = W / layer.count;
      for (let i = 0; i < layer.count; i++) {
        const bw = step * (0.76 + hash(i + l * 31) * 0.48);
        const bh = lerp(layer.minH, layer.maxH, hash(i * 3.7 + l * 71));
        const bx = i * step - 12;
        const by = horizonY - bh;

        ctx.fillStyle = layer.fill;
        ctx.fillRect(bx, by, bw, bh + 160);

        if (layer.lights) {
          const cols = Math.max(2, Math.floor(bw / 24));
          const rows = Math.max(3, Math.floor(bh / 26));
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const seed = hash(i * 113 + r * 19 + c * 7);
              if (seed > 0.64) {
                const twinkle = 0.45 + 0.3 * Math.sin(t * 1.4 + seed * 16);
                ctx.fillStyle = seed > 0.85
                  ? 'rgba(254, 240, 138, ' + twinkle + ')'
                  : 'rgba(251, 146, 60, ' + (twinkle * 0.75) + ')';
                ctx.fillRect(bx + 9 + c * 20, by + 12 + r * 24, 9, 12);
              }
            }
          }
        }
      }
    }
  }

  function drawBokehLights(ctx, t, count, seedBase, strength) {
    for (let i = 0; i < count; i++) {
      const s1 = hash(i * 13.7 + seedBase);
      const s2 = hash(i * 29.3 + seedBase);
      const s3 = hash(i * 47.1 + seedBase);
      const x = s1 * W + Math.sin(t * 0.35 + i) * 20;
      const y = s2 * (H * 0.78) + Math.cos(t * 0.25 + i * 1.5) * 14;
      const r = 38 + s3 * 105;

      const palette = [
        '253, 186, 116',
        '250, 204, 21',
        '255, 87, 51',
        '167, 139, 250'
      ];
      const rgb = palette[i % palette.length];
      const a = (0.14 + s1 * 0.22) * strength;

      const g = ctx.createRadialGradient(x, y, r * 0.14, x, y, r);
      g.addColorStop(0, 'rgba(' + rgb + ', ' + a + ')');
      g.addColorStop(0.7, 'rgba(' + rgb + ', ' + (a * 0.6) + ')');
      g.addColorStop(1, 'rgba(' + rgb + ', 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawApple(ctx, x, y, r, opts) {
    const o = opts || {};
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);

    if (o.glow) {
      const aura = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, r * 2.4);
      aura.addColorStop(0, 'rgba(255, 87, 51, 0.58)');
      aura.addColorStop(1, 'rgba(255, 87, 51, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.12, 0, 0, r * 1.2);
    grad.addColorStop(0, '#FF6B52');
    grad.addColorStop(0.55, '#DC2626');
    grad.addColorStop(1, '#7F1D1D');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.78);
    ctx.bezierCurveTo(r * 0.65, -r * 1.12, r * 1.18, -r * 0.35, r * 0.86, r * 0.52);
    ctx.bezierCurveTo(r * 0.56, r * 1.12, r * 0.14, r * 0.96, 0, r * 0.86);
    ctx.bezierCurveTo(-r * 0.14, r * 0.96, -r * 0.56, r * 1.12, -r * 0.86, r * 0.52);
    ctx.bezierCurveTo(-r * 1.18, -r * 0.35, -r * 0.65, -r * 1.12, 0, -r * 0.78);
    ctx.closePath();
    ctx.fill();

    if (o.rimLight) {
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.8)';
      ctx.lineWidth = Math.max(2, r * 0.08);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.44)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.34, -r * 0.28, r * 0.18, r * 0.32, -0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = Math.max(2.5, r * 0.11);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.72);
    ctx.quadraticCurveTo(r * 0.12, -r * 1.15, r * 0.26, -r * 1.24);
    ctx.stroke();

    ctx.fillStyle = '#4ADE80';
    ctx.beginPath();
    ctx.ellipse(r * 0.34, -r * 1.02, r * 0.32, r * 0.14, -0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawArm2Seg(ctx, sx, sy, ex, ey, hx, hy, color, width, handR, rimColor) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (rimColor) {
      ctx.strokeStyle = rimColor;
      ctx.lineWidth = width + 5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.lineTo(hx, hy);
      ctx.stroke();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.lineTo(hx, hy);
    ctx.stroke();

    ctx.fillStyle = '#0B0D12';
    ctx.beginPath();
    ctx.arc(hx, hy, handR, 0, Math.PI * 2);
    ctx.fill();
    if (rimColor) {
      ctx.strokeStyle = rimColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEyes(ctx, cx, cy, eyeW, eyeH, spacing, opts) {
    const o = opts || {};
    const lookX = o.lookX || 0;
    const lookY = o.lookY || 0;
    const blink = o.blink || 0;
    const scaleY = Math.max(0.08, 1 - blink);

    const sides = [-1, 1];
    for (let i = 0; i < sides.length; i++) {
      const ex = cx + sides[i] * spacing;
      ctx.save();
      ctx.translate(ex, cy);
      ctx.scale(1, scaleY);

      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.ellipse(0, 0, eyeW, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();

      if (scaleY > 0.2) {
        const px = lookX * eyeW * 0.32;
        const py = lookY * eyeH * 0.28;
        ctx.fillStyle = '#090A0F';
        ctx.beginPath();
        ctx.ellipse(px, py, eyeW * 0.44, eyeH * 0.44, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(px - eyeW * 0.14, py - eyeH * 0.16, eyeW * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Golden-yellow baseball cap (#FACC15) worn BACKWARDS (brim extends to brimSide)
  function drawBackwardsYellowCap(ctx, cx, cy, headR, brimSide) {
    // brimSide: +1 means brim points right (character faces left); -1 means brim points left (character faces right)
    ctx.save();
    ctx.translate(cx, cy);

    const crownGrad = ctx.createLinearGradient(0, -headR * 1.15, 0, -headR * 0.1);
    crownGrad.addColorStop(0, '#FDE047');
    crownGrad.addColorStop(1, '#EAB308');
    ctx.fillStyle = crownGrad;
    ctx.beginPath();
    ctx.arc(0, -headR * 0.14, headR * 1.03, Math.PI * 1.03, Math.PI * 1.97);
    ctx.quadraticCurveTo(0, -headR * 0.34, -headR * 1.02, -headR * 0.14);
    ctx.closePath();
    ctx.fill();

    // Seam & top button
    ctx.strokeStyle = 'rgba(161, 98, 7, 0.45)';
    ctx.lineWidth = Math.max(2, headR * 0.03);
    ctx.beginPath();
    ctx.moveTo(0, -headR * 1.14);
    ctx.quadraticCurveTo(-brimSide * headR * 0.2, -headR * 0.7, -brimSide * headR * 0.08, -headR * 0.24);
    ctx.stroke();

    ctx.fillStyle = '#CA8A04';
    ctx.beginPath();
    ctx.arc(0, -headR * 1.17, headR * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Backwards cap strap cutout on front/side + protruding rear brim
    const d = brimSide;
    ctx.fillStyle = '#EAB308';
    ctx.beginPath();
    ctx.moveTo(d * headR * 0.45, -headR * 0.22);
    ctx.quadraticCurveTo(d * headR * 1.12, -headR * 0.36, d * headR * 1.48, -headR * 0.08);
    ctx.quadraticCurveTo(d * headR * 1.05, -headR * 0.01, d * headR * 0.45, -headR * 0.12);
    ctx.closePath();
    ctx.fill();

    // Cap adjuster strap arch on forehead side
    ctx.fillStyle = '#0B0D12';
    ctx.beginPath();
    ctx.arc(-d * headR * 0.1, -headR * 0.14, headR * 0.26, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // =========================================================================
  // 5-ACT SCENES
  // =========================================================================

  // ACT 1 (0.0s – 4.2s): Rooftop Dusk Silhouette + Slow Zoom-In
  function drawAct1_Rooftop(ctx, t) {
    ctx.save();
    const zoom = 1 + 0.09 * easeInOutCubic(t / 4.2);
    ctx.translate(W * 0.46, H * 0.48);
    ctx.scale(zoom, zoom);
    ctx.translate(-W * 0.46, -H * 0.48);

    drawTwilightSkyAndCity(ctx, t, 745);

    // Foreground rooftop parapet & railing
    ctx.fillStyle = '#09090D';
    ctx.fillRect(-30, 845, W + 60, 260);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.52)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-30, 845);
    ctx.lineTo(W + 30, 845);
    ctx.stroke();

    ctx.strokeStyle = '#0D0E14';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-30, 725);
    ctx.lineTo(W + 30, 725);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(253, 186, 116, 0.46)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-30, 720);
    ctx.lineTo(W + 30, 720);
    ctx.stroke();

    for (let px = 80; px < W; px += 220) {
      ctx.fillStyle = '#0D0E14';
      ctx.fillRect(px, 725, 12, 122);
    }

    // --- MINH QUÂN (Left-center, Vermilion Coral #FF5733 capsule torso, holding apple) ---
    const mqX = 685;
    const mqHeadY = 512;
    const rimCol = 'rgba(251, 191, 36, 0.85)';

    // Dark legs
    ctx.strokeStyle = '#07080C';
    ctx.lineWidth = 24;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mqX - 20, 775);
    ctx.lineTo(mqX - 32, 980);
    ctx.moveTo(mqX + 24, 775);
    ctx.lineTo(mqX + 38, 980);
    ctx.stroke();

    // Capsule torso (#FF5733 shaded by dusk backlighting with golden rim)
    ctx.fillStyle = '#6B2118';
    roundRect(ctx, mqX - 56, 598, 112, 192, 46);
    ctx.fill();
    const mqShirtGrad = ctx.createLinearGradient(mqX - 56, 600, mqX + 56, 780);
    mqShirtGrad.addColorStop(0, 'rgba(255, 87, 51, 0.35)');
    mqShirtGrad.addColorStop(1, '#FF5733');
    ctx.fillStyle = mqShirtGrad;
    roundRect(ctx, mqX - 56, 598, 112, 192, 46);
    ctx.fill();
    ctx.strokeStyle = rimCol;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Resting left arm
    drawArm2Seg(ctx, mqX - 48, 632, mqX - 88, 718, mqX - 66, 792, '#7C2D12', 24, 14, 'rgba(251,191,36,0.45)');

    // Raised right arm holding glossy red apple toward dusk sky
    const handX = mqX + 195;
    const handY = 418 + Math.sin(t * 1.7) * 7;
    drawArm2Seg(ctx, mqX + 46, 628, mqX + 132, 558, handX, handY, '#C2410C', 24, 15, rimCol);

    drawApple(ctx, handX + 10, handY - 34, 34, { glow: true, rimLight: true, rot: -0.14 });

    // Matte-black round head with golden rim
    ctx.fillStyle = '#0B0D12';
    ctx.beginPath();
    ctx.arc(mqX + 8, mqHeadY, 86, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rimCol;
    ctx.lineWidth = 4;
    ctx.stroke();

    const mqBlink = (t % 3.4) > 3.25 ? 0.9 : 0;
    drawEyes(ctx, mqX + 38, mqHeadY - 8, 14, 21, 20, { lookX: 0.55, lookY: -0.35, blink: mqBlink });

    // --- TUẤN MINH (Standing beside Minh Quân at right, Cobalt #2B59C3 + Backwards Yellow Cap) ---
    const tmX = 1140;
    const tmHeadY = 526;

    ctx.strokeStyle = '#07080C';
    ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.moveTo(tmX - 22, 780);
    ctx.lineTo(tmX - 32, 980);
    ctx.moveTo(tmX + 22, 780);
    ctx.lineTo(tmX + 34, 980);
    ctx.stroke();

    ctx.fillStyle = '#1E3A8A';
    roundRect(ctx, tmX - 54, 610, 108, 184, 44);
    ctx.fill();
    const tmShirtGrad = ctx.createLinearGradient(tmX - 54, 610, tmX + 54, 780);
    tmShirtGrad.addColorStop(0, '#2B59C3');
    tmShirtGrad.addColorStop(1, 'rgba(30, 58, 138, 0.72)');
    ctx.fillStyle = tmShirtGrad;
    roundRect(ctx, tmX - 54, 610, 108, 184, 44);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.72)';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    drawArm2Seg(ctx, tmX - 44, 642, tmX - 74, 725, tmX - 56, 792, '#2B59C3', 23, 14, 'rgba(251,191,36,0.6)');
    drawArm2Seg(ctx, tmX + 44, 642, tmX + 78, 725, tmX + 60, 792, '#1E3A8A', 23, 14, 'rgba(251,191,36,0.35)');

    ctx.fillStyle = '#0B0D12';
    ctx.beginPath();
    ctx.arc(tmX - 6, tmHeadY, 82, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.78)';
    ctx.lineWidth = 4;
    ctx.stroke();

    drawBackwardsYellowCap(ctx, tmX - 6, tmHeadY - 8, 83, 1);
    drawEyes(ctx, tmX - 34, tmHeadY - 4, 14, 21, 20, { lookX: -0.65, lookY: -0.35, blink: 0 });

    ctx.restore();
  }

  // ACT 2 (4.2s – 8.8s): Macro Table Close-Up & Zero-Gravity Anomaly
  function drawAct2_TableMacro(ctx, localT) {
    ctx.save();

    // Warm blurred bokeh interior backdrop
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#131020');
    bg.addColorStop(0.55, '#2A1A2D');
    bg.addColorStop(1, '#120C0A');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawBokehLights(ctx, localT, 30, 120, 1.2);

    // Dark wooden table surface
    const tableY = 740;
    const wood = ctx.createLinearGradient(0, tableY, 0, H);
    wood.addColorStop(0, '#3D2419');
    wood.addColorStop(0.2, '#24140E');
    wood.addColorStop(1, '#0F0907');
    ctx.fillStyle = wood;
    ctx.fillRect(0, tableY, W, H - tableY);

    ctx.fillStyle = 'rgba(253, 186, 116, 0.28)';
    ctx.fillRect(0, tableY, W, 5);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.lineWidth = 3;
    for (let g = 0; g < 8; g++) {
      const gy = tableY + 38 + g * 38;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(640, gy - 12, 1280, gy + 14, W, gy - 6);
      ctx.stroke();
    }

    // Coral-sleeved arm reaching from left
    drawArm2Seg(ctx, -40, 885, 255, 815, 455, 762, '#FF5733', 76, 42, 'rgba(253,186,116,0.4)');

    // Tipped white ceramic coffee mug on table
    ctx.save();
    ctx.translate(680, 745);
    ctx.rotate(-1.18);

    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.arc(0, -106, 44, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();

    const mugGrad = ctx.createLinearGradient(-72, -195, 72, 0);
    mugGrad.addColorStop(0, '#FFFFFF');
    mugGrad.addColorStop(0.65, '#E5E7EB');
    mugGrad.addColorStop(1, '#9CA3AF');
    ctx.fillStyle = mugGrad;
    roundRect(ctx, -72, -195, 144, 195, 16);
    ctx.fill();

    ctx.fillStyle = '#3E2216';
    ctx.beginPath();
    ctx.ellipse(0, -192, 66, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#F8FAFC';
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.restore();

    // Spherical brown coffee droplets & steam rising upward in zero gravity
    const rise = easeOutCubic(localT / 3.8) * 145;
    for (let s = 0; s < 5; s++) {
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.16 + s * 0.04) + ')';
      ctx.lineWidth = 9 - s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const sx = 825 + s * 36;
      const sy = 640 - ((localT * 42 + s * 40) % 210);
      ctx.moveTo(sx, sy + 115);
      ctx.bezierCurveTo(sx - 30, sy + 70, sx + 34, sy + 35, sx, sy);
      ctx.stroke();
    }

    const drops = [
      { x: 855, y: 675, r: 17, spd: 1.4 },
      { x: 935, y: 610, r: 26, spd: 1.1 },
      { x: 1020, y: 650, r: 14, spd: 1.7 },
      { x: 970, y: 530, r: 21, spd: 1.3 },
      { x: 1090, y: 580, r: 12, spd: 1.9 },
      { x: 890, y: 545, r: 10, spd: 1.6 }
    ];

    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      const dx = Math.cos(localT * 0.9 + i) * 9;
      const dy = -rise * (0.55 + i * 0.1) + Math.sin(localT * d.spd + i) * 12;
      const dg = ctx.createRadialGradient(d.x + dx - d.r * 0.3, d.y + dy - d.r * 0.3, d.r * 0.1, d.x + dx, d.y + dy, d.r);
      dg.addColorStop(0, '#D97706');
      dg.addColorStop(0.5, '#5C301B');
      dg.addColorStop(1, '#27120A');
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(d.x + dx, d.y + dy, d.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.arc(d.x + dx - d.r * 0.32, d.y + dy - d.r * 0.32, d.r * 0.24, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floating red apple drifting upward
    const appleX = 1295;
    const appleY = 635 - rise * 1.15 + Math.sin(localT * 2.1) * 18;
    drawApple(ctx, appleX, appleY, 64, { glow: true, rimLight: true, rot: Math.sin(localT * 1.3) * 0.15 });

    // Monospace HUD Pointer Line + Badge ("GIA TỐC TRỌNG TRƯỜNG: g = 0.00 m/s²")
    const boxX = 1095;
    const boxY = 185;

    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(appleX, appleY, 82 + Math.sin(localT * 4) * 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(appleX - 58, appleY - 58);
    ctx.lineTo(boxX + 180, boxY + 56);
    ctx.stroke();

    ctx.fillStyle = 'rgba(11, 13, 18, 0.86)';
    roundRect(ctx, boxX, boxY, 595, 56, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.78)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#00E5FF';
    ctx.font = '700 20px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('GIA TỐC TRỌNG TRƯỜNG: g = 0.00 m/s²', boxX + 22, boxY + 29);

    ctx.restore();
  }

  // ACT 3 (8.8s – 12.2s): Extreme Close-Up Reaction (Tuấn Minh)
  function drawAct3_CloseUp(ctx, localT) {
    ctx.save();

    const bg = ctx.createRadialGradient(960, 460, 80, 960, 540, 1100);
    bg.addColorStop(0, '#33203B');
    bg.addColorStop(0.55, '#1D1426');
    bg.addColorStop(1, '#09090D');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawBokehLights(ctx, localT, 32, 310, 1.35);

    // Cobalt Blue collar at bottom
    ctx.fillStyle = '#2B59C3';
    ctx.beginPath();
    ctx.ellipse(960, 1075, 345, 165, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    const headX = 960 + Math.sin(localT * 1.5) * 6;
    const headY = 600 + Math.cos(localT * 1.2) * 5;
    const headR = 278;

    const rim = ctx.createRadialGradient(headX, headY, headR * 0.86, headX, headY, headR * 1.15);
    rim.addColorStop(0, 'rgba(251, 191, 36, 0.5)');
    rim.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(headX, headY, headR * 1.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0B0D12';
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 186, 116, 0.55)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Backwards golden-yellow baseball cap (#FACC15)
    drawBackwardsYellowCap(ctx, headX, headY - 24, headR * 1.01, 1);

    // Eyes widening (1.38x) in shock
    const widen = lerp(1.0, 1.38, easeOutCubic(localT / 0.45));
    drawEyes(ctx, headX - 10, headY + 14, 42 * widen, 60 * widen, 96, {
      lookX: -0.2 + Math.sin(localT * 2.2) * 0.14,
      lookY: -0.28,
      blink: 0
    });

    ctx.restore();
  }

  // ACT 4 (12.2s – 15.8s): Indoor Window Two-Shot & Finger Snap at 13.4s
  function drawAct4_WindowTwoShot(ctx, t, localT) {
    ctx.save();

    ctx.fillStyle = '#0D0E14';
    ctx.fillRect(0, 0, W, H);

    // Multi-pane window overlooking dusk city
    const winX = 210;
    const winY = 95;
    const winW = 1500;
    const winH = 665;

    ctx.save();
    roundRect(ctx, winX, winY, winW, winH, 16);
    ctx.clip();
    drawTwilightSkyAndCity(ctx, t, winY + winH - 95);
    const sheen = ctx.createLinearGradient(winX, winY, winX + winW, winY + winH);
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    sheen.addColorStop(1, 'rgba(253, 186, 116, 0.06)');
    ctx.fillStyle = sheen;
    ctx.fillRect(winX, winY, winW, winH);
    ctx.restore();

    ctx.strokeStyle = '#181922';
    ctx.lineWidth = 14;
    roundRect(ctx, winX, winY, winW, winH, 16);
    ctx.stroke();

    ctx.lineWidth = 10;
    for (let c = 1; c < 4; c++) {
      const mx = winX + (winW / 4) * c;
      ctx.beginPath();
      ctx.moveTo(mx, winY);
      ctx.lineTo(mx, winY + winH);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(winX, winY + winH * 0.56);
    ctx.lineTo(winX + winW, winY + winH * 0.56);
    ctx.stroke();

    // Floor
    const floorGrad = ctx.createLinearGradient(0, 760, 0, H);
    floorGrad.addColorStop(0, '#14131B');
    floorGrad.addColorStop(1, '#08080C');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 760, W, H - 760);

    // Round wooden table
    const tableX = 960;
    const tableY = 740;
    ctx.fillStyle = '#141115';
    ctx.fillRect(tableX - 18, tableY + 12, 36, 225);
    ctx.beginPath();
    ctx.ellipse(tableX, 975, 130, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    const topGrad = ctx.createLinearGradient(tableX - 245, tableY, tableX + 245, tableY);
    topGrad.addColorStop(0, '#3D251B');
    topGrad.addColorStop(0.5, '#593627');
    topGrad.addColorStop(1, '#2D1A12');
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.ellipse(tableX, tableY, 248, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 186, 116, 0.28)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // White mug on table
    ctx.fillStyle = '#E5E7EB';
    ctx.fillRect(tableX - 122, tableY - 34, 34, 34);
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(tableX - 124, tableY - 17, 10, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();

    // --- MINH QUÂN (Left) ---
    const mqX = 615;
    const mqHeadY = 530;
    ctx.fillStyle = '#1A1B24';
    ctx.fillRect(mqX - 48, 795, 96, 18);
    ctx.fillRect(mqX - 8, 813, 16, 155);
    ctx.fillRect(mqX - 44, 964, 88, 10);

    ctx.strokeStyle = '#090A0F';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mqX + 18, 780);
    ctx.lineTo(mqX + 95, 798);
    ctx.lineTo(mqX + 106, 964);
    ctx.moveTo(mqX - 10, 780);
    ctx.lineTo(mqX + 60, 804);
    ctx.lineTo(mqX + 68, 964);
    ctx.stroke();

    ctx.fillStyle = '#FF5733';
    roundRect(ctx, mqX - 46, 616, 94, 178, 38);
    ctx.fill();

    // Snap arm lifts right up to 13.4s
    const snapHandX = mqX + 195;
    const snapHandY = t >= 13.4 ? 610 : 624 - Math.sin(localT * 4) * 8;
    drawArm2Seg(ctx, mqX + 36, 646, mqX + 120, 684, snapHandX, snapHandY, '#FF5733', 24, 14, null);

    ctx.fillStyle = '#0B0D12';
    ctx.beginPath();
    ctx.arc(mqX + 4, mqHeadY, 84, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 186, 116, 0.48)';
    ctx.lineWidth = 3;
    ctx.stroke();
    drawEyes(ctx, mqX + 34, mqHeadY - 4, 15, 22, 22, { lookX: 0.45, lookY: -0.08, blink: 0 });

    // --- TUẤN MINH (Right) ---
    const tmX = 1305;
    const tmHeadY = 528;
    ctx.fillStyle = '#1A1B24';
    ctx.fillRect(tmX - 48, 795, 96, 18);
    ctx.fillRect(tmX - 8, 813, 16, 155);
    ctx.fillRect(tmX - 44, 964, 88, 10);

    ctx.strokeStyle = '#090A0F';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(tmX - 18, 780);
    ctx.lineTo(tmX - 95, 798);
    ctx.lineTo(tmX - 106, 964);
    ctx.moveTo(tmX + 10, 780);
    ctx.lineTo(tmX - 60, 804);
    ctx.lineTo(tmX - 68, 964);
    ctx.stroke();

    ctx.fillStyle = '#2B59C3';
    roundRect(ctx, tmX - 48, 616, 96, 178, 38);
    ctx.fill();

    drawArm2Seg(ctx, tmX - 36, 646, tmX - 115, 684, tmX - 178, 610, '#2B59C3', 24, 14, null);

    ctx.fillStyle = '#0B0D12';
    ctx.beginPath();
    ctx.arc(tmX - 4, tmHeadY, 84, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 186, 116, 0.48)';
    ctx.lineWidth = 3;
    ctx.stroke();

    drawBackwardsYellowCap(ctx, tmX - 4, tmHeadY - 8, 85, 1);
    drawEyes(ctx, tmX - 34, tmHeadY + 4, 17, 25, 22, { lookX: -0.45, lookY: -0.08, blink: 0 });

    // Apple physics: hovers until t = 13.4s, then drops cleanly onto the table with bounce
    const restored = t >= 13.4;
    let appleY = 532 + Math.sin(localT * 2.4) * 14;
    if (restored) {
      const dtSnap = t - 13.4;
      const yStart = 532;
      const yRest = 710;
      const tFall = 0.36;
      if (dtSnap < tFall) {
        const u = dtSnap / tFall;
        appleY = yStart + (yRest - yStart) * u * u;
      } else if (dtSnap < tFall + 0.22) {
        const u = (dtSnap - tFall) / 0.22;
        appleY = yRest - Math.sin(u * Math.PI) * 30;
      } else if (dtSnap < tFall + 0.35) {
        const u = (dtSnap - tFall - 0.22) / 0.13;
        appleY = yRest - Math.sin(u * Math.PI) * 9;
      } else {
        appleY = yRest;
      }
    }

    const heightNorm = clamp01((710 - appleY) / 220);
    ctx.fillStyle = 'rgba(0, 0, 0, ' + (0.55 - heightNorm * 0.35) + ')';
    ctx.beginPath();
    ctx.ellipse(tableX, tableY + 2, 34 + heightNorm * 14, 8 + heightNorm * 4, 0, 0, Math.PI * 2);
    ctx.fill();

    drawApple(ctx, tableX, appleY, 32, { glow: !restored, rimLight: true });

    // Expanding white shockwave ring at Minh Quân's snap hand (t = 13.4s)
    if (restored && t < 14.15) {
      const swU = (t - 13.4) / 0.75;
      const ringR = 16 + easeOutCubic(swU) * 300;
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (1 - swU) + ')';
      ctx.lineWidth = 6 * (1 - swU) + 1;
      ctx.beginPath();
      ctx.arc(snapHandX, snapHandY, ringR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // HUD Flip Badge
    ctx.fillStyle = 'rgba(11, 13, 18, 0.86)';
    roundRect(ctx, 1350, 52, 510, 54, 10);
    ctx.fill();
    ctx.strokeStyle = restored ? '#FF4D2A' : '#00E5FF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = restored ? '#FF4D2A' : '#00E5FF';
    ctx.font = '700 20px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      restored ? 'KHÔI PHỤC VẬT LÍ: g = 9.80 m/s²' : 'GIA TỐC TRỌNG TRƯỜNG: g = 0.00 m/s²',
      1372,
      80
    );

    ctx.restore();
  }

  // ACT 5 (15.8s – 18.5s): Editorial Title Card
  function drawAct5_TitleCard(ctx, t, cardT) {
    const fade = easeOutCubic(cardT / 0.75);
    const scalePull = 1.04 - 0.04 * easeOutCubic(cardT / 1.5);

    ctx.save();
    drawAct4_WindowTwoShot(ctx, t, t - 12.2);

    ctx.fillStyle = 'rgba(8, 8, 12, ' + (0.86 * fade) + ')';
    ctx.fillRect(0, 0, W, H);

    ctx.translate(W * 0.5, H * 0.5);
    ctx.scale(scalePull, scalePull);
    ctx.globalAlpha = fade;

    ctx.fillStyle = 'rgba(14, 16, 24, 0.88)';
    roundRect(ctx, -740, -255, 1480, 510, 26);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 77, 42, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FF4D2A';
    ctx.fillRect(-130, -178, 260, 4);

    ctx.font = '700 20px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VẬT LÍ LỚP 10 • BÀI MỞ ĐẦU', 0, -140);

    ctx.fillStyle = '#F5F5F5';
    ctx.font = '900 58px "Be Vietnam Pro", sans-serif';
    ctx.fillText('SƠ LƯỢC VỀ SỰ PHÁT TRIỂN', 0, -64);
    ctx.fillText('CỦA VẬT LÍ HỌC', 0, 8);

    ctx.fillStyle = 'rgba(245, 245, 245, 0.82)';
    ctx.font = '600 24px "Be Vietnam Pro", sans-serif';
    ctx.fillText('“Hành trình từ tư duy triết học đến khám phá vũ trụ”', 0, 82);

    ctx.fillStyle = '#FF4D2A';
    ctx.font = '800 22px "JetBrains Mono", monospace';
    ctx.fillText('NHÓM 1', 0, 142);

    ctx.fillStyle = 'rgba(245, 245, 245, 0.72)';
    ctx.font = '400 19px "Be Vietnam Pro", sans-serif';
    ctx.fillText(
      'Thuyết trình: Minh Quân & Tuấn Minh | Thành viên: Nguyễn Trần Đăng Quang, Phan Nguyễn Minh Quân, Nguyễn Phú Quang, Vũ Nguyễn Tuấn Minh',
      0,
      188
    );

    ctx.restore();
  }

  // =========================================================================
  // SUBTITLE PILL RENDERER
  // =========================================================================
  function drawSubtitlePill(ctx, text, alpha) {
    if (!text || alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '600 32px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxW = 1480;
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (let i = 0; i < words.length; i++) {
      const test = current ? current + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && current) {
        lines.push(current);
        current = words[i];
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);

    let widest = 0;
    for (let i = 0; i < lines.length; i++) {
      widest = Math.max(widest, ctx.measureText(lines[i]).width);
    }

    const padX = 36;
    const padY = 18;
    const lineH = 44;
    const pillW = widest + padX * 2;
    const pillH = lines.length * lineH + padY * 2;
    const pillX = (W - pillW) * 0.5;
    const pillY = H - 72 - pillH;

    ctx.fillStyle = 'rgba(8, 8, 12, 0.76)';
    roundRect(ctx, pillX, pillY, pillW, pillH, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], W * 0.5, pillY + padY + lineH * 0.5 + i * lineH);
    }

    ctx.restore();
  }

  // =========================================================================
  // MASTER FRAME RENDERER (With Error Guard)
  // =========================================================================
  function renderFrame(ctx, t) {
    try {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, W, H);

      if (t < 4.2) {
        drawAct1_Rooftop(ctx, t);
        if (t > 0.15) {
          drawSubtitlePill(
            ctx,
            'Hãy tưởng tượng... điều gì xảy ra nếu mọi định luật Vật lí biến mất?',
            clamp01((t - 0.15) / 0.4)
          );
        }
      } else if (t < 8.8) {
        const localT = t - 4.2;
        drawAct2_TableMacro(ctx, localT);
        drawSubtitlePill(
          ctx,
          'Không trọng lực. Không quán tính. Mọi chuyển động trong vũ trụ đóng băng.',
          clamp01(localT / 0.35)
        );
      } else if (t < 12.2) {
        const localT = t - 8.8;
        drawAct3_CloseUp(ctx, localT);
        drawSubtitlePill(
          ctx,
          "Tuấn Minh: 'Ủa Quân... sao ly cà phê với quả táo bay lơ lửng hết vậy?!'",
          clamp01(localT / 0.3)
        );
      } else if (t < 15.8) {
        const localT = t - 12.2;
        drawAct4_WindowTwoShot(ctx, t, localT);
        drawSubtitlePill(
          ctx,
          "Minh Quân: 'Vì Vật lí chính là quy luật vận hành cả thế giới này.'",
          clamp01(localT / 0.3)
        );
      } else {
        drawAct5_TitleCard(ctx, t, t - 15.8);
      }
    } catch (e) {
      console.error('Intro render error:', e);
    }
  }

  // =========================================================================
  // DOM MOUNT & PLAYBACK DIRECTOR
  // =========================================================================
  function initIntro() {
    if (document.getElementById('intro-movie-wrap')) return;

    const wrap = document.createElement('div');
    wrap.id = 'intro-movie-wrap';
    wrap.style.cssText = [
      'position: fixed',
      'inset: 0',
      'z-index: 99999',
      'background: #080808',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'overflow: hidden',
      'transition: opacity 0.45s ease'
    ].join(';');

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.style.cssText = 'width: 100%; height: 100%; object-fit: contain; display: block;';
    wrap.appendChild(canvas);

    // Thin bottom progress bar (#FF4D2A)
    const barTrack = document.createElement('div');
    barTrack.style.cssText = 'position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: rgba(255,255,255,0.12); pointer-events: none;';
    const barFill = document.createElement('div');
    barFill.style.cssText = 'width: 0%; height: 100%; background: #FF4D2A;';
    barTrack.appendChild(barFill);
    wrap.appendChild(barTrack);

    // Centered Play Button
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.textContent = '▶ PHÁT VIDEO INTRO';
    playBtn.style.cssText = [
      'position: absolute',
      'left: 50%',
      'top: 50%',
      'transform: translate(-50%, -50%)',
      'appearance: none',
      'border: 2px solid rgba(255, 77, 42, 0.9)',
      'background: rgba(11, 13, 18, 0.86)',
      'color: #F5F5F5',
      'font-family: "Be Vietnam Pro", sans-serif',
      'font-size: 24px',
      'font-weight: 800',
      'letter-spacing: 0.06em',
      'padding: 20px 42px',
      'border-radius: 999px',
      'cursor: pointer',
      'box-shadow: 0 20px 56px rgba(0, 0, 0, 0.65)',
      'transition: transform 0.2s ease, background-color 0.2s ease'
    ].join(';');
    wrap.appendChild(playBtn);

    // Bottom-right Skip Button
    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.textContent = 'Vào Slide thuyết trình →';
    skipBtn.style.cssText = [
      'position: absolute',
      'right: 28px',
      'bottom: 24px',
      'appearance: none',
      'border: 1px solid rgba(255, 255, 255, 0.26)',
      'background: rgba(11, 13, 18, 0.78)',
      'color: #F5F5F5',
      'font-family: "JetBrains Mono", monospace',
      'font-size: 14px',
      'font-weight: 700',
      'padding: 11px 20px',
      'border-radius: 999px',
      'cursor: pointer',
      'transition: border-color 0.2s ease, background-color 0.2s ease'
    ].join(';');
    wrap.appendChild(skipBtn);

    document.body.appendChild(wrap);

    const ctx = canvas.getContext('2d', { alpha: false });

    // Immediate synchronous Frame-0 render so opening rooftop scene is visible behind Play button
    renderFrame(ctx, 0);

    let playing = false;
    let finished = false;
    let movieTime = 0;
    let snapFired = false;
    let thud1Fired = false;
    let thud2Fired = false;
    let rafId = 0;
    let lastTs = performance.now();

    function finishIntro() {
      if (finished) return;
      finished = true;
      playing = false;
      window.removeEventListener('keydown', onKeyDown, true);

      const App = window.App;
      if (App && App.transitions && typeof App.transitions.play === 'function') {
        wrap.style.zIndex = '900';
        playBtn.style.display = 'none';
        skipBtn.style.display = 'none';
        App.transitions.play(
          'diagonal',
          function () {
            cancelAnimationFrame(rafId);
            wrap.remove();
            if (typeof App._mountSlide === 'function') {
              App._mountSlide(0);
            } else if (App.goTo) {
              App.goTo(0);
            }
          },
          function () {
            App.isTransitioning = false;
          }
        );
      } else {
        wrap.style.opacity = '0';
        setTimeout(function () {
          cancelAnimationFrame(rafId);
          wrap.remove();
        }, 460);
      }
    }

    function startPlayback() {
      if (playing || finished) return;
      unlockAudio();
      playing = true;
      playBtn.style.display = 'none';
      lastTs = performance.now();
      rafId = requestAnimationFrame(loop);
    }

    function onKeyDown(e) {
      if (finished) return;
      if (!playing && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        e.stopPropagation();
        startPlayback();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        finishIntro();
      }
    }

    function loop(now) {
      if (!playing || finished) return;
      const rawDt = (now - lastTs) / 1000;
      lastTs = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.033);
      movieTime += dt;

      if (movieTime >= 13.4 && !snapFired) {
        snapFired = true;
        playSnapSFX();
      }
      if (movieTime >= 13.76 && !thud1Fired) {
        thud1Fired = true;
        playThudSFX(0.5);
      }
      if (movieTime >= 13.98 && !thud2Fired) {
        thud2Fired = true;
        playThudSFX(0.22);
      }

      barFill.style.width = (clamp01(movieTime / TOTAL_DURATION) * 100).toFixed(2) + '%';
      renderFrame(ctx, movieTime);

      if (movieTime >= TOTAL_DURATION) {
        finishIntro();
        return;
      }
      rafId = requestAnimationFrame(loop);
    }

    playBtn.addEventListener('click', startPlayback);
    playBtn.addEventListener('mouseenter', function () {
      playBtn.style.transform = 'translate(-50%, -50%) scale(1.05)';
      playBtn.style.background = '#FF4D2A';
    });
    playBtn.addEventListener('mouseleave', function () {
      playBtn.style.transform = 'translate(-50%, -50%) scale(1)';
      playBtn.style.background = 'rgba(11, 13, 18, 0.86)';
    });

    skipBtn.addEventListener('click', finishIntro);
    skipBtn.addEventListener('mouseenter', function () {
      skipBtn.style.borderColor = '#FF4D2A';
    });
    skipBtn.addEventListener('mouseleave', function () {
      skipBtn.style.borderColor = 'rgba(255, 255, 255, 0.26)';
    });

    window.addEventListener('keydown', onKeyDown, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIntro);
  } else {
    initIntro();
  }
})();
