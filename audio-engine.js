/**
 * audio-engine.js
 * Lightweight, anti-freeze Web Audio API synthesizer for Intro Director.
 * STRICT ANTI-FREEZE COMPLIANCE:
 * - Zero `while` loops; all `for` loops strictly bounded <= 60 iterations.
 * - Zero `window.speechSynthesis`, zero `createBuffer` noise loops, zero rapid timers.
 * - `startMusic()` uses a single 3500ms interval playing at most 3 sine oscillators per chord,
 *   automatically stopped and garbage-collected via `osc.stop(now + 3.2)`.
 * - `speak(text)` sets `this.speechUntil` and plays a single soft marimba chime (520Hz -> 660Hz, 0.15s).
 */

(function () {
  'use strict';

  // Warm ambient chord progression (3 notes per chord, Hz)
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
     * Lazily initializes or resumes the AudioContext inside a try/catch block.
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
      } catch (e) {
        // Ignore autoplay or hardware errors safely
      }
      return this.ctx;
    },

    /**
     * Plays a single warm 3-sine-oscillator chord that self-terminates at `now + 3.2`.
     */
    _playChord: function () {
      if (this.muted || !this.isPlayingMusic) return;
      try {
        const ctx = this.init();
        if (!ctx) return;

        const now = ctx.currentTime;
        const notes = CHORDS[this.chordIndex % CHORDS.length];
        this.chordIndex = (this.chordIndex + 1) % CHORDS.length;

        // Strictly bounded loop: exactly 3 sine oscillators
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(notes[i], now);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.035, now + 0.65);
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
      } catch (e) {
        // Never block main thread on audio exceptions
      }
    },

    /**
     * Starts background music loop (one gentle chord every 3500ms).
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
     * Stops the 3500ms chord interval cleanly.
     */
    stopMusic: function () {
      this.isPlayingMusic = false;
      if (this.musicTimer !== null) {
        clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
    },

    /**
     * Plays short, single-oscillator sound effects (< 0.3s) wrapped in try/catch.
     */
    playSFX: function (name) {
      if (this.muted) return;
      try {
        const ctx = this.init();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const sfxName = String(name || '').toLowerCase();
        let duration = 0.18;

        if (sfxName.indexOf('cup') !== -1 || sfxName.indexOf('clink') !== -1 || sfxName.indexOf('glass') !== -1) {
          // Ceramic/glass clink
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1320, now);
          osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
          duration = 0.14;
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        } else if (sfxName.indexOf('whoosh') !== -1 || sfxName.indexOf('pan') !== -1 || sfxName.indexOf('transition') !== -1) {
          // Soft camera sweep
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(95, now + 0.24);
          duration = 0.25;
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        } else if (sfxName.indexOf('step') !== -1 || sfxName.indexOf('door') !== -1) {
          // Low warm thud
          osc.type = 'sine';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(65, now + 0.14);
          duration = 0.15;
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        } else {
          // Default gentle UI/scene chime
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, now);
          osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.16);
          duration = 0.18;
          gain.gain.setValueAtTime(0.045, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);

        osc.onended = function () {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (err) {}
        };
      } catch (e) {}
    },

    /**
     * Simulates character speech duration for lip-sync and plays a single soft marimba chime
     * (520Hz -> 660Hz, 0.15s) without touching `window.speechSynthesis`.
     */
    speak: function (text) {
      const safeText = typeof text === 'string' ? text : '';
      const nowPerf = performance.now();
      this.speechUntil = nowPerf + Math.min(3500, safeText.length * 50);

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
     * Returns a smooth mouth-open value in [0, 1] while speaking, or 0 when silent.
     */
    getMouthOpen: function (t) {
      const nowPerf = performance.now();
      if (nowPerf >= this.speechUntil) {
        return 0;
      }
      const timeSec = (typeof t === 'number' ? t : nowPerf) * 0.001;
      const syllableWave =
        0.5 +
        0.35 * Math.sin(timeSec * 24.0) +
        0.15 * Math.cos(timeSec * 37.0);
      return Math.max(0.05, Math.min(1.0, syllableWave));
    }
  };
})();
