(function () {
  window.App = window.App || {};
  window.App.slides = window.App.slides || {};

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
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
  // SLIDE 4: 04 / ĐIỆN TỪ HỌC (Faraday Disk 1831 + Electric Cobalt Stage)
  // =========================================================================
  const PIONEERS = [
    {
      id: 'galvani',
      label: 'Galvani & H. Davy',
      year: 'CUỐI TK XVIII – ĐẦU XIX',
      title: 'Luigi Galvani & Sir Humphry Davy',
      detail: 'Khởi nguồn điện học thực nghiệm (điện sinh học Galvani) và điện hóa học (Sir Humphry Davy — người thầy truyền cảm hứng trực tiếp cho Faraday tại Viện Hoàng gia Anh).'
    },
    {
      id: 'volta',
      label: 'Alessandro Volta',
      year: '1800',
      title: 'Pin Volta (1800)',
      detail: 'Chế tạo nguồn dòng điện liên tục đầu tiên trong lịch sử từ các cặp bản kẽm (Zn) và đồng (Cu) xếp xen kẽ trong dung dịch acid sulfuric (H₂SO₄).'
    },
    {
      id: 'oersted',
      label: 'Ørsted & Ampère',
      year: '1820',
      title: 'Hans Christian Ørsted & André-Marie Ampère',
      detail: 'Ørsted phát hiện dòng điện làm lệch kim nam châm; Ampère xây dựng Định luật Ampère đặt nền tảng toán học cho điện động lực học.'
    },
    {
      id: 'grimaldi',
      label: 'F. M. Grimaldi',
      year: '1665',
      title: 'Francesco Maria Grimaldi (Sách 1665)',
      detail: 'Trong công trình xuất bản năm 1665, Grimaldi đặt tên và mô tả hiện tượng nhiễu xạ ánh sáng trắng qua khe hẹp như một chuyển động dạng sóng.'
    },
    {
      id: 'maxwell',
      label: 'James Clerk Maxwell',
      year: '1861 – 1873',
      title: '4 Phương trình Điện từ — Lần thống nhất thứ 2',
      detail: 'Thống nhất hoàn chỉnh Điện học, Từ học và Quang học thành Trường điện từ; chứng minh ánh sáng là sóng điện từ lan truyền với tốc độ c.'
    }
  ];

  const slide4State = {
    diskAngle: 0,
    omega: 1.8,
    electronPhase: 0,
    activePioneer: 4
  };

  window.App.slides[4] = {
    hudLabel: 'ĐIỆN TỪ HỌC',
    theme: { bg: '#2B44FF', fg: '#F5F5F5', accent: '#D9F93B' },
    transition: 'diagonal',

    init(uiLayer) {
      slide4State.omega = 1.8;
      slide4State.activePioneer = 4;

      const pillsHtml = PIONEERS.map((p, idx) => `
        <button
          class="pill-btn pioneer-pill ${idx === slide4State.activePioneer ? 'is-active' : ''}"
          data-idx="${idx}"
          type="button"
          style="font-size: 15px; padding: 10px 18px; border-color: rgba(245,245,245,0.28); ${idx === slide4State.activePioneer ? 'background:#D9F93B; color:#0D0D0D; border-color:#D9F93B;' : 'background:rgba(13,13,13,0.22); color:#F5F5F5;'}"
        >
          ${p.label}
        </button>
      `).join('');

      uiLayer.innerHTML = `
        <div class="slide-root" style="display: grid; grid-template-columns: 0.94fr 1.06fr; gap: 52px; align-items: center; padding: 88px 96px 100px;">
          <!-- Left spacer over interactive Faraday Disk & Bulb -->
          <div style="height: 100%; pointer-events: none;"></div>

          <!-- Right Editorial Content -->
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <div class="anim-in">
              <div class="eyebrow" style="color: #D9F93B; margin-bottom: 10px;">CÁCH MẠNG ĐIỆN KHÍ HÓA • THẾ KỈ XIX</div>
              <h2 class="slide-title" style="font-size: 56px; color: #F5F5F5;">ĐIỆN TỪ HỌC & FARADAY</h2>
            </div>

            <!-- Michael Faraday Feature Card -->
            <div class="glass-card anim-in delay-1" style="background: rgba(8, 14, 52, 0.56); border-color: rgba(217, 249, 59, 0.52); padding: 24px 28px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px;">
                <span style="font-size: 27px; font-weight: 800; color: #F5F5F5;">Michael Faraday (1791 – 1867)</span>
                <span class="mono-tag" style="color: #D9F93B; border-color: rgba(217,249,59,0.5); background: rgba(217,249,59,0.12);">1831 – 1832</span>
              </div>
              <p style="font-size: 18px; line-height: 1.54; color: rgba(245, 245, 245, 0.9);">
                Xuất thân từ gia đình thợ rèn nghèo khó, tự học phi thường từ hiệu sách. Ông phát minh
                <strong style="color: #D9F93B;">hiện tượng cảm ứng điện từ (1831–1832)</strong> và chế tạo
                <strong>máy phát điện đầu tiên (Đĩa Faraday)</strong>, mở đường cho kỉ nguyên điện năng.
              </p>
            </div>

            <!-- Interactive Pioneer Timeline Pills -->
            <div class="anim-in delay-2" style="display: flex; flex-direction: column; gap: 14px;">
              <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.14em; color: rgba(245,245,245,0.75);">
                CHỌN NHÀ KHOA HỌC TIÊU BIỂU ĐỂ XEM ĐÓNG GÓP
              </div>
              <div id="pioneer-pills" style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${pillsHtml}
              </div>

              <div id="pioneer-detail" class="glass-card" style="background: rgba(8, 14, 52, 0.48); border-color: rgba(245, 245, 245, 0.24); padding: 22px 26px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span id="p-title" style="font-size: 22px; font-weight: 800; color: #D9F93B;"></span>
                  <span id="p-year" style="font-family: var(--font-mono); font-size: 13px; font-weight: 700; color: rgba(245,245,245,0.75);"></span>
                </div>
                <p id="p-desc" style="font-size: 18px; line-height: 1.52; color: rgba(245,245,245,0.92);"></p>
              </div>
            </div>

            <div class="anim-in delay-3" style="font-family: var(--font-mono); font-size: 14px; color: #D9F93B;">
              ↳ TƯƠNG TÁC: RÊ CHUỘT HOẶC GIỮ CHUỘT LÊN ĐĨA ĐỒNG BÊN TRÁI ĐỂ TĂNG TỐC PHÁT ĐIỆN
            </div>
          </div>
        </div>
      `;

      const titleEl = uiLayer.querySelector('#p-title');
      const yearEl = uiLayer.querySelector('#p-year');
      const descEl = uiLayer.querySelector('#p-desc');
      const pills = Array.from(uiLayer.querySelectorAll('.pioneer-pill'));

      function renderPioneer(idx) {
        const p = PIONEERS[idx];
        titleEl.textContent = p.title;
        yearEl.textContent = p.year;
        descEl.textContent = p.detail;

        pills.forEach((btn, i) => {
          const active = i === idx;
          btn.classList.toggle('is-active', active);
          btn.style.background = active ? '#D9F93B' : 'rgba(13,13,13,0.22)';
          btn.style.color = active ? '#0D0D0D' : '#F5F5F5';
          btn.style.borderColor = active ? '#D9F93B' : 'rgba(245,245,245,0.28)';
        });
      }

      renderPioneer(slide4State.activePioneer);

      pills.forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.idx);
          slide4State.activePioneer = idx;
          renderPioneer(idx);
        });
      });
    },

    render(ctx, dt, t, mouse) {
      const W = 1920;
      const H = 1080;
      drawGrid(ctx, W, H, 120, 'rgba(245, 245, 245, 0.08)');

      const diskX = 355;
      const diskY = 530;
      const diskR = 196;

      // Mouse interaction on Faraday disk
      const distToDisk = Math.hypot(mouse.x - diskX, mouse.y - diskY);
      const isHoveringDisk = distToDisk < diskR + 70;
      const targetOmega = isHoveringDisk ? (mouse.down ? 11.5 : 6.8) : 1.9;
      slide4State.omega = lerp(slide4State.omega, targetOmega, Math.min(1, dt * 4.5));
      slide4State.diskAngle += slide4State.omega * dt;
      slide4State.electronPhase = (slide4State.electronPhase + slide4State.omega * 0.22 * dt) % 1;

      const power = clamp01((slide4State.omega - 1.0) / 9.5);

      // 1. Magnetic Field lines (B-field) behind/across lower half of copper disk
      ctx.save();
      for (let b = -2; b <= 2; b++) {
        const bx = diskX + b * 36;
        const by = diskY + 110;
        ctx.strokeStyle = 'rgba(217, 249, 59, 0.36)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(bx - 22, by - 46);
        ctx.lineTo(bx + 22, by + 46);
        ctx.stroke();

        // B-field dot/cross vector indicator
        ctx.fillStyle = '#D9F93B';
        ctx.beginPath();
        ctx.arc(bx, by, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.setLineDash([]);

      // Magnet Pole Block (N)
      ctx.fillStyle = '#0D1338';
      ctx.strokeStyle = '#F5F5F5';
      ctx.lineWidth = 3;
      ctx.fillRect(diskX - 115, diskY + 150, 230, 56);
      ctx.strokeRect(diskX - 115, diskY + 150, 230, 56);
      ctx.fillStyle = '#D9F93B';
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TỪ TRƯỜNG B (N → S)', diskX, diskY + 178);

      // 2. Rotating Copper Faraday Disk
      ctx.save();
      ctx.translate(diskX, diskY);
      ctx.rotate(slide4State.diskAngle);

      // Outer disk glow when hovering
      if (isHoveringDisk) {
        ctx.shadowColor = '#D9F93B';
        ctx.shadowBlur = 24;
      }

      const copperGrad = ctx.createRadialGradient(0, 0, 18, 0, 0, diskR);
      copperGrad.addColorStop(0, '#F6B17A');
      copperGrad.addColorStop(0.65, '#D97B48');
      copperGrad.addColorStop(1, '#A94F24');
      ctx.fillStyle = copperGrad;
      ctx.beginPath();
      ctx.arc(0, 0, diskR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = '#F5F5F5';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Radial brushed copper spokes so rotation speed is immediately legible
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
      ctx.lineWidth = 2.5;
      for (let s = 0; s < 12; s++) {
        const a = (s / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 28, Math.sin(a) * 28);
        ctx.lineTo(Math.cos(a) * (diskR - 10), Math.sin(a) * (diskR - 10));
        ctx.stroke();
      }

      // Crank handle
      ctx.fillStyle = '#F5F5F5';
      ctx.beginPath();
      ctx.arc(diskR * 0.62, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Center Axle & Rim Brush Contacts
      ctx.fillStyle = '#F5F5F5';
      ctx.beginPath();
      ctx.arc(diskX, diskY, 16, 0, Math.PI * 2);
      ctx.fill();

      // Bottom rim sliding brush
      const rimBrushX = diskX;
      const rimBrushY = diskY + diskR;
      ctx.fillStyle = '#D9F93B';
      ctx.fillRect(rimBrushX - 16, rimBrushY - 8, 32, 18);

      // 3. Circuit Wires connecting Axle & Rim Brush -> Tungsten Lightbulb
      const bulbX = 720;
      const bulbY = 390;

      const wireTop = [
        { x: diskX, y: diskY },
        { x: diskX, y: 240 },
        { x: bulbX - 18, y: 240 },
        { x: bulbX - 18, y: bulbY + 76 }
      ];

      const wireBottom = [
        { x: bulbX + 18, y: bulbY + 76 },
        { x: bulbX + 18, y: 785 },
        { x: rimBrushX, y: 785 },
        { x: rimBrushX, y: rimBrushY + 8 }
      ];

      function drawWire(pts) {
        ctx.strokeStyle = 'rgba(245, 245, 245, 0.85)';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
      }

      drawWire(wireTop);
      drawWire(wireBottom);

      // Animated glowing electrons moving along closed circuit loop
      const fullLoop = [...wireTop, ...wireBottom];
      function drawElectronsAlong(pts, count, offset) {
        let total = 0;
        const segLens = [];
        for (let i = 0; i < pts.length - 1; i++) {
          const d = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
          segLens.push(d);
          total += d;
        }
        for (let e = 0; e < count; e++) {
          const target = (((e / count) + offset) % 1) * total;
          let acc = 0;
          for (let i = 0; i < segLens.length; i++) {
            if (acc + segLens[i] >= target) {
              const u = (target - acc) / segLens[i];
              const ex = lerp(pts[i].x, pts[i + 1].x, u);
              const ey = lerp(pts[i].y, pts[i + 1].y, u);
              ctx.fillStyle = '#D9F93B';
              ctx.beginPath();
              ctx.arc(ex, ey, 5.5, 0, Math.PI * 2);
              ctx.fill();
              break;
            }
            acc += segLens[i];
          }
        }
      }
      drawElectronsAlong(wireTop, 7, slide4State.electronPhase);
      drawElectronsAlong(wireBottom, 7, slide4State.electronPhase);

      // 4. Vector Tungsten Lightbulb
      const glowRadius = 90 + power * 185;
      const glowGrad = ctx.createRadialGradient(bulbX, bulbY, 10, bulbX, bulbY, glowRadius);
      glowGrad.addColorStop(0, `rgba(217, 249, 59, ${0.42 + power * 0.55})`);
      glowGrad.addColorStop(0.45, `rgba(217, 249, 59, ${0.14 + power * 0.32})`);
      glowGrad.addColorStop(1, 'rgba(217, 249, 59, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(bulbX, bulbY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Glass bulb envelope
      ctx.fillStyle = `rgba(245, 245, 245, ${0.12 + power * 0.28})`;
      ctx.strokeStyle = '#F5F5F5';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(bulbX, bulbY - 12, 66, Math.PI * 0.72, Math.PI * 0.28, false);
      ctx.lineTo(bulbX + 28, bulbY + 52);
      ctx.lineTo(bulbX - 28, bulbY + 52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Screw base
      ctx.fillStyle = '#B8C0FF';
      ctx.fillRect(bulbX - 26, bulbY + 52, 52, 24);
      ctx.strokeRect(bulbX - 26, bulbY + 52, 52, 24);

      // Glowing tungsten filament coil
      ctx.strokeStyle = power > 0.35 ? '#FFFFFF' : '#D9F93B';
      ctx.lineWidth = 3 + power * 2.5;
      ctx.beginPath();
      ctx.moveTo(bulbX - 18, bulbY + 52);
      ctx.lineTo(bulbX - 18, bulbY - 6);
      for (let z = 0; z < 5; z++) {
        ctx.lineTo(bulbX - 14 + z * 7, bulbY - (z % 2 === 0 ? 22 : 4));
      }
      ctx.lineTo(bulbX + 18, bulbY - 6);
      ctx.lineTo(bulbX + 18, bulbY + 52);
      ctx.stroke();

      // Telemetry readout under circuit
      ctx.fillStyle = '#F5F5F5';
      ctx.font = '700 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`ĐĨA FARADAY (1831) • ω = ${slide4State.omega.toFixed(1)} rad/s • ε ≈ ${(slide4State.omega * 0.65).toFixed(1)} V`, 480, 880);
      ctx.restore();
    }
  };

  // =========================================================================
  // SLIDE 5: 05 / KHỦNG HOẢNG (Blackbody Radiation & Ultraviolet Catastrophe)
  // =========================================================================
  window.App.slides[5] = {
    hudLabel: 'KHỦNG HOẢNG',
    theme: { bg: '#09090B', fg: '#F5F5F5', accent: '#FF4D2A' },
    transition: 'aperture',

    init(uiLayer) {
      uiLayer.innerHTML = `
        <div class="slide-root" style="display: grid; grid-template-columns: 0.96fr 1.04fr; gap: 52px; align-items: center; padding: 92px 96px 104px;">
          <!-- Left spacer over Blackbody Radiation Spectrum Graph -->
          <div style="height: 100%; pointer-events: none;"></div>

          <!-- Right Editorial Content -->
          <div style="display: flex; flex-direction: column; gap: 22px;">
            <div class="anim-in">
              <div class="eyebrow" style="margin-bottom: 10px;">CUỐI THẾ KỈ XIX • RANH GIỚI TRI THỨC</div>
              <h2 class="slide-title" style="font-size: 56px;">SỰ KHỦNG HOẢNG CỦA VẬT LÍ CỔ ĐIỂN</h2>
            </div>

            <div class="glass-card anim-in delay-1" style="padding: 24px 28px;">
              <div style="font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: #FF4D2A; margin-bottom: 8px;">
                01 • BẾ TẮC Ở THẾ GIỚI VI MÔ
              </div>
              <p style="font-size: 20px; line-height: 1.52; color: rgba(245,245,245,0.88);">
                Cơ học Newton từng bị tuyệt đối hóa như chân lí duy nhất, nhưng lại hoàn toàn
                <strong style="color:#F5F5F5;">bất lực khi giải thích cấu trúc và quy luật ở cấp độ nguyên tử, phân tử</strong>.
              </p>
            </div>

            <div class="glass-card anim-in delay-2" style="padding: 24px 28px; border-color: rgba(255, 77, 42, 0.55); background: linear-gradient(135deg, rgba(255,77,42,0.12), rgba(255,255,255,0.03));">
              <div style="font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: #FF4D2A; margin-bottom: 8px;">
                02 • TAI BIẾN CỰC TÍM (ULTRAVIOLET CATASTROPHE)
              </div>
              <p style="font-size: 20px; line-height: 1.52; color: rgba(245,245,245,0.9);">
                Lí thuyết điện từ Maxwell (Rayleigh–Jeans) dự đoán cường độ bức xạ nhiệt của vật đen tuyệt đối
                <strong style="color:#FF4D2A;">tăng lên vô hạn (∞)</strong> ở tần số cao — trái ngược hoàn toàn với đường cong thực nghiệm!
              </p>
            </div>

            <div class="glass-card anim-in delay-3" style="padding: 22px 28px; border-color: rgba(0, 229, 255, 0.35);">
              <div style="font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: #00E5FF; margin-bottom: 6px;">
                03 • ĐÒI HỎI TẤT YẾU
              </div>
              <p style="font-size: 20px; line-height: 1.5; color: #F5F5F5; font-weight: 600;">
                Khoa học cấp thiết cần một hệ phương pháp và tư duy vật lí hoàn toàn mới.
              </p>
            </div>
          </div>
        </div>
      `;
    },

    render(ctx, dt, t) {
      const W = 1920;
      const H = 1080;
      drawGrid(ctx, W, H, 120, 'rgba(245, 245, 245, 0.035)');

      const originX = 140;
      const originY = 820;
      const graphW = 720;
      const graphH = 580;

      ctx.save();

      // Subtle visible spectrum band around x = 0.38..0.52 of frequency axis
      const visStart = originX + graphW * 0.34;
      const visW = graphW * 0.16;
      const specGrad = ctx.createLinearGradient(visStart, 0, visStart + visW, 0);
      specGrad.addColorStop(0, 'rgba(255, 50, 50, 0.12)');
      specGrad.addColorStop(0.35, 'rgba(255, 230, 50, 0.14)');
      specGrad.addColorStop(0.7, 'rgba(50, 220, 140, 0.14)');
      specGrad.addColorStop(1, 'rgba(130, 60, 255, 0.2)');
      ctx.fillStyle = specGrad;
      ctx.fillRect(visStart, originY - graphH, visW, graphH);

      // UV Catastrophe Danger Zone shading
      ctx.fillStyle = 'rgba(255, 77, 42, 0.07)';
      ctx.fillRect(visStart + visW, originY - graphH, originX + graphW - (visStart + visW), graphH);

      // Axes
      ctx.strokeStyle = '#F5F5F5';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(originX, originY - graphH - 20);
      ctx.lineTo(originX, originY);
      ctx.lineTo(originX + graphW + 24, originY);
      ctx.stroke();

      ctx.fillStyle = 'rgba(245, 245, 245, 0.72)';
      ctx.font = '700 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('CƯỜNG ĐỘ BỨC XẠ I(ν)', originX + 16, originY - graphH - 8);
      ctx.textAlign = 'right';
      ctx.fillText('TẦN SỐ (ν) → TỬ NGOẠI', originX + graphW + 18, originY + 34);

      ctx.fillStyle = 'rgba(245, 245, 245, 0.45)';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('HỒNG NGOẠI', originX + graphW * 0.18, originY + 34);
      ctx.fillText('KHẢ KIẾN', visStart + visW * 0.5, originY + 34);
      ctx.fillStyle = '#FF4D2A';
      ctx.fillText('VÙNG CỰC TÍM', originX + graphW * 0.76, originY + 34);

      // Animated drawing sweep across frequency
      const reveal = Math.min(1, t / 1.4);

      // 1. Experimental / Planck Curve (clean rise & exponential drop to 0)
      function planckVal(u) {
        // u in [0.01 .. 1], peak around u = 0.36
        const x = u * 8.2;
        if (x < 0.02) return 0;
        const val = (Math.pow(x, 3) / (Math.exp(x) - 1)) / 1.4214;
        return val;
      }

      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 5;
      ctx.beginPath();
      const steps = 160;
      for (let i = 0; i <= steps * reveal; i++) {
        const u = i / steps;
        const px = originX + u * graphW;
        const py = originY - planckVal(u) * (graphH * 0.62);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 2. Classical Rayleigh-Jeans Curve (matches at low frequency, shoots to ∞ into glitch spikes)
      ctx.strokeStyle = '#FF4D2A';
      ctx.lineWidth = 4.5;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      let glitchOriginX = originX + graphW * 0.54;
      let glitchOriginY = originY - graphH;

      for (let i = 0; i <= steps * reveal; i++) {
        const u = i / steps;
        const px = originX + u * graphW;
        const classicalY = 3.2 * Math.pow(u, 2.2) * (graphH * 0.62);
        const clampedY = Math.min(graphH + 24, classicalY);
        const py = originY - clampedY;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
        if (classicalY >= graphH) {
          glitchOriginX = px;
          glitchOriginY = originY - graphH;
          break;
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Red Glitch Spikes at UV divergence point
      if (reveal > 0.55) {
        const spikePulse = 0.7 + 0.3 * Math.sin(t * 24);
        ctx.strokeStyle = `rgba(255, 77, 42, ${spikePulse})`;
        ctx.lineWidth = 2.5;
        for (let g = 0; g < 9; g++) {
          const jitter = Math.sin(t * 37 + g * 11.3) * 28;
          const sx = glitchOriginX + (g - 4) * 14 + jitter * 0.3;
          const sy = glitchOriginY - 12 - Math.abs(Math.cos(t * 29 + g * 5.7)) * 75;
          ctx.beginPath();
          ctx.moveTo(sx - 12, originY - graphH + 20);
          ctx.lineTo(sx, sy);
          ctx.lineTo(sx + 16, originY - graphH + 35);
          ctx.stroke();
        }

        // Warning callout badge
        ctx.fillStyle = '#FF4D2A';
        ctx.fillRect(glitchOriginX - 130, glitchOriginY - 72, 290, 42);
        ctx.fillStyle = '#09090B';
        ctx.font = '900 19px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TAI BIẾN CỰC TÍM (∞)', glitchOriginX + 15, glitchOriginY - 51);
      }

      // Curve Labels
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#00E5FF';
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.fillText('— ĐƯỜNG CONG THỰC NGHIỆM (PLANCK)', originX + 26, originY - 410);

      ctx.fillStyle = '#FF4D2A';
      ctx.fillText('-- LÍ THUYẾT CỔ ĐIỂN (RAYLEIGH–JEANS)', originX + 26, originY - 442);

      ctx.restore();
    }
  };

  // =========================================================================
  // SLIDE 6: 06 / VẬT LÍ HIỆN ĐẠI (3D Spacetime Grid + Photons + E = mc²)
  // =========================================================================
  window.App.slides[6] = {
    hudLabel: 'VẬT LÍ HIỆN ĐẠI',
    theme: { bg: '#070B14', fg: '#F5F5F5', accent: '#00E5FF' },
    transition: 'diagonal',

    init(uiLayer) {
      uiLayer.innerHTML = `
        <div class="slide-root" style="display: grid; grid-template-columns: 0.94fr 1.06fr; gap: 52px; align-items: center; padding: 88px 96px 100px;">
          <!-- Left spacer over 3D Spacetime Gravity Well & E=mc^2 -->
          <div style="height: 100%; pointer-events: none;"></div>

          <!-- Right Editorial Content -->
          <div style="display: flex; flex-direction: column; gap: 22px;">
            <div class="anim-in">
              <div class="eyebrow" style="margin-bottom: 10px;">CUỘC CÁCH MẠNG ĐẦU THẾ KỈ XX</div>
              <h2 class="slide-title" style="font-size: 58px;">HAI TRỤ CỘT VẬT LÍ HIỆN ĐẠI</h2>
            </div>

            <!-- Max Planck Card -->
            <div class="glass-card anim-in delay-1" style="padding: 24px 28px; border-color: rgba(0, 229, 255, 0.48); background: linear-gradient(135deg, rgba(0,229,255,0.09), rgba(255,255,255,0.03));">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                <span style="font-size: 26px; font-weight: 800; color: #F5F5F5;">Max Planck (1858 – 1947)</span>
                <span class="mono-tag" style="color: #00E5FF; border-color: rgba(0,229,255,0.45);">E = h · f</span>
              </div>
              <p style="font-size: 18px; line-height: 1.54; color: rgba(245,245,245,0.88);">
                Phát minh <strong style="color:#00E5FF;">Thuyết lượng tử năng lượng (1900)</strong>: bức xạ điện từ phát ra dưới dạng các gói năng lượng gián đoạn (<em>lượng tử</em>), giải thích hoàn hảo bức xạ vật đen và khai sinh <strong>Cơ học lượng tử</strong>.
              </p>
            </div>

            <!-- Albert Einstein Card -->
            <div class="glass-card anim-in delay-2" style="padding: 24px 28px; border-color: rgba(245, 245, 245, 0.24);">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                <span style="font-size: 26px; font-weight: 800; color: #F5F5F5;">Albert Einstein (1879 – 1955)</span>
                <span class="mono-tag" style="color: #F5F5F5; border-color: rgba(245,245,245,0.35);">E = mc²</span>
              </div>
              <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 18px; line-height: 1.52; color: rgba(245,245,245,0.88);">
                <li>• <strong style="color:#00E5FF;">Thuyết tương đối hẹp (1905)</strong> & hệ thức tương đương khối lượng – năng lượng <strong>E = mc²</strong>.</li>
                <li>• <strong style="color:#00E5FF;">Thuyết tương đối rộng (1916, công bố 1919)</strong>: hấp dẫn là độ cong không-thời gian.</li>
                <li>• Kiên trì nghiên cứu bất chấp sự truy đuổi của <strong>Đảng Quốc xã Đức</strong> và kịch liệt phản đối <strong>Đế quốc Mỹ dùng bom nguyên tử</strong> cho mục đích chiến tranh.</li>
              </ul>
            </div>

            <div class="anim-in delay-3" style="font-family: var(--font-mono); font-size: 14px; color: #00E5FF;">
              ↳ RÊ CHUỘT TRÊN LƯỚI KHÔNG-THỜI GIAN ĐỂ DỊCH CHUYỂN GIẾNG HẤP DẪN
            </div>
          </div>
        </div>
      `;
    },

    render(ctx, dt, t, mouse) {
      const W = 1920;
      const H = 1080;
      drawGrid(ctx, W, H, 120, 'rgba(0, 229, 255, 0.03)');

      const cx = 465;
      const cy = 545;

      // Mouse-steered gravity well focal shift
      const steerX = clamp01(mouse.x / 960) * 2 - 1;
      const steerY = clamp01(mouse.y / 1080) * 2 - 1;
      const wellX = steerX * 95;
      const wellZ = steerY * 85;

      // 3D Isometric/Perspective Spacetime Wireframe Grid (18 x 14)
      const cols = 18;
      const rows = 14;
      const sizeX = 760;
      const sizeZ = 660;
      const fov = 980;
      const tilt = 0.56;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      function projectPoint(wx, wy, wz) {
        // Rotate around X axis by tilt
        const ry = wy * cosT - wz * sinT;
        const rz = wy * sinT + wz * cosT + 680;
        const scale = fov / (fov + rz);
        return {
          x: cx + wx * scale,
          y: cy + 50 + ry * scale,
          depth: wy
        };
      }

      const pts = [];
      for (let r = 0; r <= rows; r++) {
        const rowArr = [];
        const wz = (r / rows - 0.5) * sizeZ;
        for (let c = 0; c <= cols; c++) {
          const wx = (c / cols - 0.5) * sizeX;
          const dist = Math.hypot(wx - wellX, wz - wellZ);
          // Smooth Lorentzian gravity well warp downward (+y)
          const wellDepth = 230 / (1 + (dist * dist) / 14500);
          const ripple = Math.sin(dist * 0.032 - t * 2.6) * 6;
          rowArr.push(projectPoint(wx, wellDepth + ripple, wz));
        }
        pts.push(rowArr);
      }

      ctx.save();
      ctx.lineWidth = 1.4;
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const p = pts[r][c];
          const glow = clamp01(p.depth / 180);
          ctx.strokeStyle = `rgba(0, 229, 255, ${0.18 + glow * 0.55})`;
          if (c < cols) {
            const pR = pts[r][c + 1];
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pR.x, pR.y);
            ctx.stroke();
          }
          if (r < rows) {
            const pD = pts[r + 1][c];
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pD.x, pD.y);
            ctx.stroke();
          }
        }
      }

      // Central Glowing Star suspended above the gravity funnel
      const starProj = projectPoint(wellX, -22, wellZ);
      const starGrad = ctx.createRadialGradient(starProj.x, starProj.y, 4, starProj.x, starProj.y, 72);
      starGrad.addColorStop(0, '#FFFFFF');
      starGrad.addColorStop(0.32, '#00E5FF');
      starGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(starProj.x, starProj.y, 72, 0, Math.PI * 2);
      ctx.fill();

      // Discrete glowing photon packets (E = hf) orbiting & curving around the well
      for (let p = 0; p < 4; p++) {
        const phase = t * 1.35 + (p * Math.PI) / 2;
        const rad = 165 + (p % 2) * 58;
        const px3d = wellX + Math.cos(phase) * rad;
        const pz3d = wellZ + Math.sin(phase) * rad;
        const py3d = 120 / (1 + (rad * rad) / 14500) - 24;
        const pp = projectPoint(px3d, py3d, pz3d);

        ctx.fillStyle = '#00E5FF';
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, 7, 0, Math.PI * 2);
        ctx.fill();

        // Photon wave packet tail
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, 14 + Math.sin(t * 8 + p) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Bold E = mc² display typography at upper-left focal
      ctx.fillStyle = '#F5F5F5';
      ctx.font = '900 108px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('E = mc²', 105, 118);

      ctx.fillStyle = '#00E5FF';
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.fillText('KHÔNG-THỜI GIAN CONG & LƯỢNG TỬ ÁNH SÁNG (E = hf)', 108, 240);

      ctx.restore();
    }
  };

  // =========================================================================
  // SLIDE 7: 07 / LĨNH VỰC MỚI (Interactive 15x5 3D Perspective Grid + 3 Icons)
  // =========================================================================
  const slide7State = {
    activeDomain: -1
  };

  window.App.slides[7] = {
    hudLabel: 'LĨNH VỰC MỚI',
    theme: { bg: '#0D0D0D', fg: '#F5F5F5', accent: '#FF4D2A' },
    transition: 'tiles3d',

    init(uiLayer) {
      slide7State.activeDomain = -1;

      uiLayer.innerHTML = `
        <div class="slide-root" style="display: grid; grid-template-columns: 0.94fr 1.06fr; gap: 52px; align-items: center; padding: 88px 96px 100px;">
          <!-- Left spacer over interactive 15x5 3D Perspective Grid & 3 Geometric Icons -->
          <div style="height: 100%; pointer-events: none;"></div>

          <!-- Right Editorial Content -->
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <div class="anim-in">
              <div class="eyebrow" style="margin-bottom: 10px;">VẬT LÍ THẾ KỈ XXI</div>
              <h2 class="slide-title" style="font-size: 56px;">CÁC LĨNH VỰC NGHIÊN CỨU HIỆN ĐẠI</h2>
            </div>

            <div id="domain-cards" style="display: flex; flex-direction: column; gap: 16px;">
              <div class="glass-card domain-card anim-in delay-1" data-domain="0" style="padding: 24px 28px; cursor: pointer;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 25px; font-weight: 800; color: #F5F5F5;">1. Thế giới Vi mô</span>
                  <span class="mono-tag" style="color: #00E5FF; border-color: rgba(0,229,255,0.4);">10⁻¹⁵ m → 10⁻⁹ m</span>
                </div>
                <p style="font-size: 18px; line-height: 1.5; color: rgba(245,245,245,0.86);">
                  Nghiên cứu cấu trúc nguyên tử, hạt nhân và các hạt cơ bản:
                  <strong style="color:#00E5FF;">Vật lí hạt, vật lí năng lượng cao, vật lí nano…</strong>
                </p>
              </div>

              <div class="glass-card domain-card anim-in delay-2" data-domain="1" style="padding: 24px 28px; cursor: pointer;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 25px; font-weight: 800; color: #F5F5F5;">2. Ứng dụng Công nghệ cao</span>
                  <span class="mono-tag" style="color: #FF4D2A; border-color: rgba(255,77,42,0.45);">CÔNG NGHỆ LÕI</span>
                </div>
                <p style="font-size: 18px; line-height: 1.5; color: rgba(245,245,245,0.86);">
                  Chuyển hóa thành đột phá công nghệ:
                  <strong style="color:#FF4D2A;">Vật lí plasma, vật lí laser, vật liệu bán dẫn, quang học lượng tử.</strong>
                </p>
              </div>

              <div class="glass-card domain-card anim-in delay-3" data-domain="2" style="padding: 24px 28px; cursor: pointer;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 25px; font-weight: 800; color: #F5F5F5;">3. Thế giới Vĩ mô</span>
                  <span class="mono-tag" style="color: #B8C0FF; border-color: rgba(184,192,255,0.45);">VŨ TRỤ HỌC</span>
                </div>
                <p style="font-size: 18px; line-height: 1.5; color: rgba(245,245,245,0.86);">
                  Khám phá hành tinh, hệ Mặt Trời, thiên hà, nguồn gốc và sự hình thành vũ trụ:
                  <strong style="color:#B8C0FF;">Vật lí thiên văn.</strong>
                </p>
              </div>
            </div>

            <div class="anim-in delay-4" style="font-family: var(--font-mono); font-size: 14px; color: rgba(245,245,245,0.62);">
              ↳ DI CHUYỂN CON TRỎ QUA LƯỚI 75 KHỐI 3D ĐỂ TẠO SÓNG PHẢN XẠ ÁNH SÁNG
            </div>
          </div>
        </div>
      `;

      const cards = Array.from(uiLayer.querySelectorAll('.domain-card'));
      cards.forEach((c) => {
        c.addEventListener('mouseenter', () => {
          slide7State.activeDomain = Number(c.dataset.domain);
        });
        c.addEventListener('mouseleave', () => {
          slide7State.activeDomain = -1;
        });
      });
    },

    render(ctx, dt, t, mouse) {
      const W = 1920;
      const H = 1080;
      drawGrid(ctx, W, H, 120, 'rgba(245, 245, 245, 0.035)');

      // ---------------------------------------------------------------------
      // 1. Interactive 15 x 5 (75 tiles) 3D Perspective Grid with Cursor Ripple
      // ---------------------------------------------------------------------
      const gridLeft = 96;
      const gridTop = 270;
      const gridW = 760;
      const gridH = 380;
      const cols = 15;
      const rows = 5;
      const cellW = gridW / cols;
      const cellH = gridH / rows;
      const fov = 900;

      const palette = ['#F5F5F5', '#2B44FF', '#FF4D2A'];

      ctx.save();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = gridLeft + (c + 0.5) * cellW;
          const cy = gridTop + (r + 0.5) * cellH;

          const dist = Math.hypot(mouse.x - cx, mouse.y - cy);
          const cursorWave = Math.exp(-dist / 170);
          const ambientWave = Math.sin(c * 0.45 - t * 2.4 + r * 0.6) * 0.25;
          const angle = cursorWave * 1.15 + ambientWave;
          const lift = cursorWave * 28;

          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);
          const hw = cellW * 0.42;
          const hh = cellH * 0.42;

          // 3D rotated corners around tile center
          function proj(lx, ly) {
            const rx = lx * cosA;
            const rz = -lx * sinA - lift;
            const sc = fov / (fov + rz + 200);
            return {
              x: cx + rx * sc,
              y: cy + ly * sc
            };
          }

          const p0 = proj(-hw, -hh);
          const p1 = proj(hw, -hh);
          const p2 = proj(hw, hh);
          const p3 = proj(-hw, hh);

          // Directional lighting based on tilt angle
          const light = clamp01(0.45 + 0.55 * Math.cos(angle - 0.35));
          const baseHex = palette[(c + r * 2) % 3];

          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.closePath();

          ctx.fillStyle = baseHex;
          ctx.globalAlpha = 0.25 + light * 0.72;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      ctx.fillStyle = 'rgba(245, 245, 245, 0.58)';
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('75-TILE 3D PERSPECTIVE MATRIX • 15 × 5', gridLeft, gridTop - 22);

      // ---------------------------------------------------------------------
      // 2. Three Crisp Geometric Icons (Atom Nucleus, Laser Beam, Spiral Galaxy)
      // ---------------------------------------------------------------------
      const iconCenters = [
        { x: 220, y: 810, title: 'VI MÔ • HẠT NHÂN', accent: '#00E5FF' },
        { x: 476, y: 810, title: 'CÔNG NGHỆ • LASER', accent: '#FF4D2A' },
        { x: 732, y: 810, title: 'VĨ MÔ • THIÊN HÀ', accent: '#B8C0FF' }
      ];

      // Icon 0: Atom Nucleus
      {
        const ic = iconCenters[0];
        const active = slide7State.activeDomain === 0;
        ctx.save();
        ctx.translate(ic.x, ic.y);
        if (active) {
          ctx.strokeStyle = ic.accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 86, 0, Math.PI * 2);
          ctx.stroke();
        }
        for (let k = 0; k < 3; k++) {
          ctx.save();
          ctx.rotate((k * Math.PI) / 3 + t * 0.45);
          ctx.strokeStyle = ic.accent;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, 62, 22, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        ctx.fillStyle = '#F5F5F5';
        ctx.beginPath();
        ctx.arc(-5, -3, 7, 0, Math.PI * 2);
        ctx.arc(6, 4, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = ic.accent;
        ctx.beginPath();
        ctx.arc(4, -5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Icon 1: Coherent Laser Beam + Prism
      {
        const ic = iconCenters[1];
        const active = slide7State.activeDomain === 1;
        ctx.save();
        ctx.translate(ic.x, ic.y);
        if (active) {
          ctx.strokeStyle = ic.accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 86, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Emitter box
        ctx.strokeStyle = '#F5F5F5';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-64, -22, 40, 44);
        // Coherent beam
        const pulse = 0.75 + 0.25 * Math.sin(t * 10);
        ctx.strokeStyle = `rgba(255, 77, 42, ${pulse})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-24, 0);
        ctx.lineTo(68, 0);
        ctx.stroke();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-24, 0);
        ctx.lineTo(68, 0);
        ctx.stroke();
        // Target lens diamond
        ctx.strokeStyle = '#F5F5F5';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(22, -44);
        ctx.lineTo(38, 0);
        ctx.lineTo(22, 44);
        ctx.lineTo(6, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // Icon 2: Spiral Galaxy
      {
        const ic = iconCenters[2];
        const active = slide7State.activeDomain === 2;
        ctx.save();
        ctx.translate(ic.x, ic.y);
        if (active) {
          ctx.strokeStyle = ic.accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 86, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.rotate(t * 0.35);
        for (let arm = 0; arm < 2; arm++) {
          ctx.strokeStyle = ic.accent;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let s = 0; s <= 40; s++) {
            const theta = (s / 40) * Math.PI * 2.4 + arm * Math.PI;
            const r = 4 + (s / 40) * 62;
            const gx = Math.cos(theta) * r;
            const gy = Math.sin(theta) * r * 0.72;
            if (s === 0) ctx.moveTo(gx, gy);
            else ctx.lineTo(gx, gy);
          }
          ctx.stroke();
        }
        ctx.fillStyle = '#F5F5F5';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Icon captions
      iconCenters.forEach((ic) => {
        ctx.fillStyle = ic.accent;
        ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ic.title, ic.x, ic.y + 108);
      });

      ctx.restore();
    }
  };
})();
