import { W, H, PX, DEPTH, INK, textStyle, inkStyle } from '../core/constants.js';
import { Scenery } from '../environment/Scenery.js';
import { Wildlife } from '../wildlife/Wildlife.js';
import { SaveManager } from '../save/SaveManager.js';
import { FISH } from '../../data/fish/fish.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.scenery = new Scenery(this);
    this.wildlife = new Wildlife(this);
    const save = new SaveManager().data;

    const title = this.add.text(W / 2, 200, 'Reel It In', textStyle(118, '#fbf3dc')).setOrigin(0.5).setDepth(DEPTH.UI);
    this.add.text(W / 2, 290, 'Loon Lake  ·  late September', textStyle(30, '#f6dcae')).setOrigin(0.5).setDepth(DEPTH.UI);
    this.tweens.add({ targets: title, y: 208, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const cy = H / 2 + 40;
    this.add.image(W / 2, cy, 'panel-menu').setScale(PX).setDepth(DEPTH.UI);
    this.add
      .text(W / 2, cy, 'Swipe up to cast\nTap when the bobber goes under\nHold to reel, ease off when it pulls tight', inkStyle(25, INK, { lineSpacing: 10 }))
      .setOrigin(0.5)
      .setDepth(DEPTH.UI);

    if (save.totalCatches > 0) {
      const found = Object.keys(save.species).length;
      this.add
        .text(W / 2, cy + 150, `${save.coins} coins  ·  ${found} of ${FISH.length} species in your journal`, textStyle(26, '#ffd98a'))
        .setOrigin(0.5)
        .setDepth(DEPTH.UI);
    }

    const start = this.add.text(W / 2, H - 290, 'Tap to fish', textStyle(56)).setOrigin(0.5).setDepth(DEPTH.UI);
    this.tweens.add({ targets: start, alpha: 0.55, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.input.once('pointerdown', () => this.scene.start('Fishing'));
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.scenery.update(time, dt);
    this.wildlife.update(time, dt);
  }
}
