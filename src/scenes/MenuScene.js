import { W, H, DEPTH, INK, LOOK_UP, label, pinToScreen } from '../core/constants.js';
import { World } from '../environment/World.js';
import { partOfDay } from '../environment/Daylight.js';
import { Wildlife } from '../wildlife/Wildlife.js';
import { Angler } from '../player/Angler.js';
import { board, pill } from '../ui/Panels.js';
import { SaveManager } from '../save/SaveManager.js';
import { FISH } from '../../data/fish/fish.js';

// The title screen: the lake at rest, at the same hour as the phone, with
// the instructions on a board.
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.world = new World(this);
    this.wildlife = new Wildlife(this);
    this.angler = new Angler(this);
    const save = new SaveManager().data;
    const ui = (o) => o.setDepth(DEPTH.UI);

    const title = ui(label(this, W / 2, 82, 'Reel It In', { font: 'head', size: 3, color: INK.gold }));
    ui(label(this, W / 2, 122, `Loon Lake  ·  ${partOfDay()}`, { color: INK.cream }));
    this.tweens.add({ targets: title, y: 86, duration: 1100, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [4] });

    const cy = Math.round(H / 2 + 60);
    ui(board(this, W / 2, cy, 260, 104));
    ui(label(this, W / 2, cy, 'Swipe up to cast\nTap when the float goes under\nHold to raise the bar\nand keep the fish inside it'));

    if (save.totalCatches > 0) {
      const found = Object.keys(save.species).length;
      ui(label(this, W / 2, cy + 68, `${save.coins} coins  ·  ${found} of ${FISH.length} species`, { color: INK.gold }));
    }

    const by = H - 70;
    const btn = ui(pill(this, W / 2, by, 150, 34));
    const tap = ui(label(this, W / 2, by, 'Tap to fish', { font: 'head', size: 2 }));
    this.tweens.add({ targets: [btn, tap], y: by - 2, duration: 700, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });

    // the camera looks up at the sky, the dock low on screen
    pinToScreen(this);
    this.cameras.main.scrollY = -LOOK_UP;

    this.input.once('pointerdown', () => {
      this.cameras.main.fadeOut(300, 10, 20, 30);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Fishing'));
    });
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.world.update(time, dt);
    this.wildlife.update(time);
    this.angler.update(time);
  }
}
