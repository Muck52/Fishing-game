// Paints each species from the shape and markings described in data/fish.
import { Painter, dither, mix, mulberry32, hash } from './Painter.js';
import { P } from './palette.js';

export function paintFish(scene, fish) {
  const a = fish.art;
  const rng = mulberry32(hash(fish.id));
  const L = a.length;
  const d = a.depth;
  const tl = Math.round(L * (a.tail === 'shark' ? 0.32 : 0.24));
  const ox = 2;
  const cy = Math.ceil(d * (a.dorsalH || 0.4)) + 2 + Math.ceil(d);
  const w = ox + L + tl + 1;
  const h = cy + Math.ceil(d * 1.4) + 3;
  const p = new Painter(w, h);

  const prof = (u) =>
    u < a.peak
      ? a.nose + (1 - a.nose) * Math.pow(Math.sin((Math.PI / 2) * (u / a.peak)), a.snout || 0.8)
      : a.ped + (1 - a.ped) * Math.cos((Math.PI / 2) * ((u - a.peak) / (1 - a.peak)));
  const up = (x) => Math.round(prof(x / L) * d);
  const dn = (x) => Math.round(prof(x / L) * d * 0.9);
  const fin = a.fin;
  const finDark = mix(a.fin, '#000000', 0.3);
  const line = mix(a.back, '#000000', 0.55);

  const finAlong = (range, height, above) => {
    const [u0, u1] = range;
    for (let x = Math.floor(u0 * L); x <= Math.ceil(u1 * L); x++) {
      const k = (x / L - u0) / (u1 - u0);
      const fh = Math.max(1, Math.round(d * height * Math.sin(Math.PI * Math.min(1, 0.15 + k * 0.95))));
      for (let i = 1; i <= fh; i++) {
        const y = above ? cy - up(x) - i : cy + dn(x) + i;
        p.px(ox + x, y, a.spiny && above && x % 2 ? finDark : fin);
      }
    }
  };
  finAlong(a.dorsal, a.dorsalH || 0.4, true);
  finAlong(a.anal || [0.62, 0.76], 0.35, false);
  finAlong([0.3, 0.38], 0.3, false);

  // tail
  const ph = Math.max(1, up(L - 1));
  for (let t = 0; t < tl; t++) {
    const k = (t + 1) / tl;
    let top;
    let bot;
    let notch = 0;
    if (a.tail === 'fork') {
      top = bot = ph + Math.round(k * d * 0.95);
      notch = Math.round(k * k * d * 0.85);
    } else if (a.tail === 'round') {
      top = bot = Math.round(ph + d * 0.6 * Math.sin(k * Math.PI * 0.85));
    } else if (a.tail === 'shark') {
      top = ph + Math.round(k * d * 1.4);
      bot = Math.max(0, ph + Math.round(k * d * 0.6) - (k > 0.55 ? Math.round((k - 0.55) * d * 2.2) : 0));
    } else {
      top = bot = ph + Math.round(k * d * 0.8);
      notch = k > 0.8 ? 1 : 0;
    }
    for (let y = cy - top; y <= cy + bot; y++) {
      if (Math.abs(y - cy) < notch) continue;
      p.px(ox + L + t, y, (y - cy) % 3 === 0 ? finDark : fin);
    }
  }

  // body, banded back / side / belly
  const band = (v, edge, c1, c2, x, y) => (v < edge - 0.08 ? c1 : v > edge + 0.08 ? c2 : dither(x, y, (v - edge + 0.08) / 0.16) ? c2 : c1);
  for (let x = 0; x < L; x++) {
    const yt = cy - up(x);
    const yb = cy + dn(x);
    for (let y = yt; y <= yb; y++) {
      const v = (y - yt) / Math.max(1, yb - yt);
      const c = v < (a.backTo + a.sideTo) / 2 ? band(v, a.backTo, a.back, a.side, x, y) : band(v, a.sideTo, a.side, a.belly, x, y);
      p.px(ox + x, y, c);
    }
  }

  // markings
  const inBody = (x, v0, v1, fn) => {
    const yt = cy - up(x);
    const yb = cy + dn(x);
    for (let y = yt; y <= yb; y++) {
      const v = (y - yt) / Math.max(1, yb - yt);
      if (v >= v0 && v <= v1) fn(ox + x, y);
    }
  };
  for (const m of a.pattern || []) {
    if (m.type === 'bars') {
      for (let i = 0; i < m.n; i++) {
        const bx = Math.round(L * (0.24 + (i * 0.66) / (m.n - 1)));
        for (const x of [bx, bx + 1]) inBody(x, 0, 0.75, (px, y) => dither(px, y, 0.8) && p.px(px, y, m.color));
      }
    } else if (m.type === 'spots') {
      for (let x = Math.round(L * 0.2); x < L * 0.92; x++) {
        inBody(x, m.v0, m.v1, (px, y) => {
          if (rng() > m.density) return;
          if (m.halo) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) p.px(px + dx, y + dy, m.halo);
          p.px(px, y, m.color);
        });
      }
    } else if (m.type === 'vermic') {
      for (let x = Math.round(L * 0.15); x < L; x++) {
        inBody(x, 0.05, 0.42, (px, y) => ((px * 3 + y * 5) % 7 === 0 || (px * 5 + y * 2) % 9 === 0) && p.px(px, y, m.color));
      }
    } else if (m.type === 'mottle') {
      for (let x = Math.round(L * 0.1); x < L; x++) inBody(x, 0, 0.7, (px, y) => rng() < 0.16 && p.px(px, y, m.color));
    } else if (m.type === 'beans') {
      for (let x = Math.round(L * 0.24); x < L - 2; x += 4) {
        for (const [dy, dx] of [[-2, 0], [1, 2]]) {
          p.px(ox + x + dx, cy + dy, m.color);
          p.px(ox + x + dx + 1, cy + dy, m.color);
        }
      }
    } else if (m.type === 'scutes') {
      for (let x = Math.round(L * 0.2); x < L - 2; x += 3) {
        p.px(ox + x, cy - up(x) + 1, m.color);
        if (x % 4 < 2) p.px(ox + x, cy, m.color);
      }
    } else if (m.type === 'ear') {
      p.rect(ox + Math.round(L * 0.27), cy - 2, 2, 3, m.color);
    }
  }

  p.outline(line);

  // face
  const ex = Math.round(L * a.eye);
  const ey = cy - Math.round(up(ex) * 0.3);
  const ring = a.eyeColor || '#e8dfb8';
  if (d >= 7) {
    p.rect(ox + ex, ey - 1, 2, 2, ring);
    p.px(ox + ex, ey - 1, P.ink);
  } else {
    p.px(ox + ex + 1, ey, ring);
    p.px(ox + ex, ey, P.ink);
  }
  const gx = Math.round(L * (a.gill || 0.24));
  for (let y = cy - Math.round(up(gx) * 0.7); y <= cy + Math.round(dn(gx) * 0.7); y++) {
    p.px(ox + gx + Math.round(Math.abs(y - cy) * 0.35), y, line);
  }
  p.px(ox, cy + 1, line);
  p.px(ox + 1, cy + 1, line);
  if (a.barbels) {
    for (const [x, y] of [[-1, 3], [-2, 4], [1, 3], [1, 4], [0, 5]]) p.px(ox + x, cy + y, line);
  }

  p.texture(scene, `fish-${fish.id}`);
  p.silhouette('#123640').texture(scene, `fishsil-${fish.id}`);
}
