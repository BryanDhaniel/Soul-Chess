// ============================================================
// SOULCHESS — Ambient Soundtrack (Web Audio API)
// ============================================================
// Procedural fantasy ambient loop:
//   - Drone pad (low sustained chord)
//   - Slow melodic arpeggio (pentatonic scale)
//   - Subtle shimmer layer (high harmonics)
//
// To swap with a real audio file later:
//   soundtrack.stop()
//   const audio = new Audio('/sounds/menu.mp3')
//   audio.loop = true
//   audio.volume = 0.4
//   audio.play()
// ============================================================

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let playing = false;
const nodes: AudioNode[] = [];

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// ─── Helpers ─────────────────────────────────────────────────
function createDrone(
  ac: AudioContext,
  dest: AudioNode,
  freq: number,
  gainVal: number,
  detune = 0,
): OscillatorNode {
  const osc  = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.detune.value    = detune;
  gain.gain.value     = gainVal;
  osc.connect(gain);
  gain.connect(dest);
  osc.start();
  nodes.push(osc, gain);
  return osc;
}

function scheduleArpeggio(
  ac: AudioContext,
  dest: AudioNode,
  notes: number[],
  interval: number,
  gainVal: number,
  startTime: number,
): void {
  notes.forEach((freq, i) => {
    const t    = startTime + i * interval;
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(gainVal, t + 0.05);
    gain.gain.linearRampToValueAtTime(gainVal * 0.4, t + 0.3);
    gain.gain.linearRampToValueAtTime(0, t + interval * 0.95);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + interval);
    nodes.push(osc, gain);
  });
}

// ─── Public API ──────────────────────────────────────────────

let loopTimer: ReturnType<typeof setTimeout> | null = null;
let currentVolume = 0.35;

export function startSoundtrack(volume = 0.35): void {
  if (playing) return;
  try {
    const ac = getCtx();
    playing = true;
    currentVolume = volume;

    // Master gain (for fade in/out)
    const mg = ac.createGain();
    mg.gain.setValueAtTime(0, ac.currentTime);
    mg.gain.linearRampToValueAtTime(volume, ac.currentTime + 3); // 3s fade in
    mg.connect(ac.destination);
    masterGain = mg;

    // ── Drone layer ───────────────────────────────────────
    // Low C2 + G2 + E3 (major chord, open voicing)
    createDrone(ac, mg, 65.4,  0.12);      // C2
    createDrone(ac, mg, 98.0,  0.09);      // G2
    createDrone(ac, mg, 164.8, 0.06);      // E3
    createDrone(ac, mg, 65.4,  0.04, 5);   // C2 slightly detuned for warmth
    createDrone(ac, mg, 98.0,  0.03, -4);  // G2 slightly detuned

    // ── Shimmer layer ─────────────────────────────────────
    // High harmonics, very quiet
    createDrone(ac, mg, 523.3, 0.018);     // C5
    createDrone(ac, mg, 784.0, 0.012);     // G5
    createDrone(ac, mg, 1046.5, 0.008);    // C6

    // ── Melodic arpeggio loop ─────────────────────────────
    // C pentatonic: C3 E3 G3 A3 C4 E4 G4
    const pentatonic = [130.8, 164.8, 196.0, 220.0, 261.6, 329.6, 392.0];
    const interval   = 1.8; // seconds per note
    const loopLen    = pentatonic.length * interval; // ~12.6s

    function scheduleLoop(): void {
      if (!playing || !masterGain) return;
      const now = ac.currentTime;
      scheduleArpeggio(ac, mg, pentatonic, interval, 0.045, now);
      // Reverse pass (descending)
      const rev = [...pentatonic].reverse();
      scheduleArpeggio(ac, mg, rev, interval, 0.03, now + loopLen + 0.5);
      // Schedule next loop
      loopTimer = setTimeout(scheduleLoop, (loopLen * 2 + 0.5) * 1000 - 200);
    }

    // Start arpeggio after 1.5s (let drone establish first)
    setTimeout(scheduleLoop, 1500);

  } catch {
    playing = false;
  }
}

export function stopSoundtrack(fadeDuration = 2): void {
  if (!playing || !masterGain) return;
  try {
    const ac  = getCtx();
    const now = ac.currentTime;
    masterGain.gain.linearRampToValueAtTime(0, now + fadeDuration);
    setTimeout(() => {
      nodes.forEach(n => { try { n.disconnect(); } catch {} });
      nodes.length = 0;
      masterGain   = null;
      playing      = false;
      if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
    }, fadeDuration * 1000 + 100);
  } catch {
    playing = false;
  }
}

export function setSoundtrackVolume(v: number): void {
  currentVolume = Math.max(0, Math.min(1, v));
  if (masterGain && ctx) {
    masterGain.gain.linearRampToValueAtTime(currentVolume, ctx.currentTime + 0.3);
  }
}

export function isSoundtrackPlaying(): boolean {
  return playing;
}