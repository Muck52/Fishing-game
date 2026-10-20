import { FONT_BODY } from '../core/constants.js';

const BAR_W = 46;
const BAR_H = 420;

export class TensionMeter {
  constructor(scene, x, y) {
    this.baseX = x;
    const bg = scene.add.graphics();
    bg.fillStyle(0x0b2a3f, 0.75);
    bg.fillRoundedRect(-BAR_W / 2 - 8, -BAR_H / 2 - 8, BAR_W + 16, BAR_H + 16, 14);
    // danger zone marker
    bg.fillStyle(0xef5350, 0.25);
    bg.fillRect(-BAR_W / 2, -BAR_H / 2, BAR_W, BAR_H * 0.15);

    this.fill = scene.add.graphics();
    const label = scene.add
      .text(0, -BAR_H / 2 - 36, 'TENSION', { fontFamily: FONT_BODY, fontStyle: '800', fontSize: '22px', color: '#ffffff' })
      .setOrigin(0.5);
    this.distanceText = scene.add
      .text(0, BAR_H / 2 + 38, '', { fontFamily: FONT_BODY, fontStyle: '800', fontSize: '24px', color: '#ffffff' })
      .setOrigin(0.5);

    this.container = scene.add.container(x, y, [bg, this.fill, label, this.distanceText]).setVisible(false);
  }

  show(visible) {
    this.container.setVisible(visible);
  }

  update(tension, distance) {
    const color = tension < 60 ? 0x66bb6a : tension < 85 ? 0xffca28 : 0xef5350;
    const h = (BAR_H * tension) / 100;
    this.fill.clear();
    this.fill.fillStyle(color, 1);
    this.fill.fillRect(-BAR_W / 2, BAR_H / 2 - h, BAR_W, h);
    this.distanceText.setText(`${Math.max(0, Math.round(distance * 0.6))} ft`);
    this.container.x = this.baseX + (tension > 85 ? (Math.random() - 0.5) * 8 : 0);
  }
}
