(function () {
  const W = 1920;
  const H = 1080;
  const CX = W * 0.5;
  const CY = H * 0.5;
  const DURATION = 0.8;

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function easeOutExpo(t) {
    return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function easeInExpo(t) {
    return t <= 0 ? 0 : Math.pow(2, 10 * (t - 1));
  }

  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInCubic(t) {
    return t * t * t;
  }

  // Deterministic pseudo-random helper for Truchet & streaks
  function hash2D(c, r) {
    const n = Math.sin(c * 127.1 + r * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  }

  const VALID_TYPES = ['diagonal', 'slam', 'truchet', 'tiles3d', 'aperture'];

  const state = {
    active: false,
    type: 'diagonal',
    elapsed: 0,
    duration: DURATION,
    midpointFired: false,
    onMidpoint: null,
    onComplete: null
  };

  // =========================================================================
  // 1. DIAGONAL: 3-Ribbon / 4-Band Diagonal Shutter Wipe (Opus 5.5 Signature)
  // =========================================================================
  const DIAGONAL_BANDS = [
    { color: '#0D0D0D', streak: 'rgba(255, 255, 255, 0.14)' },
    { color: '#3A3A3A', streak: 'rgba(255, 255, 255, 0.18)' },
    { color: '#F5F5F5', streak: 'rgba(13, 13, 13, 0.14)' },
    { color: '#FF4D2A', streak: 'rgba(255, 255, 255, 0.36)' }
  ];

  function renderDiagonal(ctx, progress) {
    const t = progress * DURATION; // 0 .. 0.8s
    const angleRad = (16 * Math.PI) / 180;
    const slant = Math.tan(angleRad) * H; // ~309.7px
    const bandW = W + slant + 160; // 2390px -> guarantees full coverage
    const startX = -bandW - 80;
    const coverX = -slant * 0.5 - 60;
    const endX = W + slant + 120;

    // Draw bands in stack order: 0 -> 1 -> 2 -> 3
    for (let i = 0; i < DIAGONAL_BANDS.length; i++) {
      const band = DIAGONAL_BANDS[i];
      const enterStart = i * 0.05;
      const enterEnd = 0.24 + i * 0.05; // last band fully covers by t = 0.39s
      const exitStart = 0.41 + (3 - i) * 0.05;
      const exitEnd = 0.65 + (3 - i) * 0.05; // last band exits by t = 0.80s

      let x = startX;
      let vel = 0;

      if (t < enterStart) {
        continue;
      } else if (t <= enterEnd) {
        const u = clamp01((t - enterStart) / (enterEnd - enterStart));
        const e = easeOutCubic(u);
        x = startX + (coverX - startX) * e;
        vel = (1 - u) * 1.1;
      } else if (t < exitStart) {
        x = coverX;
        vel = 0;
      } else if (t <= exitEnd) {
        const u = clamp01((t - exitStart) / (exitEnd - exitStart));
        const e = easeInCubic(u);
        x = coverX + (endX - coverX) * e;
        vel = u * 1.15;
      } else {
        continue;
      }

      ctx.save();
      ctx.fillStyle = band.color;
      ctx.beginPath();
      ctx.moveTo(x + slant, 0);
      ctx.lineTo(x + slant + bandW, 0);
      ctx.lineTo(x + bandW, H);
      ctx.lineTo(x, H);
      ctx.closePath();
      ctx.fill();

      // Directional velocity motion-blur streaks along leading/trailing edges
      if (vel > 0.03) {
        const streakCount = 7;
        for (let s = 0; s < streakCount; s++) {
          const sy = (s + 0.5) * (H / streakCount);
          const sh = 6 + ((s * 19 + i * 11) % 16);
          const sw = (140 + ((s * 67) % 240)) * vel;
          const sx = t < 0.4
            ? x + slant + bandW - (sy / H) * slant - sw * 0.35
            : x + slant - (sy / H) * slant - sw * 0.65;

          ctx.fillStyle = band.streak;
          ctx.beginPath();
          ctx.moveTo(sx + Math.tan(angleRad) * sh, sy);
          ctx.lineTo(sx + Math.tan(angleRad) * sh + sw, sy);
          ctx.lineTo(sx + sw, sy + sh);
          ctx.lineTo(sx, sy + sh);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }

  // =========================================================================
  // 2. SLAM: 4-Beat Full-Screen Color-Block Kinetic Slam
  // =========================================================================
  const SLAM_BEATS = [
    { word: 'CỔ ĐIỂN.', bg: '#0D0D0D', fg: '#F5F5F5', accent: '#FF4D2A', code: 'BEAT 01 / 04' },
    { word: 'THỰC NGHIỆM.', bg: '#FF4D2A', fg: '#0D0D0D', accent: '#F5F5F5', code: 'BEAT 02 / 04' },
    { word: 'ĐIỆN TỪ.', bg: '#EFECE6', fg: '#0D0D0D', accent: '#2B44FF', code: 'BEAT 03 / 04' },
    { word: 'HIỆN ĐẠI.', bg: '#2B44FF', fg: '#F5F5F5', accent: '#0D0D0D', code: 'BEAT 04 / 04' }
  ];

  function renderSlam(ctx, progress) {
    // 4 rapid cuts across 0.8s (0.20s per beat; 0.18s hold + 0.02s hard snap).
    // Midpoint at progress === 0.5 sits cleanly between Beat 2 and Beat 3.
    const idx = Math.min(3, Math.floor(progress * 4));
    const localP = clamp01((progress * 4) - idx);
    const beat = SLAM_BEATS[idx];

    ctx.save();

    // First beat enters fast from left, final beat snaps out horizontally at very end
    let clipX = 0;
    let clipW = W;
    if (idx === 0 && localP < 0.18) {
      const u = easeOutExpo(localP / 0.18);
      clipW = W * u;
    } else if (idx === 3 && localP > 0.8) {
      const u = easeInExpo((localP - 0.8) / 0.2);
      clipX = W * u;
      clipW = W - clipX;
    }

    if (clipW <= 0) {
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.rect(clipX, 0, clipW, H);
    ctx.clip();

    // Solid color-block background
    ctx.fillStyle = beat.bg;
    ctx.fillRect(0, 0, W, H);

    // Horizontal velocity blur streaks on cut impact
    const impact = Math.max(0, 1 - localP * 3.2);
    if (impact > 0.01) {
      ctx.fillStyle = beat.accent;
      ctx.globalAlpha = 0.26 * impact;
      for (let i = 0; i < 14; i++) {
        const y = ((i * 83 + idx * 149) % (H - 40)) + 20;
        const h = 3 + (i % 5) * 3;
        const w = (260 + ((i * 197) % 620)) * impact;
        const x = (idx % 2 === 0)
          ? ((i * 251) % (W - 200))
          : W - ((i * 251) % (W - 200)) - w;
        ctx.fillRect(x, y, w, h);
      }
      ctx.globalAlpha = 1;
    }

    // Swiss kinetic frame bars
    ctx.fillStyle = beat.accent;
    ctx.fillRect(0, 0, W, 14);
    ctx.fillRect(0, H - 14, W, 14);

    // Beat metadata header
    ctx.fillStyle = beat.fg;
    ctx.globalAlpha = 0.72;
    ctx.font = '700 24px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(beat.code, 96, 68);
    ctx.textAlign = 'right';
    ctx.fillText('VẬT LÍ HỌC • SHOWREEL CUT', W - 96, 68);
    ctx.globalAlpha = 1;

    // Giant kinetic Vietnamese keyword with punchy scale slam
    const slamScale = 1 + 0.14 * Math.pow(1 - Math.min(1, localP * 2.5), 2);
    const jitterX = impact * (idx % 2 === 0 ? -42 : 42);
    ctx.translate(CX + jitterX, CY);
    ctx.scale(slamScale, slamScale);

    ctx.fillStyle = beat.fg;
    ctx.font = '900 176px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(beat.word, 0, 8);

    // Underline accent bar
    const metrics = ctx.measureText(beat.word);
    const barW = Math.min(W - 200, metrics.width);
    ctx.fillStyle = beat.accent;
    ctx.fillRect(-barW * 0.5, 118, barW, 12);

    ctx.restore();
  }

  // =========================================================================
  // 3. TRUCHET: 16 x 9 Truchet Labyrinth Sweep (Haiku Xhigh Signature)
  // =========================================================================
  function renderTruchet(ctx, progress) {
    const cols = 16;
    const rows = 9;
    const tileSize = W / cols; // 120px exact
    const half = tileSize * 0.5;
    const isPhase2 = progress >= 0.5;
    const phaseP = isPhase2 ? (progress - 0.5) * 2 : progress * 2; // 0..1

    const arcColor = isPhase2 ? '#FF4D2A' : '#F5F5F5';
    const staggerSpan = 0.42;

    for (let c = 0; c < cols; c++) {
      const colNorm = c / (cols - 1);
      const localU = clamp01((phaseP - colNorm * staggerSpan) / (1 - staggerSpan));
      const eased = easeInOutCubic(localU);

      // Phase 1 sweeps tiles IN (0 -> 1); Phase 2 sweeps tiles OUT (1 -> 0)
      const scaleX = isPhase2 ? (1 - eased) : eased;
      if (scaleX <= 0.002) continue;

      for (let r = 0; r < rows; r++) {
        const tx = c * tileSize;
        const ty = r * tileSize;
        const seed = hash2D(c, r);
        const variant = seed > 0.5 ? 1 : 0;

        ctx.save();
        ctx.translate(tx + half, ty + half);
        ctx.scale(scaleX, 1);

        // Clip strictly to the tile box so thick arcs join seamlessly at borders
        ctx.beginPath();
        ctx.rect(-half - 0.5, -half - 0.5, tileSize + 1, tileSize + 1);
        ctx.clip();

        // Crisp dark tile base
        ctx.fillStyle = '#0D0D0D';
        ctx.fillRect(-half - 1, -half - 1, tileSize + 2, tileSize + 2);

        // Rotate quarter-circle arcs by 90 deg on phase flip for labyrinth snap
        if ((variant ^ (isPhase2 ? 1 : 0)) === 1) {
          ctx.rotate(Math.PI * 0.5);
        }

        ctx.strokeStyle = arcColor;
        ctx.lineWidth = 24;
        ctx.lineCap = 'butt';

        // Top-left quarter arc
        ctx.beginPath();
        ctx.arc(-half, -half, half, 0, Math.PI * 0.5);
        ctx.stroke();

        // Bottom-right quarter arc
        ctx.beginPath();
        ctx.arc(half, half, half, Math.PI, Math.PI * 1.5);
        ctx.stroke();

        // Subtle inner Swiss node dot at center when fully open
        if (scaleX > 0.85) {
          ctx.fillStyle = isPhase2 ? 'rgba(245, 245, 245, 0.25)' : 'rgba(255, 77, 42, 0.35)';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }
  }

  // =========================================================================
  // 4. TILES3D: 15 x 5 (75-Tile) 3D Perspective Wave Flip (Opus 5.5 Signature)
  // =========================================================================
  const TILES_PALETTE = ['#F5F5F5', '#2B44FF', '#FF4D2A'];

  function project3D(x, y, z, fov) {
    const scale = fov / (fov + z);
    return {
      x: CX + x * scale,
      y: CY + y * scale
    };
  }

  function fillQuad(ctx, p0, p1, p2, p3, fillStyle, strokeStyle) {
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function renderTiles3D(ctx, progress) {
    const cols = 15;
    const rows = 5;
    const tileW = W / cols; // 128px exact
    const tileH = H / rows; // 216px exact
    const halfW = tileW * 0.5;
    const halfH = tileH * 0.5;
    const depth = 34;
    const fov = 1400;

    const isPhase2 = progress >= 0.5;
    const phaseP = isPhase2 ? (progress - 0.5) * 2 : progress * 2; // 0..1

    const maxDist = Math.hypot(7, 2);
    const waveSpread = 0.42;

    // Collect tiles and sort back-to-front by distance from center so outer perspective
    // extruded bevels overlap naturally without Z-fighting.
    const tiles = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dx = c - 7;
        const dy = r - 2;
        const dist = Math.hypot(dx, dy);
        const normDist = dist / maxDist;

        const localU = clamp01((phaseP - normDist * waveSpread) / (1 - waveSpread));
        const e = easeInOutCubic(localU);

        // Phase 1: rotates from +90deg (edge-on) to 0deg (100% flat front cover)
        // Phase 2: rotates from 0deg to +180deg (full 180 flip, vanishing past 90deg)
        let angle;
        if (!isPhase2) {
          angle = (1 - e) * (Math.PI * 0.5);
        } else {
          angle = e * Math.PI;
        }

        // After 90deg in Phase 2, back-flip shrinks smoothly out by 180deg
        if (isPhase2 && angle > Math.PI * 0.52) {
          const tail = (angle - Math.PI * 0.52) / (Math.PI * 0.48);
          if (tail >= 0.98) continue;
        }

        const colorIdx = (c * 3 + r * 5) % 3;
        const faceColor = TILES_PALETTE[colorIdx];
        const bevelColor = colorIdx === 0 ? '#2B44FF' : colorIdx === 1 ? '#FF4D2A' : '#0D0D0D';
        const sideShade = colorIdx === 2 ? '#8F210D' : colorIdx === 1 ? '#172699' : '#B5B5B5';

        tiles.push({
          c,
          r,
          dist,
          angle,
          faceColor,
          bevelColor,
          sideShade
        });
      }
    }

    // Painter's algorithm: draw outer tiles before inner tiles
    tiles.sort((a, b) => b.dist - a.dist);

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      const cxWorld = (tile.c + 0.5) * tileW - CX;
      const cyWorld = (tile.r + 0.5) * tileH - CY;

      // Rotate around vertical Y-axis (with slight diagonal tilt for kinetic wave feel)
      const cosA = Math.cos(tile.angle);
      const sinA = Math.sin(tile.angle);

      const scaleDecay = (isPhase2 && tile.angle > Math.PI * 0.5)
        ? Math.max(0, 1 - (tile.angle - Math.PI * 0.5) / (Math.PI * 0.5))
        : 1;

      const hw = (halfW + 0.75) * scaleDecay;
      const hh = (halfH + 0.75) * scaleDecay;
      const hd = depth * 0.5 * scaleDecay;

      // Transform 8 corners of extruded 3D block centered at (cxWorld, cyWorld, 0)
      function xform(lx, ly, lz) {
        const rx = lx * cosA + lz * sinA;
        const rz = -lx * sinA + lz * cosA;
        return project3D(cxWorld + rx, cyWorld + ly, rz, fov);
      }

      // Front face (z = -hd)
      const fTL = xform(-hw, -hh, -hd);
      const fTR = xform(hw, -hh, -hd);
      const fBR = xform(hw, hh, -hd);
      const fBL = xform(-hw, hh, -hd);

      // Back face (z = +hd)
      const bTL = xform(-hw, -hh, hd);
      const bTR = xform(hw, -hh, hd);
      const bBR = xform(hw, hh, hd);
      const bBL = xform(-hw, hh, hd);

      // Draw visible extruded side bevels depending on rotation sign
      if (sinA > 0.02) {
        // Left bevel side visible
        fillQuad(ctx, bTL, fTL, fBL, bBL, tile.bevelColor, 'rgba(0,0,0,0.18)');
      } else if (sinA < -0.02) {
        // Right bevel side visible
        fillQuad(ctx, fTR, bTR, bBR, fBR, tile.bevelColor, 'rgba(0,0,0,0.18)');
      }

      // Top/bottom perspective bevel if off-axis
      if (cyWorld > 40) {
        fillQuad(ctx, bTL, bTR, fTR, fTL, tile.sideShade, null);
      } else if (cyWorld < -40) {
        fillQuad(ctx, fBL, fBR, bBR, bBL, tile.sideShade, null);
      }

      // Draw front or back face depending on cosA
      if (cosA >= 0) {
        fillQuad(ctx, fTL, fTR, fBR, fBL, tile.faceColor, 'rgba(13,13,13,0.08)');
      } else {
        fillQuad(ctx, bTR, bTL, bBL, bBR, tile.bevelColor, 'rgba(255,255,255,0.12)');
      }
    }
  }

  // =========================================================================
  // 5. APERTURE: Vermilion Target Aperture Snap
  // =========================================================================
  function renderAperture(ctx, progress) {
    const maxRadius = Math.hypot(CX, CY) + 80; // ~1182px
    const isPhase2 = progress >= 0.5;
    const phaseP = isPhase2 ? (progress - 0.5) * 2 : progress * 2; // 0..1

    let holeRadius;
    if (!isPhase2) {
      holeRadius = maxRadius * (1 - easeInCubic(phaseP));
    } else {
      holeRadius = maxRadius * easeOutExpo(phaseP);
    }

    ctx.save();

    // Solid outer iris shutter (#0D0D0D) with circular center aperture cutout
    ctx.fillStyle = '#0D0D0D';
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    if (holeRadius > 0.5) {
      ctx.moveTo(CX + holeRadius, CY);
      ctx.arc(CX, CY, holeRadius, 0, Math.PI * 2, true);
    }
    ctx.fill('evenodd');

    // 8 mechanical vermilion & charcoal iris blades snapping around the aperture
    const bladeCount = 8;
    const bladeRotation = isPhase2
      ? phaseP * (Math.PI * 0.45)
      : (1 - phaseP) * -(Math.PI * 0.45);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    if (holeRadius > 0.5) {
      ctx.moveTo(CX + holeRadius, CY);
      ctx.arc(CX, CY, holeRadius, 0, Math.PI * 2, true);
    }
    ctx.clip('evenodd');

    for (let i = 0; i < bladeCount; i++) {
      const a = (i / bladeCount) * Math.PI * 2 + bladeRotation;
      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(a);

      // Vermilion inner bevel blade
      ctx.fillStyle = i % 2 === 0 ? '#FF4D2A' : '#1E1E1E';
      ctx.beginPath();
      ctx.moveTo(holeRadius, -10);
      ctx.lineTo(holeRadius + 160, -140);
      ctx.lineTo(holeRadius + 160, 48);
      ctx.closePath();
      ctx.fill();

      // Precision blade edge stroke
      ctx.strokeStyle = 'rgba(245, 245, 245, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(holeRadius, 0);
      ctx.lineTo(maxRadius, 120);
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();

    // Concentric thin radar rings & target reticle around the aperture
    ctx.strokeStyle = '#FF4D2A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CX, CY, Math.max(2, holeRadius), 0, Math.PI * 2);
    ctx.stroke();

    const ringRadii = [holeRadius + 38, holeRadius + 96, holeRadius + 180];
    for (let r = 0; r < ringRadii.length; r++) {
      const rr = ringRadii[r];
      if (rr > maxRadius + 160) continue;
      ctx.strokeStyle = r === 0 ? 'rgba(255, 77, 42, 0.72)' : 'rgba(245, 245, 245, 0.24)';
      ctx.lineWidth = r === 0 ? 2 : 1;
      ctx.setLineDash(r === 1 ? [18, 12] : []);
      ctx.beginPath();
      ctx.arc(CX, CY, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Shockwave ring bursting outward right after midpoint (progress >= 0.5)
    if (isPhase2) {
      const shockR = maxRadius * 1.15 * easeOutCubic(phaseP);
      const alpha = Math.max(0, 1 - phaseP);
      ctx.strokeStyle = `rgba(255, 77, 42, ${0.95 * alpha})`;
      ctx.lineWidth = 18 * alpha + 2;
      ctx.beginPath();
      ctx.arc(CX, CY, shockR, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary crisp white shockwave halo
      ctx.strokeStyle = `rgba(245, 245, 245, ${0.7 * alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(CX, CY, shockR * 0.86, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Center target crosshair snap near midpoint (0.35 .. 0.62)
    if (progress > 0.3 && progress < 0.65) {
      const snapAlpha = 1 - Math.abs(progress - 0.48) / 0.18;
      if (snapAlpha > 0) {
        ctx.strokeStyle = `rgba(255, 77, 42, ${clamp01(snapAlpha)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(CX - 64, CY);
        ctx.lineTo(CX + 64, CY);
        ctx.moveTo(CX, CY - 64);
        ctx.lineTo(CX, CY + 64);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // =========================================================================
  // PUBLIC TRANSITION CONTROLLER
  // =========================================================================
  window.App = window.App || {};
  window.App.transitions = {
    active: false,

    play(type, onMidpoint, onComplete) {
      const resolvedType = VALID_TYPES.includes(type) ? type : 'diagonal';
      state.active = true;
      state.type = resolvedType;
      state.elapsed = 0;
      state.duration = DURATION;
      state.midpointFired = false;
      state.onMidpoint = typeof onMidpoint === 'function' ? onMidpoint : null;
      state.onComplete = typeof onComplete === 'function' ? onComplete : null;
      this.active = true;
    },

    render(ctx, dt) {
      if (!state.active) return;

      state.elapsed += dt;
      const progress = clamp01(state.elapsed / state.duration);

      if (!state.midpointFired && progress >= 0.5) {
        state.midpointFired = true;
        if (state.onMidpoint) {
          try {
            state.onMidpoint();
          } catch (err) {
            console.error('Midpoint callback error:', err);
          }
        }
      }

      switch (state.type) {
        case 'diagonal':
          renderDiagonal(ctx, progress);
          break;
        case 'slam':
          renderSlam(ctx, progress);
          break;
        case 'truchet':
          renderTruchet(ctx, progress);
          break;
        case 'tiles3d':
          renderTiles3D(ctx, progress);
          break;
        case 'aperture':
          renderAperture(ctx, progress);
          break;
        default:
          renderDiagonal(ctx, progress);
          break;
      }

      if (progress >= 1) {
        state.active = false;
        this.active = false;
        const done = state.onComplete;
        state.onMidpoint = null;
        state.onComplete = null;
        if (done) {
          try {
            done();
          } catch (err) {
            console.error('Transition complete error:', err);
          }
        }
      }
    }
  };
})();
