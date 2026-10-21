// The animals of the lake. Birds cross the sky and fish leap now and then;
// every so often a deer, fox, rabbit or bear comes down to the bank, and
// gets a field note.
import { W, BG, SURFACE_Y, DEPTH } from '../core/constants.js';
import { FISH } from '../../data/fish/fish.js';
import { splash } from '../environment/Effects.js';

const R = (a, b) => Phaser.Math.Between(a, b);
const BANK_Y = SURFACE_Y - 8; // where the far bank meets the water

// [walk texture, walk anim, idle anim, speed px/s, how far along the bank, note]
const VISITORS = {
  deer: ['deer-walk', 'deer-walk', 'deer-idle', 46, 250, 'A white-tailed doe steps down to the water to drink.'],
  fox: ['fox-walk', 'fox-walk', 'fox-idle', 60, 200, 'A red fox trots along the bank, nose to the ground.'],
  rabbit: ['rabbit-hop', 'rabbit-hop', 'rabbit-idle', 50, 150, 'A snowshoe hare stops to nibble clover by the water.'],
  bear: ['bear-walk', 'bear-walk', 'bear-walk', 34, 170, 'A black bear ambles out of the pines. Best keep your distance.'],
};

export class Wildlife {
  constructor(scene, onNote = () => {}) {
    this.scene = scene;
    this.note = onNote;
    const now = scene.time.now;
    this.next = { visitor: now + 4000, birds: now + 1500, jump: now + 6000, eagle: now + 9000 };
    this.last = null;
  }

  update(time) {
    const n = this.next;
    if (time > n.visitor) {
      this.visit();
      n.visitor = time + R(18000, 30000);
    }
    if (time > n.birds) {
      Math.random() < 0.35 ? this.ducks() : this.gulls();
      n.birds = time + R(9000, 18000);
    }
    if (time > n.jump) {
      this.jump();
      n.jump = time + R(7000, 15000);
    }
    if (time > n.eagle) {
      this.eagle();
      n.eagle = time + R(30000, 50000);
    }
  }

  // An animal walks in from the left edge of the bank, stops at the water
  // for a while, then turns and goes back into the trees.
  visit() {
    const keys = Object.keys(VISITORS).filter((k) => k !== this.last && (k !== 'bear' || Math.random() < 0.4));
    const key = keys[R(0, keys.length - 1)];
    this.last = key;
    const [tex, walk, idle, speed, reach, note] = VISITORS[key];
    const s = this.scene;
    const a = s.add.sprite(-60, BANK_Y, tex, 0).setOrigin(0.5, 1).setScale(BG).setDepth(DEPTH.SHORE_LIFE).play(walk);
    const stop = reach + R(-30, 30);
    const ms = (dx) => (Math.abs(dx) / speed) * 1000;
    s.tweens.chain({
      targets: a,
      tweens: [
        { x: stop, duration: ms(stop + 60), onComplete: () => { a.play(idle); this.note(note); } },
        { x: stop, duration: R(6000, 10000) },
        { x: -80, duration: ms(stop + 80), onStart: () => a.setFlipX(true).play(walk), onComplete: () => a.destroy() },
      ],
    });
  }

  // A few gulls or sparrows crossing the sky, each on its own line.
  gulls() {
    const s = this.scene;
    const anim = Math.random() < 0.6 ? 'gull-fly' : 'sparrow-fly';
    const right = Math.random() < 0.5;
    const y0 = R(60, 300);
    for (let i = 0; i < R(1, 3); i++) {
      const b = s.add.sprite(right ? -40 - i * 50 : W + 40 + i * 50, y0 + R(-30, 30), 'birds').setScale(BG).setDepth(DEPTH.BIRDS).setFlipX(!right);
      b.play({ key: anim, startFrame: i % 6 });
      s.tweens.add({ targets: b, x: right ? W + 80 : -80, y: b.y + R(-60, 40), duration: R(9000, 14000), delay: i * 400, onComplete: () => b.destroy() });
    }
  }

  // Ducks heading south in a ragged V.
  ducks() {
    const s = this.scene;
    const y0 = R(90, 220);
    for (let i = 0; i < 5; i++) {
      const side = i % 2 ? 1 : -1;
      const k = Math.ceil(i / 2);
      const d = s.add.sprite(W + 30 + k * 34, y0 + side * k * 18, 'duck').setScale(BG).setDepth(DEPTH.BIRDS).play({ key: 'duck-fly', startFrame: i % 4 });
      s.tweens.add({ targets: d, x: d.x - W - 260, y: d.y + 40, duration: 11000, onComplete: () => d.destroy() });
    }
  }

  // A bald eagle sweeps across high over the lake.
  eagle() {
    const s = this.scene;
    const e = s.add.sprite(-90, R(80, 180), 'eagle').setScale(BG).setDepth(DEPTH.BIRDS).play('eagle-flap');
    s.tweens.add({ targets: e, x: W + 90, duration: 15000, onComplete: () => e.destroy() });
    s.tweens.add({ targets: e, y: e.y + 50, duration: 3500, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    this.note('A bald eagle circles high over the lake.');
  }

  // A fish clears the water and drops back with a splash.
  jump() {
    const s = this.scene;
    const fish = FISH[R(0, 3)];
    const x = R(60, W - 340);
    const dir = Math.random() < 0.5 ? -1 : 1;
    const f = s.add.sprite(x, SURFACE_Y + 10, `fish-${fish.id}`, 0).setScale(BG).setDepth(DEPTH.SPLASH - 0.5).setFlipX(dir > 0);
    splash(s, x, 0.5);
    s.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 900,
      onUpdate: (tw) => {
        const t = tw.getValue();
        f.x = x + dir * t * 90;
        f.y = SURFACE_Y + 10 - Math.sin(Math.PI * t) * 110;
        f.rotation = dir * (t - 0.5) * 1.6;
      },
      onComplete: () => {
        splash(s, f.x, 0.7);
        f.destroy();
      },
    });
  }
}
