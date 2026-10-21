import { DEPTH } from '../core/constants.js';
import { TRACK, BAR, ICON } from '../fishing/BarFight.js';

const TP = 128; // track height in pixels
const K = TP / TRACK;
const TW = 14; // track width
const X = 312; // where the bar hangs, beside the angler and clear of the hut roof
const TOP = 48;

// All from the master palette: the board art's wood, and the lake's own
// water from the surface down.
const OUT = 0x25131a;
const RIM = 0xdaab76;
const RIM_LT = 0xe7cd8d;
const RIM_DK = 0xb77357;
const PLANK = 0xae7764;
const SEAM = 0x833f4c;
const WATER = [0x2c5c78, 0x275571, 0x1e4762, 0x1b3f5b, 0x173953, 0x14324c, 0x10273f];
const SAND = 0xa9805f;
const WEED = [0x407e55, 0x51642b];
const NET = 0x8ad06a;
const NET_DK = 0x407e55;
const BRASS = 0xc79a49;
const METER = [0xe84a3a, 0xc79a49, 0x8ad06a];

// Little pixel pictures: '#' outline, the rest by key.
const FISH = ['...####...', '.##bbbb#.#', '#bbbbbbb##', '#eoooooo##', '.##oooo#.#', '...####...'];
const CHEST = ['.#####.', '#ggggg#', '#######', '#bbybb#', '#bbbbb#', '#######'];
const CHEST_INK = { '#': OUT, g: BRASS, b: 0x895a45, y: 0xffd84a };

function stamp(g, rows, ink, x, y) {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = ink[row[i]];
      if (c !== undefined) g.fillStyle(c, 1).fillRect(x + i, y + j, 1, 1);
    }
  });
}

// The catch bar, made to belong to the lake: a small board in the same wood
// as the journal and counters, with a window onto the water (the lake's own
// colours from surface to sand, weeds and rising bubbles), a green net you
// float up and down, the hooked fish in its own colours, and a carved gauge
// for the catch meter.
export class FishBar {
  constructor(scene) {
    this.scene = scene;
    this.g = scene.add.graphics();
    this.box = scene.add.container(X, TOP, [this.g]).setDepth(DEPTH.UI).setVisible(false);
    this.crank = 0;
    this.ink = { '#': OUT, b: 0x4f738b, o: 0xb2d0d0, e: OUT };
  }

  // Colours the fish icon from the hooked fish's own sprite: its back and
  // its belly, read down the middle of the first frame.
  colour(sprite) {
    const tex = this.scene.textures;
    const key = sprite.texture.key;
    const fr = tex.getFrame(key, 0);
    const cx = Math.floor(fr.width / 2);
    const found = [];
    for (let y = 0; y < fr.height; y++) {
      const c = tex.getPixel(cx, y, key, 0);
      if (!c || c.alpha < 200) continue;
      const v = Phaser.Display.Color.GetColor(c.red, c.green, c.blue);
      if (v !== OUT) found.push(v);
    }
    if (found.length >= 2) {
      this.ink.b = found[Math.floor(found.length * 0.25)];
      this.ink.o = found[Math.floor(found.length * 0.7)];
    }
  }

  show(on, sprite = null) {
    if (sprite) this.colour(sprite);
    this.box.setVisible(on);
    if (on) {
      // it drops in like a sign on a string
      this.box.y = TOP - 30;
      this.box.setAlpha(0);
      this.scene.tweens.add({ targets: this.box, y: TOP, alpha: 1, duration: 300, ease: 'Back.easeOut', onUpdate: () => (this.box.y = Math.round(this.box.y)) });
    }
  }

  board(g, x, y, w, h) {
    g.fillStyle(OUT, 1).fillRect(x, y, w, h);
    g.fillStyle(RIM, 1).fillRect(x + 1, y + 1, w - 2, h - 2);
    g.fillStyle(RIM_LT, 1).fillRect(x + 1, y + 1, w - 2, 1).fillRect(x + 1, y + 1, 1, h - 2);
    g.fillStyle(RIM_DK, 1).fillRect(x + 1, y + h - 2, w - 2, 1).fillRect(x + w - 2, y + 1, 1, h - 2);
    // the planks inside, with the board art's seams
    g.fillStyle(PLANK, 1).fillRect(x + 3, y + 3, w - 6, h - 6);
    for (let py = y + 3 + 7; py < y + h - 4; py += 8) g.fillStyle(SEAM, 1).fillRect(x + 3, py, w - 6, 1);
    // the bevelled corners
    g.fillStyle(OUT, 1);
    for (const [cx, cy] of [[x + 2, y + 2], [x + w - 3, y + 2], [x + 2, y + h - 3], [x + w - 3, y + h - 3]]) g.fillRect(cx, cy, 1, 1);
  }

  update(f, holding) {
    const g = this.g.clear();
    const time = this.scene.time.now;
    const shake = (n) => (n ? Phaser.Math.Between(-n, n) : 0);
    const sx = f.progress < 0.15 && f.wait <= 0 ? shake(1) : 0;

    const fw = TW + 17;
    const fh = TP + 19;
    this.board(g, sx, 0, fw, fh);

    // the window onto the water
    const tx = sx + 4;
    const ty = 4;
    g.fillStyle(OUT, 1).fillRect(tx - 1, ty - 1, TW + 2, TP + 2);
    const band = TP / WATER.length;
    WATER.forEach((c, i) => g.fillStyle(c, 1).fillRect(tx, ty + Math.round(i * band), TW, Math.ceil(band)));
    // a dithered seam between bands, as the lake grades
    WATER.forEach((c, i) => {
      if (!i) return;
      const y = ty + Math.round(i * band) - 1;
      for (let x = (i % 2); x < TW; x += 2) g.fillStyle(c, 1).fillRect(tx + x, y, 1, 1);
    });
    // a slanting shaft of light
    for (let y = 2; y < TP * 0.6; y += 2) g.fillStyle(0xb2d0d0, 0.18).fillRect(tx + 3 + Math.floor(y / 6) % TW, ty + y, 2, 1);
    // the shimmering surface
    for (let x = 0; x < TW; x++) if ((x + Math.floor(time / 300)) % 3) g.fillStyle(0xb0ecf0, 0.75).fillRect(tx + x, ty, 1, 1);
    // sand and two swaying tufts of weed
    g.fillStyle(SAND, 1).fillRect(tx, ty + TP - 2, TW, 2);
    const sway = Math.floor(time / 600) % 2;
    for (const [wx, wh, c] of [[2, 6, WEED[0]], [10, 4, WEED[1]]]) {
      for (let j = 0; j < wh; j++) g.fillStyle(c, 1).fillRect(tx + wx + (j > wh / 2 ? sway : 0), ty + TP - 3 - j, 1, 1);
    }
    // bubbles rising
    for (let i = 0; i < 3; i++) {
      const by = TP - 4 - ((time / 28 + i * 47) % (TP - 6));
      g.fillStyle(0xd3f0ee, 0.7).fillRect(tx + 2 + ((i * 5 + Math.floor(by / 20)) % (TW - 4)), ty + Math.round(by), 1, 1);
    }

    // the net you float: see-through, so the water shows behind it
    const by = ty + Math.round(f.barPos * K);
    const bh = Math.round(BAR * K);
    g.fillStyle(NET, f.inBar ? 0.5 : 0.32).fillRect(tx, by, TW, bh);
    for (let y = by + 2; y < by + bh - 1; y += 3) for (let x = (y % 2); x < TW; x += 3) g.fillStyle(NET, 0.4).fillRect(tx + x, y, 1, 1);
    g.fillStyle(NET, 1).fillRect(tx, by, TW, 1).fillRect(tx, by + bh - 1, TW, 1);
    g.fillStyle(NET_DK, 1).fillRect(tx, by + 1, TW, 1).fillRect(tx, by + bh - 2, TW, 1);

    // the treasure chest, with its own little gauge
    const c = f.treasure;
    if (c && c.shown && !c.got) {
      const cy = ty + Math.round(c.pos * K);
      stamp(g, CHEST, CHEST_INK, tx + 3, cy);
      g.fillStyle(OUT, 1).fillRect(tx + 2, cy + 7, 9, 2);
      g.fillStyle(0xffd84a, 1).fillRect(tx + 2, cy + 7, Math.round(9 * c.level), 1);
    }

    // the fish, in its own colours, wriggling while you hold it in the net
    const fy = ty + Math.round(f.fishPos * K) + Math.round((ICON * K - 6) / 2);
    const jig = f.inBar && f.wait <= 0 ? shake(1) : 0;
    stamp(g, FISH, this.ink, tx + 2 + jig, fy + (jig ? shake(1) : 0));

    // the catch meter: a gauge carved into the board
    const mx = tx + TW + 3;
    g.fillStyle(OUT, 1).fillRect(mx - 1, ty - 1, 6, TP + 2);
    g.fillStyle(0x342a24, 1).fillRect(mx, ty, 4, TP);
    const p = f.progress;
    const mh = Math.round(TP * p);
    g.fillStyle(METER[p < 0.33 ? 0 : p < 0.75 ? 1 : 2], 1).fillRect(mx, ty + TP - mh, 4, mh);
    g.fillStyle(0xfff4d6, 0.35).fillRect(mx, ty + TP - mh, 1, mh);
    for (let y = ty + 8; y < ty + TP; y += 8) g.fillStyle(OUT, 0.45).fillRect(mx, y, 4, 1);

    // the brass reel at the foot, its handle going round while you wind
    if (holding) this.crank += 0.4;
    const rx = tx + 6;
    const ry = ty + TP + 7;
    g.fillStyle(OUT, 1).fillRect(rx - 2, ry - 3, 5, 7).fillRect(rx - 3, ry - 2, 7, 5);
    g.fillStyle(BRASS, 1).fillRect(rx - 1, ry - 2, 3, 5).fillRect(rx - 2, ry - 1, 5, 3);
    g.fillStyle(0x704a30, 1).fillRect(rx, ry, 1, 1);
    g.fillStyle(RIM_LT, 1).fillRect(rx - 1, ry - 2, 1, 1);
    const h = [[3, 0], [2, 2], [0, 3], [-2, 2], [-3, 0], [-2, -2], [0, -3], [2, -2]][Math.floor(this.crank) % 8];
    g.fillStyle(0xfff4d6, 1).fillRect(rx + h[0], ry + h[1], 1, 1);
  }
}
