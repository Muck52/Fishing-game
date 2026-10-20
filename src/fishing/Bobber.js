import { depthScale, textStyle } from '../core/constants.js';

export class Bobber {
  constructor(scene) {
    this.scene = scene;
    this.x = 0;
    this.y = 0;
    this.dip = 0;
    this.inWater = false;

    const g = scene.add.graphics();
    g.fillStyle(0x222222, 1);
    g.fillRect(-2, -34, 4, 20);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(0, 0, 17);
    g.fillStyle(0xe53935, 1);
    g.slice(0, 0, 17, Math.PI, 0, false);
    g.fillPath();
    g.lineStyle(2, 0x0b2a3f, 0.5);
    g.strokeCircle(0, 0, 17);

    // A band of water drawn over the lower half makes it look like it floats.
    this.waterline = scene.add.ellipse(0, 10, 54, 18, 0x2f86b3, 0.85);
    this.alert = scene.add.text(0, -90, '!', textStyle(80, '#ffd54f')).setOrigin(0.5).setVisible(false);

    this.container = scene.add.container(0, 0, [g, this.waterline, this.alert]).setVisible(false);
  }

  place(x, y) {
    this.x = x;
    this.y = y;
  }

  show(visible) {
    this.container.setVisible(visible);
    if (!visible) this.alert.setVisible(false);
  }

  render(time) {
    const bob = this.inWater && this.dip === 0 ? Math.sin(time / 280) * 3 : 0;
    this.waterline.setVisible(this.inWater);
    this.container.setPosition(this.x, this.y + bob + this.dip);
    this.container.setScale(depthScale(this.y));
  }
}
