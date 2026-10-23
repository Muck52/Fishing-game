// Where the fish are: what you can see of them from the dock, on and just
// under the surface. A shadow of a fish cruising near the top, a spot of
// bubbles where a bottom feeder grubs in the mud, rings where a fish rises
// to take something off the surface. Each one is a fish of a certain kind;
// its size hints at which. Cast to one and that fish comes to the bait.
import { SURFACE_Y, DEPTH, clamp } from '../core/constants.js';
import { FISH } from '../../data/fish/fish.js';
import { pickFish } from './FishSpawner.js';
import { ripple, tinyRipple, bubbles } from '../environment/Effects.js';

const R = (a, b) => Phaser.Math.Between(a, b);

// How each species shows itself, and how big its sign is: shadows by the
// size of the fish (like Animal Crossing's), bubbles for the bottom
// feeders, rings for the fish that rise.
const SIGN = {
  bluegill: ['shadow', 'small'], pumpkinseed: ['shadow', 'small'], perch: ['shadow', 'small'], crappie: ['rise', 'small'],
  whitebass: ['rise', 'medium'], carp: ['bubbles', 'large'], bass: ['shadow', 'medium'], largemouth: ['shadow', 'large'],
  trout: ['rise', 'medium'], rainbow: ['rise', 'large'], channelcat: ['bubbles', 'medium'], drum: ['bubbles', 'medium'],
  walleye: ['shadow', 'large'], catfish: ['bubbles', 'medium'], pike: ['shadow', 'long'], muskie: ['shadow', 'longer'],
  golden: ['bubbles', 'huge'],
};
// shadow sizes in pixels (length, depth of body)
const SIZE = { small: [8, 3], medium: [12, 4], large: [17, 5], long: [22, 3], longer: [28, 4], huge: [30, 6] };
const BUBBLES = { small: 1, medium: 2, large: 3, huge: 5 };
export const WATER = { from: 16, to: 204 }; // the open water you can cast to, left of the pier
const MAX = 3;

// A fish-shaped shadow, a pixel silhouette: a body tapering to a tail fin.
function shadowTexture(scene, size) {
  const key = `shadow-${size}`;
  if (scene.textures.exists(key)) return key;
  const [L, D] = SIZE[size];
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x0c1c26, 1);
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
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    this.nextAt = scene.time.now + 600;
    for (let i = 0; i < 2; i++) this.spawn();
  }

  // A new fish shows itself somewhere on the open water. Farther out, the
  // fish run bigger and rarer.
  spawn() {
    const s = this.scene;
    const x = R(WATER.from + 10, WATER.to - 6);
    if (this.list.some((g) => Math.abs(g.x - x) < 24)) return;
    const far = clamp((WATER.to - x) / (WATER.to - WATER.from), 0, 1);
    const fish = pickFish(far);
    const [kind, size] = SIGN[fish.id];
    const sign = { fish, kind, size, x, born: s.time.now, until: s.time.now + R(20000, 35000), next: 0, dir: Math.random() < 0.5 ? -1 : 1 };
    if (kind === 'shadow') {
      sign.w = SIZE[size][0];
      sign.sprite = s.add.image(x, SURFACE_Y + 13, shadowTexture(s, size)).setDepth(DEPTH.SURFACE + 0.07).setAlpha(0).setFlipX(sign.dir > 0);
      s.tweens.add({ targets: sign.sprite, alpha: 0.6, duration: 1500 });
    } else {
      sign.w = kind === 'bubbles' ? 6 + BUBBLES[size] * 3 : 10;
    }
    this.list.push(sign);
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
        g.x += g.dir * dt * (3 + SIZE[g.size][0] * 0.15);
        if (g.x < WATER.from + g.w / 2 || g.x > WATER.to - g.w / 2 || Math.random() < dt * 0.08) g.dir *= -1;
        g.x = clamp(g.x, WATER.from + g.w / 2, WATER.to - g.w / 2);
        g.sprite.setPosition(Math.round(g.x), SURFACE_Y + 13).setFlipX(g.dir > 0);
      } else if (time > g.next) {
        if (g.kind === 'bubbles') {
          // a bottom feeder's bubbles, rising in a cluster
          bubbles(this.scene, g.x, SURFACE_Y + 16, BUBBLES[g.size]);
          g.next = time + R(900, 1600);
        } else {
          // a rise: rings spreading where it took something off the top
          (g.size === 'small' ? tinyRipple : ripple)(this.scene, g.x);
          g.next = time + R(1800, 3200);
        }
      }
    }
  }

  // The fish whose sign the bait landed on (or near), if any.
  near(x) {
    let best = null;
    for (const g of this.list) {
      const d = Math.abs(g.x - x);
      if (d <= g.w / 2 + 10 && (!best || d < Math.abs(best.x - x))) best = g;
    }
    return best;
  }

  // That fish leaves its sign to come to the bait.
  take(g) {
    this.list = this.list.filter((o) => o !== g);
    if (g.sprite) this.scene.tweens.add({ targets: g.sprite, alpha: 0, duration: 500, onComplete: () => g.sprite.destroy() });
  }

  remove(g) {
    this.take(g);
  }

  // A fish that got away scares the others off for a while.
  scatter() {
    for (const g of [...this.list]) if (Math.random() < 0.5) this.remove(g);
    this.nextAt = this.scene.time.now + R(3000, 6000);
  }
}

export const signOf = (id) => SIGN[id];
export const COMMON = FISH.filter((f) => f.rarity === 'common');
