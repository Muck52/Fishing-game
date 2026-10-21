import { W, DEPTH, label } from '../core/constants.js';
import { pill } from './Panels.js';

const Y = 46;
const LEN = 200; // px of bar

// A wooden gauge across the top while a fish is on: how tight the line is,
// and how much line is out.
export class TensionMeter {
  constructor(scene) {
    const frame = pill(scene, 0, 0, LEN + 10, 14);
    this.fill = scene.add.graphics();
    const name = label(scene, -LEN / 2 - 9, 0, 'TENSION').setOrigin(1, 0.5);
    this.distance = label(scene, LEN / 2 + 10, 0, '').setOrigin(0, 0.5);
    this.box = scene.add.container(W / 2 + 18, Y, [frame, this.fill, name, this.distance]).setDepth(DEPTH.UI).setVisible(false);
  }

  show(on) {
    this.box.setVisible(on);
  }

  update(tension, distance) {
    const color = tension < 60 ? 0x8ad06a : tension < 85 ? 0xf0c040 : 0xe84a3a;
    const w = Math.round((LEN * tension) / 100);
    this.fill.clear().fillStyle(0x25131a, 0.6).fillRect(-LEN / 2, -4, LEN, 8);
    this.fill.fillStyle(color, 1).fillRect(-LEN / 2, -4, w, 8);
    this.fill.fillStyle(0xffffff, 0.4).fillRect(-LEN / 2, -4, w, 2);
    this.distance.setText(`${Math.max(0, Math.round(distance * 0.6))} ft`);
    this.box.y = Y + (tension > 85 ? Phaser.Math.Between(-1, 1) : 0);
  }
}
