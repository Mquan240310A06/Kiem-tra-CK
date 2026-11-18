/**
 * intro-director.js
 * 22-Second, 60 FPS Cinematic Animated Intro Orchestrator
 * Combines window.IntroAudio, window.IntroBG, and window.IntroRig,
 * then hands off cleanly to window.App (Grade 10 Physics Presentation).
 *
 * Exposes: window.IntroDirector
 */
(function (global) {
  'use strict';

  const LOGICAL_W = 1920;
  const LOGICAL_H = 1080;
  const TOTAL_DURATION = 22.0;

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeOutCubic(x) {
    const t = clamp(x, 0, 1);
    return 1 - Math.pow(1 - t, 3);
  }

  function easeOutBack(x) {
    const t = clamp(x, 0, 1);
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  // =========================================================================
  // 1. Timeline Cues (Audio SFX & Vietnamese Narration)
  // =========================================================================
  const DIALOGUE_CUES = [
    {
      id: 'line1',
      start: 0.18,
      end: 4.05,
      rate: 1.02,
      speaker: '',
      text: 'Hãy tưởng tượng... điều gì sẽ xảy ra nếu mọi định luật Vật lí đột ngột biến mất?',
    },
    {
      id: 'line2',
      start: 4.35,
      end: 8.62,
      rate: 1.0,
      speaker: '',
      text: 'Không trọng lực. Không quán tính. Mọi chuyển động trong vũ trụ đều đóng băng.',
    },
    {
      id: 'line3',
      start: 8.95,
      end: 12.35,
      rate: 1.08,
      speaker: 'Tuấn Minh',
      voiceText: 'Ủa Quân... sao ly cà phê với quả táo bay lơ lửng hết vậy?!',
      text: 'Tuấn Minh: Ủa Quân... sao ly cà phê với quả táo bay lơ lửng hết vậy?!',
    },
    {
      id: 'line4',
      start: 12.68,
      end: 17.32,
      rate: 1.02,
      speaker: 'Minh Quân',
      voiceText: 'Vì Vật lí chính là quy luật vận hành cả thế giới này.',
      text: 'Minh Quân: Vì Vật lí chính là quy luật vận hành cả thế giới này.',
    },
  ];

  const SFX_CUES = [
    { id: 'cut_scene2_whoosh', time: 4.2, sfx: 'whoosh' },
    { id: 'cut_scene2_zerog', time: 4.24, sfx: 'zeroG' },
    { id: 'mug_bubble_1', time: 4.95, sfx: 'bubble' },
    { id: 'mug_bubble_2', time: 5.75, sfx: 'bubble' },
    { id: 'mug_bubble_3', time: 6.65, sfx: 'bubble' },
    { id: 'mug_bubble_4', time: 7.55, sfx: 'bubble' },
    { id: 'cut_scene3_whoosh', time: 8.8, sfx: 'whoosh' },
    { id: 'cut_scene4_whoosh', time: 12.5, sfx: 'whoosh' },
    { id: 'quan_finger_snap', time: 14.3, sfx: 'snap' },
    { id: 'apple_table_thud', time: 14.78, sfx: 'thud' },
    { id: 'apple_bounce_tick', time: 15.04, sfx: 'tick' },
    { id: 'cut_scene5_whoosh', time: 17.5, sfx: 'whoosh' },
    { id: 'scene5_tick_1', time: 17.65, sfx: 'tick' },
    { id: 'scene5_tick_2', time: 18.05, sfx: 'tick' },
    { id: 'scene5_tick_3', time: 18.45, sfx: 'tick' },
    { id: 'cut_scene6_whoosh', time: 19.5, sfx: 'whoosh' },
    { id: 'scene6_title_tick', time: 19.72, sfx: 'tick' },
  ];

  // =========================================================================
  // 2. Director State & Critically-Damped Camera
  // =========================================================================
  let wrapEl = null;
  let canvas = null;
  let ctx = null;
  let progressBarEl = null;
  let playOverlayBtn = null;

  let isPlaying = false;
  let isFinished = false;
  let rafId = null;
  let startPerfTime = 0;
  let lastFramePerf = 0;
  let currentT = 0;
  let currentSceneIndex = -1;

  const triggeredDialogues = new Set();
  const triggeredSFX = new Set();

  const cam = {
    x: LOGICAL_W * 0.5,
    y: LOGICAL_H * 0.5,
    zoom: 1.0,
    shake: 0,
    targetX: LOGICAL_W * 0.5,
    targetY: LOGICAL_H * 0.5,
    targetZoom: 1.0,
    dampingSpeed: 3.5,
  };

  function setCameraInstant(x, y, zoom) {
    cam.x = cam.targetX = x;
    cam.y = cam.targetY = y;
    cam.zoom = cam.targetZoom = zoom;
  }

  function setCameraTarget(x, y, zoom, speed) {
    cam.targetX = x;
    cam.targetY = y;
    cam.targetZoom = zoom;
    cam.dampingSpeed = speed != null ? speed : 3.5;
  }

  function updateCamera(t, dt) {
    const alpha = 1 - Math.exp(-cam.dampingSpeed * dt);
    cam.x += (cam.targetX - cam.x) * alpha;
    cam.y += (cam.targetY - cam.y) * alpha;
    cam.zoom += (cam.targetZoom - cam.zoom) * alpha;

    // Decay camera impact shake
    if (cam.shake > 0.01) {
      cam.shake *= Math.exp(-14 * dt);
    } else {
      cam.shake = 0;
    }
  }

  function applyCameraTransform(ctx, t) {
    // Subtle organic handheld breathing drift so no frame ever feels static
    const driftX = Math.sin(t * 1.1) * 3.0;
    const driftY = Math.cos(t * 0.85) * 2.2;
    const shakeX = cam.shake > 0 ? (Math.random() * 2 - 1) * cam.shake : 0;
    const shakeY = cam.shake > 0 ? (Math.random() * 2 - 1) * cam.shake : 0;

    ctx.translate(LOGICAL_W * 0.5 + driftX + shakeX, LOGICAL_H * 0.5 + driftY + shakeY);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);
  }

  // Natural periodic eye blink helper (0 = open, 1 = closed)
  function computeBlink(t, seedOffset) {
    const cycle = (t + seedOffset) % 3.8;
    if (cycle > 3.58) {
      const p = (cycle - 3.58) / 0.22;
      return Math.sin(p * Math.PI);
    }
    return 0;
  }

  // =========================================================================
  // 3. Scene Renderers (0.0s -> 22.0s)
  // =========================================================================

  /**
   * Scene 1 (0.0s – 4.2s): Rooftop Dusk Silhouette & Slow Push-In
   */
  function renderScene1(ctx, t) {
    if (currentSceneIndex !== 1) {
      currentSceneIndex = 1;
      setCameraInstant(960, 565, 1.0);
    }
    setCameraTarget(935, 525, 1.12, 0.75);

    const mouth = global.IntroAudio ? global.IntroAudio.getMouthOpen(t) : 0;

    ctx.save();
    applyCameraTransform(ctx, t);

    if (global.IntroBG) {
      global.IntroBG.drawRooftopSunset(ctx, t);
    }

    if (global.IntroRig) {
      // Minh Quân (coral jacket, rim-lit) holding glowing red apple up against sunset sky
      const liftWave = Math.sin(t * 1.6) * 6;
      global.IntroRig.drawCharacter(ctx, {
        id: 'quan',
        x: 785,
        y: 892,
        facing: 1,
        lightSide: 'right',
        expression: 'curious',
        mouthOpen: mouth * 0.9,
        mouthStyle: 'talk',
        blink: computeBlink(t, 0.4),
        lookX: 0.45,
        lookY: -0.25,
        headTilt: Math.sin(t * 1.5) * 0.035,
        frontArm: {
          dx: 102,
          dy: -24 + liftWave,
          bend: 1,
          angle: -0.35,
        },
      });

      // Soft warm bloom around the apple against the dusk sky
      const appleX = 930;
      const appleY = 588 + liftWave;
      const appleGlow = ctx.createRadialGradient(appleX, appleY, 4, appleX, appleY, 64);
      appleGlow.addColorStop(0, 'rgba(255, 120, 75, 0.48)');
      appleGlow.addColorStop(1, 'rgba(255, 120, 75, 0)');
      ctx.fillStyle = appleGlow;
      ctx.beginPath();
      ctx.arc(appleX, appleY, 64, 0, Math.PI * 2);
      ctx.fill();

      global.IntroRig.drawGlossyApple(ctx, appleX, appleY, 22, Math.sin(t * 1.2) * 0.12);

      // Tuấn Minh (yellow cap, cobalt jacket) standing beside Minh Quân looking at the apple
      global.IntroRig.drawCharacter(ctx, {
        id: 'minh',
        x: 1095,
        y: 892,
        facing: -1,
        lightSide: 'right',
        expression: 'neutral',
        mouthOpen: 0,
        mouthStyle: 'smile',
        blink: computeBlink(t, 1.9),
        lookX: -0.55,
        lookY: -0.18,
        headTilt: -Math.sin(t * 1.3) * 0.03,
        pose: 'idle',
      });
    }

    ctx.restore();
  }

  /**
   * Scene 2 (4.2s – 8.8s): Macro Table Close-Up & Zero-Gravity Anomaly
   */
  function renderScene2(ctx, t) {
    const localT = t - 4.2;
    if (currentSceneIndex !== 2) {
      currentSceneIndex = 2;
      setCameraInstant(960, 560, 1.02);
    }
    setCameraTarget(960, 520, 1.10, 0.85);

    const floatProgress = easeOutCubic(clamp(localT / 4.2, 0, 1));

    ctx.save();
    applyCameraTransform(ctx, t);

    if (global.IntroBG) {
      global.IntroBG.drawMacroTable(ctx, t);
    }

    // Contact shadows on walnut tabletop that fade & shrink as mug and apple levitate upward
    const shadowAlpha = Math.max(0.05, 0.38 * (1 - floatProgress * 0.78));
    ctx.fillStyle = 'rgba(8, 4, 4, ' + shadowAlpha.toFixed(3) + ')';
    ctx.beginPath();
    ctx.ellipse(650, 775, 68 * (1 - floatProgress * 0.35), 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1035, 785, 52 * (1 - floatProgress * 0.45), 12, 0, 0, Math.PI * 2);
    ctx.fill();

    if (global.IntroRig) {
      // Ceramic mug tipping & levitating in zero-gravity while coffee droplets float upward
      const mugX = 650 - floatProgress * 18;
      const mugY = 695 - floatProgress * 155 + Math.sin(t * 2.2) * 6;
      const mugRot = -0.25 - floatProgress * 0.58;
      const spillAmt = clamp(localT / 2.8, 0.12, 1.0);

      if (global.IntroBG) {
        global.IntroBG.drawSteamWisps(ctx, mugX - 18, mugY - 48, t, 4);
      }

      global.IntroRig.drawCeramicMug(ctx, mugX, mugY, mugRot, spillAmt);

      // Minh Quân's macro close-up hand on the left reaching slightly as apple floats away
      const handX = 335 + floatProgress * 22;
      const handY = 720 - floatProgress * 38 + Math.sin(t * 1.8) * 4;
      const handCurl = lerp(0.55, 0.16, easeOutCubic(clamp(localT / 1.8, 0, 1)));
      global.IntroRig.drawCloseUpArmHand(
        ctx,
        handX,
        handY,
        -0.08 - floatProgress * 0.08,
        '#E85A34',
        handCurl
      );

      // Glossy red apple floating upward in slow motion
      const appleX = 1035 + Math.sin(t * 1.5) * 8;
      const appleY = 695 - floatProgress * 245 + Math.cos(t * 1.9) * 6;
      const appleRot = localT * 0.28;

      global.IntroRig.drawGlossyApple(ctx, appleX, appleY, 48, appleRot);

      // Circular radar & telemetry HUD tracking the floating apple
      global.IntroRig.drawTelemetryGauge(
        ctx,
        appleX,
        appleY,
        'GIA TỐC TRỌNG TRƯỜNG',
        'g = 0.00 m/s²',
        0.02,
        '#00E5FF'
      );
    }

    ctx.restore();
  }

  /**
   * Scene 3 (8.8s – 12.5s): Extreme Face Close-Up Reaction (Tuấn Minh)
   */
  function renderScene3(ctx, t) {
    const localT = t - 8.8;
    if (currentSceneIndex !== 3) {
      currentSceneIndex = 3;
      setCameraInstant(960, 540, 1.06);
    }
    setCameraTarget(960, 525, 1.14, 1.2);

    const mouth = global.IntroAudio ? global.IntroAudio.getMouthOpen(t) : 0;

    ctx.save();
    applyCameraTransform(ctx, t);

    // Heavy golden window bokeh backdrop
    if (global.IntroBG) {
      global.IntroBG.drawDuskSkyline(ctx, t, 18);
    }

    // Blurred cafe window frame bars behind Tuấn Minh
    ctx.save();
    ctx.filter = 'blur(12px)';
    ctx.fillStyle = 'rgba(18, 13, 18, 0.72)';
    ctx.fillRect(0, 0, LOGICAL_W, 95);
    ctx.fillRect(460, 0, 38, LOGICAL_H);
    ctx.fillRect(1420, 0, 38, LOGICAL_H);
    ctx.restore();

    // Extreme close-up (scale: 2.6) on Tuấn Minh's shocked face
    if (global.IntroRig) {
      const bobY = Math.sin(t * 9.5) * (mouth * 7) + Math.sin(t * 2.1) * 4;
      const shockPop = easeOutBack(clamp(localT / 0.35, 0, 1));

      global.IntroRig.drawCharacter(ctx, {
        id: 'minh',
        x: 960,
        y: 1385 + bobY,
        scale: 2.6 * (0.94 + 0.06 * shockPop),
        facing: -1,
        lightSide: 'left',
        expression: 'shocked',
        mouthOpen: Math.max(0.28, mouth),
        mouthStyle: mouth > 0.18 ? 'talk' : 'shock',
        blink: computeBlink(t, 0.9) * 0.2, // Wide-eyed in disbelief
        lookX: -0.35 + Math.sin(t * 3.2) * 0.18,
        lookY: -0.22 + Math.cos(t * 2.7) * 0.12,
        headTilt: Math.sin(t * 2.8) * 0.04,
        pose: 'shocked',
      });
    }

    ctx.restore();
  }

  /**
   * Scene 4 (12.5s – 17.5s): Cafe Window Two-Shot & Finger Snap
   */
  function renderScene4(ctx, t) {
    const snapTime = 14.3;
    const hitTableTime = 14.78;

    if (currentSceneIndex !== 4) {
      currentSceneIndex = 4;
      setCameraInstant(800, 565, 1.02);
    }

    if (t < snapTime) {
      setCameraTarget(800, 555, 1.07, 0.9);
    } else {
      setCameraTarget(800, 585, 1.14, 2.2);
    }

    // Trigger micro camera shake when the apple slams onto the table
    if (t >= hitTableTime && t < hitTableTime + 0.04 && cam.shake < 4) {
      cam.shake = 11.5;
    }

    const mouth = global.IntroAudio ? global.IntroAudio.getMouthOpen(t) : 0;

    ctx.save();
    applyCameraTransform(ctx, t);

    if (global.IntroBG) {
      global.IntroBG.drawCafeInterior(ctx, t, 2);
    }

    // Compute Minh Quân's arm gesture (raises hand -> snaps at 14.3s)
    const preSnapRaise = clamp((t - 13.4) / 0.85, 0, 1);
    const isAfterSnap = t >= snapTime;
    const snapHandDX = lerp(84, 72, easeOutCubic(preSnapRaise));
    const snapHandDY = lerp(24, -34, easeOutCubic(preSnapRaise)) + (isAfterSnap ? 12 : 0);

    if (global.IntroRig) {
      // Minh Quân seated on left chair
      global.IntroRig.drawCharacter(ctx, {
        id: 'quan',
        x: 515,
        y: 815,
        seated: true,
        facing: 1,
        lightSide: 'right',
        expression: isAfterSnap ? 'confident' : 'curious',
        mouthOpen: mouth,
        mouthStyle: mouth > 0.05 ? 'talk' : 'smile',
        blink: computeBlink(t, 1.1),
        lookX: 0.42,
        lookY: isAfterSnap ? 0.15 : -0.2,
        headTilt: isAfterSnap ? 0.04 : 0,
        frontArm: {
          dx: snapHandDX,
          dy: snapHandDY,
          bend: 1,
          angle: isAfterSnap ? -0.45 : -0.95,
        },
      });

      // Tuấn Minh seated on right chair watching the apple drop
      global.IntroRig.drawCharacter(ctx, {
        id: 'minh',
        x: 1085,
        y: 815,
        seated: true,
        facing: -1,
        lightSide: 'left',
        expression: isAfterSnap ? 'curious' : 'shocked',
        mouthOpen: 0,
        mouthStyle: isAfterSnap ? 'smile' : 'shock',
        blink: computeBlink(t, 2.4),
        lookX: -0.48,
        lookY: isAfterSnap ? 0.25 : -0.25,
        headTilt: isAfterSnap ? -0.02 : 0.05,
        pose: isAfterSnap ? 'restOnTable' : 'shocked',
      });

      // White ceramic mug on left side of center table
      global.IntroRig.drawCeramicMug(ctx, 720, 742, 0, 0);
      if (global.IntroBG) {
        global.IntroBG.drawSteamWisps(ctx, 720, 682, t, 3);
      }

      // Apple vertical physics:
      // Before 14.3s: hovers at y = 540
      // After 14.3s: accelerates under gravity onto table surface (y = 748) with a crisp bounce
      const hoverY = 540 + Math.sin(t * 2.4) * 7;
      const tableSurfaceY = 748;
      let appleY = hoverY;
      let appleRot = Math.sin(t * 1.5) * 0.18;

      if (t >= snapTime) {
        const fallDur = hitTableTime - snapTime; // 0.48s free-fall
        if (t < hitTableTime) {
          const p = (t - snapTime) / fallDur;
          appleY = lerp(hoverY, tableSurfaceY, p * p); // Quadratic g acceleration
          appleRot = p * 0.45;
        } else if (t < hitTableTime + 0.26) {
          // Damped elastic bounce on the wood tabletop
          const bp = (t - hitTableTime) / 0.26;
          appleY = tableSurfaceY - Math.sin(bp * Math.PI) * 32;
          appleRot = 0.45 - bp * 0.35;
        } else {
          appleY = tableSurfaceY;
          appleRot = 0.08;
        }
      }

      const appleX = 835;
      global.IntroRig.drawGlossyApple(ctx, appleX, appleY, 24, appleRot);

      // Crisp white finger-snap shockwave ring at t = 14.3s
      if (t >= snapTime && t < snapTime + 0.65) {
        const sp = (t - snapTime) / 0.65;
        const snapOriginX = 622;
        const snapOriginY = 528;
        const ringR = 14 + easeOutCubic(sp) * 280;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (1 - sp).toFixed(3) + ')';
        ctx.lineWidth = 4.5 * (1 - sp);
        ctx.beginPath();
        ctx.arc(snapOriginX, snapOriginY, ringR, 0, Math.PI * 2);
        ctx.stroke();

        // Inner warm accent shockwave
        ctx.strokeStyle = 'rgba(255, 130, 80, ' + ((1 - sp) * 0.75).toFixed(3) + ')';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(snapOriginX, snapOriginY, ringR * 0.68, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Live Telemetry Gauge snapping from 0.00 m/s² to 9.80 m/s²
      const gaugeProgress = isAfterSnap
        ? easeOutBack(clamp((t - snapTime) / 0.42, 0, 1))
        : 0.02;
      const gVal = isAfterSnap
        ? (9.8 * clamp((t - snapTime) / 0.32, 0, 1)).toFixed(2)
        : '0.00';

      global.IntroRig.drawTelemetryGauge(
        ctx,
        appleX,
        appleY,
        isAfterSnap ? 'KHÔI PHỤC VẬT LÍ' : 'GIA TỐC TRỌNG TRƯỜNG',
        'g = ' + gVal + ' m/s²',
        gaugeProgress,
        isAfterSnap ? '#FF4D2A' : '#00E5FF'
      );
    }

    ctx.restore();
  }

  /**
   * Scene 5 (17.5s – 19.5s): Macro Gauge Snap Close-Up
   */
  function renderScene5(ctx, t) {
    const localT = t - 17.5;
    if (currentSceneIndex !== 5) {
      currentSceneIndex = 5;
      setCameraInstant(980, 620, 1.08);
    }
    setCameraTarget(1010, 605, 1.18, 1.8);

    ctx.save();
    applyCameraTransform(ctx, t);

    if (global.IntroBG) {
      global.IntroBG.drawMacroTable(ctx, t);
    }

    // Grounded contact shadows on dark walnut tabletop
    ctx.fillStyle = 'rgba(8, 4, 4, 0.48)';
    ctx.beginPath();
    ctx.ellipse(620, 772, 68, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(980, 778, 56, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    if (global.IntroRig) {
      // Upright ceramic mug steaming calmly on left
      global.IntroRig.drawCeramicMug(ctx, 620, 710, 0, 0);
      if (global.IntroBG) {
        global.IntroBG.drawSteamWisps(ctx, 620, 642, t, 4);
      }

      // Glossy red apple resting firmly on the table
      const appleX = 980;
      const appleY = 732;
      global.IntroRig.drawGlossyApple(ctx, appleX, appleY, 50, 0.06);

      // Telemetry gauge locking onto 9.80 m/s²
      const lockProg = easeOutBack(clamp(localT / 0.45, 0, 1));
      global.IntroRig.drawTelemetryGauge(
        ctx,
        appleX,
        appleY,
        'TRỌNG LỰC TIÊU CHUẨN • TRÁI ĐẤT',
        'g = 9.80 m/s² [LOCKED]',
        0.92 * lockProg,
        '#FF4D2A'
      );
    }

    ctx.restore();
  }

  /**
   * Scene 6 (19.5s – 22.0s): Editorial Title Card & Auto-Handoff
   */
  function renderScene6(ctx, t) {
    const localT = t - 19.5;
    if (currentSceneIndex !== 6) {
      currentSceneIndex = 6;
      setCameraInstant(960, 540, 1.0);
    }

    // Blurred atmospheric dusk backdrop
    if (global.IntroBG) {
      global.IntroBG.drawDuskSkyline(ctx, t, 14);
    }

    // Rich dark radial vignette overlay
    const bgGrad = ctx.createRadialGradient(
      LOGICAL_W * 0.5,
      LOGICAL_H * 0.5,
      120,
      LOGICAL_W * 0.5,
      LOGICAL_H * 0.5,
      1050
    );
    bgGrad.addColorStop(0, 'rgba(12, 11, 18, 0.68)');
    bgGrad.addColorStop(1, 'rgba(6, 6, 10, 0.92)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Spring-physics card entrance
    const cardSpring = easeOutBack(clamp(localT / 0.58, 0, 1));
    const subFade = easeOutCubic(clamp((localT - 0.22) / 0.5, 0, 1));
    const teamFade = easeOutCubic(clamp((localT - 0.42) / 0.5, 0, 1));

    ctx.save();
    ctx.translate(LOGICAL_W * 0.5, LOGICAL_H * 0.5);
    ctx.scale(0.86 + 0.14 * cardSpring, 0.86 + 0.14 * cardSpring);

    const cardW = 1340;
    const cardH = 520;

    // Dark-glass editorial card
    ctx.fillStyle = 'rgba(16, 15, 24, 0.84)';
    ctx.strokeStyle = 'rgba(255, 130, 80, 0.42)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-cardW * 0.5, -cardH * 0.5, cardW, cardH, 28);
    ctx.fill();
    ctx.stroke();

    // Top accent bar (#FF4D2A -> #FACC15)
    const barGrad = ctx.createLinearGradient(-220, 0, 220, 0);
    barGrad.addColorStop(0, '#FF4D2A');
    barGrad.addColorStop(1, '#FACC15');
    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(-140, -cardH * 0.5 + 48, 280, 6, 3);
    ctx.fill();

    // Eyebrow badge
    ctx.fillStyle = '#FF8A5B';
    ctx.font = '700 18px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VẬT LÍ 10 • BÀI MỞ ĐẦU', 0, -162);

    // Main title with spring-physics typography
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 52px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillText('SƠ LƯỢC VỀ SỰ PHÁT TRIỂN CỦA VẬT LÍ HỌC', 0, -76);

    // Subtitle
    ctx.globalAlpha = subFade;
    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'italic 500 28px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillText(
      '“Hành trình từ tư duy triết học đến khám phá vũ trụ”',
      0,
      -4 + (1 - subFade) * 18
    );

    // Divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-360, 56);
    ctx.lineTo(360, 56);
    ctx.stroke();

    // NHÓM 1 pill & members
    ctx.globalAlpha = teamFade;
    const teamY = 122 + (1 - teamFade) * 16;

    ctx.fillStyle = '#FF4D2A';
    ctx.beginPath();
    ctx.roundRect(-90, teamY - 22, 180, 42, 21);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 20px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillText('NHÓM 1', 0, teamY - 1);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '600 25px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillText(
      'Minh Quân  •  Tuấn Minh  •  Đăng Quang  •  Phú Quang',
      0,
      teamY + 64
    );

    ctx.restore();
  }

  // =========================================================================
  // 4. Cinematic Subtitles & Letterbox Overlay
  // =========================================================================
  function renderSubtitleOverlay(ctx, t) {
    let activeCue = null;
    for (let i = 0; i < DIALOGUE_CUES.length; i++) {
      const cue = DIALOGUE_CUES[i];
      if (t >= cue.start && t <= cue.end) {
        activeCue = cue;
        break;
      }
    }
    if (!activeCue) return;

    const fadeIn = clamp((t - activeCue.start) / 0.22, 0, 1);
    const fadeOut = clamp((activeCue.end - t) / 0.22, 0, 1);
    const alpha = Math.min(fadeIn, fadeOut);
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '600 28px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(activeCue.text).width;
    const pillW = Math.min(1680, textWidth + 76);
    const pillH = 66;
    const pillX = (LOGICAL_W - pillW) * 0.5;
    const pillY = LOGICAL_H - 122 + (1 - alpha) * 10;

    // Dark translucent subtitle pill (rgba(10, 10, 14, 0.78))
    ctx.fillStyle = 'rgba(10, 10, 14, 0.78)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 18);
    ctx.fill();
    ctx.stroke();

    // Crisp white subtitle text
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(activeCue.text, LOGICAL_W * 0.5, pillY + pillH * 0.5 + 1);
    ctx.restore();
  }

  function processAudioCues(t) {
    if (!global.IntroAudio) return;

    // Trigger SFX cues once
    for (let i = 0; i < SFX_CUES.length; i++) {
      const s = SFX_CUES[i];
      if (t >= s.time && !triggeredSFX.has(s.id)) {
        triggeredSFX.add(s.id);
        global.IntroAudio.playSFX(s.sfx);
      }
    }

    // Trigger Vietnamese dialogue cues once at start of each line
    for (let i = 0; i < DIALOGUE_CUES.length; i++) {
      const d = DIALOGUE_CUES[i];
      if (t >= d.start && t < d.end && !triggeredDialogues.has(d.id)) {
        triggeredDialogues.add(d.id);
        global.IntroAudio.speak(d.voiceText || d.text, d.rate);
      }
    }
  }

  // =========================================================================
  // 5. Master Frame Render & Animation Loop
  // =========================================================================
  function renderFrameAt(t, dt) {
    if (!ctx) return;

    updateCamera(t, dt);
    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

    if (t < 4.2) {
      renderScene1(ctx, t);
    } else if (t < 8.8) {
      renderScene2(ctx, t);
    } else if (t < 12.5) {
      renderScene3(ctx, t);
    } else if (t < 17.5) {
      renderScene4(ctx, t);
    } else if (t < 19.5) {
      renderScene5(ctx, t);
    } else {
      renderScene6(ctx, t);
    }

    renderSubtitleOverlay(ctx, t);

    if (progressBarEl) {
      const pct = clamp((t / TOTAL_DURATION) * 100, 0, 100);
      progressBarEl.style.width = pct.toFixed(2) + '%';
    }
  }

  function tickLoop(nowPerf) {
    if (!isPlaying || isFinished) return;

    const dt = clamp((nowPerf - lastFramePerf) * 0.001, 0.001, 0.08);
    lastFramePerf = nowPerf;
    currentT = (nowPerf - startPerfTime) * 0.001;

    processAudioCues(currentT);
    renderFrameAt(currentT, dt);

    if (currentT >= TOTAL_DURATION) {
      finishIntro();
      return;
    }

    rafId = global.requestAnimationFrame(tickLoop);
  }

  // =========================================================================
  // 6. Playback Control & Seamless Handoff to window.App
  // =========================================================================
  function startIntroPlayback() {
    if (isPlaying || isFinished) return;
    isPlaying = true;

    if (playOverlayBtn) {
      playOverlayBtn.style.opacity = '0';
      playOverlayBtn.style.pointerEvents = 'none';
      global.setTimeout(() => {
        if (playOverlayBtn && playOverlayBtn.parentNode) {
          playOverlayBtn.parentNode.removeChild(playOverlayBtn);
        }
      }, 320);
    }

    if (global.IntroAudio) {
      global.IntroAudio.unlock();
      global.IntroAudio.startMusic();
    }

    triggeredDialogues.clear();
    triggeredSFX.clear();
    currentSceneIndex = -1;

    startPerfTime = performance.now();
    lastFramePerf = startPerfTime;
    rafId = global.requestAnimationFrame(tickLoop);
  }

  function activateSlideZero() {
    if (!global.App) return;
    try {
      if (typeof global.App.goToSlide === 'function') {
        global.App.goToSlide(0);
      } else if (typeof global.App.showSlide === 'function') {
        global.App.showSlide(0);
      } else if (typeof global.App.start === 'function') {
        global.App.start();
      }
    } catch (_) {}
  }

  function removeIntroDOM() {
    if (wrapEl && wrapEl.parentNode) {
      wrapEl.style.transition = 'opacity 0.42s ease';
      wrapEl.style.opacity = '0';
      global.setTimeout(() => {
        if (wrapEl && wrapEl.parentNode) {
          wrapEl.parentNode.removeChild(wrapEl);
        }
      }, 440);
    }
  }

  function finishIntro() {
    if (isFinished) return;
    isFinished = true;
    isPlaying = false;

    if (rafId !== null) {
      global.cancelAnimationFrame(rafId);
      rafId = null;
    }

    if (global.IntroAudio) {
      global.IntroAudio.stopSpeech();
      global.IntroAudio.stopMusic();
    }

    // Trigger diagonal transition into Slide 0 if window.App.transitions is available
    if (
      global.App &&
      global.App.transitions &&
      typeof global.App.transitions.play === 'function'
    ) {
      try {
        global.App.transitions.play('diagonal', () => {
          activateSlideZero();
          if (wrapEl && wrapEl.parentNode) {
            wrapEl.parentNode.removeChild(wrapEl);
          }
        });
        return;
      } catch (_) {}
    }

    activateSlideZero();
    removeIntroDOM();
  }

  // =========================================================================
  // 7. DOM Mount & Immediate Frame-0 Anti-Black-Screen Render
  // =========================================================================
  function mountIntro() {
    if (document.getElementById('intro-movie-wrap')) return;

    wrapEl = document.createElement('div');
    wrapEl.id = 'intro-movie-wrap';
    wrapEl.style.cssText = [
      'position: fixed',
      'inset: 0',
      'z-index: 99999',
      'background: #080808',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'overflow: hidden',
      'user-select: none',
      'font-family: "Inter", "Segoe UI", system-ui, sans-serif',
    ].join(';');

    canvas = document.createElement('canvas');
    canvas.width = LOGICAL_W;
    canvas.height = LOGICAL_H;
    canvas.style.cssText = [
      'width: 100%',
      'height: 100%',
      'max-width: 100vw',
      'max-height: 100vh',
      'object-fit: contain',
      'display: block',
    ].join(';');
    ctx = canvas.getContext('2d');
    wrapEl.appendChild(canvas);

    // Centered Play Button Overlay
    playOverlayBtn = document.createElement('button');
    playOverlayBtn.type = 'button';
    playOverlayBtn.textContent = '▶ PHÁT INTRO HOẠT HÌNH';
    playOverlayBtn.style.cssText = [
      'position: absolute',
      'left: 50%',
      'top: 50%',
      'transform: translate(-50%, -50%)',
      'padding: 20px 42px',
      'font-size: 22px',
      'font-weight: 800',
      'letter-spacing: 0.04em',
      'color: #FFFFFF',
      'background: linear-gradient(135deg, #FF4D2A 0%, #E03515 100%)',
      'border: 2px solid rgba(255, 255, 255, 0.28)',
      'border-radius: 999px',
      'box-shadow: 0 18px 48px rgba(255, 77, 42, 0.45), 0 0 0 8px rgba(255, 77, 42, 0.16)',
      'cursor: pointer',
      'transition: transform 0.2s ease, opacity 0.3s ease, box-shadow 0.2s ease',
      'z-index: 2',
    ].join(';');

    playOverlayBtn.addEventListener('mouseenter', () => {
      playOverlayBtn.style.transform = 'translate(-50%, -50%) scale(1.05)';
    });
    playOverlayBtn.addEventListener('mouseleave', () => {
      playOverlayBtn.style.transform = 'translate(-50%, -50%) scale(1.0)';
    });
    playOverlayBtn.addEventListener('click', startIntroPlayback);
    wrapEl.appendChild(playOverlayBtn);

    // Bottom-Right Skip Button
    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.textContent = 'Vào Slide thuyết trình →';
    skipBtn.style.cssText = [
      'position: absolute',
      'right: 32px',
      'bottom: 28px',
      'padding: 11px 22px',
      'font-size: 15px',
      'font-weight: 600',
      'color: rgba(255, 255, 255, 0.9)',
      'background: rgba(16, 16, 24, 0.76)',
      'border: 1px solid rgba(255, 255, 255, 0.22)',
      'border-radius: 999px',
      'backdrop-filter: blur(8px)',
      'cursor: pointer',
      'transition: background 0.2s ease, color 0.2s ease',
      'z-index: 3',
    ].join(';');

    skipBtn.addEventListener('mouseenter', () => {
      skipBtn.style.background = 'rgba(255, 77, 42, 0.88)';
      skipBtn.style.color = '#FFFFFF';
    });
    skipBtn.addEventListener('mouseleave', () => {
      skipBtn.style.background = 'rgba(16, 16, 24, 0.76)';
      skipBtn.style.color = 'rgba(255, 255, 255, 0.9)';
    });
    skipBtn.addEventListener('click', finishIntro);
    wrapEl.appendChild(skipBtn);

    // Bottom Progress Bar Track & Fill (#FF4D2A)
    const progressTrack = document.createElement('div');
    progressTrack.style.cssText = [
      'position: absolute',
      'left: 0',
      'right: 0',
      'bottom: 0',
      'height: 5px',
      'background: rgba(255, 255, 255, 0.14)',
      'z-index: 3',
    ].join(';');

    progressBarEl = document.createElement('div');
    progressBarEl.style.cssText = [
      'width: 0%',
      'height: 100%',
      'background: #FF4D2A',
      'box-shadow: 0 0 12px rgba(255, 77, 42, 0.8)',
      'transition: width 0.05s linear',
    ].join(';');

    progressTrack.appendChild(progressBarEl);
    wrapEl.appendChild(progressTrack);

    document.body.appendChild(wrapEl);

    // Synchronously draw Frame 0 immediately so the dusk rooftop scene is visible behind Play button
    renderFrameAt(0, 1 / 60);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountIntro);
  } else {
    mountIntro();
  }

  global.IntroDirector = {
    start: startIntroPlayback,
    skip: finishIntro,
    finishIntro,
    renderFrameAt,
  };
})(window);
