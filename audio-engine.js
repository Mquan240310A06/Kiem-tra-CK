/**
 * audio-engine.js
 * Documentary Story Audio Engine (135s / 13 Voiceover Cues) for Intro Director.
 *
 * STRICT ANTI-FREEZE & SAFETY GUARANTEES:
 * - 100% Ban on `window.speechSynthesis` (zero browser TTS calls).
 * - ZERO `while` loops anywhere in the file; all `for` loops are strictly bounded.
 * - Preloads `assets/voice1.mp3` through `assets/voice13.mp3` with graceful 404 handling.
 * - Real-time Web Audio `AnalyserNode` (`fftSize = 256`) time-domain RMS lip-sync when MP3 plays.
 * - Expressive 3-character syllable-cadence fallback synthesizer (`narrator`, `quan`, `minh`)
 *   when an MP3 is missing or blocked, driving `getMouthOpen(t)` seamlessly.
 * - Warm Lo-Fi electric-piano underscore (`Fmaj7 -> Em7 -> Dm7 -> Cmaj7`) every 3600ms
 *   through a 650Hz low-pass filter, with automatic voiceover ducking (`0.05` vs `0.15`).
 */

(function () {
  'use strict';

  // Lo-Fi Electric Piano Chord Progression (3 voices per chord, Hz)
  // Fmaj7 (F3, A3, E4) -> Em7 (E3, G3, D4) -> Dm7 (D3, F3, C4) -> Cmaj7 (C3, E3, B3)
  const LOFI_CHORDS = [
    [174.61, 220.00, 329.63], // Fmaj7
    [164.81, 196.00, 293.66], // Em7
    [146.83, 174.61, 261.63], // Dm7
    [130.81, 164.81, 246.94]  // Cmaj7
  ];

  // Expressive Character Voice Profiles for Fallback Syllable Synthesizer
  const VOICE_PROFILES = {
    narrator: {
      baseMin: 145,
      baseMax: 185,
      wave: 'triangle',
      subWave: 'sine',
      syllableRate: 5.8,
      gainPeak: 0.042
    },
    quan: {
      baseMin: 205,
      baseMax: 250,
      wave: 'triangle',
      subWave: 'sine',
      syllableRate: 6.6,
      gainPeak: 0.045
    },
    minh: {
      baseMin: 295,
      baseMax: 410,
      wave: 'sine',
      subWave: 'triangle',
      syllableRate: 7.8,
      gainPeak: 0.040
    }
  };

  // Deterministic pseudo-random helper (zero loops)
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  }

  window.IntroAudio = {
    ctx: null,
    musicGain: null,
    musicFilter: null,
    analyser: null,
    timeDomainData: new Uint8Array(128),

    // Voiceover state (1..13)
    clips: {},
    activeAudio: null,
    activeClipId: 0,
    activeRole: 'narrator',
    usingLiveAnalyser: false,
    speechStartTime: 0,
    speechUntil: 0,
    fallbackNodes: [],
    duckRestoreTimer: null,

    // Music state
    musicTimer: null,
    isPlayingMusic: false,
    chordIndex: 0,
    muted: false,
    preloaded: false,

    /**
     * Preloads `assets/voice1.mp3` .. `assets/voice13.mp3` cleanly at startup
     * without throwing errors if files are missing (404).
     */
    preloadClips: function () {
      if (this.preloaded) return;
      this.preloaded = true;

      const self = this;
      for (let i = 1; i <= 13; i++) {
        try {
          const audio = new Audio();
          audio.preload = 'auto';
          audio.crossOrigin = 'anonymous';
          audio.src = 'assets/voice' + i + '.mp3';

          const slot = {
            id: i,
            audio: audio,
            sourceNode: null,
            ready: false,
            failed: false
          };

          audio.addEventListener('canplaythrough', function () {
            slot.ready = true;
          });

          audio.addEventListener('error', function () {
            slot.failed = true;
            slot.ready = false;
          });

          audio.addEventListener('ended', function () {
            if (self.activeAudio === audio) {
              self.usingLiveAnalyser = false;
              self.activeAudio = null;
              self.speechUntil = 0;
              self._setMusicDuck(false);
            }
          });

          this.clips[i] = slot;
        } catch (e) {
          this.clips[i] = { id: i, audio: null, sourceNode: null, ready: false, failed: true };
        }
      }
    },

    /**
     * Lazily initializes the Web Audio API context, master music bus (650Hz lowpass),
     * and the 256-FFT `AnalyserNode` for real-time lip-sync.
     */
    init: function () {
      try {
        this.preloadClips();

        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            this.ctx = new AudioCtx();

            // Master Lo-Fi Music Bus: 650Hz Low-Pass Filter -> Music Ducking GainNode
            this.musicFilter = this.ctx.createBiquadFilter();
            this.musicFilter.type = 'lowpass';
            this.musicFilter.frequency.setValueAtTime(650, this.ctx.currentTime);
            this.musicFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

            this.musicFilter.connect(this.musicGain);
            this.musicGain.connect(this.ctx.destination);

            // Shared AnalyserNode (fftSize = 256 -> 128 time-domain samples)
            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.65;
            this.timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.connect(this.ctx.destination);
          }
        }

        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(function () {});
        }
      } catch (e) {
        // Safely ignore browser autoplay restriction exceptions
      }
      return this.ctx;
    },

    /**
     * Smoothly ducks background Lo-Fi underscore volume to `0.05` during speech
     * and restores it to `0.15` when finished.
     */
    _setMusicDuck: function (isDucked) {
      try {
        if (!this.ctx || !this.musicGain) return;
        const now = this.ctx.currentTime;
        const target = isDucked ? 0.05 : 0.15;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
        this.musicGain.gain.linearRampToValueAtTime(target, now + 0.25);
      } catch (e) {}
    },

    /**
     * Cleanly halts any currently playing MP3 voice clip or fallback synthesizer nodes.
     */
    _stopActiveVoice: function () {
      if (this.duckRestoreTimer !== null) {
        clearTimeout(this.duckRestoreTimer);
        this.duckRestoreTimer = null;
      }

      // Stop active HTMLAudioElement if playing
      if (this.activeAudio) {
        try {
          this.activeAudio.pause();
          this.activeAudio.currentTime = 0;
        } catch (e) {}
        this.activeAudio = null;
      }

      this.usingLiveAnalyser = false;

      // Stop any scheduled fallback synthesizer oscillators (bounded <= 60)
      const count = Math.min(60, this.fallbackNodes.length);
      for (let i = 0; i < count; i++) {
        try {
          this.fallbackNodes[i].stop();
          this.fallbackNodes[i].disconnect();
        } catch (e) {}
      }
      this.fallbackNodes = [];
    },

    /**
     * Plays a single Lo-Fi electric-piano chord (max 3 oscillators) through the 650Hz low-pass filter.
     * Automatically stops and disconnects at `now + 3.45`.
     */
    _playLofiChord: function () {
      if (this.muted || !this.isPlayingMusic) return;
      try {
        const ctx = this.init();
        if (!ctx || !this.musicFilter) return;

        const now = ctx.currentTime;
        const chord = LOFI_CHORDS[this.chordIndex % LOFI_CHORDS.length];
        this.chordIndex = (this.chordIndex + 1) % LOFI_CHORDS.length;

        // Strictly bounded loop: 3 notes per chord
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();

          // Warm electric piano timbre: triangle fundamental with subtle warm detune
          osc.type = i === 0 ? 'sine' : 'triangle';
          const detuneHz = (i - 1) * 0.45;
          osc.frequency.setValueAtTime(chord[i] + detuneHz, now);

          // Gentle Rhodes-style envelope
          noteGain.gain.setValueAtTime(0.0001, now);
          noteGain.gain.linearRampToValueAtTime(0.32, now + 0.18);
          noteGain.gain.exponentialRampToValueAtTime(0.14, now + 1.4);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

          osc.connect(noteGain);
          noteGain.connect(this.musicFilter);

          osc.start(now);
          osc.stop(now + 3.45);

          osc.onended = function () {
            try {
              osc.disconnect();
              noteGain.disconnect();
            } catch (err) {}
          };
        }
      } catch (e) {}
    },

    /**
     * Starts the 3600ms Lo-Fi electric-piano chord progression.
     */
    startMusic: function () {
      try {
        this.stopMusic();
        this.init();
        this.isPlayingMusic = true;
        this._setMusicDuck(performance.now() < this.speechUntil);
        this._playLofiChord();

        const self = this;
        this.musicTimer = setInterval(function () {
          self._playLofiChord();
        }, 3600);
      } catch (e) {}
    },

    /**
     * Stops the Lo-Fi underscore timer cleanly.
     */
    stopMusic: function () {
      this.isPlayingMusic = false;
      if (this.musicTimer !== null) {
        clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
    },

    /**
     * Plays voiceover cue `clipId` (1..13) with character `role` ('narrator' | 'quan' | 'minh').
     * - Ducks music to 0.05 during dialogue and restores to 0.15 after completion.
     * - Connects the MP3 `Audio` element to `this.analyser` (`fftSize = 256`) for real-time RMS lip-sync.
     * - Falls back seamlessly to the 3-character syllable-cadence synthesizer if the MP3 is missing (404).
     */
    speak: function (text, clipId = 1, role = 'narrator') {
      const safeText = typeof text === 'string' ? text : '';
      const safeClipId = Math.max(1, Math.min(13, Number(clipId) || 1));
      const safeRole = VOICE_PROFILES[role] ? role : 'narrator';

      this._stopActiveVoice();

      const ctx = this.init();
      const nowPerf = performance.now();
      const fallbackDurationMs = Math.max(1200, Math.min(9500, safeText.length * 58));

      this.activeClipId = safeClipId;
      this.activeRole = safeRole;
      this.speechStartTime = nowPerf;
      this.speechUntil = nowPerf + fallbackDurationMs;

      // Duck Lo-Fi background underscore to 0.05 while voice is active
      this._setMusicDuck(true);

      const slot = this.clips[safeClipId];
      const self = this;

      // Attempt to play preloaded MP3 (`assets/voice{1..13}.mp3`) if it hasn't 404'd
      if (slot && slot.audio && !slot.failed && ctx && this.analyser) {
        try {
          if (!slot.sourceNode) {
            slot.sourceNode = ctx.createMediaElementSource(slot.audio);
            slot.sourceNode.connect(this.analyser);
          }

          slot.audio.currentTime = 0;
          const playPromise = slot.audio.play();

          if (playPromise && typeof playPromise.then === 'function') {
            playPromise
              .then(function () {
                self.activeAudio = slot.audio;
                self.usingLiveAnalyser = true;
                const clipDurMs =
                  slot.audio.duration && isFinite(slot.audio.duration)
                    ? slot.audio.duration * 1000
                    : fallbackDurationMs;
                self.speechUntil = performance.now() + clipDurMs;
              })
              .catch(function () {
                // MP3 missing (404) or blocked -> seamlessly trigger 3-character fallback synth
                slot.failed = true;
                self._playFallbackCadence(safeText, safeRole, fallbackDurationMs, safeClipId);
              });
            return;
          }
        } catch (e) {
          slot.failed = true;
        }
      }

      // Immediate fallback if MP3 is already known to be 404 or unavailable
      this._playFallbackCadence(safeText, safeRole, fallbackDurationMs, safeClipId);
    },

    /**
     * Expressive 3-character syllable-cadence fallback synthesizer when MP3 is missing (404).
     * Strictly bounded loop (max 36 syllables) with automatic node disconnection.
     */
    _playFallbackCadence: function (text, role, durationMs, seedId) {
      const self = this;
      this.usingLiveAnalyser = false;
      this.speechStartTime = performance.now();
      this.speechUntil = this.speechStartTime + durationMs;

      // Schedule music duck restoration when fallback speech ends
      this.duckRestoreTimer = setTimeout(function () {
        self._setMusicDuck(false);
      }, durationMs + 60);

      if (this.muted) return;

      try {
        const ctx = this.init();
        if (!ctx) return;

        const profile = VOICE_PROFILES[role] || VOICE_PROFILES.narrator;
        const now = ctx.currentTime;
        const totalSec = durationMs * 0.001;

        // Bounded syllable count: max 36 expressive phoneme bursts across the utterance
        const syllableCount = Math.max(4, Math.min(36, Math.floor(totalSec * profile.syllableRate)));
        const stepSec = totalSec / syllableCount;

        for (let i = 0; i < syllableCount; i++) {
          const charCode = text.charCodeAt(i % Math.max(1, text.length)) || 72;
          // Create natural punctuation pauses every few words
          if (i > 0 && i % 7 === 0) {
            continue;
          }

          const startT = now + i * stepSec;
          const durT = Math.min(0.16, stepSec * 0.78);
          const normPitch = ((charCode * 17 + i * 31 + seedId * 13) % 100) / 100;

          // Intonation curve: slight rise at start, gentle fall at end of sentence
          const phraseArc = Math.sin((i / syllableCount) * Math.PI) * 18;
          const f0 =
            profile.baseMin +
            normPitch * (profile.baseMax - profile.baseMin) +
            phraseArc;
          const f1 = f0 * (0.96 + hash(i + seedId) * 0.12);

          const osc = ctx.createOscillator();
          const formantFilter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc.type = i % 3 === 0 ? profile.subWave : profile.wave;
          osc.frequency.setValueAtTime(f0, startT);
          osc.frequency.exponentialRampToValueAtTime(Math.max(80, f1), startT + durT);

          // Soft vocal formant band-pass shaping
          formantFilter.type = 'bandpass';
          formantFilter.frequency.setValueAtTime(f0 * 2.4, startT);
          formantFilter.Q.setValueAtTime(1.4, startT);

          gain.gain.setValueAtTime(0.0001, startT);
          gain.gain.linearRampToValueAtTime(profile.gainPeak, startT + 0.022);
          gain.gain.exponentialRampToValueAtTime(0.0001, startT + durT);

          osc.connect(formantFilter);
          formantFilter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startT);
          osc.stop(startT + durT + 0.01);

          this.fallbackNodes.push(osc);

          osc.onended = function () {
            try {
              osc.disconnect();
              formantFilter.disconnect();
              gain.disconnect();
            } catch (err) {}
          };
        }
      } catch (e) {}
    },

    /**
     * Returns a smooth mouth-open ratio in `[0, 1]`:
     * - When an MP3 is actively playing, computes real-time RMS amplitude from `this.analyser`
     *   (128 time-domain samples).
     * - When running the 3-character fallback synthesizer, computes the character-specific
     *   syllable cadence envelope so lip-sync stays expressive and alive.
     */
    getMouthOpen: function (t) {
      const nowPerf = performance.now();

      // 1. Live MP3 Waveform RMS Lip-Sync via AnalyserNode (fftSize = 256 -> 128 bins)
      if (this.usingLiveAnalyser && this.activeAudio && !this.activeAudio.paused && this.analyser) {
        try {
          this.analyser.getByteTimeDomainData(this.timeDomainData);
          let sumSquares = 0;
          // Strictly bounded loop: 64 samples (every 2nd sample of 128 buffer, <= 64 iterations)
          for (let i = 0; i < 64; i++) {
            const sample = (this.timeDomainData[i * 2] - 128) / 128.0;
            sumSquares += sample * sample;
          }
          const rms = Math.sqrt(sumSquares / 64);
          // Noise gate + responsive vocal gain scaling
          const mouth = (rms - 0.015) * 6.5;
          return Math.max(0, Math.min(1.0, mouth));
        } catch (e) {}
      }

      // 2. Fallback 3-Character Syllable-Cadence Lip-Sync Envelope
      if (nowPerf >= this.speechUntil) {
        return 0;
      }

      const profile = VOICE_PROFILES[this.activeRole] || VOICE_PROFILES.narrator;
      const elapsedSec = (nowPerf - this.speechStartTime) * 0.001;
      const rate = profile.syllableRate;

      // Phrase breathing pauses aligned with fallback cadence
      const syllableIndex = Math.floor(elapsedSec * rate);
      if (syllableIndex > 0 && syllableIndex % 7 === 0) {
        return 0.06;
      }

      const phase = elapsedSec * rate * Math.PI * 2;
      const primaryPulse = Math.max(0, Math.sin(phase));
      const secondaryMod = 0.65 + 0.35 * Math.cos(elapsedSec * 19.5 + this.activeClipId);
      const openAmount = Math.pow(primaryPulse, 0.75) * secondaryMod;

      return Math.max(0.04, Math.min(1.0, openAmount));
    },

    /**
     * Lightweight single-shot documentary & sci-fi foley SFX wrapped in try/catch.
     * Supports: 'whoosh', 'zeroG', 'spark', 'quantum', 'snap', 'thud', 'tick', and default chime.
     */
    playSFX: function (name) {
      if (this.muted) return;
      try {
        const ctx = this.init();
        if (!ctx) return;

        const now = ctx.currentTime;
        const key = String(name || '').toLowerCase();

        if (key.indexOf('whoosh') !== -1) {
          // Cinematic camera / portal whoosh (filtered triangle sweep)
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(68, now + 0.32);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(900, now);
          filter.frequency.exponentialRampToValueAtTime(180, now + 0.32);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.065, now + 0.06);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.33);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.34);
          osc.onended = function () {
            try {
              osc.disconnect();
              filter.disconnect();
              gain.disconnect();
            } catch (err) {}
          };
        } else if (key.indexOf('zerog') !== -1) {
          // Weightless anti-gravity shimmer (dual sine harmonic)
          for (let i = 0; i < 2; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const baseF = i === 0 ? 340 : 510;
            osc.frequency.setValueAtTime(baseF, now);
            osc.frequency.exponentialRampToValueAtTime(baseF * 1.45, now + 0.45);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.04, now + 0.12);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.47);
            osc.onended = function () {
              try {
                osc.disconnect();
                gain.disconnect();
              } catch (err) {}
            };
          }
        } else if (key.indexOf('spark') !== -1) {
          // High-voltage electric filament crackle
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(1850, now);
          osc.frequency.exponentialRampToValueAtTime(620, now + 0.09);
          osc.frequency.setValueAtTime(2400, now + 0.045);

          gain.gain.setValueAtTime(0.055, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
          osc.onended = function () {
            try {
              osc.disconnect();
              gain.disconnect();
            } catch (err) {}
          };
        } else if (key.indexOf('quantum') !== -1) {
          // Deep harmonic quantum resonance pulse
          for (let i = 0; i < 2; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = i === 0 ? 'sine' : 'triangle';
            const startF = i === 0 ? 110 : 528;
            const endF = i === 0 ? 55 : 880;
            osc.frequency.setValueAtTime(startF, now);
            osc.frequency.exponentialRampToValueAtTime(endF, now + 0.38);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.40);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.41);
            osc.onended = function () {
              try {
                osc.disconnect();
                gain.disconnect();
              } catch (err) {}
            };
          }
        } else if (key.indexOf('snap') !== -1) {
          // Crisp finger/chalk snap transient
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1450, now);
          osc.frequency.exponentialRampToValueAtTime(320, now + 0.055);

          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.065);
          osc.onended = function () {
            try {
              osc.disconnect();
              gain.disconnect();
            } catch (err) {}
          };
        } else if (key.indexOf('thud') !== -1) {
          // Warm book/table impact thud
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(135, now);
          osc.frequency.exponentialRampToValueAtTime(42, now + 0.18);

          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.20);
          osc.onended = function () {
            try {
              osc.disconnect();
              gain.disconnect();
            } catch (err) {}
          };
        } else if (key.indexOf('tick') !== -1) {
          // Precision pocket-watch / chalkboard tick
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(2200, now);
          osc.frequency.exponentialRampToValueAtTime(900, now + 0.025);

          gain.gain.setValueAtTime(0.045, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.035);
          osc.onended = function () {
            try {
              osc.disconnect();
              gain.disconnect();
            } catch (err) {}
          };
        } else {
          // Default warm harmonic cue
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(528, now);
          osc.frequency.exponentialRampToValueAtTime(792, now + 0.16);

          gain.gain.setValueAtTime(0.045, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.18);
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

  // Preload the 13 voiceover slots immediately on script load
  window.IntroAudio.preloadClips();
})();
