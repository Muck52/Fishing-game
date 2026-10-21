import { W, SURFACE_Y, BED_Y, DECK_Y, ANGLER_X, HUT_X, DEPTH, STATE, INK, LOOK_UP, clamp, lerp, label, pinToScreen } from '../core/constants.js';
import { ART } from '../core/Assets.js';
import { World } from '../environment/World.js';
import { depthTint } from '../environment/Lake.js';
import { splash, ripple, bubbles } from '../environment/Effects.js';
import { Wildlife } from '../wildlife/Wildlife.js';
import { Angler } from '../player/Angler.js';
import { Tackle } from '../fishing/Tackle.js';
import { ReelFight } from '../fishing/ReelFight.js';
import { RhythmFight } from '../fishing/RhythmFight.js';
import { BarFight } from '../fishing/BarFight.js';
import { pickFish, rollWeight, catchValue } from '../fish/FishSpawner.js';
import { Striker, strikeOf } from '../fish/Strike.js';
import { FISH } from '../../data/fish/fish.js';
import { TensionMeter } from '../ui/TensionMeter.js';
import { pill } from '../ui/Panels.js';
import { FishBar } from '../ui/FishBar.js';
import { Hud } from '../ui/Hud.js';
import { CatchPopup } from '../ui/CatchPopup.js';
import { Backpack } from '../ui/Backpack.js';
import { SaveManager } from '../save/SaveManager.js';

const MIN_SWIPE = 70; // px of upward drag needed to count as a cast
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

export class FishingScene extends Phaser.Scene {
  constructor() {
    super('Fishing');
  }

  create() {
    this.save = new SaveManager();
    this.world = new World(this);
    this.wildlife = new Wildlife(this, (text) => this.fieldNote(text));
    this.angler = new Angler(this);
    this.tackle = new Tackle(this);
    this.hud = new Hud(this);
    this.hud.update(this.save.data);
    this.meter = new TensionMeter(this);
    this.bar = new FishBar(this);
    this.popup = new CatchPopup(this);
    this.bag = new Backpack(this, this.save, () => this.state === STATE.IDLE);
    // hints sit on a little wooden plaque, like the counters
    this.plaque = pill(this, W / 2, 165, 40, 20).setDepth(DEPTH.UI).setVisible(false);
    this.hint = label(this, W / 2, 165, '', { font: 'head', size: 2 }).setDepth(DEPTH.UI);
    this.note = label(this, W / 2, 95, '', { width: W - 40 }).setDepth(DEPTH.UI).setAlpha(0);
    this.fishSprite = null;

    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onUp, this);
    pinToScreen(this);
    this.cameras.main.scrollY = -LOOK_UP;
    this.resetToIdle();
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

  // Quiet captions about the wildlife, held back while a fish is on.
  fieldNote(text) {
    if (this.state !== STATE.IDLE && this.state !== STATE.WAITING) return;
    this.tweens.killTweensOf(this.note);
    this.note.setText(text).setAlpha(0);
    this.tweens.chain({ targets: this.note, tweens: [{ alpha: 1, duration: 700 }, { alpha: 1, duration: 4200 }, { alpha: 0, duration: 900 }] });
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
    this.striker = new Striker(this, this.fish, this.tackle);
    this.fishSprite = this.striker.sprite;
  }

  // A fish that got away bolts off.
  fleeFish() {
    this.striker?.flee();
    this.striker = null;
    this.fishSprite = null;
  }

  // ---- state changes -------------------------------------------------------

  // A slow, steady pan of the camera: up to the sky while you're idle, down
  // to the whole lake once the line is out.
  pan(to, duration) {
    const cam = this.cameras.main;
    this.tweens.killTweensOf(cam);
    this.tweens.add({ targets: cam, scrollY: to, duration, ease: 'Sine.easeInOut' });
  }

  resetToIdle() {
    this.pan(-LOOK_UP, 2400);
    this.state = STATE.IDLE;
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
    this.setHint('Swipe up to cast');
  }

  cast(power) {
    this.pan(0, 2600);
    this.state = STATE.CASTING;
    this.castPower = power;
    this.setHint('');
    const t = this.tackle;
    const from = this.angler.tip;
    const landX = Math.round(lerp(from.x - 55, 25, power));
    this.angler.cast(() => {
      const start = this.angler.tip;
      t.show(true);
      t.x = start.x;
      t.y = start.y;
      const arc = 60 + power * 110;
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 500 + power * 450,
        onUpdate: (tw) => {
          const k = tw.getValue();
          t.x = lerp(start.x, landX, k);
          t.y = lerp(start.y, SURFACE_Y, k) - Math.sin(Math.PI * k) * arc;
        },
        onComplete: () => {
          t.x = landX;
          splash(this, landX, 0.6);
          this.state = STATE.WAITING;
          // the bait sinks; a longer cast reaches deeper water
          t.hookY = SURFACE_Y + 10;
          this.tweens.add({ targets: t, hookY: Math.round(lerp(SURFACE_Y + 85, Math.min(BED_Y - 35, SURFACE_Y + 280), power)), duration: 1400, ease: 'Sine.easeOut' });
          this.startWaiting();
        },
      });
    });
  }

  startWaiting() {
    // ?fish=walleye in the address forces a species, for trying them out
    const forced = FISH.find((f) => f.id === new URLSearchParams(window.location.search).get('fish'));
    this.fish = forced || pickFish(this.castPower);
    const now = this.time.now;
    this.time.delayedCall(900, () => this.state === STATE.WAITING && this.spawnFish());
    // The fish takes about two and a half seconds to arrive. Then come the
    // fake-out nibbles that keep you guessing, as many as the species tends
    // to make (a pike never nibbles, a bluegill pecks and pecks), each a
    // second or so apart, and then the real bite.
    const [lo, hi] = strikeOf(this.fish.id).nibbles;
    this.nibbleTimes = [];
    let at = now + 3500 + R(0, 600);
    for (let i = R(lo, hi); i > 0; i--) {
      this.nibbleTimes.push(at);
      at += R(800, 1400);
    }
    this.biteAt = at + R(300, 1200);
    this.nibbleUntil = 0;
  }

  bite() {
    this.state = STATE.BITE;
    this.biteUntil = this.time.now + 1100 - this.fish.strength * 350;
    this.striker.strike();
    this.angler.bite();
    this.tackle.shout(true);
    // the float plunges for a hard taker; a soft taker barely stirs it
    const d = this.striker.dip;
    if (d >= 9) splash(this, this.tackle.x, 0.2 + d / 30);
    else ripple(this, this.tackle.x);
    this.setHint('TAP!');
    try {
      navigator.vibrate?.(80);
    } catch (e) {
      // vibration not supported
    }
  }

  hook() {
    this.state = STATE.REELING;
    this.tackle.shout(false);
    this.tweens.killTweensOf(this.note);
    this.note.setAlpha(0);
    this.weight = rollWeight(this.fish);
    const start = 40 + this.castPower * 60;
    this.fight = BAR ? new BarFight(this.fish, start) : HOLD_REEL ? new ReelFight(this.fish, start) : new RhythmFight(this.fish, start);
    this.far = { x: this.tackle.x, y: this.tackle.hookY };
    this.off = { x: 0, y: 0 }; // where the fight throws the fish, off its line toward the pier
    if (BAR) this.bar.show(true, this.fishSprite);
    else this.meter.show(true);
    this.angler.fight();
    this.striker.hooked();
    this.tackle.shake = 0;
    this.fishSprite.setFlipX(true);
    this.setHint(BAR ? 'Hold to raise the bar\nKeep the fish in it!' : HOLD_REEL ? 'Hold to reel!\nLet go when the line pulls tight' : 'Tap just after\neach tug!', 2400);
  }

  lose(message, snapped = false) {
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
    if (bonus.length) this.pop(bonus.join('  '), INK.gold);
    const { isNew, isRecord } = this.save.recordCatch(this.fish, this.weight, value);
    this.time.delayedCall(750, () => {
      this.hud.coinBurst(ANGLER_X, DECK_Y - 30, value);
      this.hud.update(this.save.data);
      this.popup.show({ fish: this.fish, weight: this.weight, value, isNew, isRecord, entry: this.save.data.totalCatches });
    });
  }

  // ---- input ---------------------------------------------------------------

  onDown(pointer) {
    if (this.bag.isOpen) {
      // a tap outside the open backpack closes it
      this.bag.close();
      this.downAt = null;
      return;
    }
    this.downAt = { x: pointer.x, y: pointer.y };
    if (this.state === STATE.REELING) {
      if (RHYTHM) this.fight.tap();
    } else if (this.state === STATE.BITE) {
      this.hook();
    } else if (this.state === STATE.WAITING) {
      if (this.time.now < this.nibbleUntil) this.lose('Too early! You spooked it.');
      else this.setHint('Wait for the float to go under', 1500);
    } else if (this.state === STATE.RESULT && this.popup.canClose) {
      this.popup.hide();
      this.resetToIdle();
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
    if (this.state !== STATE.IDLE || !this.downAt) return;
    const dy = this.downAt.y - pointer.y;
    if (dy > MIN_SWIPE) this.cast(clamp(dy / 650, 0.15, 1));
    else this.setHint('Swipe UP to cast\nLonger swipe, farther cast');
    this.downAt = null;
  }

  // ---- frame loop ----------------------------------------------------------

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.world.update(time, dt);
    this.wildlife.update(time);
    this.angler.update(time);
    this.bag.update(dt);
    const t = this.tackle;

    if (this.state === STATE.WAITING) {
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
