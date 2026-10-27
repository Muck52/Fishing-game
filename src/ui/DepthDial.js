// How deep the bait fishes: a little gauge under the species counter. Tap
// it to go shallow, mid or deep (only while the line is in). A float or a
// jig sinks to that depth; a spinner runs wherever you reel it.
import { W, DEPTH, label, INK } from '../core/constants.js';
import { pill } from './Panels.js';
import { DEPTHS, DEPTH_NAME } from '../fish/Habits.js';

const Y = 46;
const X = W - 50;

export class DepthDial {
  constructor(scene, save, canChange, onPick) {
    this.scene = scene;
    this.save = save;
    this.canChange = canChange;
    this.onPick = onPick;
    const ui = (o) => o.setDepth(DEPTH.UI);
    this.box = ui(pill(scene, X, Y, 76, 20));
    this.box.setInteractive();
    this.box.on('pointerdown', () => this.next());
    this.g = ui(scene.add.graphics()).setDepth(DEPTH.UI + 0.1);
    this.word = ui(label(scene, X - 20, Y, '', { font: 'head' }).setOrigin(0, 0.5)).setDepth(DEPTH.UI + 0.1);
    this.current = DEPTHS.includes(save.data.depth) ? save.data.depth : 'mid';
    this.draw();
  }

  next() {
    if (!this.canChange()) return;
    this.current = DEPTHS[(DEPTHS.indexOf(this.current) + 1) % DEPTHS.length];
    this.save.data.depth = this.current;
    this.save.persist();
    this.draw();
    this.onPick(this.current);
  }

  // a spinner's depth is up to you as you reel: the dial goes quiet
  setActive(on) {
    for (const o of [this.box, this.g, this.word]) o.setAlpha(on ? 1 : 0.5);
  }

  // a column of water with three cells, the bait's one lit, and its name
  draw() {
    const g = this.g.clear();
    const x = X - 32;
    const top = Y - 7;
    g.fillStyle(0x25131a, 1).fillRect(x - 1, top - 1, 8, 16);
    const cols = [0x5fa8b8, 0x3f7f96, 0x2a5a74];
    DEPTHS.forEach((d, i) => {
      g.fillStyle(cols[i], 1).fillRect(x, top + i * 5, 6, 4);
      if (d === this.current) g.fillStyle(INK.gold, 1).fillRect(x + 2, top + i * 5 + 1, 2, 2);
    });
    this.word.setText(DEPTH_NAME[this.current]);
  }
}
