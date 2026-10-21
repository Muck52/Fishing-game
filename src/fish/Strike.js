import { W, BED_Y, DEPTH } from '../core/constants.js';
import { ART } from '../core/Assets.js';
import { bubbles } from '../environment/Effects.js';
import { depthTint } from '../environment/Lake.js';

const R = (a, b) => Phaser.Math.Between(a, b);

// How each species comes to the bait, how it nibbles and how it takes it,
// following what anglers and biologists see in the wild. Every fish keeps
// to the pixel grid: they move, pause, turn and change their tail-beat
// speed, but are never rotated or stretched.
//
//   approach  how it arrives (see approach() below)
//   gap       how far from the bait it hangs while it makes up its mind
//   nibbles   [min, max] fake-out nibbles before the real bite
//   nibble    what a nibble looks like, and what the float does
//   strike    how it finally takes the bait
//   friends   others of its kind that come along (schooling fish)
//   why       the behaviour, in a line, for whoever tunes this next
export const STRIKE = {
  bluegill: { approach: 'dart', gap: 6, nibbles: [2, 4], nibble: 'peck', strike: 'suck', why: 'Darts in bursts, pecks at the bait again and again, then sucks it in.' },
  pumpkinseed: { approach: 'rise', gap: 6, nibbles: [2, 3], nibble: 'peck', strike: 'suck', why: 'Picks at bait like a bluegill, often coming up from below.' },
  perch: { approach: 'school', gap: 8, nibbles: [1, 2], nibble: 'peck', strike: 'snap', friends: 2, why: 'Hunts in loose schools; one snaps at the bait and darts down.' },
  crappie: { approach: 'rise', gap: 8, nibbles: [0, 1], nibble: 'tap', strike: 'lift', why: 'Rises under the bait and swims up with it, so the float lifts and lays flat.' },
  whitebass: { approach: 'chase', gap: 14, nibbles: [1, 2], nibble: 'slash', strike: 'slash', friends: 2, why: 'Packs race through, slashing at baitfish on the run.' },
  carp: { approach: 'bottom', gap: 7, nibbles: [2, 3], nibble: 'mouth', strike: 'slowtake', feeds: true, why: 'Grubs along the bottom in a cloud of silt and bubbles, mouths the bait, then moves off with it.' },
  bass: { approach: 'inspect', gap: 16, nibbles: [1, 2], nibble: 'tap', strike: 'lunge', why: 'Swims up, stops to look it over, edges closer, then hits hard and turns for deep water.' },
  largemouth: { approach: 'ambush', gap: 34, nibbles: [0, 1], nibble: 'creep', strike: 'engulf', why: 'Waits by cover, creeps closer, then flares its gills and engulfs the bait in one gulp.' },
  trout: { approach: 'hold', gap: 12, nibbles: [1, 2], nibble: 'snap', strike: 'snap', why: 'Holds in the current, darts out to snap at food and drops straight back.' },
  rainbow: { approach: 'cruise', gap: 14, nibbles: [1, 1], nibble: 'snap', strike: 'flash', why: 'Cruises in fast, flashes its silver side as it turns on the bait.' },
  channelcat: { approach: 'scent', gap: 6, nibbles: [1, 3], nibble: 'nudge', strike: 'slowtake', why: 'Follows the scent trail in from the bottom, nudges the bait with its whiskers, then swims off with it.' },
  drum: { approach: 'bottom', gap: 6, nibbles: [1, 2], nibble: 'crunch', strike: 'suck', feeds: true, why: 'Roots along the bottom and crunches its food, a rattle of small tugs.' },
  walleye: { approach: 'stalk', gap: 12, nibbles: [0, 1], nibble: 'tap', strike: 'soft', why: 'Shadows the bait out of the deep, then takes it so gently the float barely moves.' },
  catfish: { approach: 'creep', gap: 5, nibbles: [1, 2], nibble: 'mouth', strike: 'suck', why: 'The burbot creeps along the bottom like an eel and inhales its prey.' },
  pike: { approach: 'ambush', gap: 44, nibbles: [0, 0], nibble: 'creep', strike: 'tbone', why: 'Lies motionless in the weeds, then rockets in, grabs the bait crossways and holds it.' },
  muskie: { approach: 'follow', gap: 18, nibbles: [1, 2], nibble: 'follow', strike: 'lunge', why: 'Follows the bait, turns away, circles back and strikes when you least expect it.' },
  golden: { approach: 'bottom', gap: 6, nibbles: [1, 2], nibble: 'mouth', strike: 'slowtake', feeds: true, why: 'Vacuums the bottom, feeling for food with its barbels, then takes the bait slowly and heavily.' },
};

export const strikeOf = (id) => STRIKE[id];

// One fish at the bait, from first sight to the take.
export class Striker {
  constructor(scene, fish, tackle) {
    this.scene = scene;
    this.fish = fish;
    this.tackle = tackle;
    this.p = STRIKE[fish.id];
    this.dip = 0; // what the fish is doing to the float right now
    this.shake = 0;
    this.drift = 0;
    this.holding = false;
    this.half = Math.floor(ART.anchors.fish[fish.id].w / 2);
    this.side = this.tackle.x > 120 || Math.random() < 0.5 ? -1 : 1; // which side of the bait it comes from
    this.sprite = scene.add.sprite(-100, -100, `fish-${fish.id}`).setDepth(DEPTH.FISH).play(`swim-${fish.id}`);
    this.friends = [];
    this.approach();
  }

  // Where it hangs while deciding: `gap` pixels in front of its mouth.
  hover(gap = this.p.gap) {
    return { x: this.tackle.x + this.side * (this.half + gap), y: this.tackle.hookY + 1 };
  }

  face(x) {
    // the art faces left; flipped, it faces right
    this.sprite.setFlipX(x > this.sprite.x);
  }

  tween(cfg) {
    return this.scene.tweens.add({ targets: this.sprite, ...cfg });
  }

  chain(steps) {
    return this.scene.tweens.chain({ targets: this.sprite, tweens: steps });
  }

  pace(k) {
    this.sprite.anims.timeScale = k; // tail beats faster when it hurries
  }

  // ---- arriving (about 2.4 s, before the first nibble can come)
  approach() {
    const s = this.sprite;
    const h = this.hover();
    const fromX = this.side < 0 ? -40 : W + 40;
    const style = this.p.approach;
    this.home = h;
    const settle = () => {
      this.face(this.tackle.x);
      this.pace(0.6);
    };
    if (style === 'dart') {
      // short bursts with pauses between, like a sunfish nosing about
      s.setPosition(fromX, h.y + R(-12, 12));
      const steps = [0.35, 0.65, 0.88, 1].map((k) => ({
        x: s.x + (h.x - s.x) * k, y: h.y + (k < 1 ? R(-5, 5) : 0), duration: 260, ease: 'Quad.easeOut', hold: 280,
        onStart: () => this.pace(2.2), onComplete: () => this.pace(0.7),
      }));
      this.face(h.x);
      this.chain([...steps, { x: h.x, duration: 1, onComplete: settle }]);
    } else if (style === 'rise') {
      // up from below the bait, slowly
      s.setPosition(h.x + R(-6, 6), Math.min(BED_Y - 10, h.y + 90));
      this.face(this.tackle.x);
      this.pace(0.8);
      this.tween({ x: h.x, y: h.y, duration: 2300, ease: 'Sine.easeOut', onComplete: settle });
    } else if (style === 'school' || style === 'chase') {
      const fast = style === 'chase';
      s.setPosition(fromX, h.y + R(-8, 8));
      this.face(h.x);
      this.pace(fast ? 2.5 : 1.2);
      if (fast) {
        // the pack overshoots, wheels round and comes back to the bait
        const past = h.x - this.side * 60;
        this.chain([
          { x: past, y: h.y - 6, duration: 900, ease: 'Quad.easeIn', onComplete: () => this.face(h.x) },
          { x: h.x, y: h.y, duration: 1100, ease: 'Sine.easeOut', onComplete: settle },
        ]);
      } else {
        this.tween({ x: h.x, y: h.y, duration: 2200, ease: 'Sine.easeOut', onComplete: settle });
      }
      for (let i = 0; i < (this.p.friends || 0); i++) this.friends.push(this.friend(fromX, h, i, fast));
    } else if (style === 'bottom' || style === 'creep' || style === 'scent') {
      // along the lakebed, then up to the bait
      s.setPosition(fromX, BED_Y - 8);
      this.face(h.x);
      this.pace(style === 'creep' ? 0.5 : 0.9);
      const wiggle = style === 'scent' ? 14 : 0;
      this.scene.tweens.addCounter({
        from: 0, to: 1, duration: 2300, ease: 'Sine.easeInOut',
        onUpdate: (tw) => {
          const k = tw.getValue();
          // a catfish swings its head side to side, following the scent
          s.x = fromX + (h.x - fromX) * Math.min(1, k * 1.25) + Math.sin(k * 14) * wiggle * (1 - k);
          s.y = (BED_Y - 8) + (h.y - (BED_Y - 8)) * Math.max(0, (k - 0.45) / 0.55);
          if (wiggle) this.face(s.x + (Math.cos(k * 14) > 0 ? 1 : -1) * (h.x - fromX));
        },
        onComplete: settle,
      });
    } else if (style === 'inspect') {
      // up to a cautious distance, a long look, then a little closer
      s.setPosition(fromX, h.y + R(-10, 10));
      this.face(h.x);
      this.pace(1.2);
      const look = this.hover(this.p.gap + 14);
      this.chain([
        { x: look.x, y: look.y, duration: 1400, ease: 'Sine.easeOut', onComplete: () => this.pace(0.4) },
        { x: look.x, duration: 500 },
        { x: h.x, y: h.y, duration: 500, ease: 'Sine.easeInOut', onComplete: settle },
      ]);
    } else if (style === 'ambush') {
      // already there, still as a log by the weeds or the posts; it only
      // drifts a pixel or two until it goes
      s.setPosition(h.x, h.y + R(-4, 4));
      this.face(this.tackle.x);
      this.pace(0.25);
      s.setAlpha(0);
      this.tween({ alpha: 1, duration: 900 });
    } else if (style === 'hold') {
      // a trout holds station facing the flow, slipping back and forth
      s.setPosition(h.x, h.y - 20);
      this.face(this.tackle.x);
      this.pace(1.1);
      s.setAlpha(0);
      this.tween({ alpha: 1, y: h.y, duration: 1600, ease: 'Sine.easeOut', onComplete: settle });
    } else if (style === 'cruise') {
      s.setPosition(fromX, h.y + R(-20, 20));
      this.face(h.x);
      this.pace(1.8);
      this.tween({ x: h.x, y: h.y, duration: 1500, ease: 'Cubic.easeOut', onComplete: settle });
    } else if (style === 'stalk') {
      // shadows the bait up out of the deep, slow and steady
      s.setPosition(h.x + this.side * 40, Math.min(BED_Y - 12, h.y + 60));
      this.face(this.tackle.x);
      this.pace(0.5);
      this.tween({ x: h.x, y: h.y, duration: 2300, ease: 'Sine.easeInOut', onComplete: settle });
    } else if (style === 'follow') {
      // the muskie's follow: in behind the bait, then a slow figure eight
      s.setPosition(fromX, h.y + 10);
      this.face(h.x);
      this.pace(1);
      this.tween({ x: h.x, y: h.y, duration: 2200, ease: 'Sine.easeOut', onComplete: settle });
    }
    s.setTint(depthTint(h.y));
  }

  // A companion from the school, which never takes the bait.
  friend(fromX, h, i, fast) {
    const f = this.scene.add.sprite(fromX, h.y + (i ? 10 : -10), `fish-${this.fish.id}`).setDepth(DEPTH.FISH - 0.1).play(`swim-${this.fish.id}`).setTint(depthTint(h.y));
    f.setFlipX(h.x > fromX);
    f.anims.timeScale = fast ? 2.5 : 1.2;
    const to = { x: h.x + this.side * (24 + i * 16), y: h.y + (i ? 12 : -12) };
    this.scene.tweens.add({ targets: f, x: fast ? h.x - this.side * 90 : to.x, y: to.y, duration: fast ? 1300 : 2400, delay: i * 200, ease: 'Sine.easeOut' });
    return f;
  }

  scatter() {
    for (const f of this.friends) {
      const dir = f.x < this.tackle.x ? -1 : 1;
      f.setFlipX(dir > 0).anims.timeScale = 3;
      this.scene.tweens.add({ targets: f, x: f.x + dir * 260, y: f.y + R(-30, 30), duration: 900, ease: 'Quad.easeIn', onComplete: () => f.destroy() });
    }
    this.friends = [];
  }

  // ---- waiting at the bait: small living movements, per species
  update(time) {
    const s = this.sprite;
    if (!s.active || this.holding || this.scene.tweens.isTweening(s)) return;
    const h = this.home;
    const a = this.p.approach;
    let dx = 0;
    let dy = Math.round(Math.sin(time / 700));
    if (a === 'hold') dx = Math.round(Math.sin(time / 500) * 2); // slipping in the current
    if (a === 'ambush') dy = Math.round(Math.sin(time / 1600) * 0.6); // hardly moving at all
    if (a === 'follow') {
      // a lazy figure eight around the bait
      dx = Math.round(Math.sin(time / 900) * 16);
      dy = Math.round(Math.sin(time / 450) * 6);
      this.face(s.x + (Math.cos(time / 900) > 0 ? 1 : -1));
    }
    if (a === 'school' || a === 'chase') dx = Math.round(Math.sin(time / 600) * 3);
    s.setPosition(h.x + dx, h.y + dy);
    if (this.p.feeds && Math.random() < 0.02) bubbles(this.scene, s.x, s.y - 2, 1);
  }

  // ---- a fake-out nibble. Returns how long it lasts (ms).
  nibble() {
    const s = this.sprite;
    const toBait = this.tackle.x - this.mouthX();
    const kind = this.p.nibble;
    this.scene.tweens.killTweensOf(s);
    if (kind === 'peck') {
      // two quick pecks
      this.chain([
        { x: s.x + toBait, duration: 80, yoyo: true },
        { x: s.x + toBait, duration: 80, yoyo: true, delay: 60 },
      ]);
      this.floatFor(2, 1, 400);
      return 420;
    }
    if (kind === 'tap') {
      this.tween({ x: s.x + toBait, duration: 120, yoyo: true });
      this.floatFor(1, 0, 260);
      return 280;
    }
    if (kind === 'slash') {
      // tears past the bait and away, turning for another go
      const past = s.x + toBait * 2.5;
      this.pace(3);
      this.chain([
        { x: past, duration: 260, ease: 'Quad.easeIn', onComplete: () => this.face(this.home.x) },
        { x: this.home.x, duration: 600, ease: 'Sine.easeOut', onComplete: () => { this.face(this.tackle.x); this.pace(0.8); } },
      ]);
      this.floatFor(3, 1, 300);
      return 320;
    }
    if (kind === 'mouth') {
      // lips the bait for a long moment: the float trembles
      this.tween({ x: s.x + toBait, duration: 300, hold: 400, yoyo: true });
      this.floatFor(1, 1, 900);
      if (this.p.feeds) this.puff();
      return 900;
    }
    if (kind === 'nudge') {
      this.tween({ x: s.x + toBait, y: s.y - 2, duration: 350, yoyo: true, ease: 'Sine.easeInOut' });
      this.floatFor(2, 0, 700);
      return 700;
    }
    if (kind === 'crunch') {
      // a rattle of small tugs as it crushes the bait
      this.tween({ x: s.x + toBait, duration: 60, yoyo: true, repeat: 2 });
      this.floatFor(2, 2, 420);
      this.puff();
      return 420;
    }
    if (kind === 'snap') {
      this.tween({ x: s.x + toBait, duration: 70, yoyo: true, hold: 40 });
      this.floatFor(3, 0, 220);
      return 240;
    }
    if (kind === 'creep') {
      // edges a few pixels nearer, nothing more; the float never moves
      this.home = { x: s.x + Math.sign(toBait) * 4, y: this.home.y };
      this.tween({ x: this.home.x, duration: 600, ease: 'Sine.easeInOut' });
      return 600;
    }
    if (kind === 'follow') {
      // noses right up to the bait, then turns away
      this.tween({ x: s.x + toBait * 0.8, duration: 300, yoyo: true, hold: 300, onYoyo: () => this.face(this.home.x) });
      return 700;
    }
    return 300;
  }

  floatFor(dip, shake, ms) {
    this.dip = dip;
    this.shake = shake;
    this.scene.time.delayedCall(ms, () => {
      if (!this.holding) {
        this.dip = 0;
        this.shake = 0;
      }
    });
  }

  // ---- the real thing
  strike() {
    const s = this.sprite;
    const sc = this.scene;
    sc.tweens.killTweensOf(s);
    this.face(this.tackle.x);
    const onBait = () => ({ x: this.tackle.x - (s.flipX ? this.half : -this.half), y: this.tackle.hookY - 1 });
    const kind = this.p.strike;
    this.holding = true;
    const take = onBait();
    if (kind === 'suck') {
      // a short dart and the bait is gone: inhaled
      this.tween({ x: take.x, y: take.y, duration: 110, ease: 'Quad.easeOut' });
      this.dip = 7;
    } else if (kind === 'snap') {
      // snaps it and darts down with it
      this.pace(2.5);
      this.chain([{ x: take.x, y: take.y, duration: 80 }, { y: take.y + 6, duration: 200, ease: 'Quad.easeOut' }]);
      this.dip = 9;
      this.scatter();
    } else if (kind === 'lift') {
      // takes it from below and swims up: the float rises instead of sinking
      this.chain([{ x: take.x, y: take.y, duration: 200 }, { y: take.y - 5, duration: 500, ease: 'Sine.easeOut' }]);
      this.dip = -4;
    } else if (kind === 'slash') {
      this.pace(3);
      this.tween({ x: take.x, y: take.y, duration: 90, ease: 'Quad.easeIn' });
      this.dip = 9;
      this.shake = 1;
      this.scatter();
    } else if (kind === 'slowtake') {
      // mouths it, then moves off with it, the float sliding and sinking
      this.chain([{ x: take.x, y: take.y, duration: 400, ease: 'Sine.easeOut' }]);
      this.dip = 3;
      this.drift = -this.side * 10; // px/s, away from where it came
      sc.tweens.add({ targets: this, dip: 11, duration: 900 });
      this.puff();
    } else if (kind === 'lunge') {
      // from a few lengths off, all at once
      this.pace(3);
      this.tween({ x: take.x, y: take.y, duration: 120, ease: 'Expo.easeIn' });
      this.dip = 11;
      this.shake = 1;
      bubbles(sc, take.x, take.y, 3);
    } else if (kind === 'engulf') {
      // the largemouth's gulp: explosive, with a burst of water and bubbles
      this.pace(3.5);
      this.tween({ x: take.x, y: take.y, duration: 140, ease: 'Expo.easeIn', onComplete: () => bubbles(sc, take.x, take.y, 6) });
      this.dip = 13;
      this.shake = 2;
    } else if (kind === 'tbone') {
      // a pike rockets in, seizes the bait crossways and holds still to turn it
      this.pace(4);
      this.chain([
        { x: take.x, y: take.y + 2, duration: 100, ease: 'Expo.easeIn', onComplete: () => { this.pace(0.2); bubbles(sc, take.x, take.y, 4); } },
        { x: take.x, duration: 500 },
      ]);
      this.dip = 12;
      this.shake = 2;
    } else if (kind === 'soft') {
      // so gentle the float only slides away, barely dipping
      this.tween({ x: take.x, y: take.y, duration: 300, ease: 'Sine.easeOut' });
      this.dip = 3;
      this.drift = -this.side * 6;
    } else if (kind === 'flash') {
      // rolls on the bait: a flash of silver as its side catches the light
      this.pace(3);
      this.tween({ x: take.x, y: take.y, duration: 100, ease: 'Quad.easeIn' });
      s.setTintFill(0xf0fbff);
      sc.time.delayedCall(90, () => s.active && s.setTint(depthTint(s.y)));
      this.dip = 10;
    }
  }

  // Following the float while the fish has the bait: the slow takers drag
  // it along the surface.
  hold(dt) {
    if (!this.drift) return;
    const dx = this.drift * dt;
    this.tackle.x += dx;
    this.sprite.x += dx;
    this.sprite.setFlipX(this.drift > 0);
  }

  // Silt kicked up by a bottom feeder.
  puff() {
    const s = this.sprite;
    const e = this.scene.add.particles(s.x, s.y + 3, 'mote', {
      emitting: false, lifespan: { min: 600, max: 1100 }, speed: { min: 4, max: 14 }, angle: { min: 180, max: 360 },
      scale: { min: 1, max: 2 }, alpha: { start: 0.7, end: 0 }, tint: 0x8a7a58,
    }).setDepth(DEPTH.FISH + 0.1);
    e.explode(10);
    this.scene.time.delayedCall(1200, () => e.destroy());
  }

  mouthX() {
    const s = this.sprite;
    return s.x + (s.flipX ? this.half : -this.half);
  }

  hooked() {
    this.holding = true;
    this.drift = 0;
    this.scene.tweens.killTweensOf(this.sprite);
    this.scatter();
  }

  // It got away: off it goes, and the school with it.
  flee() {
    const s = this.sprite;
    this.scatter();
    if (!s.active) return;
    this.scene.tweens.killTweensOf(s);
    const dir = s.flipX ? -1 : 1;
    s.setFlipX(dir > 0).anims.timeScale = 3;
    bubbles(this.scene, s.x, s.y, 3);
    this.scene.tweens.add({ targets: s, x: s.x + dir * 350, y: Math.min(BED_Y - 10, s.y + R(-20, 40)), duration: 900, ease: 'Quad.easeIn', onComplete: () => s.destroy() });
  }

  destroy() {
    for (const f of this.friends) f.destroy();
    this.friends = [];
    if (this.sprite.active) this.sprite.destroy();
  }
}
