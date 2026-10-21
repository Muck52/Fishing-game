import { W, H } from '../core/constants.js';
import { loadArt, makeAnims } from '../core/Assets.js';
import { FISH } from '../../data/fish/fish.js';

// Loads every image the game uses behind a chunky progress bar, then opens
// the title screen.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.add.rectangle(W / 2, H / 2, 124, 12, 0x251318);
    this.add.rectangle(W / 2, H / 2, 120, 8, 0x2c5c78);
    const bar = this.add.rectangle(W / 2 - 60, H / 2, 0, 8, 0xffd84a).setOrigin(0, 0.5);
    this.load.on('progress', (p) => (bar.width = Math.round(120 * p)));
    this.load.on('loaderror', (file) => this.add.text(8, 8, `Could not load ${file.key}`, { fontSize: '10px' }));
    loadArt(this);
  }

  create() {
    makeAnims(this, FISH.map((f) => f.id));
    this.scene.start('Menu');
  }
}
