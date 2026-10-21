// Ready-made CC0 art packs (see assets/CREDITS.md). Every image is recoloured
// on load to the game's palette, so pack art and code-drawn art share one set
// of colours and sit together as one 16-bit scene.
import { Painter, rgb, shade } from './Painter.js';
import { P } from './palette.js';

const PACKS = {
  overworld: 'assets/art/environments/zelda-like-overworld.png',
  town: 'assets/art/environments/tiny-town.png',
};

// Named pieces cut from the packs: [pack, x, y, w, h] in pack pixels.
export const PIECES = {
  'tree-tall': ['town', 64, 0, 15, 31],
  'tree-tall-gold': ['town', 48, 1, 15, 30],
  'tree-small': ['town', 66, 32, 12, 16],
  'tree-small-gold': ['town', 50, 32, 12, 16],
  bush: ['town', 80, 0, 16, 16],
  'rock-0': ['overworld', 112, 81, 16, 14],
  'rock-1': ['overworld', 129, 83, 15, 13],
  'rock-2': ['overworld', 145, 83, 15, 12],
  'rock-3': ['overworld', 100, 85, 11, 9],
  'rock-4': ['overworld', 162, 86, 13, 8],
  'rock-wet-0': ['overworld', 180, 118, 27, 19],
  'rock-wet-1': ['overworld', 212, 112, 27, 16],
};

// The palette plus a light and a shadow step of every colour in it.
let swatches;
function paletteSwatches() {
  if (swatches) return swatches;
  const set = new Map();
  for (const c of Object.values(P)) {
    for (const k of [-2 / 3, -1 / 3, 0, 1 / 3, 2 / 3]) {
      const v = k ? shade(c, k) : rgb(c);
      set.set(v.join(','), v);
    }
  }
  return (swatches = [...set.values()]);
}

// Closest swatch by a weighted RGB distance that tracks the eye fairly well.
const nearCache = new Map();
function nearest(r, g, b) {
  const key = (r << 16) | (g << 8) | b;
  let best = nearCache.get(key);
  if (best) return best;
  let bd = Infinity;
  for (const s of paletteSwatches()) {
    const rm = (r + s[0]) / 2;
    const dr = r - s[0];
    const dg = g - s[1];
    const db = b - s[2];
    const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  nearCache.set(key, best);
  return best;
}

const pixels = {}; // recoloured pack pixels, by pack name

export function preloadPacks(scene) {
  for (const [name, url] of Object.entries(PACKS)) scene.load.image(`pack-${name}`, url);
}

// Recolours each loaded pack and replaces its texture with the result.
export function recolorPacks(scene) {
  for (const name of Object.keys(PACKS)) {
    const key = `pack-${name}`;
    const img = scene.textures.get(key).getSourceImage();
    const { width: w, height: h } = img;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, w, h);
    const d = data.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const [r, g, b] = nearest(d[i], d[i + 1], d[i + 2]);
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }
    pixels[name] = { w, h, d };
    scene.textures.remove(key);
    const tex = scene.textures.createCanvas(key, w, h);
    tex.getContext().putImageData(data, 0, 0);
    tex.refresh();
  }
}

// A recoloured piece as its own small Painter.
export function piece(name) {
  const [pack, x0, y0, w, h] = PIECES[name];
  const src = pixels[pack];
  const p = new Painter(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = ((y0 + y) * src.w + x0 + x) * 4;
      if (src.d[i + 3]) p.px(x, y, [src.d[i], src.d[i + 1], src.d[i + 2]], src.d[i + 3] / 255);
    }
  }
  return p;
}

// Lays a piece into a Painter with its bottom-centre at (cx, baseY).
export function placePiece(p, name, cx, baseY, flip = false) {
  const s = piece(name);
  const ox = Math.round(cx - s.w / 2);
  const oy = baseY - s.h;
  for (let y = 0; y < s.h; y++) {
    for (let x = 0; x < s.w; x++) {
      const sx = flip ? s.w - 1 - x : x;
      const a = s.alphaAt(sx, y);
      if (a) p.px(ox + x, oy + y, s.get(sx, y), a / 255);
    }
  }
  return s;
}
