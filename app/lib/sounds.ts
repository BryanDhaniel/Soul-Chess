// ============================================================
// SOULCHESS — Sound Engine (Web Audio API)
// ============================================================
// All sounds generated procedurally — no audio files needed.
// To swap with real audio later: replace each play* function
// body with: new Audio('/sounds/xxx.mp3').play()
// ============================================================

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// ─── Low-level helpers ───────────────────────────────────────

interface ToneOpts {
  type?: OscillatorType;
  freq: number;
  freq2?: number;        // end frequency (for glide)
  gain?: number;
  attack?: number;       // seconds
  decay?: number;
  sustain?: number;      // gain level after attack
  release?: number;
  duration: number;      // total seconds
  delay?: number;        // start delay in seconds
}

function tone(opts: ToneOpts): void {
  try {
    const ac = getCtx();
    const t  = ac.currentTime + (opts.delay ?? 0);

    const osc   = ac.createOscillator();
    const gain  = ac.createGain();
    const dest  = ac.destination;

    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(opts.freq, t);
    if (opts.freq2 !== undefined) {
      osc.frequency.linearRampToValueAtTime(opts.freq2, t + opts.duration);
    }

    const pk    = opts.gain    ?? 0.18;
    const att   = opts.attack  ?? 0.005;
    const dec   = opts.decay   ?? 0.05;
    const sus   = opts.sustain ?? pk * 0.6;
    const rel   = opts.release ?? 0.08;

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(pk, t + att);
    gain.gain.linearRampToValueAtTime(sus, t + att + dec);
    gain.gain.setValueAtTime(sus, t + opts.duration - rel);
    gain.gain.linearRampToValueAtTime(0, t + opts.duration);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + opts.duration + 0.01);
  } catch {
    // AudioContext blocked or not supported — silently ignore
  }
}

function noise(durationSec: number, gainVal = 0.06, delay = 0): void {
  try {
    const ac   = getCtx();
    const t    = ac.currentTime + delay;
    const buf  = ac.createBuffer(1, ac.sampleRate * durationSec, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src  = ac.createBufferSource();
    const gain = ac.createGain();
    src.buffer = buf;
    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.linearRampToValueAtTime(0, t + durationSec);
    src.connect(gain);
    gain.connect(ac.destination);
    src.start(t);
  } catch { /* noop */ }
}

// ─── Sound library ───────────────────────────────────────────

/** Soft wooden click — piece lifted */
export function playSelect(): void {
  tone({ type: "triangle", freq: 520, freq2: 480, gain: 0.12,
    attack: 0.003, decay: 0.04, sustain: 0, release: 0.06, duration: 0.12 });
}

/** Piece placed on board — hollow thud */
export function playMove(): void {
  // Low thud
  tone({ type: "sine", freq: 180, freq2: 120, gain: 0.22,
    attack: 0.004, decay: 0.08, sustain: 0, release: 0.05, duration: 0.18 });
  // Subtle click overtone
  tone({ type: "triangle", freq: 640, gain: 0.07,
    attack: 0.002, decay: 0.03, sustain: 0, release: 0.02, duration: 0.08 });
}

/** Piece captured — sharp impact + short noise burst */
export function playCapture(): void {
  // Impact punch
  tone({ type: "sawtooth", freq: 220, freq2: 80, gain: 0.18,
    attack: 0.003, decay: 0.1, sustain: 0, release: 0.05, duration: 0.2 });
  // Crack noise
  noise(0.08, 0.1);
  // Metallic ring
  tone({ type: "sine", freq: 880, freq2: 440, gain: 0.08,
    attack: 0.005, decay: 0.15, sustain: 0, release: 0.1, duration: 0.3,
    delay: 0.02 });
}

/** Turn switches — subtle chime */
export function playTurnSwitch(): void {
  tone({ type: "sine", freq: 660, gain: 0.1,
    attack: 0.01, decay: 0.05, sustain: 0.04, release: 0.12, duration: 0.22 });
  tone({ type: "sine", freq: 880, gain: 0.06,
    attack: 0.01, decay: 0.05, sustain: 0.02, release: 0.1, duration: 0.2,
    delay: 0.05 });
}

/** Victory fanfare — ascending chord arpeggio */
export function playVictory(): void {
  const notes = [261.6, 329.6, 392, 523.2, 659.3]; // C4 E4 G4 C5 E5
  notes.forEach((freq, i) => {
    tone({ type: "sine", freq, gain: 0.15,
      attack: 0.02, decay: 0.1, sustain: 0.08, release: 0.25, duration: 0.55,
      delay: i * 0.1 });
    // Harmonics
    tone({ type: "triangle", freq: freq * 2, gain: 0.05,
      attack: 0.02, decay: 0.08, sustain: 0.03, release: 0.2, duration: 0.45,
      delay: i * 0.1 + 0.01 });
  });
}

/** Defeat — descending minor chord */
export function playDefeat(): void {
  const notes = [392, 349.2, 311.1, 261.6]; // G4 F4 Eb4 C4
  notes.forEach((freq, i) => {
    tone({ type: "sine", freq, gain: 0.13,
      attack: 0.03, decay: 0.12, sustain: 0.06, release: 0.3, duration: 0.6,
      delay: i * 0.12 });
  });
}

/** Invalid action — short low buzz */
export function playInvalid(): void {
  tone({ type: "square", freq: 160, gain: 0.08,
    attack: 0.005, decay: 0.06, sustain: 0, release: 0.04, duration: 0.12 });
}

// ─── Master settings ─────────────────────────────────────────

let _muted = false;
let _volume = 1.0;

export function setMuted(muted: boolean): void { _muted = muted; }
export function getMuted(): boolean { return _muted; }
export function setVolume(v: number): void { _volume = Math.max(0, Math.min(1, v)); }
export function getVolume(): number { return _volume; }

// Wrap all play functions with mute/volume check
const _orig = { playSelect, playMove, playCapture, playTurnSwitch, playVictory, playDefeat, playInvalid };

function guarded(fn: () => void): () => void {
  return () => {
    if (_muted || _volume === 0) return;
    fn();
  };
}

// Re-export guarded versions
export const sfx = {
  select:     guarded(_orig.playSelect),
  move:       guarded(_orig.playMove),
  capture:    guarded(_orig.playCapture),
  turnSwitch: guarded(_orig.playTurnSwitch),
  victory:    guarded(_orig.playVictory),
  defeat:     guarded(_orig.playDefeat),
  invalid:    guarded(_orig.playInvalid),
};