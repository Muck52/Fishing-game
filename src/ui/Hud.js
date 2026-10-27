import { W, DEPTH, label } from '../core/constants.js';
import { pill } from './Panels.js';
import { FISH } from '../../data/fish/fish.js';
import { WEATHER_NAME } from '../environment/Weather.js';

const TOP = 20;

// Two wooden counters: coins on the left, species found on the right; and
// under the coins, the weather.
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
    this.sky = ui(pill(scene, 50, TOP + 26, 76, 20));
    this.skyIcon = ui(scene.add.image(23, TOP + 26, 'weather-clear')).setDepth(DEPTH.UI + 0.1);
    this.skyWord = ui(label(scene, 33, TOP + 26, '', { font: 'head' }).setOrigin(0, 0.5)).setDepth(DEPTH.UI + 0.1);
  }

  // The weather badge; when the weather turns, it gives a little hop.
  weather(kind, icon) {
    if (icon !== this.skyIcon.texture.key) this.skyIcon.setTexture(icon);
    if (kind === this.kind) return;
    const first = !this.kind;
    this.kind = kind;
    this.skyWord.setText(WEATHER_NAME[kind]);
    if (!first) this.scene.tweens.add({ targets: [this.sky, this.skyIcon, this.skyWord], y: '-=3', duration: 120, yoyo: true, repeat: 2 });
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
