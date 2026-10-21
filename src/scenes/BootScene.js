import { paintScenery } from '../art/SceneryArt.js';
import { paintSprites } from '../art/sprites.js';
import { paintUi } from '../art/UiArt.js';
import { paintFish } from '../art/FishArt.js';
import { preloadPacks, recolorPacks } from '../art/Packs.js';
import { FISH } from '../../data/fish/fish.js';

// Loads the art packs and paints every other texture once, up front, then
// opens the title screen.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    preloadPacks(this);
  }

  create() {
    recolorPacks(this);
    paintScenery(this);
    paintSprites(this);
    paintUi(this);
    FISH.forEach((fish) => paintFish(this, fish));
    this.scene.start('Menu');
  }
}
