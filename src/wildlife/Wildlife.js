// The animals of the lake. Birds cross the sky, now and then come down to
// rest (a gull or the eagle on the sand, a sparrow on a cattail, a pair of
// mallards paddling the shallows), a loon fishes the shallows and fish leap;
// every so often a doe or buck, fox, hare or bear comes down to the bank, and
// gets a field note.
import { W, SURFACE_Y, DEPTH } from '../core/constants.js';
import { FISH } from '../../data/fish/fish.js';
import { splash } from '../environment/Effects.js';
import { ART } from '../core/Assets.js';

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

// Who comes down to the bank. All the animals are drawn facing left (see
// tools/characters) and turned to face the way they travel. Each moves only
// when its walk cycle advances a frame, by that frame's step, taken from
// its gait when it was drawn, so its feet stay put on the ground instead of
// sliding. The hare covers ground only in the air.
// They come through the cattails along the left of the shore and stop on
// the open sand beyond them (reach), where they can be seen.
const VISITORS = {
  deer: { reach: 150, note: 'A white-tailed doe steps down to the water to drink.' },
  buck: { reach: 150, note: 'A white-tailed buck lowers his antlers to drink.' },
  fox: { reach: 142, note: 'A red fox trots along the bank, nose to the ground.' },
  hare: { reach: 128, note: 'A snowshoe hare stops to nibble clover by the water.' },
  bear: { reach: 146, note: 'A black bear ambles out of the pines. Best keep your distance.' },
};
// how far a creature moves on frame i of its walk
const stepOf = (key, i) => {
  const w = ART.anchors.creatures[key].walk;
  return w.steps ? w.steps[i] : w.step;
};

export class Wildlife {
  constructor(scene, onNote = () => {}) {
    this.scene = scene;
    this.note = onNote;
    const now = scene.time.now;
    this.next = { visitor: now + 4000, birds: now + 1500, jump: now + 6000, eagle: now + 9000, loon: now + 20000, rest: now + 12000 };
    this.sand = null; // who's on the open sand, so two don't stand in one spot
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
    if (time > n.rest) {
      this.rest();
      n.rest = time + R(20000, 35000);
    }
    if (time > n.loon) {
      this.loon();
      n.loon = time + R(45000, 75000);
    }
  }

  // An animal walks in from the left edge of the bank, stops at the water
  // for a while, then turns round and goes back into the trees. It moves
  // only when its walk cycle advances a frame, by that frame's step.
  visit(key = null) {
    if (this.sand) return; // a bird is resting there; come back later
    const keys = Object.keys(VISITORS).filter((k) => k !== this.last && (k !== 'bear' || Math.random() < 0.4));
    key = key || keys[R(0, keys.length - 1)];
    this.last = key;
    const v = VISITORS[key];
    const s = this.scene;
    const walk = `${key}-walk`;
    this.sand = 'visitor';
    const a = s.add.sprite(-30, BANK_Y, key, 0).setOrigin(0.5, 1).setDepth(DEPTH.SHORE_LIFE);
    // a soft shadow on the sand under it, going where it goes
    const shadow = s.add.ellipse(a.x, BANK_Y - 1, Math.round(a.width * 0.7), 3, 0x2a2418, 0.35).setDepth(DEPTH.SHORE_LIFE - 0.1);
    a.on('destroy', () => shadow.destroy());
    const stop = v.reach + R(-12, 12);
    let dir = 1; // walking right, so turned to face right
    a.setFlipX(true).play(walk);
    const stand = () => a.play(`${key}-idle`);
    a.on('animationupdate', (anim, frame) => {
      if (anim.key !== walk) return;
      a.x += dir * stepOf(key, frame.index - 1);
      shadow.x = a.x;
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
          a.setFlipX(false).play(walk);
        });
      } else if (dir < 0 && a.x < -40) {
        // gone into the trees; removed on the next tick, as removing a
        // sprite inside its own animation event breaks Phaser
        dir = 0;
        a.anims.stop();
        s.time.delayedCall(0, () => a.destroy());
        this.sand = null;
      }
    });
  }

  // A few gulls or sparrows crossing the sky, each on its own line.
  gulls() {
    const s = this.scene;
    const gull = Math.random() < 0.6;
    const right = Math.random() < 0.5;
    const y0 = R(30, 150);
    for (let i = 0; i < R(1, 3); i++) {
      const b = s.add.sprite(right ? -20 - i * 25 : W + 20 + i * 25, y0 + R(-15, 15), gull ? 'gull' : 'sparrow').setDepth(DEPTH.BIRDS).setFlipX(right);
      // gulls beat and glide; sparrows fly in bounds, built into their cycle
      if (gull) flapAndGlide(s, b, 'gull-fly', ART.anchors.creatures.gull.glide.frames[0]);
      else b.play({ key: 'sparrow-fly', startFrame: i * 3 });
      s.tweens.add({ targets: b, x: right ? W + 40 : -40, y: b.y + R(-30, 20), duration: R(9000, 14000), delay: i * 400, onComplete: () => b.destroy() });
    }
  }

  // Mallards heading south in a ragged V, drakes and hens.
  ducks() {
    const s = this.scene;
    const y0 = R(45, 110);
    for (let i = 0; i < 5; i++) {
      const side = i % 2 ? 1 : -1;
      const k = Math.ceil(i / 2);
      const d = s.add.sprite(W + 15 + k * 21, y0 + side * k * 11, 'mallard').setDepth(DEPTH.BIRDS).play({ key: i % 2 ? 'mallard-hen' : 'mallard-fly', startFrame: i % 4 });
      s.tweens.add({ targets: d, x: d.x - W - 130, y: d.y + 20, duration: 11000, onComplete: () => d.destroy() });
    }
  }

  // A bald eagle sweeps across high over the lake.
  eagle() {
    const s = this.scene;
    const e = s.add.sprite(-45, R(40, 90), 'eagle').setDepth(DEPTH.BIRDS).setFlipX(true);
    flapAndGlide(s, e, 'eagle-fly', ART.anchors.creatures.eagle.glide.frames[0], 2500);
    s.tweens.add({ targets: e, x: W + 45, duration: 15000, onComplete: () => e.destroy() });
    s.tweens.add({ targets: e, y: e.y + 25, duration: 3500, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    this.note('A bald eagle circles high over the lake.');
  }

  // A bird comes down to rest for a while.
  rest() {
    const pick = ['gull', 'gull', 'sparrow', 'sparrow', 'ducks', 'eagle'];
    const k = pick[R(0, pick.length - 1)];
    if ((k === 'gull' || k === 'eagle') && this.sand) return this.perch();
    ({ gull: () => this.land('gull'), eagle: () => this.land('eagle'), sparrow: () => this.perch(), ducks: () => this.paddle() })[k]();
  }

  // A gull (or the eagle) glides down from the right onto the open sand,
  // stands a while with a shadow under it, then beats off over the lake.
  land(key) {
    const s = this.scene;
    const big = key === 'eagle';
    const stand = big ? 'eagle-perch' : 'gull-stand';
    const glide = ART.anchors.creatures[key].glide.frames[0];
    const x = R(140, 176);
    this.sand = key;
    const b = s.add.sprite(W + 30, R(150, 200), key, glide).setDepth(DEPTH.SHORE_LIFE + 0.1);
    s.tweens.add({
      targets: b, x, y: BANK_Y - 10, duration: big ? 6500 : 5000, ease: 'Sine.easeOut',
      onComplete: () => {
        // feet down on the sand
        b.setTexture(stand).setOrigin(0.5, 1).setPosition(x, BANK_Y + (big ? 2 : 0));
        const shadow = s.add.ellipse(x, BANK_Y - 1, Math.max(4, Math.round(b.width * 0.8)), 2, 0x2a2418, 0.35).setDepth(DEPTH.SHORE_LIFE);
        this.note(big ? 'The bald eagle lands on the shore to watch the water.' : 'A gull drops onto the sand and settles.');
        // now and then it turns to look the other way
        const look = s.time.addEvent({ delay: R(2500, 4000), loop: true, callback: () => b.setFlipX(!b.flipX) });
        s.time.delayedCall(R(9000, 16000), () => {
          look.remove();
          shadow.destroy();
          this.sand = null;
          b.setTexture(key).setOrigin(0.5, 0.5).setFlipX(false).setPosition(x, BANK_Y - 10).play(`${key}-fly`);
          s.tweens.add({ targets: b, x: -50, y: R(40, 120), duration: big ? 9000 : 7000, ease: 'Sine.easeIn', onComplete: () => b.destroy() });
        });
      },
    });
  }

  // A sparrow flits in to a cattail head, perches, then flits away.
  perch() {
    const s = this.scene;
    const top = { x: 33, y: SURFACE_Y + 6 - 52 + 19 }; // the tallest cattail's head (shore-reeds)
    const b = s.add.sprite(-15, top.y - 40, 'sparrow').setDepth(DEPTH.REEDS + 0.1).setFlipX(true).play('sparrow-fly');
    s.tweens.add({
      targets: b, x: top.x, y: top.y - 5, duration: 2200, ease: 'Sine.easeOut',
      onComplete: () => {
        b.anims.stop();
        b.setTexture('sparrow-perch').setOrigin(0.5, 1).setPosition(top.x, top.y + 1);
        this.note('A song sparrow perches on a cattail.');
        // a little bob now and then, as sparrows do
        const bob = s.time.addEvent({ delay: R(1200, 2200), loop: true, callback: () => { b.y = top.y + 2; s.time.delayedCall(150, () => (b.y = top.y + 1)); } });
        s.time.delayedCall(R(7000, 12000), () => {
          bob.remove();
          b.setTexture('sparrow').setOrigin(0.5, 0.5).play('sparrow-fly');
          s.tweens.add({ targets: b, x: W + 20, y: R(60, 140), duration: 6000, onComplete: () => b.destroy() });
        });
      },
    });
  }

  // A drake and his hen paddle in along the shallows, dabble a while, and
  // paddle back out.
  paddle() {
    const s = this.scene;
    const top = SURFACE_Y + 8 - ART.anchors.creatures['mallard-swim'].drake.waterline;
    const stop = R(70, 110);
    const pair = [['drake', 0], ['hen', 1]].map(([who, i]) => {
      const d = s.add.sprite(-25 - i * 20, top, 'mallard-swim', ART.anchors.creatures['mallard-swim'][who].frames[0])
        .setOrigin(0.5, 0).setDepth(DEPTH.SURFACE + 0.1).setFlipX(true);
      d.bob = s.tweens.add({ targets: d, y: top + 1, duration: 1200 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      s.tweens.add({ targets: d, x: stop - i * 18, duration: 14000, ease: 'Sine.easeOut' });
      return d;
    });
    this.note('A pair of mallards paddles along the shallows.');
    s.time.delayedCall(R(24000, 32000), () => {
      pair.forEach((d, i) => {
        d.setFlipX(false);
        s.tweens.add({ targets: d, x: -30 - i * 10, duration: 12000, ease: 'Sine.easeIn', onComplete: () => { d.bob.remove(); d.destroy(); } });
      });
    });
  }

  // A common loon swims in low on the water, dives, comes up further on,
  // and dives again out of sight.
  loon() {
    const s = this.scene;
    const t = ART.anchors.creatures.loon;
    const top = SURFACE_Y + 8 - t.swim.waterline; // its waterline on the surface
    const b = s.add.sprite(-25, top, 'loon', t.swim.frames[0]).setOrigin(0.5, 0).setDepth(DEPTH.SURFACE + 0.1).setFlipX(true);
    const bob = s.tweens.add({ targets: b, y: top + 1, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const dive = (then) => {
      bob.pause();
      b.setFrame(t.dive.frames[0]);
      s.tweens.add({ targets: b, y: top + 8, alpha: 0, duration: 700, ease: 'Quad.easeIn', onComplete: then });
      s.time.delayedCall(350, () => b.active && splash(s, b.x, 0.3));
    };
    const surface = (x) => {
      b.setPosition(x, top + 4).setFrame(t.swim.frames[0]).setAlpha(0);
      s.tweens.add({ targets: b, y: top, alpha: 1, duration: 500, onComplete: () => bob.resume() });
    };
    s.tweens.add({
      targets: b, x: R(60, 110), duration: 12000,
      onComplete: () => dive(() => s.time.delayedCall(R(4000, 7000), () => {
        if (!b.active) return;
        surface(b.x + R(30, 60));
        s.tweens.add({ targets: b, x: b.x + 20, duration: 6000, delay: 500,
          onComplete: () => dive(() => { bob.remove(); b.destroy(); }) });
      })),
    });
    this.note('A common loon fishes the shallows, then slips under.');
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
