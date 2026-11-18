/**
 * characters-rig.js
 * Studio-grade 2D vector character rig, macro hand/props, and telemetry HUD
 * for Grade 10 Physics Animated Intro (1920x1080).
 *
 * Exposes: window.IntroRig
 */
(function (global) {
  'use strict';

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function solveTwoBoneIK(sx, sy, tx, ty, len1, len2, bendDir) {
    const dx = tx - sx;
    const dy = ty - sy;
    const rawDist = Math.hypot(dx, dy);
    const maxReach = Math.max(0.001, len1 + len2 - 1);
    const minReach = Math.abs(len1 - len2) + 1;
    const dist = clamp(rawDist, minReach, maxReach);

    const baseAng = Math.atan2(dy, dx);
    const cosA = clamp(
      (len1 * len1 + dist * dist - len2 * len2) / (2 * len1 * dist),
      -1,
      1
    );
    const angOffset = Math.acos(cosA) * (bendDir >= 0 ? 1 : -1);
    const elbowAng = baseAng + angOffset;

    const ex = sx + Math.cos(elbowAng) * len1;
    const ey = sy + Math.sin(elbowAng) * len1;

    const scale = rawDist > maxReach && rawDist > 0 ? maxReach / rawDist : 1;
    const wx = sx + dx * scale;
    const wy = sy + dy * scale;

    return { ex, ey, wx, wy };
  }

  // =========================================================================
  // 1. Hand & Expressive Head Helpers
  // =========================================================================
  function drawArticulatedHand(ctx, wx, wy, handAngle, scale, rimColor) {
    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(handAngle);
    ctx.scale(scale, scale);

    // Rounded palm silhouette (#0B0C10)
    ctx.fillStyle = '#0B0C10';
    ctx.beginPath();
    ctx.ellipse(6, 0, 11, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thumb contour
    ctx.beginPath();
    ctx.roundRect(1, -12, 6, 10, 3);
    ctx.fill();

    // 4 subtle rounded finger contours
    const fingerSpecs = [
      { x: 11, y: -6.2, w: 10.5, h: 3.6, a: -0.14 },
      { x: 12.5, y: -2.2, w: 12.0, h: 3.7, a: -0.04 },
      { x: 12.0, y: 1.9, w: 11.2, h: 3.6, a: 0.06 },
      { x: 10.0, y: 5.7, w: 9.2, h: 3.3, a: 0.16 },
    ];
    for (let i = 0; i < fingerSpecs.length; i++) {
      const f = fingerSpecs[i];
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.a);
      ctx.beginPath();
      ctx.roundRect(-2, -f.h * 0.5, f.w, f.h, f.h * 0.5);
      ctx.fill();
      ctx.restore();
    }

    // Subtle warm rim edge on top of hand
    ctx.strokeStyle = rimColor || 'rgba(242, 139, 80, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(6, 0, 10, -Math.PI * 0.72, -Math.PI * 0.12);
    ctx.stroke();

    ctx.restore();
  }

  function drawBaseballCap(ctx, headR, facing, rimSide) {
    ctx.save();
    ctx.scale(facing, 1);

    // Crown shadow back half
    ctx.fillStyle = '#D9A70E';
    ctx.beginPath();
    ctx.arc(0, -10, headR + 2.5, Math.PI * 1.02, Math.PI * 1.98);
    ctx.closePath();
    ctx.fill();

    // Bright golden-yellow crown (#FACC15)
    const crownGrad = ctx.createLinearGradient(-headR, -headR - 14, headR, -8);
    crownGrad.addColorStop(0.0, '#FDE047');
    crownGrad.addColorStop(0.55, '#FACC15');
    crownGrad.addColorStop(1.0, '#EAB308');
    ctx.fillStyle = crownGrad;
    ctx.beginPath();
    ctx.arc(0, -11, headR + 2.5, Math.PI * 1.04, Math.PI * 1.97);
    ctx.quadraticCurveTo(0, -24, -headR - 2, -13);
    ctx.closePath();
    ctx.fill();

    // Subtle panel seam line
    ctx.strokeStyle = 'rgba(161, 98, 7, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, -headR - 13);
    ctx.quadraticCurveTo(22, -headR + 8, 18, -19);
    ctx.stroke();

    // Dark button on top of cap
    ctx.fillStyle = '#18181B';
    ctx.beginPath();
    ctx.ellipse(0, -headR - 13, 6.5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shaded cap brim extending forward
    ctx.fillStyle = '#CA8A04';
    ctx.beginPath();
    ctx.moveTo(12, -20);
    ctx.quadraticCurveTo(54, -22, headR + 30, -10);
    ctx.quadraticCurveTo(headR + 24, -2, 10, -12);
    ctx.closePath();
    ctx.fill();

    // Top face of brim
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.moveTo(8, -22);
    ctx.quadraticCurveTo(50, -25, headR + 29, -11);
    ctx.quadraticCurveTo(46, -15, 8, -15);
    ctx.closePath();
    ctx.fill();

    // Rim highlight on cap
    if (rimSide === facing || rimSide === 1) {
      ctx.strokeStyle = 'rgba(255, 248, 195, 0.72)';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, -11, headR + 1.5, -Math.PI * 0.62, -Math.PI * 0.14);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawCharacterHead(ctx, cfg, headX, headY) {
    const facing = cfg.facing >= 0 ? 1 : -1;
    const isMinh = cfg.isMinh;
    const headR = 58;
    const lightSide = cfg.lightSide === 'left' ? -1 : cfg.lightSide === 'right' ? 1 : facing;

    const lookX = clamp(cfg.lookX != null ? cfg.lookX : 0.25 * facing, -1, 1);
    const lookY = clamp(cfg.lookY != null ? cfg.lookY : 0, -1, 1);
    const blink = clamp(cfg.blink != null ? cfg.blink : 0, 0, 1);
    const mouthOpen = clamp(cfg.mouthOpen != null ? cfg.mouthOpen : 0, 0, 1);
    const expr = cfg.expression || 'neutral';
    const mouthStyle = cfg.mouthStyle || (expr === 'shocked' ? 'shock' : mouthOpen > 0.04 ? 'talk' : 'smile');

    ctx.save();
    ctx.translate(headX, headY);
    if (cfg.headTilt) {
      ctx.rotate(cfg.headTilt);
    }

    // Matte-black head sphere (#0B0C10)
    ctx.fillStyle = '#0B0C10';
    ctx.beginPath();
    ctx.arc(0, 0, headR, 0, Math.PI * 2);
    ctx.fill();

    // Subtle facial plane gradient for rich studio volume
    const headGrad = ctx.createRadialGradient(
      lightSide * 20,
      -18,
      6,
      0,
      0,
      headR
    );
    headGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
    headGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, 0, headR, 0, Math.PI * 2);
    ctx.fill();

    // Crisp warm rim-light arc (#F28B50, 3.5px) along side facing light source
    ctx.strokeStyle = '#F28B50';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (lightSide >= 0) {
      ctx.arc(0, 0, headR - 1.5, -Math.PI * 0.42, Math.PI * 0.36);
    } else {
      ctx.arc(0, 0, headR - 1.5, Math.PI * 0.64, Math.PI * 1.42);
    }
    ctx.stroke();

    // Facial feature anchor shifted gently toward facing direction (2.5D turn)
    const faceShiftX = facing * 10;
    const eyeY = -4;
    const eyeSep = 19;
    const eyeLX = faceShiftX - eyeSep;
    const eyeRX = faceShiftX + eyeSep;

    // Large white oval eyes (#FFFFFF) with smooth blink scale
    const eyeW = 10.5;
    const baseEyeH = expr === 'shocked' ? 16.5 : 14.2;
    const eyeH = Math.max(1.8, baseEyeH * (1 - blink * 0.92));

    const drawEye = (ex, scaleFactor) => {
      const w = eyeW * scaleFactor;
      const h = eyeH * scaleFactor;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, w, h, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dark tracking pupils when eyes are open enough
      if (blink < 0.78) {
        const px = ex + lookX * (w * 0.34);
        const py = eyeY + lookY * (h * 0.28);
        const pupilR = (expr === 'shocked' ? 3.2 : 4.2) * scaleFactor;
        ctx.fillStyle = '#0B0C10';
        ctx.beginPath();
        ctx.arc(px, py, pupilR, 0, Math.PI * 2);
        ctx.fill();

        // Tiny crisp eye catchlight
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(px + 1.3, py - 1.5, 1.3 * scaleFactor, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Slight perspective size difference between near and far eye
    drawEye(eyeLX, facing >= 0 ? 0.92 : 1.0);
    drawEye(eyeRX, facing >= 0 ? 1.0 : 0.92);

    // Expressive white eyebrows
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';

    const browBaseY = eyeY - 20;
    const drawBrow = (bx, isLeft) => {
      let y1 = browBaseY;
      let y2 = browBaseY;
      let ctrlY = browBaseY - 3;

      if (expr === 'curious') {
        if ((facing >= 0 && !isLeft) || (facing < 0 && isLeft)) {
          y1 -= 5;
          y2 -= 7;
          ctrlY -= 8;
        } else {
          y1 += 2;
          y2 += 1;
        }
      } else if (expr === 'shocked') {
        y1 -= 7;
        y2 -= 7;
        ctrlY -= 12;
      } else if (expr === 'confident') {
        const innerDown = isLeft ? 4 : -2;
        const outerUp = isLeft ? -2 : 4;
        y1 += outerUp;
        y2 += innerDown;
        ctrlY -= 2;
      } else {
        // neutral subtle gentle arc
        ctrlY = browBaseY - 3.5;
      }

      ctx.beginPath();
      ctx.moveTo(bx - 9, y1);
      ctx.quadraticCurveTo(bx, ctrlY, bx + 9, y2);
      ctx.stroke();
    };

    drawBrow(eyeLX, true);
    drawBrow(eyeRX, false);

    // Animated Mouth (mouthOpen: 0..1, mouthStyle: 'smile' | 'talk' | 'shock')
    const mouthX = faceShiftX + facing * 1.5;
    const mouthY = 25;

    ctx.save();
    ctx.translate(mouthX, mouthY);

    if (mouthStyle === 'shock' || (expr === 'shocked' && mouthStyle !== 'talk')) {
      const rX = 7.5 + mouthOpen * 3;
      const rY = 10.5 + mouthOpen * 4.5;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(0, 1, rX, rY, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#18141A';
      ctx.beginPath();
      ctx.ellipse(0, 1.5, rX * 0.62, rY * 0.66, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (mouthStyle === 'talk' || mouthOpen > 0.04) {
      const openH = 3.5 + mouthOpen * 14.5;
      const halfW = 11.5 - mouthOpen * 1.5;

      // Crisp white D-shaped talking mouth
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(-halfW, -1.5);
      ctx.quadraticCurveTo(0, -3.2, halfW, -1.5);
      ctx.bezierCurveTo(halfW, openH * 0.9, -halfW, openH * 0.9, -halfW, -1.5);
      ctx.closePath();
      ctx.fill();

      // Subtle inner cavity accent when wide open
      if (mouthOpen > 0.25) {
        ctx.fillStyle = 'rgba(24, 18, 22, 0.24)';
        ctx.beginPath();
        ctx.ellipse(0, openH * 0.34, halfW * 0.56, openH * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Friendly crisp white smile
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-10, -1);
      ctx.quadraticCurveTo(0, 7.5, 10.5, -1);
      ctx.stroke();
    }
    ctx.restore();

    // Baseball cap for Tuan Minh
    if (isMinh) {
      drawBaseballCap(ctx, headR, facing, lightSide);
    }

    ctx.restore();
  }

  // =========================================================================
  // 2. Full Character Rig: window.IntroRig.drawCharacter(ctx, cfg)
  // =========================================================================
  function resolvePosePreset(pose, facing) {
    // Returns normalized offsets relative to shoulder center (sx, sy)
    const dir = facing >= 0 ? 1 : -1;
    switch (pose) {
      case 'explain':
        return {
          frontHand: { dx: dir * 88, dy: 28, bend: dir, angle: -0.25 * dir },
          backHand: { dx: -dir * 26, dy: 108, bend: -dir, angle: 1.3 * dir },
        };
      case 'holdApple':
        return {
          frontHand: { dx: dir * 94, dy: 18, bend: dir, angle: -0.15 * dir },
          backHand: { dx: -dir * 28, dy: 112, bend: -dir, angle: 1.4 * dir },
        };
      case 'snap':
        return {
          frontHand: { dx: dir * 74, dy: -22, bend: dir, angle: -0.95 * dir },
          backHand: { dx: -dir * 32, dy: 106, bend: -dir, angle: 1.45 * dir },
        };
      case 'shocked':
        return {
          frontHand: { dx: dir * 76, dy: -26, bend: dir, angle: -1.1 * dir },
          backHand: { dx: -dir * 72, dy: -18, bend: -dir, angle: -2.0 * dir },
        };
      case 'restOnTable':
        return {
          frontHand: { dx: dir * 92, dy: 82, bend: dir, angle: 0.1 * dir },
          backHand: { dx: dir * 64, dy: 88, bend: -dir, angle: 0.2 * dir },
        };
      case 'wave':
        return {
          frontHand: { dx: dir * 82, dy: -56, bend: dir, angle: -1.25 * dir },
          backHand: { dx: -dir * 34, dy: 110, bend: -dir, angle: 1.5 * dir },
        };
      case 'idle':
      default:
        return {
          frontHand: { dx: dir * 32, dy: 112, bend: dir, angle: 1.35 * dir },
          backHand: { dx: -dir * 34, dy: 112, bend: -dir, angle: 1.65 * dir },
        };
    }
  }

  function drawCharacter(ctx, cfg) {
    const c = cfg || {};
    const id = (c.id || c.character || c.type || 'quan').toLowerCase();
    const isMinh = id === 'minh' || id === 'tuanminh';
    const facing = c.facing != null ? (c.facing >= 0 ? 1 : -1) : isMinh ? -1 : 1;
    const seated = Boolean(c.seated);
    const scale = c.scale != null ? c.scale : 1;
    const lightSide = c.lightSide === 'left' ? -1 : c.lightSide === 'right' ? 1 : facing;

    // Palette per cast member
    const jacketMain = isMinh ? '#2B59C3' : '#E85A34';
    const jacketShadow = isMinh ? '#1D3F8F' : '#C44321';
    const rimAccent = isMinh ? 'rgba(147, 197, 253, 0.55)' : 'rgba(255, 178, 130, 0.6)';

    const baseX = c.x != null ? c.x : 960;
    const baseY = c.y != null ? c.y : 900;

    // Hip anchor calculation:
    // - seated: baseY is chair seat level
    // - standing: baseY is floor/feet level (legs = 132px)
    const hipLocalY = seated ? -8 : -132;
    const torsoH = 128;
    const shoulderW = 76;
    const hemW = 96;
    const shoulderY = hipLocalY - torsoH;
    const headY = shoulderY - 56;

    ctx.save();
    ctx.translate(baseX, baseY);
    if (scale !== 1) {
      ctx.scale(scale, scale);
    }
    if (c.bodyTilt) {
      ctx.rotate(c.bodyTilt);
    }

    // -----------------------------------------------------------------------
    // A. Slim Black Legs & Grounded Shoes (#0B0C10)
    // -----------------------------------------------------------------------
    ctx.strokeStyle = '#0B0C10';
    ctx.fillStyle = '#0B0C10';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (seated) {
      const legOffsetBack = -facing * 12;
      const legOffsetFront = facing * 12;

      const drawSeatedLeg = (hipX, kneeX, footX, alphaShade) => {
        ctx.save();
        if (alphaShade) ctx.globalAlpha = alphaShade;
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.moveTo(hipX, hipLocalY + 6);
        ctx.lineTo(kneeX, hipLocalY + 12);
        ctx.lineTo(footX, hipLocalY + 136);
        ctx.stroke();

        // Flat shoe
        ctx.beginPath();
        ctx.ellipse(footX + facing * 12, hipLocalY + 140, 22, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      drawSeatedLeg(legOffsetBack, facing * 64, facing * 72, 0.88);
      drawSeatedLeg(legOffsetFront, facing * 74, facing * 82, 1.0);
    } else {
      const stanceSpread = 22;
      const drawStandingLeg = (hipX, footX, liftY) => {
        ctx.lineWidth = 21;
        ctx.beginPath();
        ctx.moveTo(hipX, hipLocalY + 4);
        ctx.lineTo((hipX + footX) * 0.5 + facing * 4, hipLocalY * 0.5);
        ctx.lineTo(footX, -6 - liftY);
        ctx.stroke();

        // Grounded flat shoe
        ctx.beginPath();
        ctx.ellipse(footX + facing * 12, -5 - liftY, 22, 8.5, 0, 0, Math.PI * 2);
        ctx.fill();
      };

      drawStandingLeg(-facing * stanceSpread * 0.7, -facing * stanceSpread, 0);
      drawStandingLeg(facing * stanceSpread * 0.7, facing * stanceSpread, 0);
    }

    // -----------------------------------------------------------------------
    // B. Back Arm (Drawn Behind Torso)
    // -----------------------------------------------------------------------
    const poseDefaults = resolvePosePreset(c.pose || 'idle', facing);
    const backShoulderX = -facing * (shoulderW * 0.42);
    const backShoulderY = shoulderY + 16;
    const frontShoulderX = facing * (shoulderW * 0.42);
    const frontShoulderY = shoulderY + 16;

    const armLen1 = 56;
    const armLen2 = 54;

    function drawArm(sx, sy, targetCfg, fallback, isBackArm) {
      let tx = sx + fallback.dx;
      let ty = sy + fallback.dy;
      let bend = fallback.bend;
      let handAngle = fallback.angle;

      if (targetCfg) {
        if (targetCfg.handX != null && targetCfg.handY != null) {
          tx = targetCfg.handX;
          ty = targetCfg.handY;
        } else if (targetCfg.dx != null || targetCfg.dy != null) {
          tx = sx + (targetCfg.dx != null ? targetCfg.dx : fallback.dx);
          ty = sy + (targetCfg.dy != null ? targetCfg.dy : fallback.dy);
        }
        if (targetCfg.bend != null) bend = targetCfg.bend;
        if (targetCfg.angle != null) handAngle = targetCfg.angle;
      }

      const ik = solveTwoBoneIK(sx, sy, tx, ty, armLen1, armLen2, bend);

      // Sleeve path
      ctx.save();
      ctx.strokeStyle = isBackArm ? jacketShadow : jacketMain;
      ctx.lineWidth = 22;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ik.ex, ik.ey);
      ctx.lineTo(ik.wx, ik.wy);
      ctx.stroke();

      // Subtle dark cuff ring
      const wristAng = Math.atan2(ik.wy - ik.ey, ik.wx - ik.ex);
      ctx.strokeStyle = '#0E0D12';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ik.wx - Math.sin(wristAng) * 9, ik.wy + Math.cos(wristAng) * 9);
      ctx.lineTo(ik.wx + Math.sin(wristAng) * 9, ik.wy - Math.cos(wristAng) * 9);
      ctx.stroke();

      drawArticulatedHand(
        ctx,
        ik.wx,
        ik.wy,
        targetCfg && targetCfg.angle != null ? handAngle : wristAng,
        isBackArm ? 0.92 : 1.0,
        rimAccent
      );
      ctx.restore();

      return { x: ik.wx, y: ik.wy };
    }

    drawArm(backShoulderX, backShoulderY, c.backArm, poseDefaults.backHand, true);

    // -----------------------------------------------------------------------
    // C. Tapered Jacket Torso (76px shoulders -> 96px hem, height: 128px)
    // -----------------------------------------------------------------------
    ctx.save();
    const topHalf = shoulderW * 0.5;
    const botHalf = hemW * 0.5;

    ctx.beginPath();
    ctx.moveTo(-topHalf + 8, shoulderY);
    ctx.quadraticCurveTo(0, shoulderY - 4, topHalf - 8, shoulderY);
    ctx.quadraticCurveTo(topHalf + 2, shoulderY + 3, topHalf + 2, shoulderY + 16);
    ctx.lineTo(botHalf, hipLocalY + 6);
    ctx.quadraticCurveTo(0, hipLocalY + 13, -botHalf, hipLocalY + 6);
    ctx.lineTo(-topHalf - 2, shoulderY + 16);
    ctx.quadraticCurveTo(-topHalf - 2, shoulderY + 3, -topHalf + 8, shoulderY);
    ctx.closePath();

    // Base jacket color
    ctx.fillStyle = jacketMain;
    ctx.fill();

    // Darker back-shadow split for 2.5D volume
    ctx.save();
    ctx.clip();
    ctx.fillStyle = jacketShadow;
    if (facing >= 0) {
      ctx.beginPath();
      ctx.moveTo(-botHalf - 10, shoulderY - 10);
      ctx.lineTo(-4, shoulderY - 10);
      ctx.quadraticCurveTo(8, shoulderY + torsoH * 0.52, -12, hipLocalY + 20);
      ctx.lineTo(-botHalf - 10, hipLocalY + 20);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(botHalf + 10, shoulderY - 10);
      ctx.lineTo(4, shoulderY - 10);
      ctx.quadraticCurveTo(-8, shoulderY + torsoH * 0.52, 12, hipLocalY + 20);
      ctx.lineTo(botHalf + 10, hipLocalY + 20);
      ctx.closePath();
      ctx.fill();
    }

    // Subtle jacket zipper / front seam line
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(facing * 12, shoulderY + 18);
    ctx.lineTo(facing * 14, hipLocalY + 10);
    ctx.stroke();

    // Subtle warm rim highlight on lit shoulder/side edge
    ctx.strokeStyle = rimAccent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (lightSide >= 0) {
      ctx.moveTo(topHalf - 6, shoulderY + 2);
      ctx.lineTo(botHalf - 1, hipLocalY + 6);
    } else {
      ctx.moveTo(-topHalf + 6, shoulderY + 2);
      ctx.lineTo(-botHalf + 1, hipLocalY + 6);
    }
    ctx.stroke();
    ctx.restore();

    // Subtle collar notch + short neck
    ctx.fillStyle = '#0B0C10';
    ctx.fillRect(-10, shoulderY - 10, 20, 16);

    ctx.fillStyle = '#141318';
    ctx.beginPath();
    ctx.moveTo(-16, shoulderY);
    ctx.lineTo(facing * 8, shoulderY + 22);
    ctx.lineTo(18, shoulderY);
    ctx.closePath();
    ctx.fill();

    // Crisp collar lapels
    ctx.fillStyle = jacketShadow;
    ctx.beginPath();
    ctx.moveTo(-18, shoulderY);
    ctx.lineTo(-6, shoulderY + 19);
    ctx.lineTo(-22, shoulderY + 13);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = jacketMain;
    ctx.beginPath();
    ctx.moveTo(18, shoulderY);
    ctx.lineTo(facing * 8, shoulderY + 20);
    ctx.lineTo(24, shoulderY + 14);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // -----------------------------------------------------------------------
    // D. Head (Drawn Over Collar)
    // -----------------------------------------------------------------------
    drawCharacterHead(
      ctx,
      {
        isMinh,
        facing,
        lightSide: c.lightSide,
        lookX: c.lookX,
        lookY: c.lookY,
        blink: c.blink,
        expression: c.expression,
        mouthOpen: c.mouthOpen,
        mouthStyle: c.mouthStyle,
        headTilt: c.headTilt,
      },
      facing * 2,
      headY
    );

    // -----------------------------------------------------------------------
    // E. Front Arm (Drawn Over Torso)
    // -----------------------------------------------------------------------
    const frontHandPos = drawArm(
      frontShoulderX,
      frontShoulderY,
      c.frontArm,
      poseDefaults.frontHand,
      false
    );

    // Optional prop in hand (e.g., holding glossy apple)
    if (c.holdProp === 'apple') {
      drawGlossyApple(
        ctx,
        frontHandPos.x + facing * 12,
        frontHandPos.y - 10,
        18,
        facing * 0.15
      );
    }

    ctx.restore();
  }

  // =========================================================================
  // 3. Macro Close-Up Hand & Props
  // =========================================================================
  function drawCloseUpArmHand(ctx, x, y, angle, sleeveColor, fingerCurl) {
    const sleeve = sleeveColor || '#E85A34';
    const curl = clamp(fingerCurl != null ? fingerCurl : 0.25, 0, 1);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);

    // 1. Sleek tapered coral-orange sleeve extending left from wrist
    const sleeveGrad = ctx.createLinearGradient(-340, -56, -40, 62);
    sleeveGrad.addColorStop(0.0, sleeve);
    sleeveGrad.addColorStop(0.65, sleeve);
    sleeveGrad.addColorStop(1.0, '#B93E1E');

    ctx.fillStyle = sleeveGrad;
    ctx.beginPath();
    ctx.moveTo(-360, -64);
    ctx.lineTo(-26, -34);
    ctx.quadraticCurveTo(-18, 0, -26, 36);
    ctx.lineTo(-360, 58);
    ctx.closePath();
    ctx.fill();

    // Subtle underside shadow fold on sleeve
    ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
    ctx.beginPath();
    ctx.moveTo(-360, 14);
    ctx.quadraticCurveTo(-190, 26, -26, 18);
    ctx.lineTo(-26, 36);
    ctx.lineTo(-360, 58);
    ctx.closePath();
    ctx.fill();

    // Warm top rim-highlight along sleeve
    ctx.strokeStyle = '#FF9E7D';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-350, -62);
    ctx.lineTo(-28, -33);
    ctx.stroke();

    // Dark wrist cuff
    ctx.fillStyle = '#18141A';
    ctx.beginPath();
    ctx.roundRect(-36, -37, 24, 76, 8);
    ctx.fill();

    // 2. Sculpted matte-black hand (#121216)
    ctx.fillStyle = '#121216';
    ctx.beginPath();
    ctx.moveTo(-16, -28);
    ctx.quadraticCurveTo(26, -34, 56, -24);
    ctx.quadraticCurveTo(68, 0, 54, 28);
    ctx.quadraticCurveTo(22, 36, -16, 28);
    ctx.closePath();
    ctx.fill();

    // Opposable thumb (upper arch, curls inward with fingerCurl)
    ctx.save();
    ctx.translate(12, -24);
    ctx.rotate(-0.42 + curl * 0.45);
    ctx.fillStyle = '#121216';
    ctx.beginPath();
    ctx.roundRect(-4, -14, 52, 22, 11);
    ctx.fill();
    // Warm rim-highlight on thumb
    ctx.strokeStyle = '#FF9E7D';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(4, -13);
    ctx.quadraticCurveTo(26, -15, 43, -9);
    ctx.stroke();
    ctx.restore();

    // 4 distinct rounded fingers
    const fingers = [
      { y: -20, len: 68, thick: 15, baseAng: -0.10, curlWeight: 0.95 }, // Index
      { y: -6,  len: 76, thick: 15.5, baseAng: -0.02, curlWeight: 1.0 }, // Middle
      { y: 8,   len: 70, thick: 14.5, baseAng: 0.06, curlWeight: 1.05 }, // Ring
      { y: 21,  len: 56, thick: 13.0, baseAng: 0.14, curlWeight: 1.1 },  // Pinky
    ];

    for (let i = 0; i < fingers.length; i++) {
      const f = fingers[i];
      const fCurl = curl * f.curlWeight;
      const proxLen = f.len * 0.54;
      const distLen = f.len * 0.46;

      ctx.save();
      ctx.translate(44, f.y);
      ctx.rotate(f.baseAng + fCurl * 0.68);

      // Proximal phalanx
      ctx.fillStyle = '#121216';
      ctx.beginPath();
      ctx.roundRect(-6, -f.thick * 0.5, proxLen + 6, f.thick, f.thick * 0.5);
      ctx.fill();

      // Subtle knuckle rim on top finger
      if (i === 0) {
        ctx.strokeStyle = '#FF9E7D';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, -f.thick * 0.45);
        ctx.lineTo(proxLen - 4, -f.thick * 0.45);
        ctx.stroke();
      }

      // Distal phalanx bending at knuckle
      ctx.translate(proxLen - 3, 0);
      ctx.rotate(fCurl * 0.85);
      ctx.fillStyle = i % 2 === 0 ? '#121216' : '#16161B';
      ctx.beginPath();
      ctx.roundRect(-4, -f.thick * 0.46, distLen + 4, f.thick * 0.92, f.thick * 0.46);
      ctx.fill();

      if (i === 0) {
        ctx.strokeStyle = '#FF9E7D';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(2, -f.thick * 0.42);
        ctx.lineTo(distLen - 4, -f.thick * 0.42);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Top palm warm rim-highlight (#FF9E7D)
    ctx.strokeStyle = '#FF9E7D';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, -28);
    ctx.quadraticCurveTo(22, -33, 50, -25);
    ctx.stroke();

    ctx.restore();
  }

  function drawGlossyApple(ctx, x, y, r, rot) {
    const radius = r != null ? r : 46;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);

    // Subtle ambient contact shadow when resting near surface (optional subtle bottom rim)
    const bodyGrad = ctx.createRadialGradient(
      -radius * 0.28,
      -radius * 0.34,
      radius * 0.1,
      0,
      radius * 0.08,
      radius * 1.15
    );
    bodyGrad.addColorStop(0.0, '#FF7D5C');
    bodyGrad.addColorStop(0.32, '#EE422D');
    bodyGrad.addColorStop(0.75, '#B81D18');
    bodyGrad.addColorStop(1.0, '#6B0D0E');

    // Dual-lobe crisp apple silhouette
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.72);
    ctx.bezierCurveTo(
      radius * 0.48, -radius * 1.06,
      radius * 1.12, -radius * 0.56,
      radius * 0.96, radius * 0.16
    );
    ctx.bezierCurveTo(
      radius * 0.84, radius * 0.82,
      radius * 0.34, radius * 1.04,
      0, radius * 0.88
    );
    ctx.bezierCurveTo(
      -radius * 0.34, radius * 1.04,
      -radius * 0.84, radius * 0.82,
      -radius * 0.96, radius * 0.16
    );
    ctx.bezierCurveTo(
      -radius * 1.12, -radius * 0.56,
      -radius * 0.48, -radius * 1.06,
      0, -radius * 0.72
    );
    ctx.closePath();
    ctx.fill();

    // Top stem dimple shading
    ctx.fillStyle = 'rgba(70, 6, 8, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.66, radius * 0.24, radius * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();

    // Specular glossy highlight
    ctx.fillStyle = 'rgba(255, 244, 236, 0.62)';
    ctx.beginPath();
    ctx.ellipse(-radius * 0.36, -radius * 0.32, radius * 0.14, radius * 0.28, 0.42, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(-radius * 0.42, -radius * 0.48, radius * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // Warm bottom rim bounce light
    ctx.strokeStyle = 'rgba(255, 165, 118, 0.32)';
    ctx.lineWidth = Math.max(1.5, radius * 0.05);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, radius * 0.08, radius * 0.82, Math.PI * 0.18, Math.PI * 0.42);
    ctx.stroke();

    // Curved brown stem
    ctx.strokeStyle = '#5C3A21';
    ctx.lineWidth = Math.max(3, radius * 0.11);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.66);
    ctx.quadraticCurveTo(radius * 0.06, -radius * 1.08, radius * 0.24, -radius * 1.24);
    ctx.stroke();

    // Bright green leaf
    ctx.save();
    ctx.translate(radius * 0.08, -radius * 0.96);
    ctx.rotate(-0.35);
    const leafGrad = ctx.createLinearGradient(0, 0, radius * 0.6, -radius * 0.3);
    leafGrad.addColorStop(0, '#22C55E');
    leafGrad.addColorStop(1, '#4ADE80');
    ctx.fillStyle = leafGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(radius * 0.32, -radius * 0.36, radius * 0.64, -radius * 0.12);
    ctx.quadraticCurveTo(radius * 0.36, radius * 0.22, 0, 0);
    ctx.closePath();
    ctx.fill();

    // Leaf vein
    ctx.strokeStyle = 'rgba(20, 83, 45, 0.45)';
    ctx.lineWidth = Math.max(1.2, radius * 0.035);
    ctx.beginPath();
    ctx.moveTo(radius * 0.05, -radius * 0.02);
    ctx.quadraticCurveTo(radius * 0.32, -radius * 0.1, radius * 0.56, -radius * 0.11);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  function drawCeramicMug(ctx, x, y, rot, spillAmount) {
    const spill = clamp(spillAmount != null ? spillAmount : 0, 0, 1);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);

    const mugW = 92;
    const mugH = 112;
    const halfW = mugW * 0.5;
    const topY = -mugH * 0.5;
    const botY = mugH * 0.5;

    // Curved ergonomic handle on the right
    ctx.strokeStyle = '#D4D4D8';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(halfW - 4, topY + 26);
    ctx.bezierCurveTo(halfW + 42, topY + 18, halfW + 42, botY - 18, halfW - 6, botY - 22);
    ctx.stroke();

    ctx.strokeStyle = '#F4F4F6';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(halfW - 2, topY + 26);
    ctx.bezierCurveTo(halfW + 38, topY + 20, halfW + 38, botY - 22, halfW - 4, botY - 24);
    ctx.stroke();

    // Mug ceramic body (#F4F4F6 -> #D4D4D8 shadow side)
    const bodyGrad = ctx.createLinearGradient(-halfW, 0, halfW, 0);
    bodyGrad.addColorStop(0.0, '#FFFFFF');
    bodyGrad.addColorStop(0.45, '#F4F4F6');
    bodyGrad.addColorStop(0.82, '#D4D4D8');
    bodyGrad.addColorStop(1.0, '#B4B4BC');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(-halfW, topY + 12);
    ctx.lineTo(-halfW + 4, botY - 10);
    ctx.quadraticCurveTo(0, botY + 12, halfW - 4, botY - 10);
    ctx.lineTo(halfW, topY + 12);
    ctx.closePath();
    ctx.fill();

    // Subtle warm sunset reflection on left edge of ceramic mug
    ctx.fillStyle = 'rgba(255, 200, 145, 0.28)';
    ctx.beginPath();
    ctx.roundRect(-halfW + 6, topY + 20, 10, mugH - 36, 5);
    ctx.fill();

    // Top ceramic rim ellipse
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.ellipse(0, topY + 12, halfW, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner recessed lip
    ctx.fillStyle = '#D4D4D8';
    ctx.beginPath();
    ctx.ellipse(0, topY + 13, halfW - 6, 10.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark coffee interior
    const coffeeGrad = ctx.createRadialGradient(-8, topY + 14, 4, 0, topY + 15, halfW - 6);
    coffeeGrad.addColorStop(0.0, '#5A321E');
    coffeeGrad.addColorStop(0.65, '#2A160E');
    coffeeGrad.addColorStop(1.0, '#180B06');
    ctx.fillStyle = coffeeGrad;
    ctx.beginPath();
    ctx.ellipse(0, topY + 15, halfW - 8, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glossy coffee surface highlight
    ctx.strokeStyle = 'rgba(255, 224, 188, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-6, topY + 15, halfW * 0.45, 4, 0, Math.PI * 1.1, Math.PI * 1.85);
    ctx.stroke();

    // Animated pouring / floating coffee stream & spherical droplets when spillAmount > 0
    if (spill > 0.02) {
      ctx.save();
      const streamLift = spill;
      const streamStartX = -halfW * 0.42;
      const streamStartY = topY + 14;

      // Floating organic coffee ribbon escaping upward/outward in zero-G or tilt
      const coffeeColor = '#3A1E12';
      const cremaColor = '#7C4A2D';

      ctx.strokeStyle = coffeeColor;
      ctx.lineWidth = 10 * Math.min(1, spill * 1.4);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(streamStartX, streamStartY);
      ctx.bezierCurveTo(
        streamStartX - 24 * streamLift,
        streamStartY - 38 * streamLift,
        streamStartX - 10 * streamLift,
        streamStartY - 82 * streamLift,
        streamStartX - 36 * streamLift,
        streamStartY - 115 * streamLift
      );
      ctx.stroke();

      // Spherical floating coffee droplets
      const drops = [
        { ox: -38, oy: -124, r: 9.5, threshold: 0.15 },
        { ox: -62, oy: -94, r: 6.5, threshold: 0.28 },
        { ox: -16, oy: -146, r: 7.5, threshold: 0.42 },
        { ox: -78, oy: -138, r: 5.0, threshold: 0.55 },
        { ox: 8,   oy: -98,  r: 5.5, threshold: 0.68 },
        { ox: -48, oy: -168, r: 4.2, threshold: 0.78 },
      ];

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        if (spill < d.threshold) continue;
        const localProgress = clamp((spill - d.threshold) / (1 - d.threshold), 0, 1);
        const dx = streamStartX + d.ox * (0.45 + 0.65 * localProgress);
        const dy = streamStartY + d.oy * (0.45 + 0.65 * localProgress);
        const dr = d.r * (0.55 + 0.45 * localProgress);

        const dropGrad = ctx.createRadialGradient(
          dx - dr * 0.3,
          dy - dr * 0.3,
          dr * 0.1,
          dx,
          dy,
          dr
        );
        dropGrad.addColorStop(0, cremaColor);
        dropGrad.addColorStop(0.55, coffeeColor);
        dropGrad.addColorStop(1, '#1A0B06');

        ctx.fillStyle = dropGrad;
        ctx.beginPath();
        ctx.arc(dx, dy, dr, 0, Math.PI * 2);
        ctx.fill();

        // Tiny glossy catchlight on spherical droplet
        ctx.fillStyle = 'rgba(255, 232, 204, 0.65)';
        ctx.beginPath();
        ctx.arc(dx - dr * 0.32, dy - dr * 0.32, dr * 0.24, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // =========================================================================
  // 4. Circular Radar / Gauge Telemetry HUD
  // =========================================================================
  function drawTelemetryGauge(ctx, x, y, label, valueText, progress, accentColor) {
    const color = accentColor || '#00E5FF';
    const prog = clamp(progress != null ? progress : 0, 0, 1);
    const nowSec = performance.now() * 0.001;

    ctx.save();

    // 1. Concentric thin crosshair rings around the target object (x, y)
    const innerR = 66;
    const outerR = 88;

    // Soft glow ring
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, y, innerR, 0, Math.PI * 2);
    ctx.stroke();

    // Crisp inner ring
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y, innerR, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating dashed outer radar ring
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(nowSec * 0.45);
    ctx.setLineDash([12, 10, 4, 10]);
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4 Cardinal crosshair ticks
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (innerR - 8), Math.sin(a) * (innerR - 8));
      ctx.lineTo(Math.cos(a) * (outerR + 8), Math.sin(a) * (outerR + 8));
      ctx.stroke();
    }
    ctx.restore();

    // 2. Leader line extending from ring up-right to dark glass readout pill
    const anchorX = x + Math.cos(-Math.PI * 0.24) * outerR;
    const anchorY = y + Math.sin(-Math.PI * 0.24) * outerR;
    const elbowX = anchorX + 54;
    const elbowY = anchorY - 52;
    const pillX = elbowX + 22;
    const pillY = elbowY - 38;
    const pillW = 286;
    const pillH = 76;

    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.lineTo(elbowX, elbowY);
    ctx.lineTo(pillX, elbowY);
    ctx.stroke();

    // Node dot at ring anchor
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(anchorX, anchorY, 4, 0, Math.PI * 2);
    ctx.fill();

    // 3. Dark glass readout pill
    ctx.save();
    ctx.fillStyle = 'rgba(12, 14, 22, 0.86)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 16);
    ctx.fill();
    ctx.globalAlpha = 0.58;
    ctx.stroke();
    ctx.restore();

    // Semi-circular arc meter inside left side of pill
    const gaugeCX = pillX + 44;
    const gaugeCY = pillY + 50;
    const gaugeR = 25;

    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(gaugeCX, gaugeCY, gaugeR, Math.PI, Math.PI * 2);
    ctx.stroke();

    // Active progress arc
    if (prog > 0.005) {
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(gaugeCX, gaugeCY, gaugeR, Math.PI, Math.PI + Math.PI * prog);
      ctx.stroke();
    }

    // Analog needle on semi-circular meter
    const needleAng = Math.PI + Math.PI * prog;
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(gaugeCX, gaugeCY);
    ctx.lineTo(
      gaugeCX + Math.cos(needleAng) * (gaugeR - 4),
      gaugeCY + Math.sin(needleAng) * (gaugeR - 4)
    );
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(gaugeCX, gaugeCY, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // Label & live telemetry value text
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '600 13px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(String(label || 'GRAVITY TELEMETRY').toUpperCase(), pillX + 84, pillY + 14);

    ctx.globalAlpha = 1.0;
    ctx.fillStyle = color;
    ctx.font = '700 24px "JetBrains Mono", "Consolas", monospace';
    ctx.textBaseline = 'bottom';
    ctx.fillText(String(valueText || 'g = 9.80 m/s²'), pillX + 84, pillY + pillH - 12);

    ctx.restore();
  }

  // =========================================================================
  // Public API
  // =========================================================================
  global.IntroRig = {
    drawCharacter,
    drawCloseUpArmHand,
    drawGlossyApple,
    drawCeramicMug,
    drawTelemetryGauge,
  };
})(window);
