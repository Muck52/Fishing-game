import { W, H, FONT_BODY, textStyle } from '../core/constants.js';
import { RARITY } from '../../data/fish/fish.js';

const BODY = (size, color = '#24435a') => ({ fontFamily: FONT_BODY, fontStyle: '800', fontSize: `${size}px`, color, align: 'center' });

export class CatchPopup {
  constructor(scene) {
    this.scene = scene;
    this.canClose = false;

    const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x061a28, 0.55);
    const panel = scene.add.graphics();
    panel.fillStyle(0xf7f1e3, 1);
    panel.fillRoundedRect(-300, -330, 600, 660, 36);
    panel.lineStyle(6, 0x24435a, 1);
    panel.strokeRoundedRect(-300, -330, 600, 660, 36);

    this.fishArt = scene.add.graphics();
    this.headline = scene.add.text(0, -280, '', textStyle(48, '#ffffff')).setOrigin(0.5);
    this.rarity = scene.add.text(0, 10, '', textStyle(30)).setOrigin(0.5);
    this.name = scene.add.text(0, 65, '', BODY(44)).setOrigin(0.5);
    this.weight = scene.add.text(0, 125, '', BODY(36, '#4a6a80')).setOrigin(0.5);
    this.coins = scene.add.text(0, 190, '', BODY(40, '#b8860b')).setOrigin(0.5);
    this.badge = scene.add.text(0, 245, '', BODY(28, '#2e7d32')).setOrigin(0.5);
    this.prompt = scene.add.text(0, 300, 'Tap to keep fishing', BODY(26, '#7a8c99')).setOrigin(0.5);

    this.card = scene.add.container(W / 2, H / 2 - 40, [
      panel, this.fishArt, this.headline, this.rarity, this.name, this.weight, this.coins, this.badge, this.prompt,
    ]);
    this.root = scene.add.container(0, 0, [dim, this.card]).setDepth(100).setVisible(false);
  }

  show({ fish, weight, value, isNew, isRecord }) {
    const rarity = RARITY[fish.rarity];
    this.headline.setText(fish.rarity === 'legendary' ? 'LEGENDARY CATCH!' : 'Nice catch!');
    this.rarity.setText(rarity.label.toUpperCase()).setColor(rarity.color);
    this.name.setText(fish.name);
    this.weight.setText(`${weight.toFixed(1)} lb`);
    this.coins.setText(`+${value} coins`);
    this.badge.setText(isNew ? 'New species!' : isRecord ? 'New personal best!' : '');
    drawFish(this.fishArt, fish.color, 0, -130, 0.8 + 0.4 * (weight / fish.maxWeight));

    this.canClose = false;
    this.root.setVisible(true);
    this.card.setScale(0.6);
    this.scene.tweens.add({ targets: this.card, scale: 1, duration: 380, ease: 'Back.easeOut' });
    this.scene.time.delayedCall(450, () => (this.canClose = true));
  }

  hide() {
    this.root.setVisible(false);
    this.canClose = false;
  }
}

export function drawFish(g, color, x, y, s) {
  const dark = Phaser.Display.Color.IntegerToColor(color).darken(25).color;
  g.clear();
  g.fillStyle(dark, 1);
  g.fillTriangle(x + 95 * s, y, x + 170 * s, y - 60 * s, x + 170 * s, y + 60 * s);
  g.fillTriangle(x - 10 * s, y - 40 * s, x + 50 * s, y - 40 * s, x + 30 * s, y - 85 * s);
  g.fillStyle(color, 1);
  g.fillEllipse(x, y, 230 * s, 110 * s);
  g.fillStyle(0xffffff, 0.3);
  g.fillEllipse(x - 5 * s, y + 25 * s, 170 * s, 38 * s);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(x - 72 * s, y - 14 * s, 13 * s);
  g.fillStyle(0x10202c, 1);
  g.fillCircle(x - 75 * s, y - 14 * s, 7 * s);
  g.lineStyle(4 * s, dark, 1);
  g.beginPath();
  g.arc(x - 50 * s, y, 32 * s, -0.9, 0.9);
  g.strokePath();
}
