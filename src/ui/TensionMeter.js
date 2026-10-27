// The fight's gauges, on a wooden plaque across the top like the counters:
//
//   the hook's row   how tight the line is: an inset groove filling green,
//                    gold, then red; its last fifth is the red zone (hold it
//                    there for a bonus, at the risk of a snap), ticked where
//                    it starts
//   the fish's row   how much fight the fish has left: blue, turning green
//                    as it tires
//   on the right     how much line is out, and the bonus won so far
//   under it         which way to swipe when it bolts for cover
import { W, DEPTH, INK, label } from '../core/constants.js';
import { pill } from './Panels.js';

const Y = 76; // under the counters and the weather
const PW = 244; // the plaque
const X0 = W / 2 - 94; // the grooves
const LEN = 160;
const TY = Y - 6; // tension groove top
const TH = 7;
const SY = Y + 5; // stamina groove top
const SH = 4;
const RED = 80; // where the red zone starts (TensionFight)
const ARROW = { left: '<<', right: '>>', up: '^^' };
const DARK = 0x25131a;

export class TensionMeter {
  constructor(scene) {
    this.scene = scene;
    const ui = (o) => o.setDepth(DEPTH.UI).setVisible(false);
    this.plaque = ui(pill(scene, W / 2, Y, PW, 30));
    this.g = ui(scene.add.graphics()).setDepth(DEPTH.UI + 0.1);
    this.hook = ui(scene.add.image(X0 - 12, TY + 3, 'hook')).setDepth(DEPTH.UI + 0.1);
    this.line = ui(label(scene, X0 + LEN + 8, TY + 3, '').setOrigin(0, 0.5)).setDepth(DEPTH.UI + 0.1);
    this.bonus = ui(label(scene, X0 + LEN + 8, SY + 2, '', { color: INK.gold }).setOrigin(0, 0.5)).setDepth(DEPTH.UI + 0.1);
    this.cue = ui(label(scene, W / 2, Y + 25, '', { font: 'head' })).setDepth(DEPTH.UI + 0.1);
    this.parts = [this.plaque, this.g, this.hook, this.line, this.bonus, this.cue];
  }

  show(on) {
    for (const o of this.parts) o.setVisible(on);
    this.on = on;
  }

  // An inset groove with its ends rounded off, filled to `k` (0..1).
  groove(y, h, k, color, under = null) {
    const g = this.g;
    g.fillStyle(DARK, 1).fillRect(X0, y - 1, LEN, h + 2).fillRect(X0 - 1, y, LEN + 2, h);
    g.fillStyle(0x3a2420, 1).fillRect(X0, y, LEN, h);
    if (under) under();
    const w = Math.round(LEN * k);
    if (w > 0) {
      g.fillStyle(color, 1).fillRect(X0, y, w, h);
      g.fillStyle(0xffffff, 0.35).fillRect(X0, y, w, 1); // lit along the top
      g.fillStyle(0x000000, 0.18).fillRect(X0, y + h - 1, w, 1); // shaded below
    }
  }

  // phase: what the fish is doing (TensionFight, or the rhythm fight's
  // beats); stamina and bonus 0..1 when the fight has them.
  update(tension, distance, phase = null, stamina = null, bonus = 0, need = null) {
    const g = this.g.clear();
    const t = this.scene.time.now;
    const rx = X0 + Math.round((LEN * RED) / 100);
    const c = tension >= RED ? 0xff7a5a : tension >= 60 ? 0xffd84a : 0x9cf07a;
    this.groove(TY, TH, tension / 100, c, () => g.fillStyle(0x6a2a26, 1).fillRect(rx, TY, X0 + LEN - rx, TH));
    // ticks above and below where the red begins
    g.fillStyle(0xfff4d6, 1).fillRect(rx, TY - 3, 1, 2).fillRect(rx, TY + TH + 1, 1, 1);
    // building the bonus: a glint running along the red
    if (tension >= RED) g.fillStyle(0xffd84a, 1).fillRect(rx + ((Math.floor(t / 40) % (X0 + LEN - rx - 1)) || 0), TY, 1, 1);

    if (stamina !== null) {
      this.groove(SY, SH, stamina, stamina < 0.2 ? 0x9cf07a : 0x6ab0e0);
      // a little fish for its row
      const fx = X0 - 16;
      const fy = SY;
      g.fillStyle(DARK, 1).fillRect(fx + 1, fy, 6, 3).fillRect(fx, fy + 1, 1, 1).fillRect(fx + 7, fy - 1, 1, 5).fillRect(fx + 8, fy - 1, 1, 1).fillRect(fx + 8, fy + 3, 1, 1);
      g.fillStyle(0xfff4d6, 1).fillRect(fx + 2, fy + 1, 1, 1); // its eye
    }

    this.line.setText(`${Math.max(0, Math.round(distance * 0.6))} ft`);
    this.bonus.setText(bonus > 0.05 ? `+${Math.round(bonus * 50)}%` : '');
    // (no warnings to let go: those you feel, in the rod and the buzz)
    const cue = {
      pull: ['WAIT', INK.red],
      window: ['REEL!', INK.green],
      dash: [need ? `${ARROW[need]} SWIPE ${ARROW[need]}` : 'STEER', INK.gold],
    }[phase];
    this.cue.setText(cue ? cue[0] : '').setTint(cue ? cue[1] : INK.cream);
    // the line straining: the plaque trembles near a snap
    const shake = tension > 85 ? Math.round(Math.sin(t / 30)) : 0;
    for (const o of this.parts) if (o !== this.cue) o.x = (o.baseX ??= o.x) + shake;
    this.cue.y = Y + 25 + (cue ? Math.round(Math.sin(t / 90)) : 0);
  }
}
