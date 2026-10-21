import { DEPTH } from '../core/constants.js';
import { RIPPLE_FRAMES } from '../art/FxArt.js';

// Phaser's built-in FX, where they help the scene read: bloom on the sun and
// on the glints of light on the water, a soft vignette over the view, and a
// rippling displacement on the lake so its reflections shimmer. WebGL only.
export class SceneFx {
  constructor(scene, scenery) {
    this.on = scene.sys.game.renderer.type === Phaser.WEBGL;
    if (!this.on) return;
    scenery.sun.disc.postFX.addBloom(0xfff0b0, 1, 1, 1.2, 1.3, 4);

    // the glints share one layer so a single bloom pass lights them all
    this.glints = scene.add.layer().setDepth(DEPTH.WATER_LIFE);
    this.glints.add(scenery.sparkles);
    this.glints.postFX.addBloom(0xfff6dc, 1, 1, 1, 1.6, 3);

    this.ripple = scenery.water.postFX.addDisplacement('water-disp-0', 0.005, 0.0015);
    this.rippleFrame = 0;
    this.rippleAt = 0;

    scene.cameras.main.postFX.addVignette(0.5, 0.5, 0.92, 0.28);
  }

  update(time, wind) {
    if (!this.on) return;
    if (time > this.rippleAt) {
      this.rippleFrame = (this.rippleFrame + 1) % RIPPLE_FRAMES;
      this.ripple.setTexture(`water-disp-${this.rippleFrame}`);
      this.rippleAt = time + 160 - wind * 60;
    }
    // a stiffer breeze roughs the water up
    this.ripple.x = 0.003 + wind * 0.006;
  }
}
