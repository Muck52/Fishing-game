import { W, DEPTH, INK, label } from '../core/constants.js';
import { pill } from './Panels.js';

const Y = 112; // under the counters, above the hints
const PW = 330;
const PH = 40;

// A catch you've made before, with no record to it: not worth stopping the
// game for. A small plaque says what it is, what it weighs and what it's
// worth, with Keep and Release; a tap anywhere else keeps it.
export class CatchToast {
  constructor(scene, onChoose) {
    this.scene = scene;
    const plaque = pill(scene, 0, 0, PW, PH);
    this.icon = scene.add.sprite(-PW / 2 + 26, 0, 'fish-bluegill', 0);
    this.name = label(scene, -PW / 2 + 52, -7, '', { font: 'head' }).setOrigin(0, 0.5);
    this.weight = label(scene, -PW / 2 + 52, 8, '', { color: INK.soft }).setOrigin(0, 0.5);
    this.keep = button(scene, PW / 2 - 105, 0, 70, 'Keep', INK.gold, () => onChoose(true));
    this.release = button(scene, PW / 2 - 34, 0, 56, 'Release', INK.cream, () => onChoose(false));
    this.buttons = [this.keep.pill, this.release.pill];
    this.root = scene.add.container(W / 2, Y, [plaque, this.icon, this.name, this.weight, ...this.keep.parts, ...this.release.parts]).setDepth(DEPTH.UI + 2).setVisible(false);
  }

  show({ fish, weight, value }) {
    // the fish as it swims in the lake, doubled if it's small (whole pixels)
    this.icon.setTexture(`fish-${fish.id}`, 0).play(`swim-${fish.id}`);
    this.icon.setScale(this.icon.width <= 18 ? 2 : 1);
    this.name.setText(fish.name);
    this.weight.setText(`${weight.toFixed(1)} lb`);
    this.keep.text.setText(`Keep +${value}`);
    this.canClose = false;
    this.scene.time.delayedCall(400, () => (this.canClose = true));
    this.root.setVisible(true).setAlpha(0);
    this.root.y = Y - 10;
    this.scene.tweens.add({ targets: this.root, y: Y, alpha: 1, duration: 220, ease: 'Back.easeOut' });
  }

  hide() {
    this.root.setVisible(false);
  }
}

// A little wooden button with a word on it, that answers a tap.
export function button(scene, x, y, w, text, color, onTap) {
  const p = pill(scene, x, y, w, 22).setInteractive({ useHandCursor: true });
  const t = label(scene, x, y, text, { font: 'head', color });
  p.on('pointerdown', () => {
    scene.tweens.add({ targets: [p, t], y: y + 1, duration: 60, yoyo: true });
    onTap();
  });
  return { pill: p, text: t, parts: [p, t] };
}
