import { W, BACK_X, DEPTH, LOOK_UP } from '../core/constants.js';
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
    this.upperSky(scene);
    layer('mountains', DEPTH.MOUNTAINS);
    layer('land', DEPTH.LAND);
    const f = back(ART.anchors.falls.x, ART.anchors.falls.y);
    scene.add.sprite(f.x, f.y, 'falls').setOrigin(0).setDepth(DEPTH.FALLS).play('falls');

    this.clouds = [
      ['cloud-big', 20, 0.6, 1],
      ['cloud-3', 75, 1, 0.9],
      ['cloud-1', 125, 1.6, 0.85],
      ['cloud-2', 45, 1.3, 0.8],
      ['cloud-1', -LOOK_UP * 0.7, 0.8, 0.7],
      ['cloud-3', -LOOK_UP * 0.3, 1.1, 0.8],
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

  // The sky above the art, seen while the camera looks up: the art's pale
  // bands carried on upward, deepening a step at a time with a dithered
  // seam between each, and stars that come out at night.
  upperSky(scene) {
    const g = scene.add.graphics().setDepth(DEPTH.SKY);
    const bands = [0xf2f4f3, 0xe5f6f6, 0xd3f0ee, 0xb0ecf0, 0xb2d0d0];
    const step = Math.ceil((LOOK_UP + 8) / bands.length);
    bands.forEach((c, i) => {
      const y1 = -i * step;
      g.fillStyle(c, 1).fillRect(0, y1 - step, W, step);
      if (i) for (let x = i % 2; x < W; x += 2) g.fillStyle(bands[i - 1], 1).fillRect(x, y1, 1, 1);
    });
    this.stars = Array.from({ length: 26 }, () => {
      const s = scene.add.image(Phaser.Math.Between(4, W - 4), Phaser.Math.Between(-LOOK_UP, 30), 'star').setDepth(DEPTH.GLOW);
      s.phase = Math.random() * Math.PI * 2;
      return s;
    });
  }

  update(dt, wind, night = 0, time = 0) {
    for (const s of this.stars) s.setAlpha(night > 0.5 ? (night - 0.5) * 2 * (0.6 + 0.4 * Math.sin(time / 700 + s.phase)) : 0);
    for (const c of this.clouds) {
      c.x += c.speed * (0.5 + wind * 1.5) * dt;
      if (c.x > W) c.x = -c.width;
    }
    this.mist.accelerationX = wind * 7;
  }
}
