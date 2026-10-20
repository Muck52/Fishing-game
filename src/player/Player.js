import { PX, DOCK_Y, DEPTH } from '../core/constants.js';
import { PLAYER_AX } from '../art/SceneryArt.js';
import { PLAYER_HAND } from '../art/sprites.js';
import { strokePixels } from '../art/Painter.js';

const ROD_LENGTH = 270;
const REST_ANGLE = -1.0; // radians; pointing up and out over the water

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.angle = REST_ANGLE;
    this.bend = 0;

    const sprite = scene.add.image(PLAYER_AX * PX, DOCK_Y + 13 * PX, 'player').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.PLAYER);
    this.hand = {
      x: sprite.x - (sprite.width * PX) / 2 + PLAYER_HAND.x * PX + PX / 2,
      y: sprite.y - sprite.height * PX + PLAYER_HAND.y * PX + PX / 2,
    };
    this.rod = scene.add.graphics().setDepth(DEPTH.PLAYER + 0.5);
    this.draw();
  }

  get tip() {
    const a = this.angle + this.bend * 0.55;
    return {
      x: this.hand.x + Math.cos(a) * ROD_LENGTH,
      y: this.hand.y + Math.sin(a) * ROD_LENGTH + this.bend * 25,
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
    const { hand } = this;
    const tip = this.tip;
    const mid = { x: (hand.x + tip.x) / 2, y: (hand.y + tip.y) / 2 };
    // Bending pushes the middle of the rod up and back, away from the fish.
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(hand.x, hand.y),
      new Phaser.Math.Vector2(mid.x - this.bend * 30, mid.y - this.bend * 50),
      new Phaser.Math.Vector2(tip.x, tip.y),
    );
    const pts = curve.getPoints(24);
    this.rod.clear();
    strokePixels(this.rod, pts.slice(0, 13).map((p) => ({ x: p.x + PX, y: p.y })), 0x3b2618);
    strokePixels(this.rod, pts, 0x7a4f2c);
    strokePixels(this.rod, pts.slice(0, 3), 0xc9a06a); // cork grip
    this.rod.fillStyle(0xb9bdb8, 1);
    this.rod.fillRect(Math.floor(hand.x / PX) * PX, Math.floor(hand.y / PX + 1) * PX, PX * 2, PX * 2); // reel
  }
}
