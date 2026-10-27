import { clamp } from '../core/constants.js';
import { TUGS, AWAY } from './RhythmFight.js';

// The fight: a tug of war on a tight line, the way it goes on a real rod.
//
//   Hold to reel. The line tightens with how hard the fish is pulling; let
//   go to give it line and the tension falls. At 100 the line snaps; let
//   the fish take too much line and it's gone.
//   The fish tires as you keep it under pressure (its stamina), and reels
//   in more easily the more tired it is. A fresh fish makes runs: the rod
//   tip quivers first (the tell), then it pulls hard. Ease off for those.
//   Some bolt for cover (the weeds, the hut's posts, the bottom): swipe the
//   other way to turn its head, or the line snags and it gets its wind back.
//   Some leap: let go ("bow to the fish") or it throws the hook.
//   Hold the tension in the red without snapping and you build a bonus.
//
// Species keep their own rhythm from TUGS (RhythmFight.js): how often they
// run, for how long, whether they jump and where they head for cover.
// update(dt, holding) returns 'caught', 'snapped' or 'escaped' when it is
// over; things worth showing are pushed onto `events`.
const RED = 80; // tension past here builds the bonus, and risks a snap
const TELL = 0.35; // s of warning before a run
const LEAP = 1.0; // s a leap lasts
const THROW = 0.5; // s of reeling into a leap that throws the hook (time to react)
const DASH = 1.6; // s to turn a fish bolting for cover
const R = (a, b) => a + Math.random() * (b - a);

export class TensionFight {
  constructor(fish, startDistance) {
    this.fish = fish;
    this.p = TUGS[fish.id] || TUGS.perch;
    this.strength = fish.strength;
    this.distance = startDistance;
    this.startDistance = startDistance;
    this.escapeAt = startDistance + 45 + this.strength * 45; // a big fish runs farther
    this.tension = 0;
    this.stamina = 1; // the fish's, 0..1
    this.bonus = 0; // 0..1, won by holding the tension in the red
    this.pull = 0; // how hard it's pulling right now (rod and fish)
    this.events = [];
    this.t = 0;
    this.phase = 'settle';
    this.phaseAt = 0.8; // a moment after the hookset
    this.reelInLeap = 0;
    this.wasRed = false;
    this.wasTired = false;
    // big, strong fish have more to give, and take longer to tire
    this.drain = 0.11 / (0.5 + this.strength);
  }

  // How the hook went in (FishingScene's hookset): a perfect one takes some
  // fight out of the fish at once; a late one lets it start with a run.
  setHook(set) {
    if (set === 'perfect') this.stamina = 0.75;
    if (set === 'late') {
      this.phase = 'rest';
      this.phaseAt = 0.2;
    }
  }

  get phaseCue() {
    return this.phase;
  }

  emit(kind, extra = {}) {
    this.events.push({ kind, ...extra });
  }

  // What the fish does next, after a rest: a run, a bolt for cover or a
  // leap, more often the fresher it is.
  next() {
    const fresh = 0.35 + this.stamina * 0.65;
    if (this.p.cover && Math.random() < 0.35 * fresh) {
      this.phase = 'dash';
      this.phaseAt = this.t + DASH;
      this.dash = { cover: this.p.cover, need: AWAY[this.p.cover] };
      this.emit('dash', { ...this.dash });
    } else if (this.p.leaps && Math.random() < this.p.leaps * fresh) {
      this.phase = 'leap';
      this.phaseAt = this.t + LEAP;
      this.reelInLeap = 0;
      this.emit('leap');
    } else {
      this.phase = 'tell';
      this.phaseAt = this.t + TELL;
      this.emit('tell');
    }
  }

  rest() {
    this.phase = 'rest';
    // a tired fish rests longer between runs
    this.phaseAt = this.t + (this.p.rest / 1000) * (0.8 + Math.random() * 0.6) * (1 + (1 - this.stamina) * 1.5);
  }

  update(dt, holding) {
    this.t += dt;
    if (this.t >= this.phaseAt) {
      if (this.phase === 'settle' || this.phase === 'rest') this.next();
      else if (this.phase === 'tell') {
        // the run itself: a burst of the species' tugs
        this.phase = 'run';
        this.phaseAt = this.t + ((this.p.beat * this.p.burst) / 1000) * R(0.7, 1.1) * (0.5 + this.stamina * 0.5);
        // the jolt as it takes off: on a line held tight, that can be the end
        if (holding) this.tension += (20 + this.strength * 25) * (0.5 + this.stamina * 0.5);
        this.emit('run');
      } else if (this.phase === 'run') this.rest();
      else if (this.phase === 'leap') {
        // it fell back in, a little more tired for it
        this.stamina = Math.max(0, this.stamina - 0.08);
        this.emit('landed');
        this.rest();
      } else if (this.phase === 'dash') {
        // it reached cover: the line rubs and snags, it gets its wind back
        this.dash = null;
        this.tension = Math.min(99, this.tension + 25);
        this.distance += 12 + this.strength * 10;
        this.stamina = Math.min(1, this.stamina + 0.15);
        this.emit('snag', { cover: this.p.cover });
        this.rest();
      }
    }

    // how hard it pulls: steady, harder in a run or a bolt, weaker when tired
    const running = this.phase === 'run' || this.phase === 'dash';
    const wave = 0.75 + 0.25 * Math.sin(this.t * 7);
    this.pull = this.strength * (0.3 + this.stamina * 0.7) * wave * (running ? 2.4 : 1);

    if (this.phase === 'leap') {
      // in the air: reeling now throws the hook
      this.tension = Math.max(0, this.tension - 90 * dt);
      if (holding) this.reelInLeap += dt;
      if (this.reelInLeap > THROW) return 'escaped';
    } else if (holding) {
      // reeling: the line tightens with the pull, and comes in faster the
      // more tired the fish (and not at all against a run)
      this.tension += (this.pull * 75 - 10) * dt;
      const pace = 26 * (1.25 - this.strength * 0.5) * (1.15 - this.stamina * 0.75);
      this.distance += running ? this.pull * 4 * dt : -pace * dt;
      // keeping it under pressure tires it, more so on a tight line
      this.stamina = Math.max(0, this.stamina - this.drain * (0.4 + this.tension / 100) * dt);
    } else {
      // giving line: tension falls, the fish takes line and gets its breath
      this.tension -= 80 * dt;
      this.distance += this.pull * (running ? 14 : 5) * dt;
      this.stamina = Math.min(1, this.stamina + this.drain * 0.15 * dt);
    }
    this.tension = clamp(this.tension, 0, 100);

    // in the red: a bonus for nerve
    const red = this.tension >= RED;
    if (red) this.bonus = Math.min(1, this.bonus + dt * 0.12);
    if (red && !this.wasRed) this.emit('red');
    this.wasRed = red;
    if (this.stamina < 0.2 && !this.wasTired) {
      this.wasTired = true;
      this.emit('tired');
    }

    if (this.tension >= 100) return 'snapped';
    if (this.distance <= 0) return 'caught';
    if (this.distance >= this.escapeAt) return 'escaped';
    return null;
  }

  // A swipe while reeling: turning the fish's head. Only matters while it
  // bolts for cover, and only the right way.
  swipe(dir) {
    if (this.phase !== 'dash' || !this.dash) return;
    if (dir === this.dash.need) {
      this.dash = null;
      this.stamina = Math.max(0, this.stamina - 0.1);
      this.emit('turned');
      this.rest();
    } else {
      this.emit('wrongway');
    }
  }
}
