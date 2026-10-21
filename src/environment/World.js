import { W, SURFACE_Y, DEPTH } from '../core/constants.js';
import { Wind } from './Wind.js';
import { Backdrop } from './Backdrop.js';
import { Lake } from './Lake.js';
import { Pier } from './Pier.js';

// Everything in the scene that isn't the angler or the game: the far bank,
// the lake, the pier, and the breeze that moves them all.
export class World {
  constructor(scene) {
    this.wind = new Wind();
    this.backdrop = new Backdrop(scene);
    this.lake = new Lake(scene);
    this.pier = new Pier(scene);

    // seed fluff and pollen drifting over the water in the sun
    this.pollen = scene.add.particles(0, 0, 'mote', {
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-60, 260, W, SURFACE_Y - 280) },
      lifespan: { min: 6000, max: 9000 },
      frequency: 260,
      speedX: { min: 8, max: 26 },
      speedY: { min: -10, max: 8 },
      scale: { min: 2, max: 3 },
      alpha: { start: 0.9, end: 0 },
    }).setDepth(DEPTH.AIR);
  }

  update(time, dt) {
    this.wind.update(dt);
    const w = this.wind.strength;
    this.backdrop.update(dt, w);
    this.lake.update(time, dt, w);
    this.pier.update(time, w);
    this.pollen.accelerationX = w * 14;
  }
}
