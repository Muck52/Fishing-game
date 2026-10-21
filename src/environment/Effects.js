import { SURFACE_Y, DEPTH } from '../core/constants.js';

// One-off water effects shared by the scenes.

// An expanding ring where something touches the surface.
export function ripple(scene, x) {
  const r = scene.add.sprite(x, SURFACE_Y + 1, 'ripple').setDepth(DEPTH.BOBBER - 0.5).setAlpha(0.8).play('ripple');
  r.on('animationcomplete', () => r.destroy());
}

// A very small ripple: two glints spreading apart on the surface.
export function tinyRipple(scene, x, y = SURFACE_Y + 7) {
  const r = scene.add.sprite(Math.round(x), y, 'ripple-tiny').setDepth(DEPTH.SURFACE + 0.2).play('ripple-tiny');
  r.on('animationcomplete', () => r.destroy());
}

// One droplet emitter per scene, shared by every splash.
function drops(scene) {
  if (!scene.splashDrops?.scene) {
    scene.splashDrops = scene.add.particles(0, 0, 'drop', {
      emitting: false,
      lifespan: { min: 450, max: 750 },
      speed: { onEmit: (p) => (45 + Math.random() * 85) * p.emitter.size },
      angle: { min: 235, max: 305 },
      gravityY: 450,
      scale: { onEmit: () => (Math.random() < 0.35 ? 2 : 1) },
      alpha: { start: 1, end: 0.2 },
    }).setDepth(DEPTH.SPLASH);
  }
  return scene.splashDrops;
}

// A crown of water thrown up from the surface, with droplets and a ring.
export function splash(scene, x, size = 1) {
  const s = scene.add.sprite(x, SURFACE_Y + 2, 'splash').setOrigin(0.5, 1).setDepth(DEPTH.SPLASH).play('splash');
  s.on('animationcomplete', () => s.destroy());
  ripple(scene, x);
  const e = drops(scene);
  e.size = size;
  e.explode(Math.round(6 + 10 * size), x, SURFACE_Y);
  bubbles(scene, x, SURFACE_Y + 10, Math.round(3 + 5 * size));
}

// A few bubbles that wobble up and pop at the surface.
export function bubbles(scene, x, y, n = 4) {
  for (let i = 0; i < n; i++) {
    const b = scene.add.sprite(x + Phaser.Math.Between(-7, 7), y + Phaser.Math.Between(0, 15), 'bubble', 0).setDepth(DEPTH.BUBBLES).play({ key: 'bubble-pop', startFrame: i % 3 });
    const rise = (b.y - SURFACE_Y - 4) / 35;
    scene.tweens.add({ targets: b, y: SURFACE_Y + 4, duration: rise * 1000, ease: 'Sine.easeIn', onComplete: () => b.destroy() });
    scene.tweens.add({ targets: b, x: b.x + Phaser.Math.Between(-6, 6), duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}
