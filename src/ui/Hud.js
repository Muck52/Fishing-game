import { W, DEPTH, textStyle } from '../core/constants.js';
import { pill } from './Panels.js';
import { FISH } from '../../data/fish/fish.js';

const TOP = 54;

// Two wooden counters: coins on the left, species found on the right.
export class Hud {
  constructor(scene) {
    this.scene = scene;
    const ui = (o) => o.setDepth(DEPTH.UI);
    ui(pill(scene, 116, TOP, 62, 22));
    this.coin = ui(scene.add.sprite(52, TOP, 'coin').setScale(3).play('coin-spin'));
    this.coins = ui(scene.add.text(84, TOP, '', textStyle(34)).setOrigin(0, 0.5));
    ui(pill(scene, W - 116, TOP, 62, 22));
    ui(scene.add.image(W - 176, TOP - 2, 'bucket').setScale(2));
    this.species = ui(scene.add.text(W - 146, TOP, '', textStyle(34)).setOrigin(0, 0.5));
  }

  update(save) {
    this.coins.setText(String(save.coins));
    this.species.setText(`${Object.keys(save.species).length}/${FISH.length}`);
  }

  // Coins spill out of a catch and fly up into the counter.
  coinBurst(x, y, value) {
    const s = this.scene;
    const n = Math.min(14, 3 + Math.round(value / 4));
    for (let i = 0; i < n; i++) {
      const c = s.add.sprite(x, y, 'coin').setScale(3).setDepth(DEPTH.UI + 1).play({ key: 'coin-spin', startFrame: i % 4 });
      const sx = x + Phaser.Math.Between(-90, 90);
      const sy = y - Phaser.Math.Between(40, 140);
      s.tweens.chain({
        targets: c,
        tweens: [
          { x: sx, y: sy, duration: 300, ease: 'Quad.easeOut', delay: i * 40 },
          { x: this.coin.x, y: this.coin.y, scale: 2, duration: 520, ease: 'Quad.easeIn' },
        ],
        onComplete: () => {
          c.destroy();
          s.tweens.add({ targets: this.coin, scale: 3.6, duration: 60, yoyo: true });
        },
      });
    }
  }
}
