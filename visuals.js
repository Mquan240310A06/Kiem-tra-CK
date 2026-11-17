(function () {
  const W = 1920;
  const H = 1080;

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Deterministic pseudo-random for consistent bokeh & skyline buildings
  function hash(n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return s - Math.floor(s);
  }

  // =========================================================================
  // SHARED PROPS & BACKGROUNDS
  // =========================================================================
  function drawDuskSkyAndCity(ctx, t, horizonY, blurAlpha) {
    // Warm purple-to-amber dusk sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, horizonY + 140);
    sky.addColorStop(0, '#1B1528');
    sky.addColorStop(0.45, '#4A2346');
    sky.addColorStop(0.78, '#B84B3E');
    sky.addColorStop(1, '#D96B43');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizonY + 140);

    // Low glowing dusk sun
    const sunX = 1140;
    const sunY = horizonY - 42;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 16, sunX, sunY, 480);
    sunGlow.addColorStop(0, 'rgba(255, 240, 200, 0.96)');
    sunGlow.addColorStop(0.16, 'rgba(253, 186, 116, 0.72)');
    sunGlow.addColorStop(0.48, 'rgba(217, 107, 67, 0.28)');
    sunGlow.addColorStop(1, 'rgba(27, 21, 40, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 480, 0, Math.PI * 2);
    ctx.fill();

    // Distant blurred skyline silhouettes
    const layers = [
      { count: 22, minH: 90, maxH: 230, color: `rgba(38, 22, 42, ${0.55 * blurAlpha})` },
      { count: 16, minH: 70, maxH: 270, color: `rgba(22, 16, 30, ${0.88 * blurAlpha})` }
    ];

    layers.forEach((layer, lIdx) => {
      const step = W / layer.count;
      for (let i = 0; i < layer.count; i++) {
        const bw = step * (0.78 + hash(i + lIdx * 40) * 0.48);
        const bh = lerp(layer.minH, layer.maxH, hash(i * 3.1 + lIdx * 91));
        const bx = i * step - 15;
        const by = horizonY - bh;

        ctx.fillStyle = layer.color;
        ctx.fillRect(bx, by, bw, bh + 180);

        // Warm lit apartment/office window pinpoints on closer skyline
        if (lIdx === 1) {
          const cols = Math.max(2, Math.floor(bw / 22));
          const rows = Math.max(3, Math.floor(bh / 26));
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const seed = hash(i * 100 + r * 17 + c * 7);
              if (seed > 0.62) {
                const twinkle = 0.45 + 0.35 * Math.sin(t * 1.4 + seed * 20);
                ctx.fillStyle = seed > 0.85
                  ? `rgba(254, 240, 138, ${twinkle})`
                  : `rgba(251, 146, 60, ${twinkle * 0.75})`;
                ctx.fillRect(bx + 8 + c * 20, by + 12 + r * 24, 9, 12);
              }
            }
          }
        }
      }
    });
  }

  function drawBokehOrbs(ctx, t, count, seedOffset, alphaScale) {
    for (let i = 0; i < count; i++) {
      const s1 = hash(i * 13.7 + seedOffset);
      const s2 = hash(i * 29.3 + seedOffset);
      const s3 = hash(i * 47.1 + seedOffset);
      const x = s1 * W + Math.sin(t * 0.35 + i) * 22;
      const y = s2 * (H * 0.76) + Math.cos(t * 0.28 + i * 1.7) * 14;
      const r = 34 + s3 * 98;

      const huePick = i % 4;
      const rgb = huePick === 0
        ? '253, 186, 116'
        : huePick === 1
          ? '250, 204, 21'
          : huePick === 2
            ? '232, 93, 63'
            : '167, 139, 250';

      const a = (0.14 + s1 * 0.2) * alphaScale;
      const g = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
      g.addColorStop(0, `rgba(${rgb}, ${a})`);
      g.addColorStop(0.7, `rgba(${rgb}, ${a * 0.65})`);
      g.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawRedApple(ctx, x, y, radius, opts) {
    const o = opts || {};
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);

    if (o.glow) {
      const aura = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius * 2.5);
      aura.addColorStop(0, 'rgba(255, 92, 64, 0.55)');
      aura.addColorStop(1, 'rgba(255, 92, 64, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Apple silhouette (two soft lobes)
    const grad = ctx.createRadialGradient(-radius * 0.28, -radius * 0.3, radius * 0.12, 0, 0, radius * 1.2);
    grad.addColorStop(0, '#FF6B52');
    grad.addColorStop(0.55, '#DC2626');
    grad.addColorStop(1, '#7F1D1D');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.78);
    ctx.bezierCurveTo(radius * 0.65, -radius * 1.12, radius * 1.18, -radius * 0.35, radius * 0.86, radius * 0.52);
    ctx.bezierCurveTo(radius * 0.56, radius * 1.12, radius * 0.14, radius * 0.96, 0, radius * 0.86);
    ctx.bezierCurveTo(-radius * 0.14, radius * 0.96, -radius * 0.56, radius * 1.12, -radius * 0.86, radius * 0.52);
    ctx.bezierCurveTo(-radius * 1.18, -radius * 0.35, -radius * 0.65, -radius * 1.12, 0, -radius * 0.78);
    ctx.closePath();
    ctx.fill();

    if (o.rimLight) {
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.78)';
      ctx.lineWidth = Math.max(2, radius * 0.08);
      ctx.stroke();
    }

    // Glossy specular highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.beginPath();
    ctx.ellipse(-radius * 0.34, -radius * 0.28, radius * 0.18, radius * 0.32, -0.45, 0, Math.PI * 2);
    ctx.fill();

    // Stem & leaf
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = Math.max(2.5, radius * 0.11);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.72);
    ctx.quadraticCurveTo(radius * 0.12, -radius * 1.15, radius * 0.26, -radius * 1.24);
    ctx.stroke();

    ctx.fillStyle = '#4ADE80';
    ctx.beginPath();
    ctx.ellipse(radius * 0.34, -radius * 1.02, radius * 0.32, radius * 0.14, -0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawTwoSegmentArm(ctx, sx, sy, ex, ey, hx, hy, sleeveColor, sleeveWidth, handRadius, rimColor) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (rimColor) {
      ctx.strokeStyle = rimColor;
      ctx.lineWidth = sleeveWidth + 5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.lineTo(hx, hy);
      ctx.stroke();
    }

    ctx.strokeStyle = sleeveColor;
    ctx.lineWidth = sleeveWidth;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.lineTo(hx, hy);
    ctx.stroke();

    // Matte-black stylized hand
    ctx.fillStyle = '#0B0D12';
    ctx.beginPath();
    ctx.arc(hx, hy, handRadius, 0, Math.PI * 2);
    ctx.fill();
    if (rimColor) {
      ctx.strokeStyle = rimColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawExpressiveEyes(ctx, cx, cy, eyeW, eyeH, spacing, opts) {
    const o = opts || {};
    const lookX = o.lookX || 0;
    const lookY = o.lookY || 0;
    const blink = o.blink || 0; // 0 = open, 1 = closed
    const scaleY = Math.max(0.08, 1 - blink);

    [-1, 1].forEach((side) => {
      const ex = cx + side * spacing;
      const ey = cy;

      ctx.save();
      ctx.translate(ex, ey);
      ctx.scale(1, scaleY);

      // Large expressive white oval eye
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.ellipse(0, 0, eyeW, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();

      // Movable pupil
      if (scaleY > 0.2) {
        const px = clamp01((lookX + 1) * 0.5) * (eyeW * 0.6) - eyeW * 0.3;
        const py = clamp01((lookY + 1) * 0.5) * (eyeH * 0.52) - eyeH * 0.26;
        ctx.fillStyle = '#090A0F';
        ctx.beginPath();
        ctx.ellipse(px, py, eyeW * 0.44, eyeH * 0.44, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crisp eye catchlight
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(px - eyeW * 0.14, py - eyeH * 0.16, eyeW * 0.16, 0, Math.PI * 2);
        ctx.fill();

        if (o.appleReflect) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.72)';
          ctx.beginPath();
          ctx.arc(px + eyeW * 0.12, py + eyeH * 0.14, eyeW * 0.12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    });
  }

  function drawBaseballCap(ctx, cx, cy, headR, dir) {
    // dir = -1 (facing left), +1 (facing right), 0 (front)
    ctx.save();
    ctx.translate(cx, cy);

    // Yellow cap crown (#FACC15)
    const capGrad = ctx.createLinearGradient(0, -headR * 1.15, 0, -headR * 0.1);
    capGrad.addColorStop(0, '#FDE047');
    capGrad.addColorStop(1, '#EAB308');
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.arc(0, -headR * 0.14, headR * 1.03, Math.PI * 1.04, Math.PI * 1.96);
    ctx.quadraticCurveTo(0, -headR * 0.35, -headR * 1.02, -headR * 0.14);
    ctx.closePath();
    ctx.fill();

    // Cap crown seam & button
    ctx.strokeStyle = 'rgba(161, 98, 7, 0.45)';
    ctx.lineWidth = Math.max(2, headR * 0.03);
    ctx.beginPath();
    ctx.moveTo(0, -headR * 1.15);
    ctx.quadraticCurveTo(dir * headR * 0.22, -headR * 0.7, dir * headR * 0.1, -headR * 0.25);
    ctx.stroke();

    ctx.fillStyle = '#CA8A04';
    ctx.beginPath();
    ctx.arc(0, -headR * 1.18, headR * 0.11, 0, Math.PI * 2);
    ctx.fill();

    // Brim
    ctx.fillStyle = '#EAB308';
    ctx.beginPath();
    if (dir === 0) {
      ctx.ellipse(0, -headR * 0.22, headR * 1.08, headR * 0.2, 0, Math.PI, Math.PI * 2);
    } else {
      const bx = dir * headR * 0.92;
      ctx.moveTo(-headR * 0.55 * dir, -headR * 0.2);
      ctx.quadraticCurveTo(bx * 0.85, -headR * 0.42, bx + dir * headR * 0.56, -headR * 0.12);
      ctx.quadraticCurveTo(bx * 0.65, -headR * 0.02, -headR * 0.55 * dir, -headR * 0.12);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // =========================================================================
  // SHOT 1: BACKLIT ROOFTOP / BALCONY SILHOUETTE AT DUSK (Minh Quân)
  // =========================================================================
  function drawShot1_Silhouette(ctx, t) {
    ctx.save();

    const driftX = Math.sin(t * 0.45) * 8;
    const driftY = Math.cos(t * 0.35) * 4;
    ctx.translate(driftX, driftY);

    // 1. Dusk sky & blurred city skyline
    drawDuskSkyAndCity(ctx, t, 735, 1);

    // Warm atmospheric mist along horizon
    const mist = ctx.createLinearGradient(0, 610, 0, 820);
    mist.addColorStop(0, 'rgba(217, 107, 67, 0)');
    mist.addColorStop(1, 'rgba(245, 158, 11, 0.24)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, 610, W, 210);

    // 2. Rooftop balcony parapet & metal railing in foreground
    ctx.fillStyle = '#09090D';
    ctx.fillRect(-20, 835, W + 40, 260);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-20, 835);
    ctx.lineTo(W + 20, 835);
    ctx.stroke();

    // Railing bar above parapet
    ctx.strokeStyle = '#0D0E14';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-20, 720);
    ctx.lineTo(W + 20, 720);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(253, 186, 116, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, 715);
    ctx.lineTo(W + 20, 715);
    ctx.stroke();

    for (let px = 80; px < W; px += 220) {
      ctx.fillStyle = '#0D0E14';
      ctx.fillRect(px, 720, 12, 118);
    }

    // 3. Minh Quân (Coral shirt #E85D3F backlit silhouette with golden rim light)
    const charX = 760;
    const baseFootY = 980;
    const headX = charX + 12;
    const headY = 505;
    const headR = 92;

    // Slim dark legs
    ctx.strokeStyle = '#07080C';
    ctx.lineWidth = 24;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(charX - 24, 775);
    ctx.lineTo(charX - 36, baseFootY);
    ctx.moveTo(charX + 26, 775);
    ctx.lineTo(charX + 42, baseFootY);
    ctx.stroke();

    // Torso (backlit coral shirt darkened with warm golden rim)
    ctx.save();
    ctx.fillStyle = '#4B1E1A';
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.82)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(charX - 64, 608);
    ctx.quadraticCurveTo(charX, 588, charX + 68, 610);
    ctx.lineTo(charX + 52, 795);
    ctx.lineTo(charX - 54, 795);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Subtle coral tint on shirt side catching sunset glow
    const shirtGlow = ctx.createLinearGradient(charX - 60, 610, charX + 66, 780);
    shirtGlow.addColorStop(0, 'rgba(232, 93, 63, 0.25)');
    shirtGlow.addColorStop(1, 'rgba(232, 93, 63, 0.85)');
    ctx.fillStyle = shirtGlow;
    ctx.fill();
    ctx.restore();

    // Left resting arm
    drawTwoSegmentArm(
      ctx,
      charX - 52, 625,
      charX - 96, 712,
      charX - 72, 788,
      '#4B1E1A', 26, 15, 'rgba(251, 191, 36, 0.45)'
    );

    // Raised right arm holding up glowing red apple toward sky
    const raiseWave = Math.sin(t * 1.6) * 8;
    const handX = charX + 215;
    const handY = 415 + raiseWave;
    drawTwoSegmentArm(
      ctx,
      charX + 54, 622,
      charX + 148, 558,
      handX, handY,
      '#9A3412', 26, 16, 'rgba(253, 224, 71, 0.88)'
    );

    // Glowing Red Apple held up toward sun
    drawRedApple(ctx, handX + 8, handY - 34, 34, {
      glow: true,
      rimLight: true,
      rot: -0.15
    });

    // Round Matte-Black Head seen from side/back-quarter with golden rim light
    ctx.save();
    ctx.fillStyle = '#0B0D12';
    ctx.strokeStyle = 'rgba(253, 186, 116, 0.92)';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Side-profile expressive eye looking upward at the apple
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.ellipse(headX + 46, headY - 10, 15, 22, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#090A0F';
    ctx.beginPath();
    ctx.arc(headX + 52, headY - 14, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Floating warm dusk dust motes
    for (let m = 0; m < 18; m++) {
      const mx = (hash(m * 19) * W + t * 28) % W;
      const my = (hash(m * 37) * 760 + Math.sin(t + m) * 20);
      ctx.fillStyle = `rgba(254, 240, 138, ${0.25 + hash(m) * 0.35})`;
      ctx.beginPath();
      ctx.arc(mx, my, 2 + hash(m * 5) * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 2: TABLE MACRO CLOSE-UP (Tipped Mug, Floating Coffee, Steam & Apple)
  // =========================================================================
  function drawShot2_TableMacro(ctx, t, gravityZero) {
    const isZeroG = gravityZero !== false;
    ctx.save();

    // 1. Heavily blurred warm dusk interior + golden city bokeh background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#141020');
    bgGrad.addColorStop(0.55, '#2A1B2E');
    bgGrad.addColorStop(1, '#120C0A');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Soft distant window pane glow
    ctx.fillStyle = 'rgba(217, 107, 67, 0.14)';
    ctx.fillRect(140, 0, 740, 720);
    ctx.fillRect(960, 0, 820, 720);

    drawBokehOrbs(ctx, t, 28, 100, 1.15);

    // 2. Dark Wooden Table Surface (foreground macro)
    const tableY = 735;
    const wood = ctx.createLinearGradient(0, tableY, 0, H);
    wood.addColorStop(0, '#362118');
    wood.addColorStop(0.18, '#23140E');
    wood.addColorStop(1, '#0F0907');
    ctx.fillStyle = wood;
    ctx.fillRect(0, tableY, W, H - tableY);

    // Warm rim sheen along table edge
    ctx.fillStyle = 'rgba(253, 186, 116, 0.25)';
    ctx.fillRect(0, tableY, W, 5);

    // Subtle wood grain lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.lineWidth = 3;
    for (let g = 0; g < 9; g++) {
      const gy = tableY + 34 + g * 38;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(640, gy - 12, 1280, gy + 14, W, gy - 6);
      ctx.stroke();
    }

    // 3. Stylized Coral-Sleeved Arm reaching across left side of table
    drawTwoSegmentArm(
      ctx,
      -40, 890,
      265, 815,
      465, 760,
      '#E85D3F', 76, 42, 'rgba(253, 186, 116, 0.45)'
    );

    // 4. Tipped White Ceramic Coffee Mug on table
    const mugX = 690;
    const mugY = 740;
    ctx.save();
    ctx.translate(mugX, mugY);
    ctx.rotate(-1.18); // tipped over onto its rim

    // Mug handle
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.arc(0, -108, 44, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();

    // Ceramic mug body
    const mugGrad = ctx.createLinearGradient(-75, -180, 75, 0);
    mugGrad.addColorStop(0, '#FFFFFF');
    mugGrad.addColorStop(0.6, '#E5E7EB');
    mugGrad.addColorStop(1, '#9CA3AF');
    ctx.fillStyle = mugGrad;
    ctx.beginPath();
    ctx.roundRect(-72, -195, 144, 195, 16);
    ctx.fill();

    // Dark coffee interior rim
    ctx.fillStyle = '#3E2216';
    ctx.beginPath();
    ctx.ellipse(0, -192, 66, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#F8FAFC';
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.restore();

    // 5. Coffee Droplets & Steam Behavior (Zero-G vs Normal Gravity)
    if (isZeroG) {
      // Curling white steam floating slowly upward
      for (let s = 0; s < 5; s++) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 + s * 0.04})`;
        ctx.lineWidth = 10 - s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const sx = 820 + s * 38;
        const sy = 640 - ((t * 36 + s * 45) % 210);
        ctx.moveTo(sx, sy + 120);
        ctx.bezierCurveTo(
          sx - 35 + Math.sin(t * 2 + s) * 18,
          sy + 75,
          sx + 40 + Math.cos(t * 1.8 + s) * 18,
          sy + 35,
          sx,
          sy
        );
        ctx.stroke();
        ctx.restore();
      }

      // Floating brown coffee droplets suspended in mid-air
      const drops = [
        { x: 855, y: 635, r: 16, spd: 1.5 },
        { x: 930, y: 540, r: 24, spd: 1.2 },
        { x: 1015, y: 615, r: 13, spd: 1.8 },
        { x: 970, y: 455, r: 19, spd: 1.4 },
        { x: 1085, y: 515, r: 11, spd: 2.0 },
        { x: 890, y: 475, r: 9, spd: 1.7 }
      ];
      drops.forEach((d, idx) => {
        const dy = Math.sin(t * d.spd + idx * 1.3) * 18;
        const dx = Math.cos(t * 0.9 + idx) * 8;
        const dg = ctx.createRadialGradient(
          d.x + dx - d.r * 0.3,
          d.y + dy - d.r * 0.3,
          d.r * 0.1,
          d.x + dx,
          d.y + dy,
          d.r
        );
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
      });
    } else {
      // Normal gravity: dark coffee puddle sheen on wood table
      ctx.fillStyle = 'rgba(42, 20, 12, 0.85)';
      ctx.beginPath();
      ctx.ellipse(915, tableY + 26, 145, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Floating Red Apple
    const appleX = 1280;
    const appleY = isZeroG ? 470 + Math.sin(t * 2.1) * 26 : 675;
    drawRedApple(ctx, appleX, appleY, 64, {
      glow: isZeroG,
      rimLight: true,
      rot: isZeroG ? Math.sin(t * 1.3) * 0.16 : 0.08
    });

    // 7. Minimal Monospace HUD Pointer Badge ("GIA TỐC: g = 0.00 m/s²")
    const badgeTargetX = isZeroG ? 930 : appleX;
    const badgeTargetY = isZeroG ? 540 : appleY - 40;
    const boxX = 1140;
    const boxY = 235;

    ctx.save();
    // Target reticle circle
    ctx.strokeStyle = isZeroG ? '#00E5FF' : '#FF4D2A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(badgeTargetX, badgeTargetY, 34 + Math.sin(t * 4) * 3, 0, Math.PI * 2);
    ctx.stroke();

    // Leader line
    ctx.beginPath();
    ctx.moveTo(badgeTargetX + 26, badgeTargetY - 24);
    ctx.lineTo(boxX - 24, boxY + 26);
    ctx.lineTo(boxX, boxY + 26);
    ctx.stroke();

    // Minimal dark translucent pill badge
    ctx.fillStyle = 'rgba(11, 13, 18, 0.84)';
    ctx.strokeStyle = isZeroG ? 'rgba(0, 229, 255, 0.7)' : 'rgba(255, 77, 42, 0.78)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, 388, 54, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isZeroG ? '#00E5FF' : '#FF4D2A';
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      isZeroG ? 'GIA TỐC: g = 0.00 m/s²' : 'GIA TỐC: g = 9.81 m/s²',
      boxX + 22,
      boxY + 28
    );
    ctx.restore();

    ctx.restore();
  }

  // =========================================================================
  // SHOT 3: EXTREME CLOSE-UP ON TUẤN MINH'S FACE & YELLOW CAP
  // =========================================================================
  function drawShot3_FaceCloseUp(ctx, t) {
    ctx.save();

    // 1. Heavily blurred warm bokeh window backdrop
    const bg = ctx.createRadialGradient(960, 460, 80, 960, 540, 1100);
    bg.addColorStop(0, '#33203B');
    bg.addColorStop(0.55, '#1D1426');
    bg.addColorStop(1, '#09090D');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawBokehOrbs(ctx, t, 32, 310, 1.35);

    // Subtle cobalt blue shirt collar at bottom of close-up frame
    ctx.fillStyle = '#2B59C3';
    ctx.beginPath();
    ctx.ellipse(960, 1070, 340, 165, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 186, 116, 0.35)';
    ctx.lineWidth = 5;
    ctx.stroke();

    // 2. Tuấn Minh's Round Matte-Black Head (extreme close-up scale)
    const headX = 960 + Math.sin(t * 1.4) * 6;
    const headY = 600 + Math.cos(t * 1.1) * 5;
    const headR = 278;

    // Warm golden rim-light halo behind head
    const rim = ctx.createRadialGradient(headX, headY, headR * 0.88, headX, headY, headR * 1.14);
    rim.addColorStop(0, 'rgba(251, 191, 36, 0.48)');
    rim.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(headX, headY, headR * 1.14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0B0D12';
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 186, 116, 0.55)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Bright Yellow Baseball Cap (#FACC15)
    drawBaseballCap(ctx, headX, headY - 22, headR * 1.01, -1);

    // Wide-open amazed expressive white eyes tracking the floating objects
    const eyePulse = 1 + Math.sin(t * 4.5) * 0.03;
    drawExpressiveEyes(ctx, headX - 10, headY + 12, 54 * eyePulse, 78 * eyePulse, 96, {
      lookX: Math.sin(t * 1.2) * 0.25 - 0.15,
      lookY: -0.25 + Math.cos(t * 1.6) * 0.1,
      blink: 0,
      appleReflect: true
    });

    ctx.restore();
  }

  // =========================================================================
  // SHOT 4: WIDE CAFE TWO-SHOT (Minh Quân & Tuấn Minh + Panoramic City Window)
  // =========================================================================
  function drawShot4_CafeTwoShot(ctx, t, appleY) {
    ctx.save();

    // 1. Cozy dark interior wall
    ctx.fillStyle = '#0D0E14';
    ctx.fillRect(0, 0, W, H);

    // 2. Large Multi-Pane Panoramic Dusk Window
    const winX = 210;
    const winY = 95;
    const winW = 1500;
    const winH = 665;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(winX, winY, winW, winH, 16);
    ctx.clip();

    drawDuskSkyAndCity(ctx, t, winY + winH - 95, 0.92);

    // Subtle interior glass reflection diagonal sheen
    const sheen = ctx.createLinearGradient(winX, winY, winX + winW, winY + winH);
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    sheen.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
    sheen.addColorStop(1, 'rgba(253, 186, 116, 0.06)');
    ctx.fillStyle = sheen;
    ctx.fillRect(winX, winY, winW, winH);
    ctx.restore();

    // Panoramic window frame & 4x2 mullions
    ctx.strokeStyle = '#181922';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.roundRect(winX, winY, winW, winH, 16);
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

    // Interior floor
    const floorGrad = ctx.createLinearGradient(0, 760, 0, H);
    floorGrad.addColorStop(0, '#14131B');
    floorGrad.addColorStop(1, '#08080C');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 760, W, H - 760);

    // 3. Round Wooden Table (center x = 960)
    const tableCenterX = 960;
    const tableTopY = 740;

    // Table pedestal & base
    ctx.fillStyle = '#141115';
    ctx.fillRect(tableCenterX - 18, tableTopY + 12, 36, 225);
    ctx.beginPath();
    ctx.ellipse(tableCenterX, 975, 130, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Table top ellipse
    const topGrad = ctx.createLinearGradient(tableCenterX - 240, tableTopY, tableCenterX + 240, tableTopY);
    topGrad.addColorStop(0, '#3D251B');
    topGrad.addColorStop(0.5, '#593627');
    topGrad.addColorStop(1, '#2D1A12');
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.ellipse(tableCenterX, tableTopY, 248, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 186, 116, 0.28)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // White coffee mug resting on table
    ctx.fillStyle = '#E5E7EB';
    ctx.fillRect(tableCenterX - 120, tableTopY - 34, 34, 34);
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(tableCenterX - 122, tableTopY - 17, 10, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();

    // 4. Minh Quân (Left, Coral Shirt #E85D3F) sitting on stool
    const mqX = 615;
    const mqHeadY = 530;

    // Stool
    ctx.fillStyle = '#1A1B24';
    ctx.fillRect(mqX - 48, 795, 96, 18);
    ctx.fillRect(mqX - 8, 813, 16, 155);
    ctx.fillRect(mqX - 44, 964, 88, 10);

    // Slim dark legs
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

    // Coral torso
    ctx.fillStyle = '#E85D3F';
    ctx.beginPath();
    ctx.roundRect(mqX - 46, 616, 94, 178, 32);
    ctx.fill();

    // Gesturing arm toward hovering apple
    drawTwoSegmentArm(
      ctx,
      mqX + 36, 646,
      mqX + 120, 686,
      mqX + 195, 622 + Math.sin(t * 2) * 8,
      '#E85D3F', 24, 14, null
    );

    // Round matte-black head + blinking expressive eyes
    ctx.fillStyle = '#0B0D12';
    ctx.beginPath();
    ctx.arc(mqX + 4, mqHeadY, 84, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 186, 116, 0.48)';
    ctx.lineWidth = 3;
    ctx.stroke();

    const blinkMQ = (t % 4.2) > 4.05 ? 0.92 : 0;
    drawExpressiveEyes(ctx, mqX + 34, mqHeadY - 4, 15, 22, 22, {
      lookX: 0.45,
      lookY: -0.1,
      blink: blinkMQ
    });

    // 5. Tuấn Minh (Right, Yellow Cap #FACC15 + Cobalt Blue Shirt #2B59C3)
    const tmX = 1305;
    const tmHeadY = 528;

    // Stool
    ctx.fillStyle = '#1A1B24';
    ctx.fillRect(tmX - 48, 795, 96, 18);
    ctx.fillRect(tmX - 8, 813, 16, 155);
    ctx.fillRect(tmX - 44, 964, 88, 10);

    // Slim dark legs
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

    // Cobalt Blue Shirt (#2B59C3)
    ctx.fillStyle = '#2B59C3';
    ctx.beginPath();
    ctx.roundRect(tmX - 48, 616, 96, 178, 32);
    ctx.fill();

    // Articulated arm reacting in amazement
    drawTwoSegmentArm(
      ctx,
      tmX - 36, 646,
      tmX - 115, 684,
      tmX - 178, 608 - Math.sin(t * 2.2) * 6,
      '#2B59C3', 24, 14, null
    );

    // Round matte-black head + Yellow Cap
    ctx.fillStyle = '#0B0D12';
    ctx.beginPath();
    ctx.arc(tmX - 4, tmHeadY, 84, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 186, 116, 0.48)';
    ctx.lineWidth = 3;
    ctx.stroke();

    drawBaseballCap(ctx, tmX - 4, tmHeadY - 8, 85, -1);

    drawExpressiveEyes(ctx, tmX - 34, tmHeadY + 4, 17, 25, 22, {
      lookX: -0.45,
      lookY: -0.1,
      blink: 0
    });

    // 6. Red Apple hovering or dropping onto table (driven by appleY)
    const resolvedAppleY = typeof appleY === 'number'
      ? appleY
      : 545 + Math.sin(t * 2.2) * 20;

    // Tabletop contact shadow grows sharper as apple drops onto table
    const tableRestY = tableTopY - 26;
    const heightNorm = clamp01((tableRestY - resolvedAppleY) / 240);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.55 - heightNorm * 0.35})`;
    ctx.beginPath();
    ctx.ellipse(tableCenterX, tableTopY + 2, 34 + heightNorm * 16, 8 + heightNorm * 4, 0, 0, Math.PI * 2);
    ctx.fill();

    drawRedApple(ctx, tableCenterX, resolvedAppleY, 32, {
      glow: heightNorm > 0.25,
      rimLight: true,
      rot: heightNorm * Math.sin(t * 1.5) * 0.12
    });

    ctx.restore();
  }

  window.IntroAssets = {
    drawShot1_Silhouette,
    drawShot2_TableMacro,
    drawShot3_FaceCloseUp,
    drawShot4_CafeTwoShot,
    drawRedApple,
    drawExpressiveEyes,
    drawBaseballCap
  };
})();
