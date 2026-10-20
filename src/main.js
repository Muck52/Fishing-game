import { W, H, FONT_DISPLAY, FONT_BODY } from './core/constants.js';
import { MenuScene } from './scenes/MenuScene.js';
import { FishingScene } from './scenes/FishingScene.js';

function start() {
  window.game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#0b2a3f',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: W,
      height: H,
    },
    scene: [MenuScene, FishingScene],
  });
}

// Canvas text needs the web fonts loaded before the first scene draws.
Promise.all([
  document.fonts.load(`48px ${FONT_DISPLAY}`),
  document.fonts.load(`800 32px ${FONT_BODY}`),
])
  .catch(() => {})
  .finally(start);
