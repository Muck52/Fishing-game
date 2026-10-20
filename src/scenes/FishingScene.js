import { W, WATER_Y, DOCK_Y, STATE, clamp, lerp, depthScale, textStyle } from '../core/constants.js';
import { drawScenery } from '../environment/Scenery.js';
import { splash } from '../environment/Effects.js';
import { Player } from '../player/Player.js';
import { Bobber } from '../fishing/Bobber.js';
import { ReelFight } from '../fishing/ReelFight.js';
import { pickFish, rollWeight, catchValue } from '../fish/FishSpawner.js';
import { TensionMeter } from '../ui/TensionMeter.js';
import { Hud } from '../ui/Hud.js';
import { CatchPopup } from '../ui/CatchPopup.js';
import { SaveManager } from '../save/SaveManager.js';

const MIN_SWIPE = 70; // px of upward drag needed to count as a cast
const NEAR_POINT = { x: W / 2, y: DOCK_Y - 50 }; // where a reeled-in fish ends up

export class FishingScene extends Phaser.Scene {
  constructor() {
    super('Fishing');
  }

  create() {
    this.save = new SaveManager();

    drawScenery(this);
    this.fishShadow = this.add.ellipse(0, 0, 110, 34, 0x061a28, 0.45).setVisible(false);
    this.lineGfx = this.add.graphics();
    this.player = new Player(this);
    this.bobber = new Bobber(this);
    this.hud = new Hud(this);
    this.hud.update(this.save.data);
    this.meter = new TensionMeter(this, W - 62, 700);
    this.popup = new CatchPopup(this);
    this.hint = this.add.text(W / 2, 400, '', textStyle(44)).setOrigin(0.5).setDepth(50);

    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onUp, this);

    this.resetToIdle();
  }

  // ---- state changes -------------------------------------------------------

  setHint(text, fadeAfter = 0) {
    this.tweens.killTweensOf(this.hint);
    this.hint.setText(text).setAlpha(1);
    if (fadeAfter) this.tweens.add({ targets: this.hint, alpha: 0, delay: fadeAfter, duration: 400 });
  }

  resetToIdle() {
    this.state = STATE.IDLE;
    this.fight = null;
    this.fish = null;
    this.bobber.show(false);
    this.bobber.inWater = false;
    this.bobber.dip = 0;
    this.fishShadow.setVisible(false);
    this.meter.show(false);
    this.player.setBend(0);
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
      this.bobber.show(true);
      this.bobber.inWater = false;
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
          this.bobber.inWater = true;
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
    this.bobber.dip = 26;
    this.bobber.alert.setVisible(true);
    splash(this, this.bobber.x, this.bobber.y, 0.6);
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
    this.fishShadow.setVisible(true);
    this.setHint('Hold to reel!\nLet go if the line gets too tight', 2200);
  }

  lose(message) {
    this.state = STATE.RESULT;
    this.bobber.alert.setVisible(false);
    this.meter.show(false);
    this.fishShadow.setVisible(false);
    this.player.setBend(0);
    this.setHint(message);
    this.time.delayedCall(1500, () => this.resetToIdle());
  }

  land() {
    this.state = STATE.RESULT;
    this.meter.show(false);
    this.fishShadow.setVisible(false);
    this.player.setBend(0);
    splash(this, this.bobber.x, this.bobber.y, 1.4);
    this.bobber.show(false);
    this.setHint('');

    const value = catchValue(this.fish, this.weight);
    const { isNew, isRecord } = this.save.recordCatch(this.fish, this.weight, value);
    this.hud.update(this.save.data);
    this.popup.show({ fish: this.fish, weight: this.weight, value, isNew, isRecord });
  }

  // ---- input ---------------------------------------------------------------

  onDown(pointer) {
    this.downAt = { x: pointer.x, y: pointer.y };

    if (this.state === STATE.BITE) {
      this.hook();
    } else if (this.state === STATE.WAITING) {
      if (this.time.now < this.nibbleUntil) {
        this.lose('Too early! You scared it off.');
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
      this.setHint('Swipe UP to cast\nLonger swipe = farther cast');
    }
    this.downAt = null;
  }

  // ---- frame loop ----------------------------------------------------------

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;

    if (this.state === STATE.WAITING) {
      if (this.nibbleTimes.length && time >= this.nibbleTimes[0]) {
        this.nibbleTimes.shift();
        this.nibbleUntil = time + 320;
        this.bobber.inWater && splash(this, this.bobber.x, this.bobber.y, 0.3);
      }
      this.bobber.dip = time < this.nibbleUntil ? 9 : 0;
      if (time >= this.biteAt) this.bite();
    } else if (this.state === STATE.BITE) {
      this.bobber.dip = 26 + Math.sin(time / 40) * 4;
      if (time > this.biteUntil) this.lose('It got away...');
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
    const y = clamp(lerp(NEAR_POINT.y, this.landing.y, t), WATER_Y + 25, DOCK_Y - 40);
    this.bobber.place(x, y);
    this.bobber.dip = 12 + f.pull * 10;

    const s = depthScale(y);
    this.fishShadow.setPosition(x + Math.sin(time / 180) * 10, y + 30 * s).setScale(s);
    this.fishShadow.rotation = Math.sin(time / 300) * 0.3;

    this.player.setBend(f.tension / 100);
    this.meter.update(f.tension, f.distance);

    if (result === 'caught') this.land();
    else if (result === 'snapped') {
      this.cameras.main.shake(250, 0.01);
      this.bobber.show(false);
      this.lose('SNAP! The line broke.');
    } else if (result === 'escaped') {
      this.bobber.show(false);
      this.lose('It swam away with your line out.');
    }
  }

  drawLine() {
    this.lineGfx.clear();
    if (!this.bobber.container.visible) return;

    const tip = this.player.tip;
    const end = { x: this.bobber.x, y: this.bobber.y + this.bobber.dip - 16 * depthScale(this.bobber.y) };
    const tension = this.fight ? this.fight.tension / 100 : 0;
    const sag = this.state === STATE.CASTING ? 10 : (1 - tension) * 70;
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(tip.x, tip.y),
      new Phaser.Math.Vector2((tip.x + end.x) / 2, (tip.y + end.y) / 2 + sag),
      new Phaser.Math.Vector2(end.x, end.y),
    );
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xf2f2f2),
      Phaser.Display.Color.ValueToColor(0xff5a4f),
      100,
      Math.round(tension * 100),
    );
    this.lineGfx.lineStyle(3, Phaser.Display.Color.GetColor(color.r, color.g, color.b), 0.9);
    this.lineGfx.strokePoints(curve.getPoints(20));
  }
}
