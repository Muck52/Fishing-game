// The tackle box: the five baits and lures in a row on a wooden board at
// the top of the screen. Tap one to tie it on (only while the line is in).
import { W, DEPTH } from '../core/constants.js';
import { pill } from './Panels.js';
import { LURES, makeLureArt } from '../fish/Lures.js';

const Y = 20;
const STEP = 24;

export class TackleBox {
  constructor(scene, save, canChange, onPick) {
    this.scene = scene;
    this.save = save;
    this.canChange = canChange;
    this.onPick = onPick;
    makeLureArt(scene);
    const x0 = W / 2 - (STEP * (LURES.length - 1)) / 2;
    pill(scene, W / 2, Y, STEP * LURES.length + 6, 24).setDepth(DEPTH.UI);
    this.ring = scene.add.graphics().setDepth(DEPTH.UI + 0.2);
    this.icons = LURES.map((l, i) => {
      const x = x0 + i * STEP;
      const icon = scene.add.image(x, Y, `lure-${l.id}`).setDepth(DEPTH.UI + 0.1);
      // a generous hit area for a thumb
      icon.setInteractive(new Phaser.Geom.Rectangle(-6, -6, 23, 23), Phaser.Geom.Rectangle.Contains);
      icon.on('pointerdown', () => this.pick(l.id));
      return { icon, x, lure: l };
    });
    this.current = save.data.lure || 'worm';
    this.draw();
  }

  pick(id) {
    if (!this.canChange() || id === this.current) return;
    this.current = id;
    this.save.data.lure = id;
    this.save.persist();
    this.draw();
    this.onPick(LURES.find((l) => l.id === id));
  }

  // a gold frame round the one that's tied on
  draw() {
    const g = this.ring.clear();
    const it = this.icons.find((o) => o.lure.id === this.current);
    g.lineStyle(1, 0xffd84a, 1).strokeRect(it.x - 8.5, Y - 8.5, 17, 17);
    for (const o of this.icons) o.icon.setAlpha(o === it ? 1 : 0.65);
  }
}
