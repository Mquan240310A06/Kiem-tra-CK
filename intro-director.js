/**
 * intro-director.js
 * 135.0-Second (02:15) 60 FPS Documentary Intro Director for Grade 10 Physics (Nhóm 1).
 *
 * ARCHITECTURE & ANTI-FREEZE GUARANTEES:
 * - Data-driven `SCENES` array containing all 14 scenes (0.0s -> 135.0s).
 * - Anti-black-screen safeguards: Hardcoded 1920x1080 canvas, synchronous initial
 *   `renderFrame(ctx, 0)` call on mount, and full `try/catch` isolation.
 * - Zero `while` loops; every `for` loop is strictly bounded (<= 60 iterations).
 * - Interactive `#FF4D2A` timeline scrubber bar with live `MM:SS / 02:15` readout,
 *   centered `▶ PHÁT INTRO (02:15)` button, and `Vào Slide thuyết trình →` skip button.
 */

(function () {
  'use strict';

  const W = 1920;
  const H = 1080;
  const TOTAL_DURATION = 135.0; // seconds (02:15)

  // ============================================================================
  // 1. DATA-DRIVEN 14-SCENE STORYBOARD (0.0s to 135.0s)
  // ============================================================================
  const SCENES = [
    {
      id: 1,
      start: 0.0,
      end: 9.0,
      shot: 'rooftop',
      clipId: 1,
      role: 'narrator',
      sfx: 'whoosh',
      hologram: 'moon_apple',
      eraTag: 'KHỞI NGUỒN CỦA SỰ TÒ MÒ • BẦU TRỜI ĐÊM',
      subtitle:
        'Hãy nhìn lên bầu trời đêm nay và tự hỏi một câu tưởng chừng ngớ ngẩn: Tại sao Mặt Trăng khổng lồ kia không rơi xuống đầu chúng ta... trong khi quả táo trên tay lại rơi?'
    },
    {
      id: 2,
      start: 9.0,
      end: 18.5,
      shot: 'cafe',
      clipId: 2,
      role: 'quan',
      sfx: 'tick',
      hologram: 'ancient_philosophy',
      eraTag: 'THỜI KÌ TIỀN VẬT LÍ • PYTHAGORAS & ARISTOTLE (350 TCN)',
      subtitle:
        'Minh Quân: Suốt hơn hai nghìn năm, từ thời Pythagoras đến Aristotle, con người tin rằng vật nặng luôn rơi nhanh hơn vật nhẹ — chỉ bằng suy luận mà chẳng ai buồn kiểm chứng!'
    },
    {
      id: 3,
      start: 18.5,
      end: 28.5,
      shot: 'macro',
      clipId: 3,
      role: 'minh',
      sfx: 'zeroG',
      hologram: 'galileo_vacuum',
      eraTag: 'PHƯƠNG PHÁP THỰC NGHIỆM • GALILEO GALILEI (1600)',
      subtitle:
        'Tuấn Minh: Khoan đã! Nếu hút sạch không khí ra khỏi ống thủy tinh này, liệu một chiếc lông vũ mong manh có rơi nhanh ngang ngửa một quả cầu sắt nặng trịch không?'
    },
    {
      id: 4,
      start: 28.5,
      end: 38.5,
      shot: 'cafe',
      clipId: 4,
      role: 'quan',
      sfx: 'whoosh',
      hologram: 'newton_orbit',
      eraTag: 'CƠ HỌC CỔ ĐIỂN • ISAAC NEWTON (1687)',
      subtitle:
        'Minh Quân: Galileo đã chứng minh điều đó! Và hơn 300 năm trước, Newton nhận ra lực kéo quả táo rơi cũng chính là sợi dây vô hình giữ cả Hệ Mặt Trời không văng vào vũ trụ.'
    },
    {
      id: 5,
      start: 38.5,
      end: 48.0,
      shot: 'macro',
      clipId: 5,
      role: 'minh',
      sfx: 'thud',
      hologram: 'steam_engine',
      eraTag: 'NHIỆT ĐỘNG LỰC HỌC & CÁCH MẠNG CÔNG NGHIỆP • JAMES WATT (1765)',
      subtitle:
        'Tuấn Minh: Từ cơ học Newton đến máy hơi nước của James Watt năm 1765, nhân loại bỗng nhiên biến được hơi nóng vô hình thành sức mạnh dời non lấp biển!'
    },
    {
      id: 6,
      start: 48.0,
      end: 58.0,
      shot: 'cafe',
      clipId: 6,
      role: 'narrator',
      sfx: 'spark',
      hologram: 'volta_orsted',
      eraTag: 'ĐIỆN HỌC & TỪ HỌC • VOLTA (1800) & ØRSTED (1820)',
      subtitle:
        'Nhưng Vật lí chưa dừng lại ở đó. Điều gì xảy ra khi Volta nhúng kẽm và đồng vào axit tạo ra dòng điện đầu tiên, và Ørsted phát hiện dòng điện làm lệch kim nam châm?'
    },
    {
      id: 7,
      start: 58.0,
      end: 68.5,
      shot: 'closeup_minh_to_macro',
      clipId: 7,
      role: 'quan',
      sfx: 'spark',
      hologram: 'faraday_maxwell',
      eraTag: 'TRƯỜNG ĐIỆN TỪ & QUANG HỌC • FARADAY (1831) & MAXWELL (1865)',
      subtitle:
        'Minh Quân: Từ đĩa đồng quay trong từ trường của chàng thợ đóng sách nghèo Faraday, cùng 4 phương trình Maxwell... con người nhận ra ánh sáng chính là sóng điện từ!'
    },
    {
      id: 8,
      start: 68.5,
      end: 78.5,
      shot: 'cafe_dark',
      clipId: 8,
      role: 'minh',
      sfx: 'thud',
      hologram: 'uv_catastrophe',
      eraTag: 'KHỦNG HOẢNG CUỐI THẾ KỈ 19 • TAI BIẾN CỰC TÍM',
      subtitle:
        'Tuấn Minh: Cuối thế kỉ 19, các nhà vật lí tưởng rằng mình đã hiểu hết vũ trụ... cho đến khi vật lí cổ điển hoàn toàn sụp đổ trước bức xạ của một vật đen ở cấp độ nguyên tử!'
    },
    {
      id: 9,
      start: 78.5,
      end: 89.0,
      shot: 'macro',
      clipId: 9,
      role: 'quan',
      sfx: 'quantum',
      hologram: 'planck_quanta',
      eraTag: 'KHAI SINH CƠ HỌC LƯỢNG TỬ • MAX PLANCK (1900)',
      subtitle:
        'Minh Quân: Năm 1900, Max Planck đưa ra giả thuyết táo bạo: Năng lượng không chảy liên tục, mà chia thành từng gói nhỏ gọi là lượng tử — khai sinh cơ học lượng tử đầy bí ẩn!'
    },
    {
      id: 10,
      start: 89.0,
      end: 100.5,
      shot: 'cafe',
      clipId: 10,
      role: 'minh',
      sfx: 'tick',
      hologram: 'einstein_spacetime',
      eraTag: 'THUYẾT TƯƠNG ĐỐI • ALBERT EINSTEIN (1905 & 1916)',
      subtitle:
        'Tuấn Minh: Và rồi Albert Einstein xuất hiện với công thức E = mc²! Bạn có tin được không: nếu bay gần tốc độ ánh sáng, đồng hồ của bạn sẽ chạy chậm hơn người ở Trái Đất?'
    },
    {
      id: 11,
      start: 100.5,
      end: 110.5,
      shot: 'closeup_quan',
      clipId: 11,
      role: 'quan',
      sfx: 'zeroG',
      hologram: 'nuclear_peace',
      eraTag: 'TRÁCH NHIỆM CỦA KHOA HỌC • NĂNG LƯỢNG HẠT NHÂN VÌ HÒA BÌNH',
      subtitle:
        'Minh Quân: Chính Einstein cũng từng day dứt khi công thức của mình mở đường cho năng lượng hạt nhân, và ông đã kiên quyết phản đối việc dùng bom nguyên tử trong chiến tranh.'
    },
    {
      id: 12,
      start: 110.5,
      end: 121.0,
      shot: 'cafe_fourth_wall',
      clipId: 12,
      role: 'narrator',
      sfx: 'quantum',
      hologram: 'modern_pillars',
      eraTag: 'VẬT LÍ HIỆN ĐẠI • HẠT CƠ BẢN, LASER & VŨ TRỤ HỌC',
      subtitle:
        'Ngày nay, Vật lí vừa lặn sâu vào thế giới hạt nano, tạo ra laser và bán dẫn, vừa vươn tầm mắt giải mã nguồn gốc của hàng tỉ thiên hà!'
    },
    {
      id: 13,
      start: 121.0,
      end: 129.5,
      shot: 'galaxy_zoom',
      clipId: 13,
      role: 'quan',
      sfx: 'whoosh',
      hologram: 'galaxy_snap',
      eraTag: 'SẴN SÀNG KHÁM PHÁ • NHÓM 1 — VẬT LÍ 10',
      subtitle:
        'Minh Quân: Vậy hành trình đi từ tư duy triết học đến khám phá vũ trụ này đã diễn ra như thế nào? Hãy cùng Nhóm 1 lật mở từng trang lịch sử ngay bây giờ!'
    },
    {
      id: 14,
      start: 129.5,
      end: 135.0,
      shot: 'title_card',
      clipId: null,
      role: null,
      sfx: 'quantum',
      hologram: null,
      eraTag: 'BÀI MỞ ĐẦU • VẬT LÍ 10',
      subtitle: ''
    }
  ];

  // ============================================================================
  // 2. HELPER UTILITIES (Bounded, Zero-Freeze)
  // ============================================================================
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function formatMMSS(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return (m < 10 ? '0' + m : '' + m) + ':' + (r < 10 ? '0' + r : '' + r);
  }

  function getSceneAt(tSec) {
    const clamped = clamp(tSec, 0, TOTAL_DURATION - 0.001);
    for (let i = 0; i < SCENES.length; i++) {
      if (clamped >= SCENES[i].start && clamped < SCENES[i].end) {
        return SCENES[i];
      }
    }
    return SCENES[SCENES.length - 1];
  }

  // Fallback character silhouette renderer if `window.IntroRig` is missing or partial
  function drawCharacterSafe(ctx, charType, x, y, scale, pose) {
    if (window.IntroRig && typeof window.IntroRig.drawCharacter === 'function') {
      window.IntroRig.drawCharacter(ctx, charType, x, y, scale, pose);
      return;
    }
    // Lightweight vector fallback character
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Torso
    ctx.fillStyle = charType === 'quan' ? '#24344d' : '#5e3423';
    ctx.beginPath();
    ctx.roundRect(-55, -135, 110, 145, 24);
    ctx.fill();

    // Head
    ctx.fillStyle = '#f2c7a5';
    ctx.beginPath();
    ctx.arc(0, -185, 42, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#1b1412';
    ctx.beginPath();
    ctx.arc(0, -198, 43, Math.PI, Math.PI * 2);
    ctx.fill();

    // Eyes
    const lx = (pose && pose.eyeLookX) || 0;
    const ly = (pose && pose.eyeLookY) || 0;
    ctx.fillStyle = '#181412';
    ctx.beginPath();
    ctx.arc(-14 + lx * 5, -188 + ly * 3, 4.5, 0, Math.PI * 2);
    ctx.arc(14 + lx * 5, -188 + ly * 3, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Lip-sync mouth
    const mo = clamp((pose && pose.mouthOpen) || 0, 0, 1);
    ctx.fillStyle = '#7a2824';
    ctx.beginPath();
    ctx.ellipse(0, -166, 8 + mo * 5, 2 + mo * 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ============================================================================
  // 3. MODULAR SCIENCE HOLOGRAM RENDERER (All 13 Visual Holograms)
  // ============================================================================
  function drawScienceHologram(ctx, type, lt, t) {
    if (!type) return;
    ctx.save();

    // Smooth hologram fade-in
    const fadeIn = clamp(lt * 1.8, 0, 1);
    ctx.globalAlpha = fadeIn;

    switch (type) {
      // ------------------------------------------------------------------------
      // SCENE 1: Crescent Moon vs. Glowing Red Apple
      // ------------------------------------------------------------------------
      case 'moon_apple': {
        // Crescent Moon in top-right dusk sky
        const moonX = 1420;
        const moonY = 230;
        const halo = ctx.createRadialGradient(moonX, moonY, 20, moonX, moonY, 170);
        halo.addColorStop(0, 'rgba(255, 248, 210, 0.85)');
        halo.addColorStop(0.45, 'rgba(130, 210, 255, 0.25)');
        halo.addColorStop(1, 'rgba(130, 210, 255, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 170, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff9e6';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 54, 0, Math.PI * 2);
        ctx.fill();

        // Dotted gravity question vector connecting Moon & Apple
        const appleX = 760;
        const appleY = 530 - Math.sin(t * 2.4) * 10;
        ctx.strokeStyle = 'rgba(255, 215, 130, 0.55)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(appleX, appleY);
        ctx.lineTo(moonX - 50, moonY + 40);
        ctx.stroke();
        ctx.setLineDash([]);

        // Glowing Red Apple held up by Minh Quân
        const appleGlow = ctx.createRadialGradient(appleX, appleY, 4, appleX, appleY, 58);
        appleGlow.addColorStop(0, 'rgba(255, 90, 70, 0.95)');
        appleGlow.addColorStop(0.5, 'rgba(255, 70, 40, 0.35)');
        appleGlow.addColorStop(1, 'rgba(255, 70, 40, 0)');
        ctx.fillStyle = appleGlow;
        ctx.beginPath();
        ctx.arc(appleX, appleY, 58, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff3b2f';
        ctx.beginPath();
        ctx.arc(appleX, appleY, 22, 0, Math.PI * 2);
        ctx.fill();

        // Floating question callout
        ctx.fillStyle = '#fff5d6';
        ctx.font = '600 24px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Tại sao Táo rơi nhưng Mặt Trăng không rơi?', (appleX + moonX) * 0.5, 340);
        break;
      }

      // ------------------------------------------------------------------------
      // SCENE 2: Ancient Natural Philosophy (Pythagoras Triangle & Scroll)
      // ------------------------------------------------------------------------
      case 'ancient_philosophy': {
        const cx = W * 0.5;
        const cy = 410 + Math.sin(t * 2) * 8;

        // Ambient golden hologram aura
        const aura = ctx.createRadialGradient(cx, cy, 15, cx, cy, 240);
        aura.addColorStop(0, 'rgba(255, 200, 95, 0.38)');
        aura.addColorStop(1, 'rgba(255, 170, 60, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(cx, cy, 240, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Pythagorean Right Triangle
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 130, cy + 70);
        ctx.lineTo(cx + 30, cy + 70);
        ctx.lineTo(cx - 130, cy - 70);
        ctx.closePath();
        ctx.stroke();

        // Right-angle marker
        ctx.strokeRect(cx - 130, cy + 48, 22, 22);

        // Aristotle deductive balance scale (heavier vs lighter myth)
        ctx.strokeStyle = 'rgba(255, 225, 150, 0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + 75, cy - 30);
        ctx.lineTo(cx + 215, cy + 25);
        ctx.stroke();

        ctx.fillStyle = '#ff9f43';
        ctx.beginPath();
        ctx.arc(cx + 215, cy + 48, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffeaa7';
        ctx.beginPath();
        ctx.arc(cx + 75, cy - 12, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffd166';
        ctx.font = '700 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('a² + b² = c²  •  TRIẾT HỌC TỰ NHIÊN CỔ ĐẠI (Chưa có thực nghiệm)', cx, cy + 135);
        break;
      }

      // ------------------------------------------------------------------------
      // SCENE 3: Galileo Vacuum Drop (Iron Sphere & Feather in Exact Sync)
      // ------------------------------------------------------------------------
      case 'galileo_vacuum': {
        const tubeX = W * 0.5 - 120;
        const tubeY = 170;
        const tubeW = 240;
        const tubeH = 470;

        // Glass Vacuum Cylinder
        ctx.fillStyle = 'rgba(130, 220, 255, 0.10)';
        ctx.strokeStyle = 'rgba(150, 235, 255, 0.75)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(tubeX, tubeY, tubeW, tubeH, 24);
        ctx.fill();
        ctx.stroke();

        // Synchronized Free-Fall Kinematics (g = 9.80 m/s²)
        const cycle = (lt % 3.2) / 3.2;
        const dropProgress = clamp(cycle * cycle * 1.35, 0, 1);
        const objY = tubeY + 65 + dropProgress * (tubeH - 125);

        // Horizontal laser sync line proving identical acceleration
        ctx.strokeStyle = 'rgba(50, 255, 180, 0.75)';
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(tubeX + 20, objY);
        ctx.lineTo(tubeX + tubeW - 20, objY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Heavy Iron Sphere (Left)
        ctx.fillStyle = '#8c9ba5';
        ctx.beginPath();
        ctx.arc(tubeX + 75, objY, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 14px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Fe 5kg', tubeX + 75, objY + 5);

        // Delicate White Feather (Right - falling at exact same Y!)
        ctx.save();
        ctx.translate(tubeX + 168, objY);
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 7, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Telemetry Gauge (using IntroRig if available, plus crisp HUD readout)
        if (window.IntroRig && typeof window.IntroRig.drawTelemetryGauge === 'function') {
          window.IntroRig.drawTelemetryGauge(ctx, tubeX + tubeW + 130, tubeY + 140, 9.8, 'g = 9.80 m/s²');
        }
        ctx.fillStyle = '#64ffda';
        ctx.font = '700 22px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('CHÂN KHÔNG: 0.00 ATM', tubeX + tubeW + 40, tubeY + 260);
        ctx.fillText('g = 9.80 m/s² (ĐỒNG BỘ 100%)', tubeX + tubeW + 40, tubeY + 298);
        break;
      }

      // ------------------------------------------------------------------------
      // SCENE 4: Newton Universal Gravitation Orbit (F = G*m1*m2/r²)
      // ------------------------------------------------------------------------
      case 'newton_orbit': {
        const cx = W * 0.5;
        const cy = 400;

        // Sun core
        const sunG = ctx.createRadialGradient(cx, cy, 6, cx, cy, 110);
        sunG.addColorStop(0, '#fff7c2');
        sunG.addColorStop(0.35, '#ffae34');
        sunG.addColorStop(1, 'rgba(255, 140, 30, 0)');
        ctx.fillStyle = sunG;
        ctx.beginPath();
        ctx.arc(cx, cy, 110, 0, Math.PI * 2);
        ctx.fill();

        // Elliptical planetary orbits (3 rings)
        for (let i = 1; i <= 3; i++) {
          const rx = i * 95;
          const ry = i * 42;
          ctx.strokeStyle = 'rgba(255, 215, 120, 0.42)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, -0.12, 0, Math.PI * 2);
          ctx.stroke();

          // Orbiting planet
          const angle = t * (1.8 / i) + i * 2.1;
          const px = cx + Math.cos(angle) * rx;
          const py = cy + Math.sin(angle) * ry;
          ctx.fillStyle = i === 2 ? '#4ea8de' : '#ffd166';
          ctx.beginPath();
          ctx.arc(px, py, 7 + i * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#ffe6a7';
        ctx.font = '700 26px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ĐỊNH LUẬT VẠN VẬT HẤP DẪN:  F = G · (m₁ · m₂) / r²', cx, cy + 185);
        break;
      }

      // ------------------------------------------------------------------------
      // SCENE 5: James Watt Steam Engine Piston & Flywheel (1765)
      // ------------------------------------------------------------------------
      case 'steam_engine': {
        const cx = W * 0.5;
        const cy = 360;
        const theta = t * 5.2;

        // Glowing technical blueprint frame
        ctx.fillStyle = 'rgba(255, 165, 75, 0.12)';
        ctx.strokeStyle = '#ff9f43';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(cx - 290, cy - 130, 580, 260, 18);
        ctx.fill();
        ctx.stroke();

        // Steam cylinder on left
        const cylX = cx - 230;
        const cylY = cy - 45;
        ctx.strokeRect(cylX, cylY, 160, 90);

        // Moving piston head
        const pistonX = cylX + 55 + Math.cos(theta) * 42;
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(pistonX, cylY + 6, 22, 78);

        // Flywheel on right
        const wheelX = cx + 145;
        const wheelY = cy;
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(wheelX, wheelY, 76, 0, Math.PI * 2);
        ctx.stroke();

        // Crank pin & connecting rod
        const crankX = wheelX + Math.cos(theta) * 52;
        const crankY = wheelY + Math.sin(theta) * 52;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(pistonX + 22, cy);
        ctx.lineTo(crankX, crankY);
        ctx.lineTo(wheelX, wheelY);
        ctx.stroke();

        ctx.fillStyle = '#ffd166';
        ctx.font = '700 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MÁY HƠI NƯỚC JAMES WATT (1765) • Q = ΔU + A', cx, cy + 105);
        break;
      }

      // ------------------------------------------------------------------------
      // SCENE 6: Voltaic Pile (1800) & Ørsted Magnetic Compass Deflection
      // ------------------------------------------------------------------------
      case 'volta_orsted': {
        const cx = W * 0.5;
        const cy = 395;

        // Voltaic Pile (Cu / Zn stacked discs on left)
        const pileX = cx - 180;
        for (let i = 0; i < 6; i++) {
          const dy = cy + 60 - i * 22;
          ctx.fillStyle = i % 2 === 0 ? '#e07a5f' : '#8ecae6';
          ctx.fillRect(pileX - 45, dy, 90, 16);
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PIN VOLTA (Cu-Zn)', pileX, cy + 105);

        // Electric current wire with animated blue sparks
        ctx.strokeStyle = '#00f5d4';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(pileX, cy - 70);
        ctx.lineTo(cx + 160, cy - 70);
        ctx.lineTo(cx + 160, cy + 60);
        ctx.lineTo(pileX, cy + 60);
        ctx.stroke();

        // Animated electron pulse along top wire
        const pulseX = pileX + ((t * 240) % 340);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pulseX, cy - 70, 7, 0, Math.PI * 2);
        ctx.fill();

        // Ørsted Compass on right with deflecting needle
        const compX = cx + 160;
        const compY = cy - 5;
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(compX, compY, 56, 0, Math.PI * 2);
        ctx.stroke();

        const deflectAngle = 0.65 * Math.sin(t * 3.5);
        ctx.save();
        ctx.translate(compX, compY);
        ctx.rotate(deflectAngle);
        ctx.fillStyle = '#ff4d4d';
        ctx.beginPath();
        ctx.moveTo(0, -44);
        ctx.lineTo(9, 0);
        ctx.lineTo(-9, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#e0fbfc';
        ctx.beginPath();
        ctx.moveTo(0, 44);
        ctx.lineTo(9, 0);
        ctx.lineTo(-9, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#00f5d4';
        ctx.fillText('THÍ NGHIỆM ØRSTED (1820)', compX, cy + 105);
        break;
      }

      // ------------------------------------------------------------------------
      // SCENE 7: Faraday Copper Disk Dynamo (1831) & Maxwell Rainbow EM Wave
      // ------------------------------------------------------------------------
      case 'faraday_maxwell': {
        const cx = W * 0.5;
        const cy = 370;

        // Spinning Copper Faraday Disk on Left
        const diskX = cx - 220;
        ctx.save();
        ctx.translate(diskX, cy);
        ctx.rotate(t * 4.5);
        const copperG = ctx.createRadialGradient(0, 0, 10, 0, 0, 82);
        copperG.addColorStop(0, '#ffd166');
        copperG.addColorStop(0.7, '#d97736');
        copperG.addColorStop(1, '#7c3f18');
        ctx.fillStyle = copperG;
        ctx.beginPath();
        ctx.arc(0, 0, 82, 0, Math.PI * 2);
        ctx.fill();

        // Radial spokes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * 80, Math.sin(a) * 80);
          ctx.stroke();
        }
        ctx.restore();

        // Horseshoe magnet poles around disk
        ctx.strokeStyle = '#ff4d4d';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(diskX, cy - 10, 96, -0.8, 0.8);
        ctx.stroke();

        // Maxwell Electromagnetic Wave (Rainbow Sine Wave, bounded 45 segments)
        const waveStartX = cx - 80;
        for (let i = 0; i < 45; i++) {
          const wx1 = waveStartX + i * 8.5;
          const wx2 = wx1 + 8.5;
          const wy1 = cy + Math.sin(i * 0.32 - t * 8) * 58;
          const wy2 = cy + Math.sin((i + 1) * 0.32 - t * 8) * 58;
          const hue = (i * 8 + t * 120) % 360;
          ctx.strokeStyle = `hsl(${hue}, 92%, 62%)`;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(wx1, wy1);
          ctx.lineTo(wx2, wy2);
          ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FARADAY (1831) & SÓNG ĐIỆN TỪ MAXWELL  •  c = 3×10⁸ m/s', cx, cy + 135);
        break;
      }

      // ------------------------------------------------------------------------
      // SCENE 8: Ultraviolet Catastrophe (Classical Curve Shooting to Infinity)
      // ------------------------------------------------------------------------
      case 'uv_catastrophe': {
        const gx = W * 0.5 - 260;
        const gy = 485;
        const gw = 520;
        const gh = 260;

        // Axes
        ctx.strokeStyle = '#a0b4d6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(gx, gy - gh);
        ctx.lineTo(gx, gy);
        ctx.lineTo(gx + gw, gy);
        ctx.stroke();

        // Experimental Planck Blackbody Curve (Safe Emerald Curve)
        ctx.strokeStyle = '#00f5d4';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const u = i / 40;
          const px = gx + u * gw;
          const py = gy - Math.sin(u * Math.PI) * Math.pow(1 - u * 0.5, 1.5) * 195;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Classical Rayleigh-Jeans Curve shooting infinitely upward into Crimson Alert
        ctx.strokeStyle = '#ff2a55';
        ctx.lineWidth = 5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        for (let i = 0; i <= 30; i++) {
          const u = i / 30;
          const px = gx + gw * (0.28 + u * 0.55);
          const py = gy - Math.pow(u, 2.3) * 320;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Warning badge
        ctx.fillStyle = '#ff2a55';
        ctx.font = '800 26px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ TAI BIẾN CỰC TÍM (VẬT LÍ CỔ ĐIỂN → ∞)', W * 0.5, gy - gh - 25);
        break;
      }

      // ------------------------------------------------------------------------
      // SCENE 9: Max Planck Quantum Packets (E = h*f, 1900)
      // ------------------------------------------------------------------------
      case 'planck_quanta': {
        const cx = W * 0.5;
        const cy = 370;

        // 16 Discrete glowing emerald quantum energy packets (photons)
        for (let i = 0; i < 16; i++) {
          const offset = (i * 42 + t * 130) % 640;
          const px = cx - 320 + offset;
          const py = cy + Math.sin(offset * 0.025 - t * 4) * 48;

          const qGlow = ctx.createRadialGradient(px, py, 2, px, py, 28);
          qGlow.addColorStop(0, '#ffffff');
          qGlow.addColorStop(0.4, '#00f5d4');
          qGlow.addColorStop(1, 'rgba(0, 245, 212, 0)');
          ctx.fillStyle = qGlow;
          ctx.beginPath();
          ctx.arc(px, py, 28, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#00f5d4';
        ctx.font = '800 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('THUYẾT LƯỢNG TỬ MAX PLANCK (1900)  •  E = h · f', cx, cy + 135);
        break;
      }

      // ------------------------------------------------------------------------
      // SCENE 10: Albert Einstein Spacetime Curvature & Time Dilation (E = mc²)
      // ------------------------------------------------------------------------
      case 'einstein_spacetime': {
        const cx = W * 0.5;
        const cy = 415;

        // Warped 3D Spacetime Grid (bounded 11 lines)
        ctx.strokeStyle = 'rgba(100, 220, 255, 0.55)';
        ctx.lineWidth = 2;
        for (let i = -5; i <= 5; i++) {
          const yBase = cy + i * 24;
          const wellDepth = Math.exp(-(i * i) * 0.18) * 65;
          ctx.beginPath();
          ctx.moveTo(cx - 280, yBase);
          ctx.quadraticCurveTo(cx, yBase + wellDepth, cx + 280, yBase);
          ctx.stroke();
        }

        // Massive glowing star bending spacetime
        const massG = ctx.createRadialGradient(cx, cy - 10, 5, cx, cy - 10, 62);
        massG.addColorStop(0, '#ffffff');
        massG.addColorStop(0.45, '#ffd166');
        massG.addColorStop(1, 'rgba(255, 160, 0, 0)');
        ctx.fillStyle = massG;
        ctx.beginPath();
        ctx.arc(cx, cy - 10, 62, 0, Math.PI * 2);
        ctx.fill();

        // Relativistic Time-Dilation Clock on Right
        const clkX = cx + 250;
        const clkY = cy - 75;
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(clkX, clkY, 44, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(clkX, clkY);
        ctx.lineTo(clkX + Math.cos(t * 0.9) * 32, clkY + Math.sin(t * 0.9) * 32);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 34px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ALBERT EINSTEIN  •  E = mc²', cx, cy - 125);
        break;
      }

      // ------------------------------------------------------------------------
      // SCENE 11: Peaceful Atomic Nucleus & Humanitarian Responsibility
      // ------------------------------------------------------------------------
      case 'nuclear_peace': {
        const cx = W * 0.68;
        const cy = 410;

        // 3 Electron Orbitals rotating smoothly into golden peace rays
        for (let i = 0; i < 3; i++) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((i * Math.PI) / 3 + t * 0.6);
          ctx.strokeStyle = 'rgba(255, 220, 130, 0.75)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(0, 0, 125, 42, 0, 0, Math.PI * 2);
          ctx.stroke();

          const eAngle = t * 3.2 + i * 2;
          const ex = Math.cos(eAngle) * 125;
          const ey = Math.sin(eAngle) * 42;
          ctx.fillStyle = '#64ffda';
          ctx.beginPath();
          ctx.arc(ex, ey, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Glowing Golden Nucleus Core
        const coreG = ctx.createRadialGradient(cx, cy, 4, cx, cy, 48);
        coreG.addColorStop(0, '#ffffff');
        coreG.addColorStop(0.5, '#ffd166');
        coreG.addColorStop(1, 'rgba(255, 209, 102, 0)');
        ctx.fillStyle = coreG;
        ctx.beginPath();
        ctx.arc(cx, cy, 48, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      // ------------------------------------------------------------------------
      // SCENE 12: Three Pillars of Modern Physics (Nano/Quark, Laser, Galaxy)
      // ------------------------------------------------------------------------
      case 'modern_pillars': {
        const cy = 370;

        // 1. Left Pillar: Quark / Nano Lattice
        const p1X = W * 0.5 - 270;
        ctx.strokeStyle = '#00f5d4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p1X, cy, 56, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 3; i++) {
          const a = t * 3 + (i * Math.PI * 2) / 3;
          ctx.fillStyle = '#00f5d4';
          ctx.beginPath();
          ctx.arc(p1X + Math.cos(a) * 26, cy + Math.sin(a) * 26, 9, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 18px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('HẠT CƠ BẢN & NANO', p1X, cy + 92);

        // 2. Center Pillar: Coherent Laser & Semiconductor
        const p2X = W * 0.5;
        ctx.strokeStyle = '#ff2a55';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(p2X - 65, cy);
        ctx.lineTo(p2X + 65, cy);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 42, 85, 0.45)';
        ctx.lineWidth = 14;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('LASER & BÁN DẪN', p2X, cy + 92);

        // 3. Right Pillar: Spiral Galaxy Cosmology
        const p3X = W * 0.5 + 270;
        for (let i = 0; i < 24; i++) {
          const r = i * 2.4;
          const a = i * 0.45 - t * 2.5;
          ctx.fillStyle = i % 2 === 0 ? '#ffd166' : '#a9def9';
          ctx.beginPath();
          ctx.arc(p3X + Math.cos(a) * r, cy + Math.sin(a) * r * 0.65, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillText('VŨ TRỤ HỌC', p3X, cy + 92);
        break;
      }

      // ------------------------------------------------------------------------
      // SCENE 13: Spiral Galaxy Zoom & Finger Snap Shockwave at lt = 5.5s
      // ------------------------------------------------------------------------
      case 'galaxy_snap': {
        const cx = W * 0.5;
        const cy = H * 0.44;
        const zoom = 1 + clamp(lt / 8.5, 0, 1) * 1.65;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(zoom, zoom);

        // Spiral Galaxy Stars (bounded 55 stars)
        for (let i = 0; i < 55; i++) {
          const arm = i % 2;
          const dist = 12 + i * 4.5;
          const angle = i * 0.28 - t * 1.8 + arm * Math.PI;
          const sx = Math.cos(angle) * dist;
          const sy = Math.sin(angle) * dist * 0.58;
          ctx.fillStyle = i % 3 === 0 ? '#ffd166' : '#90e0ef';
          ctx.beginPath();
          ctx.arc(sx, sy, 2.2 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Crisp Shockwave Ring at lt >= 5.5s (Minh Quân finger snap)
        if (lt >= 5.5) {
          const snapElapsed = lt - 5.5;
          const ringR = snapElapsed * 950;
          const ringAlpha = clamp(1 - snapElapsed * 0.85, 0, 1);
          if (ringAlpha > 0.01) {
            ctx.strokeStyle = `rgba(255, 220, 150, ${ringAlpha.toFixed(3)})`;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        break;
      }
    }

    ctx.restore();
  }

  // ============================================================================
  // 4. EDITORIAL HUD: ERA PILL, SUBTITLE BOX, AND SCENE 14 TITLE CARD
  // ============================================================================
  function drawSubtitleAndEraHUD(ctx, scene, lt) {
    if (!scene) return;
    ctx.save();

    // Top-left Documentary Era Badge
    if (scene.eraTag) {
      ctx.fillStyle = 'rgba(12, 16, 28, 0.78)';
      ctx.strokeStyle = 'rgba(255, 77, 42, 0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(64, 46, 680, 46, 23);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FF4D2A';
      ctx.beginPath();
      ctx.arc(92, 69, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8f9fa';
      ctx.font = '700 18px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(scene.eraTag, 112, 75);
    }

    // Bottom Documentary Subtitle Bar
    if (scene.subtitle) {
      const boxW = 1440;
      const boxH = 118;
      const boxX = (W - boxW) * 0.5;
      const boxY = H - 195;

      ctx.fillStyle = 'rgba(10, 12, 20, 0.84)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 18);
      ctx.fill();
      ctx.stroke();

      // Speaker color accent bar on left edge
      const accentColor =
        scene.role === 'quan'
          ? '#4ea8de'
          : scene.role === 'minh'
          ? '#ff9f43'
          : '#FF4D2A';
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, 8, boxH, [18, 0, 0, 18]);
      ctx.fill();

      // Two-line automatic text wrapping (zero while loops, bounded word loop <= 60)
      const words = scene.subtitle.split(' ');
      const maxWords = Math.min(60, words.length);
      let line1 = '';
      let line2 = '';
      ctx.font = '600 25px system-ui, -apple-system, sans-serif';

      for (let i = 0; i < maxWords; i++) {
        const test = line1 ? line1 + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width < boxW - 90 && !line2) {
          line1 = test;
        } else {
          line2 = line2 ? line2 + ' ' + words[i] : words[i];
        }
      }

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      if (line2) {
        ctx.fillText(line1, W * 0.5, boxY + 48);
        ctx.fillText(line2, W * 0.5, boxY + 86);
      } else {
        ctx.fillText(line1, W * 0.5, boxY + 68);
      }
    }

    ctx.restore();
  }

  function drawTitleCardScene(ctx, lt, t) {
    // Scene 14 (129.5s -> 135.0s): Dark-glass editorial title card
    if (window.IntroBG && typeof window.IntroBG.drawDuskSkyline === 'function') {
      window.IntroBG.drawDuskSkyline(ctx, t * 1000, 0, 0);
    } else {
      ctx.fillStyle = '#0b0e1a';
      ctx.fillRect(0, 0, W, H);
    }

    ctx.save();
    ctx.fillStyle = 'rgba(7, 10, 18, 0.84)';
    ctx.fillRect(0, 0, W, H);

    const spring = 1 - Math.exp(-lt * 4.5) * Math.cos(lt * 7);
    const cardW = 1360;
    const cardH = 620;
    const cardX = (W - cardW) * 0.5;
    const cardY = (H - cardH) * 0.5 - 20;

    ctx.translate(W * 0.5, H * 0.5);
    ctx.scale(0.92 + 0.08 * spring, 0.92 + 0.08 * spring);
    ctx.translate(-W * 0.5, -H * 0.5);

    // Glass card container
    ctx.fillStyle = 'rgba(18, 22, 36, 0.90)';
    ctx.strokeStyle = 'rgba(255, 77, 42, 0.70)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 28);
    ctx.fill();
    ctx.stroke();

    // Accent badge
    ctx.fillStyle = '#FF4D2A';
    ctx.font = '800 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VẬT LÍ 10 • BÀI MỞ ĐẦU • NHÓM 1', W * 0.5, cardY + 95);

    // Main Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 54px system-ui, -apple-system, sans-serif';
    ctx.fillText('SƠ LƯỢC VỀ SỰ PHÁT TRIỂN CỦA VẬT LÍ HỌC', W * 0.5, cardY + 190);

    // Subtitle
    ctx.fillStyle = '#ffd166';
    ctx.font = 'italic 600 30px system-ui, -apple-system, sans-serif';
    ctx.fillText('“Hành trình từ tư duy triết học đến khám phá vũ trụ”', W * 0.5, cardY + 255);

    // Divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W * 0.5 - 380, cardY + 310);
    ctx.lineTo(W * 0.5 + 380, cardY + 310);
    ctx.stroke();

    // Presenters & Full Team Credits
    ctx.fillStyle = '#64ffda';
    ctx.font = '700 26px system-ui, -apple-system, sans-serif';
    ctx.fillText('Thuyết trình: Phan Nguyễn Minh Quân & Vũ Nguyễn Tuấn Minh', W * 0.5, cardY + 385);

    ctx.fillStyle = '#d8e2ef';
    ctx.font = '500 23px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      'Thành viên Nhóm 1: Nguyễn Trần Đăng Quang • Phan Nguyễn Minh Quân',
      W * 0.5,
      cardY + 455
    );
    ctx.fillText(
      'Nguyễn Phú Quang • Vũ Nguyễn Tuấn Minh',
      W * 0.5,
      cardY + 498
    );

    ctx.restore();
  }

  // ============================================================================
  // 5. MAIN FRAME RENDERER (Protected by try/catch, 60 FPS)
  // ============================================================================
  function renderFrame(ctx, tSec, state) {
    try {
      const t = clamp(tSec, 0, TOTAL_DURATION);
      const ms = t * 1000;
      const scene = getSceneAt(t);
      const lt = Math.max(0, t - scene.start);

      // Scene 14 Title Card branch
      if (scene.shot === 'title_card') {
        drawTitleCardScene(ctx, lt, t);
        return;
      }

      // Live mouth-open value from IntroAudio
      const rawMouth =
        window.IntroAudio && typeof window.IntroAudio.getMouthOpen === 'function'
          ? window.IntroAudio.getMouthOpen(ms)
          : 0;
      const quanMouth = scene.role === 'quan' ? rawMouth : 0;
      const minhMouth = scene.role === 'minh' ? rawMouth : 0;

      // Subtle cinematic camera drift
      const camX = Math.sin(t * 0.45) * 18;
      const camY = Math.cos(t * 0.35) * 10;

      // Determine effective shot (Scene 7 transitions from closeup_minh to macro at lt = 3.2s)
      let activeShot = scene.shot;
      if (activeShot === 'closeup_minh_to_macro') {
        activeShot = lt < 3.2 ? 'closeup_minh' : 'macro';
      }

      // 1. Render Background Layer
      const BG = window.IntroBG;
      if (activeShot === 'rooftop') {
        if (BG && BG.drawRooftopSunset) BG.drawRooftopSunset(ctx, ms, camX, camY);
        else {
          ctx.fillStyle = '#241838';
          ctx.fillRect(0, 0, W, H);
        }
      } else if (activeShot === 'macro') {
        if (BG && BG.drawMacroTable) BG.drawMacroTable(ctx, ms, camX, camY);
        else {
          ctx.fillStyle = '#2a1810';
          ctx.fillRect(0, 0, W, H);
        }
      } else if (activeShot === 'galaxy_zoom') {
        if (BG && BG.drawDuskSkyline) BG.drawDuskSkyline(ctx, ms, camX, camY);
        else {
          ctx.fillStyle = '#090c1c';
          ctx.fillRect(0, 0, W, H);
        }
      } else {
        if (BG && BG.drawCafeInterior) BG.drawCafeInterior(ctx, ms, camX, camY);
        else {
          ctx.fillStyle = '#261710';
          ctx.fillRect(0, 0, W, H);
        }
        if (activeShot === 'cafe_dark') {
          ctx.fillStyle = 'rgba(10, 12, 34, 0.62)';
          ctx.fillRect(0, 0, W, H);
        }
      }

      // 2. Render Characters by Shot Type
      const fourthWall = activeShot === 'cafe_fourth_wall';
      if (activeShot === 'rooftop') {
        drawCharacterSafe(ctx, 'quan', 680, 820, 1.05, {
          mouthOpen: quanMouth,
          emotion: 'confident',
          eyeLookX: 0.4,
          eyeLookY: -0.6,
          gesture: 'pointUp'
        });
        drawCharacterSafe(ctx, 'minh', 1180, 835, 1.02, {
          mouthOpen: minhMouth,
          emotion: 'curious',
          eyeLookX: 0.3,
          eyeLookY: -0.6,
          gesture: 'idle'
        });
      } else if (
        activeShot === 'cafe' ||
        activeShot === 'cafe_dark' ||
        activeShot === 'cafe_fourth_wall' ||
        activeShot === 'galaxy_zoom'
      ) {
        drawCharacterSafe(ctx, 'quan', 520, 830, 1.08, {
          mouthOpen: quanMouth,
          emotion: fourthWall ? 'confident' : 'neutral',
          eyeLookX: fourthWall ? 0 : 0.5,
          eyeLookY: fourthWall ? 0 : -0.1,
          gesture: scene.id === 13 && lt >= 5.3 ? 'snap' : 'explain'
        });
        drawCharacterSafe(ctx, 'minh', 1390, 840, 1.05, {
          mouthOpen: minhMouth,
          emotion: activeShot === 'cafe_dark' ? 'shocked' : fourthWall ? 'confident' : 'curious',
          eyeLookX: fourthWall ? 0 : -0.5,
          eyeLookY: fourthWall ? 0 : -0.1,
          gesture: 'listen'
        });

        // Cafe foreground table ledge
        ctx.fillStyle = '#2b160c';
        ctx.fillRect(240, 770, 1440, 42);
      } else if (activeShot === 'closeup_minh') {
        drawCharacterSafe(ctx, 'minh', W * 0.5, 960, 1.65, {
          mouthOpen: minhMouth,
          emotion: 'shocked',
          eyeLookX: -0.2,
          eyeLookY: -0.15,
          gesture: 'surprised'
        });
      } else if (activeShot === 'closeup_quan') {
        drawCharacterSafe(ctx, 'quan', W * 0.38, 960, 1.65, {
          mouthOpen: quanMouth,
          emotion: 'neutral',
          eyeLookX: 0.15,
          eyeLookY: -0.05,
          gesture: 'thoughtful'
        });
      }

      // 3. Render Era-Specific Vector Science Hologram
      drawScienceHologram(ctx, scene.hologram, lt, t);

      // 4. Render Documentary Era Tag & Subtitle Box
      drawSubtitleAndEraHUD(ctx, scene, lt);
    } catch (err) {
      // Never allow any frame error to freeze or blank the presentation
    }
  }

  // ============================================================================
  // 6. DIRECTOR CONTROLLER, AUDIO TRIGGERS & INTERACTIVE SCRUBBER BAR
  // ============================================================================
  const IntroDirector = {
    container: null,
    canvas: null,
    ctx: null,
    isPlaying: false,
    isFinished: false,
    currentTime: 0,
    lastRafTime: 0,
    rafId: null,
    lastTriggeredSceneId: 0,
    snapTriggered: false,

    // UI Elements
    playBtn: null,
    scrubberWrap: null,
    scrubberFill: null,
    timecodeLabel: null,
    skipBtn: null,

    init: function (containerSelector) {
      this.container =
        typeof containerSelector === 'string'
          ? document.querySelector(containerSelector)
          : containerSelector || document.getElementById('intro-container') || document.body;

      this._buildDOM();

      // ANTI-BLACK-SCREEN SAFEGUARD: Synchronously render frame 0.0s immediately upon mount
      renderFrame(this.ctx, 0, this);
      this._updateScrubberUI();
      return this;
    },

    _buildDOM: function () {
      // Create or reuse wrapper
      let root = document.getElementById('intro-director-root');
      if (!root) {
        root = document.createElement('div');
        root.id = 'intro-director-root';
        root.style.cssText =
          'position:fixed;inset:0;z-index:9999;background:#080a12;display:flex;align-items:center;justify-content:center;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;user-select:none;';
        this.container.appendChild(root);
      } else {
        root.innerHTML = '';
      }
      this.root = root;

      // Hardcoded 1920x1080 HD Canvas
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      canvas.style.cssText =
        'width:100%;height:100%;object-fit:contain;display:block;background:#0b0e1a;';
      root.appendChild(canvas);
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      // Centered Play Button: `▶ PHÁT INTRO (02:15)`
      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.textContent = '▶ PHÁT INTRO (02:15)';
      playBtn.style.cssText =
        'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);padding:20px 42px;font-size:24px;font-weight:800;color:#ffffff;background:linear-gradient(135deg,#FF4D2A,#ff7b39);border:2px solid rgba(255,255,255,0.35);border-radius:999px;cursor:pointer;box-shadow:0 18px 48px rgba(255,77,42,0.45);letter-spacing:0.5px;transition:transform 0.18s ease,opacity 0.2s ease;z-index:20;';
      root.appendChild(playBtn);
      this.playBtn = playBtn;

      // Bottom Control Bar (Clickable Scrubber + Timecode + Skip Button)
      const bottomBar = document.createElement('div');
      bottomBar.style.cssText =
        'position:absolute;left:0;right:0;bottom:0;height:68px;padding:0 32px;background:linear-gradient(to top,rgba(5,7,14,0.95),rgba(5,7,14,0.0));display:flex;align-items:center;gap:20px;z-index:20;';
      root.appendChild(bottomBar);

      // Play/Pause toggle mini button
      const miniToggle = document.createElement('button');
      miniToggle.type = 'button';
      miniToggle.textContent = '▶';
      miniToggle.style.cssText =
        'width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,0.25);background:rgba(18,22,36,0.85);color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
      bottomBar.appendChild(miniToggle);
      this.miniToggle = miniToggle;

      // Clickable Timeline Scrubber Track
      const scrubberWrap = document.createElement('div');
      scrubberWrap.title = 'Nhấp để tua tới bất kì cảnh nào (00:00 - 02:15)';
      scrubberWrap.style.cssText =
        'flex:1;height:14px;background:rgba(255,255,255,0.18);border-radius:999px;position:relative;cursor:pointer;overflow:hidden;';
      bottomBar.appendChild(scrubberWrap);
      this.scrubberWrap = scrubberWrap;

      const scrubberFill = document.createElement('div');
      scrubberFill.style.cssText =
        'height:100%;width:0%;background:#FF4D2A;border-radius:999px;box-shadow:0 0 12px #FF4D2A;pointer-events:none;';
      scrubberWrap.appendChild(scrubberFill);
      this.scrubberFill = scrubberFill;

      // Live Timecode Readout (`MM:SS / 02:15`)
      const timecodeLabel = document.createElement('div');
      timecodeLabel.textContent = '00:00 / 02:15';
      timecodeLabel.style.cssText =
        'min-width:125px;font-family:monospace;font-size:16px;font-weight:700;color:#f1f5f9;text-align:center;';
      bottomBar.appendChild(timecodeLabel);
      this.timecodeLabel = timecodeLabel;

      // Bottom-Right Skip Button (`Vào Slide thuyết trình →`)
      const skipBtn = document.createElement('button');
      skipBtn.type = 'button';
      skipBtn.textContent = 'Vào Slide thuyết trình →';
      skipBtn.style.cssText =
        'padding:10px 22px;font-size:15px;font-weight:700;color:#ffffff;background:rgba(255,77,42,0.88);border:1px solid rgba(255,255,255,0.3);border-radius:999px;cursor:pointer;white-space:nowrap;';
      bottomBar.appendChild(skipBtn);
      this.skipBtn = skipBtn;

      // Event Listeners
      const self = this;
      playBtn.addEventListener('click', function () {
        self.play();
      });

      miniToggle.addEventListener('click', function () {
        if (self.isPlaying) self.pause();
        else self.play();
      });

      scrubberWrap.addEventListener('click', function (e) {
        const rect = scrubberWrap.getBoundingClientRect();
        if (rect.width <= 0) return;
        const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        self.seek(ratio * TOTAL_DURATION);
      });

      skipBtn.addEventListener('click', function () {
        self.finishIntro();
      });
    },

    play: function () {
      if (this.isFinished) return;
      if (this.currentTime >= TOTAL_DURATION) {
        this.currentTime = 0;
        this.lastTriggeredSceneId = 0;
      }

      this.isPlaying = true;
      this.lastRafTime = performance.now();

      if (this.playBtn) this.playBtn.style.display = 'none';
      if (this.miniToggle) this.miniToggle.textContent = '❚❚';

      // Unlock Web Audio & start Lo-Fi underscore
      if (window.IntroAudio) {
        if (typeof window.IntroAudio.init === 'function') window.IntroAudio.init();
        if (!window.IntroAudio.isPlayingMusic && typeof window.IntroAudio.startMusic === 'function') {
          window.IntroAudio.startMusic();
        }
      }

      // Trigger voiceover & SFX for current scene if not yet triggered
      this._triggerSceneAudio(getSceneAt(this.currentTime), true);

      if (!this.rafId) {
        const self = this;
        const tick = function (now) {
          self._loop(now);
        };
        this.rafId = requestAnimationFrame(tick);
      }
    },

    pause: function () {
      this.isPlaying = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      if (this.miniToggle) this.miniToggle.textContent = '▶';
      if (this.playBtn) {
        this.playBtn.textContent = '▶ TIẾP TỤC INTRO';
        this.playBtn.style.display = 'block';
      }
      if (window.IntroAudio && typeof window.IntroAudio._stopActiveVoice === 'function') {
        window.IntroAudio._stopActiveVoice();
      }
    },

    seek: function (targetSeconds) {
      this.currentTime = clamp(targetSeconds, 0, TOTAL_DURATION);
      this.lastTriggeredSceneId = 0;
      this.snapTriggered = false;

      const scene = getSceneAt(this.currentTime);
      renderFrame(this.ctx, this.currentTime, this);
      this._updateScrubberUI();

      if (this.isPlaying) {
        this._triggerSceneAudio(scene, true);
      }
    },

    _triggerSceneAudio: function (scene, force) {
      if (!scene) return;
      if (!force && this.lastTriggeredSceneId === scene.id) return;

      this.lastTriggeredSceneId = scene.id;
      this.snapTriggered = false;

      if (!window.IntroAudio) return;

      if (scene.sfx && typeof window.IntroAudio.playSFX === 'function') {
        window.IntroAudio.playSFX(scene.sfx);
      }

      if (scene.clipId && scene.subtitle && typeof window.IntroAudio.speak === 'function') {
        window.IntroAudio.speak(scene.subtitle, scene.clipId, scene.role || 'narrator');
      }
    },

    _updateScrubberUI: function () {
      const pct = clamp((this.currentTime / TOTAL_DURATION) * 100, 0, 100);
      if (this.scrubberFill) {
        this.scrubberFill.style.width = pct.toFixed(2) + '%';
      }
      if (this.timecodeLabel) {
        this.timecodeLabel.textContent =
          formatMMSS(this.currentTime) + ' / ' + formatMMSS(TOTAL_DURATION);
      }
    },

    _loop: function (now) {
      if (!this.isPlaying || this.isFinished) return;

      const dt = clamp((now - this.lastRafTime) * 0.001, 0, 0.1);
      this.lastRafTime = now;
      this.currentTime += dt;

      if (this.currentTime >= TOTAL_DURATION) {
        this.currentTime = TOTAL_DURATION;
        this._updateScrubberUI();
        renderFrame(this.ctx, TOTAL_DURATION, this);
        this.finishIntro();
        return;
      }

      const scene = getSceneAt(this.currentTime);
      if (scene.id !== this.lastTriggeredSceneId) {
        this._triggerSceneAudio(scene, false);
      }

      // Scene 13 finger snap SFX at lt = 5.5s
      const lt = this.currentTime - scene.start;
      if (scene.id === 13 && lt >= 5.5 && !this.snapTriggered) {
        this.snapTriggered = true;
        if (window.IntroAudio && typeof window.IntroAudio.playSFX === 'function') {
          window.IntroAudio.playSFX('snap');
        }
      }

      renderFrame(this.ctx, this.currentTime, this);
      this._updateScrubberUI();

      const self = this;
      this.rafId = requestAnimationFrame(function (nextNow) {
        self._loop(nextNow);
      });
    },

    finishIntro: function () {
      if (this.isFinished) return;
      this.isFinished = true;
      this.isPlaying = false;

      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }

      if (window.IntroAudio) {
        if (typeof window.IntroAudio.stopMusic === 'function') window.IntroAudio.stopMusic();
        if (typeof window.IntroAudio._stopActiveVoice === 'function') {
          window.IntroAudio._stopActiveVoice();
        }
      }

      if (this.root) {
        this.root.style.transition = 'opacity 0.45s ease';
        this.root.style.opacity = '0';
        const rootEl = this.root;
        setTimeout(function () {
          if (rootEl && rootEl.parentNode) {
            rootEl.parentNode.removeChild(rootEl);
          }
        }, 460);
      }

      // Seamless handoff to Grade 10 Physics presentation (`window.App`)
      try {
        if (window.App) {
          if (typeof window.App.start === 'function') window.App.start();
          else if (typeof window.App.init === 'function') window.App.init();
          else if (typeof window.App.showSlide === 'function') window.App.showSlide(0);
        }
        window.dispatchEvent(new CustomEvent('intro:finished'));
      } catch (e) {}
    }
  };

  window.IntroDirector = IntroDirector;

  // Auto-mount as soon as DOM is ready so the canvas is never blank
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      IntroDirector.init();
    });
  } else {
    IntroDirector.init();
  }
})();
