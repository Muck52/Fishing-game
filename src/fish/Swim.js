const R = (a, b) => Phaser.Math.Between(a, b);
const F = (a, b) => a + Math.random() * (b - a);

// How each species swims when it isn't bothered, for the photo on its
// journal page. `band` is how deep it keeps, from 0 (the surface) to 1 (the
// bottom); `style` its habit:
//   hover    holds still on sculling fins, edges about, turns (sunfish)
//   school   a hovering schooler, short shuffles (perch)
//   cruise   swims steadily back and forth (white bass, rainbow, walleye)
//   dart     pauses, then quick bursts (smallmouth)
//   ambush   lies still for long spells, then lunges (largemouth, pike, muskie)
//   station  holds against the current, slipping back and forth, darting up
//            to take insects (brook trout)
//   bottom   cruises slowly along the bottom, stopping to root (carp, cats,
//            drum, sturgeon)
//   eel      creeps along the bottom with a slow eel-like wave (burbot)
// `speed` is its usual pace, `burst` its fast one, in pixels a second.
export const SWIMS = {
  bluegill: { style: 'hover', band: [0.35, 0.65], speed: 22, burst: 45 },
  pumpkinseed: { style: 'hover', band: [0.5, 0.8], speed: 20, burst: 40 },
  perch: { style: 'school', band: [0.45, 0.75], speed: 24, burst: 60 },
  crappie: { style: 'hover', band: [0.25, 0.5], speed: 14, burst: 35 },
  whitebass: { style: 'cruise', band: [0.2, 0.5], speed: 55, burst: 80 },
  carp: { style: 'bottom', band: [0.82, 0.88], speed: 14, burst: 30 },
  bass: { style: 'dart', band: [0.55, 0.85], speed: 25, burst: 75 },
  largemouth: { style: 'ambush', band: [0.4, 0.7], speed: 12, burst: 110 },
  trout: { style: 'station', band: [0.45, 0.6], speed: 10, burst: 80 },
  rainbow: { style: 'cruise', band: [0.25, 0.55], speed: 42, burst: 90 },
  channelcat: { style: 'bottom', band: [0.84, 0.9], speed: 16, burst: 35 },
  drum: { style: 'bottom', band: [0.8, 0.88], speed: 15, burst: 35 },
  walleye: { style: 'cruise', band: [0.6, 0.82], speed: 16, burst: 60 },
  catfish: { style: 'eel', band: [0.86, 0.9], speed: 9, burst: 20 },
  pike: { style: 'ambush', band: [0.35, 0.6], speed: 8, burst: 150 },
  muskie: { style: 'ambush', band: [0.35, 0.65], speed: 14, burst: 120 },
  golden: { style: 'bottom', band: [0.85, 0.9], speed: 9, burst: 18 },
};

// One fish swimming inside a rectangle (the photo), facing the way it goes.
// The art faces left, so it is flipped to swim right. Its tail beats faster
// the faster it swims. Positions are kept on the sprite's own pixel grid.
export class Swimmer {
  constructor(sprite, id, rect, onRoot = null) {
    this.s = sprite;
    this.id = id;
    this.p = SWIMS[id] || SWIMS.perch;
    this.onRoot = onRoot; // a bottom-feeder stirring up silt
    this.unit = sprite.scaleX;
    const hw = sprite.displayWidth / 2 + 2;
    const hh = sprite.displayHeight / 2;
    this.box = { x0: rect.x + hw, x1: rect.x + rect.w - hw, y0: rect.y + hh, y1: rect.y + rect.h - hh };
    this.pos = { x: (this.box.x0 + this.box.x1) / 2, y: this.depth() };
    this.speed = 0;
    this.left = true;
    this.act = { type: 'wait', t: 0.5, fin: 0.5 };
    this.sprite();
  }

  depth(f = Math.random()) {
    const [a, b] = this.p.band;
    return this.box.y0 + (this.box.y1 - this.box.y0) * (a + (b - a) * f);
  }

  rx() {
    return F(this.box.x0, this.box.x1);
  }

  // What it does next, by habit.
  next() {
    const p = this.p;
    const x = this.pos.x;
    const near = (d) => Phaser.Math.Clamp(x + F(-d, d), this.box.x0, this.box.x1);
    switch (p.style) {
      case 'hover':
      case 'school':
        if (Math.random() < 0.5) return { type: 'wait', t: F(0.8, 2.2), fin: 0.5, turn: Math.random() < 0.3 };
        return { type: 'go', x: near(p.style === 'school' ? 40 : 28), y: this.depth(), v: Math.random() < 0.2 ? p.burst : p.speed };
      case 'cruise': {
        // end to end, a little up or down each length; the rainbow now and
        // then rises toward the surface as if for a fly
        const far = this.left ? this.box.x0 + R(0, 10) : this.box.x1 - R(0, 10);
        const rise = this.id === 'rainbow' && Math.random() < 0.25;
        if (Math.abs(far - x) < 6) return { type: 'wait', t: F(0.15, 0.5), fin: 1, turn: true };
        return { type: 'go', x: far, y: rise ? this.box.y0 + 2 : this.depth(), v: p.speed };
      }
      case 'dart':
        if (Math.random() < 0.55) return { type: 'wait', t: F(0.5, 1.4), fin: 0.6 };
        return { type: 'go', x: this.rx(), y: this.depth(), v: Math.random() < 0.6 ? p.burst : p.speed };
      case 'ambush':
        if (this.act.type === 'wait' && Math.random() < 0.45) return { type: 'go', x: this.rx(), y: this.depth(), v: p.burst, lunge: true };
        if (Math.random() < 0.4) return { type: 'go', x: near(30), y: this.depth(), v: p.speed };
        return { type: 'wait', t: F(2, 5), fin: 0.25 };
      case 'station': {
        // facing into the current: slips back, swims up again, sometimes
        // dashes up to snatch something drifting past
        const home = (this.box.x0 + this.box.x1) / 2;
        if (Math.random() < 0.15) return { type: 'go', x: near(20), y: this.box.y0 + 2, v: p.burst, face: true };
        return { type: 'go', x: home + F(-8, 8), y: this.depth(), v: p.speed, face: true };
      }
      case 'bottom':
        if (this.act.type === 'go' && Math.random() < 0.6) return { type: 'wait', t: F(1, 2.6), fin: 0.6, root: true };
        return { type: 'go', x: this.rx(), y: this.depth(), v: p.speed };
      case 'eel':
        if (Math.random() < 0.25) return { type: 'wait', t: F(1, 2), fin: 0.4 };
        return { type: 'go', x: this.rx(), y: this.depth(), v: p.speed };
      default:
        return { type: 'wait', t: 1, fin: 0.5 };
    }
  }

  update(dt) {
    const a = this.act;
    if (a.type === 'wait') {
      a.t -= dt;
      this.speed = Math.max(0, this.speed - 60 * dt);
      if (a.turn && a.t < 0.3) {
        a.turn = false;
        this.left = !this.left;
      }
      if (a.root && Math.random() < dt * 3) this.onRoot?.(this.pos.x + (this.left ? -1 : 1) * this.s.displayWidth * 0.4, this.pos.y + this.s.displayHeight * 0.3);
      if (a.t <= 0) this.act = this.next();
      this.anim(a.fin);
    } else {
      const dx = a.x - this.pos.x;
      const dy = a.y - this.pos.y;
      const d = Math.hypot(dx, dy);
      // speed up toward its pace (a lunge is near-instant), ease off on arrival
      const want = d < 10 ? Math.max(6, a.v * (d / 10)) : a.v;
      this.speed += (want - this.speed) * Math.min(1, dt * (a.lunge ? 14 : 4));
      const step = Math.min(d, this.speed * dt);
      if (d > 0.01) {
        this.pos.x += (dx / d) * step;
        this.pos.y += (dy / d) * step;
      }
      if (!a.face && Math.abs(dx) > 1) this.left = dx < 0;
      if (a.face) this.left = true;
      if (d < 1) {
        if (this.p.style === 'cruise') this.left = !this.left;
        this.act = this.next();
      }
      this.anim(0.5 + this.speed / 25);
    }
    this.sprite();
  }

  anim(rate) {
    this.s.anims.timeScale = Phaser.Math.Clamp(rate, 0.25, 4);
  }

  sprite() {
    const u = this.unit;
    this.s.setFlipX(!this.left);
    this.s.x = Math.round(this.pos.x / u) * u;
    this.s.y = Math.round(this.pos.y / u) * u;
  }
}
