import { pin } from '../core/constants.js';

const R = (a, b) => Phaser.Math.Between(a, b);
const pick = ([a, b]) => R(a, b);

// How each species behaves out of the water, lying on its side in your
// backpack, as fish really do on a dock or in a boat. Everything is done on
// the pixel grid: the fish's own swim frames bend its body (frame 0 has the
// tail down, frame 3 the tail up), it hops in whole pixels, jitters a pixel
// side to side and flips over. Nothing is rotated or scaled.
//
//   style   flop: bend and hop, tail slapping; thrash: whole body whipping
//           through every bend; shake: head shaking side to side; shiver: a
//           fast quiver; heave: one slow, heavy curl and slap; writhe: an
//           eel-like wave, sliding without hopping; buzz: a drumming buzz.
//   hop     how high a flop throws it, in pixels
//   burst   how many moves in a bout; tempo, ms per move
//   rest    ms lying still between bouts, gills pumping
//   flip    chance it turns over on a move
//   say     what you'd notice watching it
export const FLOPS = {
  bluegill: { style: 'flop', hop: 4, burst: [3, 6], tempo: 140, rest: [500, 1400], flip: 0.5, say: 'Flips end over end on its flat sides, then lies there fanning its gills.' },
  pumpkinseed: { style: 'flop', hop: 3, burst: [2, 5], tempo: 150, rest: [600, 1500], flip: 0.45, say: 'Bounces about like a coin, spines up.' },
  perch: { style: 'flop', hop: 3, burst: [2, 4], tempo: 170, rest: [900, 2000], flip: 0.3, say: 'A few stiff slaps of the tail, then it lies still, gills going.' },
  crappie: { style: 'flop', hop: 2, burst: [1, 3], tempo: 210, rest: [1200, 2600], flip: 0.2, say: 'Gives up quickly: a few weak flaps and a gaping papery mouth.' },
  whitebass: { style: 'thrash', hop: 4, burst: [4, 8], tempo: 110, rest: [500, 1200], flip: 0.4, say: 'Thrashes wildly; never stops for long.' },
  carp: { style: 'heave', hop: 3, burst: [1, 2], tempo: 380, rest: [1600, 3200], flip: 0.1, say: 'Heavy and slow: one great heave and a slap, then gulping air.' },
  bass: { style: 'flop', hop: 5, burst: [3, 6], tempo: 130, rest: [600, 1500], flip: 0.5, say: 'All muscle: springs and flips itself over and over.' },
  largemouth: { style: 'shake', hop: 4, burst: [2, 4], tempo: 160, rest: [1000, 2200], flip: 0.25, say: 'Shakes its big head and flares its gills, then sulks.' },
  trout: { style: 'shiver', hop: 2, burst: [6, 10], tempo: 70, rest: [700, 1500], flip: 0.3, say: 'Slippery: quivers and squirms, hard to hold.' },
  rainbow: { style: 'flop', hop: 6, burst: [3, 7], tempo: 120, rest: [400, 1100], flip: 0.6, say: 'Kicks and leaps like it does on the line.' },
  channelcat: { style: 'writhe', hop: 0, burst: [3, 5], tempo: 260, rest: [1800, 3500], flip: 0.05, say: 'Tough out of water: slow, sluggish twists, and a croak now and then.' },
  drum: { style: 'buzz', hop: 1, burst: [8, 14], tempo: 45, rest: [900, 2000], flip: 0.1, say: 'Grunts and drums: you can feel it buzz.' },
  walleye: { style: 'shake', hop: 2, burst: [1, 3], tempo: 200, rest: [1800, 3200], flip: 0.15, say: 'Calm for its size: a lazy head shake and that glassy stare.' },
  catfish: { style: 'writhe', hop: 0, burst: [4, 7], tempo: 240, rest: [900, 2000], flip: 0, say: 'The burbot coils and writhes like an eel.' },
  pike: { style: 'thrash', hop: 5, burst: [5, 9], tempo: 90, rest: [2200, 4000], flip: 0.4, say: 'Lies dead still... then explodes into a thrashing fit. Mind the teeth.' },
  muskie: { style: 'shake', hop: 5, burst: [4, 7], tempo: 130, rest: [1500, 2800], flip: 0.35, say: 'Powerful head-shaking thrashes from a long, heavy body.' },
  golden: { style: 'heave', hop: 1, burst: [1, 2], tempo: 600, rest: [2500, 4500], flip: 0, say: 'An old giant: barely stirs, then one ponderous sweep of the tail.' },
};

// Makes one fish in a backpack slot behave like a fish out of water.
// update(dt) moves it; stop() lays it back down as it was.
export class Flopper {
  constructor(scene, sprite, id, holder) {
    this.scene = scene;
    this.s = sprite;
    this.p = FLOPS[id] || FLOPS.perch;
    this.holder = holder; // the container it sits in, for the water drops
    this.unit = sprite.scaleX || 1; // moves are in the art's own pixels
    this.home = { x: sprite.x, y: sprite.y };
    this.flipped = sprite.flipX;
    this.slide = 0; // writhing fish creep along
    this.dir = 1;
    this.t = 0;
    this.restFor(300); // a breath before it starts
  }

  restFor(ms) {
    this.mode = 'rest';
    this.until = this.t + ms;
    this.left = 0;
  }

  bout() {
    this.mode = 'move';
    this.left = pick(this.p.burst);
    this.step = 0;
    this.moveAt = this.t;
    this.hop = this.p.hop * (0.6 + Math.random() * 0.4);
  }

  update(dt) {
    this.t += dt * 1000;
    const p = this.p;
    const s = this.s;
    let x = 0;
    let y = 0;
    let frame;

    if (this.mode === 'rest') {
      // lying on its side, gills pumping: a slow twitch between two
      // near-straight frames
      frame = Math.floor(this.t / (p.style === 'heave' || p.style === 'writhe' ? 900 : 650)) % 2 ? 1 : 4;
      if (this.t >= this.until) this.bout();
    } else {
      const k = Math.min(1, (this.t - this.moveAt) / p.tempo); // through this move
      const odd = this.step % 2;
      const arc = Math.sin(Math.PI * k);
      switch (p.style) {
        case 'flop': // curl one way, spring up, slap down curled the other way
          frame = odd ? 3 : 0;
          y = -Math.round(this.hop * arc);
          break;
        case 'thrash': // whipping through every bend, bouncing
          frame = Math.floor(k * 6 + this.step * 3) % 6;
          y = -Math.round(this.hop * arc);
          x = R(-1, 1);
          break;
        case 'shake': // the head swinging side to side
          frame = odd ? 3 : 0;
          x = (k < 0.5 ? 1 : -1) * (odd ? 1 : -1);
          y = -Math.round(this.hop * 0.6 * arc);
          break;
        case 'shiver': // a fast slippery quiver
          frame = Math.floor(this.t / 35) % 6;
          x = Math.floor(this.t / 35) % 2 ? 1 : 0;
          y = -Math.round(this.hop * arc);
          break;
        case 'heave': // a slow curl as it lifts, then the heavy slap
          frame = k < 0.7 ? 3 : 0;
          y = -Math.round(this.hop * arc);
          break;
        case 'writhe': // an eel's wave, creeping along the slot
          frame = Math.floor(k * 6 + this.step * 6) % 6;
          if (k >= 1) {
            this.slide += this.dir;
            if (Math.abs(this.slide) >= 3) this.dir *= -1;
          }
          break;
        case 'buzz': // drumming: a fast buzz
          frame = odd ? 1 : 4;
          y = odd ? -Math.max(1, Math.round(this.hop)) : 0;
          break;
        default:
          frame = 0;
      }
      if (k >= 1) {
        // the move lands
        if (this.hop >= 2 && p.style !== 'shiver') this.drops();
        if (Math.random() < p.flip) {
          this.flipped = !this.flipped;
          s.setFlipX(this.flipped);
        }
        this.step++;
        this.moveAt = this.t;
        this.hop = p.hop * (0.6 + Math.random() * 0.4);
        if (--this.left <= 0) this.restFor(pick(p.rest));
      }
    }
    s.setFrame(frame);
    s.x = this.home.x + (x + this.slide) * this.unit;
    s.y = this.home.y + y * this.unit;
  }

  // Water flicked off as it slaps down.
  drops() {
    const sc = this.scene;
    for (let i = 0; i < 2; i++) {
      const d = pin(sc.add.image(this.s.x + R(-8, 8) * this.unit, this.s.y + 3 * this.unit, 'drop'));
      this.holder.add(d);
      sc.tweens.add({
        targets: d,
        x: d.x + R(-7, 7),
        y: d.y - R(3, 7),
        alpha: 0,
        duration: 320,
        ease: 'Quad.easeOut',
        onUpdate: () => {
          d.x = Math.round(d.x);
          d.y = Math.round(d.y);
        },
        onComplete: () => d.destroy(),
      });
    }
  }

  stop() {
    this.s.setFrame(0).setFlipX(false);
    this.s.x = this.home.x;
    this.s.y = this.home.y;
  }
}
