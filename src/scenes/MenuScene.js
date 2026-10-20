import { W, H, FONT_BODY, textStyle } from '../core/constants.js';
import { drawScenery } from '../environment/Scenery.js';
import { SaveManager } from '../save/SaveManager.js';
import { FISH } from '../../data/fish/fish.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    drawScenery(this);
    const save = new SaveManager().data;

    const title = this.add.text(W / 2, 190, 'REEL\nIT IN', textStyle(150, '#fff6dc', { lineSpacing: -30 })).setOrigin(0.5);
    this.tweens.add({ targets: title, y: 200, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add
      .text(W / 2, H / 2 + 60, 'Swipe up to cast\nTap when the bobber dips\nHold to reel, let go when the line gets tight', {
        fontFamily: FONT_BODY,
        fontStyle: '800',
        fontSize: '30px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 14,
        stroke: '#0b2a3f',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    if (save.totalCatches > 0) {
      const found = Object.keys(save.species).length;
      this.add
        .text(W / 2, H / 2 + 220, `${save.coins} coins  ·  ${found}/${FISH.length} species`, textStyle(34, '#ffd54f'))
        .setOrigin(0.5);
    }

    const start = this.add.text(W / 2, H - 230, 'TAP TO FISH', textStyle(64)).setOrigin(0.5).setDepth(5);
    this.tweens.add({ targets: start, scale: 1.08, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.input.once('pointerdown', () => this.scene.start('Fishing'));
  }
}
