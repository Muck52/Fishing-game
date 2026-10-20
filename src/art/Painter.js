// A tiny pixel-art canvas. Art is painted into a buffer one pixel at a time,
// then turned into a Phaser texture that is drawn PX times larger.
import { PX } from '../core/constants.js';

const cache = new Map();
export function rgb(color) {
  if (Array.isArray(color)) return color;
  let c = cache.get(color);
  if (!c) {
    const n = parseInt(color.slice(1), 16);
    c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    cache.set(color, c);
  }
  return c;
}

export function mix(a, b, t) {
  const ca = rgb(a);
  const cb = rgb(b);
  return [0, 1, 2].map((i) => Math.round(ca[i] + (cb[i] - ca[i]) * t));
}

// Ordered (Bayer) dithering: returns true where a pixel should take the
// second colour when blending by fraction t.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const dither = (x, y, t) => t * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5;

// Seeded random numbers so the scenery looks the same every visit.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export class Painter {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }

  px(x, y, color, a = 1) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
    const d = this.data;
    const i = (y * this.w + x) * 4;
    const [r, g, b] = rgb(color);
    if (a >= 1) {
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
      return;
    }
    const da = d[i + 3] / 255;
    const oa = a + da * (1 - a);
    d[i] = (r * a + d[i] * da * (1 - a)) / oa;
    d[i + 1] = (g * a + d[i + 1] * da * (1 - a)) / oa;
    d[i + 2] = (b * a + d[i + 2] * da * (1 - a)) / oa;
    d[i + 3] = oa * 255;
  }

  alphaAt(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[(y * this.w + x) * 4 + 3];
  }

  get(x, y) {
    const i = (y * this.w + x) * 4;
    return [this.data[i], this.data[i + 1], this.data[i + 2]];
  }

  rect(x, y, w, h, c, a = 1) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c, a);
  }

  hline(x0, x1, y, c, a = 1) {
    for (let x = x0; x <= x1; x++) this.px(x, y, c, a);
  }

  vline(x, y0, y1, c, a = 1) {
    for (let y = y0; y <= y1; y++) this.px(x, y, c, a);
  }

  ellipse(cx, cy, rx, ry, c, a = 1) {
    for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y++) {
      for (let x = -Math.ceil(rx); x <= Math.ceil(rx); x++) {
        if ((x * x) / ((rx + 0.5) ** 2) + (y * y) / ((ry + 0.5) ** 2) <= 1) this.px(cx + x, cy + y, c, a);
      }
    }
  }

  // Draw a sprite written as rows of characters; '.' is transparent.
  sprite(rows, pal, ox = 0, oy = 0) {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = pal[row[x]];
        if (c) this.px(ox + x, oy + y, c);
      }
    });
  }

  // Darken every opaque pixel that touches a transparent one.
  outline(color) {
    const edge = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (!this.alphaAt(x, y)) continue;
        if (!this.alphaAt(x - 1, y) || !this.alphaAt(x + 1, y) || !this.alphaAt(x, y - 1) || !this.alphaAt(x, y + 1)) {
          edge.push([x, y]);
        }
      }
    }
    for (const [x, y] of edge) this.px(x, y, color);
  }

  silhouette(color) {
    const s = new Painter(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.alphaAt(x, y)) s.px(x, y, color);
    return s;
  }

  texture(scene, key) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const tex = scene.textures.createCanvas(key, this.w, this.h);
    tex.getContext().putImageData(new ImageData(this.data, this.w, this.h), 0, 0);
    tex.refresh();
    return tex;
  }
}

// Builds a horizontal sprite sheet from several character-map frames.
// Frames are bottom-aligned so feet stay planted between frames.
export function sheet(scene, key, frames, pal) {
  const fw = Math.max(...frames.flat().map((r) => r.length));
  const fh = Math.max(...frames.map((f) => f.length));
  const p = new Painter(fw * frames.length, fh);
  frames.forEach((rows, i) => p.sprite(rows, pal, i * fw, fh - rows.length));
  const tex = p.texture(scene, key);
  frames.forEach((_, i) => tex.add(i, 0, i * fw, 0, fw, fh));
  return tex;
}

// Draws a line as chunky pixels snapped to the art grid.
export function strokePixels(g, points, color, alpha = 1, size = PX) {
  const seen = new Set();
  g.fillStyle(color, alpha);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (size * 0.5)));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const gx = Math.floor((a.x + (b.x - a.x) * t) / size);
      const gy = Math.floor((a.y + (b.y - a.y) * t) / size);
      const k = gx * 100000 + gy;
      if (seen.has(k)) continue;
      seen.add(k);
      g.fillRect(gx * size, gy * size, size, size);
    }
  }
}
