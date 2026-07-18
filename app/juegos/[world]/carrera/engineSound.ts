export type EngineSound = {
  start: () => void;
  setBlocked: (blocked: boolean) => void;
  setMuted: (muted: boolean) => void;
  bump: () => void;
  collect: () => void;
  finish: () => void;
  stop: () => void;
};

type WindowWithWebkitAudio = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

export function createEngineSound(baseSpeed: number): EngineSound {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let engineGain: GainNode | null = null;
  let filter: BiquadFilterNode | null = null;
  let osc1: OscillatorNode | null = null;
  let osc2: OscillatorNode | null = null;
  let lfo: OscillatorNode | null = null;
  let started = false;
  let muted = false;

  const baseFreq = 42 + baseSpeed * 1.4;

  function ensureCtx(): AudioContext | null {
    if (ctx) return ctx;
    if (typeof window === "undefined") return null;
    const AC =
      window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  }

  function start() {
    const c = ensureCtx();
    if (!c) return;
    if (c.state === "suspended") c.resume();
    if (started) return;

    master = c.createGain();
    master.gain.value = muted ? 0 : 0.35;
    master.connect(c.destination);

    filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;
    filter.connect(master);

    engineGain = c.createGain();
    engineGain.gain.value = 0.5;
    engineGain.connect(filter);

    osc1 = c.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.value = baseFreq;
    osc1.connect(engineGain);
    osc1.start();

    osc2 = c.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.value = baseFreq * 1.5;
    osc2.detune.value = -12;
    osc2.connect(engineGain);
    osc2.start();

    lfo = c.createOscillator();
    lfo.frequency.value = 7;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 6;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfo.start();

    started = true;
  }

  function setBlocked(blocked: boolean) {
    if (!ctx || !osc1 || !osc2 || !engineGain) return;
    const now = ctx.currentTime;
    const targetFreq = blocked ? baseFreq * 0.72 : baseFreq;
    osc1.frequency.setTargetAtTime(targetFreq, now, 0.15);
    osc2.frequency.setTargetAtTime(targetFreq * 1.5, now, 0.15);
    engineGain.gain.setTargetAtTime(blocked ? 0.32 : 0.5, now, 0.15);
  }

  function setMuted(next: boolean) {
    muted = next;
    if (!ctx || !master) return;
    master.gain.setTargetAtTime(muted ? 0 : 0.35, ctx.currentTime, 0.05);
  }

  function bump() {
    const c = ensureCtx();
    if (!c || !master) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  function collect() {
    const c = ensureCtx();
    if (!c || !master) return;
    const now = c.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = now + i * 0.07;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(master!);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  function finish() {
    const c = ensureCtx();
    if (!c || !master) return;
    const now = c.currentTime;
    [523, 659, 784, 1046].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const t = now + i * 0.12;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain);
      gain.connect(master!);
      osc.start(t);
      osc.stop(t + 0.32);
    });
  }

  function stop() {
    if (!started) {
      ctx?.close();
      ctx = null;
      return;
    }
    try {
      osc1?.stop();
      osc2?.stop();
      lfo?.stop();
    } catch {
      // already stopped
    }
    ctx?.close();
    ctx = null;
    started = false;
  }

  return { start, setBlocked, setMuted, bump, collect, finish, stop };
}
