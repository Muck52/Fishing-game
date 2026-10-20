// Paints each species the way a wildlife illustrator would build it up:
//   1. fins first, translucent, with rays and darker margins
//   2. the body as a lit cylinder: dark back, bright upper flank, pale belly
//      in shadow underneath, with a wet sheen along the shoulder
//   3. the species' own markings, laid into the skin before shading
//   4. overlapping scales, the lateral line, and the gill plate's raised edge
//   5. the eye (iris, pupil, catchlight) and mouth, then a soft coloured
//      outline that is darker than whatever it borders
import { Painter, mix, shade, noise, hash } from './Painter.js';

const grain = (x, y, seed, amount) => (noise(x, y, seed) - 0.5) * 2 * amount;
const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (t) => Math.max(0, Math.min(1, t));

export function paintFish(scene, fish) {
  const a = fish.art;
  const seed = hash(fish.id) & 0xffff;
  const L = a.length;
  const d = a.depth;
  const tl = Math.round(L * (a.tail === 'shark' ? 0.3 : 0.22));
  const ox = 3;
  const cy = Math.ceil(d * (a.dorsalH || 0.4)) + Math.ceil(d) + 2;
  const p = new Painter(ox + L + tl + 2, cy + Math.ceil(d * 1.5) + 4);
  const isBody = new Uint8Array(p.w * p.h);

  const prof = (u) =>
    u < a.peak
      ? a.nose + (1 - a.nose) * Math.pow(Math.sin((Math.PI / 2) * (u / a.peak)), a.snout || 0.8)
      : a.ped + (1 - a.ped) * Math.cos((Math.PI / 2) * ((u - a.peak) / (1 - a.peak)));
  const top = (x) => cy - Math.round(prof(x / L) * d);
  const bot = (x) => cy + Math.round(prof(x / L) * d * 0.9);

  const gx = Math.round(L * (a.gill || 0.24));
  const ex = Math.round(L * a.eye);
  const ey = top(ex) + Math.round((bot(ex) - top(ex)) * 0.36);
  const finAlpha = a.finAlpha ?? 0.82;
  const lowerFin = a.lowerFin || a.fin;

  // ---- 1. fins ------------------------------------------------------------
  const finPx = (x, y, color, ray, k0, alpha) => p.px(x, y, shade(color, k0 + (ray ? 0.18 : -0.12) + grain(x, y, seed + 3, 0.08)), alpha);

  const finAlong = ([u0, u1], height, above, color, opts = {}) => {
    const x0 = Math.floor(u0 * L);
    const x1 = Math.ceil(u1 * L);
    for (let x = x0; x <= x1; x++) {
      const k = (x - x0) / Math.max(1, x1 - x0);
      const fh = Math.max(1, Math.round(d * height * Math.sin(Math.PI * Math.min(1, 0.12 + k * 0.92))));
      for (let i = 1; i <= fh; i++) {
        const y = above ? top(x) - i : bot(x) + i;
        const ray = x % 2 === 0;
        let alpha = finAlpha;
        let k0 = i === fh ? -0.25 : 0;
        let c = color;
        if (opts.spiny && k < opts.spiny) {
          if (!ray && i > fh * 0.7) continue; // notched membrane between spines
          alpha = ray ? 0.95 : 0.6;
          k0 += ray ? -0.15 : 0.2;
        }
        if (opts.bars && (i + x) % 3 === 0) k0 -= 0.45;
        if (opts.spot && k > 0.7 && i < fh * 0.6) c = opts.spot;
        if (opts.edge && x === x0) c = '#f4f1e6';
        else if (opts.edge && x === x0 + 1) c = '#1e1e1a';
        finPx(ox + x, y, c, ray, k0, alpha);
      }
    }
  };

  finAlong(a.dorsal, a.dorsalH || 0.4, true, a.fin, { spiny: a.spiny, bars: a.finBars, spot: a.dorsalSpot });
  if (a.dorsal2) finAlong(a.dorsal2, a.dorsalH * 0.7, true, a.fin, {});
  finAlong(a.anal || [0.64, 0.78], a.analH || 0.38, false, lowerFin, { edge: a.finEdge });
  finAlong(a.pelvic || [0.36, 0.44], 0.34, false, lowerFin, { edge: a.finEdge });

  // tail: rays fanning out from the tail stock
  const ph = Math.max(1, Math.round(prof(1) * d));
  for (let t = 0; t < tl; t++) {
    const k = (t + 1) / tl;
    let up;
    let dn;
    let notch = 0;
    if (a.tail === 'fork') {
      up = dn = ph + Math.round(k * d * 0.95);
      notch = Math.round(k * k * d * 0.85);
    } else if (a.tail === 'round') {
      up = dn = Math.round(ph + d * 0.6 * Math.sin(k * Math.PI * 0.85));
    } else if (a.tail === 'shark') {
      up = ph + Math.round(k * d * 1.4);
      dn = Math.max(0, ph + Math.round(k * d * 0.6) - (k > 0.55 ? Math.round((k - 0.55) * d * 2.2) : 0));
    } else {
      up = dn = ph + Math.round(k * d * 0.8);
      notch = k > 0.8 ? Math.round(d * 0.12) : 0;
    }
    for (let y = cy - up; y <= cy + dn; y++) {
      if (Math.abs(y - cy) < notch) continue;
      const ray = Math.floor(Math.atan2(y - cy, t + 2) * 8 + 20) % 2 === 0;
      const edge = t >= tl - 1 || y === cy - up || y === cy + dn;
      finPx(ox + L + t, y, a.tailColor || a.fin, ray, (edge ? -0.3 : 0) - k * 0.1, finAlpha + (1 - finAlpha) * (1 - k));
    }
  }

  // ---- 2 + 3. body, markings, light --------------------------------------
  const band = (v, edge, c1, c2, x, y) => {
    const t = smooth(clamp01((v - edge + 0.12) / 0.24)) + grain(x, y, seed + 5, 0.12);
    return t <= 0 ? c1 : t >= 1 ? c2 : mix(c1, c2, t);
  };

  const markings = (c, x, y, u, v) => {
    for (const m of a.pattern || []) {
      if (m.type === 'bars') {
        const bw = Math.max(2, Math.round(L * 0.035));
        const from = m.from ?? 0.28;
        const to = m.to ?? 0.9;
        for (let i = 0; i < m.n; i++) {
          const bx = L * (from + (i * (to - from)) / (m.n - 1));
          const half = bw / 2 + (m.taper ? (1 - v) * bw * 0.7 : 0) + Math.sin(y * 0.9 + i) * 0.5;
          if (Math.abs(x - bx) <= half && v < (m.depth ?? 0.8)) c = mix(c, m.color, (m.strength ?? 0.75) * (1 - v * 0.4));
        }
      } else if (m.type === 'spots') {
        if (v < m.v0 || v > m.v1 || u < (m.u0 ?? 0.2)) continue;
        const cs = m.cell ?? 4;
        const cx0 = Math.floor(x / cs);
        const cy0 = Math.floor(y / cs);
        for (let i = cx0 - 1; i <= cx0 + 1; i++) {
          for (let j = cy0 - 1; j <= cy0 + 1; j++) {
            if (noise(i, j, seed + m.seed) > m.density) continue;
            const sx = (i + noise(i, j, seed + m.seed + 1)) * cs;
            const sy = (j + noise(i, j, seed + m.seed + 2)) * cs;
            const dist = Math.hypot((x - sx) / (m.rx ?? 1), (y - sy) / (m.ry ?? 1));
            const r = m.size ?? 0.8;
            if (dist <= r) c = m.color;
            else if (m.halo && dist <= r + 1) c = m.halo;
          }
        }
      } else if (m.type === 'vermic') {
        if (v < (m.v1 ?? 0.45) && Math.sin(x * 0.9 + Math.sin(y * 1.3) * 2.2) + Math.sin(y * 1.6 + x * 0.35) > 1.1) c = mix(c, m.color, 0.85);
      } else if (m.type === 'mottle') {
        if (v < 0.82 && noise(Math.floor(x / 3), Math.floor(y / 2), seed + 20) < 0.4) c = mix(c, m.color, 0.6 + grain(x, y, seed + 21, 0.15));
      } else if (m.type === 'cheek') {
        if (x > 2 && x < gx && v > 0.45 && v < 0.88 && Math.round(y - x * 0.35) % 3 === 0) c = mix(c, m.color, 0.7);
      } else if (m.type === 'eyebars') {
        const dx = x - ex;
        if (dx > 1 && x < gx) for (const j of [-1, 0, 1]) if (Math.abs(y - (ey + j * 2 + dx * 0.3 * j)) < 0.6) c = mix(c, m.color, 0.8);
      } else if (m.type === 'ear') {
        const e = ((x - gx - 1) / 2.4) ** 2 + ((y - cy + Math.round(d * 0.15)) / 1.8) ** 2;
        if (e <= 1) c = e > 0.55 && m.edge ? m.edge : m.color;
      }
    }
    return c;
  };

  const scaleSize = a.scales || 0;
  for (let x = 0; x < L; x++) {
    const yt = top(x);
    const yb = bot(x);
    const u = x / L;
    const lateralY = yt + Math.round((yb - yt) * (a.lateral ?? 0.36));
    for (let y = yt; y <= yb; y++) {
      const v = (y - yt) / Math.max(1, yb - yt);
      let c = v < (a.backTo + a.sideTo) / 2 ? band(v, a.backTo, a.back, a.side, x, y) : band(v, a.sideTo, a.side, a.belly, x, y);
      c = markings(c, x, y, u, v);

      // a cylinder lit from above and in front
      const ny = 2 * v - 1;
      const nz = Math.sqrt(Math.max(0, 1 - ny * ny));
      let k = -ny * 0.5 + nz * 0.75 - 0.5;
      if (Math.abs(v - 0.24) < 0.05 && u > 0.12 && u < 0.88 && noise(x, y, seed + 7) > 0.25) k += 0.35; // wet sheen
      k -= 0.3 * Math.max(0, 1 - u / 0.06);
      k -= 0.25 * Math.max(0, (u - 0.9) / 0.1);
      k += grain(x, y, seed + 9, 0.08);

      if (x > gx + 1) {
        if (scaleSize && v > 0.05 && v < 0.95) {
          const s = scaleSize;
          const row = Math.floor(y / s);
          const sx = (x + (row % 2) * Math.ceil(s / 2)) % (s + 1);
          const sy = y % s;
          const strength = a.scaleStrength ?? 1;
          if (sx === s || (sy === s - 1 && sx > 0)) k -= 0.22 * strength;
          else if (sx === 0 && sy === 0) k += 0.16 * strength;
        }
        if (a.lateral !== false && y === lateralY && x < L - 2) k += x % 2 ? 0.28 : -0.18;
      } else {
        k += 0.05;
      }
      p.px(ox + x, y, shade(c, k));
      isBody[y * p.w + ox + x] = 1;
    }
  }

  // ---- 4. gill plate, scutes, pectoral fin, mouth ------------------------
  const gillReach = Math.max(1, Math.round(d * 0.18));
  for (let y = top(gx) + 1; y < bot(gx); y++) {
    const e = (y - cy) / (d * 0.8);
    if (Math.abs(e) > 0.95) continue;
    const xe = ox + gx + Math.round((1 - e * e) * gillReach);
    p.recolor(xe, y, shade(p.get(xe, y), 0.3));
    p.recolor(xe + 1, y, shade(p.get(xe + 1, y), -0.5));
  }

  for (const m of a.pattern || []) {
    if (m.type !== 'scutes') continue;
    const plate = (x, y, w) => {
      for (let i = 0; i < w; i++) {
        p.px(ox + x + i, y, shade(m.color, 0.45 - i * 0.15));
        p.px(ox + x + i, y + 1, shade(m.color, -0.45));
      }
    };
    for (let x = Math.round(L * 0.16); x < L * 0.76; x += 5) {
      plate(x, top(x), 3);
      p.px(ox + x + 1, top(x) - 1, shade(m.color, 0.2));
    }
    for (let x = Math.round(L * 0.22); x < L * 0.92; x += 4) plate(x, top(x) + Math.round((bot(x) - top(x)) * 0.48), 2);
    for (let x = Math.round(L * 0.26); x < L * 0.6; x += 5) plate(x, top(x) + Math.round((bot(x) - top(x)) * 0.84), 2);
  }

  // pectoral fin, laid over the flank just behind the gill
  const bx = ox + gx + 2;
  const by = cy + Math.round(d * 0.25);
  const pl = Math.round(d * (a.pectoral ?? 0.9));
  for (let t = 0; t < pl; t++) {
    const w = 1 + Math.round(t * 0.4 * (1 - t / (pl * 1.4)));
    for (let j = 0; j <= w; j++) {
      const x = bx + t;
      const y = by + Math.round(t * 0.35) + j;
      let c = lowerFin;
      if (a.finEdge && j === 0) c = '#f4f1e6';
      p.px(x, y, shade(c, (j % 2 ? 0.15 : -0.1) + (t === pl - 1 ? -0.3 : 0.05)), 0.62);
    }
  }

  // mouth: dark jaw line with a pale lip below
  const ml = Math.round(L * (a.mouth ?? 0.08));
  const my = cy + Math.round((bot(0) - cy) * 0.35);
  for (let i = 0; i < ml; i++) {
    const y = my + Math.round(i * (a.mouthSlope ?? 0.2));
    if (!isBody[y * p.w + ox + i]) continue;
    p.recolor(ox + i, y, shade(p.get(ox + i, y), -0.7));
    if (isBody[(y + 1) * p.w + ox + i]) p.recolor(ox + i, y + 1, shade(p.get(ox + i, y + 1), 0.35));
  }
  if (a.barbels === 'chin') {
    for (let i = 1; i <= 3; i++) p.px(ox + 2 - (i >> 1), bot(2) + i, shade(a.back, -0.3));
  } else if (a.barbels === 'four') {
    const x0 = Math.round(L * 0.05);
    for (let b = 0; b < 4; b++) for (let i = 1; i <= 2; i++) p.px(ox + x0 + b, bot(x0 + b) + i, shade(a.belly, -0.5));
  }

  // ---- 5. coloured outline, then the eye ---------------------------------
  const edges = [];
  for (let y = 0; y < p.h; y++) {
    for (let x = 0; x < p.w; x++) {
      if (!p.alphaAt(x, y)) continue;
      const openAbove = !p.alphaAt(x, y - 1);
      if (openAbove || !p.alphaAt(x, y + 1) || !p.alphaAt(x - 1, y) || !p.alphaAt(x + 1, y)) {
        edges.push([x, y, isBody[y * p.w + x] ? (openAbove ? -0.35 : -0.55) : -0.25]);
      }
    }
  }
  for (const [x, y, k] of edges) p.recolor(x, y, shade(p.get(x, y), k));

  const iris = a.eyeColor || '#c9a24a';
  const re = Math.max(1, Math.round(d * 0.17));
  for (let y = -re; y <= re; y++) {
    for (let x = -re; x <= re; x++) {
      const r = Math.hypot(x, y);
      if (r > re + 0.4) continue;
      let c;
      if (r > re - 0.5) c = shade(iris, -0.85);
      else if (r <= Math.max(0.6, re - 1.2)) c = '#0d0f10';
      else c = shade(iris, y < 0 ? 0.25 : -0.2);
      p.px(ox + ex + x, ey + y, c);
    }
  }
  p.px(ox + ex + 1, ey - 1, '#ffffff'); // catchlight from the morning sky

  p.texture(scene, `fish-${fish.id}`);
  p.silhouette('#123640').texture(scene, `fishsil-${fish.id}`);
}
