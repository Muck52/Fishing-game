// The breeze off the lake. It blows left to right, rises and falls over
// about a minute, and every so often a gust rolls through.
export class Wind {
  constructor() {
    this.t = 0;
    this.strength = 0.3;
    this.gust = null;
    this.nextGust = 6;
    this.onGust = () => {};
  }

  update(dt) {
    this.t += dt;
    const base = 0.3 + 0.12 * Math.sin(this.t * 0.11) + 0.06 * Math.sin(this.t * 0.37);
    this.nextGust -= dt;
    if (!this.gust && this.nextGust <= 0) {
      this.gust = { age: 0, length: 3 + Math.random() * 3, power: 0.3 + Math.random() * 0.35 };
      this.onGust(this.gust);
    }
    let gust = 0;
    if (this.gust) {
      this.gust.age += dt;
      const k = this.gust.age / this.gust.length;
      gust = this.gust.power * Math.sin(Math.PI * Math.min(1, k));
      if (k >= 1) {
        this.gust = null;
        this.nextGust = 8 + Math.random() * 10;
      }
    }
    this.strength = base + gust;
  }

  // How far something flexible leans right now, with its own flutter.
  sway(phase) {
    const flutter = Math.sin(this.t * 2.6 + phase) * 0.25 + Math.sin(this.t * 5.3 + phase * 2) * 0.08;
    return this.strength * (0.75 + flutter);
  }
}
