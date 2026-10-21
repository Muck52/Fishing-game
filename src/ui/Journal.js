import { W, H, DEPTH, INK, label, pin, lerp } from '../core/constants.js';
import { ART } from '../core/Assets.js';
import { pill } from './Panels.js';
import { FISH, RARITY } from '../../data/fish/fish.js';
import { JOURNAL } from '../../data/fish/journal.js';
import { Swimmer } from '../fish/Swim.js';
import { Flopper } from '../fish/Flop.js';

// The book as you hold it to read (journal-held.png): the left half lifted
// toward you on its spine, the right-hand page flat and facing you, with
// everything to read on it; the whole book centred on the screen. Positions
// are in the image's own pixels, read from the build's notes on the art
// (anchors.journal in the manifest) once it has loaded.
let IH, SPINE, PAGE, HELD, X0, X1, TW, CX, FOOT;
function adopt(a) {
  IH = a.h;
  SPINE = a.spine;
  PAGE = a.page; // the right page's paper
  HELD = a.held; // the lifted page's free edge, and how much taller it looks
  X0 = PAGE.x0 + 14; // the writing, clear of the gutter's shadow
  X1 = PAGE.x1 - 12;
  TW = X1 - X0;
  CX = Math.round((X0 + X1) / 2);
  FOOT = PAGE.y1 - 13;
}
const LINE = 14; // a line of ink text, line spacing included
const TURN_MS = 480;

// Ink on the page, in plain blocky letters (the 'ink' fonts have no dark
// outline): brown for the text, red for the headings in bold, a soft grey
// pencil for the asides.
const PEN = 0x543426;
const PENCIL = 0x6e5e50;
const RED = 0x90453b;
// Rarity, stamped in inks dark enough to read on the page.
const STAMP = { common: 0x6e5e50, uncommon: 0x407e55, rare: 0x254e66, legendary: 0xa36443 };
const PAPER = 0xf0ecd0;
const WATER = [0x2c5c78, 0x275571, 0x1e4762, 0x1b3f5b, 0x173953, 0x14324c];

// The field journal: a worn leather notebook in the corner that opens to a
// contents page, then a page for every fish. A caught fish has its photo
// taped in, swimming the way it does in the wild (tap it and it flops like
// a fish out of water), with notes on where it lives, what it eats, how big
// it grows and something worth knowing. One not yet caught is a dark shape
// with a question mark. Turning forward, the page lifts off, sweeps over the
// spine and settles onto the held-up half; going back, the reverse.
export class Journal {
  constructor(scene, save, canOpen = () => true) {
    this.scene = scene;
    this.save = save;
    this.canOpen = canOpen;
    this.isOpen = false;
    this.page = 0; // 0 is the contents; fish i is on page i + 1
    const a = ART.anchors.journal;
    adopt(a);

    const bx = W - 62;
    const by = H - 26;
    this.button = pill(scene, bx, by, 34, 34).setDepth(DEPTH.UI).setInteractive({ useHandCursor: true });
    this.icon = scene.add.sprite(bx, by - 1, 'journal', 0).setDepth(DEPTH.UI);
    this.button.on('pointerdown', (p, x, y, e) => {
      e.stopPropagation();
      this.toggle();
    });

    const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x10141c, 0.55);
    const art = scene.add.image(0, 0, 'journal-held').setOrigin(0);
    this.hit = scene.add.rectangle(a.x0, 0, a.x1 - a.x0 + 1, IH, 0x000000, 0).setOrigin(0).setInteractive();
    this.hit.on('pointerdown', (p, x, y, e) => {
      e.stopPropagation();
      this.drag = { x: p.x, y: p.y };
    });
    scene.input.on('pointerup', (p) => this.release(p));
    this.pages = scene.add.container(0, 0);
    this.sheet = scene.add.graphics(); // the page being turned
    this.glint = scene.add.graphics(); // a page edge catching the light as it joins or leaves the stack
    this.ribbon = scene.add.graphics(); // the red ribbon bookmark
    // centred: as much room to its left as to its right
    const left = Math.round(W / 2 - (a.x0 + a.x1 + 1) / 2);
    this.book = scene.add.container(left, this.homeY(), [art, this.hit, this.pages, this.ribbon, this.sheet, this.glint]);
    this.root = scene.add.container(0, 0, [dim, this.book]).setDepth(DEPTH.UI + 6).setVisible(false);
  }

  homeY() {
    return Math.round(H / 2 + 8 - IH / 2); // a little below the middle, clear of the hints
  }

  // ---- writing on the page ----------------------------------------------------

  writer(c) {
    return (x, y, text, o = {}) => {
      const t = label(this.scene, x, y, text, { font: 'ink', color: PENCIL, ...o });
      c.add(t);
      return t;
    };
  }

  // A line that must fit across the page: a size smaller, then a pixel
  // tighter, until it does.
  fit(t, width, sizes = [32, 16]) {
    for (const size of sizes) {
      t.setFontSize(size).setLetterSpacing(0);
      if (t.getTextBounds(true).local.width <= width) return t;
      t.setLetterSpacing(-1);
      if (t.getTextBounds(true).local.width <= width) return t;
    }
    return t;
  }

  // A fish's name, filling the same box on every page: the same height,
  // stretched by a whole number across (so its pixels stay square-edged),
  // and the room left over shared out between the letters.
  title(t, box = TW - 16) {
    const w = t.getTextBounds(true).local.width;
    let sx = 1;
    while (sx < 3 && w * (sx + 1) <= box) sx++;
    const gaps = Math.max(1, t.text.length - 1);
    return t.setScale(sx, 2).setLetterSpacing((box - w * sx) / gaps / sx);
  }

  // A heading in bold red and a note under it, wrapped to the page; returns
  // how far down the page it reached.
  note(c, y, head, body) {
    const t = this.writer(c);
    t(X0, y, head, { font: 'ink-bold', color: RED }).setOrigin(0, 0.5);
    // (the letters sit low in their line, so the body starts close under
    // its heading and leaves a clear gap before the next one)
    const b = t(X0, y + 3, body, { color: PEN, width: TW, align: 0 }).setOrigin(0, 0);
    b.setLineSpacing(LINE - 22).setLetterSpacing(-1);
    return y + 3 + b.getTextBounds(true).lines.lengths.length * LINE + 16;
  }

  // Builds page n: { c, hits, swim, sprite }.
  build(n) {
    const pg = { c: this.scene.add.container(0, 0), hits: [], swim: null, sprite: null };
    this.pages.add(pg.c);
    if (n === 0) this.contents(pg);
    else this.fishPage(pg, FISH[n - 1]);
    // the foot of the page: arrows in the corners, the page number between
    const t = this.writer(pg.c);
    if (n > 0) {
      t(X0 + 6, FOOT, '<', { font: 'ink-bold', size: 2, color: RED });
      pg.hits.push({ x0: PAGE.x0, x1: X0 + 40, y0: FOOT - 18, y1: FOOT + 14, go: () => this.turnTo(n - 1) });
      t(CX - 40, FOOT, 'Contents', { color: PENCIL });
      pg.hits.push({ x0: CX - 74, x1: CX + 4, y0: FOOT - 12, y1: FOOT + 12, go: () => this.turnTo(0) });
      t(CX + 50, FOOT, `${n} / ${FISH.length}`, { font: 'ink-bold', color: PENCIL });
    }
    if (n < FISH.length) {
      t(X1 - 6, FOOT, '>', { font: 'ink-bold', size: 2, color: RED });
      pg.hits.push({ x0: X1 - 40, x1: PAGE.x1, y0: FOOT - 18, y1: FOOT + 14, go: () => this.turnTo(n + 1) });
    }
    pin(pg.c);
    return pg;
  }

  // The contents on a single page: every fish in the book's order, two
  // columns of nine, each with its name in small print, its picture (a
  // silhouette until caught) and its page. Tap one to go straight to it.
  contents(pg) {
    const s = this.scene;
    const species = this.save.data.species;
    const t = this.writer(pg.c);
    t(CX, PAGE.y0 + 18, 'Contents', { font: 'ink-bold', size: 2, color: RED });
    t(CX, PAGE.y0 + 36, 'tap a fish to find it', { font: 'ink-small', color: PENCIL });
    const rows = Math.ceil(FISH.length / 2);
    const top = PAGE.y0 + 48;
    const rowH = Math.floor((FOOT - 18 - top) / rows);
    const colW = Math.floor((TW - 8) / 2);
    FISH.forEach((f, i) => {
      const x = X0 + (i < rows ? 0 : colW + 8);
      const y = top + (i % rows) * rowH;
      const known = !!species[f.id];
      this.fit(t(x, y + 6, known ? f.name : '???', { font: 'ink-small', color: known ? PEN : PENCIL }).setOrigin(0, 0.5), colW, [16]);
      const img = s.add.image(x + 23, y + rowH - 11, `fish-${f.id}`, 0);
      if (!known) img.setTintFill(0x342a24);
      pg.c.add(img);
      t(x + colW, y + rowH - 11, `p.${i + 1}`, { font: 'ink-small', color: PENCIL }).setOrigin(1, 0.5);
      const g = s.add.graphics();
      for (let dx = 0; dx < colW; dx += 3) g.fillStyle(0xe7cd8d, 1).fillRect(x + dx, y + rowH - 1, 1, 1);
      pg.c.add(g);
      pg.hits.push({ x0: x - 4, x1: x + colW + 4, y0: y, y1: y + rowH, go: () => this.turnTo(i + 1) });
    });
  }

  // A fish's page: its name, the photo, its record, then the notes.
  fishPage(pg, fish) {
    const s = this.scene;
    const rec = this.save.data.species[fish.id];
    const known = !!rec;
    const facts = JOURNAL[fish.id];
    const t = this.writer(pg.c);

    // the name fills the header and nothing more
    this.title(t(CX, PAGE.y0 + 18, known ? fish.name : '???', { font: 'ink-bold', color: RED }));
    if (known) this.fit(t(CX, PAGE.y0 + 38, fish.latin, { color: PENCIL }), TW, [16]);

    // the photo, taped in below the header
    const photo = { x: CX - 92, y: PAGE.y0 + 56, w: 184, h: 54 };
    const g = s.add.graphics();
    pg.c.add(g);
    const f = { x: photo.x - 5, y: photo.y - 5, w: photo.w + 10, h: photo.h + 20 };
    g.fillStyle(0x10141c, 0.22).fillRect(f.x + 2, f.y + 2, f.w, f.h);
    g.fillStyle(0xb3a697, 1).fillRect(f.x - 1, f.y - 1, f.w + 2, f.h + 2);
    g.fillStyle(0xf5f2db, 1).fillRect(f.x, f.y, f.w, f.h);
    const band = photo.h / WATER.length;
    WATER.forEach((col, i) => g.fillStyle(col, 1).fillRect(photo.x, photo.y + Math.round(i * band), photo.w, Math.ceil(band)));
    WATER.forEach((col, i) => {
      if (!i) return;
      for (let x = i % 2; x < photo.w; x += 2) g.fillStyle(col, 1).fillRect(photo.x + x, photo.y + Math.round(i * band) - 1, 1, 1);
    });
    for (let y = 0; y < photo.h * 0.7; y += 2) g.fillStyle(0xb2d0d0, 0.14).fillRect(photo.x + 30 + Math.floor(y / 3), photo.y + y, 3, 1);
    for (let x = 0; x < photo.w; x++) if (x % 3) g.fillStyle(0xb0ecf0, 0.7).fillRect(photo.x + x, photo.y, 1, 1);
    g.fillStyle(0xa9805f, 1).fillRect(photo.x, photo.y + photo.h - 5, photo.w, 5);
    for (const [wx, wh, col] of [[8, 18, 0x407e55], [14, 11, 0x51642b], [164, 20, 0x407e55], [170, 12, 0x51642b]]) {
      for (let j = 0; j < wh; j++) g.fillStyle(col, 1).fillRect(photo.x + wx + (Math.floor(j / 4) % 2), photo.y + photo.h - 5 - j, 2, 1);
    }
    for (const tx of [f.x - 8, f.x + f.w - 24]) {
      g.fillStyle(0xf7ec9b, 0.7).fillRect(tx, f.y - 4, 32, 9);
      g.fillStyle(0xe7cd8d, 0.7).fillRect(tx, f.y + 4, 32, 1);
    }
    pg.bubbles = s.add.container(0, 0);
    pg.c.add(pg.bubbles);
    const fishImg = s.add.sprite(0, 0, `fish-${fish.id}`, 0).setScale(2);
    pg.c.add(fishImg);
    if (known) {
      fishImg.play(`swim-${fish.id}`);
      pg.sprite = fishImg;
      pg.swim = new Swimmer(fishImg, fish.id, photo, (x, y) => this.silt(pg, photo, x, y));
    } else {
      fishImg.setPosition(photo.x + photo.w / 2, photo.y + photo.h / 2).setTintFill(0x25131a).setAlpha(0.85);
      t(photo.x + photo.w / 2, photo.y + photo.h / 2, '?', { font: 'head', size: 2, color: INK.cream });
    }
    // the photo's caption: how rare it is, and a nudge to tap it
    const cap = photo.y + photo.h + 9;
    t(photo.x, cap, RARITY[fish.rarity].label.toUpperCase(), { font: 'ink-bold', color: STAMP[fish.rarity] }).setOrigin(0, 0.5);
    if (known) t(photo.x + photo.w, cap, 'tap it!', { color: PENCIL }).setOrigin(1, 0.5);

    let y = cap + 22;
    if (known) {
      this.fit(t(CX, y, `Caught ${rec.count}   Best ${rec.best.toFixed(1)} lb`, { color: PENCIL }), TW, [16]);
      y += 21;
      y = this.note(pg.c, y, 'Lives', facts.habitat);
      y = this.note(pg.c, y, 'Eats', facts.eats);
      // the size is short: heading and figure on one line
      t(X0, y, 'Size', { font: 'ink-bold', color: RED }).setOrigin(0, 0.5);
      t(X0 + 48, y, facts.size, { color: PEN }).setOrigin(0, 0.5).setLetterSpacing(-1);
      this.note(pg.c, y + 20, 'Did you know?', facts.fact);
    } else {
      y = this.note(pg.c, y, 'Not caught yet', 'Catch one to fill in this page.');
      this.note(pg.c, y, 'A clue', facts.habitat);
    }
  }

  // Silt and bubbles stirred up by a bottom-feeder in the photo.
  silt(pg, photo, x, y) {
    const b = pin(this.scene.add.sprite(x, y, 'bubble').play('bubble-pop'));
    pg.bubbles.add(b);
    this.scene.tweens.add({ targets: b, y: photo.y + 4, x: x + Phaser.Math.Between(-6, 6), duration: 1600, ease: 'Sine.easeIn', onComplete: () => b.destroy() });
  }

  // ---- input --------------------------------------------------------------

  release(p) {
    if (!this.isOpen || !this.drag) return;
    const dx = p.x - this.drag.x;
    this.drag = null;
    if (this.turn) return;
    if (Math.abs(dx) > 40) return this.turnTo(this.page + (dx < 0 ? 1 : -1));
    const x = p.x - this.book.x;
    const y = p.y - this.book.y;
    // the ribbon marks the contents
    if (x >= SPINE + 3 && x <= SPINE + 12 && y > PAGE.y1 - 20) return this.turnTo(0);
    const cur = this.cur;
    for (const h of cur.hits) if (x >= h.x0 && x <= h.x1 && y >= h.y0 && y <= h.y1) return h.go();
    const s = cur.sprite;
    if (s && !this.flop && Math.abs(x - s.x) < s.displayWidth / 2 + 6 && Math.abs(y - s.y) < s.displayHeight / 2 + 6) {
      // a fish out of water, right there in the photo
      s.anims.stop();
      this.flop = new Flopper(this.scene, s, FISH[this.page - 1].id, cur.c);
      this.flop.bout();
    }
  }

  // ---- turning pages --------------------------------------------------------

  turnTo(n) {
    if (n < 0 || n > FISH.length || n === this.page || this.turn) return;
    const dir = n > this.page ? 1 : -1;
    this.endFlop();
    const old = this.cur;
    const next = this.build(n);
    this.page = n;
    if (dir > 0) {
      // the page lifts away, uncovering the next one beneath it
      old.c.destroy();
    } else {
      // the top page peels off the stack and comes back over to cover this one
      next.c.setVisible(false);
      this.glinting = { t: 0 };
    }
    this.turn = { dir, old, next, t: 0 };
  }

  // The turning sheet, in the same perspective as the held page. Over the
  // flat page it is drawn as the page swinging up about the spine: narrower
  // as it rises, its free edge nearer so taller, and darker as it turns from
  // the light. Past upright it joins the held-up half, settling to its shape.
  drawSheet(k) {
    const g = this.sheet.clear();
    const C = Phaser.Display.Color;
    let outer;
    let rise;
    let shadeK;
    let bow = 1; // straight edges over the flat side; bowed like the held pages over the stack
    if (k < 0.6) {
      const a = (k / 0.6) * (Math.PI / 2); // 0 flat .. 90 degrees upright
      outer = SPINE + (PAGE.x1 - SPINE) * Math.cos(a);
      rise = HELD.rise * 1.6 * Math.sin(a);
      shadeK = Math.sin(a);
      // its shadow on the page beneath
      g.fillStyle(0x10141c, 0.18 * (1 - Math.cos(a))).fillRect(Math.round(outer), PAGE.y0, 8, PAGE.y1 - PAGE.y0);
    } else {
      // upright .. down onto the stack of turned pages: it falls, gathering
      // pace, lands a hair proud of the stack's edge, then settles flush
      const b = (k - 0.6) / 0.4;
      const land = Math.min(1, b / 0.8);
      outer = SPINE - (SPINE - (HELD.x - 3)) * land * land; // falling, gathering pace
      if (b > 0.8) outer = lerp(HELD.x - 3, HELD.x, (b - 0.8) / 0.2);
      rise = lerp(HELD.rise * 1.6, HELD.rise, land);
      shadeK = lerp(1, 0.3, land);
      bow = 0.7;
      // its shadow darkening the stack as it comes down
      g.fillStyle(0x10141c, 0.22 * land).fillPoints(this.pageShape(HELD.x, HELD.rise, 0.7), true);
    }
    outer = Math.round(outer);
    rise = Math.round(rise);
    const shade = C.Interpolate.ColorWithColor(C.ValueToColor(PAPER), C.ValueToColor(0xdaab76), 100, Math.round(shadeK * 100));
    const side = outer >= SPINE ? 1 : -1;
    const pts = this.pageShape(outer, rise, bow);
    const rim = this.pageShape(outer + side, rise + 1, bow, 1);
    g.fillStyle(0x25131a, 1).fillPoints(rim, true);
    g.fillStyle(C.GetColor(shade.r, shade.g, shade.b), 1).fillPoints(pts, true);
    // faint lines of writing, converging with its edges
    const x0 = Math.min(SPINE, outer);
    const x1 = Math.max(SPINE, outer);
    for (let j = 1; j < 24; j++) {
      const f = 0.06 + (0.88 * j) / 24;
      for (let x = x0 + 3; x < x1 - 3; x += 2) {
        const t = (x - SPINE) / (outer - SPINE || 1);
        const yTop = PAGE.y0 - rise * t;
        const yBot = PAGE.y1 + rise * t;
        if ((x + j) % 9 < 6) g.fillStyle(0xb3a697, 0.5).fillRect(x, Math.round(yTop + (yBot - yTop) * f), 1, 1);
      }
    }
  }

  // The outline of a page standing out from the spine to `outer`, its free
  // edge `rise` pixels taller at top and bottom; bow < 1 curves its top and
  // bottom edges up out of the gutter, as the held pages do.
  pageShape(outer, rise, bow = 1, grow = 0) {
    const top = [];
    const n = 10;
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      top.push({ x: Math.round(SPINE + (outer - SPINE) * f), y: Math.round(PAGE.y0 - grow - rise * f ** bow) });
    }
    const bottom = top.map((p) => ({ x: p.x, y: PAGE.y1 + (PAGE.y0 - p.y) })).reverse();
    return [...top, ...bottom];
  }

  // A page edge on the stack catching the light, fading: the page that has
  // just joined it, or the one just lifting away.
  drawGlint(dt) {
    const gl = this.glinting;
    const g = this.glint.clear();
    if (!gl) return;
    gl.t += dt * 1000;
    const a = 1 - gl.t / 380;
    if (a <= 0) {
      this.glinting = null;
      return;
    }
    const x = HELD.x - 1;
    g.fillStyle(0xf5f2db, a).fillRect(x, PAGE.y0 - HELD.rise - 3, 1, PAGE.y1 - PAGE.y0 + HELD.rise * 2 + 6);
    g.fillStyle(0x25131a, a * 0.5).fillRect(x - 1, PAGE.y0 - HELD.rise - 2, 1, PAGE.y1 - PAGE.y0 + HELD.rise * 2 + 4);
  }

  stepTurn(dt) {
    const tr = this.turn;
    tr.t = Math.min(1, tr.t + (dt * 1000) / TURN_MS);
    const e = Phaser.Math.Easing.Sine.InOut(tr.t);
    // forward the sheet goes flat page -> held side; back, the other way
    this.drawSheet(tr.dir > 0 ? e : 1 - e);
    if (tr.t >= 1) {
      this.sheet.clear();
      if (tr.dir > 0) this.glinting = { t: 0 }; // it has joined the stack
      if (tr.dir < 0) {
        tr.old.c.destroy();
        tr.next.c.setVisible(true);
      }
      this.cur = tr.next;
      this.turn = null;
    }
  }

  endFlop() {
    if (!this.flop) return;
    this.flop.stop();
    this.flop = null;
  }

  // ---- opening and closing ------------------------------------------------

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    if (!this.canOpen()) {
      this.scene.tweens.add({ targets: this.icon, x: this.icon.x + 2, duration: 50, yoyo: true, repeat: 2 });
      return;
    }
    this.isOpen = true;
    this.pages.removeAll(true);
    this.sheet.clear();
    this.turn = null;
    this.flop = null;
    this.cur = this.build(this.page);
    this.icon.play('book-open');
    this.icon.once('animationcomplete', () => this.isOpen && this.icon.play('book-read'));
    this.root.setVisible(true);
    this.book.y = this.homeY() + 24;
    this.book.setAlpha(0);
    this.scene.tweens.add({ targets: this.book, y: this.homeY(), alpha: 1, duration: 280, ease: 'Back.easeOut', onUpdate: () => (this.book.y = Math.round(this.book.y)) });
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.drag = null;
    this.endFlop();
    if (this.turn) {
      // finish a turn in progress at once
      this.turn.t = 1;
      this.stepTurn(0);
    }
    this.icon.play('book-close');
    this.scene.tweens.add({ targets: this.book, y: this.homeY() + 24, alpha: 0, duration: 160, ease: 'Quad.easeIn', onComplete: () => !this.isOpen && this.root.setVisible(false) });
  }

  // The ribbon: satin red with a lit edge and a shaded one, lying down the
  // page beside the gutter and hanging out past the cover, a V cut in its
  // end, the loose tail stirring a pixel now and then.
  drawRibbon(time) {
    const g = this.ribbon.clear();
    const x = SPINE + 4;
    const y0 = PAGE.y0 - 8;
    const y1 = PAGE.y1 + 30;
    const sway = Math.floor(time / 900) % 3 === 2 ? 1 : 0;
    g.fillStyle(0x10141c, 0.14).fillRect(x + 8, y0 + 8, 2, PAGE.y1 - y0 - 8); // its shadow on the page
    for (let y = y0; y < y1; y++) {
      const dx = y > PAGE.y1 + 14 ? sway : 0;
      const cut = Math.max(0, 4 - (y1 - 1 - y));
      const row = (c, a, b) => {
        for (let i = a; i <= b; i++) if (Math.abs(i - 3) >= cut) g.fillStyle(c, 1).fillRect(x + i + dx, y, 1, 1);
      };
      row(0x25131a, -1, 7);
      row(0xc25f62, 0, 6);
      row(0xd88571, 1, 1);
      row(0xa04f45, 5, 5);
      if (cut) g.fillStyle(0x25131a, 1).fillRect(x + 3 - cut + dx, y, 1, 1).fillRect(x + 3 + cut + dx, y, 1, 1);
    }
  }

  update(dt) {
    if (!this.isOpen) return;
    this.drawRibbon(this.scene.time.now);
    this.drawGlint(dt);
    if (this.turn) return this.stepTurn(dt);
    if (this.flop) {
      this.flop.update(dt);
      if (this.flop.mode === 'rest') {
        // done flopping: back to swimming
        this.endFlop();
        this.cur.sprite.play(`swim-${FISH[this.page - 1].id}`);
      }
    } else this.cur?.swim?.update(dt);
  }
}
