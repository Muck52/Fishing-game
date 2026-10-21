import { DEPTH } from '../core/constants.js';
import { TRACK, BAR, ICON } from '../fishing/BarFight.js';

const TP = 150; // track height in pixels
const K = TP / TRACK;
const TW = 14; // track width
const X = 312; // where the bar stands, beside the angler
const TOP = 74;

const OUT = 0x25131a;
const WOOD = 0x895a45;
const WOOD_LT = 0xb57a50;
const WOOD_DK = 0x5a3428;

// Little pixel pictures: '#' outline, the rest by key.
const FISH = ['...###....', '.##ooo#..#', '#ooooooo##', '#eoooooo##', '.##ooo#..#', '...###....'];
const CHEST = ['.#####.', '#ggggg#', '#######', '#bbybb#', '#bbbbb#', '#######'];
const FISH_INK = { '#': OUT, o: 0x9fd0e8, e: OUT };
const CHEST_INK = { '#': OUT, g: 0xc08040, b: WOOD, y: 0xffd84a };

function stamp(g, rows, ink, x, y) {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = ink[row[i]];
      if (c !== undefined) g.fillStyle(c, 1).fillRect(x + i, y + j, 1, 1);
    }
  });
}

// The Stardew-style catch bar: a wooden column with the water track, the
// green bar you float up and down, the fish, and the catch meter beside it.
export class FishBar {
  constructor(scene) {
    this.scene = scene;
    this.g = scene.add.graphics();
    this.box = scene.add.container(X, TOP, [this.g]).setDepth(DEPTH.UI).setVisible(false);
    this.crank = 0;
  }

  show(on) {
    this.box.setVisible(on);
    if (on) {
      this.box.x = X + 60;
      this.scene.tweens.add({ targets: this.box, x: X, duration: 260, ease: 'Back.easeOut', onUpdate: () => (this.box.x = Math.round(this.box.x)) });
    }
  }

  update(f, holding) {
    const g = this.g.clear();
    const shake = (n) => (n ? Phaser.Math.Between(-n, n) : 0);
    this.box.x = Math.round(this.box.x);
    const sx = f.progress < 0.15 && f.wait <= 0 ? shake(1) : 0;

    // the frame: wood with a dark outline, the track and meter set into it
    const fw = TW + 14;
    const fh = TP + 18;
    g.fillStyle(OUT, 1).fillRect(sx - 1, -1, fw + 2, fh + 2);
    g.fillStyle(WOOD, 1).fillRect(sx, 0, fw, fh);
    g.fillStyle(WOOD_LT, 1).fillRect(sx, 0, fw, 1).fillRect(sx, 0, 1, fh);
    g.fillStyle(WOOD_DK, 1).fillRect(sx, fh - 1, fw, 1).fillRect(sx + fw - 1, 0, 1, fh);

    // the water track, darker toward the bottom
    const tx = sx + 3;
    const ty = 3;
    g.fillStyle(OUT, 1).fillRect(tx - 1, ty - 1, TW + 2, TP + 2);
    for (let i = 0; i < 6; i++) {
      g.fillStyle(Phaser.Display.Color.GetColor(40 - i * 4, 96 - i * 9, 128 - i * 10), 1).fillRect(tx, ty + (i * TP) / 6, TW, Math.ceil(TP / 6));
    }

    // the green bar
    const by = ty + Math.round(f.barPos * K);
    const bh = Math.round(BAR * K);
    g.fillStyle(f.inBar ? 0x8ad06a : 0x6aa85a, 1).fillRect(tx, by, TW, bh);
    g.fillStyle(0xc4f08a, 1).fillRect(tx, by, TW, 1).fillRect(tx, by, 1, bh);
    g.fillStyle(0x3f7a34, 1).fillRect(tx, by + bh - 1, TW, 1).fillRect(tx + TW - 1, by, 1, bh);

    // the treasure chest, with its own little meter
    const c = f.treasure;
    if (c && c.shown && !c.got) {
      const cy = ty + Math.round(c.pos * K);
      stamp(g, CHEST, CHEST_INK, tx + 4, cy);
      g.fillStyle(OUT, 1).fillRect(tx + 3, cy + 7, 9, 2);
      g.fillStyle(0xffd84a, 1).fillRect(tx + 3, cy + 7, Math.round(9 * c.level), 1);
    }

    // the fish, which shakes while it's held in the bar
    const fy = ty + Math.round(f.fishPos * K) + Math.round(((ICON * K) - 6) / 2);
    const jig = f.inBar && f.wait <= 0 ? shake(1) : 0;
    stamp(g, FISH, FISH_INK, tx + 2 + jig, fy + (jig ? shake(1) : 0));

    // the catch meter, red to gold to green as it fills
    const mx = tx + TW + 3;
    g.fillStyle(OUT, 1).fillRect(mx - 1, ty - 1, 6, TP + 2);
    g.fillStyle(0x1a0d12, 1).fillRect(mx, ty, 4, TP);
    const p = f.progress;
    const col = p < 0.5
      ? Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0xe84a3a), Phaser.Display.Color.ValueToColor(0xf0c040), 100, p * 200)
      : Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0xf0c040), Phaser.Display.Color.ValueToColor(0x8ad06a), 100, (p - 0.5) * 200);
    const mh = Math.round(TP * p);
    g.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1).fillRect(mx, ty + TP - mh, 4, mh);
    g.fillStyle(0xffffff, 0.35).fillRect(mx, ty + TP - mh, 1, mh);

    // the reel at the foot, its handle going round while you wind
    if (holding) this.crank += 0.4;
    const rx = sx + 9;
    const ry = ty + TP + 7;
    g.fillStyle(OUT, 1).fillRect(rx - 3, ry - 3, 7, 7);
    g.fillStyle(0xc8ccd4, 1).fillRect(rx - 2, ry - 2, 5, 5);
    g.fillStyle(0x8a909c, 1).fillRect(rx - 1, ry - 1, 3, 3);
    const h = [[3, 0], [2, 2], [0, 3], [-2, 2], [-3, 0], [-2, -2], [0, -3], [2, -2]][Math.floor(this.crank) % 8];
    g.fillStyle(0xe0b070, 1).fillRect(rx + h[0], ry + h[1], 1, 1);
  }
}
