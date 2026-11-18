/**
 * intro-director.js
 * 60.0-Second (01:00) 60 FPS High-Motion 2D Animated Intro Director (Nhóm 1 — Vật Lí 10).
 *
 * STRICT ANTI-FREEZE & REALISM GUARANTEES:
 * - Tracks `activeSceneIdx = -1` so `IntroAudio.speak` / `IntroAudio.playSFX` trigger ONLY on cut transitions.
 * - Every render block is isolated inside `ctx.save(); try { ... } finally { ctx.restore(); }`.
 * - ONLY constant-bound integer loops (`for (let i = 0; i < N; i++)` where N <= 20).
 * - ZERO `while` loops and ZERO `ctx.filter`.
 * - Organic character kinematics: torso breathing, head tilt, natural blinking (0.12s every 3.1s),
 *   eye saccades + object tracking, 2.5D multi-plane parallax (0.25x, 1.0x, 1.3x), and real gravity
 *   bounce physics (g = 2400 px/s², 3 damped bounces, squash-and-stretch, rolling deceleration).
 */

(function () {
  'use strict';

  const W = 1920;
  const H = 1080;
  const TOTAL_DURATION = 60.0; // seconds (01:00)

  // ============================================================================
  // 1. DATA-DRIVEN 10-CUT HIGH-MOTION STORYBOARD (0.0s to 60.0s)
  // ============================================================================
  const SCENES = [
    {
      idx: 0,
      start: 0.0,
      end: 6.0,
      cut: 'cut1_rooftop_toss',
      clipId: 1,
      role: 'narrator',
      sfx: 'whoosh',
      hudTag: 'THÍ NGHIỆM TƯ DUY • BẦU TRỜI HOÀNG HÔN',
      subtitle:
        'Chuyện gì sẽ xảy ra... nếu ngay lúc này, ta thử tắt từng quy luật vô hình của vũ trụ?'
    },
    {
      idx: 1,
      start: 6.0,
      end: 12.5,
      cut: 'cut2_macro_zerog',
      clipId: 2,
      role: 'quan',
      sfx: 'whoosh',
      hudTag: 'QUY LUẬT 01: TRỌNG LỰC • TẮT (g = 0.00 m/s²)',
      subtitle:
        'Minh Quân: Nếu lực kéo dưới chân biến mất... điều gì đang giữ đại dương và Mặt Trăng không trôi dạt vào vũ trụ?'
    },
    {
      idx: 2,
      start: 12.5,
      end: 18.0,
      cut: 'cut3_minh_closeup',
      clipId: 3,
      role: 'minh',
      sfx: 'whoosh',
      hudTag: 'CÂU HỎI CỦA GALILEO • SỰ RƠI TỰ DO',
      subtitle:
        'Tuấn Minh: Khoan đã Quân... nếu mọi vật đều tự do bay lên thế này, tại sao ngoài đời thật quả táo và lông vũ lại rơi khác nhau?'
    },
    {
      idx: 3,
      start: 18.0,
      end: 24.5,
      cut: 'cut4_cafe_poke',
      clipId: null,
      role: 'minh',
      sfx: 'zeroG',
      hudTag: 'TƯƠNG TÁC KHÔNG TRỌNG LỰC • SỨC CĂNG BỀ MẶT',
      subtitle: ''
    },
    {
      idx: 4,
      start: 24.5,
      end: 32.5,
      cut: 'cut5_blackout_em',
      clipId: 4,
      role: 'quan',
      sfx: 'powerDown',
      hudTag: 'QUY LUẬT 02: ĐIỆN TỪ & ÁNH SÁNG • TẮT',
      subtitle:
        'Minh Quân: Nếu tắt luôn điện từ trường... mọi ánh đèn sẽ vụt tắt. Tại sao tia sét, nam châm và ánh nắng thực chất lại là cùng một thứ?'
    },
    {
      idx: 5,
      start: 32.5,
      end: 40.5,
      cut: 'cut6_spacetime_warp',
      clipId: 5,
      role: 'minh',
      sfx: 'timeWarp',
      hudTag: 'QUY LUẬT 03: KHÔNG - THỜI GIAN • BẺ CONG (E = mc²)',
      subtitle:
        'Tuấn Minh: Sao kim đồng hồ lại chạy chậm dần thế này?! Có thật là bay càng nhanh, thời gian sẽ trôi chậm hơn cả thế giới không?'
    },
    {
      idx: 6,
      start: 40.5,
      end: 46.5,
      cut: 'cut7_snap_bounce',
      clipId: 6,
      role: 'quan',
      sfx: 'whoosh',
      hudTag: 'KHÔI PHỤC QUY LUẬT VŨ TRỤ • g = 9.80 m/s²',
      subtitle:
        'Minh Quân: Chúng ta không có công tắc tắt mở vũ trụ... nhưng trí tò mò đã giúp loài người giải mã từng quy luật kỳ diệu ấy.'
    },
    {
      idx: 7,
      start: 46.5,
      end: 50.5,
      cut: 'cut8_macro_gauge',
      clipId: null,
      role: 'quan',
      sfx: 'whoosh',
      hudTag: 'ĐO LƯỜNG THỰC NGHIỆM • ĐỒNG BỘ TRỌNG TRƯỜNG',
      subtitle: ''
    },
    {
      idx: 8,
      start: 50.5,
      end: 55.5,
      cut: 'cut9_fourth_wall',
      clipId: null,
      role: 'narrator',
      sfx: 'whoosh',
      hudTag: 'NHÓM 1 • CHÀO MỪNG ĐẾN VỚI BÀI MỞ ĐẦU VẬT LÍ 10',
      subtitle:
        'Mời cô và các bạn cùng Nhóm 1 bước vào hành trình khám phá sự phát triển của Vật lí học ngay sau đây!'
    },
    {
      idx: 9,
      start: 55.5,
      end: 60.0,
      cut: 'cut10_title_card',
      clipId: null,
      role: null,
      sfx: 'snap',
      hudTag: '',
      subtitle: ''
    }
  ];

  // ============================================================================
  // 2. PURE MATH & PHYSICS KINEMATICS HELPERS (Zero Loops)
  // ============================================================================
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function lerp(a, b, u) {
    return a + (b - a) * clamp(u, 0, 1);
  }

  function formatMMSS(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return (m < 10 ? '0' + m : '' + m) + ':' + (r < 10 ? '0' + r : '' + r);
  }

  function getSceneIndexAt(tSec) {
    const t = clamp(tSec, 0, TOTAL_DURATION - 0.001);
    for (let i = 0; i < 10; i++) {
      if (t >= SCENES[i].start && t < SCENES[i].end) {
        return i;
      }
    }
    return 9;
  }

  /**
   * Computes organic lifelike character kinematics (breathing, blink, saccades, head tilt)
   */
  function getOrganicPose(t, role, mouthOpen, baseLookX, baseLookY, emotion, phaseOffset) {
    const breathY = Math.sin(t * 2.8 + phaseOffset) * 3.5;
    const weightShiftX = Math.cos(t * 1.4 + phaseOffset) * 2.2;
    const isBlinking = (t + phaseOffset * 0.7) % 3.1 < 0.12;
    const saccadeX = Math.sin(t * 4.3 + phaseOffset) * 0.15;
    const saccadeY = Math.cos(t * 3.7 + phaseOffset) * 0.08;
    const headTilt =
      mouthOpen > 0.08
        ? Math.sin(t * 9.5 + phaseOffset) * 0.065
        : Math.sin(t * 1.6 + phaseOffset) * 0.025;

    return {
      breathY: breathY,
      weightShiftX: weightShiftX,
      pose: {
        mouthOpen: mouthOpen,
        blink: isBlinking,
        emotion: emotion || 'neutral',
        eyeLookX: clamp(baseLookX + saccadeX, -1, 1),
        eyeLookY: clamp(baseLookY + saccadeY, -1, 1),
        headTilt: headTilt
      }
    };
  }

  /**
   * Simulates real gravitational free-fall (g = 2400 px/s²) starting at t = 43.2s
   * with 3 damped inelastic bounces, squash-and-stretch on impact, and rolling deceleration.
   */
  function computeAppleBouncePhysics(t) {
    const dropStart = 43.2;
    const startY = 350;
    const tableY = 725;
    const dropH = tableY - startY; // 375 px
    const g = 2400; // px/s²

    // Before drop: floating gently in zero-G
    if (t < dropStart) {
      return {
        x: W * 0.5,
        y: startY + Math.sin(t * 2.6) * 14,
        rot: (t - 40.5) * 0.45,
        scaleX: 1.0,
        scaleY: 1.0,
        impactShake: 0
      };
    }

    const dt = t - dropStart;
    // Exact kinematic bounce intervals for g = 2400 px/s², h0 = 375 px:
    // Fall 0: t1 = sqrt(2 * 375 / 2400) = 0.559s (impact #1 at dt = 0.559s)
    // Bounce 1 (e1 = 0.52): duration = 2 * 0.52 * 0.559 = 0.581s (impact #2 at dt = 1.140s)
    // Bounce 2 (e2 = 0.27): duration = 2 * 0.27 * 0.559 = 0.302s (impact #3 at dt = 1.442s)
    // Bounce 3 (e3 = 0.12): duration = 2 * 0.12 * 0.559 = 0.134s (settles at dt = 1.576s)
    const tImpact1 = 0.559;
    const tImpact2 = 1.140;
    const tImpact3 = 1.442;
    const tSettle = 1.576;

    let y = tableY;
    let scaleX = 1.0;
    let scaleY = 1.0;
    let shake = 0;

    if (dt < tImpact1) {
      // Initial free-fall acceleration
      y = startY + 0.5 * g * dt * dt;
      // Slight vertical velocity stretch before impact
      const vNorm = dt / tImpact1;
      scaleX = 1.0 - vNorm * 0.08;
      scaleY = 1.0 + vNorm * 0.10;
    } else if (dt < tImpact2) {
      // Bounce 1 parabolic arc (height = 375 * 0.52² = 101.4 px)
      const u = (dt - tImpact1) / (tImpact2 - tImpact1);
      y = tableY - 4 * 101.4 * u * (1 - u);
    } else if (dt < tImpact3) {
      // Bounce 2 parabolic arc (height = 375 * 0.27² = 27.3 px)
      const u = (dt - tImpact2) / (tImpact3 - tImpact2);
      y = tableY - 4 * 27.3 * u * (1 - u);
    } else if (dt < tSettle) {
      // Bounce 3 micro-hop (height = 375 * 0.12² = 5.4 px)
      const u = (dt - tImpact3) / (tSettle - tImpact3);
      y = tableY - 4 * 5.4 * u * (1 - u);
    } else {
      y = tableY;
    }

    // Impact squash-and-stretch (`scaleX: 1.15, scaleY: 0.85`) & camera micro-shake
    const d1 = Math.abs(dt - tImpact1);
    const d2 = Math.abs(dt - tImpact2);
    const d3 = Math.abs(dt - tImpact3);

    if (d1 < 0.055) {
      const k = 1 - d1 / 0.055;
      scaleX = 1.0 + 0.15 * k;
      scaleY = 1.0 - 0.15 * k;
      shake = 9.0 * k;
    } else if (d2 < 0.045) {
      const k = 1 - d2 / 0.045;
      scaleX = 1.0 + 0.10 * k;
      scaleY = 1.0 - 0.10 * k;
      shake = 4.5 * k;
    } else if (d3 < 0.035) {
      const k = 1 - d3 / 0.035;
      scaleX = 1.0 + 0.05 * k;
      scaleY = 1.0 - 0.05 * k;
      shake = 2.0 * k;
    }

    // Rolling deceleration across the wooden table after first impact
    const rollDt = Math.max(0, dt - tImpact1);
    const rollProgress = 1 - Math.exp(-rollDt * 2.2);
    const x = W * 0.5 + rollProgress * 115;
    const rot = 0.8 + rollProgress * 2.4;

    return {
      x: x,
      y: y,
      rot: rot,
      scaleX: scaleX,
      scaleY: scaleY,
      impactShake: shake
    };
  }

  // ============================================================================
  // 3. SAFE VECTOR PROP & CHARACTER WRAPPERS
  // ============================================================================
  function drawCharacterWithKinematics(ctx, charType, baseX, baseY, scale, kin) {
    ctx.save();
    try {
      const x = baseX + kin.weightShiftX;
      const y = baseY + kin.breathY;
      if (window.IntroRig && typeof window.IntroRig.drawCharacter === 'function') {
        window.IntroRig.drawCharacter(ctx, charType, x, y, scale, kin.pose);
      } else {
        // Fallback expressive vector rig if IntroRig is unavailable
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Torso
        ctx.fillStyle = charType === 'quan' ? '#233652' : '#633724';
        ctx.beginPath();
        ctx.roundRect(-58, -140, 116, 150, 26);
        ctx.fill();

        // Head with speech-synced tilt
        ctx.save();
        ctx.translate(0, -185);
        ctx.rotate(kin.pose.headTilt || 0);

        ctx.fillStyle = '#f3c6a4';
        ctx.beginPath();
        ctx.arc(0, 0, 44, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = '#181210';
        ctx.beginPath();
        ctx.arc(0, -12, 45, Math.PI, Math.PI * 2);
        ctx.fill();

        // Eyes (blink or tracking pupils)
        const lx = (kin.pose.eyeLookX || 0) * 6;
        const ly = (kin.pose.eyeLookY || 0) * 4;
        if (kin.pose.blink) {
          ctx.strokeStyle = '#181210';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-22, -2);
          ctx.lineTo(-8, -2);
          ctx.moveTo(8, -2);
          ctx.lineTo(22, -2);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-15, -3, 7.5, 0, Math.PI * 2);
          ctx.arc(15, -3, 7.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#181210';
          ctx.beginPath();
          ctx.arc(-15 + lx, -3 + ly, 4.2, 0, Math.PI * 2);
          ctx.arc(15 + lx, -3 + ly, 4.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Eyebrows
        const browLift = kin.pose.emotion === 'shocked' ? -8 : 0;
        ctx.strokeStyle = '#181210';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-24, -14 + browLift);
        ctx.lineTo(-7, -15 + browLift);
        ctx.moveTo(7, -15 + browLift);
        ctx.lineTo(24, -14 + browLift);
        ctx.stroke();

        // Mouth
        const mo = clamp(kin.pose.mouthOpen || 0, 0, 1);
        ctx.fillStyle = '#7d2420';
        ctx.beginPath();
        ctx.ellipse(0, 19, 8 + mo * 5, 2.2 + mo * 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    } finally {
      ctx.restore();
    }
  }

  function drawRedApple(ctx, x, y, radius, rot, scaleX, scaleY, glowAlpha) {
    ctx.save();
    try {
      ctx.translate(x, y);
      ctx.scale(scaleX || 1, scaleY || 1);
      ctx.rotate(rot || 0);

      if (glowAlpha > 0.01) {
        const g = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 2.4);
        g.addColorStop(0, `rgba(255, 95, 65, ${glowAlpha.toFixed(2)})`);
        g.addColorStop(1, 'rgba(255, 65, 35, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Apple body
      const bodyG = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 2, 0, 0, radius);
      bodyG.addColorStop(0, '#ff7b6b');
      bodyG.addColorStop(0.55, '#e62e25');
      bodyG.addColorStop(1, '#7a0f0b');
      ctx.fillStyle = bodyG;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // Stem & green leaf
      ctx.strokeStyle = '#4a2c18';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.85);
      ctx.quadraticCurveTo(4, -radius * 1.25, 10, -radius * 1.3);
      ctx.stroke();

      ctx.fillStyle = '#4cd137';
      ctx.beginPath();
      ctx.ellipse(11, -radius * 1.12, 10, 4.5, -0.4, 0, Math.PI * 2);
      ctx.fill();
    } finally {
      ctx.restore();
    }
  }

  function drawCoffeeDroplet(ctx, x, y, r, rot, stretch) {
    ctx.save();
    try {
      ctx.translate(x, y);
      ctx.rotate(rot || 0);
      ctx.scale(1 + (stretch || 0), 1 - (stretch || 0) * 0.7);

      const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
      g.addColorStop(0, '#ffd8a8');
      g.addColorStop(0.45, '#9c5a2d');
      g.addColorStop(1, '#3b1c08');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.arc(-r * 0.32, -r * 0.32, r * 0.24, 0, Math.PI * 2);
      ctx.fill();
    } finally {
      ctx.restore();
    }
  }

  function drawForegroundParallaxMotes(ctx, t, camX, camY, tint) {
    ctx.save();
    try {
      // Foreground 1.3x parallax dust motes (strictly bounded 16 iterations)
      const pxShift = camX * 1.3;
      const pyShift = camY * 1.3;
      ctx.fillStyle = tint || 'rgba(255, 225, 165, 0.28)';
      for (let i = 0; i < 16; i++) {
        const mx = ((i * 137 + t * (14 + (i % 4) * 5) - pxShift) % W + W) % W;
        const my = ((i * 93 - t * (10 + (i % 3) * 4) - pyShift) % H + H) % H;
        const r = 2.0 + (i % 3) * 1.6;
        ctx.beginPath();
        ctx.arc(mx, my, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } finally {
      ctx.restore();
    }
  }

  // ============================================================================
  // 4. 10-CUT SCENE RENDERERS (Every Cut Wrapped in try/finally)
  // ============================================================================
  function renderFrame(ctx, tSec) {
    ctx.save();
    try {
      const t = clamp(tSec, 0, TOTAL_DURATION);
      const ms = t * 1000;
      const idx = getSceneIndexAt(t);
      const scene = SCENES[idx];
      const lt = Math.max(0, t - scene.start);

      const rawMouth =
        window.IntroAudio && typeof window.IntroAudio.getMouthOpen === 'function'
          ? window.IntroAudio.getMouthOpen(t)
          : 0;
      const quanMouth = scene.role === 'quan' ? rawMouth : 0;
      const minhMouth = scene.role === 'minh' ? rawMouth : 0;

      // Base camera pan for 2.5D multi-plane parallax
      const camX = Math.sin(t * 0.55) * 28;
      const camY = Math.cos(t * 0.42) * 14;
      const BG = window.IntroBG;

      // ----------------------------------------------------------------------
      // CUT 1 (0.0s - 6.0s): Rooftop Dusk Push-In + Parabolic Apple Toss & Catch
      // ----------------------------------------------------------------------
      if (scene.cut === 'cut1_rooftop_toss') {
        const pushZoom = 1.0 + (lt / 6.0) * 0.08;
        ctx.save();
        try {
          ctx.translate(W * 0.5, H * 0.5);
          ctx.scale(pushZoom, pushZoom);
          ctx.translate(-W * 0.5, -H * 0.5);

          // Background (0.25x parallax)
          if (BG && BG.drawRooftopSunset) {
            BG.drawRooftopSunset(ctx, ms, camX * 0.25, camY * 0.25);
          }

          // Parabolic apple toss cycle (period = 1.5s)
          const cycle = (lt % 1.5) / 1.5;
          const handX = 775 - camX * 1.0;
          const handY = 585 - camY * 1.0;
          const tossArc = 4 * cycle * (1 - cycle); // 0 -> 1 -> 0 parabola
          const appleY = handY - tossArc * 235;
          const appleRot = lt * 3.8;

          // Eye tracking target: both characters watch the tossed apple
          const lookY = clamp((appleY - 520) / 260, -0.85, 0.45);

          // Midground Characters (1.0x parallax)
          const quanKin = getOrganicPose(t, 'quan', quanMouth, 0.28, lookY, 'confident', 0.0);
          const minhKin = getOrganicPose(t, 'minh', minhMouth, -0.35, lookY, 'curious', 1.7);

          drawCharacterWithKinematics(ctx, 'quan', 650 - camX, 855 - camY, 1.08, quanKin);
          drawCharacterWithKinematics(ctx, 'minh', 1240 - camX, 865 - camY, 1.05, minhKin);

          // Wrist follow-through & parabolic red apple
          const wristOffset = Math.sin(cycle * Math.PI * 2) * 18;
          ctx.fillStyle = '#f3c6a4';
          ctx.beginPath();
          ctx.arc(handX, handY + wristOffset, 15, 0, Math.PI * 2);
          ctx.fill();

          drawRedApple(ctx, handX, appleY, 24, appleRot, 1, 1, 0.45);

          // Foreground (1.3x parallax motes)
          drawForegroundParallaxMotes(ctx, t, camX, camY, 'rgba(255, 215, 130, 0.35)');
        } finally {
          ctx.restore();
        }
      }

      // ----------------------------------------------------------------------
      // CUT 2 (6.0s - 12.5s): Macro Table Zero-G Liftoff + 10 Floating Droplets
      // ----------------------------------------------------------------------
      else if (scene.cut === 'cut2_macro_zerog') {
        if (BG && BG.drawMacroTable) {
          BG.drawMacroTable(ctx, ms, camX * 0.25, camY * 0.25);
        }

        const liftProgress = clamp(lt / 4.5, 0, 1);
        const easeLift = 1 - Math.pow(1 - liftProgress, 2.5);

        // Quân's close-up hand pulling back
        if (window.IntroRig && typeof window.IntroRig.drawCloseUpArmHand === 'function') {
          window.IntroRig.drawCloseUpArmHand(
            ctx,
            340 - easeLift * 95 - camX,
            540 - easeLift * 65 - camY,
            1.1,
            'open'
          );
        } else {
          ctx.fillStyle = '#f3c6a4';
          ctx.beginPath();
          ctx.roundRect(210 - easeLift * 90 - camX, 490 - easeLift * 60 - camY, 155, 58, 28);
          ctx.fill();
        }

        // 10 Floating Coffee Droplets with independent sinusoidal bobbing + rotation
        for (let i = 0; i < 10; i++) {
          const seed = i * 1.37;
          const dx =
            W * 0.48 +
            (i - 4.5) * 62 +
            Math.sin(t * 2.1 + seed) * 24 -
            camX * 1.15;
          const dy =
            610 -
            easeLift * (140 + (i % 4) * 58) +
            Math.cos(t * 2.7 + seed) * 18 -
            camY * 1.15;
          const r = 10 + (i % 3) * 5.5;
          const rot = t * (1.2 + (i % 3) * 0.4) + seed;
          const stretch = Math.sin(t * 4.5 + seed) * 0.12;
          drawCoffeeDroplet(ctx, dx, dy, r, rot, stretch);
        }

        // Apple lifting off with slow zero-G spin
        const appleX = W * 0.36 - camX * 1.1;
        const appleY = 650 - easeLift * 265 + Math.sin(t * 2.4) * 14 - camY * 1.1;
        drawRedApple(ctx, appleX, appleY, 38, lt * 0.85, 1, 1, 0.55);

        // Telemetry Gauge (`QUY LUẬT 01: TRỌNG LỰC • TẮT`)
        const gVal = Math.max(0, 9.8 * (1 - clamp(lt * 1.2, 0, 1)));
        if (window.IntroRig && typeof window.IntroRig.drawTelemetryGauge === 'function') {
          window.IntroRig.drawTelemetryGauge(ctx, 1520, 340, gVal, 'QUY LUẬT 01: TRỌNG LỰC • TẮT');
        } else {
          ctx.fillStyle = 'rgba(10, 18, 32, 0.82)';
          ctx.strokeStyle = '#00f5d4';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(1310, 250, 440, 130, 18);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#00f5d4';
          ctx.font = '800 26px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('g = ' + gVal.toFixed(2) + ' m/s² • TẮT', 1530, 325);
        }

        drawForegroundParallaxMotes(ctx, t, camX, camY, 'rgba(140, 240, 255, 0.32)');
      }

      // ----------------------------------------------------------------------
      // CUT 3 (12.5s - 18.0s): Extreme Face Close-Up on Tuấn Minh Tracking Droplet
      // ----------------------------------------------------------------------
      else if (scene.cut === 'cut3_minh_closeup') {
        if (BG && BG.drawCafeInterior) {
          BG.drawCafeInterior(ctx, ms, camX * 0.25, camY * 0.25);
        }

        // Coffee droplet drifting right past his nose
        const dropX = lerp(W * 0.32, W * 0.68, lt / 5.5) - camX * 1.25;
        const dropY = H * 0.48 + Math.sin(t * 3.4) * 38 - camY * 1.25;

        // Pupils dynamically track the droplet position relative to Minh's face center
        const trackX = clamp((dropX - W * 0.5) / 340, -0.85, 0.85);
        const trackY = clamp((dropY - H * 0.48) / 220, -0.75, 0.75);

        const minhKin = getOrganicPose(t, 'minh', minhMouth, trackX, trackY, 'shocked', 0.8);
        drawCharacterWithKinematics(ctx, 'minh', W * 0.5 - camX, 1140 - camY, 2.35, minhKin);

        // Foreground drifting droplet right in front of his nose (1.3x parallax)
        drawCoffeeDroplet(ctx, dropX, dropY, 28, t * 1.8, Math.sin(t * 6) * 0.14);
        drawCoffeeDroplet(ctx, dropX - 180, dropY - 95, 14, -t * 1.4, Math.cos(t * 5) * 0.1);
      }

      // ----------------------------------------------------------------------
      // CUT 4 (18.0s - 24.5s): Cafe Two-Shot Droplet Poke & Split
      // ----------------------------------------------------------------------
      else if (scene.cut === 'cut4_cafe_poke') {
        if (BG && BG.drawCafeInterior) {
          BG.drawCafeInterior(ctx, ms, camX * 0.25, camY * 0.25);
        }

        const pokeTime = 2.2; // Minh pokes droplet at lt = 2.2s (t = 20.2s)
        const isSplit = lt >= pokeTime;
        const centerDropX = W * 0.52 - camX;
        const centerDropY = 470 + Math.sin(t * 2.5) * 16 - camY;

        const quanKin = getOrganicPose(t, 'quan', 0, 0.45, -0.1, 'confident', 0.2);
        const minhKin = getOrganicPose(t, 'minh', 0, -0.45, -0.1, 'curious', 1.5);

        drawCharacterWithKinematics(ctx, 'quan', 540 - camX, 850 - camY, 1.1, quanKin);
        drawCharacterWithKinematics(ctx, 'minh', 1380 - camX, 855 - camY, 1.08, minhKin);

        // Minh's hand reaching forward to poke the floating droplet
        const reachProgress =
          lt < pokeTime
            ? clamp(lt / pokeTime, 0, 1)
            : clamp(1 - (lt - pokeTime) * 0.45, 0.3, 1);
        const fingerX = lerp(1260, centerDropX + 26, reachProgress) - camX;
        const fingerY = lerp(640, centerDropY, reachProgress) - camY;

        ctx.strokeStyle = '#633724';
        ctx.lineWidth = 26;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(1310 - camX, 680 - camY);
        ctx.lineTo(fingerX, fingerY);
        ctx.stroke();

        ctx.fillStyle = '#f3c6a4';
        ctx.beginPath();
        ctx.arc(fingerX, fingerY, 14, 0, Math.PI * 2);
        ctx.fill();

        // Droplet wobbles and splits into two smaller droplets upon poke
        if (!isSplit) {
          drawCoffeeDroplet(ctx, centerDropX, centerDropY, 32, t * 1.5, Math.sin(t * 7) * 0.12);
        } else {
          const splitDt = lt - pokeTime;
          const sep = Math.min(135, splitDt * 75);
          const wobble = Math.exp(-splitDt * 2.5) * Math.sin(splitDt * 24) * 0.28;
          drawCoffeeDroplet(
            ctx,
            centerDropX - sep,
            centerDropY - sep * 0.35,
            21,
            t * 2.5,
            wobble
          );
          drawCoffeeDroplet(
            ctx,
            centerDropX + sep,
            centerDropY + sep * 0.25,
            19,
            -t * 2.2,
            -wobble
          );

          // Expanding surface-tension ripple ring
          const ringAlpha = clamp(1 - splitDt * 1.1, 0, 1);
          if (ringAlpha > 0.01) {
            ctx.strokeStyle = `rgba(255, 220, 175, ${ringAlpha.toFixed(2)})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerDropX, centerDropY, 25 + splitDt * 140, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Foreground cafe table
        ctx.fillStyle = '#29150b';
        ctx.fillRect(200 - camX * 1.3, 760 - camY * 1.3, 1520, 48);
      }

      // ----------------------------------------------------------------------
      // CUT 5 (24.5s - 32.5s): Cafe Blackout & Electromagnetism Arcs
      // ----------------------------------------------------------------------
      else if (scene.cut === 'cut5_blackout_em') {
        if (BG && BG.drawCafeInterior) {
          BG.drawCafeInterior(ctx, ms, camX * 0.25, camY * 0.25);
        }

        // Flickering blackout overlay (`rgba(8, 12, 22, 0.55)`)
        const flicker = lt < 0.7 ? (Math.sin(lt * 38) > 0 ? 0.25 : 0.65) : 0.58;
        ctx.fillStyle = `rgba(8, 12, 22, ${flicker.toFixed(2)})`;
        ctx.fillRect(0, 0, W, H);

        const quanKin = getOrganicPose(t, 'quan', quanMouth, 0.35, -0.15, 'confident', 0.0);
        const minhKin = getOrganicPose(t, 'minh', minhMouth, -0.4, -0.15, 'shocked', 1.4);

        drawCharacterWithKinematics(ctx, 'quan', 540 - camX, 850 - camY, 1.1, quanKin);
        drawCharacterWithKinematics(ctx, 'minh', 1380 - camX, 855 - camY, 1.08, minhKin);

        // Spinning magnetic compass needle at center
        const compX = W * 0.54 - camX;
        const compY = 470 - camY;
        const handX = 685 - camX;
        const handY = 530 - camY;

        // Glowing cyan electric arcs between Quân's raised hand & compass (bounded 12 segments)
        ctx.strokeStyle = '#00f5d4';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(handX, handY);
        for (let i = 1; i <= 12; i++) {
          const u = i / 12;
          const jitter = i < 12 ? Math.sin(t * 42 + i * 7.3) * 26 : 0;
          const ax = lerp(handX, compX, u);
          const ay = lerp(handY, compY, u) + jitter;
          ctx.lineTo(ax, ay);
        }
        ctx.stroke();

        // Compass dial & wildly spinning needle
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(compX, compY, 64, 0, Math.PI * 2);
        ctx.stroke();

        ctx.save();
        try {
          ctx.translate(compX, compY);
          ctx.rotate(t * 7.5);
          ctx.fillStyle = '#ff2a55';
          ctx.beginPath();
          ctx.moveTo(0, -52);
          ctx.lineTo(10, 0);
          ctx.lineTo(-10, 0);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(0, 52);
          ctx.lineTo(10, 0);
          ctx.lineTo(-10, 0);
          ctx.closePath();
          ctx.fill();
        } finally {
          ctx.restore();
        }

        ctx.fillStyle = '#29150b';
        ctx.fillRect(200 - camX * 1.3, 760 - camY * 1.3, 1520, 48);
      }

      // ----------------------------------------------------------------------
      // CUT 6 (32.5s - 40.5s): Spacetime Warp Grid & Slow-Motion Wall Clock
      // ----------------------------------------------------------------------
      else if (scene.cut === 'cut6_spacetime_warp') {
        if (BG && BG.drawCafeInterior) {
          BG.drawCafeInterior(ctx, ms, camX * 0.25, camY * 0.25);
        }

        // Deep indigo cosmic tint
        ctx.fillStyle = 'rgba(12, 10, 42, 0.64)';
        ctx.fillRect(0, 0, W, H);

        // 3D Wireframe Spacetime Grid bending beneath floating apple (bounded 11 lines)
        const gridCX = W * 0.5 - camX;
        const gridCY = 460 - camY;
        ctx.strokeStyle = 'rgba(110, 230, 255, 0.62)';
        ctx.lineWidth = 2.2;
        for (let i = -5; i <= 5; i++) {
          const yRow = gridCY + i * 26;
          const dip = Math.exp(-(i * i) * 0.16) * (75 + Math.sin(t * 3) * 14);
          ctx.beginPath();
          ctx.moveTo(gridCX - 340, yRow);
          ctx.quadraticCurveTo(gridCX, yRow + dip, gridCX + 340, yRow);
          ctx.stroke();
        }

        // Floating Apple warping the spacetime well
        drawRedApple(ctx, gridCX, gridCY - 12 + Math.sin(t * 2.2) * 10, 34, t * 0.6, 1, 1, 0.75);

        // Stuttering Slow-Motion Relativistic Clock
        const clockX = W * 0.5 - camX * 0.4;
        const clockY = 215 - camY * 0.4;
        ctx.fillStyle = 'rgba(14, 18, 38, 0.85)';
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(clockX, clockY, 68, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Clock hand crawls and stutters in relativistic time dilation
        const dilatedAngle = -Math.PI * 0.5 + Math.pow(lt / 8.0, 0.45) * 1.4;
        ctx.strokeStyle = '#ff4d2a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(clockX, clockY);
        ctx.lineTo(
          clockX + Math.cos(dilatedAngle) * 52,
          clockY + Math.sin(dilatedAngle) * 52
        );
        ctx.stroke();

        const quanKin = getOrganicPose(t, 'quan', quanMouth, 0.25, -0.35, 'neutral', 0.1);
        const minhKin = getOrganicPose(t, 'minh', minhMouth, -0.25, -0.45, 'shocked', 1.2);

        drawCharacterWithKinematics(ctx, 'quan', 520 - camX, 855 - camY, 1.08, quanKin);
        drawCharacterWithKinematics(ctx, 'minh', 1400 - camX, 860 - camY, 1.08, minhKin);
      }

      // ----------------------------------------------------------------------
      // CUT 7 (40.5s - 46.5s): Anticipation Finger Snap (42.2s) & 3-Bounce Apple (43.2s)
      // ----------------------------------------------------------------------
      else if (scene.cut === 'cut7_snap_bounce') {
        const applePhys = computeAppleBouncePhysics(t);
        const shakeX = (Math.sin(t * 95) * applePhys.impactShake) || 0;
        const shakeY = (Math.cos(t * 110) * applePhys.impactShake) || 0;

        if (BG && BG.drawCafeInterior) {
          BG.drawCafeInterior(ctx, ms, camX * 0.25 + shakeX, camY * 0.25 + shakeY);
        }

        // Before snap at 42.2s: dim twilight; after 42.2s: warm golden lights burst back on!
        if (t < 42.2) {
          ctx.fillStyle = 'rgba(10, 12, 28, 0.48)';
          ctx.fillRect(0, 0, W, H);
        } else {
          const flashAlpha = clamp(1 - (t - 42.2) * 1.8, 0, 0.45);
          if (flashAlpha > 0.01) {
            ctx.fillStyle = `rgba(255, 230, 160, ${flashAlpha.toFixed(2)})`;
            ctx.fillRect(0, 0, W, H);
          }
        }

        // Both characters track the falling & bouncing apple
        const trackY = clamp((applePhys.y - 540) / 280, -0.5, 0.65);
        const quanKin = getOrganicPose(t, 'quan', quanMouth, 0.35, trackY, 'confident', 0.0);
        const minhKin = getOrganicPose(t, 'minh', minhMouth, -0.35, trackY, 'curious', 1.4);

        drawCharacterWithKinematics(
          ctx,
          'quan',
          530 - camX + shakeX,
          850 - camY + shakeY,
          1.1,
          quanKin
        );
        drawCharacterWithKinematics(
          ctx,
          'minh',
          1390 - camX + shakeX,
          855 - camY + shakeY,
          1.08,
          minhKin
        );

        // Anticipation raised hand at 41.5s & Dual Shockwave Rings at 42.2s
        const snapX = 685 - camX + shakeX;
        const snapY = t < 41.5 ? 610 : t < 42.2 ? 485 : 515;
        ctx.fillStyle = '#f3c6a4';
        ctx.beginPath();
        ctx.arc(snapX, snapY - camY + shakeY, 16, 0, Math.PI * 2);
        ctx.fill();

        if (t >= 42.2 && t < 43.4) {
          const snapDt = t - 42.2;
          for (let rIdx = 0; rIdx < 2; rIdx++) {
            const delayDt = Math.max(0, snapDt - rIdx * 0.08);
            const ringR = delayDt * 920;
            const alpha = clamp(1 - delayDt * 1.15, 0, 1);
            if (alpha > 0.01) {
              ctx.strokeStyle = `rgba(255, 220, 130, ${alpha.toFixed(2)})`;
              ctx.lineWidth = 6 - rIdx * 2;
              ctx.beginPath();
              ctx.arc(snapX, snapY - camY + shakeY, ringR, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        }

        // Foreground Wooden Table Surface (y = 750)
        const tableTopY = 750 - camY * 1.3 + shakeY;
        ctx.fillStyle = '#381d0e';
        ctx.fillRect(180 - camX * 1.3 + shakeX, tableTopY, 1560, 56);

        // Realistic Bouncing Apple with Squash-and-Stretch & Rolling Deceleration
        drawRedApple(
          ctx,
          applePhys.x - camX * 1.3 + shakeX,
          applePhys.y - camY * 1.3 + shakeY,
          28,
          applePhys.rot,
          applePhys.scaleX,
          applePhys.scaleY,
          0.35
        );
      }

      // ----------------------------------------------------------------------
      // CUT 8 (46.5s - 50.5s): Macro Gauge Lock-On (g = 9.80 m/s² Spring Overshoot)
      // ----------------------------------------------------------------------
      else if (scene.cut === 'cut8_macro_gauge') {
        const zoom = 1.0 + clamp(lt / 4.0, 0, 1) * 0.14;
        ctx.save();
        try {
          ctx.translate(W * 0.5, H * 0.5);
          ctx.scale(zoom, zoom);
          ctx.translate(-W * 0.5, -H * 0.5);

          if (BG && BG.drawMacroTable) {
            BG.drawMacroTable(ctx, ms, camX * 0.25, camY * 0.25);
          }

          // Apple resting steadily on the macro walnut table
          drawRedApple(ctx, W * 0.42 - camX, 665 - camY, 46, 3.2, 1.0, 1.0, 0.4);

          // Spring overshoot from 0.00 -> 9.80 m/s²
          const springFactor = 1 - Math.exp(-lt * 4.5) * Math.cos(lt * 11.0);
          const gReadout = clamp(9.8 * springFactor, 0, 11.5);

          if (window.IntroRig && typeof window.IntroRig.drawTelemetryGauge === 'function') {
            window.IntroRig.drawTelemetryGauge(
              ctx,
              W * 0.64,
              460,
              gReadout,
              'g = 9.80 m/s² • ĐÃ KHÓA'
            );
          } else {
            ctx.fillStyle = 'rgba(12, 20, 34, 0.88)';
            ctx.strokeStyle = '#FF4D2A';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.roundRect(W * 0.54, 380, 480, 150, 22);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#64ffda';
            ctx.font = '900 38px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('g = ' + gReadout.toFixed(2) + ' m/s²', W * 0.54 + 240, 470);
          }
        } finally {
          ctx.restore();
        }
      }

      // ----------------------------------------------------------------------
      // CUT 9 (50.5s - 55.5s): Fourth-Wall Direct Viewer Invitation
      // ----------------------------------------------------------------------
      else if (scene.cut === 'cut9_fourth_wall') {
        if (BG && BG.drawCafeInterior) {
          BG.drawCafeInterior(ctx, ms, camX * 0.25, camY * 0.25);
        }

        // Both characters look directly at the viewer (eyeLookX: 0, eyeLookY: 0, confident)
        const quanKin = getOrganicPose(t, 'quan', rawMouth, 0.0, 0.0, 'confident', 0.0);
        const minhKin = getOrganicPose(t, 'minh', rawMouth * 0.7, 0.0, 0.0, 'confident', 1.5);

        drawCharacterWithKinematics(ctx, 'quan', 620 - camX, 860 - camY, 1.18, quanKin);
        drawCharacterWithKinematics(ctx, 'minh', 1300 - camX, 865 - camY, 1.16, minhKin);

        ctx.fillStyle = '#29150b';
        ctx.fillRect(200 - camX * 1.3, 775 - camY * 1.3, 1520, 48);
        drawRedApple(ctx, W * 0.5 - camX * 1.3, 748 - camY * 1.3, 26, 0.4, 1, 1, 0.35);
      }

      // ----------------------------------------------------------------------
      // CUT 10 (55.5s - 60.0s): Dark-Glass Editorial Title Card
      // ----------------------------------------------------------------------
      else if (scene.cut === 'cut10_title_card') {
        if (BG && BG.drawDuskSkyline) {
          BG.drawDuskSkyline(ctx, ms, camX * 0.2, camY * 0.2);
        } else {
          ctx.fillStyle = '#090c18';
          ctx.fillRect(0, 0, W, H);
        }

        ctx.fillStyle = 'rgba(6, 9, 18, 0.85)';
        ctx.fillRect(0, 0, W, H);

        const spring = 1 - Math.exp(-lt * 5.2) * Math.cos(lt * 8.5);
        const cardW = 1360;
        const cardH = 610;
        const cardX = (W - cardW) * 0.5;
        const cardY = (H - cardH) * 0.5 - 15;

        ctx.save();
        try {
          ctx.translate(W * 0.5, H * 0.5);
          ctx.scale(0.9 + 0.1 * spring, 0.9 + 0.1 * spring);
          ctx.translate(-W * 0.5, -H * 0.5);

          ctx.fillStyle = 'rgba(16, 22, 38, 0.92)';
          ctx.strokeStyle = 'rgba(255, 77, 42, 0.78)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(cardX, cardY, cardW, cardH, 28);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#FF4D2A';
          ctx.font = '800 22px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('VẬT LÍ 10 • BÀI MỞ ĐẦU • NHÓM 1', W * 0.5, cardY + 95);

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 54px system-ui, -apple-system, sans-serif';
          ctx.fillText('SƠ LƯỢC VỀ SỰ PHÁT TRIỂN CỦA VẬT LÍ HỌC', W * 0.5, cardY + 188);

          ctx.fillStyle = '#ffd166';
          ctx.font = 'italic 600 30px system-ui, -apple-system, sans-serif';
          ctx.fillText('“Hành trình từ tư duy triết học đến khám phá vũ trụ”', W * 0.5, cardY + 252);

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(W * 0.5 - 380, cardY + 305);
          ctx.lineTo(W * 0.5 + 380, cardY + 305);
          ctx.stroke();

          ctx.fillStyle = '#64ffda';
          ctx.font = '700 26px system-ui, -apple-system, sans-serif';
          ctx.fillText('Thuyết trình: Minh Quân & Tuấn Minh', W * 0.5, cardY + 380);

          ctx.fillStyle = '#d8e2ef';
          ctx.font = '500 23px system-ui, -apple-system, sans-serif';
          ctx.fillText(
            'Thành viên: Nguyễn Trần Đăng Quang • Phan Nguyễn Minh Quân',
            W * 0.5,
            cardY + 448
          );
          ctx.fillText('Nguyễn Phú Quang • Vũ Nguyễn Tuấn Minh', W * 0.5, cardY + 492);
        } finally {
          ctx.restore();
        }
      }

      // Render Top Telemetry Pill & Bottom Subtitle Box
      drawHUDAndSubtitles(ctx, scene);
    } finally {
      ctx.restore();
    }
  }

  function drawHUDAndSubtitles(ctx, scene) {
    if (!scene) return;
    ctx.save();
    try {
      if (scene.hudTag) {
        ctx.fillStyle = 'rgba(10, 14, 26, 0.80)';
        ctx.strokeStyle = 'rgba(255, 77, 42, 0.78)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(64, 46, 650, 46, 23);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FF4D2A';
        ctx.beginPath();
        ctx.arc(92, 69, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 18px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(scene.hudTag, 112, 75);
      }

      if (scene.subtitle) {
        const boxW = 1420;
        const boxH = 114;
        const boxX = (W - boxW) * 0.5;
        const boxY = H - 190;

        ctx.fillStyle = 'rgba(8, 10, 18, 0.86)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 18);
        ctx.fill();
        ctx.stroke();

        const barColor =
          scene.role === 'quan'
            ? '#38bdf8'
            : scene.role === 'minh'
            ? '#ff9f43'
            : '#FF4D2A';
        ctx.fillStyle = barColor;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, 8, boxH, [18, 0, 0, 18]);
        ctx.fill();

        // Constant-bound loop (<= 20 chunks) to split two lines cleanly
        const words = scene.subtitle.split(' ');
        const mid = Math.ceil(words.length * 0.52);
        const line1 = words.slice(0, mid).join(' ');
        const line2 = words.slice(mid).join(' ');

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 25px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        if (line2) {
          ctx.fillText(line1, W * 0.5, boxY + 46);
          ctx.fillText(line2, W * 0.5, boxY + 84);
        } else {
          ctx.fillText(line1, W * 0.5, boxY + 66);
        }
      }
    } finally {
      ctx.restore();
    }
  }

  // ============================================================================
  // 5. DIRECTOR CONTROLLER, AUDIO GATE & INTERACTIVE SCRUBBER
  // ============================================================================
  let activeSceneIdx = -1;

  const IntroDirector = {
    container: null,
    root: null,
    canvas: null,
    ctx: null,
    isPlaying: false,
    isFinished: false,
    currentTime: 0,
    lastRafTime: 0,
    rafId: null,

    // Sub-cue one-shot flags within specific cuts
    zeroGFired: false,
    popFired: false,
    snapFired: false,
    bounceFired: false,

    playBtn: null,
    miniToggle: null,
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

      // Synchronously draw Frame 0 immediately upon mount (Anti-Black-Screen Safeguard)
      renderFrame(this.ctx, 0);
      this._updateScrubberUI();
      return this;
    },

    _buildDOM: function () {
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

      // Hardcoded 1920x1080 Canvas
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      canvas.style.cssText =
        'width:100%;height:100%;object-fit:contain;display:block;background:#0b0e1a;';
      root.appendChild(canvas);
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      // Centered Play Button (`▶ PHÁT INTRO (01:00)`)
      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.textContent = '▶ PHÁT INTRO (01:00)';
      playBtn.style.cssText =
        'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);padding:20px 42px;font-size:24px;font-weight:800;color:#ffffff;background:linear-gradient(135deg,#FF4D2A,#ff7b39);border:2px solid rgba(255,255,255,0.35);border-radius:999px;cursor:pointer;box-shadow:0 18px 48px rgba(255,77,42,0.45);letter-spacing:0.5px;z-index:20;';
      root.appendChild(playBtn);
      this.playBtn = playBtn;

      // Bottom Control Bar
      const bottomBar = document.createElement('div');
      bottomBar.style.cssText =
        'position:absolute;left:0;right:0;bottom:0;height:68px;padding:0 32px;background:linear-gradient(to top,rgba(5,7,14,0.95),rgba(5,7,14,0));display:flex;align-items:center;gap:20px;z-index:20;';
      root.appendChild(bottomBar);

      const miniToggle = document.createElement('button');
      miniToggle.type = 'button';
      miniToggle.textContent = '▶';
      miniToggle.style.cssText =
        'width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,0.25);background:rgba(18,22,36,0.85);color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
      bottomBar.appendChild(miniToggle);
      this.miniToggle = miniToggle;

      const scrubberWrap = document.createElement('div');
      scrubberWrap.title = 'Nhấp để tua tới bất kì cảnh nào (00:00 - 01:00)';
      scrubberWrap.style.cssText =
        'flex:1;height:14px;background:rgba(255,255,255,0.18);border-radius:999px;position:relative;cursor:pointer;overflow:hidden;';
      bottomBar.appendChild(scrubberWrap);
      this.scrubberWrap = scrubberWrap;

      const scrubberFill = document.createElement('div');
      scrubberFill.style.cssText =
        'height:100%;width:0%;background:#FF4D2A;border-radius:999px;box-shadow:0 0 12px #FF4D2A;pointer-events:none;';
      scrubberWrap.appendChild(scrubberFill);
      this.scrubberFill = scrubberFill;

      const timecodeLabel = document.createElement('div');
      timecodeLabel.textContent = '00:00 / 01:00';
      timecodeLabel.style.cssText =
        'min-width:125px;font-family:monospace;font-size:16px;font-weight:700;color:#f1f5f9;text-align:center;';
      bottomBar.appendChild(timecodeLabel);
      this.timecodeLabel = timecodeLabel;

      const skipBtn = document.createElement('button');
      skipBtn.type = 'button';
      skipBtn.textContent = 'Vào Slide thuyết trình →';
      skipBtn.style.cssText =
        'padding:10px 22px;font-size:15px;font-weight:700;color:#ffffff;background:rgba(255,77,42,0.88);border:1px solid rgba(255,255,255,0.3);border-radius:999px;cursor:pointer;white-space:nowrap;';
      bottomBar.appendChild(skipBtn);
      this.skipBtn = skipBtn;

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
        activeSceneIdx = -1;
        this._resetSubCueFlags();
      }

      this.isPlaying = true;
      this.lastRafTime = performance.now();

      if (this.playBtn) this.playBtn.style.display = 'none';
      if (this.miniToggle) this.miniToggle.textContent = '❚❚';

      if (window.IntroAudio) {
        if (typeof window.IntroAudio.init === 'function') window.IntroAudio.init();
        if (!window.IntroAudio.isPlayingMusic && typeof window.IntroAudio.startMusic === 'function') {
          window.IntroAudio.startMusic();
        }
      }

      this._checkSceneAudioTriggers(this.currentTime);

      if (!this.rafId) {
        const self = this;
        this.rafId = requestAnimationFrame(function (now) {
          self._loop(now);
        });
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
        this.playBtn.textContent = '▶ TIẾP TỤC INTRO (01:00)';
        this.playBtn.style.display = 'block';
      }
    },

    seek: function (targetSec) {
      this.currentTime = clamp(targetSec, 0, TOTAL_DURATION);
      activeSceneIdx = -1;
      this._resetSubCueFlags();

      renderFrame(this.ctx, this.currentTime);
      this._updateScrubberUI();

      if (this.isPlaying) {
        this._checkSceneAudioTriggers(this.currentTime);
      }
    },

    _resetSubCueFlags: function () {
      this.zeroGFired = false;
      this.popFired = false;
      this.snapFired = false;
      this.bounceFired = false;
    },

    /**
     * Mandatory Anti-Freeze Audio Gate:
     * Triggers `IntroAudio.speak` / `IntroAudio.playSFX` ONLY inside `if (idx !== activeSceneIdx)`,
     * plus exact one-shot physical Foley moments (Zero-G liftoff, Droplet Poke Pop, Finger Snap, Apple Bounce).
     */
    _checkSceneAudioTriggers: function (t) {
      const idx = getSceneIndexAt(t);
      if (idx !== activeSceneIdx) {
        activeSceneIdx = idx;
        this._resetSubCueFlags();

        const scene = SCENES[idx];
        if (window.IntroAudio && scene) {
          if (scene.sfx && typeof window.IntroAudio.playSFX === 'function') {
            window.IntroAudio.playSFX(scene.sfx);
          }
          if (scene.clipId && scene.subtitle && typeof window.IntroAudio.speak === 'function') {
            window.IntroAudio.speak(scene.subtitle, scene.clipId, scene.role || 'narrator');
          }
        }
      }

      // Sub-cue physical Foley triggers (each guarded by a boolean flag so it fires at most ONCE)
      if (!window.IntroAudio || typeof window.IntroAudio.playSFX !== 'function') return;

      // Cut 2: Zero-G liftoff shimmer at t >= 6.4s
      if (idx === 1 && t >= 6.4 && !this.zeroGFired) {
        this.zeroGFired = true;
        window.IntroAudio.playSFX('zeroG');
      }
      // Cut 4: Droplet poke surface-tension pop at t >= 20.2s (lt = 2.2s)
      if (idx === 3 && t >= 20.2 && !this.popFired) {
        this.popFired = true;
        window.IntroAudio.playSFX('pop');
      }
      // Cut 7: Minh Quân finger snap at t >= 42.2s
      if (idx === 6 && t >= 42.2 && !this.snapFired) {
        this.snapFired = true;
        window.IntroAudio.playSFX('snap');
      }
      // Cut 7: Apple hits table and bounces at t >= 43.75s (43.2s + 0.559s free-fall)
      if (idx === 6 && t >= 43.75 && !this.bounceFired) {
        this.bounceFired = true;
        window.IntroAudio.playSFX('bounce');
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
        renderFrame(this.ctx, TOTAL_DURATION);
        this.finishIntro();
        return;
      }

      this._checkSceneAudioTriggers(this.currentTime);
      renderFrame(this.ctx, this.currentTime);
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

      if (window.IntroAudio && typeof window.IntroAudio.stopMusic === 'function') {
        window.IntroAudio.stopMusic();
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      IntroDirector.init();
    });
  } else {
    IntroDirector.init();
  }
})();
