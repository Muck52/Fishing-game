import { DOCK_Y } from '../core/constants.js';

// The figure is drawn for a dock at y=1100 and shifted to the real dock.
const OFFSET = DOCK_Y - 1100;
const HAND = { x: 330, y: 1040 + OFFSET };
const ROD_LENGTH = 260;
const REST_ANGLE = -1.0; // radians; pointing up and out over the water

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.angle = REST_ANGLE;
    this.bend = 0;

    const g = scene.add.graphics();
    // legs
    g.fillStyle(0x2c3e66, 1);
    g.fillRect(252, 1070, 18, 70);
    g.fillRect(280, 1070, 18, 70);
    // boots
    g.fillStyle(0x3b2a1e, 1);
    g.fillRoundedRect(246, 1130, 28, 16, 6);
    g.fillRoundedRect(276, 1130, 28, 16, 6);
    // jacket
    g.fillStyle(0xd9534f, 1);
    g.fillRoundedRect(240, 975, 70, 105, 18);
    // head
    g.fillStyle(0xf1c27d, 1);
    g.fillCircle(275, 945, 30);
    // hat
    g.fillStyle(0x3d5a40, 1);
    g.fillEllipse(275, 925, 92, 18);
    g.fillRoundedRect(250, 893, 50, 34, 12);
    // arm reaching to the rod
    g.lineStyle(16, 0xd9534f, 1);
    g.lineBetween(295, 1000, HAND.x, HAND.y - OFFSET);
    g.setY(OFFSET);

    this.rod = scene.add.graphics();
    this.draw();
  }

  get tip() {
    const a = this.angle + this.bend * 0.55;
    return {
      x: HAND.x + Math.cos(a) * ROD_LENGTH,
      y: HAND.y + Math.sin(a) * ROD_LENGTH + this.bend * 25,
    };
  }

  setBend(bend) {
    this.bend = bend;
  }

  // Swings the rod back over the shoulder, then whips it forward.
  // onRelease fires at the moment the line should fly.
  swing(onRelease) {
    this.scene.tweens.chain({
      targets: this,
      tweens: [
        { angle: -2.2, duration: 180, ease: 'Sine.easeOut' },
        { angle: -0.6, duration: 140, ease: 'Sine.easeIn', onComplete: onRelease },
        { angle: REST_ANGLE, duration: 320, ease: 'Back.easeOut' },
      ],
    });
  }

  draw() {
    const tip = this.tip;
    const mid = { x: (HAND.x + tip.x) / 2, y: (HAND.y + tip.y) / 2 };
    // Bending pushes the middle of the rod up and back, away from the fish.
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(HAND.x, HAND.y),
      new Phaser.Math.Vector2(mid.x - this.bend * 30, mid.y - this.bend * 50),
      new Phaser.Math.Vector2(tip.x, tip.y),
    );
    this.rod.clear();
    this.rod.lineStyle(9, 0x5a3a1e, 1);
    this.rod.strokePoints(curve.getPoints(12).slice(0, 7));
    this.rod.lineStyle(5, 0x7a5230, 1);
    this.rod.strokePoints(curve.getPoints(12).slice(6));
    // reel
    this.rod.fillStyle(0x9aa5ad, 1);
    this.rod.fillCircle(HAND.x + 6, HAND.y + 14, 12);
    this.rod.fillStyle(0x56616a, 1);
    this.rod.fillCircle(HAND.x + 6, HAND.y + 14, 5);
  }
}
