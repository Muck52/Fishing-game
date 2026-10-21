// The animals of the lake. Birds cross the sky and fish leap now and then;
// every so often a deer, fox, rabbit or bear comes down to the bank, and
// gets a field note.
import { W, SURFACE_Y, DEPTH } from '../core/constants.js';
import { FISH } from '../../data/fish/fish.js';
import { splash } from '../environment/Effects.js';

const R = (a, b) => Phaser.Math.Between(a, b);

// Big birds don't flap all the time: a few wingbeats, then a glide on
// outstretched wings, then a few more. `glide` is the wings-level frame.
function flapAndGlide(scene, bird, anim, glide, glideMs = 900) {
  const flap = () => {
    if (!bird.active) return;
    bird.play(anim, true);
    scene.time.delayedCall(R(500, 1400), () => {
      if (!bird.active) return;
      bird.anims.stop();
      bird.setFrame(glide);
      scene.time.delayedCall(R(glideMs * 0.6, glideMs * 1.4), flap);
    });
  };
  flap();
}
const BANK_Y = SURFACE_Y - 4; // where the far bank meets the water

// How each visitor moves. All the animal sheets face left. `step` is how
// far the body travels on each frame of the walk cycle, measured from the
// sheets by following a planted foot from frame to frame, so the feet stay
// put on the ground instead of sliding. The hare covers ground only in the
// air and barely moves on landing. The bear has no idle cycle, so it
// stands on one planted frame (`rest`) while it looks around.
const VISITORS = {
  deer: { walk: 'deer-walk', idle: 'deer-idle', step: [5, 5, 5, 5, 5, 5, 6, 5], reach: 125, note: 'A white-tailed doe steps down to the water to drink.' },
  fox: { walk: 'fox-walk', idle: 'fox-idle', step: [3, 4, 4, 3, 3, 4, 4, 3], reach: 100, note: 'A red fox trots along the bank, nose to the ground.' },
  rabbit: { walk: 'rabbit-hop', idle: 'rabbit-idle', step: [5, 6, 6, 4, 1, 5, 6, 6, 4, 1], reach: 75, note: 'A snowshoe hare stops to nibble clover by the water.' },
  bear: { walk: 'bear-walk', rest: 0, step: [4, 5, 3, 4, 5, 3, 4, 3], reach: 85, note: 'A black bear ambles out of the pines. Best keep your distance.' },
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
  // for a while, then turns round and goes back into the trees. It moves
  // only when its walk cycle advances a frame, by that frame's step.
  visit(key = null) {
    const keys = Object.keys(VISITORS).filter((k) => k !== this.last && (k !== 'bear' || Math.random() < 0.4));
    key = key || keys[R(0, keys.length - 1)];
    this.last = key;
    const v = VISITORS[key];
    const s = this.scene;
    const a = s.add.sprite(-30, BANK_Y, v.walk, 0).setOrigin(0.5, 1).setDepth(DEPTH.SHORE_LIFE);
    const stop = v.reach + R(-15, 15);
    let dir = 1; // walking right, so turned to face right
    a.setFlipX(true).play(v.walk);
    const stand = () => (v.idle ? a.play(v.idle) : a.stop().setFrame(v.rest));
    a.on('animationupdate', (anim, frame) => {
      if (anim.key !== v.walk) return;
      a.x += dir * v.step[frame.index - 1];
      if (dir > 0 && a.x >= stop) {
        dir = 0;
        // switching animation inside its own frame event confuses Phaser,
        // so stand still on the next tick
        s.time.delayedCall(0, () => a.scene && stand());
        this.note(v.note);
        s.time.delayedCall(R(6000, 10000), () => {
          if (!a.scene) return;
          // turn round, then set off back the way it came
          dir = -1;
          a.setFlipX(false).play(v.walk);
        });
      } else if (dir < 0 && a.x < -40) {
        // gone into the trees; removed on the next tick, as removing a
        // sprite inside its own animation event breaks Phaser
        dir = 0;
        a.anims.stop();
        s.time.delayedCall(0, () => a.destroy());
      }
    });
  }

  // A few gulls or sparrows crossing the sky, each on its own line.
  gulls() {
    const s = this.scene;
    const anim = Math.random() < 0.6 ? 'gull-fly' : 'sparrow-fly';
    const right = Math.random() < 0.5;
    const y0 = R(30, 150);
    for (let i = 0; i < R(1, 3); i++) {
      const b = s.add.sprite(right ? -20 - i * 25 : W + 20 + i * 25, y0 + R(-15, 15), 'birds').setDepth(DEPTH.BIRDS).setFlipX(right);
      flapAndGlide(s, b, anim, anim === 'gull-fly' ? 4 : 10);
      s.tweens.add({ targets: b, x: right ? W + 40 : -40, y: b.y + R(-30, 20), duration: R(9000, 14000), delay: i * 400, onComplete: () => b.destroy() });
    }
  }

  // Ducks heading south in a ragged V.
  ducks() {
    const s = this.scene;
    const y0 = R(45, 110);
    for (let i = 0; i < 5; i++) {
      const side = i % 2 ? 1 : -1;
      const k = Math.ceil(i / 2);
      const d = s.add.sprite(W + 15 + k * 17, y0 + side * k * 9, 'duck').setDepth(DEPTH.BIRDS).play({ key: 'duck-fly', startFrame: i % 4 });
      s.tweens.add({ targets: d, x: d.x - W - 130, y: d.y + 20, duration: 11000, onComplete: () => d.destroy() });
    }
  }

  // A bald eagle sweeps across high over the lake.
  eagle() {
    const s = this.scene;
    const e = s.add.sprite(-45, R(40, 90), 'eagle').setDepth(DEPTH.BIRDS);
    flapAndGlide(s, e, 'eagle-flap', 0, 2500);
    s.tweens.add({ targets: e, x: W + 45, duration: 15000, onComplete: () => e.destroy() });
    s.tweens.add({ targets: e, y: e.y + 25, duration: 3500, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    this.note('A bald eagle circles high over the lake.');
  }

  // A fish clears the water and drops back with a splash.
  jump() {
    const s = this.scene;
    const fish = FISH[R(0, 3)];
    const x = R(70, W - 170);
    const dir = Math.random() < 0.5 ? -1 : 1;
    const f = s.add.sprite(x, SURFACE_Y + 5, `fish-${fish.id}`, 0).setDepth(DEPTH.SPLASH - 0.5).setFlipX(dir > 0);
    splash(s, x, 0.5);
    s.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 900,
      onUpdate: (tw) => {
        const t = tw.getValue();
        f.x = x + dir * t * 45;
        f.y = SURFACE_Y + 5 - Math.sin(Math.PI * t) * 55;
        f.setFrame(Math.floor(t * 12) % 6); // flexing in the air
      },
      onComplete: () => {
        splash(s, f.x, 0.7);
        f.destroy();
      },
    });
  }
}
