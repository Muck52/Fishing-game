import { DEPTH, pxScale, textStyle } from '../core/constants.js';

const FRAME = { flight: 0, float: 1, nibble: 2, under: 3 };

export class Bobber {
  constructor(scene) {
    this.scene = scene;
    this.x = 0;
    this.y = 0;
    this.mode = 'flight';
    this.sprite = scene.add.sprite(0, 0, 'bobber', 0).setOrigin(0.5, 9.5 / 11).setDepth(DEPTH.BOBBER).setVisible(false);
    this.alert = scene.add.text(0, 0, '!', textStyle(64, '#ffd54f')).setOrigin(0.5, 1).setDepth(DEPTH.BOBBER + 1).setVisible(false);
  }

  get visible() {
    return this.sprite.visible;
  }

  // Where the fishing line attaches: the tip of the antenna.
  get top() {
    const s = pxScale(this.y);
    const rowsAbove = { flight: 9, float: 7, nibble: 5, under: 2 }[this.mode];
    return { x: this.x, y: this.y - rowsAbove * s };
  }

  place(x, y) {
    this.x = x;
    this.y = y;
  }

  show(visible) {
    this.sprite.setVisible(visible);
    if (!visible) this.alert.setVisible(false);
  }

  render(time) {
    const s = pxScale(this.y);
    const bob = this.mode === 'float' && Math.sin(time / 300) > 0.6 ? -s : 0;
    this.sprite.setFrame(FRAME[this.mode]).setScale(s).setPosition(this.x, this.y + bob);
    this.alert.setPosition(this.x, this.y - 12 * s);
  }
}
