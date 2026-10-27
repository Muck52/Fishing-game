// The fight's gauges, standing beside the angler where the cast's power
// meter was: carved from the same wood, so they read as part of the dock
// rather than a panel over the game.
//
//   the tall one   how tight the line is, filling up; the top fifth is the
//                  red zone (hold it there for a bonus, at the risk of a
//                  snap), notched where it starts
//   the slim one   how much fight the fish has left, under a little fish;
//                  blue, turning green as it tires
//   above them     what to do right now (EASE, LET GO, >>), when it matters
//   beside them    how much line is out, and the bonus won so far
import { ANGLER_X, DECK_Y, DEPTH, INK, label } from '../core/constants.js';

const X = ANGLER_X + 14; // as the power meter
const TOP = DECK_Y - 54;
const H = 34;
const RED = 80; // where the red zone starts (TensionFight)
const SX = X + 8; // the stamina gauge
const ARROW = { left: '<<', right: '>>', up: '^^' };

const INK_DARK = 0x25131a;
const WOOD = 0x4a3426;
const WOOD_LIT = 0x6b4a32;

export class TensionMeter {
  constructor(scene) {
    this.scene = scene;
    const at = (o) => o.setDepth(DEPTH.UI - 1).setVisible(false);
    this.g = at(scene.add.graphics());
    this.cue = at(label(scene, X + 5, TOP - 9, '', { font: 'head' }));
    this.line = at(label(scene, SX + 7, TOP + H - 6, '').setOrigin(0, 0.5));
    this.bonus = at(label(scene, SX + 7, TOP + H - 18, '', { color: INK.gold }).setOrigin(0, 0.5));
    this.parts = [this.g, this.cue, this.line, this.bonus];
  }

  show(on) {
    for (const o of this.parts) o.setVisible(on);
    if (!on) this.g.clear();
  }

  // A carved frame: dark outline with its corners rounded off, wood inside
  // with a lit left edge.
  frame(x, w) {
    const g = this.g;
    g.fillStyle(INK_DARK, 1).fillRect(x, TOP - 1, w, H + 2).fillRect(x - 1, TOP, w + 2, H);
    g.fillStyle(WOOD, 1).fillRect(x, TOP, w, H);
    g.fillStyle(WOOD_LIT, 1).fillRect(x, TOP, 1, H);
  }

  // phase: what the fish is doing (TensionFight, or the rhythm fight's
  // beats); stamina and bonus 0..1 when the fight has them.
  update(tension, distance, phase = null, stamina = null, bonus = 0, need = null) {
    const g = this.g.clear();
    const t = this.scene.time.now;
    // the line strains: past 85 the whole gauge trembles
    const dx = tension > 85 ? Math.round(Math.sin(t / 30)) : 0;
    const x = X + dx;

    this.frame(x, 5);
    const inner = H - 2;
    const redY = TOP + 1 + Math.round(inner * (1 - RED / 100));
    // the red zone, dim until the line reaches it
    g.fillStyle(0x9a3c32, 1).fillRect(x + 1, TOP + 1, 3, redY - TOP - 1);
    const fill = Math.round((inner * tension) / 100);
    const c = tension >= RED ? 0xff7a5a : tension >= 60 ? 0xffd84a : 0x9cf07a;
    g.fillStyle(c, 1).fillRect(x + 1, TOP + 1 + inner - fill, 3, fill);
    g.fillStyle(0xfff4d6, 0.5).fillRect(x + 1, TOP + 1 + inner - fill, 1, fill); // a lit edge
    // the notch where the red starts
    g.fillStyle(INK_DARK, 1).fillRect(x - 1, redY, 9, 1);
    g.fillStyle(0xfff4d6, 1).fillRect(x - 3, redY, 2, 1);
    // in the red: a glint of gold at the top for the bonus building
    if (tension >= RED && Math.floor(t / 120) % 2) g.fillStyle(0xffd84a, 1).fillRect(x + 2, TOP + 2, 1, 1);

    if (stamina !== null) {
      this.frame(SX, 2);
      const s = Math.round(inner * stamina);
      g.fillStyle(stamina < 0.2 ? 0x9cf07a : 0x6ab0e0, 1).fillRect(SX, TOP + 1 + inner - s, 2, s);
      // a little fish over it, whose fight it is
      g.fillStyle(0xd8f0ff, 1).fillRect(SX - 2, TOP - 4, 4, 2).fillRect(SX + 2, TOP - 5, 1, 1).fillRect(SX + 2, TOP - 2, 1, 1).fillRect(SX + 2, TOP - 4, 1, 2);
      g.fillStyle(INK_DARK, 1).fillRect(SX - 1, TOP - 4, 1, 1);
    }

    // the cue, only when there's something to do
    const cue = {
      tell: ['EASE', INK.red],
      run: ['LET GO', INK.red],
      pull: ['WAIT', INK.red],
      leap: ['LET GO', INK.red],
      window: ['REEL!', INK.green],
      dash: [need ? ARROW[need] : 'STEER', INK.gold],
    }[phase];
    this.cue.setText(cue ? cue[0] : '').setTint(cue ? cue[1] : INK.cream);
    this.cue.y = TOP - 10 + (cue ? Math.round(Math.sin(t / 90)) : 0);
    this.line.setText(`${Math.max(0, Math.round(distance * 0.6))} ft`);
    this.bonus.setText(bonus > 0.05 ? `+${Math.round(bonus * 50)}%` : '');
  }
}
