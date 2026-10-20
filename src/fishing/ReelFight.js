import { clamp } from '../core/constants.js';

export const ESCAPE_DISTANCE = 125;

// The tug-of-war after a fish is hooked. Holding reels the fish in but raises
// line tension; letting go eases tension while the fish swims back out.
export class ReelFight {
  constructor(fish, startDistance) {
    this.strength = fish.strength;
    this.distance = startDistance;
    this.startDistance = startDistance;
    this.tension = 0;
    this.pull = 0;
    this.time = 0;
    this.surge = 0;
    this.nextSurge = 1 + Math.random() * 1.5;
    this.phase = Math.random() * Math.PI * 2;
  }

  // Returns 'caught', 'snapped', 'escaped', or null while the fight goes on.
  update(dt, reeling) {
    this.time += dt;

    // Every so often the fish makes a hard run.
    this.nextSurge -= dt;
    if (this.nextSurge <= 0) {
      this.surge = 0.5 + Math.random() * 0.5;
      this.nextSurge = 1.2 + Math.random() * 2 * (1.2 - this.strength);
    }
    this.surge = Math.max(0, this.surge - dt);

    const wave = 0.6 + 0.4 * Math.sin(this.time * 2.3 + this.phase);
    this.pull = this.strength * wave * (this.surge > 0 ? 1.8 : 1);

    if (reeling) {
      this.tension += (this.pull * 60 - 6) * dt;
      this.distance -= 18 * (1.2 - this.strength * 0.5) * dt;
    } else {
      this.tension -= 70 * dt;
      this.distance += this.pull * 6 * dt;
    }
    this.tension = clamp(this.tension, 0, 100);

    if (this.tension >= 100) return 'snapped';
    if (this.distance <= 0) return 'caught';
    if (this.distance >= ESCAPE_DISTANCE) return 'escaped';
    return null;
  }

  get surging() {
    return this.surge > 0;
  }
}
