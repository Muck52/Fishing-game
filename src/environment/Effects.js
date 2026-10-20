import { PX, DEPTH, pxScale } from '../core/constants.js';

// An expanding ring on the water.
export function ripple(scene, x, y, depth = DEPTH.WATER_LIFE) {
  const r = scene.add.sprite(x, y, 'ripple').setScale(pxScale(y)).setDepth(depth).play('ripple');
  r.on('animationcomplete', () => r.destroy());
  return r;
}

// Ring plus a burst of chunky droplets.
export function splash(scene, x, y, size = 1) {
  const s = pxScale(y);
  ripple(scene, x, y + s, DEPTH.WATER_LIFE + 0.5);
  const drops = Math.round(4 + 6 * size);
  for (let i = 0; i < drops; i++) {
    const d = PX * (Math.random() < 0.3 ? 2 : 1) * (s / PX);
    const drop = scene.add.rectangle(x, y, d, d, 0xe6f2ee).setDepth(DEPTH.BOBBER + 1);
    const peak = (6 + Math.random() * 12) * s * size;
    scene.tweens.add({
      targets: drop,
      x: x + (Math.random() - 0.5) * 16 * s * size,
      y: { value: y - peak, duration: 240, ease: 'Quad.easeOut', yoyo: true },
      alpha: { value: 0, delay: 280, duration: 200 },
      duration: 500,
      onComplete: () => drop.destroy(),
    });
  }
}
