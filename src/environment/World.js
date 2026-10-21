import { W, SURFACE_Y, DEPTH } from '../core/constants.js';
import { Wind } from './Wind.js';
import { Backdrop } from './Backdrop.js';
import { Lake } from './Lake.js';
import { Pier } from './Pier.js';
import { Daylight } from './Daylight.js';

// Everything in the scene that isn't the angler or the game: the far bank,
// the lake, the pier, the breeze that moves them all and the light of the
// hour.
export class World {
  constructor(scene) {
    this.wind = new Wind();
    this.backdrop = new Backdrop(scene);
    this.lake = new Lake(scene);
    this.pier = new Pier(scene);
    this.daylight = new Daylight(scene, this.pier);

    // seed fluff and pollen drifting over the water in the sun
    this.pollen = scene.add.particles(0, 0, 'mote', {
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-30, 130, W, SURFACE_Y - 140) },
      lifespan: { min: 6000, max: 9000 },
      frequency: 300,
      speedX: { min: 4, max: 13 },
      speedY: { min: -5, max: 4 },
      alpha: { start: 0.9, end: 0 },
    }).setDepth(DEPTH.AIR);
  }

  update(time, dt) {
    this.wind.update(dt);
    const w = this.wind.strength;
    this.backdrop.update(dt, w);
    this.lake.update(time, dt, w);
    this.pier.update(time);
    this.daylight.update(time);
    this.pollen.accelerationX = w * 7;
    this.pollen.setVisible(this.daylight.night < 0.5);
  }
}
