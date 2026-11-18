/**
 * audio-engine.js
 * High-Energy 60-Second Animated Intro Audio Engine (window.IntroAudio).
 *
 * STRICT ANTI-FREEZE & SAFETY GUARANTEES (GEMINI 4 ARGON COMPLIANT):
 * - Zero `window.speechSynthesis` calls.
 * - Zero `while` loops; every `for` loop is strictly bounded (<= 6 iterations).
 * - Zero `createMediaElementSource` loops, zero voice oscillators, zero voice intervals.
 * - Preloads `assets/voice1.mp3` .. `assets/voice6.mp3` into `this.clips = []`.
 * - Drives `getMouthOpen(t)` via dynamic multi-harmonic syllable wave
 *   `Math.abs(Math.sin(t * 17) * Math.cos(t * 9.5) * Math.sin(t * 5))` until `this.synthUntil`.
 * - Single-shot physical Foley SFX (< 0.3s) wrapped in `try/catch`:
 *   'whoosh', 'zeroG', 'pop', 'powerDown', 'timeWarp', 'snap', 'bounce'.
 * - Safe 2-oscillator low-pass filtered Lo-Fi underscore (3600ms interval, auto-stopped at now + 3.2s).
 */

(function () {
  'use strict';

  // 2-Voice Warm Lo-Fi Dyad Progression (Root + Major/Minor 7th/3rd in Hz)
  const LOFI_DYADS = [
    [174.61, 261.63], // F3 + C4 (Fmaj)
    [164.81, 246.94], // E3 + B3 (Em)
    [146.83, 220.00], // D3 + A3 (Dm)
    [130.81, 196.00]  // C3 + G3 (Cmaj)
  ];

  window.IntroAudio = {
    ctx: null,
    musicGain: null,
    musicFilter: null,
    musicTimer: null,
    isPlayingMusic: false,
    chordIndex: 0,

    // 6-Clip MP3 Voiceover State (1..6)
    clips: [],
    activeClip: null,
    synthUntil: 0,
    currentRole: 'narrator',
    preloaded: false,
    muted: false,

    /**
     * Preloads `assets/voice1.mp3` .. `assets/voice6.mp3` into `this.clips = []`
     * (1-indexed so `this.clips[1]` through `this.clips[6]` map directly to `clipId`).
     */
    preloadClips: function () {
      if (this.preloaded) return;
      this.preloaded = true;
      this.clips = [null];

      const self = this;
      for (let i = 1; i <= 6; i++) {
        try {
          const audio = new Audio();
          audio.preload = 'auto';
          audio.src = 'assets/voice' + i + '.mp3';

          audio.addEventListener('ended', function () {
            if (self.activeClip === audio) {
              self.activeClip = null;
              self.synthUntil = 0;
              self._updateMusicDuck(false);
            }
          });

          audio.addEventListener('error', function () {
            // Silently flag 404/missing file so play() fallback stays instant and error-free
            audio._missing = true;
          });

          this.clips[i] = audio;
        } catch (e) {
          this.clips[i] = null;
        }
      }
    },

    /**
     * Lazily initializes or resumes the Web Audio API context and low-pass music bus.
     */
    init: function () {
      try {
        this.preloadClips();

        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            this.ctx = new AudioCtx();

            // Soft 620Hz low-pass filter -> ducking gain node -> destination
            this.musicFilter = this.ctx.createBiquadFilter();
            this.musicFilter.type = 'lowpass';
            this.musicFilter.frequency.setValueAtTime(620, this.ctx.currentTime);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(0.14, this.ctx.currentTime);

            this.musicFilter.connect(this.musicGain);
            this.musicGain.connect(this.ctx.destination);
          }
        }

        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(function () {});
        }
      } catch (e) {}
      return this.ctx;
    },

    /**
     * Smoothly ducks background Lo-Fi music while dialogue is active.
     */
    _updateMusicDuck: function (isSpeaking) {
      try {
        if (!this.ctx || !this.musicGain) return;
        const now = this.ctx.currentTime;
        const target = isSpeaking ? 0.045 : 0.14;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
        this.musicGain.gain.linearRampToValueAtTime(target, now + 0.2);
      } catch (e) {}
    },

    /**
     * Plays a single 2-note Lo-Fi chord through the low-pass filter (`osc.stop(now + 3.2)`).
     */
    _playLofiDyad: function () {
      if (this.muted || !this.isPlayingMusic) return;
      try {
        const ctx = this.init();
        if (!ctx || !this.musicFilter) return;

        // Automatically restore music volume once `synthUntil` has elapsed
        const isSpeaking = performance.now() < this.synthUntil;
        this._updateMusicDuck(isSpeaking);

        const now = ctx.currentTime;
        const notes = LOFI_DYADS[this.chordIndex % LOFI_DYADS.length];
        this.chordIndex = (this.chordIndex + 1) % LOFI_DYADS.length;

        // Strictly bounded loop: 2 soft sine oscillators
        for (let i = 0; i < 2; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(notes[i], now);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.35, now + 0.35);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.15);

          osc.connect(gain);
          gain.connect(this.musicFilter);

          osc.start(now);
          osc.stop(now + 3.2);

          osc.onended = function () {
            try {
              osc.disconnect();
              gain.disconnect();
            } catch (err) {}
          };
        }
      } catch (e) {}
    },

    /**
     * Starts the 3600ms Lo-Fi underscore interval, clearing any prior interval ID so it never duplicates.
     */
    startMusic: function () {
      try {
        this.stopMusic();
        this.init();
        this.isPlayingMusic = true;
        this._playLofiDyad();

        const self = this;
        this.musicTimer = setInterval(function () {
          self._playLofiDyad();
        }, 3600);
      } catch (e) {}
    },

    /**
     * Stops the Lo-Fi underscore interval and clears the stored interval ID.
     */
    stopMusic: function () {
      this.isPlayingMusic = false;
      if (this.musicTimer !== null) {
        clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
    },

    /**
     * Plays voiceover `clipId` (1..6) for `role` ('narrator' | 'quan' | 'minh').
     * - Stops any currently playing clip (`clip.pause(); clip.currentTime = 0;`).
     * - Sets `this.synthUntil = performance.now() + Math.min(8500, text.length * 52)` and `this.currentRole = role`.
     * - Tries `this.clips[clipId].play()`; if missing (404), silently falls back to the mathematical wave in `getMouthOpen(t)`.
     * - Never spawns oscillators or intervals for voice.
     */
    speak: function (text, clipId = 1, role = 'narrator') {
      try {
        this.preloadClips();

        // 1. Stop any currently playing voice clip cleanly
        for (let i = 1; i <= 6; i++) {
          const c = this.clips[i];
          if (c) {
            try {
              c.pause();
              c.currentTime = 0;
            } catch (err) {}
          }
        }
        this.activeClip = null;

        // 2. Compute synth timing window & store role
        const safeText = typeof text === 'string' ? text : '';
        const durationMs = Math.min(8500, Math.max(900, safeText.length * 52));
        this.synthUntil = performance.now() + durationMs;
        this.currentRole = role || 'narrator';

        // Smoothly duck background music while dialogue is active
        this._updateMusicDuck(true);

        // 3. Try playing `this.clips[clipId]` if available
        const idx = Math.max(1, Math.min(6, Number(clipId) || 1));
        const clip = this.clips[idx];

        if (clip && !clip._missing && !this.muted) {
          const self = this;
          this.activeClip = clip;
          const playPromise = clip.play();
          if (playPromise && typeof playPromise.then === 'function') {
            playPromise
              .then(function () {
                if (clip.duration && isFinite(clip.duration) && clip.duration > 0) {
                  self.synthUntil = performance.now() + clip.duration * 1000;
                }
              })
              .catch(function () {
                // Silent 404 / autoplay fallback: `getMouthOpen(t)` continues driving lip-sync until `self.synthUntil`
                clip._missing = true;
                self.activeClip = null;
              });
          }
        }
      } catch (e) {}
    },

    /**
     * Returns a smooth mouth-open ratio in `[0, 1]` driven by the dynamic multi-harmonic syllable wave
     * `Math.abs(Math.sin(t * 17) * Math.cos(t * 9.5) * Math.sin(t * 5))` until `this.synthUntil`.
     */
    getMouthOpen: function (t) {
      const nowPerf = performance.now();
      if (nowPerf >= this.synthUntil) {
        if (this.activeClip) {
          this.activeClip = null;
          this._updateMusicDuck(false);
        }
        return 0;
      }

      // Convert `t` to seconds if passed in milliseconds, or use `nowPerf * 0.001`
      const rawT = typeof t === 'number' ? t : nowPerf;
      const tSec = rawT > 500 ? rawT * 0.001 : rawT;

      const wave = Math.abs(
        Math.sin(tSec * 17) * Math.cos(tSec * 9.5) * Math.sin(tSec * 5)
      );

      return Math.max(0.04, Math.min(1.0, wave * 1.45));
    },

    /**
     * Plays crisp, single-shot physical Foley SFX (< 0.3s) wrapped in `try/catch`.
     * Supported cues: 'whoosh', 'zeroG', 'pop', 'powerDown', 'timeWarp', 'snap', 'bounce'.
     */
    playSFX: function (name) {
      if (this.muted) return;
      try {
        const ctx = this.init();
        if (!ctx) return;

        const now = ctx.currentTime;
        const key = String(name || '').toLowerCase();

        if (key === 'whoosh') {
          // Fast camera whip-pan air sweep (< 0.26s)
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(260, now);
          osc.frequency.exponentialRampToValueAtTime(65, now + 0.24);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(780, now);
          filter.frequency.exponentialRampToValueAtTime(210, now + 0.24);
          filter.Q.setValueAtTime(1.2, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.075, now + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.26);
          osc.onended = function () {
            try {
              osc.disconnect();
              filter.disconnect();
              gain.disconnect();
            } catch (err) {}
          };
        } else if (key === 'zerog') {
          // Rising ethereal harmonic shimmer when gravity turns off (< 0.29s)
          for (let i = 0; i < 2; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            const startHz = i === 0 ? 380 : 570;
            osc.frequency.setValueAtTime(startHz, now);
            osc.frequency.exponentialRampToValueAtTime(startHz * 1.55, now + 0.27);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.048, now + 0.06);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.29);
            osc.onended = function () {
              try {
                osc.disconnect();
                gain.disconnect();
              } catch (err) {}
            };
          }
        } else if (key === 'pop') {
          // Water-droplet surface-tension pop when touching floating coffee (< 0.12s)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(420, now);
          osc.frequency.exponentialRampToValueAtTime(1380, now + 0.085);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.085, now + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.11);
          osc.onended = function () {
            try {
              osc.disconnect();
              gain.disconnect();
            } catch (err) {}
          };
        } else if (key === 'powerdown') {
          // Descending electrical hum when city lights black out (< 0.29s)
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(44, now + 0.27);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(950, now);
          filter.frequency.exponentialRampToValueAtTime(90, now + 0.27);

          gain.gain.setValueAtTime(0.075, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.29);
          osc.onended = function () {
            try {
              osc.disconnect();
              filter.disconnect();
              gain.disconnect();
            } catch (err) {}
          };
        } else if (key === 'timewarp') {
          // Deep slow-motion clock tick & pitch bend (< 0.28s)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1100, now);
          osc.frequency.exponentialRampToValueAtTime(115, now + 0.25);

          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.27);
          osc.onended = function () {
            try {
              osc.disconnect();
              gain.disconnect();
            } catch (err) {}
          };
        } else if (key === 'snap') {
          // Crisp finger-snap transient click (< 0.08s)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1650, now);
          osc.frequency.exponentialRampToValueAtTime(340, now + 0.055);

          gain.gain.setValueAtTime(0.095, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.07);
          osc.onended = function () {
            try {
              osc.disconnect();
              gain.disconnect();
            } catch (err) {}
          };
        } else if (key === 'bounce') {
          // Realistic multi-tap wood table impact (primary thud + lighter secondary tap, < 0.29s)
          for (let i = 0; i < 2; i++) {
            const tapStart = now + i * 0.13;
            const tapDur = i === 0 ? 0.11 : 0.08;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(i === 0 ? 155 : 195, tapStart);
            osc.frequency.exponentialRampToValueAtTime(i === 0 ? 48 : 68, tapStart + tapDur);

            gain.gain.setValueAtTime(i === 0 ? 0.095 : 0.048, tapStart);
            gain.gain.exponentialRampToValueAtTime(0.0001, tapStart + tapDur);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(tapStart);
            osc.stop(tapStart + tapDur + 0.01);
            osc.onended = function () {
              try {
                osc.disconnect();
                gain.disconnect();
              } catch (err) {}
            };
          }
        } else {
          // Default clean UI / harmonic cue (< 0.18s)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(528, now);
          osc.frequency.exponentialRampToValueAtTime(792, now + 0.15);

          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.17);
          osc.onended = function () {
            try {
              osc.disconnect();
              gain.disconnect();
            } catch (err) {}
          };
        }
      } catch (e) {}
    }
  };

  // Preload `assets/voice1.mp3` .. `assets/voice6.mp3` immediately on script load
  window.IntroAudio.preloadClips();
})();
