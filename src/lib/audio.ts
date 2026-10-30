/**
 * Quiet, mechanical-sounding UI audio, synthesized with Web Audio (no files).
 *
 *   click      mechanical key: a short band-passed noise tick + a soft low thump
 *   hover      a very faint, very short tick (rate-limited)
 *   relay      two close clicks, like a relay pulling in
 *   hum        the ambient: low-passed noise + a quiet 50 Hz line hum, breathing slowly
 *   fanDown    hum pitch/filter sweeping down (power-off)
 *
 * The AudioContext is created lazily when sound is switched on (browsers
 * block audio before a user gesture). Everything goes through one master
 * gain at a low level.
 */
type SoundName = 'click' | 'hover' | 'boot' | 'success' | 'error' | 'powerdown' | 'plug' | 'warn';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private hum: { stop: () => void; filter: BiquadFilterNode; gain: GainNode } | null = null;
  enabled = false;
  private lastHover = 0;

  private ensure() {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(ctx.destination);
    // 2 s of white noise, reused by every sound
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    return ctx;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (on) {
      const ctx = this.ensure();
      if (!ctx) return;
      void ctx.resume();
      this.startHum();
    } else {
      this.stopHum();
    }
  }

  /** Short filtered noise burst — the building block of every click. */
  private tick(at: number, freq: number, q: number, vol: number, dur: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(bp).connect(g).connect(this.master!);
    src.start(at, Math.random() * 1.5, dur + 0.02);
  }

  private thump(at: number, freq: number, vol: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, at);
    o.frequency.exponentialRampToValueAtTime(freq * 0.5, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(this.master!);
    o.start(at);
    o.stop(at + dur + 0.02);
  }

  /** Relay pulling in: two clicks 18 ms apart, the second softer. */
  private relay(t: number) {
    this.tick(t, 2400, 1.5, 0.3, 0.035);
    this.thump(t, 90, 0.12, 0.08);
    this.tick(t + 0.018, 2900, 1.5, 0.12, 0.025);
  }

  private startHum() {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.hum) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    filter.Q.value = 0.7;
    const line = ctx.createOscillator();
    line.frequency.value = 50;
    const lineGain = ctx.createGain();
    lineGain.gain.value = 0.012;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 2.5); // fan spinning up
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 25;
    lfo.connect(lfoGain).connect(filter.frequency);
    src.connect(filter).connect(gain).connect(this.master);
    line.connect(lineGain).connect(this.master);
    src.start();
    line.start();
    lfo.start();
    this.hum = {
      filter,
      gain,
      stop: () => {
        const t = ctx.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.linearRampToValueAtTime(0, t + 1.2);
        lineGain.gain.linearRampToValueAtTime(0, t + 0.3);
        window.setTimeout(() => [src, line, lfo].forEach((n) => n.stop()), 1400);
      },
    };
  }

  private stopHum() {
    this.hum?.stop();
    this.hum = null;
  }

  play(name: SoundName) {
    if (!this.enabled || !this.ensure() || !this.ctx) return;
    const t = this.ctx.currentTime + 0.005;
    switch (name) {
      case 'click':
        this.tick(t, 3200, 1.2, 0.22, 0.03);
        this.thump(t, 140, 0.08, 0.05);
        break;
      case 'hover': {
        const now = performance.now();
        if (now - this.lastHover < 70) return;
        this.lastHover = now;
        this.tick(t, 5200, 2, 0.04, 0.012);
        break;
      }
      case 'boot':
        // fan spinning back up after a power-off
        if (this.hum) {
          const f = this.hum.filter.frequency;
          f.cancelScheduledValues(t);
          f.setValueAtTime(Math.max(40, f.value), t);
          f.linearRampToValueAtTime(180, t + 2);
        }
        this.relay(t);
        break;
      case 'plug':
        this.relay(t);
        break;
      case 'success':
        this.tick(t, 3000, 1.4, 0.15, 0.025);
        this.tick(t + 0.09, 3400, 1.4, 0.12, 0.025);
        break;
      case 'error':
        this.thump(t, 110, 0.16, 0.14);
        this.tick(t, 900, 1, 0.12, 0.06);
        break;
      case 'warn':
        // fan straining: briefly open the hum filter
        if (this.hum) {
          const f = this.hum.filter.frequency;
          f.cancelScheduledValues(t);
          f.setValueAtTime(f.value, t);
          f.linearRampToValueAtTime(900, t + 0.4);
          f.linearRampToValueAtTime(180, t + 2.4);
        }
        this.tick(t, 1800, 1, 0.15, 0.04);
        break;
      case 'powerdown':
        this.tick(t, 2200, 1.5, 0.25, 0.04);
        if (this.hum) {
          const f = this.hum.filter.frequency;
          f.cancelScheduledValues(t);
          f.setValueAtTime(f.value, t);
          f.exponentialRampToValueAtTime(40, t + 1.4);
        }
        break;
    }
  }
}

export const audio = new AudioEngine();
export type { SoundName };
