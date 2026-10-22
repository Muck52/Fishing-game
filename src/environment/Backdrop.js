import { W, BACK_X, DEPTH, LOOK_UP } from '../core/constants.js';
import { ART } from '../core/Assets.js';
import { hourNow, skyBlend } from './Daylight.js';

// A point on the backdrop art, on screen.
export const back = (x, y) => ({ x: x - BACK_X, y });

// The far side of the lake: the sky and the low, forested hills behind it
// (ours, drawn for each time of day; study 1 in docs/studio), and the
// pine-covered bank with its waterfall and the stream that runs down into
// the lake. Clouds drift with the wind and spray rises where the falls land.
//
// The sky, hills and clouds are already drawn in each hour's own light, so
// the time-of-day grade (Daylight.js) leaves them alone: `unshaded` marks
// where they show, and the grade is cut out there.
export class Backdrop {
  constructor(scene) {
    this.scene = scene;
    const layer = (key, depth) => scene.add.image(-BACK_X, 0, key).setOrigin(0).setDepth(depth);
    const sky = ART.anchors.sky;
    this.top = sky.top;
    // two copies of the sky, blended between the two times of day either
    // side of the hour
    this.skies = [0, 1].map(() => scene.add.image(0, sky.top, `sky-${sky.times[0]}`).setOrigin(0).setDepth(DEPTH.SKY));
    layer('land', DEPTH.LAND);
    const f = back(ART.anchors.falls.x, ART.anchors.falls.y);
    scene.add.sprite(f.x, f.y, 'falls').setOrigin(0).setDepth(DEPTH.FALLS).play('falls');

    // our clouds, each a pair blended the same way, drifting with the wind
    this.clouds = [
      [0, 20, 0.5],
      [1, -LOOK_UP * 0.55, 0.9],
      [2, 55, 1.3],
      [0, -LOOK_UP * 0.15, 0.7],
    ].map(([i, y, speed], k) => {
      const pair = [0, 1].map(() => scene.add.image(0, y, `cloud-${sky.times[0]}-${i}`).setOrigin(0, 0.5).setDepth(DEPTH.CLOUDS));
      return { i, pair, x: (k * 97 + 40) % W, speed };
    });

    // where the sky shows, for the grade to leave alone: the sky's band,
    // down to its bottom row, less the far bank and the falls in front of it
    this.unshaded = {
      bottom: sky.top + scene.textures.get(`sky-${sky.times[0]}`).getSourceImage().height,
      bank: [['land', undefined, -BACK_X, 0], ['falls', 0, f.x, f.y]],
    };

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

  update(dt, wind, night = 0, time = 0) {
    const [a, b, t] = skyBlend(hourNow());
    this.skies[0].setTexture(`sky-${a}`).setAlpha(1);
    this.skies[1].setTexture(`sky-${b}`).setAlpha(t);
    for (const c of this.clouds) {
      c.x += c.speed * (0.5 + wind * 1.5) * dt;
      const w = c.pair[0].width;
      if (c.x > W) c.x = -w;
      c.pair[0].setTexture(`cloud-${a}-${c.i}`).setAlpha(1);
      c.pair[1].setTexture(`cloud-${b}-${c.i}`).setAlpha(t);
      for (const p of c.pair) p.x = Math.round(c.x);
    }
    this.mist.accelerationX = wind * 7;
  }
}
