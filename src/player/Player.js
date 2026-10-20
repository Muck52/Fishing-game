import { PX, DEPTH } from '../core/constants.js';
import { PLAYER } from '../art/SceneryArt.js';
import { PLAYER_HAND } from '../art/sprites.js';
import { strokePixels } from '../art/Painter.js';

const ROD_LENGTH = 330; // a long, slender pole
const REST_ANGLE = -2.0; // radians; pointing up and out to the angler's left

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.angle = REST_ANGLE;
    this.bend = 0;

    const sprite = scene.add.image(PLAYER.x * PX, (PLAYER.y + 1) * PX, 'player').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.PLAYER);
    this.hand = {
      x: sprite.x - (sprite.width * PX) / 2 + PLAYER_HAND.x * PX + PX / 2,
      y: sprite.y - sprite.height * PX + PLAYER_HAND.y * PX + PX / 2,
    };
    this.rod = scene.add.graphics().setDepth(DEPTH.PLAYER + 0.5);
    this.draw();
  }

  get tip() {
    // a fish on the line pulls the tip down and toward it
    const a = this.angle + this.bend * 0.35;
    return {
      x: this.hand.x + Math.cos(a) * ROD_LENGTH,
      y: this.hand.y + Math.sin(a) * ROD_LENGTH + this.bend * 25,
    };
  }

  setBend(bend) {
    this.bend = bend;
  }

  // Swings the pole back over the right shoulder, then whips it forward.
  // onRelease fires at the moment the line should fly.
  swing(onRelease) {
    this.scene.tweens.chain({
      targets: this,
      tweens: [
        { angle: -0.9, duration: 200, ease: 'Sine.easeOut' },
        { angle: -2.4, duration: 150, ease: 'Sine.easeIn', onComplete: onRelease },
        { angle: REST_ANGLE, duration: 320, ease: 'Back.easeOut' },
      ],
    });
  }

  draw() {
    const { hand } = this;
    const tip = this.tip;
    const mid = { x: (hand.x + tip.x) / 2, y: (hand.y + tip.y) / 2 };
    // Bending bows the middle of the pole out, away from the fish.
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(hand.x, hand.y),
      new Phaser.Math.Vector2(mid.x - this.bend * 35, mid.y - this.bend * 20),
      new Phaser.Math.Vector2(tip.x, tip.y),
    );
    const pts = curve.getPoints(24);
    this.rod.clear();
    // a slender pole: one pixel wide, with a short thicker butt in the hands
    strokePixels(this.rod, pts.slice(0, 4).map((p) => ({ x: p.x + PX, y: p.y })), 0x3b2618);
    strokePixels(this.rod, pts, 0x5a3a24);
    strokePixels(this.rod, pts.slice(0, 2), 0xc9a06a); // cork grip
  }
}
