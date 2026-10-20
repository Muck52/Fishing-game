import { W, PX, AW, DEPTH } from '../core/constants.js';
import { WAVE_BANDS } from '../art/SceneryArt.js';

// Wave crests rolling across the lake. Each band is two layers of the same
// crests drifting at different speeds, so they cross and shimmer. The wind
// sets how fast they run and how choppy (visible) they are.
export class Waves {
  constructor(scene, wind) {
    this.scene = scene;
    this.wind = wind;
    this.layers = [];
    WAVE_BANDS.forEach((b, i) => {
      for (const [drift, offset] of [[1, 0], [0.55, AW / 2]]) {
        const t = scene.add.tileSprite(0, b.y0 * PX, AW, b.y1 - b.y0, `waves-${i}`);
        t.setOrigin(0).setScale(PX).setDepth(DEPTH.WATER_LIFE - 0.5);
        t.tilePositionX = offset;
        this.layers.push({ t, band: b, i, drift, baseY: b.y0 * PX, phase: i * 1.7 + drift * 3 });
      }
    });
  }

  // Ahead of a gust, a dark patch of ruffled water races across the lake.
  gustPatch(g) {
    const s = this.scene;
    const y = Phaser.Math.Between(WAVE_BANDS[0].y0 + 6, WAVE_BANDS[3].y0) * PX;
    const patch = s.add.image(-60 * PX, y, 'gust').setScale(PX).setDepth(DEPTH.WATER_LIFE - 0.4).setAlpha(0);
    s.tweens.add({ targets: patch, x: W + 60 * PX, duration: g.length * 1000 * 1.4, ease: 'Sine.easeIn', onComplete: () => patch.destroy() });
    s.tweens.add({ targets: patch, alpha: 0.35 + g.power * 0.3, duration: g.length * 500, yoyo: true });
  }

  update(time, dt) {
    const w = this.wind.strength;
    for (const l of this.layers) {
      // closer bands move faster across the screen
      l.t.tilePositionX -= (2 + l.i * 3) * w * l.drift * dt;
      // a slow swell lifts and drops each band by a pixel
      l.t.y = l.baseY + Math.round(Math.sin(time / 1300 + l.phase)) * PX;
      l.t.setAlpha(Math.min(1, (0.15 + w * 0.6) * l.band.alpha * (l.drift < 1 ? 0.7 : 1)));
    }
  }
}
