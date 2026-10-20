import { PX, DEPTH } from '../core/constants.js';
import { REEDS } from '../art/SceneryArt.js';

// Reeds, cattails and meadow flowers, redrawn each frame bending with the wind.
// Stems are anchored at the base and bend most at the tip.
export class Reeds {
  constructor(scene, wind) {
    this.g = scene.add.graphics().setDepth(DEPTH.BANKS + 0.2);
    this.wind = wind;
  }

  update() {
    const g = this.g;
    g.clear();
    for (const r of REEDS) {
      const lean = r.lean + this.wind.sway(r.phase) * r.give * (2 + r.h * 0.14);
      const xAt = (t) => r.bx + Math.round(lean * t * t);
      for (let k = 0; k < r.h; k++) {
        g.fillStyle(r.stalk[k], 1);
        g.fillRect(xAt(k / r.h) * PX, (r.by - k) * PX, PX, PX);
      }
      if (r.head) {
        const x = xAt(0.8);
        const top = r.by - Math.round(r.h * 0.8);
        r.head.forEach(([dark, light], i) => {
          g.fillStyle(dark, 1);
          g.fillRect(x * PX, (top - 4 + i) * PX, PX, PX);
          g.fillStyle(light, 1);
          g.fillRect((x + 1) * PX, (top - 4 + i) * PX, PX, PX);
        });
        g.fillStyle(r.tip, 1);
        g.fillRect(xAt(0.84) * PX, (top - 5) * PX, PX, PX);
      }
      if (r.bloom) {
        // a little five-pixel blossom nodding at the top of the stem
        const x = xAt(1);
        const y = r.by - r.h;
        for (const [dx, dy, c] of [[-1, 0, r.bloom.petal], [1, 0, r.bloom.petal], [0, 1, r.bloom.petal], [0, -1, r.bloom.lit], [0, 0, r.bloom.heart]]) {
          g.fillStyle(c, 1);
          g.fillRect((x + dx) * PX, (y + dy) * PX, PX, PX);
        }
      }
    }
  }
}
