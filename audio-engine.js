/**
 * audio-engine.js
 * Self-contained procedural Web Audio API + SpeechSynthesis engine
 * for Grade 10 Physics 2D Animated Intro (1920x1080, 60 FPS).
 *
 * Exposes: window.IntroAudio
 * Zero external audio files required.
 */
(function (global) {
  'use strict';

  const AudioCtx = global.AudioContext || global.webkitAudioContext;

  // =========================================================================
  // 1. State & Configuration
  // =========================================================================
  const MUSIC_GAIN_NORMAL = 0.16;
  const MUSIC_GAIN_DUCKED = 0.06;
  const BPM = 75;
  const BEAT_SEC = 60 / BPM; // 0.8s per beat
  const BAR_SEC = BEAT_SEC * 4; // 3.2s per bar

  // Warm lo-fi progression: Fmaj7 -> Em7 -> Dm7 -> Cmaj7
  const CHORD_PROGRESSION = [
    {
      name: 'Fmaj7',
      bass: 87.31, // F2
      notes: [174.61, 220.0, 261.63, 329.63, 440.0], // F3 A3 C4 E4 A4
    },
    {
      name: 'Em7',
      bass: 82.41, // E2
      notes: [164.81, 196.0, 246.94, 293.66, 392.0], // E3 G3 B3 D4 G4
    },
    {
      name: 'Dm7',
      bass: 73.42, // D2
      notes: [146.83, 174.61, 220.0, 261.63, 349.23], // D3 F3 A3 C4 F4
    },
    {
      name: 'Cmaj7',
      bass: 65.41, // C2
      notes: [130.81, 164.81, 196.0, 246.94, 329.63], // C3 E3 G3 B3 E4
    },
  ];

  let ctx = null;
  let masterGain = null;
  let compressor = null;
  let musicBusGain = null;
  let musicInputNode = null;
  let musicLowpass = null;
  let sfxBusGain = null;

  // Reusable noise buffers
  let pinkNoiseBuffer = null;
  let whiteNoiseBuffer = null;

  // Music scheduler state
  let isMusicPlaying = false;
  let schedulerTimerId = null;
  let nextChordTime = 0;
  let chordStepIndex = 0;
  let roomToneSource = null;
  let roomToneGain = null;
  let activeMusicNodes = new Set();

  // Speech & mouth-sync state
  let selectedViVoice = null;
  let voicesInitialized = false;
  let isSpeaking = false;
  let speechStartPerf = 0;
  let speechFallbackTimer = null;
  let activeUtterance = null;
  let mouthEnvelope = 0;
  let lastMouthQueryTime = 0;
  let muted = false;

  // =========================================================================
  // 2. AudioContext & Master Routing Setup
  // =========================================================================
  function ensureContext() {
    if (!AudioCtx) return null;

    if (!ctx) {
      ctx = new AudioCtx();
      buildAudioGraph();
      buildNoiseBuffers();
    }

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    return ctx;
  }

  function createPanner(panValue) {
    if (typeof ctx.createStereoPanner === 'function') {
      const p = ctx.createStereoPanner();
      p.pan.value = panValue;
      return p;
    }
    const g = ctx.createGain();
    g.gain.value = 1;
    return g;
  }

  function buildAudioGraph() {
    // Master safety compressor -> destination
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-14, ctx.currentTime);
    compressor.knee.setValueAtTime(18, ctx.currentTime);
    compressor.ratio.setValueAtTime(4, ctx.currentTime);
    compressor.attack.setValueAtTime(0.005, ctx.currentTime);
    compressor.release.setValueAtTime(0.18, ctx.currentTime);

    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(muted ? 0 : 1.0, ctx.currentTime);
    masterGain.connect(compressor);
    compressor.connect(ctx.destination);

    // Independent SFX bus (stays punchy during narration ducking)
    sfxBusGain = ctx.createGain();
    sfxBusGain.gain.setValueAtTime(0.85, ctx.currentTime);
    sfxBusGain.connect(masterGain);

    // Music bus (ducked smoothly between 0.16 and 0.06 when speaking)
    musicBusGain = ctx.createGain();
    musicBusGain.gain.setValueAtTime(
      isSpeaking ? MUSIC_GAIN_DUCKED : MUSIC_GAIN_NORMAL,
      ctx.currentTime
    );
    musicBusGain.connect(masterGain);

    // Warm low-pass filter (~900Hz) for lo-fi electric piano + pad
    musicLowpass = ctx.createBiquadFilter();
    musicLowpass.type = 'lowpass';
    musicLowpass.frequency.setValueAtTime(900, ctx.currentTime);
    musicLowpass.Q.setValueAtTime(0.75, ctx.currentTime);

    musicInputNode = ctx.createGain();
    musicInputNode.gain.setValueAtTime(1.0, ctx.currentTime);
    musicInputNode.connect(musicLowpass);

    // Dry path
    const dryGain = ctx.createGain();
    dryGain.gain.setValueAtTime(0.82, ctx.currentTime);
    musicLowpass.connect(dryGain);
    dryGain.connect(musicBusGain);

    // Gentle stereo ping-pong delay for lush lo-fi space
    const delayL = ctx.createDelay(1.0);
    const delayR = ctx.createDelay(1.0);
    delayL.delayTime.setValueAtTime(BEAT_SEC * 0.375, ctx.currentTime); // dotted-16th feel (~0.30s)
    delayR.delayTime.setValueAtTime(BEAT_SEC * 0.5, ctx.currentTime);   // 8th-note feel (0.40s)

    const delayToneL = ctx.createBiquadFilter();
    delayToneL.type = 'lowpass';
    delayToneL.frequency.setValueAtTime(1150, ctx.currentTime);

    const delayToneR = ctx.createBiquadFilter();
    delayToneR.type = 'lowpass';
    delayToneR.frequency.setValueAtTime(1150, ctx.currentTime);

    const fbL = ctx.createGain();
    const fbR = ctx.createGain();
    fbL.gain.setValueAtTime(0.26, ctx.currentTime);
    fbR.gain.setValueAtTime(0.24, ctx.currentTime);

    const panL = createPanner(-0.58);
    const panR = createPanner(0.58);

    const wetGain = ctx.createGain();
    wetGain.gain.setValueAtTime(0.28, ctx.currentTime);

    musicLowpass.connect(delayL);
    musicLowpass.connect(delayR);

    delayL.connect(delayToneL);
    delayToneL.connect(panL);
    panL.connect(wetGain);

    delayR.connect(delayToneR);
    delayToneR.connect(panR);
    panR.connect(wetGain);

    // Subtle cross-feedback
    delayToneL.connect(fbL);
    fbL.connect(delayR);
    delayToneR.connect(fbR);
    fbR.connect(delayL);

    wetGain.connect(musicBusGain);
  }

  function buildNoiseBuffers() {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 3; // 3-second seamless noise buffer

    // White noise buffer
    whiteNoiseBuffer = ctx.createBuffer(1, length, sampleRate);
    const whiteData = whiteNoiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      whiteData[i] = Math.random() * 2 - 1;
    }

    // Pink noise buffer (Paul Kellet's refined filter)
    pinkNoiseBuffer = ctx.createBuffer(1, length, sampleRate);
    const pinkData = pinkNoiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const sample = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.055;
      b6 = white * 0.115926;
      pinkData[i] = Math.max(-1, Math.min(1, sample));
    }
  }

  function updateMusicDucking(speaking) {
    if (!ctx || !musicBusGain) return;
    const now = ctx.currentTime;
    const target = speaking ? MUSIC_GAIN_DUCKED : MUSIC_GAIN_NORMAL;
    musicBusGain.gain.cancelScheduledValues(now);
    musicBusGain.gain.setValueAtTime(musicBusGain.gain.value, now);
    // Smooth duck down (~0.18s) and gentle release (~0.45s)
    musicBusGain.gain.setTargetAtTime(target, now, speaking ? 0.12 : 0.32);
  }

  // =========================================================================
  // 3. Continuous Warm Lo-Fi Ambient Underscore
  // =========================================================================
  function trackMusicNode(node) {
    activeMusicNodes.add(node);
    node.onended = () => {
      activeMusicNodes.delete(node);
    };
  }

  function startRoomTone() {
    if (!ctx || !pinkNoiseBuffer || roomToneSource) return;

    const src = ctx.createBufferSource();
    src.buffer = pinkNoiseBuffer;
    src.loop = true;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(110, ctx.currentTime);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(680, ctx.currentTime);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 1.2);

    src.connect(hp);
    hp.connect(lp);
    lp.connect(g);
    g.connect(musicBusGain);

    src.start(ctx.currentTime);
    roomToneSource = src;
    roomToneGain = g;
  }

  function stopRoomTone() {
    if (!roomToneSource || !ctx) return;
    const now = ctx.currentTime;
    try {
      roomToneGain.gain.cancelScheduledValues(now);
      roomToneGain.gain.setValueAtTime(roomToneGain.gain.value, now);
      roomToneGain.gain.linearRampToValueAtTime(0.0001, now + 0.35);
      roomToneSource.stop(now + 0.4);
    } catch (_) {}
    roomToneSource = null;
    roomToneGain = null;
  }

  function scheduleElectricPianoNote(freq, startTime, duration, velocity) {
    // Warm Rhodes-style electric piano: fundamental sine + gentle 2nd harmonic tine + soft pad
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.linearRampToValueAtTime(velocity, startTime + 0.028);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.48, startTime + 0.45);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    const oscMain = ctx.createOscillator();
    oscMain.type = 'sine';
    oscMain.frequency.setValueAtTime(freq, startTime);
    // Subtle lo-fi tape wow/detune
    oscMain.detune.setValueAtTime((Math.random() - 0.5) * 6, startTime);

    const oscWarm = ctx.createOscillator();
    oscWarm.type = 'triangle';
    oscWarm.frequency.setValueAtTime(freq, startTime);
    oscWarm.detune.setValueAtTime(4.5, startTime);

    const warmMix = ctx.createGain();
    warmMix.gain.setValueAtTime(0.28, startTime);

    // Subtle bell tine transient
    const oscTine = ctx.createOscillator();
    oscTine.type = 'sine';
    oscTine.frequency.setValueAtTime(freq * 2, startTime);

    const tineGain = ctx.createGain();
    tineGain.gain.setValueAtTime(0.0001, startTime);
    tineGain.gain.linearRampToValueAtTime(velocity * 0.22, startTime + 0.006);
    tineGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);

    oscMain.connect(noteGain);
    oscWarm.connect(warmMix);
    warmMix.connect(noteGain);
    oscTine.connect(tineGain);
    tineGain.connect(musicInputNode);
    noteGain.connect(musicInputNode);

    const stopAt = startTime + duration + 0.05;
    oscMain.start(startTime);
    oscWarm.start(startTime);
    oscTine.start(startTime);
    oscMain.stop(stopAt);
    oscWarm.stop(stopAt);
    oscTine.stop(startTime + 0.25);

    trackMusicNode(oscMain);
    trackMusicNode(oscWarm);
    trackMusicNode(oscTine);
  }

  function scheduleSubBassPulse(freq, startTime, duration, peak) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(peak, startTime + 0.05);
    g.gain.exponentialRampToValueAtTime(peak * 0.65, startTime + duration * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(g);
    g.connect(musicInputNode);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.04);
    trackMusicNode(osc);
  }

  function scheduleLoFiPulseHat(startTime) {
    if (!whiteNoiseBuffer) return;
    // Ultra-soft lo-fi brush/vinyl tick to keep 75 BPM groove alive
    const src = ctx.createBufferSource();
    src.buffer = whiteNoiseBuffer;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2400, startTime);
    bp.Q.setValueAtTime(1.8, startTime);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(0.045, startTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.07);

    src.connect(bp);
    bp.connect(g);
    g.connect(musicBusGain);

    src.start(startTime);
    src.stop(startTime + 0.08);
    trackMusicNode(src);
  }

  function scheduleChordBar(chord, barStart) {
    // Strummed electric-piano chord voicing (gentle 22ms roll across notes)
    chord.notes.forEach((freq, idx) => {
      const strumOffset = idx * 0.022;
      const vel = idx === 0 ? 0.16 : 0.125;
      scheduleElectricPianoNote(freq, barStart + strumOffset, BAR_SEC * 0.96, vel);
    });

    // Soft sub-bass pulses (beat 1 & gentle syncopated beat 2.5 + beat 3.5)
    scheduleSubBassPulse(chord.bass, barStart, BEAT_SEC * 1.45, 0.34);
    scheduleSubBassPulse(chord.bass, barStart + BEAT_SEC * 1.5, BEAT_SEC * 0.9, 0.20);
    scheduleSubBassPulse(chord.bass, barStart + BEAT_SEC * 2.5, BEAT_SEC * 1.25, 0.24);

    // Subtle lo-fi brush pulse on off-beats
    scheduleLoFiPulseHat(barStart + BEAT_SEC * 1);
    scheduleLoFiPulseHat(barStart + BEAT_SEC * 2);
    scheduleLoFiPulseHat(barStart + BEAT_SEC * 3);
  }

  function musicSchedulerTick() {
    if (!isMusicPlaying || !ctx) return;
    const lookahead = 0.25;
    while (nextChordTime < ctx.currentTime + lookahead) {
      const chord = CHORD_PROGRESSION[chordStepIndex % CHORD_PROGRESSION.length];
      scheduleChordBar(chord, nextChordTime);
      nextChordTime += BAR_SEC;
      chordStepIndex = (chordStepIndex + 1) % CHORD_PROGRESSION.length;
    }
  }

  function startMusic() {
    const audioCtx = ensureContext();
    if (!audioCtx) return false;
    if (isMusicPlaying) return true;

    isMusicPlaying = true;
    chordStepIndex = 0;
    nextChordTime = audioCtx.currentTime + 0.04;

    updateMusicDucking(isSpeaking);
    startRoomTone();

    musicSchedulerTick();
    schedulerTimerId = global.setInterval(musicSchedulerTick, 100);
    return true;
  }

  function stopMusic() {
    isMusicPlaying = false;
    if (schedulerTimerId !== null) {
      global.clearInterval(schedulerTimerId);
      schedulerTimerId = null;
    }

    stopRoomTone();

    if (ctx) {
      const now = ctx.currentTime;
      activeMusicNodes.forEach((node) => {
        try {
          node.stop(now + 0.05);
        } catch (_) {}
      });
    }
    activeMusicNodes.clear();
  }

  // =========================================================================
  // 4. Rich Procedural Foley SFX Library
  // =========================================================================
  function playWhoosh(now) {
    if (!whiteNoiseBuffer) return;
    const dur = 0.28;

    const src = ctx.createBufferSource();
    src.buffer = whiteNoiseBuffer;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.setValueAtTime(1.6, now);
    bp.frequency.setValueAtTime(200, now);
    bp.frequency.exponentialRampToValueAtTime(1400, now + dur * 0.42);
    bp.frequency.exponentialRampToValueAtTime(300, now + dur);

    // Subtle air body
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(260, now + dur * 0.45);
    subOsc.frequency.exponentialRampToValueAtTime(95, now + dur);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(0.14, now + dur * 0.35);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.55, now + dur * 0.36);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(bp);
    bp.connect(g);
    g.connect(sfxBusGain);

    subOsc.connect(subGain);
    subGain.connect(sfxBusGain);

    src.start(now);
    src.stop(now + dur + 0.02);
    subOsc.start(now);
    subOsc.stop(now + dur + 0.02);
  }

  function playZeroG(now) {
    const dur = 1.15;

    // Ethereal rising harmonic shimmer: sine + detuned triangle oscillators (220Hz -> 660Hz)
    const freqs = [
      { type: 'sine', start: 220, end: 660, detune: 0, gain: 0.22 },
      { type: 'triangle', start: 220, end: 660, detune: -9, gain: 0.14 },
      { type: 'triangle', start: 220, end: 660, detune: 11, gain: 0.14 },
      { type: 'sine', start: 330, end: 990, detune: 5, gain: 0.09 },
    ];

    const shimmerLPF = ctx.createBiquadFilter();
    shimmerLPF.type = 'lowpass';
    shimmerLPF.frequency.setValueAtTime(900, now);
    shimmerLPF.frequency.exponentialRampToValueAtTime(3400, now + dur * 0.85);
    shimmerLPF.Q.setValueAtTime(2.2, now);

    const masterZeroG = ctx.createGain();
    masterZeroG.gain.setValueAtTime(0.0001, now);
    masterZeroG.gain.linearRampToValueAtTime(0.75, now + 0.22);
    masterZeroG.gain.exponentialRampToValueAtTime(0.45, now + dur * 0.72);
    masterZeroG.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    shimmerLPF.connect(masterZeroG);
    masterZeroG.connect(sfxBusGain);

    freqs.forEach((cfg) => {
      const osc = ctx.createOscillator();
      osc.type = cfg.type;
      osc.frequency.setValueAtTime(cfg.start, now);
      osc.frequency.exponentialRampToValueAtTime(cfg.end, now + dur * 0.92);
      osc.detune.setValueAtTime(cfg.detune, now);

      const g = ctx.createGain();
      g.gain.setValueAtTime(cfg.gain, now);

      osc.connect(g);
      g.connect(shimmerLPF);
      osc.start(now);
      osc.stop(now + dur + 0.04);
    });
  }

  function playBubble(now) {
    const dur = 0.09;
    // Slight pitch randomization so multiple coffee droplets sound organic
    const jitter = 0.92 + Math.random() * 0.18;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(950 * jitter, now + dur * 0.85);

    const res = ctx.createBiquadFilter();
    res.type = 'bandpass';
    res.frequency.setValueAtTime(780 * jitter, now);
    res.Q.setValueAtTime(3.5, now);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.42, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(res);
    res.connect(g);
    g.connect(sfxBusGain);

    osc.start(now);
    osc.stop(now + dur + 0.015);
  }

  function playSnap(now) {
    // 1. Sharp transient finger-snap click
    const clickOsc = ctx.createOscillator();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(1900, now);
    clickOsc.frequency.exponentialRampToValueAtTime(340, now + 0.024);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.65, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

    clickOsc.connect(clickGain);
    clickGain.connect(sfxBusGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.032);

    // 2. High-Q bandpass noise burst + short room decay
    if (whiteNoiseBuffer) {
      const burstSrc = ctx.createBufferSource();
      burstSrc.buffer = whiteNoiseBuffer;

      const highQ = ctx.createBiquadFilter();
      highQ.type = 'bandpass';
      highQ.frequency.setValueAtTime(2650, now);
      highQ.Q.setValueAtTime(6.5, now);

      const burstGain = ctx.createGain();
      burstGain.gain.setValueAtTime(0.0001, now);
      burstGain.gain.linearRampToValueAtTime(0.8, now + 0.003);
      burstGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

      burstSrc.connect(highQ);
      highQ.connect(burstGain);
      burstGain.connect(sfxBusGain);

      burstSrc.start(now);
      burstSrc.stop(now + 0.065);

      // Short room reflection tail
      const roomSrc = ctx.createBufferSource();
      roomSrc.buffer = whiteNoiseBuffer;

      const roomLP = ctx.createBiquadFilter();
      roomLP.type = 'bandpass';
      roomLP.frequency.setValueAtTime(1450, now);
      roomLP.Q.setValueAtTime(1.2, now);

      const roomGain = ctx.createGain();
      roomGain.gain.setValueAtTime(0.0001, now + 0.012);
      roomGain.gain.linearRampToValueAtTime(0.16, now + 0.022);
      roomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);

      roomSrc.connect(roomLP);
      roomLP.connect(roomGain);
      roomGain.connect(sfxBusGain);

      roomSrc.start(now + 0.01);
      roomSrc.stop(now + 0.21);
    }
  }

  function playThud(now) {
    // 1. Heavy low-end impact (140Hz -> 38Hz pitch drop)
    const bodyOsc = ctx.createOscillator();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(140, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(38, now + 0.14);

    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(0.0001, now);
    bodyGain.gain.linearRampToValueAtTime(0.88, now + 0.008);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(sfxBusGain);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.30);

    // Punchy wood-knock transient
    const knockOsc = ctx.createOscillator();
    knockOsc.type = 'triangle';
    knockOsc.frequency.setValueAtTime(240, now);
    knockOsc.frequency.exponentialRampToValueAtTime(72, now + 0.06);

    const knockGain = ctx.createGain();
    knockGain.gain.setValueAtTime(0.45, now);
    knockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

    knockOsc.connect(knockGain);
    knockGain.connect(sfxBusGain);
    knockOsc.start(now);
    knockOsc.stop(now + 0.09);

    // 2. Table rattle noise
    if (whiteNoiseBuffer) {
      const rattleSrc = ctx.createBufferSource();
      rattleSrc.buffer = whiteNoiseBuffer;

      const rattleLP = ctx.createBiquadFilter();
      rattleLP.type = 'bandpass';
      rattleLP.frequency.setValueAtTime(320, now);
      rattleLP.Q.setValueAtTime(1.4, now);

      const rattleGain = ctx.createGain();
      rattleGain.gain.setValueAtTime(0.0001, now);
      rattleGain.gain.linearRampToValueAtTime(0.42, now + 0.01);
      rattleGain.gain.exponentialRampToValueAtTime(0.14, now + 0.08);
      rattleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      rattleSrc.connect(rattleLP);
      rattleLP.connect(rattleGain);
      rattleGain.connect(sfxBusGain);

      rattleSrc.start(now);
      rattleSrc.stop(now + 0.24);
    }
  }

  function playTick(now) {
    // Crisp mechanical telemetry click
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.014);

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(1100, now);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.28, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

    osc.connect(hp);
    hp.connect(g);
    g.connect(sfxBusGain);

    osc.start(now);
    osc.stop(now + 0.028);

    // Subtle micro-click burst
    if (whiteNoiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = whiteNoiseBuffer;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(4200, now);
      bp.Q.setValueAtTime(3.0, now);

      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.22, now);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

      src.connect(bp);
      bp.connect(ng);
      ng.connect(sfxBusGain);

      src.start(now);
      src.stop(now + 0.02);
    }
  }

  function playSFX(name) {
    const audioCtx = ensureContext();
    if (!audioCtx || muted) return;

    const now = audioCtx.currentTime;
    switch (name) {
      case 'whoosh':
        playWhoosh(now);
        break;
      case 'zeroG':
        playZeroG(now);
        break;
      case 'bubble':
        playBubble(now);
        break;
      case 'snap':
        playSnap(now);
        break;
      case 'thud':
        playThud(now);
        break;
      case 'tick':
        playTick(now);
        break;
      default:
        break;
    }
  }

  // =========================================================================
  // 5. Vietnamese Narration & Real-Time Mouth-Sync Amplitude
  // =========================================================================
  function pickVietnameseVoice() {
    if (!('speechSynthesis' in global)) return null;
    const voices = global.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;

    const viVoices = voices.filter(
      (v) => v.lang && v.lang.toLowerCase().startsWith('vi')
    );
    if (!viVoices.length) return null;

    // Prefer natural/neural/Google/Microsoft Vietnamese voices when available
    const preferred = viVoices.find((v) =>
      /google|microsoft|natural|neural|hoaimy|namminh|linh|an/i.test(v.name)
    );
    return preferred || viVoices[0];
  }

  function initVoices() {
    if (voicesInitialized || !('speechSynthesis' in global)) return;
    voicesInitialized = true;
    selectedViVoice = pickVietnameseVoice();
    if (typeof global.speechSynthesis.addEventListener === 'function') {
      global.speechSynthesis.addEventListener('voiceschanged', () => {
        selectedViVoice = pickVietnameseVoice();
      });
    } else {
      global.speechSynthesis.onvoiceschanged = () => {
        selectedViVoice = pickVietnameseVoice();
      };
    }
  }

  function finishSpeakingState() {
    if (speechFallbackTimer !== null) {
      global.clearTimeout(speechFallbackTimer);
      speechFallbackTimer = null;
    }
    activeUtterance = null;
    if (isSpeaking) {
      isSpeaking = false;
      updateMusicDucking(false);
    }
  }

  function stopSpeech() {
    if ('speechSynthesis' in global) {
      try {
        global.speechSynthesis.cancel();
      } catch (_) {}
    }
    finishSpeakingState();
  }

  function speak(text, rate) {
    ensureContext();
    initVoices();

    const cleanText = typeof text === 'string' ? text.trim() : '';
    if (!cleanText) {
      stopSpeech();
      return Promise.resolve();
    }

    const speechRate =
      typeof rate === 'number' && rate > 0.25 && rate <= 3 ? rate : 1.0;

    // Cancel any previous utterance cleanly
    stopSpeech();

    // Estimate duration for safety fallback (prevents stuck ducking/mouth if browser drops onend)
    const words = cleanText.split(/\s+/).length;
    const estimatedMs = Math.max(1200, (words / (2.5 * speechRate)) * 1000 + 900);

    isSpeaking = true;
    speechStartPerf = performance.now() / 1000;
    updateMusicDucking(true);

    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        finishSpeakingState();
        resolve();
      };

      // Safety fallback timeout
      speechFallbackTimer = global.setTimeout(done, estimatedMs + 1500);

      // Graceful fallback if speechSynthesis is unavailable or muted
      if (!('speechSynthesis' in global) || typeof global.SpeechSynthesisUtterance !== 'function') {
        global.clearTimeout(speechFallbackTimer);
        speechFallbackTimer = global.setTimeout(done, estimatedMs);
        return;
      }

      try {
        const utterance = new global.SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'vi-VN';
        utterance.rate = speechRate;
        utterance.pitch = 1.02;
        utterance.volume = muted ? 0 : 1.0;

        if (!selectedViVoice) {
          selectedViVoice = pickVietnameseVoice();
        }
        if (selectedViVoice) {
          utterance.voice = selectedViVoice;
        }

        utterance.onend = done;
        utterance.onerror = done;

        // Keep reference so Chromium does not GC utterance mid-speech
        activeUtterance = utterance;

        global.speechSynthesis.speak(utterance);

        // If browser speech queue is muted/paused at OS level and never starts,
        // fallback timer still guarantees mouth-sync & music ducking recover cleanly.
      } catch (_) {
        global.clearTimeout(speechFallbackTimer);
        speechFallbackTimer = global.setTimeout(done, estimatedMs);
      }
    });
  }

  /**
   * Returns smooth 0.0 -> 1.0 mouth aperture driven by active speech syllable cadence.
   * @param {number} [t] - Current animation timestamp in seconds.
   * @returns {number}
   */
  function getMouthOpen(t) {
    const nowSec = typeof t === 'number' && Number.isFinite(t) ? t : performance.now() / 1000;
    const dt = lastMouthQueryTime > 0 ? Math.min(0.1, Math.max(0.001, nowSec - lastMouthQueryTime)) : 1 / 60;
    lastMouthQueryTime = nowSec;

    let target = 0;
    if (isSpeaking) {
      const localT = Math.max(0, nowSec - speechStartPerf);
      // Organic syllable cadence with subtle phrasing pauses
      const cadence = Math.abs(Math.sin(nowSec * 18) * Math.cos(nowSec * 11));
      const phraseGate = 0.72 + 0.28 * Math.sin(localT * 3.1);
      target = Math.min(1, Math.max(0, cadence * phraseGate * 1.15));
    }

    // Smooth attack & release so character jaws never snap harshly
    const smoothing = isSpeaking ? 1 - Math.exp(-26 * dt) : 1 - Math.exp(-16 * dt);
    mouthEnvelope += (target - mouthEnvelope) * smoothing;

    if (!isSpeaking && mouthEnvelope < 0.005) {
      mouthEnvelope = 0;
    }

    return Math.min(1, Math.max(0, mouthEnvelope));
  }

  // =========================================================================
  // 6. Utilities & Public API
  // =========================================================================
  function setMuted(isMuted) {
    muted = Boolean(isMuted);
    if (ctx && masterGain) {
      const now = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setTargetAtTime(muted ? 0 : 1.0, now, 0.03);
    }
    if (muted && 'speechSynthesis' in global) {
      try {
        global.speechSynthesis.cancel();
      } catch (_) {}
      finishSpeakingState();
    }
  }

  function unlock() {
    initVoices();
    return Boolean(ensureContext());
  }

  initVoices();

  global.IntroAudio = {
    // Lifecycle
    init: unlock,
    unlock,
    setMuted,
    isMuted: () => muted,
    isSpeaking: () => isSpeaking,
    isMusicPlaying: () => isMusicPlaying,

    // Ambient underscore
    startMusic,
    stopMusic,

    // Procedural Foley SFX
    playSFX,

    // Vietnamese narration & mouth-sync
    speak,
    stopSpeech,
    getMouthOpen,
  };
})(window);
