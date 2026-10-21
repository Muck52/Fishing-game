import { PX, DEPTH, pxScale } from '../core/constants.js';

// An expanding ring on the water.
export function ripple(scene, x, y, depth = DEPTH.WATER_LIFE) {
  const r = scene.add.sprite(x, y, 'ripple').setScale(pxScale(y)).setDepth(depth).play('ripple');
  r.on('animationcomplete', () => r.destroy());
  return r;
}

// One droplet emitter per scene, shared by every splash.
function drops(scene) {
  if (!scene.splashDrops?.scene) {
    scene.splashDrops = scene.add.particles(0, 0, 'drop', {
      emitting: false,
      lifespan: { min: 420, max: 600 },
      speed: { onEmit: (p) => (50 + Math.random() * 110) * p.emitter.size },
      angle: { min: 235, max: 305 },
      gravityY: 640,
      scale: { onEmit: (p) => p.emitter.px * (Math.random() < 0.3 ? 2 : 1) },
      alpha: { start: 1, end: 0, ease: 'Quad.easeIn' },
    }).setDepth(DEPTH.BOBBER + 1);
  }
  return scene.splashDrops;
}

// Ring plus a burst of chunky droplets.
export function splash(scene, x, y, size = 1) {
  const s = pxScale(y);
  ripple(scene, x, y + s, DEPTH.WATER_LIFE + 0.5);
  const e = drops(scene);
  e.size = size * (s / PX);
  e.px = s;
  e.explode(Math.round(4 + 6 * size), x, y);
}
