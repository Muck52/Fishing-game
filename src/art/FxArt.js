// Textures for the screen effects and particles.
import { Painter } from './Painter.js';
import { P } from './palette.js';

export const RIPPLE_FRAMES = 6;

// Displacement maps for the water's ripple: bands of sideways push that run
// across the screen, wavering along their length. Red pushes left and right,
// green up and down. Each frame moves the bands on a little, so cycling them
// makes the reflections shimmer.
export function paintFxMaps(scene) {
  const w = 48;
  const h = 256;
  for (let f = 0; f < RIPPLE_FRAMES; f++) {
    const key = `water-disp-${f}`;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const tex = scene.textures.createCanvas(key, w, h);
    const ctx = tex.getContext();
    const img = ctx.createImageData(w, h);
    const phase = (f / RIPPLE_FRAMES) * Math.PI * 2;
    for (let y = 0; y < h; y++) {
      // bands crowd together toward the horizon (top) and spread out nearer
      const v = 60 * Math.sqrt(y / h);
      for (let x = 0; x < w; x++) {
        const u = (x / w) * Math.PI * 2;
        const i = (y * w + x) * 4;
        img.data[i] = 127.5 + 127.5 * Math.sin(v + phase + Math.sin(u * 2 + phase) * 0.8);
        img.data[i + 1] = 127.5 + 60 * Math.cos(v * 0.5 + phase);
        img.data[i + 2] = 0;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    tex.refresh();
  }
}

// Particles: a water droplet, a soft puff of mist and a mote of pollen.
export function paintParticles(scene) {
  const drop = new Painter(1, 1);
  drop.px(0, 0, '#e6f2ee');
  drop.texture(scene, 'drop');
  const puff = new Painter(7, 7);
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      const d = Math.hypot(x - 3, y - 3) / 3.5;
      if (d < 1) puff.px(x, y, P.mist, (1 - d) * 0.8);
    }
  }
  puff.texture(scene, 'mist-puff');
  const pollen = new Painter(1, 1);
  pollen.px(0, 0, P.sun);
  pollen.texture(scene, 'pollen');
}
