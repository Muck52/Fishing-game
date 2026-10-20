import { PX, DEPTH } from '../core/constants.js';
import { SUN } from '../art/SceneryArt.js';

const RAY_ALPHA = 0.3;

// The low morning sun: a breathing corona and slow-turning shafts of light
// that fade when a cloud drifts across its face.
export class Sun {
  constructor(scene) {
    const x = SUN.x * PX + PX / 2;
    const y = SUN.y * PX + PX / 2;
    this.x = x;
    this.y = y;
    this.glow = scene.add.sprite(x, y, 'sun-glow', 0).setScale(PX).setDepth(DEPTH.SKY + 0.4);
    this.disc = scene.add.image(x, y, 'sun').setScale(PX).setDepth(DEPTH.SKY + 0.5);
    this.rays = [0, 1].map(() => scene.add.sprite(x, y, 'sun-rays', 0).setScale(PX).setDepth(DEPTH.MIST_FAR + 0.5).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD));
    this.rays[1].setFrame(1);
    this.frame = 0;
    this.blend = 0; // crossfade from rays[0] to rays[1]
    this.dim = 1;
    this.lastGlowFrame = 0;
  }

  covered(clouds) {
    return clouds.some((c) => this.x > c.x && this.x < c.x + c.width * PX && this.y > c.y && this.y < c.y + c.height * PX);
  }

  update(time, dt, clouds) {
    this.dim += ((this.covered(clouds) ? 0.3 : 1) - this.dim) * Math.min(1, dt * 1.5);

    // corona swells and settles, its dither pattern shifting as it does
    const breath = Math.sin(time / 1500);
    this.glow.setAlpha((0.7 + 0.3 * breath) * (0.4 + 0.6 * this.dim));
    const glowFrame = breath > 0 ? 1 : 0;
    if (glowFrame !== this.lastGlowFrame) this.glow.setFrame((this.lastGlowFrame = glowFrame));
    this.disc.setAlpha(0.85 + 0.15 * this.dim);

    // rays turn by crossfading through four slightly rotated frames
    this.blend += dt / 3;
    if (this.blend >= 1) {
      this.blend = 0;
      this.frame = (this.frame + 1) % 4;
      this.rays.reverse();
      this.rays[1].setFrame((this.frame + 1) % 4);
    }
    const a = RAY_ALPHA * this.dim * (0.85 + 0.15 * breath);
    this.rays[0].setFrame(this.frame).setAlpha(a * (1 - this.blend));
    this.rays[1].setAlpha(a * this.blend);
  }
}
