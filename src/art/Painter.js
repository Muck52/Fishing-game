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

function toHsl([r, g, b]) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function fromHsl(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

const towardHue = (h, target, t) => h + ((((target - h + 540) % 360) - 180) * t);

// Shades a colour along a pixel-art ramp. k runs from -1 (deep shadow) to 1
// (full light). Shadows drift cool toward blue-violet and highlights drift
// warm toward yellow, the way real light behaves. Steps are quantised so
// surfaces break into distinct bands of colour rather than smooth gradients.
const STEP = 1 / 6;
const shadeCache = new Map();
export function shade(color, k) {
  const q = Math.max(-1, Math.min(1, Math.round(k / STEP) * STEP));
  const key = String(color) + q;
  let out = shadeCache.get(key);
  if (out) return out;
  const [h, s, l] = toHsl(rgb(color));
  if (q < 0) {
    const t = -q;
    out = fromHsl(towardHue(h, 245, t * 0.3), Math.min(1, s * (1 + t * 0.2)), l * (1 - t * 0.5));
  } else {
    out = fromHsl(towardHue(h, 55, q * 0.25), s * (1 - q * 0.15), l + (1 - l) * q * 0.5);
  }
  shadeCache.set(key, out);
  return out;
}

// Repeatable per-pixel noise in [0, 1).
export function noise(x, y, seed = 0) {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2147483647)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
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

  // Replace a pixel's colour but keep its transparency.
  recolor(x, y, color) {
    const i = (y * this.w + x) * 4;
    const [r, g, b] = rgb(color);
    this.data[i] = r;
    this.data[i + 1] = g;
    this.data[i + 2] = b;
  }

  // Lights flat-coloured shapes as solid forms under the low morning sun
  // (upper right). Edges turned toward the light brighten, edges turned away
  // and undersides fall into cool shadow, and a little grain breaks up each
  // colour. Colours listed in `flat` (eyes, noses) are left untouched.
  light({ strength = 0.6, grain = 0.04, flat = [], frameW = this.w, seed = 1 } = {}) {
    const flatSet = new Set(flat.map((c) => rgb(c).join(',')));
    const { w, h } = this;
    const dist = new Float32Array(w * h);
    for (let f0 = 0; f0 < w; f0 += frameW) {
      const f1 = Math.min(w, f0 + frameW);
      const D = (x, y) => (x < f0 || x >= f1 || y < 0 || y >= h ? 0 : dist[y * w + x]);
      for (let y = 0; y < h; y++) for (let x = f0; x < f1; x++) dist[y * w + x] = this.alphaAt(x, y) ? 99 : 0;
      for (let y = 0; y < h; y++) {
        for (let x = f0; x < f1; x++) {
          const i = y * w + x;
          if (dist[i]) dist[i] = Math.min(dist[i], D(x - 1, y) + 1, D(x, y - 1) + 1, D(x - 1, y - 1) + 1.4, D(x + 1, y - 1) + 1.4);
        }
      }
      for (let y = h - 1; y >= 0; y--) {
        for (let x = f1 - 1; x >= f0; x--) {
          const i = y * w + x;
          if (dist[i]) dist[i] = Math.min(dist[i], D(x + 1, y) + 1, D(x, y + 1) + 1, D(x + 1, y + 1) + 1.4, D(x - 1, y + 1) + 1.4, 4);
        }
      }
      for (let x = f0; x < f1; x++) {
        let top = -1;
        let bot = -1;
        for (let y = 0; y < h; y++) {
          if (!this.alphaAt(x, y)) continue;
          if (top < 0) top = y;
          bot = y;
        }
        for (let y = top; y >= 0 && y <= bot; y++) {
          if (!this.alphaAt(x, y)) continue;
          const orig = this.get(x, y);
          if (flatSet.has(orig.join(','))) continue;
          const gx = D(x + 1, y) - D(x - 1, y);
          const gy = D(x, y + 1) - D(x, y - 1);
          const len = Math.hypot(gx, gy) || 1;
          const facing = (-gx / len) * 0.6 + (gy / len) * 0.8; // outward normal . light
          const edge = Math.max(0, 1 - (D(x, y) - 1) / 2.5);
          const v = (y - top) / Math.max(1, bot - top);
          const k = strength * (facing * edge * 0.9 + (0.3 - v) * 0.7) + (noise(x, y, seed) - 0.5) * 2 * grain;
          this.recolor(x, y, shade(orig, k));
        }
      }
    }
    return this;
  }

  // Ring every shape in a one-pixel border just outside its edge.
  outerOutline(color) {
    const ring = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.alphaAt(x, y)) continue;
        if (this.alphaAt(x - 1, y) || this.alphaAt(x + 1, y) || this.alphaAt(x, y - 1) || this.alphaAt(x, y + 1)) ring.push([x, y]);
      }
    }
    for (const [x, y] of ring) this.px(x, y, color);
    return this;
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
// Pass `lit` to shade the sprite as a solid form; its `flat` string lists
// palette letters to leave unshaded, and `outline` wraps each frame in a
// one-pixel dark border.
export function sheet(scene, key, frames, pal, lit = null) {
  const pad = lit?.outline ? 1 : 0;
  const fw = Math.max(...frames.flat().map((r) => r.length)) + pad * 2;
  const fh = Math.max(...frames.map((f) => f.length)) + pad * 2;
  const p = new Painter(fw * frames.length, fh);
  frames.forEach((rows, i) => p.sprite(rows, pal, i * fw + pad, fh - pad - rows.length));
  if (lit) p.light({ ...lit, frameW: fw, flat: [...(lit.flat || '')].map((c) => pal[c]).filter(Boolean) });
  if (pad) p.outerOutline(lit.outline);
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
