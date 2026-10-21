import { W, H, DEPTH, INK, label, pin } from '../core/constants.js';
import { board, pill } from './Panels.js';
import { FISH } from '../../data/fish/fish.js';

const BW = 276; // the panel
const BH = 236;
const COLS = 5;
const ROWS = 4;
const SW = 48; // a slot: wide enough for the sturgeon
const SH = 30;
const GAP = 3;
const GRID_X = -((COLS * SW + (COLS - 1) * GAP) / 2);
const GRID_Y = -BH / 2 + 40;

const OUT = 0x25131a;
const RECESS = 0x704a30;
const RECESS_DK = 0x543426;
const RIM_LT = 0xdaab76;

// What's always in the bag.
const TACKLE = [
  { key: 'hook', name: 'Hook', note: 'A size 6 hook, sharp and ready.' },
  { key: 'bobber', frame: 0, name: 'Float', note: 'A red and white float. It goes under when they bite.' },
];

// The backpack: a button in the corner whose picture is the bag itself,
// shut while the inventory is closed and opening (then rummaged in) while
// it's open; and the panel of slots, made of the same board and wood as the
// journal and counters.
export class Backpack {
  constructor(scene, save, canOpen = () => true) {
    this.scene = scene;
    this.save = save;
    this.canOpen = canOpen;
    this.isOpen = false;

    const bx = W - 24;
    const by = H - 26;
    this.button = pill(scene, bx, by, 34, 34).setDepth(DEPTH.UI).setInteractive({ useHandCursor: true });
    this.icon = scene.add.sprite(bx, by - 1, 'backpack', 0).setDepth(DEPTH.UI);
    this.button.on('pointerdown', (p, x, y, e) => {
      e.stopPropagation();
      this.toggle();
    });
    // now and then, while shut, it gives a little hop so you notice it
    scene.time.addEvent({ delay: 7000, loop: true, callback: () => {
      if (!this.isOpen) scene.tweens.add({ targets: this.icon, y: by - 3, duration: 120, yoyo: true, ease: 'Stepped', easeParams: [2] });
    } });

    // the panel
    const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x10141c, 0.45);
    this.panel = board(scene, 0, 0, BW, BH).setInteractive();
    this.panel.on('pointerdown', (p, lx, ly, e) => {
      e.stopPropagation();
      this.pick(lx - BW / 2, ly - BH / 2);
    });
    const title = label(scene, 0, -BH / 2 + 22, 'Backpack', { font: 'head', size: 2, color: INK.gold });
    this.slots = scene.add.graphics();
    this.items = scene.add.container(0, 0);
    const infoY = GRID_Y + ROWS * (SH + GAP) + 26;
    const inlay = scene.add.rectangle(0, infoY, BW - 36, 38, 0x2a160e, 0.45);
    this.name = label(scene, 0, infoY - 8, '', { font: 'head', color: INK.gold });
    this.info = label(scene, 0, infoY + 9, '', { color: INK.soft, width: BW - 44 });
    this.card = scene.add.container(W / 2, H / 2 - 10, [this.panel, title, this.slots, this.items, inlay, this.name, this.info]);
    this.root = scene.add.container(0, 0, [dim, this.card]).setDepth(DEPTH.UI + 5).setVisible(false);
  }

  // Everything in the bag: tackle first, then each kind of fish caught.
  contents() {
    const d = this.save.data;
    const fish = FISH.filter((f) => d.bag[f.id] > 0).map((f) => ({
      key: `fish-${f.id}`,
      frame: 0,
      name: f.name,
      count: d.bag[f.id],
      note: `Best ${d.species[f.id]?.best?.toFixed(1) ?? '?'} lb  ·  ${f.latin}`,
    }));
    return [...TACKLE, ...fish];
  }

  slotAt(i) {
    return { x: GRID_X + (i % COLS) * (SW + GAP), y: GRID_Y + Math.floor(i / COLS) * (SH + GAP) };
  }

  draw() {
    const g = this.slots.clear();
    for (let i = 0; i < COLS * ROWS; i++) {
      const { x, y } = this.slotAt(i);
      // a recess carved into the planks: shadow at the top and left,
      // light catching the bottom and right edge
      g.fillStyle(OUT, 1).fillRect(x, y, SW, SH);
      g.fillStyle(RECESS, 1).fillRect(x + 1, y + 1, SW - 2, SH - 2);
      g.fillStyle(RECESS_DK, 1).fillRect(x + 1, y + 1, SW - 2, 2).fillRect(x + 1, y + 1, 1, SH - 2);
      g.fillStyle(RIM_LT, 1).fillRect(x + 1, y + SH - 2, SW - 2, 1).fillRect(x + SW - 2, y + 2, 1, SH - 3);
      if (i === this.selected) {
        g.fillStyle(0xffd84a, 1).fillRect(x, y, SW, 1).fillRect(x, y + SH - 1, SW, 1).fillRect(x, y, 1, SH).fillRect(x + SW - 1, y, 1, SH);
      }
    }
  }

  refresh() {
    this.list = this.contents();
    this.items.removeAll(true);
    const s = this.scene;
    this.list.forEach((it, i) => {
      const { x, y } = this.slotAt(i);
      const img = s.add.image(x + SW / 2, y + SH / 2, it.key, it.frame);
      this.items.add(img);
      if (it.count > 1) this.items.add(label(s, x + SW - 4, y + SH - 7, `x${it.count}`, { color: INK.cream }).setOrigin(1, 0.5));
    });
    pin(this.items);
    this.draw();
    this.describe();
  }

  describe() {
    const it = this.list[this.selected];
    if (!it) {
      this.name.setText('');
      this.info.setText(this.list.length > TACKLE.length ? 'Tap something to look at it' : 'Nothing caught yet. Go fishing!');
      return;
    }
    this.name.setText(it.count ? `${it.name}  x${it.count}` : it.name);
    this.info.setText(it.note);
  }

  pick(x, y) {
    for (let i = 0; i < COLS * ROWS; i++) {
      const s = this.slotAt(i);
      if (x >= s.x && x < s.x + SW && y >= s.y && y < s.y + SH) {
        this.selected = i < this.list.length ? i : null;
        this.draw();
        this.describe();
        return;
      }
    }
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    if (!this.canOpen()) {
      // not now: the bag shakes its head
      this.scene.tweens.add({ targets: this.icon, x: this.icon.x + 2, duration: 50, yoyo: true, repeat: 2 });
      return;
    }
    this.isOpen = true;
    this.selected = null;
    this.refresh();
    this.icon.play('bag-open');
    this.icon.once('animationcomplete', () => this.isOpen && this.icon.play('bag-rummage'));
    this.root.setVisible(true);
    this.card.y = H / 2 + 20;
    this.card.setAlpha(0);
    this.scene.tweens.add({ targets: this.card, y: H / 2 - 10, alpha: 1, duration: 260, ease: 'Back.easeOut', onUpdate: () => (this.card.y = Math.round(this.card.y)) });
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.icon.play('bag-close');
    this.scene.tweens.add({ targets: this.card, y: H / 2 + 20, alpha: 0, duration: 160, ease: 'Quad.easeIn', onComplete: () => !this.isOpen && this.root.setVisible(false) });
  }
}
