(function () {
  const LOGICAL_W = 1920;
  const LOGICAL_H = 1080;
  const TOTAL_DURATION = 18.0;

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - clamp01(t), 3);
  }

  function easeInOutCubic(t) {
    const x = clamp01(t);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  // Realistic vertical drop + two damped bounces from yStart to yRest
  function computeAppleDropY(dtSinceSnap) {
    const yStart = 532;
    const yRest = 710;
    const dist = yRest - yStart; // 178px
    const tFall = 0.36;

    if (dtSinceSnap <= 0) return yStart;
    if (dtSinceSnap < tFall) {
      const u = dtSinceSnap / tFall;
      return yStart + dist * u * u;
    }

    const tAfter = dtSinceSnap - tFall;
    const bounce1Dur = 0.24;
    if (tAfter < bounce1Dur) {
      const u = tAfter / bounce1Dur;
      return yRest - Math.sin(u * Math.PI) * 34;
    }

    const tAfter2 = tAfter - bounce1Dur;
    const bounce2Dur = 0.14;
    if (tAfter2 < bounce2Dur) {
      const u = tAfter2 / bounce2Dur;
      return yRest - Math.sin(u * Math.PI) * 10;
    }

    return yRest;
  }

  // =========================================================================
  // WEB AUDIO API FOLEY (Finger Snap at 13.0s & Apple Table Thud at 13.36s)
  // =========================================================================
  let audioCtx = null;

  function unlockAudio() {
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      if (!audioCtx) {
        audioCtx = new AudioCtor();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    } catch (_) {
      // Ignore audio errors in restricted environments
    }
  }

  function playSnapSound() {
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;

      // Short high-passed noise burst for crisp finger-snap transient
      const bufSize = Math.floor(audioCtx.sampleRate * 0.045);
      const buffer = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.18));
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.Q.setValueAtTime(2.5, now);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start(now);

      // Resonant tonal click
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1650, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.035);
      oscGain.gain.setValueAtTime(0.32, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (_) {}
  }

  function playThudSound(volume) {
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.11);

      gain.gain.setValueAtTime(volume || 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (_) {}
  }

  // =========================================================================
  // SUBTITLE & CINEMATIC OVERLAY HELPERS
  // =========================================================================
  function wrapSubtitleLines(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (let i = 0; i < words.length; i++) {
      const test = current ? current + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = words[i];
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  function drawSubtitle(ctx, text, alpha) {
    if (!text || alpha <= 0.01) return;
    ctx.save();

    // Soft bottom vignette scrim for clean cinema subtitle contrast
    const scrim = ctx.createLinearGradient(0, LOGICAL_H - 250, 0, LOGICAL_H);
    scrim.addColorStop(0, 'rgba(8, 8, 8, 0)');
    scrim.addColorStop(1, `rgba(8, 8, 8, ${0.72 * alpha})`);
    ctx.fillStyle = scrim;
    ctx.fillRect(0, LOGICAL_H - 250, LOGICAL_W, 250);

    ctx.globalAlpha = alpha;
    ctx.font = '600 34px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = wrapSubtitleLines(ctx, text, 1340);
    const lineHeight = 46;
    const baseY = LOGICAL_H - 96 - ((lines.length - 1) * lineHeight) * 0.5;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.92)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;

    ctx.fillStyle = '#FFFFFF';
    lines.forEach((line, idx) => {
      ctx.fillText(line, LOGICAL_W * 0.5, baseY + idx * lineHeight);
    });

    ctx.restore();
  }

  function drawCinemaFrameAndTimecode(ctx, t) {
    ctx.save();
    // Subtle vignette around edges
    const vig = ctx.createRadialGradient(
      LOGICAL_W * 0.5,
      LOGICAL_H * 0.5,
      LOGICAL_W * 0.34,
      LOGICAL_W * 0.5,
      LOGICAL_H * 0.5,
      LOGICAL_W * 0.72
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Subtle film timecode badge top-left
    ctx.fillStyle = 'rgba(245, 245, 245, 0.55)';
    ctx.font = '700 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const sec = Math.min(18, Math.floor(t));
    const pad = String(sec).padStart(2, '0');
    ctx.fillText(`INTRO FILM • 00:${pad} / 00:18`, 44, 34);

    // Thin progress bar along top edge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.fillRect(0, 0, LOGICAL_W, 4);
    ctx.fillStyle = '#FF4D2A';
    ctx.fillRect(0, 0, LOGICAL_W * clamp01(t / TOTAL_DURATION), 4);
    ctx.restore();
  }

  function drawTitleCard(ctx, t, cardT) {
    const fade = easeOutCubic(cardT / 0.75);
    const scalePull = 1.04 - 0.04 * easeOutCubic(cardT / 1.4);

    ctx.save();
    ctx.fillStyle = `rgba(8, 8, 12, ${0.86 * fade})`;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    ctx.translate(LOGICAL_W * 0.5, LOGICAL_H * 0.5);
    ctx.scale(scalePull, scalePull);

    // Sleek dark-glass title card panel
    const cardW = 1340;
    const cardH = 420;
    ctx.globalAlpha = fade;
    ctx.fillStyle = 'rgba(16, 18, 26, 0.84)';
    ctx.strokeStyle = 'rgba(255, 77, 42, 0.48)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-cardW * 0.5, -cardH * 0.5, cardW, cardH, 24);
    ctx.fill();
    ctx.stroke();

    // Accent bar
    ctx.fillStyle = '#FF4D2A';
    ctx.fillRect(-120, -138, 240, 4);

    ctx.fillStyle = '#FF4D2A';
    ctx.font = '700 19px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VẬT LÍ LỚP 10 • CHƯƠNG MỞ ĐẦU', 0, -96);

    ctx.fillStyle = '#F5F5F5';
    ctx.font = '900 58px "Be Vietnam Pro", sans-serif';
    ctx.fillText('SƠ LƯỢC VỀ SỰ PHÁT TRIỂN', 0, -24);
    ctx.fillText('CỦA VẬT LÍ HỌC', 0, 46);

    ctx.fillStyle = 'rgba(245, 245, 245, 0.76)';
    ctx.font = '600 24px "Be Vietnam Pro", sans-serif';
    ctx.fillText('Nhóm 1: Minh Quân • Tuấn Minh • Đăng Quang • Phú Quang', 0, 134);

    ctx.restore();
  }

  // =========================================================================
  // INTRO MOVIE CONTROLLER
  // =========================================================================
  function mountIntroMovie() {
    if (document.getElementById('intro-movie-wrap')) return;

    const wrap = document.createElement('div');
    wrap.id = 'intro-movie-wrap';
    wrap.style.cssText = [
      'position: fixed',
      'inset: 0',
      'z-index: 9999',
      'background: #080808',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'overflow: hidden',
      'transition: opacity 0.45s ease'
    ].join(';');

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display: block; background: #080808;';
    wrap.appendChild(canvas);

    // Center Play Button
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.textContent = '▶ PHÁT INTRO';
    playBtn.style.cssText = [
      'position: absolute',
      'left: 50%',
      'top: 50%',
      'transform: translate(-50%, -50%)',
      'appearance: none',
      'border: 1.5px solid rgba(255, 77, 42, 0.85)',
      'background: rgba(11, 13, 18, 0.84)',
      'backdrop-filter: blur(12px)',
      'color: #F5F5F5',
      'font-family: "Be Vietnam Pro", sans-serif',
      'font-size: 24px',
      'font-weight: 800',
      'letter-spacing: 0.08em',
      'padding: 20px 42px',
      'border-radius: 999px',
      'cursor: pointer',
      'box-shadow: 0 20px 56px rgba(0, 0, 0, 0.65)',
      'transition: transform 0.2s ease, background-color 0.2s ease'
    ].join(';');
    wrap.appendChild(playBtn);

    // Bottom-Right Skip Button
    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.textContent = 'Bỏ qua Intro →';
    skipBtn.style.cssText = [
      'position: absolute',
      'right: 28px',
      'bottom: 24px',
      'appearance: none',
      'border: 1px solid rgba(255, 255, 255, 0.22)',
      'background: rgba(11, 13, 18, 0.72)',
      'backdrop-filter: blur(10px)',
      'color: #F5F5F5',
      'font-family: "JetBrains Mono", monospace',
      'font-size: 14px',
      'font-weight: 700',
      'padding: 10px 18px',
      'border-radius: 999px',
      'cursor: pointer',
      'opacity: 0.86',
      'transition: opacity 0.2s ease, border-color 0.2s ease'
    ].join(';');
    wrap.appendChild(skipBtn);

    document.body.appendChild(wrap);

    const ctx = canvas.getContext('2d', { alpha: false });
    let dpr = 1;

    function resizeCanvas() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.min(vw / LOGICAL_W, vh / LOGICAL_H);
      const cssW = Math.round(LOGICAL_W * scale);
      const cssH = Math.round(LOGICAL_H * scale);

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.width = Math.round(LOGICAL_W * dpr);
      canvas.height = Math.round(LOGICAL_H * dpr);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let playing = false;
    let finished = false;
    let movieTime = 0;
    let idleTime = 0;
    let snapPlayed = false;
    let thudPlayed = false;
    let bounceThudPlayed = false;
    let rafId = 0;
    let lastTs = performance.now();

    function finishIntro() {
      if (finished) return;
      finished = true;
      playing = false;

      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', onKeyDown);

      const App = window.App;
      if (App && App.transitions && typeof App.transitions.play === 'function') {
        // Drop intro wrap below #fx-curtain (z-index: 999) so the diagonal curtain wipes cleanly over it
        wrap.style.zIndex = '900';
        playBtn.style.display = 'none';
        skipBtn.style.display = 'none';

        App.transitions.play(
          'diagonal',
          () => {
            cancelAnimationFrame(rafId);
            wrap.remove();
            if (typeof App._mountSlide === 'function') {
              App._mountSlide(0);
            } else {
              App.goTo(0);
            }
          },
          () => {
            App.isTransitioning = false;
          }
        );
      } else {
        wrap.style.opacity = '0';
        setTimeout(() => {
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

    playBtn.addEventListener('click', startPlayback);
    playBtn.addEventListener('mouseenter', () => {
      playBtn.style.transform = 'translate(-50%, -50%) scale(1.05)';
      playBtn.style.background = '#FF4D2A';
    });
    playBtn.addEventListener('mouseleave', () => {
      playBtn.style.transform = 'translate(-50%, -50%) scale(1)';
      playBtn.style.background = 'rgba(11, 13, 18, 0.84)';
    });

    skipBtn.addEventListener('click', finishIntro);
    skipBtn.addEventListener('mouseenter', () => {
      skipBtn.style.opacity = '1';
      skipBtn.style.borderColor = '#FF4D2A';
    });
    skipBtn.addEventListener('mouseleave', () => {
      skipBtn.style.opacity = '0.86';
      skipBtn.style.borderColor = 'rgba(255, 255, 255, 0.22)';
    });

    window.addEventListener('keydown', onKeyDown, true);

    function renderFrame(now) {
      const rawDt = (now - lastTs) / 1000;
      lastTs = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.033);

      if (playing && !finished) {
        movieTime += dt;
      } else {
        idleTime += dt;
      }

      const t = playing ? movieTime : 0;
      const Assets = window.IntroAssets;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      if (Assets) {
        ctx.save();

        if (!playing) {
          // Idle preview on Shot 1 before clicking ▶ PHÁT INTRO
          Assets.drawShot1_Silhouette(ctx, idleTime);
          ctx.fillStyle = 'rgba(8, 8, 12, 0.35)';
          ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
        } else if (t < 4.0) {
          // CUT 1 (0.0s – 4.0s): Slow camera push-in on rooftop silhouette
          const push = 1 + 0.085 * easeInOutCubic(t / 4.0);
          ctx.translate(LOGICAL_W * 0.45, LOGICAL_H * 0.48);
          ctx.scale(push, push);
          ctx.translate(-LOGICAL_W * 0.45, -LOGICAL_H * 0.48);
          Assets.drawShot1_Silhouette(ctx, t);
          ctx.restore();
          ctx.save();
          drawSubtitle(
            ctx,
            'Hãy tưởng tượng... điều gì sẽ xảy ra nếu mọi định luật Vật lí đột ngột biến mất?',
            clamp01((t - 0.3) / 0.45)
          );
        } else if (t < 8.5) {
          // CUT 2 (4.0s – 8.5s): Table Macro with gravityZero = true
          const localT = t - 4.0;
          Assets.drawShot2_TableMacro(ctx, localT, true);
          drawSubtitle(
            ctx,
            'Không trọng lực. Không quán tính. Mọi chuyển động trong vũ trụ đều đóng băng.',
            clamp01(localT / 0.35)
          );
        } else if (t < 11.5) {
          // CUT 3 (8.5s – 11.5s): Tuấn Minh Face Close-Up
          const localT = t - 8.5;
          Assets.drawShot3_FaceCloseUp(ctx, localT);

          // Floating light particles drifting past close-up
          for (let p = 0; p < 14; p++) {
            const px = ((p * 173 + localT * 75) % (LOGICAL_W + 80)) - 40;
            const py = 180 + ((p * 97) % 720) - localT * 26;
            ctx.fillStyle = p % 2 === 0
              ? 'rgba(253, 224, 71, 0.55)'
              : 'rgba(0, 229, 255, 0.45)';
            ctx.beginPath();
            ctx.arc(px, py, 4 + (p % 4) * 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

          drawSubtitle(
            ctx,
            'Tuấn Minh: Ủa Quân... sao ly cà phê với quả táo bay lơ lửng hết vậy?!',
            clamp01(localT / 0.3)
          );
        } else if (t < 15.5) {
          // CUT 4 (11.5s – 15.5s): Cafe Two-Shot + Finger Snap at 13.0s
          const localT = t - 11.5;
          const gravityReturned = t >= 13.0;

          if (gravityReturned && !snapPlayed) {
            snapPlayed = true;
            playSnapSound();
          }
          if (t >= 13.36 && !thudPlayed) {
            thudPlayed = true;
            playThudSound(0.5);
          }
          if (t >= 13.6 && !bounceThudPlayed) {
            bounceThudPlayed = true;
            playThudSound(0.22);
          }

          const appleY = gravityReturned
            ? computeAppleDropY(t - 13.0)
            : 532 + Math.sin(localT * 2.4) * 14;

          Assets.drawShot4_CafeTwoShot(ctx, localT, appleY);

          // Crisp white shockwave ring at Minh Quân's raised hand at 13.0s
          if (t >= 13.0 && t < 13.75) {
            const swU = (t - 13.0) / 0.75;
            const ringR = 14 + easeOutCubic(swU) * 290;
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - swU})`;
            ctx.lineWidth = 6 * (1 - swU) + 1;
            ctx.beginPath();
            ctx.arc(810, 620, ringR, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Minimal HUD gravity flip badge in Cut 4
          ctx.fillStyle = 'rgba(11, 13, 18, 0.82)';
          ctx.strokeStyle = gravityReturned ? '#FF4D2A' : '#00E5FF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(1490, 56, 370, 52, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = gravityReturned ? '#FF4D2A' : '#00E5FF';
          ctx.font = '700 21px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            gravityReturned ? 'GIA TỐC: g = 9.80 m/s²' : 'GIA TỐC: g = 0.00 m/s²',
            1512,
            83
          );

          drawSubtitle(
            ctx,
            'Minh Quân: Vì Vật lí chính là quy luật vận hành cả thế giới này.',
            clamp01(localT / 0.3)
          );
        } else {
          // CUT 5 (15.5s – 18.0s): Pull back into Cinematic Title Card
          const cardT = t - 15.5;
          const pull = 1 - 0.08 * easeOutCubic(cardT / 2.2);
          ctx.translate(LOGICAL_W * 0.5, LOGICAL_H * 0.5);
          ctx.scale(pull, pull);
          ctx.translate(-LOGICAL_W * 0.5, -LOGICAL_H * 0.5);
          Assets.drawShot4_CafeTwoShot(ctx, t - 11.5, 710);
          ctx.restore();
          ctx.save();
          drawTitleCard(ctx, t, cardT);
        }

        ctx.restore();
      }

      if (playing) {
        drawCinemaFrameAndTimecode(ctx, t);
      }

      if (playing && !finished && movieTime >= TOTAL_DURATION) {
        finishIntro();
        return;
      }

      if (!finished) {
        rafId = requestAnimationFrame(renderFrame);
      }
    }

    rafId = requestAnimationFrame(renderFrame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountIntroMovie);
  } else {
    mountIntroMovie();
  }
})();
