import { W, BACK_X, DEPTH } from '../core/constants.js';
import { ART } from '../core/Assets.js';

// A point on the backdrop art, on screen.
export const back = (x, y) => ({ x: x - BACK_X, y });

// The far side of the lake: sky, snowy peaks, and the pine-covered bank
// with its waterfall and the stream that runs down into the lake. Clouds
// drift with the wind and spray rises where the falls land.
export class Backdrop {
  constructor(scene) {
    this.scene = scene;
    const layer = (key, depth) => scene.add.image(-BACK_X, 0, key).setOrigin(0).setDepth(depth);
    layer('sky', DEPTH.SKY);
    layer('mountains', DEPTH.MOUNTAINS);
    layer('land', DEPTH.LAND);
    const f = back(ART.anchors.falls.x, ART.anchors.falls.y);
    scene.add.sprite(f.x, f.y, 'falls').setOrigin(0).setDepth(DEPTH.FALLS).play('falls');

    this.clouds = [
      ['cloud-big', 20, 0.6, 1],
      ['cloud-3', 75, 1, 0.9],
      ['cloud-1', 125, 1.6, 0.85],
      ['cloud-2', 45, 1.3, 0.8],
    ].map(([key, y, speed, alpha], i) => {
      const c = scene.add.image(i === 0 ? 30 : Math.random() * W, y, key).setOrigin(0, 0.5).setAlpha(alpha).setDepth(DEPTH.CLOUDS);
      c.speed = speed;
      return c;
    });

    // spray and mist rising off the plunge pool
    const foot = back(ART.anchors.fallsFoot.x, ART.anchors.fallsFoot.y);
    this.mist = scene.add.particles(foot.x, foot.y, 'mist', {
      x: { min: -12, max: 12 },
      lifespan: { min: 1800, max: 3000 },
      frequency: 110,
      speedX: { min: -3, max: 6 },
      speedY: { min: -15, max: -6 },
      scale: { start: 1, end: 2 },
      alpha: { start: 0.45, end: 0 },
    }).setDepth(DEPTH.MIST);
    this.spray = scene.add.particles(foot.x, foot.y - 2, 'drop', {
      x: { min: -7, max: 7 },
      lifespan: { min: 300, max: 650 },
      frequency: 40,
      speed: { min: 15, max: 45 },
      angle: { min: 210, max: 330 },
      gravityY: 130,
      alpha: { start: 0.9, end: 0.1 },
    }).setDepth(DEPTH.MIST);
  }

  update(dt, wind) {
    for (const c of this.clouds) {
      c.x += c.speed * (0.5 + wind * 1.5) * dt;
      if (c.x > W) c.x = -c.width;
    }
    this.mist.accelerationX = wind * 7;
  }
}
