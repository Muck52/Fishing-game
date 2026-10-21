import { W, SURFACE_Y, BED_Y, DECK_Y, ANGLER_X, DEPTH, STATE, INK, clamp, lerp, label } from '../core/constants.js';
import { ART } from '../core/Assets.js';
import { World } from '../environment/World.js';
import { depthTint } from '../environment/Lake.js';
import { splash, ripple, bubbles } from '../environment/Effects.js';
import { Wildlife } from '../wildlife/Wildlife.js';
import { Angler } from '../player/Angler.js';
import { Tackle } from '../fishing/Tackle.js';
import { ReelFight } from '../fishing/ReelFight.js';
import { pickFish, rollWeight, catchValue } from '../fish/FishSpawner.js';
import { Striker, strikeOf } from '../fish/Strike.js';
import { FISH } from '../../data/fish/fish.js';
import { TensionMeter } from '../ui/TensionMeter.js';
import { Hud } from '../ui/Hud.js';
import { CatchPopup } from '../ui/CatchPopup.js';
import { SaveManager } from '../save/SaveManager.js';

const MIN_SWIPE = 70; // px of upward drag needed to count as a cast
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
    this.popup = new CatchPopup(this);
    this.hint = label(this, W / 2, 165, '', { font: 'head', size: 2 }).setDepth(DEPTH.UI);
    this.note = label(this, W / 2, 95, '', { width: W - 40 }).setDepth(DEPTH.UI).setAlpha(0);
    this.fishSprite = null;

    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onUp, this);
    this.resetToIdle();
  }

  // ---- messages ------------------------------------------------------------

  setHint(text, fadeAfter = 0) {
    this.tweens.killTweensOf(this.hint);
    this.hint.setText(text).setAlpha(1).setFontSize(text.length > 12 ? 16 : 32).setTint(text === 'TAP!' ? INK.gold : INK.cream);
    if (text === 'TAP!') this.tweens.add({ targets: this.hint, alpha: 0.4, duration: 90, yoyo: true, repeat: 3 });
    if (fadeAfter) this.tweens.add({ targets: this.hint, alpha: 0, delay: fadeAfter, duration: 400 });
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

  resetToIdle() {
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
    this.fight = new ReelFight(this.fish, 40 + this.castPower * 60);
    this.far = { x: this.tackle.x, y: this.tackle.hookY };
    this.meter.show(true);
    this.angler.reel(false);
    this.striker.hooked();
    this.tackle.shake = 0;
    this.fishSprite.setFlipX(true);
    this.setHint('Hold to reel!\nLet go when the line pulls tight', 2200);
  }

  lose(message, snapped = false) {
    this.state = STATE.RESULT;
    this.tackle.show(false);
    this.meter.show(false);
    this.fleeFish();
    if (snapped) this.angler.hurt();
    this.setHint(message);
    this.time.delayedCall(1700, () => this.resetToIdle());
  }

  land() {
    this.state = STATE.RESULT;
    this.meter.show(false);
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

    const value = catchValue(this.fish, this.weight);
    const { isNew, isRecord } = this.save.recordCatch(this.fish, this.weight, value);
    this.time.delayedCall(750, () => {
      this.hud.coinBurst(ANGLER_X, DECK_Y - 30, value);
      this.hud.update(this.save.data);
      this.popup.show({ fish: this.fish, weight: this.weight, value, isNew, isRecord, entry: this.save.data.totalCatches });
    });
  }

  // ---- input ---------------------------------------------------------------

  onDown(pointer) {
    this.downAt = { x: pointer.x, y: pointer.y };
    if (this.state === STATE.BITE) {
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

  updateFight(time, dt) {
    const reeling = this.input.activePointer.isDown;
    const result = this.fight.update(dt, reeling);
    const f = this.fight;
    this.angler.reel(reeling);

    // the fish is dragged from where it bit toward the foot of the pier,
    // fighting up and down and running back out when it surges
    const k = clamp(f.distance / f.startDistance, 0, 1.3);
    const near = { x: ANGLER_X - 75, y: SURFACE_Y + 35 };
    const s = this.fishSprite;
    const wob = Math.sin(time / 230) * 13 * f.strength + (f.surging ? (Math.random() - 0.5) * 8 : 0);
    s.x = Math.round(clamp(lerp(near.x, this.far.x, k) + wob, 20, W - 30));
    s.y = Math.round(clamp(lerp(near.y, this.far.y, k) + Math.cos(time / 310) * 10 * f.strength, SURFACE_Y + 25, BED_Y - 15));
    s.anims.timeScale = 1 + f.pull * 2;
    s.setTint(depthTint(s.y));
    if (f.surging && Math.random() < 0.06) bubbles(this, s.x, s.y, 1);

    // the float is towed along the surface just ahead of the fish
    this.tackle.x = this.mouth().x + 15;
    this.tackle.dip = f.tension / 16;

    this.meter.update(f.tension, f.distance);
    if (result === 'caught') this.land();
    else if (result === 'snapped') {
      this.cameras.main.shake(250, 0.01);
      this.lose('SNAP! The line broke.', true);
    } else if (result === 'escaped') this.lose('It ran off with all your line.');
  }
}
