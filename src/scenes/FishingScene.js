import { W, PX, WATER_Y, DOCK_Y, DEPTH, STATE, clamp, lerp, pxScale, textStyle } from '../core/constants.js';
import { Scenery } from '../environment/Scenery.js';
import { splash, ripple } from '../environment/Effects.js';
import { Wildlife } from '../wildlife/Wildlife.js';
import { Player } from '../player/Player.js';
import { Bobber } from '../fishing/Bobber.js';
import { ReelFight } from '../fishing/ReelFight.js';
import { pickFish, rollWeight, catchValue } from '../fish/FishSpawner.js';
import { strokePixels } from '../art/Painter.js';
import { dockAt } from '../art/SceneryArt.js';
import { TensionMeter } from '../ui/TensionMeter.js';
import { Hud } from '../ui/Hud.js';
import { CatchPopup } from '../ui/CatchPopup.js';
import { SaveManager } from '../save/SaveManager.js';

const MIN_SWIPE = 70; // px of upward drag needed to count as a cast
// where a reeled-in fish ends up: just off the lake side of the pier
const NEAR_POINT = { x: W / 2, y: (dockAt(W / 2 / PX).back - 6) * PX };

export class FishingScene extends Phaser.Scene {
  constructor() {
    super('Fishing');
  }

  create() {
    this.save = new SaveManager();

    this.scenery = new Scenery(this);
    this.wildlife = new Wildlife(this, (text) => this.fieldNote(text));
    this.fishShadow = this.add.image(0, 0, 'fishsil-bluegill').setAlpha(0.45).setDepth(DEPTH.WATER_LIFE).setVisible(false);
    this.player = new Player(this);
    this.lineGfx = this.add.graphics().setDepth(DEPTH.LINE);
    this.bobber = new Bobber(this);
    this.hud = new Hud(this);
    this.hud.update(this.save.data);
    this.meter = new TensionMeter(this, W - 52, 760);
    this.popup = new CatchPopup(this);
    this.hint = this.add.text(W / 2, 400, '', textStyle(42)).setOrigin(0.5).setDepth(DEPTH.UI);
    this.note = this.add.text(W / 2, 128, '', textStyle(24, '#fbf3dc', { wordWrap: { width: W - 80 } })).setOrigin(0.5).setDepth(DEPTH.UI).setAlpha(0);

    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onUp, this);

    this.resetToIdle();
  }

  // ---- messages ------------------------------------------------------------

  setHint(text, fadeAfter = 0) {
    this.tweens.killTweensOf(this.hint);
    this.hint.setText(text).setAlpha(1);
    if (fadeAfter) this.tweens.add({ targets: this.hint, alpha: 0, delay: fadeAfter, duration: 400 });
  }

  // Quiet captions about the wildlife, held back while a fish is on.
  fieldNote(text) {
    if (this.state === STATE.REELING || this.state === STATE.BITE || this.state === STATE.RESULT) return;
    this.tweens.killTweensOf(this.note);
    this.note.setText(text).setAlpha(0);
    this.tweens.chain({
      targets: this.note,
      tweens: [
        { alpha: 1, duration: 700 },
        { alpha: 1, duration: 4200 },
        { alpha: 0, duration: 900 },
      ],
    });
  }

  // ---- state changes -------------------------------------------------------

  resetToIdle() {
    this.state = STATE.IDLE;
    this.fight = null;
    this.fish = null;
    this.bobber.show(false);
    this.bobber.mode = 'flight';
    this.fishShadow.setVisible(false);
    this.meter.show(false);
    this.player.setBend(0);
    this.scenery.dogAlert(false);
    this.setHint('Swipe up to cast');
  }

  cast(power, dx) {
    this.state = STATE.CASTING;
    this.castPower = power;
    this.setHint('');

    const land = {
      x: clamp(W / 2 + dx * 0.6, 90, W - 140),
      y: lerp(DOCK_Y - 160, WATER_Y + 40, power),
    };
    this.landing = land;

    this.player.swing(() => {
      const from = this.player.tip;
      this.bobber.mode = 'flight';
      this.bobber.show(true);
      const arc = 160 + power * 260;
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 450 + power * 450,
        onUpdate: (tw) => {
          const t = tw.getValue();
          this.bobber.place(lerp(from.x, land.x, t), lerp(from.y, land.y, t) - Math.sin(Math.PI * t) * arc);
        },
        onComplete: () => {
          this.bobber.place(land.x, land.y);
          this.bobber.mode = 'float';
          splash(this, land.x, land.y);
          this.startWaiting();
        },
      });
    });
  }

  startWaiting() {
    this.state = STATE.WAITING;
    this.fish = pickFish(this.castPower);
    const now = this.time.now;
    this.biteAt = now + Phaser.Math.Between(1800, 5000);
    // A couple of nibbles before the real bite keep you guessing.
    const nibbles = Phaser.Math.Between(0, 2);
    this.nibbleTimes = [];
    for (let i = 0; i < nibbles; i++) {
      this.nibbleTimes.push(Phaser.Math.Between(now + 700, this.biteAt - 700));
    }
    this.nibbleTimes.sort((a, b) => a - b);
    this.nibbleUntil = 0;
  }

  bite() {
    this.state = STATE.BITE;
    this.biteUntil = this.time.now + 1050 - this.fish.strength * 350;
    this.bobber.mode = 'under';
    this.bobber.alert.setVisible(true);
    splash(this, this.bobber.x, this.bobber.y, 0.6);
    this.scenery.dogAlert(true);
    this.setHint('TAP!');
    try {
      navigator.vibrate?.(80);
    } catch (e) {
      // vibration not supported
    }
  }

  hook() {
    this.state = STATE.REELING;
    this.bobber.alert.setVisible(false);
    this.weight = rollWeight(this.fish);
    this.fight = new ReelFight(this.fish, 40 + this.castPower * 60);
    this.meter.show(true);
    this.fishShadow.setTexture(`fishsil-${this.fish.id}`).setVisible(true);
    this.setHint('Hold to reel!\nLet go when the line pulls tight', 2200);
  }

  lose(message) {
    this.state = STATE.RESULT;
    this.bobber.alert.setVisible(false);
    this.meter.show(false);
    this.fishShadow.setVisible(false);
    this.player.setBend(0);
    this.scenery.dogAlert(false);
    this.setHint(message);
    this.time.delayedCall(1600, () => this.resetToIdle());
  }

  land() {
    this.state = STATE.RESULT;
    this.meter.show(false);
    this.fishShadow.setVisible(false);
    this.player.setBend(0);
    splash(this, this.bobber.x, this.bobber.y, 1.4);
    this.bobber.show(false);
    this.setHint('');
    this.scenery.dogAlert(false);
    this.scenery.dogWag();

    const value = catchValue(this.fish, this.weight);
    const { isNew, isRecord } = this.save.recordCatch(this.fish, this.weight, value);
    this.hud.update(this.save.data);
    this.popup.show({ fish: this.fish, weight: this.weight, value, isNew, isRecord, entry: this.save.data.totalCatches });
  }

  // ---- input ---------------------------------------------------------------

  onDown(pointer) {
    this.downAt = { x: pointer.x, y: pointer.y };

    if (this.state === STATE.BITE) {
      this.hook();
    } else if (this.state === STATE.WAITING) {
      if (this.time.now < this.nibbleUntil) {
        this.bobber.show(false);
        this.lose('Too early! You spooked it.');
      } else {
        this.setHint('Wait for the bobber to go under', 1500);
      }
    } else if (this.state === STATE.RESULT && this.popup.canClose) {
      this.popup.hide();
      this.resetToIdle();
    }
  }

  onUp(pointer) {
    if (this.state !== STATE.IDLE || !this.downAt) return;
    const dy = this.downAt.y - pointer.y;
    const dx = pointer.x - this.downAt.x;
    if (dy > MIN_SWIPE) {
      this.cast(clamp(dy / 650, 0.15, 1), dx);
    } else {
      this.setHint('Swipe UP to cast\nLonger swipe, farther cast');
    }
    this.downAt = null;
  }

  // ---- frame loop ----------------------------------------------------------

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.scenery.update(time, dt);
    this.wildlife.update(time, dt);

    if (this.state === STATE.WAITING) {
      if (this.nibbleTimes.length && time >= this.nibbleTimes[0]) {
        this.nibbleTimes.shift();
        this.nibbleUntil = time + 320;
        ripple(this, this.bobber.x, this.bobber.y);
      }
      this.bobber.mode = time < this.nibbleUntil ? 'nibble' : 'float';
      if (time >= this.biteAt) this.bite();
    } else if (this.state === STATE.BITE) {
      if (time > this.biteUntil) {
        this.bobber.show(false);
        this.lose('It got away...');
      }
    } else if (this.state === STATE.REELING) {
      this.updateFight(time, dt);
    }

    this.bobber.render(time);
    this.player.draw();
    this.drawLine();
  }

  updateFight(time, dt) {
    const reeling = this.input.activePointer.isDown;
    const result = this.fight.update(dt, reeling);
    const f = this.fight;

    // Place the fish between the dock and where the bobber landed,
    // drifting past the landing spot if it pulls out more line.
    const t = f.distance / f.startDistance;
    const wobble = Math.sin(time / 260) * 40 * f.strength + (f.surging ? (Math.random() - 0.5) * 14 : 0);
    const x = clamp(lerp(NEAR_POINT.x, this.landing.x, t) + wobble, 60, W - 140);
    const y = clamp(lerp(NEAR_POINT.y, this.landing.y, t), WATER_Y + 25, NEAR_POINT.y);
    const prevX = this.bobber.x;
    this.bobber.place(x, y);
    this.bobber.mode = f.pull > 0.6 ? 'nibble' : 'float';

    const s = pxScale(y);
    this.fishShadow.setPosition(x + Math.sin(time / 180) * 6, y + 8 * s).setScale(Math.max(1, s - 2));
    this.fishShadow.setFlipX(x > prevX);

    this.player.setBend(f.tension / 100);
    this.meter.update(f.tension, f.distance);

    if (result === 'caught') this.land();
    else if (result === 'snapped') {
      this.cameras.main.shake(250, 0.01);
      this.bobber.show(false);
      this.lose('SNAP! The line broke.');
    } else if (result === 'escaped') {
      this.bobber.show(false);
      this.lose('It ran off with all your line.');
    }
  }

  drawLine() {
    this.lineGfx.clear();
    if (!this.bobber.visible) return;

    const tip = this.player.tip;
    const end = this.bobber.top;
    const tension = this.fight ? this.fight.tension / 100 : 0;
    const sag = this.state === STATE.CASTING ? 10 : (1 - tension) * 70;
    const bow = this.scenery.wind.sway(0) * 40 * (1 - tension); // slack line bellies downwind
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(tip.x, tip.y),
      new Phaser.Math.Vector2((tip.x + end.x) / 2 + bow, (tip.y + end.y) / 2 + sag),
      new Phaser.Math.Vector2(end.x, end.y),
    );
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xeef3f0),
      Phaser.Display.Color.ValueToColor(0xff6a55),
      100,
      Math.round(tension * 100),
    );
    strokePixels(this.lineGfx, curve.getPoints(30), Phaser.Display.Color.GetColor(color.r, color.g, color.b), 0.85, PX);
  }
}
