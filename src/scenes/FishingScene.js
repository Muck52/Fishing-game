import { W, SURFACE_Y, VIEW_BED as BED_Y, DECK_Y, ANGLER_X, HUT_X, DEPTH, STATE, INK, LOOK_UP, clamp, lerp, label, pinToScreen } from '../core/constants.js';
import { ART } from '../core/Assets.js';
import { World } from '../environment/World.js';
import { depthTint } from '../environment/Lake.js';
import { splash, ripple, bubbles } from '../environment/Effects.js';
import { Wildlife } from '../wildlife/Wildlife.js';
import { Angler } from '../player/Angler.js';
import { Olive } from '../characters/olive/Olive.js';
import { Tackle } from '../fishing/Tackle.js';
import { ReelFight } from '../fishing/ReelFight.js';
import { RhythmFight } from '../fishing/RhythmFight.js';
import { BarFight } from '../fishing/BarFight.js';
import { pickFish, rollWeight, catchValue } from '../fish/FishSpawner.js';
import { Striker, strikeOf } from '../fish/Strike.js';
import { FISH } from '../../data/fish/fish.js';
import { Signs } from '../fish/Signs.js';
import { TackleBox } from '../ui/TackleBox.js';
import { lureOf } from '../fish/Lures.js';
import { timeOfDay, bandOf, restDepth } from '../fish/Habits.js';
import { PowerMeter } from '../ui/PowerMeter.js';
import { TensionMeter } from '../ui/TensionMeter.js';
import { pill } from '../ui/Panels.js';
import { FishBar } from '../ui/FishBar.js';
import { Hud } from '../ui/Hud.js';
import { CatchPopup } from '../ui/CatchPopup.js';
import { Backpack } from '../ui/Backpack.js';
import { Journal } from '../ui/Journal.js';
import { SaveManager } from '../save/SaveManager.js';

const MIN_HOLD = 150; // ms: a quick tap isn't a cast
const STEER = 24; // px of drag that counts as a steering swipe in a fight
// Reeling is the Stardew-style catch bar; ?reel=rhythm (rhythm tugs) or
// ?reel=hold (the old hold-to-reel) in the address bring back the others.
const REEL = new URLSearchParams(window.location.search).get('reel') || 'bar';
const HOLD_REEL = REEL === 'hold';
const RHYTHM = REEL === 'rhythm';
const BAR = !HOLD_REEL && !RHYTHM;
// Where each kind of cover is, for a fish bolting toward it.
const COVER = {
  weeds: (f) => ({ x: 36, y: clamp(f.y, SURFACE_Y + 60, BED_Y - 40) }),
  posts: (f) => ({ x: HUT_X + 31, y: f.y }),
  bottom: (f) => ({ x: f.x, y: BED_Y - 12 }),
};
const COVER_NAME = { weeds: 'the weeds', posts: 'the posts', bottom: 'the bottom' };
const ARROW = { left: '<<', right: '>>', up: '^^' };
const R = (a, b) => Phaser.Math.Between(a, b);

// The chance of a fish, for each way of fishing. In open water at most
// CAP of casts bring a fish, by the end of the wait or the retrieve; the
// rest come up empty. On a shadow or a sparkle there is always a fish, and
// it takes the bait within SIGN_BY.
//   float  a chance each second, adding up to CAP by WAIT
//   jig    a chance each jig, adding up to CAP by the jig that brings it in
//   reel   a chance each pixel reeled, adding up to CAP over a full retrieve
const CAP = 0.6;
const WAIT = 30000; // ms on a float (or since the last jig) before giving up
const SIGN_BY = 8000;
const JIG_STEP = 6; // px a jig comes in each hop
const PER_SECOND = 1 - (1 - CAP) ** (1 / (WAIT / 1000)); // about 3%
const chanceOver = (n) => 1 - (1 - CAP) ** (1 / Math.max(1, n)); // per step, CAP after n

// The bite: how long you have to set the hook, by how rare the fish is (a
// wary old fish lets go sooner), with a little longer for the ones whose
// take barely moves the float. Tap in the first part of it (the ring round
// the float still gold) for a perfect hookset; in the last part, late.
const WINDOW = { common: 1200, uncommon: 1000, rare: 800, legendary: 650 };
const SUBTLE = ['soft', 'lift', 'slowtake'];
const PERFECT = 0.4;
const LATE = 0.8;
// how full the catch bar starts, by how well the hook was set
const SET = { perfect: 0.45, good: 0.3, late: 0.18 };
// wary fish that drop the bait if you strike at a nibble; the rest are
// bold and keep at it
const SHY = ['trout', 'rainbow', 'walleye', 'carp', 'muskie', 'golden', 'catfish', 'crappie'];

export class FishingScene extends Phaser.Scene {
  constructor() {
    super('Fishing');
  }

  create() {
    this.save = new SaveManager();
    this.world = new World(this);
    this.wildlife = new Wildlife(this);
    this.angler = new Angler(this);
    this.olive = new Olive(this);
    this.tackle = new Tackle(this);
    this.signs = new Signs(this, () => this.conditions());
    // Olive barks at a good spot when one shows (Signs.js)
    this.signs.onHot = (g) => this.olive.bark(() => this.signs.list.includes(g) && this.signs.flash(g));
    const idle = () => this.state === STATE.IDLE && !this.charging;
    this.tackleBox = new TackleBox(this, this.save, idle, (l) => this.setHint(`${l.name}\n${l.note}`, 1800));
    this.power = new PowerMeter(this);
    this.hud = new Hud(this);
    this.hud.update(this.save.data);
    this.meter = new TensionMeter(this);
    this.bar = new FishBar(this);
    this.popup = new CatchPopup(this);
    this.bag = new Backpack(this, this.save, () => this.state === STATE.IDLE && !this.journal.isOpen);
    this.journal = new Journal(this, this.save, () => this.state === STATE.IDLE && !this.bag.isOpen);
    // hints sit on a little wooden plaque, like the counters
    this.plaque = pill(this, W / 2, 165, 40, 20).setDepth(DEPTH.UI).setVisible(false);
    this.hint = label(this, W / 2, 165, '', { font: 'head', size: 2 }).setDepth(DEPTH.UI);
    this.fishSprite = null;
    this.ring = this.add.graphics().setDepth(DEPTH.SPLASH + 0.5);

    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onUp, this);
    pinToScreen(this);
    this.cameras.main.scrollY = -LOOK_UP;
    this.resetToIdle();
  }

  // What decides which fish comes (fish/Habits.js): the hour, the weather,
  // the bait and how deep it is.
  conditions() {
    const t = this.tackle;
    return {
      time: timeOfDay(),
      weather: this.world.weather.kind,
      band: t?.visible ? bandOf(t.restY ?? t.hookY) : null, // where it comes to rest
      lure: this.tackleBox?.current,
    };
  }

  // ---- messages ------------------------------------------------------------

  setHint(text, fadeAfter = 0) {
    const both = [this.hint, this.plaque];
    this.tweens.killTweensOf(both);
    this.hint.setText(text).setAlpha(1).setFontSize(text.length > 12 ? 16 : 32).setTint(text === 'TAP!' ? INK.gold : INK.cream);
    const b = this.hint.getTextBounds(true).global;
    this.plaque.setVisible(!!text).setAlpha(1).setSize(Math.ceil(b.width / 2) * 2 + 16, Math.ceil(b.height / 2) * 2 + 8);
    if (text === 'TAP!') this.tweens.add({ targets: this.hint, alpha: 0.4, duration: 90, yoyo: true, repeat: 3 });
    if (fadeAfter) this.tweens.add({ targets: both, alpha: 0, delay: fadeAfter, duration: 400 });
  }

  // ---- the fish on the line --------------------------------------------------

  // Where the fish's mouth is: the art faces left, so a fish turned to face
  // right (flipped) has its mouth on the right.
  mouth() {
    const f = this.fishSprite;
    const half = Math.floor(f.width / 2);
    return { x: f.x + (f.flipX ? half : -half), y: f.y + 1 };
  }

  // The fish comes to the bait in its own way (see fish/Strike.js).
  spawnFish() {
    this.striker = new Striker(this, this.fish, this.tackle, this.from);
    this.fishSprite = this.striker.sprite;
  }

  // A fish that got away bolts off.
  fleeFish() {
    this.striker?.flee();
    this.striker = null;
    this.fishSprite = null;
  }

  // ---- state changes -------------------------------------------------------

  resetToIdle() {
    this.state = STATE.IDLE;
    this.charging = null;
    this.power.show(false);
    this.fight = null;
    this.fish = null;
    this.striker?.destroy();
    this.striker = null;
    this.fishSprite = null;
    this.tackle.show(false);
    this.tackle.dip = 0;
    this.tackle.shake = 0;
    this.meter.show(false);
    this.angler.idle();
    this.setHint('Hold to cast');
  }

  // Holding: the rod goes back over his shoulder and the meter fills.
  charge() {
    this.charging = { from: this.time.now };
    this.setHint('');
    this.angler.setMode('cast');
    this.angler.sprite.stop().setFrame(1);
    this.power.show(true);
    this.power.set(0);
  }

  // The line goes straight out over the water, as far as the meter was full.
  cast(power) {
    this.charging = null;
    this.power.show(false);
    this.state = STATE.CASTING;
    this.castPower = power;
    this.setHint('');
    const t = this.tackle;
    t.hook.setTexture(`bait-${this.tackleBox.current}`);
    // how this bait is fished: on a float, jigged, or reeled through
    this.mech = lureOf(this.tackleBox.current).mech;
    t.float = this.mech === 'float';
    const from = this.angler.tip;
    const near = from.x - 18;
    const landX = Math.round(lerp(near, 16, power));
    this.angler.cast(() => {
      const start = this.angler.tip;
      t.show(true);
      t.x = start.x;
      t.y = start.y;
      const arc = 60 + power * 110;
      this.flight = this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 500 + power * 450,
        onUpdate: (tw) => {
          const k = tw.getValue();
          t.x = lerp(start.x, landX, k);
          t.y = lerp(start.y, SURFACE_Y, k) - Math.sin(Math.PI * k) * arc;
        },
        onComplete: () => this.splashDown(landX),
      });
      // the first few times, how to stop it short
      this.casts = (this.casts || 0) + 1;
      if (this.casts <= 3) this.setHint('Tap to drop it here');
    });
  }

  // A tap while the line is in the air: thumb on the spool, and the bait
  // drops straight down where it is (to land right on a sign).
  brake() {
    if (!this.flight || !this.flight.isPlaying()) return;
    const t = this.tackle;
    this.flight.stop();
    this.flight = null;
    const x = Math.round(clamp(t.x, 16, this.angler.tip.x - 18));
    // how far out it went, for the rarer fish farther out
    this.castPower = clamp((this.angler.tip.x - 18 - x) / (this.angler.tip.x - 34), 0.03, 1);
    this.tweens.add({ targets: t, x, y: SURFACE_Y, duration: 220, ease: 'Quad.easeIn', onComplete: () => this.splashDown(x) });
  }

  splashDown(x) {
    const t = this.tackle;
    this.flight = null;
    t.x = x;
    this.setHint('');
    splash(this, x, 0.6);
    this.state = STATE.WAITING;
    // the bait sinks as deep as the meter was full (fish/Habits.js); a lure
    // starts near the top, where it's reeled
    t.hookY = SURFACE_Y + 10;
    if (this.mech === 'reel') {
      t.hookY = SURFACE_Y + 14;
      t.restY = null; // a lure is always on the move
    } else {
      t.restY = restDepth(this.castPower);
      this.tweens.add({ targets: t, hookY: t.restY, duration: 600 + (t.restY - SURFACE_Y) * 6, ease: 'Sine.easeOut' });
    }
    this.startWaiting();
  }

  startWaiting() {
    // ?fish=walleye in the address forces a species, for trying them out
    const forced = FISH.find((f) => f.id === new URLSearchParams(window.location.search).get('fish'));
    const now = this.time.now;
    const dock = this.angler.tip.x - 22;
    this.from = null;
    this.treasure = null;
    this.fish = null;
    this.nibbleTimes = [];
    this.biteAt = Infinity;
    this.nibbleUntil = 0;
    this.jig = { count: 0, need: 0, last: now, arrive: Infinity };
    this.chase = null;
    this.emptyAt = now + WAIT;
    this.nextTick = now + 1000;
    if (this.mech === 'reel') {
      // a chance each pixel reeled: CAP over a full-length retrieve
      this.reelP = chanceOver(dock - 16);
      this.emptyAt = Infinity;
      this.setHint('Hold to reel it in', 1500);
      return;
    }
    if (this.mech === 'jig') {
      // a chance each jig: CAP by the jig that brings it to the dock
      this.jig.p = chanceOver(Math.ceil((dock - this.tackle.x) / JIG_STEP));
      this.setHint('Tap to jig it', 1500);
    }
    // did it land on a shadow or a sparkle? the fish there comes to the bait
    const sign = forced ? null : this.signs.near(this.tackle.x);
    if (forced || sign) this.meet(forced, sign, now);
  }

  // A fish comes for the bait: from under a sign (with its treasure, if it
  // was sparkling), or from open water, any fish of the lake.
  meet(forced, sign, now) {
    if (forced) {
      this.fish = forced;
    } else if (sign) {
      const got = this.signs.take(sign);
      this.fish = got.fish;
      this.treasure = got.treasure;
      this.from = { x: sign.x, y: SURFACE_Y + 12 };
    } else {
      this.fish = pickFish(this.castPower, this.conditions());
    }
    this.emptyAt = Infinity;
    if (this.mech === 'float') {
      this.schedule(now, !!sign);
    } else if (this.mech === 'jig') {
      // it comes and hangs by the jig, and strikes once it's been worked;
      // from a sign quickly enough to take it within SIGN_BY
      this.time.delayedCall(sign ? 300 : 500, () => this.state === STATE.WAITING && this.spawnFish());
      this.jig.need = sign ? R(2, 3) : R(1, 2);
      this.jig.arrive = now + (sign ? 1500 : 2600);
    }
  }

  // A tap on a jig: it hops up and drops back, a little nearer the dock.
  // A fish hanging by it noses closer each time; worked enough, it strikes.
  jigIt() {
    const t = this.tackle;
    const now = this.time.now;
    if (now - this.jig.last < 220) return;
    this.jig.last = now;
    this.tweens.add({ targets: t, hookY: t.hookY - 6, duration: 110, yoyo: true, ease: 'Quad.easeOut' });
    const dock = this.angler.tip.x - 22;
    t.x = Math.min(t.x + JIG_STEP, dock);
    this.tweens.add({ targets: this.angler, lift: 4, duration: 110, yoyo: true, ease: 'Quad.easeOut' });
    if (!this.fish) {
      if (Math.random() < this.jig.p) this.meet(null, null, now);
      else if (t.x >= dock) this.lose('Nothing biting here\nTry a shadow or a sparkle');
      return;
    }
    if (this.striker && now > this.jig.arrive) {
      this.jig.count++;
      this.striker.nibble();
      if (this.jig.count >= this.jig.need && this.biteAt === Infinity) this.biteAt = now + R(200, 700);
    }
  }

  // A lure, while you hold: it comes in toward the dock just under the
  // surface; let go and it sinks. Passing through a shadow or a sparkle, the
  // fish there gives chase, and strikes if you keep reeling.
  reelIn(time, dt) {
    const t = this.tackle;
    const holding = this.input.activePointer.isDown;
    const dock = this.angler.tip.x - 22;
    let moved = 0;
    if (holding) {
      moved = Math.min(dock, t.x + dt * 30) - t.x;
      t.x += moved;
      t.hookY = Math.max(SURFACE_Y + 12, t.hookY - dt * 20);
      this.angler.crank += dt * 14;
    } else {
      t.hookY = Math.min(BED_Y - 20, t.hookY + dt * 8);
    }
    if (!this.fish) {
      const sign = this.signs.near(t.x, 6);
      // through a sign always; in open water, a chance for each pixel reeled
      const hit = sign || (moved > 0 && Math.random() < 1 - (1 - this.reelP) ** moved);
      if (hit) {
        this.meet(null, sign, time);
        this.spawnFish();
        this.tweens.killTweensOf(this.striker.sprite);
        // from open water it comes up from behind and below; from a sign it
        // drops in behind the lure (the line runs up ahead of it, to the rod)
        const back = t.x - this.striker.half - 8;
        if (!sign) this.striker.sprite.setPosition(t.x - 34, Math.min(BED_Y - 12, t.hookY + 24));
        else this.striker.sprite.setPosition(Math.min(sign.x, back), Math.max(SURFACE_Y + 12, t.hookY + 4));
        this.chase = { until: time + R(700, 1300), lag: 0 };
      } else if (t.x >= dock) {
        this.resetToIdle();
        this.setHint('Nothing followed it in', 1500);
      }
      return;
    }
    // the fish chases the lure, just behind it
    const s = this.fishSprite;
    // its nose just behind the lure, closing on it for the hit
    const b = t.bait;
    const close = time > this.chase.until - 400;
    const k = Math.min(1, dt * (close ? 10 : 4));
    s.x += (b.x - this.striker.half - (close ? 0 : 3) - s.x) * k;
    s.y += (b.y - 1 - s.y) * k;
    s.setFlipX(true);
    this.chase.lag = holding ? 0 : this.chase.lag + dt;
    if (this.chase.lag > 1.5 || t.x >= dock) this.lose('It turned away\nKeep reeling through');
    else if (time > this.chase.until && holding) {
      // it hits the lure and hooks itself
      this.pop('Fish on!', INK.gold);
      this.hook();
    }
  }

  // The fish is on its way: when it arrives, its nibbles, and the bite.
  // From a sign it all happens within SIGN_BY.
  schedule(now, fromSign = false) {
    this.time.delayedCall(this.from ? 500 : 900, () => this.state === STATE.WAITING && this.spawnFish());
    // The fish takes about two and a half seconds to arrive. Then come the
    // fake-out nibbles that keep you guessing, as many as the species tends
    // to make (a pike never nibbles, a bluegill pecks and pecks), each a
    // second or so apart, and then the real bite.
    const [lo, hi] = strikeOf(this.fish.id).nibbles;
    this.nibbleTimes = [];
    let at = now + (fromSign ? 2600 : 3500) + R(0, 600);
    for (let i = R(lo, hi); i > 0; i--) {
      this.nibbleTimes.push(at);
      at += fromSign ? R(700, 950) : R(800, 1400);
    }
    this.biteAt = at + (fromSign ? R(200, 600) : R(300, 1200));
    if (fromSign) this.biteAt = Math.min(this.biteAt, now + SIGN_BY - 300);
    this.nibbleUntil = 0;
  }

  bite() {
    this.state = STATE.BITE;
    const ms = WINDOW[this.fish.rarity] + (SUBTLE.includes(strikeOf(this.fish.id).strike) ? 250 : 0);
    this.biteFrom = this.time.now;
    this.biteUntil = this.biteFrom + ms;
    this.striker.strike();
    this.angler.bite();
    this.tackle.shout(true);
    // the float plunges for a hard taker; a soft taker barely stirs it
    const d = this.striker.dip;
    if (d >= 9) splash(this, this.tackle.x, 0.2 + d / 30);
    else ripple(this, this.tackle.x);
    this.setHint('TAP!');
    try {
      navigator.vibrate?.([70, 40, 70]);
    } catch (e) {
      // vibration not supported
    }
  }

  // How well the hook went in: by when in the bite window you tapped.
  hookset() {
    const k = (this.time.now - this.biteFrom) / (this.biteUntil - this.biteFrom);
    return k < PERFECT ? 'perfect' : k < LATE ? 'good' : 'late';
  }

  hook(set = 'good') {
    this.state = STATE.REELING;
    this.ring.clear();
    this.tackle.shout(false);
    this.weight = rollWeight(this.fish);
    const start = 40 + this.castPower * 60;
    this.fight = BAR ? new BarFight(this.fish, start) : HOLD_REEL ? new ReelFight(this.fish, start) : new RhythmFight(this.fish, start);
    this.far = { x: this.tackle.x, y: this.tackle.hookY };
    this.off = { x: 0, y: 0 }; // where the fight throws the fish, off its line toward the pier
    if (BAR) {
      this.fight.progress = SET[set];
      this.bar.show(true, this.fishSprite);
    }
    if (set === 'perfect') this.pop('Perfect hookset!', INK.gold);
    else if (set === 'late') this.pop('Late!', INK.red);
    else this.meter.show(true);
    this.angler.fight();
    this.striker.hooked();
    this.tackle.shake = 0;
    this.fishSprite.setFlipX(true);
    this.setHint(BAR ? 'Hold to raise the bar\nKeep the fish in it!' : HOLD_REEL ? 'Hold to reel!\nLet go when the line pulls tight' : 'Tap just after\neach tug!', 2400);
  }

  // The line comes in before anything has taken: the float skates back to
  // the dock, the reel turning, and you're ready to cast again. A fish on
  // its way to the bait turns away.
  reelBack() {
    const t = this.tackle;
    this.state = STATE.RESULT;
    this.setHint('');
    this.tweens.killTweensOf(t);
    this.fleeFish();
    this.fish = null;
    t.restY = null;
    t.dip = 0;
    t.shake = 0;
    ripple(this, t.x);
    const dock = this.angler.tip.x - 22;
    const ms = 300 + (dock - t.x) * 3;
    this.tweens.add({ targets: this.angler, crank: this.angler.crank + ms / 60, duration: ms });
    this.tweens.add({ targets: t, x: dock, hookY: SURFACE_Y + 8, duration: ms, ease: 'Sine.easeIn', onComplete: () => this.resetToIdle() });
  }

  // The ring round the float that closes over the bite window: gold while
  // a tap would be a perfect hookset, cream, then red when it's nearly gone.
  drawRing(time) {
    const g = this.ring.clear();
    const k = clamp((time - this.biteFrom) / (this.biteUntil - this.biteFrom), 0, 1);
    const r = Math.round(lerp(15, 4, k));
    const col = k < PERFECT ? INK.gold : k < LATE ? INK.cream : INK.red;
    const cx = Math.round(this.tackle.x);
    const cy = SURFACE_Y - 1;
    // a pixel ellipse, flattened like a ring on the water
    for (let a = 0; a < 64; a++) {
      const t = (a / 64) * Math.PI * 2;
      g.fillStyle(col, 1).fillRect(cx + Math.round(Math.cos(t) * r), cy + Math.round(Math.sin(t) * r * 0.45), 1, 1);
    }
  }

  lose(message, snapped = false) {
    this.ring.clear();
    if (this.fish) this.signs.scatter();
    this.state = STATE.RESULT;
    this.tackle.show(false);
    this.meter.show(false);
    this.bar.show(false);
    this.fleeFish();
    if (snapped) this.angler.hurt();
    else this.angler.idle();
    this.setHint(message);
    this.time.delayedCall(1700, () => this.resetToIdle());
  }

  land() {
    this.state = STATE.RESULT;
    this.meter.show(false);
    this.bar.show(false);
    this.tackle.show(false);
    this.setHint('');
    const f = this.fishSprite;
    this.fishSprite = null;
    splash(this, f.x, 1.3);
    this.angler.land();
    // hauled up out of the water and into the barrel behind him
    const x0 = f.x;
    const y0 = f.y;
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 700,
      ease: 'Sine.easeIn',
      onUpdate: (tw) => {
        const k = tw.getValue();
        f.x = lerp(x0, ANGLER_X + 15, k);
        f.y = lerp(y0, DECK_Y - 20, k) - Math.sin(Math.PI * k) * 110;
      },
      onComplete: () => f.destroy(),
    });
    f.clearTint();

    let value = catchValue(this.fish, this.weight);
    // Stardew's bonuses: a perfect catch is worth more, and a chest holds coins
    const bonus = [];
    if (BAR && this.fight.perfect) {
      value = Math.round(value * 1.25);
      bonus.push('PERFECT!');
    }
    if (BAR && this.fight.treasure?.got) {
      const loot = 10 + R(0, 20) + Math.round(this.fish.value * 0.5);
      value += loot;
      bonus.push(`Treasure +${loot}`);
    }
    if (this.treasure) {
      // the sparkle was something lost in the lake, caught up with the fish
      const t = this.treasure;
      value += t.value;
      bonus.push(`Found ${t.name}! +${t.value}`);
      this.save.data.treasures = [...(this.save.data.treasures || []), t.name];
      this.treasure = null;
    }
    if (bonus.length) this.pop(bonus.join('  '), INK.gold);
    const { isNew, isRecord } = this.save.recordCatch(this.fish, this.weight, value);
    this.time.delayedCall(750, () => {
      this.hud.coinBurst(ANGLER_X, DECK_Y - 30, value);
      this.hud.update(this.save.data);
      this.popup.show({ fish: this.fish, weight: this.weight, value, isNew, isRecord, entry: this.save.data.totalCatches });
    });
  }

  // ---- input ---------------------------------------------------------------

  onDown(pointer, over = []) {
    if (this.bag.isOpen || this.journal.isOpen) {
      // a tap outside the open backpack or journal closes it
      this.bag.close();
      this.journal.close();
      this.downAt = null;
      return;
    }
    this.downAt = { x: pointer.x, y: pointer.y };
    if (this.state === STATE.REELING) {
      if (RHYTHM) this.fight.tap();
    } else if (this.state === STATE.BITE) {
      this.hook(this.hookset());
    } else if (this.state === STATE.WAITING) {
      if (this.mech === 'jig') this.jigIt();
      else if (this.mech === 'float') {
        // mid-nibble it spooks the fish; any other time it brings the
        // line in, to cast again
        if (this.time.now < this.nibbleUntil) {
          if (SHY.includes(this.fish?.id)) this.lose('Too early! You spooked it.');
          else this.pop('Not yet...');
        } else this.reelBack();
      }
    } else if (this.state === STATE.CASTING) {
      this.brake();
    } else if (this.state === STATE.RESULT && this.popup.canClose) {
      this.popup.hide();
      this.resetToIdle();
    } else if (this.state === STATE.IDLE && !over.length) {
      this.charge();
    }
  }

  onUp(pointer) {
    if (this.state === STATE.REELING && RHYTHM && this.downAt) {
      // a drag steers the fish's head away from cover
      const dx = pointer.x - this.downAt.x;
      const dy = this.downAt.y - pointer.y;
      if (Math.max(Math.abs(dx), dy) > STEER) this.fight.swipe(Math.abs(dx) > dy ? (dx > 0 ? 'right' : 'left') : 'up');
      this.downAt = null;
      return;
    }
    this.downAt = null;
    if (this.state !== STATE.IDLE || !this.charging) return;
    if (this.time.now - this.charging.from < MIN_HOLD) {
      // a tap: show how it's done
      this.charging = null;
      this.power.show(false);
      this.angler.idle();
      this.setHint('Hold to fill the meter\nLet go to cast');
      return;
    }
    this.cast(Math.max(0.03, this.power.level));
  }

  // ---- frame loop ----------------------------------------------------------

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.world.update(time, dt);
    this.wildlife.update(time);
    this.angler.update(time);
    this.olive.update(time, dt);
    this.bag.update(dt);
    this.journal.update(dt);
    this.signs.update(time, dt);
    const sky = this.world.weather;
    this.hud.weather(sky.kind, sky.icon(this.world.daylight.night));
    const t = this.tackle;
    if (this.charging) this.power.set(time - this.charging.from);

    if (this.state === STATE.WAITING && this.mech === 'reel') {
      this.reelIn(time, dt);
    } else if (this.state === STATE.WAITING) {
      if (!this.fish && this.mech === 'float') {
        // open water: each second a chance that a fish finds the bait
        while (time >= this.nextTick && !this.fish) {
          this.nextTick += 1000;
          if (Math.random() < PER_SECOND) this.meet(null, null, time);
        }
      }
      const idle = this.mech === 'jig' ? time - this.jig.last > WAIT : time > this.emptyAt;
      if (!this.fish && idle) this.lose('Nothing biting here\nTry a shadow or a sparkle');
      // a jigged fish loses interest if the jig stops moving
      if (this.mech === 'jig' && this.fish && time > this.jig.arrive + 1500 && time - Math.max(this.jig.last, this.jig.arrive) > 4500 && this.biteAt === Infinity) {
        this.lose('It lost interest\nKeep the jig moving');
      }
      if (this.nibbleTimes.length && time >= this.nibbleTimes[0]) {
        this.nibbleTimes.shift();
        const ms = this.striker?.nibble() ?? 300;
        this.nibbleUntil = time + ms;
        if (this.striker?.dip) ripple(this, t.x);
      }
      this.striker?.update(time);
      t.dip = this.striker?.dip ?? 0;
      t.shake = this.striker?.shake ?? 0;
      if (time >= this.biteAt && this.fishSprite) this.bite();
    } else if (this.state === STATE.BITE) {
      this.striker.hold(dt);
      t.dip = this.striker.dip;
      t.shake = this.striker.shake;
      this.drawRing(time);
      if (time > this.biteUntil) this.lose('It got away...');
    } else if (this.state === STATE.REELING) {
      this.updateFight(time, dt);
    }

    if (t.visible) {
      const fight = this.state === STATE.REELING;
      t.draw(this.angler.tip, time, { tension: this.fight ? this.fight.tension / 100 : 0, flying: this.state === STATE.CASTING, end: fight ? this.mouth() : null });
    }
  }

  // A word that pops up over the float and floats away: how that tap went.
  pop(text, color = INK.cream) {
    const p = label(this, this.tackle.x, SURFACE_Y - 16, text, { font: 'head', color }).setDepth(DEPTH.UI);
    this.tweens.add({ targets: p, y: p.y - 14, alpha: 0, duration: 700, ease: 'Quad.easeOut', onComplete: () => p.destroy() });
  }

  // What the fight just did, shown on the lake, the rod and the meter.
  onFightEvent(e) {
    const s = this.fishSprite;
    const away = -1; // the fish fights away from the pier, out to the left
    if (e.kind === 'tell') {
      this.angler.shudder = 1;
    } else if (e.kind === 'tug') {
      // a lunge away from the pier, line peeling off
      this.tweens.killTweensOf(this.off);
      this.tweens.chain({ targets: this.off, tweens: [
        { x: away * (6 + this.fish.strength * 10), duration: 140, ease: 'Quad.easeOut' },
        { x: 0, duration: 450, ease: 'Sine.easeInOut' },
      ] });
      bubbles(this, s.x, s.y, 1);
      try { navigator.vibrate?.(25); } catch (err) { /* no vibration */ }
    } else if (e.kind === 'window') {
      this.angler.shudder = 0;
    } else if (e.kind === 'perfect' || e.kind === 'good') {
      this.angler.reel();
      this.pop(e.kind === 'perfect' ? 'Nice!' : 'Good', e.kind === 'perfect' ? INK.gold : INK.green);
    } else if (e.kind === 'wind') {
      this.angler.reel();
    } else if (e.kind === 'bad') {
      this.pop(e.leap ? 'Let it jump!' : 'Too soon!', INK.red);
      this.cameras.main.shake(80, 0.004);
    } else if (e.kind === 'missed') {
      this.angler.shudder = 0;
    } else if (e.kind === 'leap') {
      // it clears the water, shaking its head, and drops back in
      const x0 = s.x;
      this.leaping = true;
      splash(this, x0, 0.6);
      this.setHint('It jumped!\nDon\'t reel', 900);
      this.tweens.addCounter({ from: 0, to: 1, duration: 900, ease: 'Linear',
        onUpdate: (tw) => {
          const k = tw.getValue();
          this.leapY = -(s.y - SURFACE_Y + 6) * Math.min(1, k * 3) - Math.sin(Math.PI * k) * 30;
          s.setFrame(Math.floor(k * 18) % 6);
        },
        onComplete: () => { this.leaping = false; this.leapY = 0; splash(this, s.x, 0.8); } });
    } else if (e.kind === 'dash') {
      // it bolts for cover: swipe the other way to turn its head
      this.cover = COVER[e.cover](s);
      this.setHint(`${ARROW[e.need]} SWIPE ${ARROW[e.need]}\nIt's heading for ${COVER_NAME[e.cover]}!`, 1500);
      this.tweens.killTweensOf(this.off);
      const base = this.fightBase();
      this.tweens.add({ targets: this.off, x: this.cover.x - base.x, y: this.cover.y - base.y, duration: 1500, ease: 'Sine.easeIn' });
    } else if (e.kind === 'turned') {
      this.tweens.killTweensOf(this.off);
      this.tweens.add({ targets: this.off, x: 0, y: 0, duration: 400, ease: 'Sine.easeOut' });
      this.setHint('');
      this.pop('Turned it!', INK.gold);
    } else if (e.kind === 'snag') {
      this.setHint(`Snagged in ${COVER_NAME[e.cover]}!`, 1200);
      this.cameras.main.shake(150, 0.006);
      this.time.delayedCall(1200, () => this.off && this.tweens.add({ targets: this.off, x: 0, y: 0, duration: 600, ease: 'Sine.easeInOut' }));
    }
  }

  // What the catch bar just did.
  onBarEvent(e) {
    const s = this.fishSprite;
    if (e.kind === 'chest') {
      this.pop('A chest!', INK.gold);
    } else if (e.kind === 'chestGot') {
      this.pop('Got the chest!', INK.gold);
      bubbles(this, s.x, s.y, 2);
    } else if (e.kind === 'escaping') {
      this.setHint('It\'s getting away!', 1000);
      try { navigator.vibrate?.(40); } catch (err) { /* no vibration */ }
    } else if (e.kind === 'saved') {
      this.setHint('');
    }
  }

  // Where the fish is on its way in: from where it bit to under the pier,
  // by how much line is out.
  fightBase() {
    const f = this.fight;
    const k = clamp(f.distance / f.startDistance, 0, 1.3);
    const near = { x: ANGLER_X - 75, y: SURFACE_Y + 35 };
    return { x: lerp(near.x, this.far.x, k), y: lerp(near.y, this.far.y, k) };
  }

  updateFight(time, dt) {
    const f = this.fight;
    let result;
    const holding = this.input.activePointer.isDown;
    if (BAR) {
      result = f.update(dt, holding);
      for (const e of f.events.splice(0)) this.onBarEvent(e);
      this.angler.crank += holding ? dt * 14 : 0;
      this.angler.lift = holding ? Math.min(3, this.angler.lift + dt * 20) : Math.max(0, this.angler.lift - dt * 20);
      this.bar.update(f, holding);
    } else if (HOLD_REEL) {
      result = f.update(dt, holding);
      if (holding && Math.random() < 0.1) this.angler.reel();
    } else {
      result = f.update(dt);
      for (const e of f.events.splice(0)) this.onFightEvent(e);
    }

    // the fish: on its way in, thrown about by the fight
    const s = this.fishSprite;
    const base = this.fightBase();
    // in the catch bar, the fish's depth in the lake follows its place in the bar
    if (BAR) base.y = lerp(SURFACE_Y + 20, BED_Y - 14, f.fishPos / 540);
    const wob = Math.sin(time / 230) * 5 * f.strength;
    s.x = Math.round(clamp(base.x + this.off.x + wob, 20, W - 30));
    s.y = Math.round(clamp(base.y + this.off.y + Math.cos(time / 310) * 4 * f.strength, SURFACE_Y + 20, BED_Y - 12));
    if (this.leaping) s.y = Math.round(s.y + this.leapY);
    else s.anims.timeScale = 1 + f.pull * 2.5;
    s.setTint(this.leaping ? 0xffffff : depthTint(s.y));

    // the angler leans into it: the rod bends toward the fish with the pull
    this.angler.toward = this.mouth();
    this.angler.bend = clamp(0.25 + f.pull * 0.55 + f.tension / 250, 0, 1);

    // the float is towed along the surface just ahead of the fish
    this.tackle.x = this.mouth().x + 15;
    this.tackle.dip = this.leaping ? 0 : f.tension / 16 + f.pull * 3;

    if (!BAR) this.meter.update(f.tension, f.distance, HOLD_REEL ? null : f.phase);
    if (result === 'caught') this.land();
    else if (result === 'snapped') {
      this.cameras.main.shake(250, 0.01);
      this.lose('SNAP! The line broke.', true);
    } else if (result === 'escaped') this.lose(BAR ? 'It slipped the hook...' : 'It ran off with all your line.');
  }
}
