import { FG, DECK_Y, ANGLER_X, DEPTH } from '../core/constants.js';
import { ART } from '../core/Assets.js';

// The angler standing at the end of the walkway, facing out over the lake.
// The sprite sheet has him idling with the rod on his shoulder, fishing with
// it held out, and hauling a catch up out of the water.
export class Angler {
  constructor(scene) {
    this.scene = scene;
    this.sprite = scene.add.sprite(ANGLER_X, DECK_Y + FG, 'angler', 0).setOrigin(0.5, 1).setScale(FG).setDepth(DEPTH.ANGLER);
    this.idle();
  }

  // The tip of the rod in the frame showing now, on screen.
  get tip() {
    const a = ART.anchors.angler;
    const i = Phaser.Math.Clamp(Number(this.sprite.frame.name) - a.fish[0], 0, a.tips.length - 1);
    const t = a.tips[i];
    const s = this.sprite;
    return { x: s.x + (t.x - 24) * FG + FG / 2, y: s.y - (48 - t.y) * FG + FG / 2 };
  }

  idle() {
    this.sprite.play('angler-idle');
  }

  fish() {
    this.sprite.play('angler-fish');
  }

  reel(on) {
    this.sprite.play(on ? 'angler-reel' : 'angler-fish', true);
  }

  // Rod back over the shoulder for a beat, then forward; onRelease fires as
  // the line flies.
  cast(onRelease) {
    this.sprite.stop().setFrame(1);
    this.scene.time.delayedCall(170, () => {
      this.sprite.setFrame(ART.anchors.angler.fish[0]);
      onRelease();
      this.scene.time.delayedCall(120, () => this.fish());
    });
  }

  land(onDone) {
    this.sprite.play('angler-land');
    this.sprite.once('animationcomplete', () => {
      this.scene.time.delayedCall(400, () => {
        this.idle();
        onDone?.();
      });
    });
  }

  hurt() {
    this.sprite.stop().setFrame(ART.anchors.angler.hurt);
    this.scene.tweens.add({ targets: this.sprite, x: ANGLER_X + 6, duration: 50, yoyo: true, repeat: 3, onComplete: () => this.sprite.setX(ANGLER_X) });
  }
}
