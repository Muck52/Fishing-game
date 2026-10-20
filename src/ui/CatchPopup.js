import { W, H, PX, DEPTH, INK, textStyle, inkStyle } from '../core/constants.js';
import { RARITY } from '../../data/fish/fish.js';

const CARD_W = 150 * PX;
const CARD_H = 178 * PX;
const BROWN = '#7a6248';

// A page from the angler's field journal, shown after each catch.
export class CatchPopup {
  constructor(scene) {
    this.scene = scene;
    this.canClose = false;
    const top = -CARD_H / 2;

    const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x10201f, 0.55);
    const panel = scene.add.image(0, 0, 'panel-card').setScale(PX);
    this.header = scene.add.text(0, top + 40, '', inkStyle(22, BROWN));
    this.header.setOrigin(0.5);
    this.fish = scene.add.image(0, top + 150, 'fish-bluegill');
    this.rarity = scene.add.text(0, top + 258, '', inkStyle(24)).setOrigin(0.5);
    this.name = scene.add.text(0, top + 300, '', inkStyle(44, INK)).setOrigin(0.5);
    this.latin = scene.add.text(0, top + 342, '', inkStyle(24, BROWN)).setOrigin(0.5);
    const rule = scene.add.graphics();
    rule.fillStyle(0xdcc89c, 1);
    for (let x = -CARD_W / 2 + 60; x < CARD_W / 2 - 60; x += PX * 2) rule.fillRect(x, top + 372, PX, PX);
    this.weight = scene.add.text(-110, top + 410, '', inkStyle(34, INK)).setOrigin(0.5);
    this.coins = scene.add.text(110, top + 410, '', inkStyle(34, '#a8740b')).setOrigin(0.5);
    this.note = scene.add.text(0, top + 500, '', inkStyle(25, '#4a3d2c', { wordWrap: { width: CARD_W - 110 }, lineSpacing: 6 })).setOrigin(0.5);
    this.badge = scene.add.text(0, top + 600, '', inkStyle(26, '#4f7a3a')).setOrigin(0.5);
    this.prompt = scene.add.text(0, top + 650, 'Tap to keep fishing', inkStyle(22, '#9a8566')).setOrigin(0.5);
    this.headline = scene.add.text(0, top - 46, '', textStyle(52)).setOrigin(0.5);

    this.card = scene.add.container(W / 2, H / 2 + 20, [
      panel, this.header, this.fish, this.rarity, this.name, this.latin, rule,
      this.weight, this.coins, this.note, this.badge, this.prompt, this.headline,
    ]);
    this.root = scene.add.container(0, 0, [dim, this.card]).setDepth(DEPTH.POPUP).setVisible(false);
  }

  show({ fish, weight, value, isNew, isRecord, entry }) {
    const rarity = RARITY[fish.rarity];
    this.headline.setText(fish.rarity === 'legendary' ? 'Legendary catch!' : 'Nice catch!');
    this.header.setText(`FIELD JOURNAL  ·  No. ${entry}`);
    this.rarity.setText(rarity.label.toUpperCase()).setColor(rarity.color);
    this.name.setText(fish.name);
    this.latin.setText(fish.latin);
    this.weight.setText(`${weight.toFixed(1)} lb`);
    this.coins.setText(`+${value} coins`);
    this.note.setText(fish.note);
    this.badge.setText(isNew ? 'New species for your journal!' : isRecord ? 'New personal best!' : '');

    this.fish.setTexture(`fish-${fish.id}`);
    const scale = Math.max(3, Math.min(6, Math.floor(Math.min(420 / this.fish.width, 190 / this.fish.height))));
    this.fish.setScale(scale);

    this.canClose = false;
    this.root.setVisible(true);
    this.card.setScale(0.7);
    this.scene.tweens.add({ targets: this.card, scale: 1, duration: 320, ease: 'Back.easeOut' });
    this.scene.time.delayedCall(450, () => (this.canClose = true));
  }

  hide() {
    this.root.setVisible(false);
    this.canClose = false;
  }
}
