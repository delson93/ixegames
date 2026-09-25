// Original synthesized arcade sounds. No downloads, trackers, or licensed recordings.
export class ArcadeAudio {
  constructor(host = globalThis) {
    this.host = host;
    this.context = null;
    this.master = null;
    this.engine = null;
    this.voices = new Set();
    this.muted = false;
    try { this.muted = host.localStorage?.getItem('ixe-audio-muted') === 'true'; } catch {}
  }
  // Call only from an explicit user gesture, never on page load.
  unlock() {
    try {
      const Context = this.host.AudioContext || this.host.webkitAudioContext;
      if (!Context) return false;
      if (!this.context) {
        this.context = new Context();
        this.master = this.context.createGain();
        this.master.gain.value = this.muted ? 0 : 0.22;
        this.master.connect(this.context.destination);
      }
      this.context.resume()?.catch(() => {});
      return true;
    } catch { return false; }
  }
  setMuted(value) {
    this.muted = !!value;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.22;
    if (this.muted) this.silence();
    try { this.host.localStorage?.setItem('ixe-audio-muted', String(this.muted)); } catch {}
  }
  tone(frequency, duration, type = 'sine', delay = 0, endFrequency = frequency) {
    if (this.muted || !this.context || this.context.state !== 'running') return;
    try {
      const c = this.context, start = c.currentTime + delay;
      const oscillator = c.createOscillator(), gain = c.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.4, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(gain); gain.connect(this.master);
      this.voices.add(oscillator);
      oscillator.onended = () => { this.voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(start); oscillator.stop(start + duration + 0.02);
    } catch { /* Audio must never interrupt gameplay. */ }
  }
  cue(name) {
    const melodies = { start: [330, 440, 660], level: [440, 550, 660, 880], win: [523, 659, 784, 1047], over: [330, 260, 165] };
    if (melodies[name]) { melodies[name].forEach((f, i) => this.tone(f, 0.16, 'triangle', i * 0.13)); return; }
    if (name === 'eat') { this.tone(660, 0.08, 'sine'); this.tone(990, 0.1, 'sine', 0.07); }
    if (name === 'shot') this.tone(180, 0.11, 'square', 0, 45);
    if (name === 'hit') this.tone(100, 0.22, 'sawtooth', 0, 25);
    if (name === 'destroy') { this.tone(140, 0.18, 'sawtooth', 0, 30); this.tone(520, 0.12, 'triangle', 0.12); }
    if (name === 'pass') this.tone(740, 0.07, 'sine');
  }
  setEngine(speed = 0) {
    if (!speed || this.muted || !this.context || this.context.state !== 'running') { this.stopEngine(); return; }
    try {
      if (!this.engine) {
        const oscillator = this.context.createOscillator(), gain = this.context.createGain();
        oscillator.type = 'triangle'; gain.gain.value = 0.13;
        oscillator.connect(gain); gain.connect(this.master); oscillator.start();
        this.engine = { oscillator, gain };
      }
      this.engine.oscillator.frequency.setTargetAtTime(45 + speed * 0.18, this.context.currentTime, 0.12);
    } catch { this.stopEngine(); }
  }
  stopEngine() {
    if (!this.engine) return;
    try { this.engine.oscillator.stop(); this.engine.oscillator.disconnect(); this.engine.gain.disconnect(); } catch {}
    this.engine = null;
  }
  silence() {
    this.stopEngine();
    for (const oscillator of this.voices) { try { oscillator.stop(); } catch {} }
    this.voices.clear();
  }
}
