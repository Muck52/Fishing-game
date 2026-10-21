import { W, DEPTH, textStyle } from '../core/constants.js';
import { pill } from './Panels.js';

const Y = 128;
const LEN = 420; // px of bar

// A wooden gauge across the top while a fish is on: how tight the line is,
// and how much line is out.
export class TensionMeter {
  constructor(scene) {
    const frame = pill(scene, 0, 0, LEN / 3 + 10, 14);
    this.fill = scene.add.graphics();
    const label = scene.add.text(-LEN / 2 - 20, 0, 'TENSION', textStyle(22)).setOrigin(1, 0.5);
    this.distance = scene.add.text(LEN / 2 + 22, 0, '', textStyle(24)).setOrigin(0, 0.5);
    this.box = scene.add.container(W / 2 + 40, Y, [frame, this.fill, label, this.distance]).setDepth(DEPTH.UI).setVisible(false);
  }

  show(on) {
    this.box.setVisible(on);
  }

  update(tension, distance) {
    const color = tension < 60 ? 0x8ad06a : tension < 85 ? 0xf0c040 : 0xe84a3a;
    const w = Math.round((LEN * tension) / 100 / 3) * 3;
    this.fill.clear().fillStyle(0x2a1a14, 0.55).fillRect(-LEN / 2, -12, LEN, 24);
    this.fill.fillStyle(color, 1).fillRect(-LEN / 2, -12, w, 24);
    this.fill.fillStyle(0xffffff, 0.35).fillRect(-LEN / 2, -12, w, 6);
    this.distance.setText(`${Math.max(0, Math.round(distance * 0.6))} ft`);
    this.box.y = Y + (tension > 85 ? Phaser.Math.Between(-2, 2) : 0);
  }
}
