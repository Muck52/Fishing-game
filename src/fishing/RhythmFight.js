import { clamp } from '../core/constants.js';

const R = (a, b) => Phaser.Math.Between(a, b);

// How each species fights on the line, beat by beat. A fish pulls in tugs:
// `burst` tugs about `beat` ms apart, then a `rest`. Some leap clear of the
// water (`leaps`: chance per burst), when you must not reel ("bow to the
// fish"). Some run for `cover`: the weeds, the hut's posts or the bottom.
// `soft` mouths tear easily, so a mistimed tap costs more.
export const TUGS = {
  bluegill: { beat: 600, burst: 3, rest: 900, cover: 'weeds', why: 'Turns its flat side to the pull and circles in quick little tugs.' },
  pumpkinseed: { beat: 600, burst: 3, rest: 900, cover: 'weeds' },
  perch: { beat: 650, burst: 2, rest: 1000 },
  crappie: { beat: 900, burst: 1, rest: 1100, cover: 'posts', soft: true, why: 'Gentle head-nods; its paper mouth tears if you rush it.' },
  whitebass: { beat: 420, burst: 4, rest: 1100, why: 'Fast, frantic runs in open water.' },
  carp: { beat: 1100, burst: 2, rest: 1500, cover: 'bottom', why: 'Long, slow, stubborn pulls toward the bottom.' },
  bass: { beat: 550, burst: 3, rest: 1000, cover: 'posts', leaps: 0.35, why: 'Bulldogs toward rocks and posts, and jumps.' },
  largemouth: { beat: 700, burst: 2, rest: 1100, cover: 'weeds', leaps: 0.25, why: 'Dives for the weeds; jumps shaking its head.' },
  trout: { beat: 500, burst: 3, rest: 900 },
  rainbow: { beat: 450, burst: 3, rest: 900, leaps: 0.5, why: 'Jumps again and again once hooked.' },
  channelcat: { beat: 1200, burst: 1, rest: 1500, cover: 'bottom', why: 'Heavy, steady pulls; heads for the bottom.' },
  drum: { beat: 300, burst: 5, rest: 1300, cover: 'bottom', why: 'Rattling head-shakes.' },
  walleye: { beat: 1000, burst: 1, rest: 1200, why: 'Slow head-shakes, a dogged rather than wild fight.' },
  catfish: { beat: 900, burst: 2, rest: 1200, cover: 'bottom', why: 'The burbot rolls and twists like an eel.' },
  pike: { beat: 380, burst: 4, rest: 1300, cover: 'weeds', why: 'Blistering runs back into the weeds.' },
  muskie: { beat: 700, burst: 3, rest: 1200, cover: 'weeds', leaps: 0.3, why: 'Head-shaking leaps, deep runs, and a last surge at the dock.' },
  golden: { beat: 1500, burst: 2, rest: 1300, cover: 'bottom', leaps: 0.15, why: 'Ponderous, enormously strong, and it may leap clear.' },
};

// Which way to swipe to turn a fish away from its cover.
export const AWAY = { weeds: 'right', posts: 'left', bottom: 'up' };

const TELL = 220; // the fish tenses before a tug: the rod tip quivers
const PULL = 220; // the tug itself: never reel into it
const WINDOW = 520; // after the tug: the moment to reel
const PERFECT = 220; // the first part of that window

// The fight after a hook-set. Tap just after each tug to win back line;
// tapping into a tug strains the line. update() returns 'caught', 'snapped'
// or 'escaped' when it is over. Things worth showing on screen are pushed
// onto `events` for the scene to pick up.
export class RhythmFight {
  constructor(fish, startDistance) {
    this.fish = fish;
    this.p = TUGS[fish.id] || TUGS.perch;
    this.strength = fish.strength;
    this.distance = startDistance;
    this.startDistance = startDistance;
    this.escapeAt = startDistance + 40;
    this.strain = 0; // 0..100; at 100 the line snaps
    this.pull = 0; // how hard it is pulling right now, for the rod and fish
    this.t = 0;
    this.events = [];
    this.gain = startDistance / (7 + this.strength * 9); // line won by a good tap
    this.phase = 'rest';
    this.phaseAt = 900; // a moment to settle after the hook-set
    this.left = 0; // tugs left in this burst
    this.tapped = false;
    this.snagUntil = 0;
    this.dash = null;
    this.sinceDash = 0;
  }

  // compatibility with the old fight's meter
  get tension() {
    return this.strain;
  }

  get surging() {
    return this.phase === 'pull';
  }

  emit(kind, extra = {}) {
    this.events.push({ kind, ...extra });
  }

  startBurst() {
    this.sinceDash++;
    if (this.p.cover && this.sinceDash >= 2 && Math.random() < 0.55) {
      // it bolts for cover: you have a moment to swipe and turn it
      this.sinceDash = 0;
      this.phase = 'dash';
      this.dash = { cover: this.p.cover, need: AWAY[this.p.cover] };
      this.phaseAt = this.t + 1500;
      this.emit('dash', { cover: this.p.cover, need: AWAY[this.p.cover] });
      return;
    }
    if (this.p.leaps && Math.random() < this.p.leaps) {
      this.phase = 'leap';
      this.phaseAt = this.t + 1000;
      this.emit('leap');
      return;
    }
    this.left = this.p.burst;
    this.tell();
  }

  tell() {
    this.phase = 'tell';
    this.phaseAt = this.t + TELL;
    this.tapped = false;
    this.emit('tell');
  }

  update(dt) {
    const ms = dt * 1000;
    this.t += ms;
    this.strain = Math.max(0, this.strain - 22 * dt);
    this.pull = Math.max(0, this.pull - dt * 2.5);

    if (this.t >= this.phaseAt) {
      if (this.phase === 'rest') this.startBurst();
      else if (this.phase === 'tell') {
        this.phase = 'pull';
        this.phaseAt = this.t + PULL;
        this.pull = 1;
        this.emit('tug');
      } else if (this.phase === 'pull') {
        this.phase = 'window';
        this.windowAt = this.t;
        this.phaseAt = this.t + WINDOW;
        this.emit('window');
      } else if (this.phase === 'window') {
        if (!this.tapped) {
          // you let it go: it takes line
          this.distance += this.gain * (0.6 + this.strength * 0.6);
          this.emit('missed');
        }
        this.left--;
        if (this.left > 0) {
          this.phase = 'gap';
          this.phaseAt = this.t + Math.max(0, this.p.beat * (0.85 + Math.random() * 0.3) - PULL - WINDOW - TELL);
        } else {
          this.phase = 'rest';
          this.phaseAt = this.t + this.p.rest * (0.8 + Math.random() * 0.4);
        }
      } else if (this.phase === 'gap') this.tell();
      else if (this.phase === 'leap') {
        this.phase = 'rest';
        this.phaseAt = this.t + 500;
      } else if (this.phase === 'dash') {
        // it made it to cover: the line snags and the fish takes line
        this.dash = null;
        this.snagUntil = this.t + 1200;
        this.distance += this.gain * 1.6;
        this.strain = Math.min(100, this.strain + 30);
        this.phase = 'rest';
        this.phaseAt = this.t + 1300;
        this.emit('snag', { cover: this.p.cover });
      }
    }

    if (this.strain >= 100) return 'snapped';
    if (this.distance <= 0) return 'caught';
    if (this.distance >= this.escapeAt) return 'escaped';
    return null;
  }

  // A tap of the screen: a turn of the reel.
  tap() {
    if (this.t < this.snagUntil || this.phase === 'dash') return;
    const strain = (18 + this.strength * 14) * (this.p.soft ? 1.5 : 1);
    if (this.phase === 'tell' || this.phase === 'pull') {
      this.strain = clamp(this.strain + strain, 0, 100);
      this.emit('bad');
    } else if (this.phase === 'leap') {
      // reeling on a jumping fish throws the hook
      this.strain = clamp(this.strain + strain * 1.3, 0, 100);
      this.emit('bad', { leap: true });
    } else if (this.phase === 'window') {
      if (this.tapped) return; // one turn per tug; mashing wins nothing
      this.tapped = true;
      const perfect = this.t - this.windowAt < PERFECT;
      this.distance -= this.gain * (perfect ? 1.5 : 1);
      this.emit(perfect ? 'perfect' : 'good');
    } else {
      // between tugs, steady winding gains a little, at the pace of a
      // turning reel and no faster
      if (this.t - (this.lastWind ?? -1e9) < 350) return;
      this.lastWind = this.t;
      this.distance -= this.gain * 0.2;
      this.emit('wind');
    }
  }

  // A swipe: steering the fish's head. Only matters while it bolts for cover.
  swipe(dir) {
    if (this.phase !== 'dash' || !this.dash) return;
    if (dir === this.dash.need) {
      this.dash = null;
      this.distance -= this.gain;
      this.phase = 'rest';
      this.phaseAt = this.t + 700;
      this.emit('turned');
    }
  }
}
