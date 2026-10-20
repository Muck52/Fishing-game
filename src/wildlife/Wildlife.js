// The animals of Loon Lake. Some are always about (eagle, loon, heron,
// dragonflies); others pass through now and then and get a field note.
import { W, PX, AH, HORIZON, DOCK_AY, DEPTH, pxScale } from '../core/constants.js';
import { SNAG } from '../art/SceneryArt.js';
import { splash, ripple } from '../environment/Effects.js';

const between = (a, b) => Phaser.Math.Between(a, b);

export class Wildlife {
  constructor(scene, onNote = () => {}) {
    this.scene = scene;
    this.note = onNote;
    this.eagle = new Eagle(this);
    this.loon = new Loon(this);
    this.heron = new Heron(this);
    this.dragonflies = [new Dragonfly(this, 46, AH - 150), new Dragonfly(this, 210, AH - 112)];
    this.nextVisitor = scene.time.now + 5000;
    this.nextJump = scene.time.now + 3000;
    this.lastVisitor = null;
  }

  update(time, dt) {
    if (time > this.nextVisitor) {
      this.visit();
      this.nextVisitor = time + between(16000, 28000);
    }
    if (time > this.nextJump) {
      fishJump(this.scene);
      this.nextJump = time + between(5000, 12000);
    }
    this.eagle.update(time);
    this.loon.update(time, dt);
    this.heron.update(time);
  }

  visit() {
    const visitors = {
      deer: () => shoreWalker(this, 'deer', 'deer-walk', 2, 5, 'A white-tailed doe steps down to the water to drink.'),
      moose: () => shoreWalker(this, 'moose', 'moose-walk', 1, 3, 'A bull moose wades out of the spruce.'),
      geese: () => geese(this),
      beaver: () => beaver(this),
    };
    const keys = Object.keys(visitors).filter((k) => k !== this.lastVisitor);
    const pick = keys[between(0, keys.length - 1)];
    this.lastVisitor = pick;
    visitors[pick]();
  }
}

// Deer and moose walk in along the far shore, stop, then move on.
function shoreWalker(w, key, walkAnim, stillFrame, speed, note) {
  const s = w.scene;
  const fromLeft = Math.random() < 0.5;
  const startX = fromLeft ? -80 : W + 80;
  const stopX = between(140, W - 140);
  const endX = fromLeft ? W + 80 : -80;
  const spr = s.add.sprite(startX, (HORIZON - 1) * PX, key, 0).setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.SHORE);
  spr.setFlipX(!fromLeft).play(walkAnim);
  const time = (dx) => (Math.abs(dx) / (speed * PX)) * 1000;
  s.tweens.chain({
    targets: spr,
    tweens: [
      {
        x: stopX,
        duration: time(stopX - startX),
        onComplete: () => {
          spr.stop();
          spr.setFrame(stillFrame);
          w.note(note);
        },
      },
      { x: stopX, duration: between(6000, 10000) },
      { x: endX, duration: time(endX - stopX), onStart: () => spr.play(walkAnim) },
    ],
    onComplete: () => spr.destroy(),
  });
}

function geese(w) {
  const s = w.scene;
  const n = between(5, 8);
  const y0 = between(40, 95) * PX;
  w.note('Geese overhead, heading south.');
  for (let i = 0; i < n; i++) {
    const k = Math.ceil(i / 2);
    const side = i % 2 ? 1 : -1;
    const bird = s.add.sprite(W + 30 + k * 10 * PX, y0 + side * k * 4 * PX, 'bird').setScale(PX).setDepth(DEPTH.CLOUDS);
    bird.play({ key: 'bird-flap', startFrame: i % 2, frameRate: 5 + (i % 3) });
    s.tweens.add({ targets: bird, x: bird.x - W - 400, duration: 24000, onComplete: () => bird.destroy() });
  }
}

function beaver(w) {
  const s = w.scene;
  const y = between(HORIZON + 30, HORIZON + 80) * PX;
  const fromRight = Math.random() < 0.6;
  const startX = fromRight ? W + 40 : -40;
  const endX = fromRight ? -120 : W + 120;
  const scale = pxScale(y);
  const body = s.add.sprite(startX, y, 'beaver').setScale(scale).setDepth(DEPTH.WATER_LIFE).setFlipX(!fromRight);
  const wake = s.add.image(startX, y + scale, 'wake').setOrigin(fromRight ? 0 : 1, 0.5).setScale(scale).setDepth(DEPTH.WATER_LIFE).setFlipX(!fromRight);
  w.note('A beaver tows a fresh-cut aspen branch home.');
  s.tweens.add({
    targets: [body, wake],
    x: endX,
    duration: 30000,
    onUpdate: () => {
      body.y = y + Math.round(Math.sin(s.time.now / 400)) * scale;
    },
    onComplete: () => {
      body.destroy();
      wake.destroy();
    },
  });
}

function fishJump(s) {
  const x = between(30, 200) * PX;
  const y = between(HORIZON + 12, DOCK_AY - 50) * PX;
  const scale = pxScale(y);
  const dir = Math.random() < 0.5 ? 1 : -1;
  const fish = s.add.sprite(x, y, 'jumpfish').setScale(scale).setDepth(DEPTH.WATER_LIFE).setFlipX(dir < 0);
  splash(s, x, y, 0.4);
  s.tweens.addCounter({
    from: 0,
    to: 1,
    duration: 650,
    onUpdate: (tw) => {
      const t = tw.getValue();
      fish.x = x + dir * t * 12 * scale;
      fish.y = y - Math.sin(Math.PI * t) * 12 * scale;
      fish.angle = dir * (-50 + 100 * t);
    },
    onComplete: () => {
      splash(s, fish.x, y, 0.6);
      fish.destroy();
    },
  });
}

// Bald eagle: sits on the dead snag, sometimes rides the air over the lake.
class Eagle {
  constructor(w) {
    this.w = w;
    this.s = w.scene;
    this.perch = { x: (SNAG.x + 1) * PX, y: SNAG.top * PX + PX };
    this.spr = this.s.add.sprite(this.perch.x, this.perch.y, 'eagle-perch').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.FOREST + 0.5);
    this.flying = false;
    this.nextFlight = this.s.time.now + between(15000, 30000);
  }

  update(time) {
    if (!this.flying && time > this.nextFlight) this.fly();
  }

  fly() {
    const s = this.s;
    this.flying = true;
    this.w.note('The eagle leaves its snag to ride the morning air.');
    this.spr.setTexture('eagle-fly', 0).setOrigin(0.5).play('eagle-flap');
    const cx = W * 0.55;
    const cy = 190;
    const rx = 230;
    const ry = 55;
    const start = { x: this.spr.x, y: this.spr.y };
    const flapper = s.time.addEvent({ delay: 3500, loop: true, callback: () => this.spr.play('eagle-flap') });
    s.tweens.chain({
      tweens: [
        {
          targets: this.spr,
          x: cx - rx,
          y: cy,
          duration: 2500,
          ease: 'Sine.easeInOut',
          onUpdate: () => this.spr.setFlipX(false),
        },
        {
          targets: { a: Math.PI },
          a: Math.PI * 4,
          duration: 32000,
          onUpdate: (tw, target) => {
            const prevX = this.spr.x;
            this.spr.setPosition(cx + Math.cos(target.a) * rx, cy + Math.sin(target.a) * ry);
            this.spr.setFlipX(this.spr.x < prevX);
          },
        },
        {
          targets: this.spr,
          x: start.x,
          y: start.y - 12,
          duration: 3000,
          ease: 'Sine.easeInOut',
          onUpdate: () => this.spr.setFlipX(true),
        },
      ],
      onComplete: () => {
        flapper.remove();
        this.spr.stop();
        this.spr.setTexture('eagle-perch').setOrigin(0.5, 1).setPosition(this.perch.x, this.perch.y).setFlipX(false);
        this.flying = false;
        this.nextFlight = s.time.now + between(40000, 70000);
      },
    });
  }
}

// Common loon: drifts, dives, and comes up somewhere else.
class Loon {
  constructor(w) {
    this.w = w;
    this.s = w.scene;
    this.spr = this.s.add.sprite(150 * PX, (HORIZON + 40) * PX, 'loon').setDepth(DEPTH.WATER_LIFE);
    this.baseY = this.spr.y;
    this.dir = -1;
    this.under = false;
    this.nextDive = this.s.time.now + between(10000, 18000);
    this.setScale();
  }

  setScale() {
    this.spr.setScale(pxScale(this.baseY));
  }

  update(time, dt) {
    if (this.under) return;
    this.spr.x += this.dir * 2.5 * dt * PX;
    if (this.spr.x < 60 || this.spr.x > W - 80) this.dir *= -1;
    this.spr.setFlipX(this.dir > 0);
    this.spr.y = this.baseY + Math.round(Math.sin(time / 700)) * PX;
    if (time > this.nextDive) this.dive();
  }

  dive() {
    const s = this.s;
    this.under = true;
    ripple(s, this.spr.x, this.baseY + 6);
    s.tweens.add({
      targets: this.spr,
      y: this.baseY + 12,
      alpha: 0,
      duration: 350,
      onComplete: () => {
        s.time.delayedCall(between(4000, 8000), () => {
          this.baseY = between(HORIZON + 22, HORIZON + 95) * PX;
          this.spr.setPosition(Phaser.Math.Clamp(this.spr.x + between(-180, 180), 80, W - 100), this.baseY).setAlpha(1);
          this.setScale();
          ripple(s, this.spr.x, this.baseY + 6);
          if (Math.random() < 0.4) this.w.note('A loon surfaces and calls across the lake.');
          this.under = false;
          this.nextDive = s.time.now + between(12000, 22000);
        });
      },
    });
  }
}

// Great blue heron: stands still in the shallows, then stabs at a fish.
class Heron {
  constructor(w) {
    this.s = w.scene;
    this.spr = this.s.add.sprite(34 * PX, (AH - 134) * PX, 'heron', 0).setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.BANKS - 0.5);
    this.nextStrike = this.s.time.now + between(9000, 18000);
  }

  update(time) {
    if (time < this.nextStrike) return;
    this.nextStrike = time + between(14000, 26000);
    this.spr.setFrame(1);
    splash(this.s, this.spr.x - 4 * PX, this.spr.y - 4 * PX, 0.4);
    this.s.time.delayedCall(700, () => this.spr.setFrame(0));
  }
}

// Darner dragonflies hover by the reeds and dart about.
class Dragonfly {
  constructor(w, ax, ay) {
    this.s = w.scene;
    this.home = { x: ax * PX, y: ay * PX };
    this.spr = this.s.add.sprite(this.home.x, this.home.y, 'dragonfly').setScale(PX).setDepth(DEPTH.BANK_LIFE).play('dragonfly-buzz');
    this.dart();
  }

  dart() {
    const tx = this.home.x + between(-25, 25) * PX;
    const ty = this.home.y + between(-15, 15) * PX;
    this.spr.setFlipX(tx < this.spr.x);
    this.s.tweens.add({
      targets: this.spr,
      x: tx,
      y: ty,
      duration: between(180, 380),
      ease: 'Cubic.easeOut',
      onComplete: () => this.s.time.delayedCall(between(700, 2600), () => this.dart()),
    });
  }
}

