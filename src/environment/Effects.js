import { FG, BG, SURFACE_Y, DEPTH } from '../core/constants.js';

// One-off water effects shared by the scenes.

// An expanding ring where something touches the surface.
export function ripple(scene, x, scale = BG) {
  const r = scene.add.sprite(x, SURFACE_Y + 2, 'ripple').setScale(scale, scale * 0.45).setDepth(DEPTH.BOBBER - 0.5).setAlpha(0.8).play('ripple');
  r.on('animationcomplete', () => r.destroy());
}

// One droplet emitter per scene, shared by every splash.
function drops(scene) {
  if (!scene.splashDrops?.scene) {
    scene.splashDrops = scene.add.particles(0, 0, 'drop', {
      emitting: false,
      lifespan: { min: 450, max: 750 },
      speed: { onEmit: (p) => (90 + Math.random() * 170) * p.emitter.size },
      angle: { min: 235, max: 305 },
      gravityY: 900,
      scale: { onEmit: () => (Math.random() < 0.35 ? 2 * FG : FG) },
      alpha: { start: 1, end: 0.2 },
    }).setDepth(DEPTH.SPLASH);
  }
  return scene.splashDrops;
}

// A crown of water thrown up from the surface, with droplets and a ring.
export function splash(scene, x, size = 1) {
  const s = scene.add.sprite(x, SURFACE_Y + 4, 'splash').setOrigin(0.5, 1).setScale(FG * (0.6 + size * 0.4)).setDepth(DEPTH.SPLASH).play('splash');
  s.on('animationcomplete', () => s.destroy());
  ripple(scene, x, FG);
  const e = drops(scene);
  e.size = size;
  e.explode(Math.round(6 + 10 * size), x, SURFACE_Y);
  bubbles(scene, x, SURFACE_Y + 20, Math.round(3 + 5 * size));
}

// A few bubbles that wobble up and pop at the surface.
export function bubbles(scene, x, y, n = 4) {
  for (let i = 0; i < n; i++) {
    const b = scene.add.sprite(x + Phaser.Math.Between(-14, 14), y + Phaser.Math.Between(0, 30), 'bubble', 0).setScale(FG - 1).setDepth(DEPTH.BUBBLES).play({ key: 'bubble-pop', startFrame: i % 3 });
    const rise = (b.y - SURFACE_Y - 8) / 70;
    scene.tweens.add({ targets: b, y: SURFACE_Y + 8, duration: rise * 1000, ease: 'Sine.easeIn', onComplete: () => b.destroy() });
    scene.tweens.add({ targets: b, x: b.x + Phaser.Math.Between(-12, 12), duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}
