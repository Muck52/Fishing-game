import { W, H, DEPTH, INK, label } from '../core/constants.js';
import { board } from './Panels.js';
import { RARITY } from '../../data/fish/fish.js';

const BW = 300; // board size in pixels
const BH = 336;

// The angler's field journal entry for each catch, on a wooden board.
export class CatchPopup {
  constructor(scene) {
    this.scene = scene;
    this.canClose = false;
    const top = -BH / 2;
    const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x10141c, 0.55);
    const panel = board(scene, 0, 0, BW, BH);
    // a dark inlay behind the writing so it reads over the planks
    const inlay = scene.add.rectangle(0, 0, BW - 40, BH - 40, 0x2a160e, 0.45);
    this.header = label(scene, 0, top + 34, '', { color: INK.soft });
    this.fishY = top + 88;
    this.fish = scene.add.image(0, this.fishY, 'card-bluegill');
    this.rarity = label(scene, 0, top + 140, '', { font: 'head' });
    this.name = label(scene, 0, top + 162, '', { font: 'head', size: 2 });
    this.latin = label(scene, 0, top + 184, '', { color: INK.soft });
    this.weight = label(scene, -58, top + 210, '', { font: 'head' });
    this.coins = label(scene, 58, top + 210, '', { font: 'head', color: INK.gold });
    this.note = label(scene, 0, top + 252, '', { width: BW - 60 });
    this.badge = label(scene, 0, top + 296, '', { color: INK.green });
    this.prompt = label(scene, 0, top + 316, 'Tap to keep fishing', { color: INK.soft });
    this.headline = label(scene, 0, top - 14, '', { font: 'head', size: 2, color: INK.gold });
    this.card = scene.add.container(W / 2, H / 2 + 14, [
      panel, inlay, this.header, this.fish, this.rarity, this.name, this.latin, this.weight, this.coins, this.note, this.badge, this.prompt, this.headline,
    ]);
    this.root = scene.add.container(0, 0, [dim, this.card]).setDepth(DEPTH.POPUP).setVisible(false);
  }

  show({ fish, weight, value, isNew, isRecord, entry }) {
    const rarity = RARITY[fish.rarity];
    this.headline.setText(fish.rarity === 'legendary' ? 'Legendary catch!' : 'Nice catch!');
    this.header.setText(`FIELD JOURNAL  ·  No. ${entry}`);
    this.rarity.setText(rarity.label.toUpperCase()).setTint(Phaser.Display.Color.HexStringToColor(rarity.color).color);
    this.name.setText(fish.name).setFontSize(fish.name.length <= 11 ? 32 : 16);
    this.latin.setText(fish.latin);
    this.weight.setText(`${weight.toFixed(1)} lb`);
    this.coins.setText(`+${value}`);
    this.note.setText(fish.note);
    this.badge.setText(isNew ? 'New species for your journal!' : isRecord ? 'New personal best!' : '');
    this.fish.setTexture(`card-${fish.id}`);
    // the biggest whole-number size that fits the card
    this.fish.setScale(Math.max(1, Math.min(3, Math.floor(Math.min(220 / this.fish.width, 72 / this.fish.height)))));

    this.canClose = false;
    this.root.setVisible(true);
    this.card.y = H / 2 + 60;
    this.card.setAlpha(0);
    this.scene.tweens.add({ targets: this.card, y: H / 2 + 14, alpha: 1, duration: 320, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: this.fish, y: this.fishY - 3, duration: 900, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [3] });
    this.scene.time.delayedCall(500, () => (this.canClose = true));
  }

  hide() {
    this.scene.tweens.killTweensOf(this.fish);
    this.fish.y = this.fishY;
    this.root.setVisible(false);
    this.canClose = false;
  }
}
