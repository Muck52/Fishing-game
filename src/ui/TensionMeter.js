import { PX, DEPTH, textStyle } from '../core/constants.js';

// Inner well of the 'meter' texture, in art pixels.
const WELL = { x: 3, y: 5, w: 6, h: 98 };

export class TensionMeter {
  constructor(scene, x, y) {
    this.baseX = x;
    const frame = scene.add.image(0, 0, 'meter').setScale(PX);
    this.fill = scene.add.graphics();
    this.ox = -(12 * PX) / 2;
    this.oy = -(108 * PX) / 2;
    const label = scene.add.text(0, this.oy - 24, 'TENSION', textStyle(22)).setOrigin(0.5);
    this.distanceText = scene.add.text(0, -this.oy + 30, '', textStyle(26)).setOrigin(0.5);
    this.container = scene.add.container(x, y, [frame, this.fill, label, this.distanceText]).setDepth(DEPTH.UI).setVisible(false);
  }

  show(visible) {
    this.container.setVisible(visible);
  }

  update(tension, distance) {
    const color = tension < 60 ? 0x7fb069 : tension < 85 ? 0xe8b83a : 0xd9533f;
    const rows = Math.round((WELL.h * tension) / 100);
    this.fill.clear();
    this.fill.fillStyle(color, 1);
    this.fill.fillRect(this.ox + WELL.x * PX, this.oy + (WELL.y + WELL.h - rows) * PX, WELL.w * PX, rows * PX);
    this.fill.fillStyle(0xffffff, 0.25);
    this.fill.fillRect(this.ox + WELL.x * PX, this.oy + (WELL.y + WELL.h - rows) * PX, PX, rows * PX);
    this.distanceText.setText(`${Math.max(0, Math.round(distance * 0.6))} ft`);
    this.container.x = this.baseX + (tension > 85 ? Phaser.Math.Between(-1, 1) * PX : 0);
  }
}
