(function () {
  window.App = window.App || {};
  window.App.slides = window.App.slides || {};

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - clamp01(t), 3);
  }

  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const x = clamp01(t) - 1;
    return 1 + c3 * x * x * x + c1 * x * x;
  }

  function easeOutElastic(t) {
    const x = clamp01(t);
    if (x === 0 || x === 1) return x;
    const c4 = (2 * Math.PI) / 3.2;
    return Math.pow(2, -9 * x) * Math.sin((x * 9 - 0.75) * c4) + 1;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const n = parseInt(clean, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function lerpColor(hexA, hexB, t) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const u = clamp01(t);
    const r = Math.round(lerp(a.r, b.r, u));
    const g = Math.round(lerp(a.g, b.g, u));
    const bl = Math.round(lerp(a.b, b.b, u));
    return `rgb(${r}, ${g}, ${bl})`;
  }

  function drawGrid(ctx, w, h, step, strokeStyle) {
    ctx.save();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = step; x < w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = step; y < h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // =========================================================================
  // SLIDE 0: 00 / INTRO
  // =========================================================================
  window.App.slides[0] = {
    hudLabel: 'INTRO',
    theme: { bg: '#0D0D0D', fg: '#F5F5F5', accent: '#FF4D2A' },
    transition: 'diagonal',

    init(uiLayer) {
      uiLayer.innerHTML = `
        <div class="slide-root" style="padding: 92px 96px 104px; display: grid; grid-template-columns: 1.02fr 0.98fr; gap: 56px; align-items: center;">
          <!-- Left spacer aligns cleanly over the animated kinetic canvas reveal -->
          <div style="height: 100%; pointer-events: none;"></div>

          <!-- Right Editorial Roster Card (staggered fade-in at 1.4s) -->
          <div style="display: flex; flex-direction: column; gap: 28px; animation: ui-rise-in 0.85s cubic-bezier(0.22, 1, 0.36, 1) 1.4s both;">
            <div>
              <div class="eyebrow" style="margin-bottom: 14px;">VẬT LÍ LỚP 10 • CHƯƠNG MỞ ĐẦU</div>
              <p class="lead-copy" style="font-size: 28px; color: #F5F5F5; font-weight: 600; line-height: 1.38;">
                “Hành trình từ tư duy triết học đến khám phá vũ trụ”
              </p>
            </div>

            <div class="glass-card" style="padding: 32px 36px; border-color: rgba(255, 77, 42, 0.38); background: linear-gradient(145deg, rgba(255, 77, 42, 0.08), rgba(255, 255, 255, 0.03));">
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 18px; border-bottom: 1px solid rgba(245, 245, 245, 0.14); margin-bottom: 22px;">
                <span style="font-size: 32px; font-weight: 900; letter-spacing: -0.02em; color: #FF4D2A;">NHÓM 1</span>
                <span class="mono-tag" style="border-color: rgba(255,77,42,0.45); color: #F5F5F5;">THUYẾT TRÌNH: MINH QUÂN & TUẤN MINH</span>
              </div>

              <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.16em; color: rgba(245,245,245,0.55); margin-bottom: 14px;">
                DANH SÁCH THÀNH VIÊN THỰC HIỆN
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div style="padding: 14px 16px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);">
                  <div style="font-size: 19px; font-weight: 700; color: #F5F5F5;">Nguyễn Trần Đăng Quang</div>
                  <div style="font-family: var(--font-mono); font-size: 12px; color: #FF4D2A; margin-top: 4px;">EDITOR + TEAM LEADER</div>
                </div>
                <div style="padding: 14px 16px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);">
                  <div style="font-size: 19px; font-weight: 700; color: #F5F5F5;">Phan Nguyễn Minh Quân</div>
                  <div style="font-family: var(--font-mono); font-size: 12px; color: rgba(245,245,245,0.62); margin-top: 4px;">DATA COLLECTOR</div>
                </div>
                <div style="padding: 14px 16px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);">
                  <div style="font-size: 19px; font-weight: 700; color: #F5F5F5;">Nguyễn Phú Quang</div>
                  <div style="font-family: var(--font-mono); font-size: 12px; color: rgba(245,245,245,0.62); margin-top: 4px;">DATA COLLECTOR</div>
                </div>
                <div style="padding: 14px 16px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);">
                  <div style="font-size: 19px; font-weight: 700; color: #F5F5F5;">Vũ Nguyễn Tuấn Minh</div>
                  <div style="font-family: var(--font-mono); font-size: 12px; color: rgba(245,245,245,0.62); margin-top: 4px;">DATA COLLECTOR</div>
                </div>
              </div>
            </div>

            <button id="intro-start-btn" type="button" style="align-self: flex-start; appearance: none; border: 1px solid rgba(255, 77, 42, 0.65); background: rgba(255, 77, 42, 0.14); color: #F5F5F5; font-family: var(--font-mono); font-size: 15px; font-weight: 700; letter-spacing: 0.14em; padding: 14px 24px; border-radius: 999px; cursor: pointer; animation: hud-pulse 1.9s ease-in-out infinite;">
              [NHẤN SPACE HOẶC → ĐỂ BẮT ĐẦU]
            </button>
          </div>
        </div>
      `;

      const startBtn = uiLayer.querySelector('#intro-start-btn');
      if (startBtn) {
        startBtn.addEventListener('click', () => window.App.next());
      }
    },

    render(ctx, dt, t, mouse) {
      const W = 1920;
      const H = 1080;
      const focalX = 500;
      const focalY = 540;

      // Subtle architectural grid
      drawGrid(ctx, W, H, 120, 'rgba(245, 245, 245, 0.04)');

      // Vertical Swiss divider between art focal & roster
      ctx.strokeStyle = 'rgba(245, 245, 245, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(950, 88);
      ctx.lineTo(950, H - 88);
      ctx.stroke();

      // Mouse parallax offset
      const px = ((mouse.x - 960) / 960) * 18;
      const py = ((mouse.y - 540) / 540) * 14;

      // 1. Expanding concentric radar rings (0 -> 3.5s intro sequence + continuous pulse)
      const ringCount = 6;
      for (let i = 0; i < ringCount; i++) {
        const introDelay = i * 0.14;
        const introU = clamp01((t - introDelay) / 1.8);
        const pulse = (t * 0.24 + i / ringCount) % 1;
        const baseR = 130 + i * 74;
        const r = baseR * easeOutCubic(introU) + pulse * 48;
        const alpha = Math.max(0.06, (1 - i * 0.13) * 0.42 * introU * (1 - pulse * 0.45));

        ctx.save();
        ctx.strokeStyle = i % 2 === 0
          ? `rgba(255, 77, 42, ${alpha})`
          : `rgba(245, 245, 245, ${alpha * 0.7})`;
        ctx.lineWidth = i === 0 ? 2.5 : 1.25;
        if (i % 3 === 1) ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.arc(focalX + px * 0.6, focalY + py * 0.6, Math.max(2, r), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Orbiting telemetry node on outermost ring
      const orbAngle = t * 0.55;
      const orbR = 390;
      const ox = focalX + px * 0.6 + Math.cos(orbAngle) * orbR;
      const oy = focalY + py * 0.6 + Math.sin(orbAngle) * orbR;
      ctx.fillStyle = '#FF4D2A';
      ctx.beginPath();
      ctx.arc(ox, oy, 7, 0, Math.PI * 2);
      ctx.fill();

      // 2. Two horizontal white spring bars snapping apart (0.25s -> 1.35s)
      const barSlideIn = easeOutCubic((t - 0.08) / 0.42);
      const splitProgress = easeOutBack((t - 0.36) / 0.85);
      const halfAperture = lerp(0, 154, splitProgress);
      const barWidth = 760 * barSlideIn;
      const barLeft = focalX - 380 + px * 0.35;
      const barCenterY = focalY - 12 + py * 0.35;

      // Masked reveal window between the two spring bars
      if (halfAperture > 2) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(barLeft - 20, barCenterY - halfAperture, barWidth + 40, halfAperture * 2);
        ctx.clip();

        // Dark backing pill inside reveal window
        ctx.fillStyle = 'rgba(13, 13, 13, 0.86)';
        ctx.fillRect(barLeft - 10, barCenterY - halfAperture, barWidth + 20, halfAperture * 2);

        // Eyebrow: SƠ LƯỢC VỀ SỰ PHÁT TRIỂN
        const titleFade = easeOutCubic((t - 0.48) / 0.55);
        ctx.globalAlpha = titleFade;
        ctx.fillStyle = '#FF4D2A';
        ctx.font = '700 22px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('SƠ LƯỢC VỀ SỰ PHÁT TRIỂN', barLeft + 8, barCenterY - 82);

        // Giant masked kinetic typography: VẬT LÍ HỌC
        const textShift = (1 - easeOutCubic((t - 0.42) / 0.7)) * 46;
        ctx.fillStyle = '#F5F5F5';
        ctx.font = '900 128px "Be Vietnam Pro", sans-serif';
        ctx.fillText('VẬT LÍ HỌC', barLeft + 4, barCenterY + 12 + textShift);

        // Sub-caption below giant title (appears smoothly up to 3.5s)
        const subFade = easeOutCubic((t - 1.05) / 0.75);
        ctx.globalAlpha = subFade * 0.84;
        ctx.fillStyle = '#F5F5F5';
        ctx.font = '600 22px "Be Vietnam Pro", sans-serif';
        ctx.fillText('TỪ TRIẾT HỌC TỰ NHIÊN ĐẾN KỈ NGUYÊN LƯỢNG TỬ', barLeft + 8, barCenterY + 106);

        ctx.restore();
      }

      // Draw the two snapping white spring bars
      if (barWidth > 2) {
        ctx.fillStyle = '#F5F5F5';
        ctx.fillRect(barLeft, barCenterY - halfAperture - 6, barWidth, 6);
        ctx.fillRect(barLeft, barCenterY + halfAperture, barWidth, 6);

        // Vermilion end-cap markers
        ctx.fillStyle = '#FF4D2A';
        ctx.fillRect(barLeft, barCenterY - halfAperture - 6, 36, 6);
        ctx.fillRect(barLeft + barWidth - 36, barCenterY + halfAperture, 36, 6);
      }

      // Subtle timeline calibration strip at bottom-left
      const calAlpha = easeOutCubic((t - 1.6) / 0.8);
      if (calAlpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = calAlpha * 0.7;
        ctx.fillStyle = '#F5F5F5';
        ctx.font = '400 14px "JetBrains Mono", monospace';
        ctx.fillText('585 TCN  ────────  TK XVII  ────────  HIỆN ĐẠI', 100, 920);
        ctx.restore();
      }
    }
  };

  // =========================================================================
  // SLIDE 1: 01 / 3 GIAI ĐOẠN (240-Vertex Arc-Length Resampled Morph)
  // =========================================================================
  function resampleClosedPolygon(pts, count) {
    const n = pts.length;
    const lengths = [0];
    let total = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      total += Math.hypot(b.x - a.x, b.y - a.y);
      lengths.push(total);
    }

    const out = [];
    for (let k = 0; k < count; k++) {
      const target = (k / count) * total;
      let seg = 0;
      while (seg < n - 1 && lengths[seg + 1] < target) seg++;
      const l0 = lengths[seg];
      const l1 = lengths[seg + 1];
      const u = l1 > l0 ? (target - l0) / (l1 - l0) : 0;
      const a = pts[seg];
      const b = pts[(seg + 1) % n];
      out.push({
        x: a.x + (b.x - a.x) * u,
        y: a.y + (b.y - a.y) * u
      });
    }
    return out;
  }

  function buildTriangleShape() {
    const R = 280;
    const pts = [];
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
      pts.push({ x: Math.cos(a) * R, y: Math.sin(a) * R + 32 });
    }
    return resampleClosedPolygon(pts, 240);
  }

  function buildGearShape() {
    const teeth = 12;
    const rOuter = 262;
    const rInner = 204;
    const pts = [];
    for (let i = 0; i < teeth; i++) {
      const base = (i / teeth) * Math.PI * 2 - Math.PI / 2;
      const step = (Math.PI * 2) / teeth;
      const a0 = base;
      const a1 = base + step * 0.16;
      const a2 = base + step * 0.34;
      const a3 = base + step * 0.52;
      const a4 = base + step * 0.68;
      const a5 = base + step * 0.86;
      pts.push({ x: Math.cos(a0) * rInner, y: Math.sin(a0) * rInner });
      pts.push({ x: Math.cos(a1) * rOuter, y: Math.sin(a1) * rOuter });
      pts.push({ x: Math.cos(a2) * rOuter, y: Math.sin(a2) * rOuter });
      pts.push({ x: Math.cos(a3) * rInner, y: Math.sin(a3) * rInner });
      pts.push({ x: Math.cos(a4) * rInner, y: Math.sin(a4) * rInner });
      pts.push({ x: Math.cos(a5) * rInner, y: Math.sin(a5) * rInner });
    }
    return resampleClosedPolygon(pts, 240);
  }

  function buildAtomContourShape() {
    const pts = [];
    const steps = 180;
    for (let i = 0; i < steps; i++) {
      const theta = (i / steps) * Math.PI * 2 - Math.PI / 2;
      const r = 186 + 78 * Math.cos(6 * theta);
      pts.push({ x: Math.cos(theta) * r, y: Math.sin(theta) * r });
    }
    return resampleClosedPolygon(pts, 240);
  }

  const ERA_SHAPES = [buildTriangleShape(), buildGearShape(), buildAtomContourShape()];
  const ERA_COLORS = ['#B8C0FF', '#FF4D2A', '#2B44FF'];

  const slide1State = {
    currentEra: 0,
    prevEra: 0,
    morphTimer: 1
  };

  window.App.slides[1] = {
    hudLabel: '3 GIAI ĐOẠN',
    theme: { bg: '#0D0D0D', fg: '#F5F5F5', accent: '#FF4D2A' },
    transition: 'diagonal',

    init(uiLayer) {
      slide1State.currentEra = 0;
      slide1State.prevEra = 0;
      slide1State.morphTimer = 1;

      uiLayer.innerHTML = `
        <div class="slide-root" style="display: grid; grid-template-columns: 0.92fr 1.08fr; gap: 56px; align-items: center; padding: 92px 96px 104px;">
          <!-- Left spacer for 240-vertex morphing canvas -->
          <div style="height: 100%; pointer-events: none;"></div>

          <!-- Right Interactive Era Cards -->
          <div style="display: flex; flex-direction: column; gap: 22px;">
            <div class="anim-in">
              <div class="eyebrow" style="margin-bottom: 12px;">TIẾN TRÌNH LỊCH SỬ</div>
              <h2 class="slide-title" style="font-size: 62px;">3 GIAI ĐOẠN PHÁT TRIỂN</h2>
              <p class="lead-copy" style="font-size: 21px; margin-top: 10px;">
                Chọn từng giai đoạn để biến đổi biểu tượng hình học và đối chiếu phương pháp nghiên cứu.
              </p>
            </div>

            <div id="era-list" style="display: flex; flex-direction: column; gap: 16px;">
              <button class="glass-card era-card is-selected" data-era="0" type="button" style="text-align: left; cursor: pointer; display: flex; flex-direction: column; gap: 8px; border-width: 1.5px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: #B8C0FF;">01 • 585 TCN – TK XVI</span>
                  <span class="mono-tag" style="color: #B8C0FF; border-color: rgba(184,192,255,0.4);">QUAN SÁT & SUY LUẬN</span>
                </div>
                <div style="font-size: 26px; font-weight: 800; color: #F5F5F5;">Triết học Tự nhiên Tiền Thực nghiệm</div>
                <div style="font-size: 18px; line-height: 1.5; color: rgba(245,245,245,0.74);">
                  Tìm hiểu thế giới dựa trên quan sát và suy luận chủ quan (<strong style="color:#B8C0FF;">Aristotle, Pythagoras</strong>).
                </div>
              </button>

              <button class="glass-card era-card" data-era="1" type="button" style="text-align: left; cursor: pointer; display: flex; flex-direction: column; gap: 8px; border-width: 1.5px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: #FF4D2A;">02 • TK XVII – XIX</span>
                  <span class="mono-tag" style="color: #FF4D2A; border-color: rgba(255,77,42,0.4);">VẬT LÍ THỰC NGHIỆM</span>
                </div>
                <div style="font-size: 26px; font-weight: 800; color: #F5F5F5;">Cách mạng Thực nghiệm & Vật lí Cổ điển</div>
                <div style="font-size: 18px; line-height: 1.5; color: rgba(245,245,245,0.74);">
                  Dùng phương pháp thực nghiệm kiểm chứng lí thuyết, mở đầu bởi <strong style="color:#FF4D2A;">Galileo Galilei</strong>.
                </div>
              </button>

              <button class="glass-card era-card" data-era="2" type="button" style="text-align: left; cursor: pointer; display: flex; flex-direction: column; gap: 8px; border-width: 1.5px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: #7C8FFF;">03 • CUỐI TK XIX – NAY</span>
                  <span class="mono-tag" style="color: #7C8FFF; border-color: rgba(43,68,255,0.55);">LÍ THUYẾT & THỰC NGHIỆM</span>
                </div>
                <div style="font-size: 26px; font-weight: 800; color: #F5F5F5;">Vật lí Hiện đại</div>
                <div style="font-size: 18px; line-height: 1.5; color: rgba(245,245,245,0.74);">
                  Vật lí hiện đại kết hợp chặt chẽ <strong style="color:#7C8FFF;">mô hình toán học</strong> và thực nghiệm tối tân.
                </div>
              </button>
            </div>
          </div>
        </div>
      `;

      const cards = Array.from(uiLayer.querySelectorAll('.era-card'));
      function syncCardStyles(activeIdx) {
        cards.forEach((card, idx) => {
          const isSelected = idx === activeIdx;
          const color = ERA_COLORS[idx];
          card.style.borderColor = isSelected ? color : 'rgba(245, 245, 245, 0.14)';
          card.style.background = isSelected
            ? `linear-gradient(135deg, ${color}24, rgba(255,255,255,0.04))`
            : 'rgba(255,255,255,0.04)';
          card.style.transform = isSelected ? 'translateX(8px)' : 'translateX(0)';
        });
      }

      syncCardStyles(0);

      cards.forEach((card) => {
        card.addEventListener('click', () => {
          const nextEra = Number(card.dataset.era);
          if (nextEra !== slide1State.currentEra) {
            slide1State.prevEra = slide1State.currentEra;
            slide1State.currentEra = nextEra;
            slide1State.morphTimer = 0;
            syncCardStyles(nextEra);
          }
        });
      });
    },

    render(ctx, dt, t, mouse) {
      const W = 1920;
      const H = 1080;
      const cx = 470;
      const cy = 535;

      drawGrid(ctx, W, H, 120, 'rgba(245, 245, 245, 0.035)');

      slide1State.morphTimer = Math.min(1, slide1State.morphTimer + dt / 0.85);
      const elastic = easeOutElastic(slide1State.morphTimer);
      const smoothU = easeOutCubic(slide1State.morphTimer);

      const fromPoly = ERA_SHAPES[slide1State.prevEra];
      const toPoly = ERA_SHAPES[slide1State.currentEra];
      const color = lerpColor(
        ERA_COLORS[slide1State.prevEra],
        ERA_COLORS[slide1State.currentEra],
        smoothU
      );

      // Subtle mouse attraction tilt
      const mx = ((mouse.x - cx) / 960) * 14;
      const my = ((mouse.y - cy) / 540) * 14;

      // Ambient halo behind morphing emblem
      const grad = ctx.createRadialGradient(cx + mx, cy + my, 30, cx + mx, cy + my, 360);
      grad.addColorStop(0, color.replace('rgb', 'rgba').replace(')', ', 0.24)'));
      grad.addColorStop(1, 'rgba(13, 13, 13, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx + mx, cy + my, 360, 0, Math.PI * 2);
      ctx.fill();

      // Technical calibration ring
      ctx.save();
      ctx.translate(cx + mx * 0.5, cy + my * 0.5);
      ctx.strokeStyle = 'rgba(245, 245, 245, 0.14)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, 326, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw interpolated 240-vertex arc-length resampled polygon
      const rot = slide1State.currentEra === 1 ? t * 0.22 : Math.sin(t * 0.7) * 0.04;
      ctx.rotate(rot);

      ctx.beginPath();
      for (let i = 0; i < 240; i++) {
        const a = fromPoly[i];
        const b = toPoly[i];
        const x = lerp(a.x, b.x, elastic);
        const y = lerp(a.y, b.y, elastic);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', ', 0.16)');
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Era-specific internal crisp vector emblems
      const era = slide1State.currentEra;
      if (era === 0) {
        // Con mắt hình học + tam giác vuông Pythagoras
        ctx.rotate(-rot);
        ctx.strokeStyle = '#B8C0FF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-110, 26);
        ctx.quadraticCurveTo(0, -68, 110, 26);
        ctx.quadraticCurveTo(0, 120, -110, 26);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 26, 38, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#B8C0FF';
        ctx.beginPath();
        ctx.arc(0, 26, 13, 0, Math.PI * 2);
        ctx.fill();
      } else if (era === 1) {
        // Bánh răng thực nghiệm: inner axle, 4 spokes, vernier ring
        ctx.strokeStyle = '#FF4D2A';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, 118, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 44, 0, Math.PI * 2);
        ctx.stroke();

        for (let s = 0; s < 4; s++) {
          const a = (s * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 44, Math.sin(a) * 44);
          ctx.lineTo(Math.cos(a) * 118, Math.sin(a) * 118);
          ctx.stroke();
        }
      } else {
        // Nguyên tử quỹ đạo: 3 intersecting elliptical orbits + orbiting electrons
        ctx.rotate(-rot);
        for (let o = 0; o < 3; o++) {
          ctx.save();
          ctx.rotate((o * Math.PI) / 3 + t * 0.15);
          ctx.strokeStyle = 'rgba(124, 143, 255, 0.85)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, 152, 54, 0, 0, Math.PI * 2);
          ctx.stroke();

          const eAng = t * 2.4 + o * 2.1;
          ctx.fillStyle = '#F5F5F5';
          ctx.beginPath();
          ctx.arc(Math.cos(eAng) * 152, Math.sin(eAng) * 54, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = '#2B44FF';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#F5F5F5';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();

      // Vertex counter & era telemetry label under emblem
      ctx.fillStyle = 'rgba(245, 245, 245, 0.58)';
      ctx.font = '700 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const labels = [
        '240-VERTEX POLYGON • TAM GIÁC PYTHAGORAS',
        '240-VERTEX POLYGON • BÁNH RĂNG THỰC NGHIỆM',
        '240-VERTEX POLYGON • NGUYÊN TỬ QUỸ ĐẠO'
      ];
      ctx.fillText(labels[slide1State.currentEra], cx, 922);
    }
  };

  // =========================================================================
  // SLIDE 2: 02 / THỰC NGHIỆM (Leaning Tower of Pisa + Galileo Drop Sim)
  // =========================================================================
  const slide2State = {
    vacuum: true,
    simTime: 0
  };

  window.App.slides[2] = {
    hudLabel: 'THỰC NGHIỆM',
    theme: { bg: '#EFECE6', fg: '#0D0D0D', accent: '#FF4D2A' },
    transition: 'truchet',

    init(uiLayer) {
      slide2State.vacuum = true;
      slide2State.simTime = 0;

      uiLayer.innerHTML = `
        <div class="slide-root" style="display: grid; grid-template-columns: 0.94fr 1.06fr; gap: 56px; align-items: center; padding: 92px 96px 104px; color: #0D0D0D;">
          <!-- Left spacer over procedural Leaning Tower of Pisa & live drop -->
          <div style="height: 100%; pointer-events: none;"></div>

          <!-- Right Editorial Content & Interactive Controls -->
          <div style="display: flex; flex-direction: column; gap: 22px;">
            <div class="anim-in">
              <div class="eyebrow" style="margin-bottom: 10px;">CUỘC CÁCH MẠNG THẾ KỈ XVII</div>
              <h2 class="slide-title" style="font-size: 58px; color: #0D0D0D;">GALILEO GALILEI</h2>
              <div style="font-family: var(--font-mono); font-size: 17px; font-weight: 700; color: #FF4D2A; margin-top: 6px;">
                (1564 – 1642) • CHA ĐẺ CỦA PHƯƠNG PHÁP THỰC NGHIỆM
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;" class="anim-in delay-1">
              <div class="glass-card" style="background: rgba(13, 13, 13, 0.04); border-color: rgba(13, 13, 13, 0.16); padding: 22px 24px;">
                <div style="font-family: var(--font-mono); font-size: 13px; font-weight: 700; color: rgba(13,13,13,0.58); margin-bottom: 8px;">
                  QUAN NIỆM ARISTOTLE (SAI LẦM)
                </div>
                <p style="font-size: 18px; line-height: 1.5; color: #0D0D0D;">
                  Suy luận cảm tính cho rằng <strong>vật nặng luôn rơi nhanh hơn vật nhẹ</strong> tỉ lệ với khối lượng.
                </p>
              </div>

              <div class="glass-card" style="background: rgba(255, 77, 42, 0.1); border-color: rgba(255, 77, 42, 0.48); padding: 22px 24px;">
                <div style="font-family: var(--font-mono); font-size: 13px; font-weight: 700; color: #FF4D2A; margin-bottom: 8px;">
                  CHỨNG MINH CỦA GALILEO
                </div>
                <p style="font-size: 18px; line-height: 1.5; color: #0D0D0D;">
                  Thực nghiệm tháp nghiêng Pisa chứng minh sự rơi không phụ thuộc khối lượng khi bỏ qua lực cản.
                </p>
              </div>
            </div>

            <blockquote class="glass-card anim-in delay-2" style="background: #0D0D0D; color: #F5F5F5; border-color: #0D0D0D; padding: 26px 30px;">
              <p style="font-size: 22px; font-weight: 600; line-height: 1.48;">
                “Nếu loại bỏ sức cản không khí, mọi vật rơi với cùng một gia tốc, bất kể khối lượng.”
              </p>
              <div style="font-family: var(--font-mono); font-size: 13px; color: #FF4D2A; margin-top: 10px;">
                GIA TỐC RƠI TỰ DO: g ≈ 9,8 m/s² • PHƯƠNG TRÌNH: h = ½ g t²
              </div>
            </blockquote>

            <div class="anim-in delay-3" style="display: flex; flex-wrap: wrap; gap: 14px; align-items: center;">
              <button id="btn-toggle-env" type="button" class="pill-btn" style="background: #0D0D0D; color: #F5F5F5; border-color: #0D0D0D; font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.06em;">
                [MÔI TRƯỜNG: CHÂN KHÔNG ⇄ CÓ KHÔNG KHÍ]
              </button>
              <button id="btn-redrop" type="button" class="pill-btn" style="background: #FF4D2A; color: #FFFFFF; border-color: #FF4D2A; font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.06em;">
                [THẢ LẠI THÍ NGHIỆM]
              </button>
            </div>

            <div id="env-status-pill" style="font-family: var(--font-mono); font-size: 15px; font-weight: 700; color: #0D0D0D;">
              TRẠNG THÁI HIỆN TẠI: <span style="color: #FF4D2A;">CHÂN KHÔNG (KHÔNG LỰC CẢN)</span>
            </div>
          </div>
        </div>
      `;

      const btnEnv = uiLayer.querySelector('#btn-toggle-env');
      const btnRedrop = uiLayer.querySelector('#btn-redrop');
      const statusPill = uiLayer.querySelector('#env-status-pill');

      btnEnv.addEventListener('click', () => {
        slide2State.vacuum = !slide2State.vacuum;
        slide2State.simTime = 0;
        statusPill.innerHTML = slide2State.vacuum
          ? 'TRẠNG THÁI HIỆN TẠI: <span style="color: #FF4D2A;">CHÂN KHÔNG (KHÔNG LỰC CẢN)</span>'
          : 'TRẠNG THÁI HIỆN TẠI: <span style="color: #2B44FF;">CÓ KHÔNG KHÍ (CÓ LỰC CẢN)</span>';
      });

      btnRedrop.addEventListener('click', () => {
        slide2State.simTime = 0;
      });
    },

    render(ctx, dt) {
      const W = 1920;
      const H = 1080;

      // Warm Cream architectural grid
      drawGrid(ctx, W, H, 120, 'rgba(13, 13, 13, 0.05)');

      // Update drop physics
      const g = 9.8;
      const towerHeightM = 56;
      const tDrop = slide2State.simTime;
      slide2State.simTime += dt;

      // Ground plane
      const groundY = 935;
      ctx.strokeStyle = '#0D0D0D';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(70, groundY);
      ctx.lineTo(880, groundY);
      ctx.stroke();

      // Procedural Leaning Tower of Pisa (tilted ~4 deg)
      const towerBaseX = 275;
      const tiltRad = (4.1 * Math.PI) / 180;
      const towerW = 194;
      const tierCount = 6;
      const tierH = 92;

      ctx.save();
      ctx.translate(towerBaseX, groundY);
      ctx.rotate(tiltRad);

      // Base podium
      ctx.fillStyle = '#E4DFD4';
      ctx.strokeStyle = '#0D0D0D';
      ctx.lineWidth = 2.5;
      ctx.fillRect(-towerW * 0.56, -88, towerW * 1.12, 88);
      ctx.strokeRect(-towerW * 0.56, -88, towerW * 1.12, 88);

      // 6 Arched Loggia Tiers
      for (let tier = 0; tier < tierCount; tier++) {
        const ty = -88 - (tier + 1) * tierH;
        const w = towerW * (1 - tier * 0.015);
        ctx.fillStyle = tier % 2 === 0 ? '#EAE5DB' : '#E0DACD';
        ctx.fillRect(-w * 0.5, ty, w, tierH);
        ctx.strokeRect(-w * 0.5, ty, w, tierH);

        // Shadow side on right
        ctx.fillStyle = 'rgba(13, 13, 13, 0.07)';
        ctx.fillRect(w * 0.16, ty, w * 0.34, tierH);

        // Colonnade arches
        const arches = 5;
        const archW = (w - 22) / arches;
        for (let a = 0; a < arches; a++) {
          const ax = -w * 0.5 + 11 + a * archW;
          ctx.beginPath();
          ctx.moveTo(ax + 4, ty + tierH - 8);
          ctx.lineTo(ax + 4, ty + 34);
          ctx.arc(ax + archW * 0.5, ty + 34, archW * 0.5 - 4, Math.PI, 0);
          ctx.lineTo(ax + archW - 4, ty + tierH - 8);
          ctx.strokeStyle = 'rgba(13, 13, 13, 0.65)';
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      }

      // Top Belfry
      const belfryY = -88 - tierCount * tierH - 84;
      const belfryW = towerW * 0.68;
      ctx.fillStyle = '#EAE5DB';
      ctx.strokeStyle = '#0D0D0D';
      ctx.lineWidth = 2.5;
      ctx.fillRect(-belfryW * 0.5, belfryY, belfryW, 84);
      ctx.strokeRect(-belfryW * 0.5, belfryY, belfryW, 84);

      // Balcony drop ledge extending right
      ctx.fillStyle = '#FF4D2A';
      ctx.fillRect(belfryW * 0.5 - 6, belfryY + 62, 62, 10);

      // Flagpole on roof
      ctx.beginPath();
      ctx.moveTo(0, belfryY);
      ctx.lineTo(0, belfryY - 38);
      ctx.stroke();

      ctx.restore();

      // Calculate exact screen-space drop shaft coordinates aligned with balcony overhang
      const dropTopY = 235;
      const dropDistPx = groundY - dropTopY - 22;
      const pxPerMeter = dropDistPx / towerHeightM;

      const sphereX = 525;
      const featherX = 675;

      // Vertical height scale & telemetry dashed shaft
      ctx.save();
      ctx.strokeStyle = 'rgba(13, 13, 13, 0.24)';
      ctx.setLineDash([6, 8]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sphereX, dropTopY);
      ctx.lineTo(sphereX, groundY);
      ctx.moveTo(featherX, dropTopY);
      ctx.lineTo(featherX, groundY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Height ruler markers (56m -> 0m)
      ctx.fillStyle = 'rgba(13, 13, 13, 0.65)';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      for (let m = 0; m <= 56; m += 14) {
        const ry = groundY - m * pxPerMeter;
        ctx.fillRect(760, ry, 10, 1.5);
        ctx.fillText(`${m} m`, 778, ry + 4);
      }

      // Physics for Iron Sphere (negligible drag in both vacuum & air over 56m)
      const timeToLand = Math.sqrt((2 * towerHeightM) / g); // ~3.38s
      const sphereT = Math.min(tDrop, timeToLand);
      const sphereDistM = 0.5 * g * sphereT * sphereT;
      const sphereVel = tDrop < timeToLand ? g * sphereT : 0;
      const sphereY = dropTopY + sphereDistM * pxPerMeter;

      // Physics for Feather
      let featherDistM;
      let featherVel;
      let featherSwayX = 0;
      let featherLanded = false;

      if (slide2State.vacuum) {
        const fT = Math.min(tDrop, timeToLand);
        featherDistM = 0.5 * g * fT * fT;
        featherVel = tDrop < timeToLand ? g * fT : 0;
        featherLanded = tDrop >= timeToLand;
      } else {
        // Air drag model: terminal velocity ~ 4.4 m/s, smooth exponential approach
        const vt = 4.4;
        const tau = vt / g;
        const rawDist = vt * (tDrop - tau * (1 - Math.exp(-tDrop / tau)));
        if (rawDist >= towerHeightM) {
          featherDistM = towerHeightM;
          featherVel = 0;
          featherLanded = true;
        } else {
          featherDistM = rawDist;
          featherVel = vt * (1 - Math.exp(-tDrop / tau));
          featherSwayX = Math.sin(tDrop * 4.5) * 16;
        }
      }

      const featherY = dropTopY + featherDistM * pxPerMeter;

      // Draw Iron Sphere (5 kg)
      ctx.save();
      ctx.fillStyle = '#1B1D24';
      ctx.beginPath();
      ctx.arc(sphereX, sphereY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.beginPath();
      ctx.arc(sphereX - 6, sphereY - 6, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw Vector Feather (0.005 kg)
      ctx.save();
      ctx.translate(featherX + featherSwayX, featherY);
      ctx.rotate(slide2State.vacuum ? -0.25 : -0.25 + Math.sin(tDrop * 4.5) * 0.22);
      ctx.fillStyle = '#FF4D2A';
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0D0D0D';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-34, 0);
      ctx.lineTo(28, 0);
      ctx.stroke();
      ctx.restore();

      // Impact ring when landed
      if (tDrop >= timeToLand && tDrop <= timeToLand + 0.7) {
        const ringU = (tDrop - timeToLand) / 0.7;
        ctx.strokeStyle = `rgba(255, 77, 42, ${1 - ringU})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(sphereX, groundY, 20 + ringU * 52, 8 + ringU * 14, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (slide2State.vacuum) {
          ctx.beginPath();
          ctx.ellipse(featherX, groundY, 20 + ringU * 52, 8 + ringU * 14, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Live Telemetry Boxes at top of drop columns
      ctx.fillStyle = '#0D0D0D';
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('QUẢ CẦU SẮT (5 kg)', sphereX, 168);
      ctx.fillStyle = '#FF4D2A';
      ctx.fillText(`v₁ = ${sphereVel.toFixed(1)} m/s`, sphereX, 192);

      ctx.fillStyle = '#0D0D0D';
      ctx.fillText('LÔNG VŨ (5 g)', featherX, 168);
      ctx.fillStyle = slide2State.vacuum ? '#FF4D2A' : '#2B44FF';
      ctx.fillText(`v₂ = ${featherVel.toFixed(1)} m/s`, featherX, 192);

      // Result pill once sphere lands
      if (tDrop >= timeToLand) {
        ctx.fillStyle = slide2State.vacuum ? '#FF4D2A' : '#2B44FF';
        ctx.font = '700 15px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        const msg = slide2State.vacuum
          ? `CHẠM ĐẤT CÙNG LÚC (${timeToLand.toFixed(2)}s)`
          : featherLanded
            ? 'CÓ KHÔNG KHÍ: LÔNG VŨ CHẠM ĐẤT TRỄ HƠN'
            : 'CÓ KHÔNG KHÍ: LỰC CẢN LÀM LÔNG VŨ RƠI CHẬM';
        ctx.fillText(msg, 600, 985);
      }
    }
  };

  // =========================================================================
  // SLIDE 3: 03 / VẬT LÍ CỔ ĐIỂN (Newton Apple -> Orbit + Watt Steam Piston)
  // =========================================================================
  window.App.slides[3] = {
    hudLabel: 'VẬT LÍ CỔ ĐIỂN',
    theme: { bg: '#0D0D0D', fg: '#F5F5F5', accent: '#FF4D2A' },
    transition: 'slam',

    init(uiLayer) {
      uiLayer.innerHTML = `
        <div class="slide-root" style="display: grid; grid-template-columns: 0.96fr 1.04fr; gap: 52px; align-items: center; padding: 88px 96px 100px;">
          <!-- Left spacer over Newton Apple->Orbit & Steam Piston -->
          <div style="height: 100%; pointer-events: none;"></div>

          <!-- Right Editorial Content -->
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <div class="anim-in">
              <div class="eyebrow" style="margin-bottom: 10px;">THẾ KỈ XVII – XIX • CÁCH MẠNG CÔNG NGHIỆP</div>
              <h2 class="slide-title" style="font-size: 56px;">ISAAC NEWTON & VẬT LÍ CỔ ĐIỂN</h2>
            </div>

            <!-- Newton Highlight Card -->
            <div class="glass-card anim-in delay-1" style="padding: 24px 28px; border-color: rgba(255, 77, 42, 0.45); background: linear-gradient(135deg, rgba(255, 77, 42, 0.1), rgba(255, 255, 255, 0.03));">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px;">
                <span style="font-size: 26px; font-weight: 800; color: #F5F5F5;">Isaac Newton (1643 – 1727)</span>
                <span style="font-family: var(--font-mono); font-size: 15px; color: #FF4D2A; font-weight: 700;">F = G · m₁m₂ / r²</span>
              </div>
              <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 17px; line-height: 1.48; color: rgba(245,245,245,0.86);">
                <li>• <strong style="color:#F5F5F5;">3 Định luật chuyển động</strong> & <strong style="color:#FF4D2A;">Định luật Vạn vật hấp dẫn</strong>.</li>
                <li>• Giai thoại quả táo rơi được ghi nhận qua cháu gái <em>Catherine Barton</em> & <em>Voltaire (1727)</em>.</li>
                <li>• Đặt nền móng giải tích & <strong style="color:#F5F5F5;">Nhị thức Newton</strong>.</li>
              </ul>
            </div>

            <!-- Scope Banner -->
            <div class="anim-in delay-2" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-radius: 12px; border: 1px solid rgba(245,245,245,0.16); background: rgba(255,255,255,0.03);">
              <span style="font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: #FF4D2A;">PHẠM VI NGHIÊN CỨU</span>
              <span style="font-size: 18px; font-weight: 600; color: #F5F5F5;">Vật thể vĩ mô • Vận tốc rất nhỏ so với ánh sáng (v ≪ c)</span>
            </div>

            <!-- 5 Branches of Classical Physics -->
            <div class="anim-in delay-3">
              <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.14em; color: rgba(245,245,245,0.55); margin-bottom: 12px;">
                5 TRỤ CỘT CỦA HỆ THỐNG VẬT LÍ CỔ ĐIỂN
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="glass-card" style="padding: 16px 20px; grid-column: span 2;">
                  <div style="font-size: 20px; font-weight: 800; color: #FF4D2A;">1. Cơ học</div>
                  <div style="font-size: 16px; color: rgba(245,245,245,0.78); margin-top: 4px;">
                    <strong>Động học</strong> (mô tả chuyển động) • <strong>Tĩnh học</strong> (cân bằng) • <strong>Động lực học</strong> (nguyên nhân chuyển động)
                  </div>
                </div>
                <div class="glass-card" style="padding: 15px 18px;">
                  <div style="font-size: 19px; font-weight: 800; color: #F5F5F5;">2. Âm học</div>
                  <div style="font-size: 15px; color: rgba(245,245,245,0.68); margin-top: 3px;">Dao động & sóng cơ trong môi trường đàn hồi.</div>
                </div>
                <div class="glass-card" style="padding: 15px 18px;">
                  <div style="font-size: 19px; font-weight: 800; color: #F5F5F5;">3. Quang học</div>
                  <div style="font-size: 15px; color: rgba(245,245,245,0.68); margin-top: 3px;">Tán sắc ánh sáng, lăng kính & quang hình học.</div>
                </div>
                <div class="glass-card" style="padding: 15px 18px;">
                  <div style="font-size: 19px; font-weight: 800; color: #F5F5F5;">4. Nhiệt động lực học</div>
                  <div style="font-size: 15px; color: rgba(245,245,245,0.68); margin-top: 3px;">Động cơ hơi nước James Watt (1765).</div>
                </div>
                <div class="glass-card" style="padding: 15px 18px;">
                  <div style="font-size: 19px; font-weight: 800; color: #F5F5F5;">5. Điện từ học</div>
                  <div style="font-size: 15px; color: rgba(245,245,245,0.68); margin-top: 3px;">Cảm ứng điện từ & thống nhất điện – từ.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    render(ctx, dt, t) {
      const W = 1920;
      const H = 1080;
      drawGrid(ctx, W, H, 120, 'rgba(245, 245, 245, 0.035)');

      // ---------------------------------------------------------------------
      // UPPER LEFT: Vermilion Apple Drop -> 2-Body Planetary Gravity Orbit
      // ---------------------------------------------------------------------
      const cycle = t % 6.0;
      const treeX = 195;
      const branchY = 148;

      // Tree branch
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 245, 245, 0.72)';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(70, 178);
      ctx.quadraticCurveTo(175, 132, 325, 164);
      ctx.stroke();

      // Stylized leaves
      ctx.fillStyle = 'rgba(245, 245, 245, 0.25)';
      ctx.beginPath();
      ctx.ellipse(275, 142, 24, 10, -0.4, 0, Math.PI * 2);
      ctx.ellipse(215, 130, 20, 9, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Orbit center (Earth/Star focal body)
      const orbCenterX = 520;
      const orbCenterY = 395;
      const rx = 250;
      const ry = 148;

      // Draw elliptical Keplerian orbit path
      ctx.strokeStyle = 'rgba(245, 245, 245, 0.22)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.ellipse(orbCenterX, orbCenterY, rx, ry, -0.18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Central massive planet (m1)
      const sunGrad = ctx.createRadialGradient(orbCenterX, orbCenterY, 8, orbCenterX, orbCenterY, 54);
      sunGrad.addColorStop(0, '#F5F5F5');
      sunGrad.addColorStop(0.55, '#B8C0FF');
      sunGrad.addColorStop(1, 'rgba(43, 68, 255, 0.08)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(orbCenterX, orbCenterY, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0D0D0D';
      ctx.font = '700 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('m₁', orbCenterX, orbCenterY);

      // Apple drop -> seamless morph into orbiting body (m2)
      let bodyX, bodyY, appleMorph;
      if (cycle < 1.35) {
        // Apple hangs briefly (0..0.35s) then drops & curves into orbit entry point
        const u = clamp01((cycle - 0.35) / 1.0);
        const startX = 240;
        const startY = 175;
        const entryX = orbCenterX - rx * Math.cos(-0.18);
        const entryY = orbCenterY - rx * Math.sin(-0.18);

        bodyX = lerp(startX, entryX, easeOutCubic(u));
        bodyY = lerp(startY, entryY, u * u);
        appleMorph = u;

        // Dotted drop guide
        ctx.strokeStyle = 'rgba(255, 77, 42, 0.45)';
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(bodyX, bodyY);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Orbiting along ellipse
        const orbitPhase = ((cycle - 1.35) / 4.65) * Math.PI * 2 + Math.PI;
        const cosR = Math.cos(-0.18);
        const sinR = Math.sin(-0.18);
        const lx = rx * Math.cos(orbitPhase);
        const ly = ry * Math.sin(orbitPhase);
        bodyX = orbCenterX + lx * cosR - ly * sinR;
        bodyY = orbCenterY + lx * sinR + ly * cosR;
        appleMorph = 1;
      }

      // Gravity force vector F connecting m2 -> m1
      if (appleMorph > 0.3) {
        ctx.strokeStyle = '#FF4D2A';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bodyX, bodyY);
        ctx.lineTo(orbCenterX, orbCenterY);
        ctx.stroke();

        const midX = (bodyX + orbCenterX) * 0.5;
        const midY = (bodyY + orbCenterY) * 0.5;
        ctx.fillStyle = '#FF4D2A';
        ctx.font = '700 14px "JetBrains Mono", monospace';
        ctx.fillText('F = G m₁m₂ / r²', midX, midY - 16);
      }

      // Vermilion Apple / Orbiting Satellite Body
      ctx.fillStyle = '#FF4D2A';
      ctx.beginPath();
      ctx.arc(bodyX, bodyY, lerp(18, 15, appleMorph), 0, Math.PI * 2);
      ctx.fill();

      // Apple stem fades out as it becomes orbital body
      if (appleMorph < 0.7) {
        ctx.strokeStyle = `rgba(245, 245, 245, ${1 - appleMorph / 0.7})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bodyX, bodyY - 16);
        ctx.lineTo(bodyX + 4, bodyY - 26);
        ctx.stroke();
      }
      ctx.restore();

      // ---------------------------------------------------------------------
      // LOWER LEFT: Live Animated Steam Piston (James Watt 1765)
      // ---------------------------------------------------------------------
      ctx.save();
      const cylX = 135;
      const cylY = 740;
      const cylW = 260;
      const cylH = 144;

      // Label
      ctx.fillStyle = 'rgba(245, 245, 245, 0.7)';
      ctx.font = '700 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('ĐỘNG CƠ HƠI NƯỚC • JAMES WATT (1765)', cylX, cylY - 34);

      const crankAngle = t * 3.1;
      const crankCenterX = 720;
      const crankCenterY = cylY + cylH * 0.5;
      const crankRadius = 62;

      const pinX = crankCenterX + Math.cos(crankAngle) * crankRadius;
      const pinY = crankCenterY + Math.sin(crankAngle) * crankRadius;
      const rodLen = 290;
      const dx = Math.sqrt(Math.max(1, rodLen * rodLen - (pinY - crankCenterY) * (pinY - crankCenterY)));
      const pistonX = pinX - dx;

      // Steam expansion fill inside cylinder
      const expansion = clamp01((pistonX - cylX) / 145);
      const steamGrad = ctx.createLinearGradient(cylX, cylY, pistonX, cylY);
      steamGrad.addColorStop(0, `rgba(255, 77, 42, ${0.55 - expansion * 0.25})`);
      steamGrad.addColorStop(1, 'rgba(255, 77, 42, 0.08)');
      ctx.fillStyle = steamGrad;
      ctx.fillRect(cylX + 4, cylY + 4, Math.max(10, pistonX - cylX - 18), cylH - 8);

      // Cylinder walls (cutaway)
      ctx.strokeStyle = '#F5F5F5';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cylX + cylW, cylY);
      ctx.lineTo(cylX, cylY);
      ctx.lineTo(cylX, cylY + cylH);
      ctx.lineTo(cylX + cylW, cylY + cylH);
      ctx.stroke();

      // Steam intake pipe (left)
      ctx.strokeStyle = '#FF4D2A';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cylX - 38, cylY + 34);
      ctx.lineTo(cylX, cylY + 34);
      ctx.stroke();

      // Piston Head
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(pistonX - 16, cylY + 8, 28, cylH - 16);

      // Connecting rod
      ctx.strokeStyle = '#FF4D2A';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pistonX + 12, crankCenterY);
      ctx.lineTo(pinX, pinY);
      ctx.stroke();

      // Flywheel
      ctx.strokeStyle = 'rgba(245, 245, 245, 0.8)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(crankCenterX, crankCenterY, 96, 0, Math.PI * 2);
      ctx.stroke();

      // Flywheel spokes
      ctx.strokeStyle = 'rgba(245, 245, 245, 0.35)';
      ctx.lineWidth = 3;
      for (let s = 0; s < 4; s++) {
        const sa = crankAngle + (s * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(crankCenterX, crankCenterY);
        ctx.lineTo(crankCenterX + Math.cos(sa) * 94, crankCenterY + Math.sin(sa) * 94);
        ctx.stroke();
      }

      // Crank pin
      ctx.fillStyle = '#FF4D2A';
      ctx.beginPath();
      ctx.arc(pinX, pinY, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  };
})();
