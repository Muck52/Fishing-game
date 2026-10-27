import { W, DEPTH, INK, label } from '../core/constants.js';
import { pill } from './Panels.js';

const Y = 74; // under the counters and the weather
const LEN = 200; // px of bar
const RED = 80; // where the red zone starts (TensionFight)

// A wooden gauge across the top while a fish is on: how tight the line is
// (the red end marked: hold it there for a bonus, at the risk of a snap),
// how much fight the fish has left, and how much line is out. The label
// on the left is the cue: what to do right now.
export class TensionMeter {
  constructor(scene) {
    const frame = pill(scene, 0, 5, LEN + 10, 26);
    this.fill = scene.add.graphics();
    this.name = label(scene, -LEN / 2 - 9, 0, 'TENSION').setOrigin(1, 0.5);
    this.fishName = label(scene, -LEN / 2 - 9, 11, 'FISH', { color: INK.sky }).setOrigin(1, 0.5);
    this.distance = label(scene, LEN / 2 + 10, 0, '').setOrigin(0, 0.5);
    this.bonus = label(scene, LEN / 2 + 10, 11, '', { color: INK.gold }).setOrigin(0, 0.5);
    this.box = scene.add.container(W / 2 + 18, Y, [frame, this.fill, this.name, this.fishName, this.distance, this.bonus]).setDepth(DEPTH.UI).setVisible(false);
  }

  show(on) {
    this.box.setVisible(on);
  }

  // phase: what the fish is doing (TensionFight, or the rhythm fight's
  // beats); stamina and bonus 0..1 when the fight has them.
  update(tension, distance, phase = null, stamina = null, bonus = 0, need = null) {
    const ARROW = { left: '<<', right: '>>', up: '^^' };
    const cue = {
      tell: ['EASE', INK.red],
      run: ['LET GO', INK.red],
      pull: ['WAIT', INK.red],
      leap: ['LET GO', INK.red],
      window: ['REEL!', INK.green],
      dash: [need ? `SWIPE ${ARROW[need]}` : 'STEER', INK.gold],
    }[phase];
    this.name.setText(cue ? cue[0] : 'TENSION').setTint(cue ? cue[1] : INK.cream);
    const g = this.fill.clear();
    const color = tension < 60 ? 0x8ad06a : tension < RED ? 0xf0c040 : 0xe84a3a;
    const w = Math.round((LEN * tension) / 100);
    g.fillStyle(0x25131a, 0.6).fillRect(-LEN / 2, -4, LEN, 8);
    g.fillStyle(0xe84a3a, 0.25).fillRect(-LEN / 2 + (LEN * RED) / 100, -4, (LEN * (100 - RED)) / 100, 8); // the red zone
    g.fillStyle(color, 1).fillRect(-LEN / 2, -4, w, 8);
    g.fillStyle(0xffffff, 0.4).fillRect(-LEN / 2, -4, w, 2);
    g.fillStyle(0x25131a, 1).fillRect(-LEN / 2 + (LEN * RED) / 100, -6, 1, 12); // its edge
    this.fishName.setVisible(stamina !== null);
    if (stamina !== null) {
      // the fish's fight left in it: blue, draining as it tires
      g.fillStyle(0x25131a, 0.6).fillRect(-LEN / 2, 9, LEN, 4);
      g.fillStyle(stamina < 0.2 ? 0x9cf07a : 0x6ab0e0, 1).fillRect(-LEN / 2, 9, Math.round(LEN * stamina), 4);
    }
    this.bonus.setText(bonus > 0.05 ? `+${Math.round(bonus * 50)}%` : '');
    this.distance.setText(`${Math.max(0, Math.round(distance * 0.6))} ft`);
    this.box.y = Y + (tension > 85 ? Phaser.Math.Between(-1, 1) : 0);
  }
}
