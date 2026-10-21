import { W, H, textStyle } from '../core/constants.js';
import { loadArt, makeAnims } from '../core/Assets.js';
import { FISH } from '../../data/fish/fish.js';

// Loads every image the game uses, with a progress bar, then opens the
// title screen.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const label = this.add.text(W / 2, H / 2 - 50, 'Loading...', textStyle(40)).setOrigin(0.5);
    const bar = this.add.rectangle(W / 2 - 200, H / 2 + 10, 0, 18, 0xffd36a).setOrigin(0, 0.5);
    this.add.rectangle(W / 2, H / 2 + 10, 408, 26).setStrokeStyle(4, 0xfff4d6);
    this.load.on('progress', (p) => (bar.width = 400 * p));
    this.load.on('loaderror', (file) => label.setText(`Could not load ${file.key}`));
    loadArt(this);
  }

  create() {
    makeAnims(this, FISH.map((f) => f.id));
    this.scene.start('Menu');
  }
}
