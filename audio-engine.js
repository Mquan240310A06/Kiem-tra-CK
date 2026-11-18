/**
 * audio-engine.js
 * Safe, minimal Web Audio API synthesizer for Intro Director (window.IntroAudio).
 *
 * STRICT ANTI-FREEZE COMPLIANCE:
 * 1. ZERO `while` loops; every `for` loop is strictly bounded (N <= 3).
 * 2. ZERO `window.speechSynthesis`, ZERO `createBuffer` noise loops, ZERO rapid intervals.
 * 3. `startMusic()`: Plays a gentle chord every 3500ms via `setInterval` (max 3 sine oscillators
 *    per chord, automatically stopped and disconnected via `osc.stop(now + 3.2)`).
 * 4. `playSFX(name)`: Short single-oscillator beeps/sweeps (< 0.3s) wrapped in `try/catch`.
 * 5. `speak(text)`: Sets `this.speechUntil = performance.now() + Math.min(3500, text.length * 50)`
 *    and plays one soft marimba chime (`520Hz -> 660Hz`, `0.15s`) so `getMouthOpen(t)` animates
 *    smoothly without touching browser TTS.
 */

(function () {
  'use strict';

  // Gentle 3-note ambient chords (Hz)
  const CHORDS = [
    [261.63, 329.63, 392.00], // C Major
    [220.00, 261.63, 329.63], // A Minor
    [174.61, 220.00, 261.63], // F Major
    [196.00, 246.94, 293.66]  // G Major
  ];

  window.IntroAudio = {
    ctx: null,
    musicTimer: null,
    isPlayingMusic: false,
    chordIndex: 0,
    speechUntil: 0,
    muted: false,

    /**
     * Lazily creates or resumes the single shared AudioContext inside try/catch.
     */
    init: function () {
      try {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            this.ctx = new AudioCtx();
          }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(function () {});
        }
      } catch (e) {}
      return this.ctx;
    },

    /**
     * Plays one gentle 3-sine-oscillator chord that automatically disconnects at `now + 3.2`.
     */
    _playChord: function () {
      if (this.muted || !this.isPlayingMusic) return;
      try {
        const ctx = this.init();
        if (!ctx) return;

        const now = ctx.currentTime;
        const notes = CHORDS[this.chordIndex % CHORDS.length];
        this.chordIndex = (this.chordIndex + 1) % CHORDS.length;

        // Strictly bounded loop: max 3 sine oscillators per chord
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(notes[i], now);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.035, now + 0.6);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.15);

          osc.connect(gain);
          gain.connect(ctx.destination);

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
     * Starts the gentle 3500ms chord progression interval (clearing any previous timer first).
     */
    startMusic: function () {
      try {
        this.stopMusic();
        this.init();
        this.isPlayingMusic = true;
        this._playChord();

        const self = this;
        this.musicTimer = setInterval(function () {
          self._playChord();
        }, 3500);
      } catch (e) {}
    },

    /**
     * Stops the background music interval cleanly.
     */
    stopMusic: function () {
      this.isPlayingMusic = false;
      if (this.musicTimer !== null) {
        clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
    },

    /**
     * Short single-oscillator beeps/sweeps (< 0.3s) wrapped in `try/catch`.
     */
    playSFX: function (name) {
      if (this.muted) return;
      try {
        const ctx = this.init();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const key = String(name || '').toLowerCase();
        let dur = 0.18;

        if (key === 'whoosh') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(240, now);
          osc.frequency.exponentialRampToValueAtTime(75, now + 0.22);
          dur = 0.24;
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        } else if (key === 'zerog') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(360, now);
          osc.frequency.exponentialRampToValueAtTime(580, now + 0.24);
          dur = 0.25;
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        } else if (key === 'pop') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(1320, now + 0.09);
          dur = 0.10;
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        } else if (key === 'powerdown') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.exponentialRampToValueAtTime(55, now + 0.25);
          dur = 0.26;
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        } else if (key === 'timewarp') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(130, now + 0.24);
          dur = 0.25;
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        } else if (key === 'snap' || key === 'tick') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1600, now);
          osc.frequency.exponentialRampToValueAtTime(350, now + 0.06);
          dur = 0.07;
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        } else if (key === 'bounce' || key === 'thud') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(48, now + 0.16);
          dur = 0.17;
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        } else {
          // Default gentle chime (< 0.2s)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, now);
          osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.16);
          dur = 0.18;
          gain.gain.setValueAtTime(0.045, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + dur);

        osc.onended = function () {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (err) {}
        };
      } catch (e) {}
    },

    /**
     * Sets `this.speechUntil = performance.now() + Math.min(3500, text.length * 50)`
     * and plays one soft marimba chime (520Hz -> 660Hz, 0.15s) without touching browser TTS.
     */
    speak: function (text) {
      const safeText = typeof text === 'string' ? text : '';
      this.speechUntil = performance.now() + Math.min(3500, safeText.length * 50);

      if (this.muted) return;
      try {
        const ctx = this.init();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.055, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);

        osc.onended = function () {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (err) {}
        };
      } catch (e) {}
    },

    /**
     * Returns a smooth mouth-open ratio in [0, 1] while `performance.now() < this.speechUntil`.
     */
    getMouthOpen: function (t) {
      const nowPerf = performance.now();
      if (nowPerf >= this.speechUntil) {
        return 0;
      }
      const rawT = typeof t === 'number' ? t : nowPerf;
      const tSec = rawT > 500 ? rawT * 0.001 : rawT;
      const wave =
        0.5 +
        0.35 * Math.sin(tSec * 22.0) +
        0.15 * Math.cos(tSec * 35.0);
      return Math.max(0.05, Math.min(1.0, wave));
    }
  };
})();
