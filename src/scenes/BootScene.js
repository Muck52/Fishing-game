import { paintScenery } from '../art/SceneryArt.js';
import { paintSprites } from '../art/sprites.js';
import { paintUi } from '../art/UiArt.js';
import { paintFish } from '../art/FishArt.js';
import { FISH } from '../../data/fish/fish.js';

// Paints every texture once, up front, then opens the title screen.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    paintScenery(this);
    paintSprites(this);
    paintUi(this);
    FISH.forEach((fish) => paintFish(this, fish));
    this.scene.start('Menu');
  }
}
