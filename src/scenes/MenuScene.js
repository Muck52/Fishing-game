import { W, H, DEPTH, textStyle } from '../core/constants.js';
import { World } from '../environment/World.js';
import { Wildlife } from '../wildlife/Wildlife.js';
import { Angler } from '../player/Angler.js';
import { board, pill } from '../ui/Panels.js';
import { SaveManager } from '../save/SaveManager.js';
import { FISH } from '../../data/fish/fish.js';

// The title screen: the lake at rest, with the instructions on a board.
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.world = new World(this);
    this.wildlife = new Wildlife(this);
    new Angler(this);
    const save = new SaveManager().data;
    const ui = (o) => o.setDepth(DEPTH.UI);

    const title = ui(this.add.text(W / 2, 170, 'Reel It In', textStyle(112, '#ffe070')).setOrigin(0.5));
    ui(this.add.text(W / 2, 258, 'Loon Lake  ·  late summer', textStyle(30, '#fff4d6')).setOrigin(0.5));
    this.tweens.add({ targets: title, y: 180, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const cy = H / 2 + 110;
    ui(board(this, W / 2, cy, 196, 104));
    ui(this.add.text(W / 2, cy - 10, 'Swipe up to cast\nTap when the float goes under\nHold to reel, ease off\nwhen the line pulls tight', textStyle(27, '#fff4d6', { lineSpacing: 8 })).setOrigin(0.5));

    if (save.totalCatches > 0) {
      const found = Object.keys(save.species).length;
      ui(this.add.text(W / 2, cy + 200, `${save.coins} coins  ·  ${found} of ${FISH.length} species in your journal`, textStyle(24, '#ffd98a')).setOrigin(0.5));
    }

    const by = H - 150;
    const btn = ui(pill(this, W / 2, by, 100, 26));
    const label = ui(this.add.text(W / 2, by, 'Tap to fish', textStyle(48)).setOrigin(0.5));
    this.tweens.add({ targets: [btn, label], scaleX: '*=1.06', scaleY: '*=1.06', duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.input.once('pointerdown', () => {
      this.cameras.main.fadeOut(300, 10, 20, 30);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Fishing'));
    });
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.world.update(time, dt);
    this.wildlife.update(time);
  }
}
