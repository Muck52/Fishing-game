// Paints each species as a classic field-guide sprite:
//   1. solid fins with clear rays, behind the body
//   2. a body in a few clean bands of colour: dark back, bright highlight
//      stripe along the shoulder, lit flank, pale belly turning under
//   3. the species' own markings, then a crisp diamond net of scales
//   4. gill plate, pectoral fin and mouth
//   5. a dark outline around everything, and a big readable eye
import { Painter, mix, shade, noise, hash } from './Painter.js';

const OUTLINE = '#141a22';
// Light falls in a few hard-edged bands rather than a smooth gradient.
const band = (k) => Math.round(k * 3) / 3;

export function paintFish(scene, fish) {
  const a = fish.art;
  const seed = hash(fish.id) & 0xffff;
  const L = a.length;
  const d = a.depth;
  const tl = Math.round(L * (a.tail === 'shark' ? 0.3 : 0.22));
  const ox = 3;
  const cy = Math.ceil(d * (a.dorsalH || 0.4)) + Math.ceil(d) + 3;
  const p = new Painter(ox + L + tl + 3, cy + Math.ceil(d * 1.5) + 5);
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
  const lowerFin = a.lowerFin || a.fin;

  // ---- 1. fins ------------------------------------------------------------
  const finPx = (x, y, color, ray, k0) => p.px(x, y, shade(color, band(k0 + (ray ? 0.2 : -0.15))));

  const finAlong = ([u0, u1], height, above, color, opts = {}) => {
    const x0 = Math.floor(u0 * L);
    const x1 = Math.ceil(u1 * L);
    for (let x = x0; x <= x1; x++) {
      const k = (x - x0) / Math.max(1, x1 - x0);
      const fh = Math.max(1, Math.round(d * height * Math.sin(Math.PI * Math.min(1, 0.12 + k * 0.92))));
      for (let i = 1; i <= fh; i++) {
        const y = above ? top(x) - i : bot(x) + i;
        const ray = x % 2 === 0;
        let k0 = 0;
        let c = color;
        if (opts.spiny && k < opts.spiny) {
          if (!ray && i > fh * 0.65) continue; // notched membrane between spines
          k0 += ray ? -0.3 : 0.3;
        }
        if (opts.bars && (i + x) % 3 === 0) k0 -= 0.6;
        if (opts.spot && k > 0.7 && i < fh * 0.6) c = opts.spot;
        if (opts.edge && x === x0) c = '#f6f3ea';
        else if (opts.edge && x === x0 + 1) c = '#1e1e1a';
        finPx(ox + x, y, c, ray, k0);
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
      finPx(ox + L + t, y, a.tailColor || a.fin, ray, y < cy ? 0.1 : -0.1);
    }
  }

  // ---- 2 + 3. body, markings, light, scales -------------------------------
  // Two colours meet in a single row of checkerboard dither.
  const blend = (v, edge, c1, c2, x, y) => {
    const t = (v - edge + 0.06) / 0.12;
    return t <= 0 ? c1 : t >= 1 ? c2 : (x + y) % 2 ? c1 : c2;
  };

  const markings = (c, x, y, u, v) => {
    for (const m of a.pattern || []) {
      if (m.type === 'bars') {
        const bw = Math.max(2, Math.round(L * 0.035));
        const from = m.from ?? 0.28;
        const to = m.to ?? 0.9;
        for (let i = 0; i < m.n; i++) {
          const bx = L * (from + (i * (to - from)) / (m.n - 1));
          const half = bw / 2 + (m.taper ? (1 - v) * bw * 0.7 : 0);
          if (Math.abs(x - bx) <= half && v < (m.depth ?? 0.8)) c = mix(c, m.color, m.strength ?? 0.8);
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
        if (v < (m.v1 ?? 0.45) && Math.sin(x * 0.9 + Math.sin(y * 1.3) * 2.2) + Math.sin(y * 1.6 + x * 0.35) > 1.1) c = m.color;
      } else if (m.type === 'mottle') {
        if (v < 0.82 && noise(Math.floor(x / 3), Math.floor(y / 2), seed + 20) < 0.4) c = mix(c, m.color, 0.7);
      } else if (m.type === 'cheek') {
        if (x > 2 && x < gx && v > 0.45 && v < 0.88 && Math.round(y - x * 0.35) % 3 === 0) c = m.color;
      } else if (m.type === 'eyebars') {
        const dx = x - ex;
        if (dx > 2 && x < gx) for (const j of [-1, 0, 1]) if (Math.abs(y - (ey + j * 2 + dx * 0.3 * j)) < 0.6) c = m.color;
      } else if (m.type === 'ear') {
        const e = ((x - gx - 1) / 2.4) ** 2 + ((y - cy + Math.round(d * 0.15)) / 1.8) ** 2;
        if (e <= 1) c = e > 0.55 && m.edge ? m.edge : m.color;
      }
    }
    return c;
  };

  const net = a.scales || 0;
  for (let x = 0; x < L; x++) {
    const yt = top(x);
    const yb = bot(x);
    const u = x / L;
    const lateralY = yt + Math.round((yb - yt) * (a.lateral ?? 0.36));
    for (let y = yt; y <= yb; y++) {
      const v = (y - yt) / Math.max(1, yb - yt);
      let c = v < (a.backTo + a.sideTo) / 2 ? blend(v, a.backTo, a.back, a.side, x, y) : blend(v, a.sideTo, a.side, a.belly, x, y);
      c = markings(c, x, y, u, v);

      // a rounded body lit from above, in hard-edged bands
      const ny = 2 * v - 1;
      const nz = Math.sqrt(Math.max(0, 1 - ny * ny));
      // pale bellies only dip one band into shadow, so they stay clean
      let k = Math.max(-0.34, band(-ny * 0.5 + nz * 0.75 - 0.5));
      if (y === yt + Math.max(1, Math.round((yb - yt) * 0.2)) && u > 0.1 && u < 0.86) k = 0.67; // highlight stripe
      if (u < 0.05 || u > 0.94) k -= 0.33;

      if (x > gx + 1 && v > 0.04 && v < 0.96) {
        // diamond net of scale edges
        if (net && ((x + y) % (net + 1) === 0 || (x - y + 999) % (net + 1) === 0)) k -= 0.34 * (a.scaleStrength ?? 1);
        if (a.lateral !== false && y === lateralY && x < L - 2) k = x % 2 ? 0.34 : -0.34;
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
    p.recolor(xe, y, shade(p.get(xe, y), 0.34));
    p.recolor(xe + 1, y, shade(p.get(xe + 1, y), -0.67));
  }

  for (const m of a.pattern || []) {
    if (m.type !== 'scutes') continue;
    const plate = (x, y, w) => {
      for (let i = 0; i < w; i++) {
        p.px(ox + x + i, y, shade(m.color, i === 0 ? 0.67 : 0.34));
        p.px(ox + x + i, y + 1, shade(m.color, -0.67));
      }
    };
    for (let x = Math.round(L * 0.16); x < L * 0.76; x += 5) {
      plate(x, top(x), 3);
      p.px(ox + x + 1, top(x) - 1, shade(m.color, 0.34));
    }
    for (let x = Math.round(L * 0.22); x < L * 0.92; x += 4) plate(x, top(x) + Math.round((bot(x) - top(x)) * 0.48), 2);
    for (let x = Math.round(L * 0.26); x < L * 0.6; x += 5) plate(x, top(x) + Math.round((bot(x) - top(x)) * 0.84), 2);
  }

  // pectoral fin, laid over the flank just behind the gill, with its own edge
  const bx = ox + gx + 2;
  const by = cy + Math.round(d * 0.25);
  const pl = Math.round(d * (a.pectoral ?? 0.9));
  for (let t = 0; t < pl; t++) {
    const w = 1 + Math.round(t * 0.4 * (1 - t / (pl * 1.4)));
    for (let j = 0; j <= w; j++) {
      let c = shade(lowerFin, band((j % 2 ? 0.2 : -0.1)));
      if (a.finEdge && j === 0) c = '#f6f3ea';
      if (t === pl - 1 || j === w) c = shade(lowerFin, -0.67);
      p.px(bx + t, by + Math.round(t * 0.35) + j, c);
    }
  }

  // mouth: dark jaw line with a pale lip below
  const ml = Math.round(L * (a.mouth ?? 0.08));
  const my = cy + Math.round((bot(0) - cy) * 0.35);
  for (let i = 0; i < ml; i++) {
    const y = my + Math.round(i * (a.mouthSlope ?? 0.2));
    if (!isBody[y * p.w + ox + i]) continue;
    p.recolor(ox + i, y, OUTLINE);
    if (isBody[(y + 1) * p.w + ox + i]) p.recolor(ox + i, y + 1, shade(p.get(ox + i, y + 1), 0.5));
  }
  if (a.barbels === 'chin') {
    for (let i = 1; i <= 3; i++) p.px(ox + 2 - (i >> 1), bot(2) + i, shade(a.back, -0.33));
  } else if (a.barbels === 'four') {
    const x0 = Math.round(L * 0.05);
    for (let b = 0; b < 4; b++) for (let i = 1; i <= 2; i++) p.px(ox + x0 + b, bot(x0 + b) + i, shade(a.belly, -0.5));
  }

  // ---- 5. outline and eye -------------------------------------------------
  const ring = [];
  for (let y = 0; y < p.h; y++) {
    for (let x = 0; x < p.w; x++) {
      if (p.alphaAt(x, y)) continue;
      if (p.alphaAt(x - 1, y) || p.alphaAt(x + 1, y) || p.alphaAt(x, y - 1) || p.alphaAt(x, y + 1)) ring.push([x, y]);
    }
  }
  for (const [x, y] of ring) p.px(x, y, OUTLINE);

  const iris = a.eyeColor || '#efe3a8';
  const re = Math.max(2, Math.round(d * 0.18));
  for (let y = -re; y <= re; y++) {
    for (let x = -re; x <= re; x++) {
      const r = Math.hypot(x, y);
      if (r > re + 0.5) continue;
      let c;
      if (r > re - 0.5) c = OUTLINE;
      else if (r > re - 1.5) c = shade(iris, y < 0 ? 0.34 : 0);
      else c = '#06080a';
      p.px(ox + ex + x, ey + y, c);
    }
  }
  p.px(ox + ex + 1, ey - 1, '#ffffff'); // catchlight

  p.texture(scene, `fish-${fish.id}`);
  p.silhouette('#123640').texture(scene, `fishsil-${fish.id}`);
}

