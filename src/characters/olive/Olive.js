// Olive, the angler's dog. She keeps him company on the dock: standing
// about, wagging, wandering up and down the boards. Every so often she
// gallops off the end of the walkway, leaps into the lake, paddles over to
// the bank, climbs out and shakes herself dry, then trots off round the
// shore and comes back along the dock from the hut. And when she spots a
// good spot out on the water (a fish on the feed, or something glinting),
// she trots to the front of the deck and barks at it.
//
// Her sheet faces left (see tools/characters/olive.py). She moves only when
// her walk or run cycle advances a frame, by that frame's step, so her paws
// don't slide on the boards.
import { W, SURFACE_Y, DECK_Y, HUT_X, DEPTH, INK, lerp, label } from '../../core/constants.js';
import { ART } from '../../core/Assets.js';
import { splash, tinyRipple } from '../../environment/Effects.js';

const R = (a, b) => Phaser.Math.Between(a, b);
// where her paws stand and where the water comes up to, as fractions of
// her frame's height, for the sprite's origin (read once the art is loaded)
const origin = () => {
  const at = ART.anchors['olive-at'];
  const h = ART.sheets.olive.frameHeight;
  return { feet: at.feet / h, wet: at.waterline / h };
};

const DECK = { min: 258, max: 322 }; // where she potters about, behind the angler
const EDGE = HUT_X + 6; // she springs off the end of the walkway here
const BANK = { x: 132, y: SURFACE_Y - 4 }; // where she climbs out on the far bank
// how far she moves on frame i of her walk or gallop, from her gait as
// it was drawn (tools/characters/land.py), at her true size
const stepOf = (anim, i) => ART.anchors.olive[anim].steps[i];
const SWIM_SPEED = 16; // px per second

export class Olive {
  constructor(scene) {
    this.scene = scene;
    ({ feet: this.FEET, wet: this.WET } = origin());
    this.s = scene.add.sprite(R(DECK.min + 10, DECK.max), DECK_Y, 'olive', 0).setOrigin(0.5, this.FEET).setDepth(DEPTH.ANGLER - 0.5);
    this.dir = 0; // -1 walking left, +1 right
    this.target = null;
    this.s.on('animationupdate', (anim, frame) => this.step(anim.key, frame.index - 1));
    this.onDeck();
  }

  // Facing left is how she's drawn.
  face(dir) {
    this.s.setFlipX(dir > 0);
  }

  // Standing about on the dock, now and then wandering to another spot,
  // until she fancies a swim.
  onDeck() {
    this.mode = 'deck';
    this.s.setOrigin(0.5, this.FEET).setDepth(DEPTH.ANGLER - 0.5);
    this.s.y = DECK_Y;
    this.swimAt = this.scene.time.now + R(25000, 50000);
    this.stand();
  }

  stand() {
    this.dir = 0;
    this.s.play('olive-idle');
    this.next = this.scene.time.now + R(3000, 7000);
  }

  walkTo(x, run = false) {
    this.target = x;
    this.dir = x < this.s.x ? -1 : 1;
    this.face(this.dir);
    this.s.play(run ? 'olive-run' : 'olive-walk');
  }

  // Called on each new frame of her walk or run: move by that frame's step.
  step(key, i) {
    if (!this.dir || (key !== 'olive-walk' && key !== 'olive-run')) return;
    this.s.x += this.dir * stepOf(key === 'olive-run' ? 'run' : 'walk', i);
    if ((this.dir < 0 && this.s.x <= this.target) || (this.dir > 0 && this.s.x >= this.target)) {
      this.dir = 0;
      // changing animation inside its own frame event confuses Phaser
      this.scene.time.delayedCall(0, () => this.arrived());
    }
  }

  // A good spot out there: to the front of the deck, and a bark or two at
  // it; `onBark` happens with the first. Only while she's about on the deck.
  bark(onBark) {
    if (this.mode !== 'deck') return false;
    this.mode = 'bark';
    this.onBark = onBark;
    if (this.s.x - DECK.min < 4) this.woof();
    else this.walkTo(DECK.min);
    return true;
  }

  woof() {
    const sc = this.scene;
    const s = this.s;
    this.dir = 0;
    this.face(-1);
    s.play('olive-idle');
    const head = s.y - s.displayHeight * this.FEET;
    for (let i = 0; i < 2; i++) {
      sc.time.delayedCall(150 + i * 420, () => {
        // up on her toes with each bark
        sc.tweens.add({ targets: s, y: DECK_Y - 2, duration: 70, yoyo: true });
        const w = label(sc, s.x - 10, head - 4, 'Woof!', { font: 'head', color: INK.cream }).setDepth(DEPTH.UI - 1);
        sc.tweens.add({ targets: w, y: w.y - 10, alpha: 0, duration: 650, ease: 'Quad.easeOut', onComplete: () => w.destroy() });
        if (i === 0) this.onBark?.();
      });
    }
    sc.time.delayedCall(1500, () => {
      if (this.mode !== 'bark') return;
      this.mode = 'deck';
      this.stand();
    });
  }

  arrived() {
    if (this.mode === 'bark') this.woof();
    else if (this.mode === 'deck') this.stand();
    else if (this.mode === 'run') this.leap();
    else if (this.mode === 'away') this.goneAway();
    else if (this.mode === 'back') this.onDeck();
  }

  update(time, dt) {
    const s = this.s;
    if (this.mode === 'deck' && !this.dir && time > this.next) {
      if (time > this.swimAt) {
        this.mode = 'run';
        this.walkTo(EDGE, true);
      } else if (Math.random() < 0.6) {
        let x = R(DECK.min, DECK.max);
        if (Math.abs(x - s.x) < 10) x = s.x < (DECK.min + DECK.max) / 2 ? DECK.max : DECK.min;
        this.walkTo(x);
      } else {
        this.stand();
      }
    } else if (this.mode === 'swim') {
      s.x -= SWIM_SPEED * dt;
      s.y = SURFACE_Y + Math.round(Math.sin(time / 260) * 0.6);
      if (time > this.rippleAt) {
        tinyRipple(this.scene, s.x + 12);
        this.rippleAt = time + R(500, 900);
      }
      if (s.x <= BANK.x + 6) this.climbOut();
    }
  }

  // Off the end of the walkway: a crouch, then a spring nose-up, stretched
  // out over the water, and nose-down into the lake.
  leap() {
    const sc = this.scene;
    const s = this.s;
    this.mode = 'leap';
    s.anims.stop();
    s.setFrame(this.frames('leap')[0]).setDepth(DEPTH.SPLASH - 0.5);
    const x0 = s.x;
    const x1 = x0 - R(50, 70);
    sc.time.delayedCall(220, () => {
      sc.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 700,
        onUpdate: (tw) => {
          const t = tw.getValue();
          s.x = Math.round(lerp(x0, x1, t));
          s.y = Math.round(lerp(DECK_Y, SURFACE_Y + 8, t * t) - Math.sin(Math.PI * Math.min(1, t * 1.3)) * 16);
          s.setFrame(this.frames('leap')[t < 0.25 ? 1 : t < 0.6 ? 2 : 3]);
        },
        onComplete: () => this.splashDown(),
      });
    });
  }

  splashDown() {
    const sc = this.scene;
    const s = this.s;
    splash(sc, s.x - 6, 1.3);
    this.mode = 'dunk';
    this.face(-1);
    s.setOrigin(0.5, this.WET).setDepth(DEPTH.SPLASH - 0.5).play('olive-swim');
    s.y = SURFACE_Y + 7;
    // she goes under for a moment, then bobs up paddling
    sc.tweens.add({
      targets: s,
      y: SURFACE_Y,
      duration: 500,
      ease: 'Quad.easeOut',
      onUpdate: () => (s.y = Math.round(s.y)),
      onComplete: () => {
        this.mode = 'swim';
        this.rippleAt = 0;
      },
    });
  }

  // A scramble up onto the bank, then a good shake.
  climbOut() {
    const sc = this.scene;
    const s = this.s;
    this.mode = 'climb';
    s.anims.stop();
    s.setOrigin(0.5, this.FEET).setFrame(this.frames('leap')[1]);
    s.y = SURFACE_Y + 10;
    tinyRipple(sc, s.x + 4);
    sc.tweens.add({
      targets: s,
      x: BANK.x - 4,
      y: BANK.y,
      duration: 380,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        s.x = Math.round(s.x);
        s.y = Math.round(s.y);
      },
      onComplete: () => {
        // on the bank she's behind the reeds, like the other animals
        s.setDepth(DEPTH.SHORE_LIFE + 0.2).play('olive-shake');
        s.once('animationcomplete', () => {
          this.mode = 'away';
          this.walkTo(-30, true);
        });
      },
    });
  }

  // Round the shore and back along the dock from the hut.
  goneAway() {
    this.s.setVisible(false).anims.stop();
    this.scene.time.delayedCall(R(6000, 12000), () => {
      this.mode = 'back';
      this.s.setVisible(true).setOrigin(0.5, this.FEET).setDepth(DEPTH.ANGLER - 0.5);
      this.s.x = W + 25;
      this.s.y = DECK_Y;
      this.walkTo(R(DECK.min + 20, DECK.max));
    });
  }

  frames(name) {
    return ART.anchors.olive[name].frames;
  }
}
