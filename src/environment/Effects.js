import { depthScale } from '../core/constants.js';

export function splash(scene, x, y, size = 1) {
  const s = depthScale(y) * size;

  const ring = scene.add.ellipse(x, y + 6, 40 * s, 14 * s).setStrokeStyle(4, 0xffffff, 0.8);
  scene.tweens.add({
    targets: ring,
    scaleX: 3,
    scaleY: 3,
    alpha: 0,
    duration: 700,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });

  for (let i = 0; i < 10; i++) {
    const drop = scene.add.circle(x, y, (3 + Math.random() * 4) * s, 0xe6f6ff, 0.95);
    const dx = (Math.random() - 0.5) * 90 * s;
    const peak = (40 + Math.random() * 60) * s;
    scene.tweens.add({
      targets: drop,
      x: x + dx,
      y: { value: y - peak, duration: 260, ease: 'Quad.easeOut', yoyo: true },
      alpha: { value: 0, delay: 300, duration: 220 },
      duration: 520,
      onComplete: () => drop.destroy(),
    });
  }
}
