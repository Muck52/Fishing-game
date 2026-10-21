import { W, H, DEPTH, textStyle } from '../core/constants.js';
import { board } from './Panels.js';
import { RARITY } from '../../data/fish/fish.js';

const BW = 200; // board size in art pixels (drawn at 3x)
const BH = 236;
const SOFT = '#ffe2b0';

// The angler's field journal entry for each catch, on a wooden board.
export class CatchPopup {
  constructor(scene) {
    this.scene = scene;
    this.canClose = false;
    const top = -(BH * 3) / 2;
    const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x10141c, 0.55);
    const panel = board(scene, 0, 0, BW, BH);
    // a dark inlay behind the writing so it reads over the planks
    const inlay = scene.add.rectangle(0, 0, BW * 3 - 120, BH * 3 - 120, 0x2a160e, 0.45);
    this.header = scene.add.text(0, top + 74, '', textStyle(22, SOFT)).setOrigin(0.5);
    this.fish = scene.add.image(0, top + 190, 'card-bluegill');
    this.rarity = scene.add.text(0, top + 290, '', textStyle(26)).setOrigin(0.5);
    this.name = scene.add.text(0, top + 334, '', textStyle(44)).setOrigin(0.5);
    this.latin = scene.add.text(0, top + 376, '', textStyle(22, SOFT, { fontStyle: 'italic' })).setOrigin(0.5);
    this.weight = scene.add.text(-120, top + 432, '', textStyle(34)).setOrigin(0.5);
    this.coins = scene.add.text(110, top + 432, '', textStyle(34, '#ffd84a')).setOrigin(0.5);
    this.note = scene.add.text(0, top + 518, '', textStyle(23, '#fff4d6', { wordWrap: { width: BW * 3 - 130 }, lineSpacing: 4 })).setOrigin(0.5);
    this.badge = scene.add.text(0, top + 604, '', textStyle(26, '#9cf07a')).setOrigin(0.5);
    this.prompt = scene.add.text(0, top + 652, 'Tap to keep fishing', textStyle(20, SOFT)).setOrigin(0.5);
    this.headline = scene.add.text(0, top - 20, '', textStyle(54, '#ffe070')).setOrigin(0.5);
    this.card = scene.add.container(W / 2, H / 2 + 30, [
      panel, inlay, this.header, this.fish, this.rarity, this.name, this.latin, this.weight, this.coins, this.note, this.badge, this.prompt, this.headline,
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
    this.coins.setText(`+${value}`);
    this.note.setText(fish.note);
    this.badge.setText(isNew ? 'New species for your journal!' : isRecord ? 'New personal best!' : '');
    this.fish.setTexture(`card-${fish.id}`);
    this.fish.setScale(Math.max(2, Math.min(6, Math.floor(Math.min(440 / this.fish.width, 150 / this.fish.height)))));

    this.canClose = false;
    this.root.setVisible(true);
    this.card.setScale(0.6).setAlpha(0);
    this.scene.tweens.add({ targets: this.card, scale: 1, alpha: 1, duration: 360, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: this.fish, y: this.fish.y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.scene.time.delayedCall(500, () => (this.canClose = true));
  }

  hide() {
    this.scene.tweens.killTweensOf(this.fish);
    this.fish.y = -(BH * 3) / 2 + 190;
    this.root.setVisible(false);
    this.canClose = false;
  }
}
