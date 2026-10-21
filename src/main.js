import { W, H, FONT } from './core/constants.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { FishingScene } from './scenes/FishingScene.js';

function start() {
  window.game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#14283a',
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: W,
      height: H,
    },
    scene: [BootScene, MenuScene, FishingScene],
  });
}

// Canvas text needs the pixel font loaded before the first scene draws.
document.fonts
  .load(`32px ${FONT}`)
  .catch(() => {})
  .finally(start);
