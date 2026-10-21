import { clamp } from '../core/constants.js';

const R = (a, b) => Phaser.Math.Between(a, b);

// How each species moves in the catch bar, in the manner of Stardew Valley's
// fishing: `motion` is mixed (wanders), dart (sudden jumps), smooth (glides),
// sinker (drifts to the bottom) or floater (drifts to the top); `difficulty`
// (0-100) is how far and how often it moves.
export const MOVES = {
  bluegill: { motion: 'mixed', difficulty: 25 },
  pumpkinseed: { motion: 'mixed', difficulty: 25 },
  perch: { motion: 'dart', difficulty: 30 },
  crappie: { motion: 'floater', difficulty: 30 },
  whitebass: { motion: 'dart', difficulty: 40 },
  carp: { motion: 'sinker', difficulty: 25 },
  bass: { motion: 'mixed', difficulty: 45 },
  largemouth: { motion: 'mixed', difficulty: 50 },
  trout: { motion: 'dart', difficulty: 50 },
  rainbow: { motion: 'mixed', difficulty: 55 },
  channelcat: { motion: 'sinker', difficulty: 60 },
  drum: { motion: 'sinker', difficulty: 45 },
  walleye: { motion: 'smooth', difficulty: 55 },
  catfish: { motion: 'sinker', difficulty: 60 },
  pike: { motion: 'dart', difficulty: 70 },
  muskie: { motion: 'dart', difficulty: 85 },
  golden: { motion: 'mixed', difficulty: 90 },
};

// The track, in the units the movement is tuned in. 0 is the top.
export const TRACK = 568;
export const BAR = 150; // height of the green bar
export const ICON = 28; // the fish's height in the track
const STEP = 1 / 60;

// The catch bar. Hold to float the green bar up, let go to let it sink;
// keep the fish inside it to fill the catch meter. A treasure chest may
// turn up; keep it in the bar a moment to win it. update() returns
// 'caught' or 'escaped' when it is over.
export class BarFight {
  constructor(fish, startDistance) {
    this.fish = fish;
    this.m = MOVES[fish.id] || MOVES.perch;
    this.strength = fish.strength;
    this.difficulty = this.m.difficulty;
    this.startDistance = startDistance;
    this.fishPos = TRACK - 60; // starts low, inside the bar
    this.fishSpeed = 0;
    this.target = -1;
    this.drift = 0; // a sinker's or floater's slow pull
    this.barPos = TRACK - BAR;
    this.barSpeed = 0;
    this.progress = 0.3; // the catch meter, 0..1
    this.inBar = true;
    this.perfect = true;
    this.events = [];
    this.wait = 0.6; // a moment to get ready
    this.acc = 0;
    this.treasure = Math.random() < 0.25 ? { at: 1 + Math.random() * 2, pos: 0, level: 0, shown: false, got: false } : null;
    this.t = 0;
  }

  // compatibility with the scene's rod and float
  get distance() {
    return (this.startDistance * (1 - this.progress)) / 0.7;
  }

  get tension() {
    return this.inBar ? 15 : 60;
  }

  get pull() {
    return clamp(Math.abs(this.fishSpeed) / 6, 0, 1);
  }

  get phase() {
    return null;
  }

  update(dt, holding) {
    if (this.wait > 0) {
      this.wait -= dt;
      return null;
    }
    this.acc += dt;
    while (this.acc >= STEP) {
      this.acc -= STEP;
      this.step(holding);
    }
    if (this.progress >= 1) return 'caught';
    if (this.progress <= 0) return 'escaped';
    return null;
  }

  step(holding) {
    this.t += STEP;
    const d = this.difficulty;
    const motion = this.m.motion;

    // the fish picks somewhere new to swim to
    if (Math.random() < (d * (motion === 'smooth' ? 20 : 1)) / 4000 && (motion !== 'smooth' || this.target === -1)) {
      const below = TRACK - this.fishPos;
      const above = this.fishPos;
      const pct = Math.min(99, d + R(10, 45)) / 100;
      this.target = this.fishPos + R(Math.min(-above, below), below) * pct;
    }
    if (motion === 'floater') this.drift = Math.max(this.drift - 0.01, -1.5);
    else if (motion === 'sinker') this.drift = Math.min(this.drift + 0.01, 1.5);

    if (this.target !== -1 && Math.abs(this.fishPos - this.target) > 3) {
      const accel = (this.target - this.fishPos) / (R(10, 30) + (100 - Math.min(100, d)));
      this.fishSpeed += (accel - this.fishSpeed) / 5;
    } else if (motion !== 'smooth' && Math.random() < d / 2000) {
      this.target = this.fishPos + (Math.random() < 0.5 ? R(-100, -51) : R(50, 100));
    } else {
      this.target = -1;
    }
    if (motion === 'dart' && Math.random() < d / 1000) {
      this.target = this.fishPos + (Math.random() < 0.5 ? R(-100 - d * 2, -51) : R(50, 100 + d * 2));
    }
    this.target = clamp(this.target, -1, TRACK - 20);
    this.fishPos = clamp(this.fishPos + this.fishSpeed + this.drift, 0, TRACK - ICON);

    // is the fish inside the green bar?
    this.inBar = this.fishPos + ICON - 6 <= this.barPos + BAR && this.fishPos + 6 >= this.barPos;

    // the bar: holding lifts it, letting go it sinks; it is a little
    // sluggish while the fish is inside, which helps you keep it there
    let a = holding ? -0.25 : 0.25;
    if (holding && (this.barPos === 0 || this.barPos === TRACK - BAR)) this.barSpeed = 0;
    if (this.inBar) a *= 0.6;
    this.barSpeed += a;
    this.barPos += this.barSpeed;
    if (this.barPos + BAR > TRACK) {
      this.barPos = TRACK - BAR;
      this.barSpeed = (-this.barSpeed * 2) / 3;
      if (Math.abs(this.barSpeed) < 0.5) this.barSpeed = 0;
    } else if (this.barPos < 0) {
      this.barPos = 0;
      this.barSpeed = (-this.barSpeed * 2) / 3;
    }

    const was = this.progress;
    if (this.inBar) this.progress += 0.002;
    else {
      this.progress -= 0.003;
      if (this.perfect) {
        this.perfect = false;
        this.events.push({ kind: 'slipped' });
      }
    }
    this.progress = clamp(this.progress, 0, 1);
    if (was < 0.15 && this.progress >= 0.15) this.events.push({ kind: 'saved' });
    else if (was >= 0.15 && this.progress < 0.15) this.events.push({ kind: 'escaping' });

    // the treasure chest
    const c = this.treasure;
    if (c && !c.got) {
      if (!c.shown && this.t >= c.at) {
        c.shown = true;
        c.pos = R(40, TRACK - 60);
        this.events.push({ kind: 'chest' });
      } else if (c.shown) {
        const inside = c.pos + 20 <= this.barPos + BAR && c.pos >= this.barPos;
        c.level = clamp(c.level + (inside ? 0.0135 : -0.01), 0, 1);
        if (c.level >= 1) {
          c.got = true;
          this.events.push({ kind: 'chestGot' });
        }
      }
    }
  }
}
