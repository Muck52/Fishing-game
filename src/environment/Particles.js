import { W, PX, HORIZON, DEPTH } from '../core/constants.js';
import { FALLS } from '../art/SceneryArt.js';

// Phaser particle emitters for the lake's moving bits: mist and spray where
// the waterfall lands, pollen drifting in the sun, and leaves blowing off
// the far shore. The wind leans all of them to the right.
export class Particles {
  constructor(scene) {
    const fx = (FALLS.x + FALLS.w / 2) * PX;
    const fy = HORIZON * PX;
    const fw = FALLS.w * PX;

    this.mist = scene.add.particles(fx, fy, 'mist-puff', {
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-fw, -6 * PX, fw * 2, 6 * PX) },
      lifespan: { min: 2200, max: 3400 },
      frequency: 110,
      speedX: { min: -4, max: 14 },
      speedY: { min: -26, max: -10 },
      scale: { start: PX - 1, end: PX + 3 },
      alpha: { start: 0.4, end: 0 },
    }).setDepth(DEPTH.WATER_LIFE + 0.1);

    this.spray = scene.add.particles(fx, fy - 2 * PX, 'drop', {
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-fw / 2, 0, fw, PX) },
      lifespan: { min: 380, max: 700 },
      frequency: 45,
      speed: { min: 40, max: 110 },
      angle: { min: 200, max: 340 },
      gravityY: 320,
      scale: { min: PX - 2, max: PX - 1 },
      alpha: { start: 0.95, end: 0.2 },
    }).setDepth(DEPTH.WATER_LIFE + 0.2);

    this.pollen = scene.add.particles(0, 0, 'pollen', {
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-40, (HORIZON - 30) * PX, W, 160 * PX) },
      lifespan: { min: 6000, max: 9000 },
      frequency: 350,
      speedX: { min: 6, max: 22 },
      speedY: { min: -8, max: 6 },
      scale: PX - 1,
      alpha: { start: 0.9, end: 0 },
    }).setDepth(DEPTH.MIST_NEAR + 0.6);

    this.leaves = scene.add.particles(0, 0, 'leaf', {
      frame: [0, 1, 2],
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-30, (HORIZON - 34) * PX, W * 0.55, 26 * PX) },
      lifespan: { min: 6000, max: 8000 },
      frequency: 1600,
      speedX: { min: 18, max: 50 },
      speedY: { min: 12, max: 34 },
      rotate: { onEmit: () => 90 * Phaser.Math.Between(0, 3) },
      scaleX: { start: PX, end: -PX }, // tumbling over and over as it falls
      scaleY: PX,
      alpha: { start: 1, end: 0, ease: 'Quint.easeIn' },
    }).setDepth(DEPTH.MIST_NEAR + 0.5);
  }

  update(wind) {
    this.pollen.accelerationX = wind * 12;
    this.leaves.accelerationX = wind * 20;
    this.leaves.frequency = 2400 - wind * 1600;
    this.mist.accelerationX = wind * 10;
  }
}
