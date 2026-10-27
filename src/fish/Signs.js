// Where the fish are: what you can see of them from the dock. Two kinds of
// sign on the open water:
//
//   a shadow  a fish cruising just under the surface, dimpling it now and
//             then. Its size says how big a fish it is (small, medium,
//             large, huge), not which: the species is one of the fish of
//             that size, found out when it bites.
//   sparkles  something glinting on the water. Always a fish, of any kind,
//             and a treasure with it.
//
// Fish it and that fish comes to the bait, whatever is on the hook. Which
// fish it turns out to be leans toward the ones that suit the hour, the
// weather, the bait and its depth (Habits.js). Now and then a sign is
// "hot": a fish on the feed right now, which Olive barks at.
import { SURFACE_Y, DEPTH, clamp } from '../core/constants.js';
import { FISH, RARITY } from '../../data/fish/fish.js';
import { tinyRipple, ripple } from '../environment/Effects.js';
import { liking, onTheFeed } from './Habits.js';

const R = (a, b) => Phaser.Math.Between(a, b);

// The fish of each size, by their true length.
export const CLASS = {
  small: ['bluegill', 'pumpkinseed', 'perch', 'crappie'],
  medium: ['whitebass', 'bass', 'largemouth', 'trout'],
  large: ['carp', 'rainbow', 'channelcat', 'drum', 'walleye', 'catfish'],
  huge: ['pike', 'muskie', 'golden'],
};
// shadow sizes in pixels (length, depth of body), clearly apart
const SIZE = { small: [8, 3], medium: [13, 4], large: [19, 5], huge: [28, 6] };
// how often each size shows (small fish are everywhere, huge ones rare)
const ODDS = { small: 5, medium: 3, large: 2, huge: 1 };
export const WATER = { from: 16, to: 204 }; // the open water you can cast to, left of the pier
const MAX = 3;

const TREASURES = [
  { name: 'an old brass compass', value: 40 },
  { name: 'a silver spoon lure', value: 25 },
  { name: 'a pocket watch', value: 60 },
  { name: 'a message in a bottle', value: 30 },
  { name: 'a gold ring', value: 80 },
  { name: 'a stone arrowhead', value: 35 },
  { name: 'a lost fishing medal', value: 50 },
  { name: 'a pearl button', value: 20 },
];

const HOT = 0.3; // how often a sign is a fish on the feed

// One fish from a list, by how common each is and how well things suit it.
function roll(ids, c) {
  const pool = ids.map((id) => FISH.find((f) => f.id === id)).map((f) => ({ f, w: RARITY[f.rarity].weight * liking(f.id, c) }));
  let r = Math.random() * pool.reduce((a, p) => a + p.w, 0);
  for (const p of pool) if ((r -= p.w) <= 0) return p.f;
  return pool[0].f;
}

// A fish-shaped shadow, a pixel silhouette: a body tapering to a tail fin.
function shadowTexture(scene, size) {
  const key = `shadow-${size}`;
  if (scene.textures.exists(key)) return key;
  const [L, D] = SIZE[size];
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x0a1820, 1);
  const body = Math.round(L * 0.78);
  for (let x = 0; x < body; x++) {
    const t = x / (body - 1);
    const h = Math.max(1, Math.round(D * Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.95)) ** 0.7));
    g.fillRect(x, Math.floor((D + 2 - h) / 2), 1, h);
  }
  for (let x = body; x < L; x++) {
    const h = Math.min(D + 2, 1 + (x - body) * 2);
    g.fillRect(x, Math.floor((D + 2 - h) / 2), 1, h);
  }
  g.generateTexture(key, L, D + 2);
  g.destroy();
  return key;
}

export class Signs {
  // conditions() gives { time, weather, band, lure } as they are now
  constructor(scene, conditions) {
    this.scene = scene;
    this.conditions = conditions;
    this.onHot = () => {};
    this.list = [];
    this.nextAt = scene.time.now + 600;
    for (let i = 0; i < 2; i++) this.spawn();
  }

  spawn(kind = null) {
    const s = this.scene;
    const x = R(WATER.from + 14, WATER.to - 10);
    if (this.list.some((g) => Math.abs(g.x - x) < 28)) return;
    if (!kind) kind = !this.list.some((g) => g.kind === 'sparkle') && Math.random() < 0.2 ? 'sparkle' : 'shadow';
    const sign = { kind, x, until: s.time.now + R(20000, 35000), next: 0, dir: Math.random() < 0.5 ? -1 : 1, hot: Math.random() < HOT };
    if (kind === 'shadow') {
      const sizes = Object.keys(ODDS);
      let r = Math.random() * sizes.reduce((a, k) => a + ODDS[k], 0);
      sign.size = sizes.find((k) => (r -= ODDS[k]) <= 0) || 'small';
      sign.w = SIZE[sign.size][0];
      // hot only if one of the fish of its size is on the feed just now
      if (sign.hot) sign.hot = CLASS[sign.size].some((id) => onTheFeed(id, this.conditions()));
      sign.sprite = s.add.image(x, SURFACE_Y + 12, shadowTexture(s, sign.size)).setDepth(DEPTH.SURFACE + 0.07).setAlpha(0).setFlipX(sign.dir > 0);
      s.tweens.add({ targets: sign.sprite, alpha: 0.7, duration: 1500 });
    } else {
      sign.w = 12;
    }
    this.list.push(sign);
    if (sign.hot || kind === 'sparkle') this.scene.time.delayedCall(1600, () => this.list.includes(sign) && this.onHot(sign));
  }

  // Olive's bark draws your eye to it: a ring, or a burst of glints.
  flash(g) {
    if (g.kind === 'shadow') {
      ripple(this.scene, Math.round(g.x));
      this.scene.tweens.add({ targets: g.sprite, alpha: 1, duration: 200, yoyo: true, repeat: 1 });
    } else {
      for (let i = 0; i < 8; i++) {
        const sp = this.scene.add.image(g.x + R(-8, 8), SURFACE_Y + R(0, 6), 'spark').setDepth(DEPTH.GLOW).setBlendMode('ADD').setTint(0xffe9a0).setAlpha(0);
        this.scene.tweens.add({ targets: sp, alpha: 1, delay: i * 60, duration: 120, yoyo: true, hold: 120, onComplete: () => sp.destroy() });
      }
    }
  }

  update(time, dt) {
    if (time > this.nextAt && this.list.length < MAX) {
      this.spawn();
      this.nextAt = time + R(5000, 9000);
    }
    for (const g of [...this.list]) {
      if (time > g.until) {
        this.remove(g);
        continue;
      }
      if (g.kind === 'shadow') {
        // it cruises slowly, turning now and then
        g.x += g.dir * dt * (3 + g.w * 0.15);
        if (g.x < WATER.from + g.w / 2 || g.x > WATER.to - g.w / 2 || Math.random() < dt * 0.08) g.dir *= -1;
        g.x = clamp(g.x, WATER.from + g.w / 2, WATER.to - g.w / 2);
        g.sprite.setPosition(Math.round(g.x), SURFACE_Y + 12).setFlipX(g.dir > 0);
        if (time > g.next) {
          // it dimples the surface: a ring that catches your eye
          tinyRipple(this.scene, Math.round(g.x - g.dir * g.w * 0.2));
          g.next = time + R(1800, 3200);
        }
      } else if (time > g.next) {
        // a glint off something on the water, here and there round the spot
        const sp = this.scene.add.image(g.x + R(-6, 6), SURFACE_Y + R(1, 6), 'spark').setDepth(DEPTH.GLOW).setBlendMode('ADD').setTint(0xffe9a0);
        this.scene.tweens.add({ targets: sp, alpha: 0, duration: 420, ease: 'Quad.easeIn', onComplete: () => sp.destroy() });
        g.next = time + R(140, 380);
      }
    }
  }

  // The sign the bait landed on (or near), if any.
  near(x, reach = 10) {
    let best = null;
    for (const g of this.list) {
      const d = Math.abs(g.x - x);
      if (d <= g.w / 2 + reach && (!best || d < Math.abs(best.x - x))) best = g;
    }
    return best;
  }

  // The fish under that sign leaves it for the bait: which fish it is, and
  // the treasure if it was sparkling.
  take(g) {
    this.list = this.list.filter((o) => o !== g);
    if (g.sprite) this.scene.tweens.add({ targets: g.sprite, alpha: 0, duration: 500, onComplete: () => g.sprite.destroy() });
    const c = this.conditions();
    if (g.kind === 'sparkle') {
      return { fish: roll(FISH.map((f) => f.id), c), treasure: TREASURES[R(0, TREASURES.length - 1)] };
    }
    // a hot sign is one of the fish of its size that's on the feed now
    let ids = CLASS[g.size];
    const feeding = ids.filter((id) => onTheFeed(id, c));
    if (g.hot && feeding.length) ids = feeding;
    return { fish: roll(ids, c), treasure: null };
  }

  remove(g) {
    this.list = this.list.filter((o) => o !== g);
    if (g.sprite) this.scene.tweens.add({ targets: g.sprite, alpha: 0, duration: 500, onComplete: () => g.sprite.destroy() });
  }

  // A fish that got away scares the others off for a while.
  scatter() {
    for (const g of [...this.list]) if (Math.random() < 0.5) this.remove(g);
    this.nextAt = this.scene.time.now + R(3000, 6000);
  }
}
