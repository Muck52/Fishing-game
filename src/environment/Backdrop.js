import { W, BG, BACK_X, DEPTH } from '../core/constants.js';
import { ART } from '../core/Assets.js';

// A point on the backdrop art, in screen pixels.
export const back = (x, y) => ({ x: (x - BACK_X) * BG, y: y * BG });

// The far side of the lake: sky, snowy peaks, and the pine-covered bank
// with its waterfall and the stream that runs down into the lake. Clouds
// drift with the wind and spray rises where the falls land.
export class Backdrop {
  constructor(scene) {
    this.scene = scene;
    const layer = (key, depth) => scene.add.image(-BACK_X * BG, 0, key).setOrigin(0).setScale(BG).setDepth(depth);
    layer('sky', DEPTH.SKY);
    layer('mountains', DEPTH.MOUNTAINS);
    layer('land', DEPTH.LAND);
    const f = back(ART.anchors.falls.x, ART.anchors.falls.y);
    scene.add.sprite(f.x, f.y, 'falls').setOrigin(0).setScale(BG).setDepth(DEPTH.FALLS).play('falls');

    this.clouds = [
      ['cloud-big', 40, 1.2, 1],
      ['cloud-3', 150, 2, 0.9],
      ['cloud-1', 250, 3.2, 0.85],
      ['cloud-2', 90, 2.6, 0.8],
    ].map(([key, y, speed, alpha], i) => {
      const c = scene.add.image(Math.random() * W, y, key).setOrigin(0, 0.5).setScale(BG).setAlpha(alpha).setDepth(DEPTH.CLOUDS);
      c.speed = speed;
      if (i === 0) c.x = 60;
      return c;
    });

    // spray and mist rising off the plunge pool
    const foot = back(ART.anchors.fallsFoot.x, ART.anchors.fallsFoot.y);
    this.mist = scene.add.particles(foot.x, foot.y, 'mist', {
      x: { min: -24, max: 24 },
      lifespan: { min: 1800, max: 3000 },
      frequency: 90,
      speedX: { min: -6, max: 12 },
      speedY: { min: -30, max: -12 },
      scale: { start: 1.5, end: 4 },
      alpha: { start: 0.45, end: 0 },
    }).setDepth(DEPTH.MIST);
    this.spray = scene.add.particles(foot.x, foot.y - 4, 'drop', {
      x: { min: -14, max: 14 },
      lifespan: { min: 300, max: 650 },
      frequency: 30,
      speed: { min: 30, max: 90 },
      angle: { min: 210, max: 330 },
      gravityY: 260,
      scale: 2,
      alpha: { start: 0.9, end: 0.1 },
    }).setDepth(DEPTH.MIST);
  }

  update(dt, wind) {
    for (const c of this.clouds) {
      c.x += c.speed * (0.5 + wind * 1.5) * dt * BG;
      if (c.x > W) c.x = -c.width * BG;
    }
    this.mist.accelerationX = wind * 14;
  }
}
