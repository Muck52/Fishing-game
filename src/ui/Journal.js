import { W, H, DEPTH, INK, label, pin } from '../core/constants.js';
import { pill } from './Panels.js';
import { FISH, RARITY } from '../../data/fish/fish.js';
import { JOURNAL } from '../../data/fish/journal.js';
import { Swimmer } from '../fish/Swim.js';
import { Flopper, FLOPS } from '../fish/Flop.js';

// The book lying open: two pages either side of the gutter. Its height is
// about three quarters of the screen; the art's middle repeats to fit.
const BW = 352;
const BH = Math.round(Math.min(600, H * 0.75) / 2) * 2;
const TOP = -BH / 2;
const PAGE_TOP = TOP + 9;
const PAGE_BOT = TOP + BH - 13;
const LP = { x0: -164, x1: -2 }; // the left page
const RP = { x0: 1, x1: 163 }; // the right page
const PAD = 10;
const FOOT = PAGE_BOT - 16;
const TURN_MS = 420;

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

const mid = (p) => (p.x0 + p.x1) / 2;

// The field journal: a worn leather notebook in the corner that opens flat
// on a spread for every fish, after a contents page. A caught fish has its
// photo taped in, swimming the way it does in the wild (tap it and it flops
// like a fish out of water), with notes on where it lives, what it eats,
// how big it grows and something worth knowing. One not yet caught is a
// dark shape with a question mark. Pages turn with a sheet sweeping over
// the gutter, right to left going forward and back again going back.
export class Journal {
  constructor(scene, save, canOpen = () => true) {
    this.scene = scene;
    this.save = save;
    this.canOpen = canOpen;
    this.isOpen = false;
    this.page = 0; // 0 is the contents; fish i is on page i + 1

    const bx = W - 62;
    const by = H - 26;
    this.button = pill(scene, bx, by, 34, 34).setDepth(DEPTH.UI).setInteractive({ useHandCursor: true });
    this.icon = scene.add.sprite(bx, by - 1, 'journal', 0).setDepth(DEPTH.UI);
    this.button.on('pointerdown', (p, x, y, e) => {
      e.stopPropagation();
      this.toggle();
    });

    const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x10141c, 0.55);
    const top = scene.add.image(0, TOP, 'book-top').setOrigin(0.5, 0);
    const body = scene.add.tileSprite(0, TOP + 24, BW, BH - 24 - 28, 'book-mid').setOrigin(0.5, 0);
    const bottom = scene.add.image(0, TOP + BH - 28, 'book-bottom').setOrigin(0.5, 0);
    this.hit = scene.add.rectangle(0, 0, BW, BH, 0x000000, 0).setInteractive();
    this.hit.on('pointerdown', (p, x, y, e) => {
      e.stopPropagation();
      this.drag = { x: p.x, y: p.y };
    });
    scene.input.on('pointerup', (p) => this.release(p));
    this.pages = scene.add.container(0, 0);
    this.sheet = scene.add.graphics(); // the page being turned
    this.ribbon = scene.add.graphics(); // the red ribbon bookmark in the gutter
    this.book = scene.add.container(W / 2, this.homeY(), [top, body, bottom, this.hit, this.pages, this.sheet, this.ribbon]);
    this.root = scene.add.container(0, 0, [dim, this.book]).setDepth(DEPTH.UI + 6).setVisible(false);
  }

  homeY() {
    return Math.round(H / 2 - 10);
  }

  // ---- building a spread ----------------------------------------------------

  // Builds the two pages for page n: { left, right, hits, swim, sprite }.
  spread(n) {
    const s = this.scene;
    const sp = { left: s.add.container(0, 0), right: s.add.container(0, 0), hits: [], swim: null, sprite: null };
    this.pages.add([sp.left, sp.right]);
    if (n === 0) this.contents(sp);
    else this.fishPages(sp, FISH[n - 1]);
    // turning: an arrow in each outer corner, and a way back to the contents
    const l = this.writer(sp.left);
    const r = this.writer(sp.right);
    if (n > 0) {
      l(LP.x0 + 16, FOOT, '<', { font: 'ink-bold', size: 2, color: RED });
      l(mid(LP), FOOT, 'Contents', { color: PENCIL });
      sp.hits.push({ x0: LP.x0, x1: LP.x0 + 50, y0: FOOT - 20, y1: FOOT + 16, go: () => this.turnTo(n - 1) });
      sp.hits.push({ x0: mid(LP) - 40, x1: mid(LP) + 40, y0: FOOT - 12, y1: FOOT + 12, go: () => this.turnTo(0) });
      r(mid(RP), FOOT, `${n} / ${FISH.length}`, { font: 'ink-bold', color: PENCIL });
    }
    if (n < FISH.length) {
      r(RP.x1 - 16, FOOT, '>', { font: 'ink-bold', size: 2, color: RED });
      sp.hits.push({ x0: RP.x1 - 50, x1: RP.x1, y0: FOOT - 20, y1: FOOT + 16, go: () => this.turnTo(n + 1) });
    }
    pin(sp.left);
    pin(sp.right);
    return sp;
  }

  writer(c) {
    return (x, y, text, o = {}) => {
      const t = label(this.scene, x, y, text, { font: 'ink', color: PENCIL, ...o });
      c.add(t);
      return t;
    };
  }

  // A heading in bold red and a note under it, wrapped to the page; returns
  // how far down the page it reached.
  note(c, p, y, head, body) {
    const t = this.writer(c);
    t(p.x0 + PAD, y, head, { font: 'ink-bold', color: RED }).setOrigin(0, 0.5);
    const b = t(p.x0 + PAD, y + 9, body, { color: PEN, width: p.x1 - p.x0 - PAD * 2, align: 0 }).setOrigin(0, 0);
    b.setLineSpacing(-7);
    return y + 9 + b.getTextBounds(true).local.height + 12;
  }

  // The contents: every fish in the book's order, its picture, name and
  // page. Tap one to go straight to it.
  contents(sp) {
    const s = this.scene;
    const species = this.save.data.species;
    const half = Math.ceil(FISH.length / 2);
    const head = this.writer(sp.left)(mid(LP), PAGE_TOP + 24, 'Contents', { font: 'ink-bold', size: 2, color: RED });
    if (head.getTextBounds(true).local.width > LP.x1 - LP.x0 - 16) head.setFontSize(16);
    this.writer(sp.right)(mid(RP), PAGE_TOP + 24, 'tap a fish', { color: PENCIL });
    const rowsTop = PAGE_TOP + 46;
    const rowH = Math.floor((FOOT - 14 - rowsTop) / half);
    FISH.forEach((f, i) => {
      const p = i < half ? LP : RP;
      const c = i < half ? sp.left : sp.right;
      const y = Math.round(rowsTop + (i % half) * rowH + rowH / 2);
      const known = !!species[f.id];
      const img = s.add.image(p.x0 + 6 + 23, y, `fish-${f.id}`, 0);
      if (!known) img.setTintFill(0x342a24);
      c.add(img);
      const w = this.writer(c);
      // the name, and its page beneath it in pencil, centred on the row
      const nx = p.x0 + 6 + 50;
      const room = p.x1 - nx - 2;
      const name = w(nx, 0, known ? f.name : '???', { color: known ? PEN : PENCIL, width: room, align: 0 }).setOrigin(0, 0).setLineSpacing(-8);
      if (name.getTextBounds(true).local.width > room) name.setLetterSpacing(-1); // one long word, set a little tighter
      const lines = name.getTextBounds(true).lines.lengths.length;
      const LINE = 14;
      name.y = Math.round(y - ((lines + 1) * LINE) / 2) + 2;
      w(nx, name.y + lines * LINE, `page ${i + 1}`, { color: PENCIL }).setOrigin(0, 0);
      // a dotted rule under each entry
      const g = s.add.graphics();
      for (let x = p.x0 + PAD; x < p.x1 - PAD; x += 3) g.fillStyle(0xe7cd8d, 1).fillRect(x, Math.round(y + rowH / 2) - 1, 1, 1);
      c.add(g);
      sp.hits.push({ x0: p.x0, x1: p.x1, y0: y - rowH / 2, y1: y + rowH / 2, go: () => this.turnTo(i + 1) });
    });
  }

  // A fish's spread: its name, photo and record on the left, notes on the
  // right.
  fishPages(sp, fish) {
    const s = this.scene;
    const rec = this.save.data.species[fish.id];
    const known = !!rec;
    const facts = JOURNAL[fish.id];
    const t = this.writer(sp.left);
    const cx = mid(LP);
    const inner = LP.x1 - LP.x0 - 16;

    const title = t(cx, PAGE_TOP + 24, known ? fish.name : '???', { font: 'ink-bold', size: 2, color: RED });
    if (title.getTextBounds(true).local.width > inner) title.setFontSize(16);
    if (known) t(cx, PAGE_TOP + 44, fish.latin, { color: PENCIL, width: inner }).setLineSpacing(-5);

    // the photo, taped in
    const photo = { x: Math.round(cx - 68), y: PAGE_TOP + 66, w: 136, h: 80 };
    const g = s.add.graphics();
    sp.left.add(g);
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
    for (let y = 0; y < photo.h * 0.7; y += 2) g.fillStyle(0xb2d0d0, 0.14).fillRect(photo.x + 24 + Math.floor(y / 3), photo.y + y, 3, 1);
    for (let x = 0; x < photo.w; x++) if (x % 3) g.fillStyle(0xb0ecf0, 0.7).fillRect(photo.x + x, photo.y, 1, 1);
    g.fillStyle(0xa9805f, 1).fillRect(photo.x, photo.y + photo.h - 5, photo.w, 5);
    for (const [wx, wh, col] of [[8, 20, 0x407e55], [14, 12, 0x51642b], [118, 22, 0x407e55], [124, 14, 0x51642b]]) {
      for (let j = 0; j < wh; j++) g.fillStyle(col, 1).fillRect(photo.x + wx + (Math.floor(j / 4) % 2), photo.y + photo.h - 5 - j, 2, 1);
    }
    for (const tx of [f.x - 8, f.x + f.w - 22]) {
      g.fillStyle(0xf7ec9b, 0.7).fillRect(tx, f.y - 5, 30, 10);
      g.fillStyle(0xe7cd8d, 0.7).fillRect(tx, f.y + 4, 30, 1);
    }
    sp.bubbles = s.add.container(0, 0);
    sp.left.add(sp.bubbles);

    const fishImg = s.add.sprite(0, 0, `fish-${fish.id}`, 0).setScale(2);
    sp.left.add(fishImg);
    if (known) {
      fishImg.play(`swim-${fish.id}`);
      sp.sprite = fishImg;
      sp.swim = new Swimmer(fishImg, fish.id, photo, (x, y) => this.silt(sp, photo, x, y));
    } else {
      fishImg.setPosition(photo.x + photo.w / 2, photo.y + photo.h / 2).setTintFill(0x25131a).setAlpha(0.85);
      t(photo.x + photo.w / 2, photo.y + photo.h / 2, '?', { font: 'head', size: 2, color: INK.cream });
    }
    const cap = photo.y + photo.h + 9;
    t(photo.x, cap, RARITY[fish.rarity].label.toUpperCase(), { font: 'ink-bold', color: STAMP[fish.rarity] }).setOrigin(0, 0.5);
    if (known) t(photo.x + photo.w, cap, 'tap me!', { color: PENCIL }).setOrigin(1, 0.5);

    let y = cap + 24;
    if (known) {
      t(LP.x0 + PAD, y, `Caught: ${rec.count}`, { color: PENCIL }).setOrigin(0, 0.5);
      t(LP.x0 + PAD, y + 14, `Best: ${rec.best.toFixed(1)} lb`, { color: PENCIL }).setOrigin(0, 0.5);
      this.note(sp.left, LP, y + 36, 'Did you know?', facts.fact);
      y = PAGE_TOP + 24;
      y = this.note(sp.right, RP, y, 'Lives', facts.habitat);
      y = this.note(sp.right, RP, y, 'Eats', facts.eats);
      y = this.note(sp.right, RP, y, 'Size', facts.size);
      this.note(sp.right, RP, y, 'Out of water', FLOPS[fish.id].say);
    } else {
      y = this.note(sp.right, RP, PAGE_TOP + 24, 'Not caught yet', 'Catch one to fill in these pages.');
      this.note(sp.right, RP, y, 'A clue', facts.habitat);
    }
  }

  // Silt and bubbles stirred up by a bottom-feeder in the photo.
  silt(sp, photo, x, y) {
    const b = pin(this.scene.add.sprite(x, y, 'bubble').play('bubble-pop'));
    sp.bubbles.add(b);
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
    const cur = this.cur;
    // the ribbon marks the contents
    if (x > -6 && x < 5 && y > PAGE_BOT - 30) return this.turnTo(0);
    for (const h of cur.hits) if (x >= h.x0 && x <= h.x1 && y >= h.y0 && y <= h.y1) return h.go();
    const s = cur.sprite;
    if (s && !this.flop && Math.abs(x - s.x) < s.displayWidth / 2 + 6 && Math.abs(y - s.y) < s.displayHeight / 2 + 6) {
      // a fish out of water, right there in the photo
      s.anims.stop();
      this.flop = new Flopper(this.scene, s, FISH[this.page - 1].id, cur.left);
      this.flop.bout();
    }
  }

  // ---- turning pages --------------------------------------------------------

  turnTo(n) {
    if (n < 0 || n > FISH.length || n === this.page || this.turn) return;
    const dir = n > this.page ? 1 : -1;
    this.endFlop();
    const old = this.cur;
    const next = this.spread(n);
    this.page = n;
    // going forward the right-hand page lifts and sweeps over to the left:
    // the new right page is under it from the start, and the new left page
    // lands with it. Going back it's the mirror image.
    if (dir > 0) {
      old.right.destroy();
      next.left.setVisible(false);
    } else {
      old.left.destroy();
      next.right.setVisible(false);
    }
    this.turn = { dir, old, next, t: 0 };
  }

  stepTurn(dt) {
    const tr = this.turn;
    tr.t = Math.min(1, tr.t + (dt * 1000) / TURN_MS);
    const k = Phaser.Math.Easing.Sine.InOut(tr.t);
    const g = this.sheet.clear();
    if (tr.t >= 1) {
      if (tr.dir > 0) {
        tr.old.left.destroy();
        tr.next.left.setVisible(true);
      } else {
        tr.old.right.destroy();
        tr.next.right.setVisible(true);
      }
      this.cur = tr.next;
      this.turn = null;
      return;
    }
    // the sheet: over its first page, narrowing toward the gutter as it
    // lifts, then widening out over the other page as it comes down; it
    // rises a little and darkens as it stands on edge
    const first = k < 0.5;
    const span = first ? 1 - k / 0.5 : (k - 0.5) / 0.5;
    const onRight = (tr.dir > 0) === first;
    const page = onRight ? RP : LP;
    const w = Math.max(1, Math.round((page.x1 - page.x0) * span));
    const x0 = onRight ? page.x0 : page.x1 - w;
    const lift = Math.round(5 * (1 - span));
    const y0 = PAGE_TOP - lift;
    const y1 = PAGE_BOT + lift;
    const C = Phaser.Display.Color;
    const shade = C.Interpolate.ColorWithColor(C.ValueToColor(PAPER), C.ValueToColor(0xdaab76), 100, Math.round((1 - span) * 100));
    // its shadow falling on the page beneath
    g.fillStyle(0x10141c, 0.08 + 0.14 * (1 - span)).fillRect(onRight ? x0 + w + 1 : x0 - 7, PAGE_TOP, 6, PAGE_BOT - PAGE_TOP);
    g.fillStyle(0x25131a, 1).fillRect(x0 - 1, y0 - 1, w + 2, y1 - y0 + 2);
    g.fillStyle(C.GetColor(shade.r, shade.g, shade.b), 1).fillRect(x0, y0, w, y1 - y0);
    // faint lines of writing showing through, and the curl at its free edge
    for (let y = y0 + 22; y < y1 - 24; y += 9) g.fillStyle(0xb3a697, 0.45).fillRect(x0 + Math.round(w * 0.12), y, Math.round(w * 0.72), 1);
    const curl = Math.min(3, w);
    g.fillStyle(0xe7cd8d, 1).fillRect(onRight ? x0 + w - curl : x0, y0, curl, y1 - y0);
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
    this.cur = this.spread(this.page);
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

  // The ribbon: satin red with a lit edge and a shaded one lying down the
  // gutter, a V cut in its end, the loose tail stirring a pixel now and then.
  drawRibbon(time) {
    const g = this.ribbon.clear();
    const x = -4;
    const y0 = TOP + 2;
    const y1 = TOP + BH + 14;
    const sway = Math.floor(time / 900) % 3 === 2 ? 1 : 0;
    for (let y = y0; y < y1; y++) {
      const dx = y > TOP + BH - 6 ? sway : 0;
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
