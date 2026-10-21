import { W, BG, SURFACE_Y, BED_Y, DECK_Y, ANGLER_X, DEPTH, STATE, clamp, lerp, textStyle } from '../core/constants.js';
import { ART } from '../core/Assets.js';
import { World } from '../environment/World.js';
import { depthTint } from '../environment/Lake.js';
import { splash, ripple, bubbles } from '../environment/Effects.js';
import { Wildlife } from '../wildlife/Wildlife.js';
import { Angler } from '../player/Angler.js';
import { Tackle } from '../fishing/Tackle.js';
import { ReelFight } from '../fishing/ReelFight.js';
import { pickFish, rollWeight, catchValue } from '../fish/FishSpawner.js';
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
    this.hint = this.add.text(W / 2, 330, '', textStyle(44)).setOrigin(0.5).setDepth(DEPTH.UI);
    this.note = this.add.text(W / 2, 190, '', textStyle(24, '#fff4d6', { wordWrap: { width: W - 80 } })).setOrigin(0.5).setDepth(DEPTH.UI).setAlpha(0);
    this.fishSprite = null;

    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onUp, this);
    this.resetToIdle();
  }

  // ---- messages ------------------------------------------------------------

  setHint(text, fadeAfter = 0) {
    this.tweens.killTweensOf(this.hint);
    this.hint.setText(text).setAlpha(1).setScale(1);
    if (text === 'TAP!') this.tweens.add({ targets: this.hint, scale: 1.25, duration: 120, yoyo: true, repeat: 3 });
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
    const half = (f.width * BG) / 2;
    return { x: f.x + (f.flipX ? half : -half), y: f.y + 2 };
  }

  spawnFish() {
    const id = this.fish.id;
    const fromLeft = this.tackle.x > 160 || Math.random() < 0.6;
    const y = this.tackle.hookY + R(-40, 40);
    this.fishSprite = this.add.sprite(fromLeft ? -140 : W * 0.55, y, `fish-${id}`).setScale(BG).setDepth(DEPTH.FISH).setFlipX(fromLeft).play(`swim-${id}`);
    if (!fromLeft) this.fishSprite.y = BED_Y - 20;
    // it noses up to the bait and hangs there, fins working
    const w = (ART.anchors.fish[id].w * BG) / 2;
    this.hover = { x: this.tackle.x + (fromLeft ? -w - 34 : w + 34), y: this.tackle.hookY + 2 };
    this.tweens.add({ targets: this.fishSprite, x: this.hover.x, y: this.hover.y, duration: 2200, ease: 'Sine.easeOut' });
    this.fishSprite.setFlipX(this.hover.x < this.tackle.x).setTint(depthTint(this.hover.y));
  }

  // A fish that got away bolts off.
  fleeFish() {
    const f = this.fishSprite;
    if (!f) return;
    this.fishSprite = null;
    const dir = f.flipX ? -1 : 1;
    f.setFlipX(dir > 0).anims.timeScale = 3;
    bubbles(this, f.x, f.y, 3);
    this.tweens.add({ targets: f, x: f.x + dir * 700, y: f.y + R(-40, 80), duration: 900, ease: 'Quad.easeIn', onComplete: () => f.destroy() });
  }

  // ---- state changes -------------------------------------------------------

  resetToIdle() {
    this.state = STATE.IDLE;
    this.fight = null;
    this.fish = null;
    if (this.fishSprite) this.fishSprite.destroy();
    this.fishSprite = null;
    this.tackle.show(false);
    this.tackle.dip = 0;
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
    const landX = Math.round(lerp(from.x - 110, 50, power));
    this.angler.cast(() => {
      const start = this.angler.tip;
      t.show(true);
      t.x = start.x;
      t.y = start.y;
      const arc = 120 + power * 220;
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
          t.hookY = SURFACE_Y + 20;
          this.tweens.add({ targets: t, hookY: lerp(SURFACE_Y + 170, Math.min(BED_Y - 70, SURFACE_Y + 560), power), duration: 1400, ease: 'Sine.easeOut' });
          this.startWaiting();
        },
      });
    });
  }

  startWaiting() {
    this.fish = pickFish(this.castPower);
    const now = this.time.now;
    this.biteAt = now + R(3600, 6500);
    this.time.delayedCall(900, () => this.state === STATE.WAITING && this.spawnFish());
    // a couple of nibbles before the real bite keep you guessing
    this.nibbleTimes = [];
    for (let i = 0; i < R(0, 2); i++) this.nibbleTimes.push(R(now + 3300, this.biteAt - 500));
    this.nibbleTimes.sort((a, b) => a - b);
    this.nibbleUntil = 0;
  }

  // The fish darts in and pecks at the bait, tugging the float.
  peck(hard) {
    const f = this.fishSprite;
    if (!f) return;
    const m = this.mouth();
    const dx = this.tackle.x - m.x;
    this.tweens.add({ targets: f, x: f.x + dx * (hard ? 1 : 0.85), y: f.y + (this.tackle.hookY - m.y), duration: hard ? 120 : 160, yoyo: !hard, ease: 'Quad.easeOut' });
  }

  bite() {
    this.state = STATE.BITE;
    this.biteUntil = this.time.now + 1100 - this.fish.strength * 350;
    this.peck(true);
    this.tackle.dip = 16;
    this.tackle.shout(true);
    splash(this, this.tackle.x, 0.4);
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
        f.x = lerp(x0, ANGLER_X + 30, k);
        f.y = lerp(y0, DECK_Y - 40, k) - Math.sin(Math.PI * k) * 220;
        f.rotation = k * 6;
      },
      onComplete: () => f.destroy(),
    });
    f.clearTint();

    const value = catchValue(this.fish, this.weight);
    const { isNew, isRecord } = this.save.recordCatch(this.fish, this.weight, value);
    this.time.delayedCall(750, () => {
      this.hud.coinBurst(ANGLER_X, DECK_Y - 60, value);
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
        this.nibbleUntil = time + 380;
        this.peck(false);
        ripple(this, t.x);
      }
      t.dip = time < this.nibbleUntil ? 6 : 0;
      if (time >= this.biteAt && this.fishSprite) this.bite();
    } else if (this.state === STATE.BITE) {
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
    const near = { x: ANGLER_X - 150, y: SURFACE_Y + 70 };
    const s = this.fishSprite;
    const wob = Math.sin(time / 230) * 26 * f.strength + (f.surging ? (Math.random() - 0.5) * 16 : 0);
    s.x = clamp(lerp(near.x, this.far.x, k) + wob, 40, W - 60);
    s.y = clamp(lerp(near.y, this.far.y, k) + Math.cos(time / 310) * 20 * f.strength, SURFACE_Y + 50, BED_Y - 30);
    s.rotation = Math.sin(time / 160) * 0.12 * (0.4 + f.pull);
    s.anims.timeScale = 1 + f.pull * 2;
    s.setTint(depthTint(s.y));
    if (f.surging && Math.random() < 0.06) bubbles(this, s.x, s.y, 1);

    // the float is towed along the surface just ahead of the fish
    this.tackle.x = this.mouth().x + 30;
    this.tackle.dip = f.tension / 8;

    this.meter.update(f.tension, f.distance);
    if (result === 'caught') this.land();
    else if (result === 'snapped') {
      this.cameras.main.shake(250, 0.01);
      this.lose('SNAP! The line broke.', true);
    } else if (result === 'escaped') this.lose('It ran off with all your line.');
  }
}
