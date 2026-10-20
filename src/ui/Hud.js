import { W, FONT_BODY } from '../core/constants.js';
import { FISH } from '../../data/fish/fish.js';

const STYLE = { fontFamily: FONT_BODY, fontStyle: '800', fontSize: '30px', color: '#ffffff' };

export class Hud {
  constructor(scene) {
    const bar = scene.add.graphics();
    bar.fillStyle(0x0b2a3f, 0.55);
    bar.fillRoundedRect(20, 24, 230, 64, 32);
    bar.fillRoundedRect(W - 270, 24, 250, 64, 32);
    // coin icon
    bar.fillStyle(0xf2c230, 1);
    bar.fillCircle(56, 56, 18);
    bar.lineStyle(3, 0xb8860b, 1);
    bar.strokeCircle(56, 56, 12);

    this.coins = scene.add.text(86, 56, '', STYLE).setOrigin(0, 0.5);
    this.species = scene.add.text(W - 145, 56, '', STYLE).setOrigin(0.5);
  }

  update(save) {
    this.coins.setText(String(save.coins));
    const found = Object.keys(save.species).length;
    this.species.setText(`Species ${found}/${FISH.length}`);
  }
}
