// The cast's power meter: a little upright gauge beside the angler that
// fills while you hold, then falls back if you hold too long, and rises
// again. Let go and the line goes out as far as it was full.
import { ANGLER_X, DECK_Y, DEPTH } from '../core/constants.js';
import { METER } from '../fish/Habits.js';

const X = ANGLER_X + 14;
const TOP = DECK_Y - 52;
const H = 32;
const CYCLE = 1300; // ms to fill and fall back again

export class PowerMeter {
  constructor(scene) {
    this.scene = scene;
    this.g = scene.add.graphics().setDepth(DEPTH.UI - 1).setVisible(false);
    this.level = 0;
  }

  show(on) {
    this.g.setVisible(on);
    if (!on) this.g.clear();
  }

  // How full it is after `ms` of holding: up, then back down, and up again.
  set(ms) {
    const k = (ms % CYCLE) / CYCLE;
    this.level = k < 0.5 ? k * 2 : 2 - k * 2;
    this.draw();
    return this.level;
  }

  draw() {
    const g = this.g;
    const fill = Math.round(this.level * (H - 2));
    g.clear();
    g.fillStyle(0x25131a, 1).fillRect(X - 1, TOP - 1, 7, H + 2); // its frame
    g.fillStyle(0x4a3426, 1).fillRect(X, TOP, 5, H);
    // green low, gold, then red at the top
    const c = this.level > 0.85 ? 0xff7a5a : this.level > 0.5 ? 0xffd84a : 0x9cf07a;
    g.fillStyle(c, 1).fillRect(X + 1, TOP + H - 1 - fill, 3, fill);
    g.fillStyle(0xfff4d6, 0.5).fillRect(X + 1, TOP + H - 1 - fill, 1, fill); // a lit edge
    // marks where shallow turns to mid, and mid to deep (as in the journal)
    for (const pc of [METER.mid[0], METER.deep[0]]) {
      const y = TOP + H - 1 - Math.round((pc / 100) * (H - 2));
      g.fillStyle(0x25131a, 1).fillRect(X - 1, y, 9, 1); // notched past the frame
      g.fillStyle(0xfff4d6, 1).fillRect(X + 6, y, 2, 1);
    }
  }
}
