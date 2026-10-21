import { W, H, DEPTH, INK, label, pin } from '../core/constants.js';
import { pill } from './Panels.js';
import { FISH, RARITY } from '../../data/fish/fish.js';
import { JOURNAL } from '../../data/fish/journal.js';
import { Swimmer } from '../fish/Swim.js';
import { Flopper } from '../fish/Flop.js';

const PW = 320; // the page (journal-page.png, plus its shadow)
const PH = 520;
const TOP = -PH / 2;
const LEFT = -PW / 2;
const PHOTO = { x: -114, y: TOP + 80, w: 228, h: 92 }; // the water in the photo
const TEXT_X = LEFT + 40; // right of the red margin
const TEXT_W = PW - 58;

// Ink on paper. The lettering keeps its dark outline, so these read as a
// soft pencil (body), a brown pen (facts) and red headings.
const PEN = 0x543426;
const PENCIL = 0x6e5e50;
const RED = 0x90453b;

const WATER = [0x2c5c78, 0x275571, 0x1e4762, 0x1b3f5b, 0x173953, 0x14324c];

// The field journal: a worn leather notebook in the corner that opens to a
// page for every fish. A caught fish gets its photo taped in, swimming the
// way it does in the wild (tap it and it flops like a fish out of water),
// and notes on where it lives, what it eats, how big it grows and something
// worth knowing. One not yet caught is a dark shape with a question mark.
export class Journal {
  constructor(scene, save, canOpen = () => true) {
    this.scene = scene;
    this.save = save;
    this.canOpen = canOpen;
    this.isOpen = false;
    this.page = 0;

    const bx = W - 62;
    const by = H - 26;
    this.button = pill(scene, bx, by, 34, 34).setDepth(DEPTH.UI).setInteractive({ useHandCursor: true });
    this.icon = scene.add.sprite(bx, by - 1, 'journal', 0).setDepth(DEPTH.UI);
    this.button.on('pointerdown', (p, x, y, e) => {
      e.stopPropagation();
      this.toggle();
    });

    const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x10141c, 0.55);
    this.paper = scene.add.image(0, 2, 'journal-page').setInteractive();
    this.paper.on('pointerdown', (p, x, y, e) => {
      e.stopPropagation();
      this.drag = { x: p.x, y: p.y };
    });
    scene.input.on('pointerup', (p) => this.release(p));
    this.content = scene.add.container(0, 0);
    this.book = scene.add.container(W / 2, this.homeY(), [this.paper, this.content]);
    this.root = scene.add.container(0, 0, [dim, this.book]).setDepth(DEPTH.UI + 6).setVisible(false);
  }

  homeY() {
    return Math.round(H / 2 - 8);
  }

  // ---- a page -------------------------------------------------------------

  build() {
    const s = this.scene;
    const c = this.content;
    this.swim = null;
    this.flop = null;
    c.removeAll(true);
    const fish = FISH[this.page];
    const rec = this.save.data.species[fish.id];
    const known = !!rec;
    const facts = JOURNAL[fish.id];
    const add = (o) => c.add(o) && o;
    const text = (x, y, t, o = {}) => add(label(s, x, y, t, { color: PENCIL, ...o }));

    // the heading, and the page number in the corner
    const title = text(0, TOP + 34, known ? fish.name : '???', { font: 'head', size: 2, color: RED });
    if (title.getTextBounds(true).local.width > PW - 50) title.setFontSize(16); // long names in the smaller hand
    if (known) text(0, TOP + 56, fish.latin, { color: PENCIL });

    // the photo, taped in
    const g = add(s.add.graphics());
    const f = { x: PHOTO.x - 6, y: PHOTO.y - 6, w: PHOTO.w + 12, h: PHOTO.h + 22 };
    g.fillStyle(0x10141c, 0.25).fillRect(f.x + 2, f.y + 2, f.w, f.h);
    g.fillStyle(0xb3a697, 1).fillRect(f.x - 1, f.y - 1, f.w + 2, f.h + 2);
    g.fillStyle(0xf5f2db, 1).fillRect(f.x, f.y, f.w, f.h);
    const band = PHOTO.h / WATER.length;
    WATER.forEach((col, i) => g.fillStyle(col, 1).fillRect(PHOTO.x, PHOTO.y + Math.round(i * band), PHOTO.w, Math.ceil(band)));
    WATER.forEach((col, i) => {
      if (!i) return;
      const y = PHOTO.y + Math.round(i * band) - 1;
      for (let x = i % 2; x < PHOTO.w; x += 2) g.fillStyle(col, 1).fillRect(PHOTO.x + x, y, 1, 1);
    });
    for (let y = 0; y < PHOTO.h * 0.7; y += 2) g.fillStyle(0xb2d0d0, 0.14).fillRect(PHOTO.x + 40 + Math.floor(y / 3), PHOTO.y + y, 3, 1);
    for (let y = 0; y < PHOTO.h * 0.6; y += 2) g.fillStyle(0xb2d0d0, 0.1).fillRect(PHOTO.x + 150 + Math.floor(y / 3), PHOTO.y + y, 2, 1);
    for (let x = 0; x < PHOTO.w; x++) if (x % 3) g.fillStyle(0xb0ecf0, 0.7).fillRect(PHOTO.x + x, PHOTO.y, 1, 1);
    g.fillStyle(0xa9805f, 1).fillRect(PHOTO.x, PHOTO.y + PHOTO.h - 5, PHOTO.w, 5);
    for (let x = 0; x < PHOTO.w; x += 3) g.fillStyle(0xc79a49, 1).fillRect(PHOTO.x + x + (x % 2), PHOTO.y + PHOTO.h - 5 + (x % 4 ? 1 : 3), 1, 1);
    for (const [wx, wh, col] of [[12, 22, 0x407e55], [18, 14, 0x51642b], [200, 26, 0x407e55], [208, 16, 0x51642b]]) {
      for (let j = 0; j < wh; j++) g.fillStyle(col, 1).fillRect(PHOTO.x + wx + (Math.floor(j / 4) % 2), PHOTO.y + PHOTO.h - 5 - j, 2, 1);
    }
    // two strips of tape over the top corners
    for (const tx of [f.x - 8, f.x + f.w - 30]) {
      g.fillStyle(0xf7ec9b, 0.7).fillRect(tx, f.y - 6, 38, 11);
      g.fillStyle(0xe7cd8d, 0.7).fillRect(tx, f.y + 4, 38, 1);
    }
    this.bubbles = add(s.add.container(0, 0));

    // the fish
    const sp = add(s.add.sprite(0, 0, `fish-${fish.id}`, 0).setScale(2));
    if (known) {
      sp.play(`swim-${fish.id}`);
      this.fishSprite = sp;
      this.swim = new Swimmer(sp, fish.id, PHOTO, (x, y) => this.silt(x, y));
    } else {
      // not yet caught: a dark shape and a question mark
      sp.setPosition(0, PHOTO.y + PHOTO.h / 2).setTintFill(0x25131a).setAlpha(0.85);
      text(0, PHOTO.y + PHOTO.h / 2, '?', { font: 'head', size: 2, color: INK.cream });
      this.fishSprite = null;
    }
    text(PHOTO.x + PHOTO.w / 2, PHOTO.y + PHOTO.h + 9, known ? 'tap me!' : '', { color: PENCIL }).setOrigin(1, 0.5);
    const rar = RARITY[fish.rarity];
    text(PHOTO.x, PHOTO.y + PHOTO.h + 9, rar.label.toUpperCase(), { color: Phaser.Display.Color.HexStringToColor(rar.color).color }).setOrigin(0, 0.5);

    // the notes
    let y = PHOTO.y + PHOTO.h + 34;
    const note = (head, body) => {
      text(TEXT_X, y, head, { font: 'head', color: RED }).setOrigin(0, 0.5);
      y += 14;
      const t = text(TEXT_X, y, body, { color: PEN, width: TEXT_W, align: 0 }).setOrigin(0, 0);
      t.setLineSpacing(-2);
      y += t.getTextBounds(true).local.height + 12;
    };
    if (known) {
      text(0, y - 12, `Caught ${rec.count}  ·  Best ${rec.best.toFixed(1)} lb`, { color: PENCIL });
      y += 6;
      note('Lives', facts.habitat);
      note('Eats', facts.eats);
      note('Size', facts.size);
      note('Did you know?', facts.fact);
    } else {
      note('Not caught yet', 'Catch one to fill in this page.');
      note('A clue', facts.habitat);
    }

    // turning the page
    const foot = TOP + PH - 26;
    this.prev = text(LEFT + 28, foot, this.page > 0 ? '<' : '', { font: 'head', size: 2, color: RED });
    this.next = text(LEFT + PW - 28, foot, this.page < FISH.length - 1 ? '>' : '', { font: 'head', size: 2, color: RED });
    text(0, foot, `${this.page + 1} / ${FISH.length}`, { font: 'head', color: PENCIL });
    pin(c);
  }

  // Silt and bubbles stirred up by a bottom-feeder.
  silt(x, y) {
    const b = pin(this.scene.add.sprite(x, y, 'bubble').play('bubble-pop'));
    this.bubbles.add(b);
    this.scene.tweens.add({ targets: b, y: PHOTO.y + 4, x: x + Phaser.Math.Between(-6, 6), duration: 1600, ease: 'Sine.easeIn', onComplete: () => b.destroy() });
  }

  // ---- input --------------------------------------------------------------

  release(p) {
    if (!this.isOpen || !this.drag) return;
    const dx = p.x - this.drag.x;
    this.drag = null;
    if (Math.abs(dx) > 40) return this.turn(dx < 0 ? 1 : -1);
    const x = p.x - this.book.x;
    const y = p.y - this.book.y;
    const foot = TOP + PH - 26;
    if (Math.abs(y - foot) < 18 && x < LEFT + 60) return this.turn(-1);
    if (Math.abs(y - foot) < 18 && x > LEFT + PW - 60) return this.turn(1);
    const s = this.fishSprite;
    if (s && !this.flop && Math.abs(x - s.x) < s.displayWidth / 2 + 6 && Math.abs(y - s.y) < s.displayHeight / 2 + 6) {
      // a fish out of water, right there in the photo
      s.anims.stop();
      this.flop = new Flopper(this.scene, s, FISH[this.page].id, this.content);
      this.flop.bout();
    }
  }

  turn(dir) {
    const to = this.page + dir;
    if (to < 0 || to >= FISH.length || this.turning) return;
    this.turning = true;
    const c = this.content;
    this.scene.tweens.add({
      targets: c,
      x: -dir * 30,
      alpha: 0,
      duration: 120,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.page = to;
        this.build();
        c.x = dir * 30;
        this.scene.tweens.add({ targets: c, x: 0, alpha: 1, duration: 160, ease: 'Quad.easeOut', onUpdate: () => (c.x = Math.round(c.x)), onComplete: () => (this.turning = false) });
      },
    });
  }

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
    this.content.x = 0;
    this.content.alpha = 1;
    this.build();
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
    this.icon.play('book-close');
    this.scene.tweens.add({ targets: this.book, y: this.homeY() + 24, alpha: 0, duration: 160, ease: 'Quad.easeIn', onComplete: () => !this.isOpen && this.root.setVisible(false) });
  }

  update(dt) {
    if (!this.isOpen) return;
    if (this.flop) {
      this.flop.update(dt);
      if (this.flop.mode === 'rest') {
        // done flopping: back to swimming
        this.flop.stop();
        this.flop = null;
        this.fishSprite.play(`swim-${FISH[this.page].id}`);
      }
    } else this.swim?.update(dt);
  }
}
