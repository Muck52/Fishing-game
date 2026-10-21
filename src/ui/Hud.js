import { W, DEPTH, label } from '../core/constants.js';
import { pill } from './Panels.js';
import { FISH } from '../../data/fish/fish.js';

const TOP = 20;

// Two wooden counters: coins on the left, species found on the right.
export class Hud {
  constructor(scene) {
    this.scene = scene;
    const ui = (o) => o.setDepth(DEPTH.UI);
    ui(pill(scene, 50, TOP, 76, 22));
    this.coin = ui(scene.add.sprite(23, TOP, 'coin').play('coin-spin'));
    this.coins = ui(label(scene, 36, TOP, '', { font: 'head' }).setOrigin(0, 0.5));
    ui(pill(scene, W - 50, TOP, 76, 22));
    this.bucket = ui(scene.add.image(W - 77, TOP - 2, 'bucket'));
    this.species = ui(label(scene, W - 58, TOP, '', { font: 'head' }).setOrigin(0, 0.5));
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
      const c = s.add.sprite(x, y, 'coin').setDepth(DEPTH.UI + 1).play({ key: 'coin-spin', startFrame: i % 4 });
      s.tweens.chain({
        targets: c,
        tweens: [
          { x: x + Phaser.Math.Between(-45, 45), y: y - Phaser.Math.Between(20, 70), duration: 300, ease: 'Quad.easeOut', delay: i * 40 },
          { x: this.coin.x, y: this.coin.y, duration: 520, ease: 'Quad.easeIn' },
        ],
        onComplete: () => {
          c.destroy();
          s.tweens.add({ targets: this.coin, y: this.coin.y - 2, duration: 60, yoyo: true });
        },
      });
    }
  }
}
