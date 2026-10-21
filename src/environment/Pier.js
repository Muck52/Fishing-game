import { W, SURFACE_Y, DECK_Y, BED_Y, HUT_X, DEPTH } from '../core/constants.js';
import { ART } from '../core/Assets.js';
import { tinyRipple } from './Effects.js';

// The fishing hut on the right, standing on stilts in the lake, with its
// walkway running out over the water. The stilts carry on down, dark and
// wet, to the lakebed. A rowboat is tied up beside it and cattails grow
// along the bank on the left.
export class Pier {
  constructor(scene) {
    this.scene = scene;
    const hut = ART.anchors.hut;
    const top = DECK_Y - hut.deck;
    scene.add.image(HUT_X, top, 'hut').setOrigin(0).setDepth(DEPTH.PIER);
    const below = top + hut.h;
    for (const sx of hut.stilts) {
      for (let y = below; y < BED_Y + 10; y += 64) {
        scene.add.image(Math.round(HUT_X + sx), y, 'post-wet').setOrigin(0.5, 0).setDepth(DEPTH.POSTS).setTint(0x6f8a8c).setAlpha(0.9);
      }
    }
    // a barrel of the day's catch on the walkway, behind the angler
    scene.add.image(HUT_X + 70, DECK_Y, 'barrel').setOrigin(0.5, 1).setDepth(DEPTH.PIER + 0.1);
    // where the hut's windows light up after dark (see Daylight.js)
    this.hutAt = { x: HUT_X, y: top };

    // the rowboat rides the same swell as the surface: it rises and falls
    // with it and rocks through its tilted frames, never rotated
    this.boat = scene.add.sprite(W - 35, SURFACE_Y + 19, 'boat', 0).setOrigin(0.5, 1).setDepth(DEPTH.BOAT);
    this.boatY = this.boat.y;
    this.tilt = 0;

    [[-6, 2], [18, 3], [40, 4]].forEach(([x, k], i) => {
      scene.add.sprite(x, SURFACE_Y + 9, `cattails-${k}`).setOrigin(0, 1).setDepth(DEPTH.REEDS).play({ key: `sway-cattails-${k}`, startFrame: i });
    });
  }

  update(time) {
    const b = this.boat;
    b.y = this.boatY + Math.round(Math.sin(time / 900));
    const c = Math.cos(time / 900);
    const tilt = c > 0.45 ? 1 : c < -0.45 ? 3 : 0;
    if (tilt !== this.tilt) {
      b.setFrame(tilt);
      // each roll sends a ripple off the end that dips
      if (tilt) tinyRipple(this.scene, b.x + (tilt === 1 ? 30 : -30));
      this.tilt = tilt;
    }
  }
}
