import { W, PX, DEPTH, inkStyle } from '../core/constants.js';
import { FISH } from '../../data/fish/fish.js';

const TOP = 18;
const STYLE = inkStyle(32, '#fbf3dc', { shadow: { offsetX: 0, offsetY: 3, color: '#36210f', blur: 0, fill: true } });

// Two wooden signboards: coins on the left, species found on the right.
export class Hud {
  constructor(scene) {
    const add = (o) => o.setDepth(DEPTH.UI);
    add(scene.add.image(18, TOP, 'panel-hud-l').setOrigin(0).setScale(PX));
    add(scene.add.image(18 + 4 * PX, TOP + 3 * PX, 'coin').setOrigin(0).setScale(PX));
    this.coins = add(scene.add.text(18 + 16 * PX, TOP + 7.5 * PX, '', STYLE).setOrigin(0, 0.5));

    const rx = W - 18 - 64 * PX;
    add(scene.add.image(rx, TOP, 'panel-hud-r').setOrigin(0).setScale(PX));
    add(scene.add.image(rx + 4 * PX, TOP + 4 * PX, 'fish-icon').setOrigin(0).setScale(PX));
    this.species = add(scene.add.text(rx + 19 * PX, TOP + 7.5 * PX, '', STYLE).setOrigin(0, 0.5));
  }

  update(save) {
    this.coins.setText(String(save.coins));
    this.species.setText(`${Object.keys(save.species).length} / ${FISH.length}`);
  }
}
