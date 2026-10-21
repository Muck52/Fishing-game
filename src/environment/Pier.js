import { W, FG, SURFACE_Y, DECK_Y, BED_Y, HUT_X, DEPTH } from '../core/constants.js';
import { ART } from '../core/Assets.js';

// The fishing hut on the right, standing on stilts in the lake, with its
// walkway running out over the water. The stilts carry on down, dark and
// wet, to the lakebed. A rowboat is tied up beside it and cattails grow
// along the bank on the left.
export class Pier {
  constructor(scene) {
    const hut = ART.anchors.hut;
    const top = DECK_Y - hut.deck * FG;
    scene.add.image(HUT_X, top, 'hut').setOrigin(0).setScale(FG).setDepth(DEPTH.PIER);
    const below = top + hut.h * FG;
    for (const sx of hut.stilts) {
      for (let y = below; y < BED_Y + 20; y += 64 * FG) {
        scene.add.image(HUT_X + sx * FG, y, 'post-wet').setOrigin(0.5, 0).setScale(FG).setDepth(DEPTH.POSTS).setTint(0x6f8a8c).setAlpha(0.9);
      }
    }
    // a barrel of the day's catch on the walkway, behind the angler
    scene.add.image(HUT_X + 70 * FG, DECK_Y, 'barrel').setOrigin(0.5, 1).setScale(FG).setDepth(DEPTH.PIER + 0.1);

    this.boat = scene.add.image(W - 70, SURFACE_Y + 26, 'boat').setOrigin(0.5, 1).setScale(FG).setDepth(DEPTH.BOAT);
    this.boatY = this.boat.y;

    this.reeds = [[-14, 2], [40, 3], [84, 4]].map(([x, k], i) =>
      scene.add.image(x, SURFACE_Y + 18, `cattails-${k}`).setOrigin(0, 1).setScale(FG).setDepth(DEPTH.REEDS).setData('phase', i * 1.3),
    );
  }

  update(time, wind) {
    this.boat.y = this.boatY + Math.round(Math.sin(time / 900) * 2) * 2;
    this.boat.rotation = Math.sin(time / 1300) * 0.025;
    for (const r of this.reeds) r.rotation = (Math.sin(time / 1100 + r.getData('phase')) * 0.025 + wind * 0.05);
  }
}
