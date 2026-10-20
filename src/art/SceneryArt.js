// Loon Lake, painted in a 16-bit console RPG style: round leaf-clump
// canopies, tiered pines, layered rock, a waterfall, meadow flowers and
// bright water. Shading is clean bands of a colour ramp with dark outlines.
import { Painter, mix, mulberry32, shade, noise } from './Painter.js';
import { P } from './palette.js';
import { AW, AH, HORIZON, DOCK_AY } from '../core/constants.js';

export const SUN = { x: 138, y: 30 };
export const SNAG = { x: 30, top: HORIZON - 40 }; // dead pine the eagle perches on
export const FALLS = { x: 6, top: HORIZON - 30, w: 8 }; // waterfall off the cliff
export const PLAYER_AX = 70; // where the angler stands on the dock
export const MUG = { x: 125, y: DOCK_AY + 8 };
export const DOG = { x: 51, y: DOCK_AY + 11 };

// One clean band of a colour ramp. Light is quantised to thirds so surfaces
// read as a few crisp tones.
const tone = (base, k) => shade(base, Math.round(Math.max(-1, Math.min(1, k)) * 3) / 3);
const hex = ([r, g, b]) => (r << 16) | (g << 8) | b;

export function paintScenery(scene) {
  const rng = mulberry32(20260920);
  paintSky(scene);
  paintSun(scene);
  paintWaves(scene, mulberry32(77));
  const mountains = paintMountains(scene, rng);
  const forest = paintForest(scene, rng);
  paintFalls(scene);
  paintWater(scene, rng, mountains, forest);
  paintBanks(scene, rng);
  paintDock(scene);
  paintCloud(scene, 'cloud-0', 40, 14, rng);
  paintCloud(scene, 'cloud-1', 26, 10, rng);
  paintCloud(scene, 'cloud-2', 54, 16, rng);
  paintMist(scene, 'mist-far', AW, 9, 0.6, rng);
  paintMist(scene, 'mist-water', AW, 5, 0.4, rng);
}

// Smooth vertical gradient, blended row by row like a console's
// per-scanline colour gradient.
function vgradient(p, y0, y1, stops) {
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0 - 1);
    let k = 0;
    while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [ta, ca] = stops[k];
    const [tb, cb] = stops[k + 1];
    const f = Math.min(1, Math.max(0, (t - ta) / (tb - ta)));
    const c = mix(ca, cb, f * f * (3 - 2 * f));
    for (let x = 0; x < p.w; x++) p.px(x, y, c);
  }
}

// Paints a shape on its own layer, rings it in outline, then lays it down.
function stamp(p, w, h, ox, oy, draw, outline = P.outline) {
  const s = new Painter(w, h);
  draw(s);
  if (outline) s.outerOutline(outline);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (s.alphaAt(x, y)) p.px(ox + x, oy + y, s.get(x, y));
}

function paintSky(scene) {
  const p = new Painter(AW, HORIZON);
  vgradient(p, 0, HORIZON, [[0, P.sky0], [0.35, P.sky1], [0.65, P.sky2], [0.88, P.sky3], [1, P.sky4]]);
  p.texture(scene, 'sky');
}

// The sun is its own set of pieces so it can glow and throw light:
// a disc, a corona in two slightly different sizes, and four frames of rays.
const RAY_R = 60;
function paintSun(scene) {
  const disc = new Painter(17, 17);
  for (let y = 0; y < 17; y++) {
    for (let x = 0; x < 17; x++) {
      const d = Math.hypot(x - 8, y - 8);
      if (d < 4) disc.px(x, y, '#ffffff');
      else if (d < 6) disc.px(x, y, P.sun);
      else if (d < 7.5) disc.px(x, y, P.sunGlow2);
    }
  }
  disc.texture(scene, 'sun');

  const G = 41;
  const glow = new Painter(G * 2, G);
  for (let f = 0; f < 2; f++) {
    for (let y = 0; y < G; y++) {
      for (let x = 0; x < G; x++) {
        const d = Math.hypot(x - 20, y - 20);
        const t = d < 7 ? 0 : Math.max(0, 1 - (d - 7) / (12 + f)) ** 1.6 * 0.5;
        if (t > 0.01) glow.px(f * G + x, y, P.sunGlow, t);
      }
    }
  }
  const glowTex = glow.texture(scene, 'sun-glow');
  for (let f = 0; f < 2; f++) glowTex.add(f, 0, f * G, 0, G, G);

  const S = RAY_R * 2 + 1;
  const rays = new Painter(S * 4, S);
  const beams = Array.from({ length: 10 }, (_, i) => ({ a: (i / 10) * Math.PI * 2 + (noise(i, 0, 900) - 0.5) * 0.4, w: 0.04 + noise(i, 1, 901) * 0.04, len: 0.5 + noise(i, 2, 902) * 0.5 }));
  for (let f = 0; f < 4; f++) {
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const d = Math.hypot(x - RAY_R, y - RAY_R);
        if (d < 8 || d > RAY_R) continue;
        const ang = Math.atan2(y - RAY_R, x - RAY_R);
        let I = 0;
        for (const b of beams) {
          const da = Math.abs(((ang - b.a - f * 0.045 + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          if (da < b.w) I = Math.max(I, (1 - da / b.w) * Math.max(0, 1 - d / (RAY_R * b.len)));
        }
        if (I > 0.01) rays.px(f * S + x, y, P.sunGlow, I * 0.5);
      }
    }
  }
  const rayTex = rays.texture(scene, 'sun-rays');
  for (let f = 0; f < 4; f++) rayTex.add(f, 0, f * S, 0, S, S);
}

// Wave crests in four bands, more widely spaced and longer as they come
// closer. Each band tiles left to right so it can scroll with the wind.
export const WAVE_BANDS = [
  { y0: HORIZON + 3, y1: HORIZON + 22, gap: 3, len: [1, 3], alpha: 0.6 },
  { y0: HORIZON + 22, y1: HORIZON + 50, gap: 4, len: [2, 5], alpha: 0.75 },
  { y0: HORIZON + 50, y1: HORIZON + 95, gap: 5, len: [3, 7], alpha: 0.9 },
  { y0: HORIZON + 95, y1: DOCK_AY + 12, gap: 6, len: [4, 10], alpha: 1 },
];
function paintWaves(scene, rng) {
  WAVE_BANDS.forEach((b, i) => {
    const h = b.y1 - b.y0;
    const p = new Painter(AW, h);
    for (let y = 1; y < h - 1; y += b.gap) {
      const row = y + Math.floor(rng() * 2);
      for (let n = 0; n < AW / (b.len[1] * 3); n++) {
        const x0 = Math.floor(rng() * AW);
        const len = b.len[0] + Math.floor(rng() * (b.len[1] - b.len[0] + 1));
        for (let k = 0; k < len; k++) {
          const x = (x0 + k) % AW;
          p.px(x, row, k === 0 || k === len - 1 ? P.waterGlint : P.waterLine, 0.9);
          if (k > 0 && k < len - 1) p.px(x, row + 1, P.water4, 0.5);
        }
      }
    }
    p.texture(scene, `waves-${i}`);
  });

  // A dark patch of ruffled water that runs ahead of a gust.
  const g = new Painter(60, 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 60; x++) {
      const e = ((x - 30) / 30) ** 2 + ((y - 8) / 8) ** 2;
      if (e < 1) g.px(x, y, P.water5, (1 - e) * 0.5);
    }
  }
  g.texture(scene, 'gust');
}

function ridge(rng, base, count, minH, maxH, minW, maxW) {
  const top = new Array(AW).fill(base);
  for (let i = 0; i < count; i++) {
    const cx = -15 + rng() * (AW + 30);
    const h = minH + rng() * (maxH - minH);
    const w = minW + rng() * (maxW - minW);
    for (let x = 0; x < AW; x++) {
      const d = Math.abs(x - cx) / w;
      if (d < 1) top[x] = Math.min(top[x], base - h * Math.pow(1 - d, 1.2));
    }
  }
  return top.map(Math.round);
}

function paintMountains(scene, rng) {
  const p = new Painter(AW, HORIZON);
  const far = ridge(rng, HORIZON - 10, 7, 16, 38, 16, 40);
  const snowLine = HORIZON - 34;
  for (let x = 0; x < AW; x++) {
    // faces turned to the sun (on the right) are light; others in blue shadow
    const lit = (far[x + 1] ?? far[x]) > (far[x - 1] ?? far[x]);
    // low-frequency crags down each face
    const crag = noise(Math.floor(x / 3), 0, 9) < 0.3;
    for (let y = far[x]; y < HORIZON; y++) {
      const depth = y - far[x];
      let c = lit ? P.mtnFarLit : crag && depth > 3 ? P.mtnFarDark : P.mtnFar;
      if (far[x] < snowLine && depth < 2 + (snowLine - far[x]) * 0.35) c = lit ? P.snow : P.snowShade;
      if (depth === 0) c = lit ? P.snow : P.mtnFarLit;
      const haze = (y - (HORIZON - 20)) / 20;
      p.px(x, y, haze > 0 ? mix(c, P.mist, haze * 0.8) : c);
    }
  }
  // forested foothills with a bumpy crown of distant trees along the top
  const near = ridge(rng, HORIZON - 2, 9, 4, 16, 10, 28).map((t, x) => t - Math.round(Math.abs(Math.sin(x * 0.9)) * 2));
  for (let x = 0; x < AW; x++) {
    const lit = (near[x + 1] ?? near[x]) > (near[x - 1] ?? near[x]);
    for (let y = near[x]; y < HORIZON; y++) {
      const d = y - near[x];
      let c = d === 0 ? P.mtnNearLit : lit && d < 4 ? P.mtnNearLit : P.mtnNear;
      if (noise(Math.floor(x / 2), Math.floor(y / 2), 8) < 0.18) c = P.mtnNearDark;
      p.px(x, y, c);
    }
  }
  p.texture(scene, 'mountains');
  return p;
}

// A round canopy built from many small leaf clumps, each lit from the upper
// right, so the crown reads as a bumpy mass of foliage.
function crown(s, cx, cy, r, base, seed) {
  const clumps = [];
  const n = Math.round(r * 1.4) + 4;
  for (let i = 0; i < n; i++) {
    const a = noise(i, seed, 1) * Math.PI * 2;
    const d = Math.sqrt(noise(i, seed, 2)) * (r - 2.5);
    clumps.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.85, r: 2.4 + noise(i, seed, 3) * 2 });
  }
  clumps.push({ x: cx, y: cy, r: r * 0.6 });
  clumps.sort((a, b) => b.y - a.y); // lower clumps first, upper ones over them
  for (const c of clumps) {
    for (let y = Math.floor(c.y - c.r); y <= c.y + c.r; y++) {
      for (let x = Math.floor(c.x - c.r); x <= c.x + c.r; x++) {
        const dx = (x - c.x) / c.r;
        const dy = (y - c.y) / c.r;
        const d = dx * dx + dy * dy;
        if (d > 1) continue;
        let k = dx * 0.45 - dy * 0.6 - ((y - cy) / r) * 0.45;
        if (d > 0.6) k -= 0.35; // shadow tucked under each clump
        s.px(x, y, tone(base, k));
      }
    }
    if (noise(Math.round(c.x), Math.round(c.y), seed) < 0.5) s.px(Math.round(c.x + c.r * 0.3), Math.round(c.y - c.r * 0.5), tone(base, 1));
  }
}

function tree(p, cx, baseY, r, base, seed) {
  const top = baseY - r * 2 - 4;
  stamp(p, r * 2 + 8, r * 2 + 8, cx - r - 4, top, (s) => {
    const ox = r + 4;
    for (let y = r + 2; y < r * 2 + 6; y++) {
      for (let i = -1; i <= 1; i++) s.px(ox + i, y, tone(P.trunk, i * 0.35));
    }
    crown(s, ox, r + 2, r, base, seed);
  });
}

// A tiered pine in clean bands.
function pine(p, cx, baseY, h, base) {
  const w = Math.ceil(h * 0.5) + 4;
  stamp(p, w, h + 3, cx - Math.floor(w / 2), baseY - h - 1, (s) => {
    const ox = Math.floor(w / 2);
    const maxHalf = Math.max(1, h * 0.22);
    for (let r = 0; r < h; r++) {
      const t = (r + 1) / h;
      const tier = r % 4;
      const half = Math.round(maxHalf * t * (0.65 + 0.12 * tier));
      for (let x = -half; x <= half; x++) {
        const side = half ? x / half : 0;
        s.px(ox + x, 1 + r, tone(base, side * 0.5 + (tier === 0 ? 0.3 : tier === 3 ? -0.35 : 0)));
      }
    }
    s.px(ox, h + 1, P.trunk);
  });
}

function snag(p) {
  const { x, top } = SNAG;
  stamp(p, 9, HORIZON - top + 2, x - 4, top - 1, (s) => {
    for (let y = 1; y < HORIZON - top - 1; y++) {
      s.px(4, y, tone(P.snag, 0.3));
      s.px(5, y, tone(P.snag, -0.4));
    }
    for (const [y, dir] of [[6, -1], [11, 1], [16, -1], [21, 1], [26, -1]]) {
      for (let i = 1; i <= 3; i++) s.px(dir > 0 ? 5 + i : 4 - i, y - (i >> 1), tone(P.snag, dir > 0 ? 0.3 : -0.3));
    }
  });
}

// Layered rock cliff on the west shore, with a tree on top. The waterfall
// pours down its face.
function cliff(p) {
  const w = 22;
  const oy = FALLS.top - 6;
  const top = (x) => FALLS.top - 4 + Math.round(Math.abs(Math.sin(x * 0.7)) * 3) + (x > 16 ? (x - 16) * 3 : 0);
  stamp(p, w + 2, HORIZON - oy + 2, 0, oy, (s) => {
    for (let x = 0; x < w; x++) {
      for (let y = top(x); y < HORIZON; y++) {
        const strata = Math.floor((y + Math.round(noise(Math.floor(x / 4), 0, 30) * 3)) / 3) % 3;
        let k = [0.35, 0, -0.35][strata];
        if (x === w - 1 || top(x + 1) > y) k -= 0.4; // shadowed edge
        if (noise(x, Math.floor(y / 4), 31) < 0.08) k -= 0.6; // cracks
        s.px(x, y - oy, tone(P.rock, k));
      }
      // mossy grass along the cliff top
      s.px(x, top(x) - oy, tone(P.rockMoss, 0.3));
      s.px(x, top(x) + 1 - oy, tone(P.rockMoss, -0.2));
    }
  });
  tree(p, 4, FALLS.top - 3, 5, P.leaf, 61);
}

function paintForest(scene, rng) {
  const p = new Painter(AW, HORIZON);
  const base = HORIZON - 2;
  // back rank: bluish, softer canopies and pines
  for (let x = -6; x < AW + 6; x += 6 + Math.floor(rng() * 4)) {
    if (rng() < 0.3) pine(p, x, base - 1, 12 + Math.floor(rng() * 8), P.pine);
    else tree(p, x, base - 1 - Math.floor(rng() * 3), 5 + Math.floor(rng() * 3), P.leafBack, x + 10);
  }
  snag(p);
  // front rank: big round canopies, a few pines, splashes of colour
  for (let x = 24; x < AW + 8; x += 9 + Math.floor(rng() * 6)) {
    const roll = rng();
    if (roll < 0.22) pine(p, x, base, 16 + Math.floor(rng() * 10), P.pine);
    else {
      const colour = roll < 0.3 ? P.maple : roll < 0.36 ? P.blossom : roll < 0.55 ? P.leafLime : P.leaf;
      tree(p, x, base, 6 + Math.floor(rng() * 4), colour, x + 300);
    }
  }
  cliff(p);
  // grassy shore with wildflowers
  for (let x = 20; x < AW; x++) {
    for (let y = base - 1; y < HORIZON; y++) p.px(x, y, tone(P.grass, y === base - 1 ? 0.35 : -0.2));
    if (noise(x, 0, 32) < 0.12) p.px(x, base - 1, [P.flowerRed, P.flowerYellow, P.flowerWhite][x % 3]);
  }
  p.texture(scene, 'forest');
  return p;
}

// The waterfall: a column of falling water that tiles vertically so it can
// scroll, and three frames of churning foam where it meets the lake.
function paintFalls(scene) {
  const { w } = FALLS;
  const h = 16;
  const f = new Painter(w, h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const n = noise(x, Math.floor(y / 2) % (h / 2), 40);
      let c = n < 0.35 ? '#ffffff' : n < 0.7 ? P.waterGlint : n < 0.9 ? P.water1 : P.water2;
      if (x === 0 || x === w - 1) c = n < 0.5 ? P.water2 : P.water3;
      f.px(x, y, c);
    }
  }
  f.texture(scene, 'falls');

  const fw = w + 8;
  const foam = new Painter(fw * 3, 7);
  for (let k = 0; k < 3; k++) {
    for (let i = 0; i < 9; i++) {
      const x = 2 + Math.floor(noise(i, k, 41) * (fw - 4));
      const y = 2 + Math.floor(noise(i, k, 42) * 3);
      const r = 1 + noise(i, k, 43) * 1.5;
      for (let yy = -2; yy <= 2; yy++) {
        for (let xx = -2; xx <= 2; xx++) {
          if (xx * xx + yy * yy <= r * r) foam.px(k * fw + x + xx, y + yy, yy < 0 ? '#ffffff' : P.waterGlint);
        }
      }
    }
  }
  const tex = foam.texture(scene, 'foam');
  for (let k = 0; k < 3; k++) tex.add(k, 0, k * fw, 0, fw, 7);
}

function paintWater(scene, rng, mountains, forest) {
  const h = AH - HORIZON;
  const p = new Painter(AW, h);
  vgradient(p, 0, h, [[0, P.water0], [0.04, P.water1], [0.16, P.water2], [0.4, P.water3], [0.75, P.water4], [1, P.water5]]);

  // bright horizontal streaks where the surface catches the sky
  for (let r = 1; r < h; r++) {
    const freq = 0.18 / (1 + r / 20);
    const phase = noise(r, 0, 11) * 20;
    for (let x = 0; x < AW; x++) {
      const v = Math.sin(x * freq + phase) * 0.6 + Math.sin(x * freq * 2.3 + phase * 1.7) * 0.4;
      if (v > 0.72) p.recolor(x, r, mix(p.get(x, r), P.waterGlint, 0.35));
      else if (v < -0.8) p.recolor(x, r, mix(p.get(x, r), P.water5, 0.15));
    }
  }

  // the shore mirrored in the water, softened, with ripple lines through it
  const R = 40;
  for (let r = 0; r < R; r++) {
    const sy = HORIZON - 1 - r;
    if (sy < 0) break;
    const a = 0.55 * (1 - r / R);
    const wob = Math.round(Math.sin(r * 0.9));
    for (let x = 0; x < AW; x++) {
      const sx = Math.min(AW - 1, Math.max(0, x + wob));
      const look = (ix) => (forest.alphaAt(ix, sy) ? forest.get(ix, sy) : mountains.alphaAt(ix, sy) ? mountains.get(ix, sy) : null);
      const src = look(sx);
      if (!src) continue;
      let c = mix(mix(look(Math.max(0, sx - 1)) || src, look(Math.min(AW - 1, sx + 1)) || src, 0.5), src, 0.5);
      c = mix(c, p.get(x, r), 0.35);
      if (r > 3 && r % 3 === 2) c = mix(c, P.waterGlint, 0.3);
      p.px(x, r, c, a);
    }
  }
  // foam line along the shore
  for (let x = 0; x < AW; x++) if (noise(x, 1, 12) < 0.55) p.px(x, 0, P.waterLine, 0.8);

  // glitter on the water below the sun
  for (let r = 1; r < 80; r += 2) {
    if (rng() < 0.4) continue;
    const cx = SUN.x + Math.round((rng() - 0.5) * (4 + r * 0.4));
    const len = Math.floor(rng() * 3);
    p.hline(cx - len, cx + len, r, '#ffffff', 0.7 * (1 - r / 80));
  }

  island(p, 15, 30);
  basking(p, Math.round(AW * 0.66), Math.round(h * 0.42));
  lilyPads(p, rng, 22, 69, 5);
  lilyPads(p, rng, 150, h - 112, 4);
  p.texture(scene, 'water');
}

// A rocky islet with a round tree and a pine, mirrored below.
function island(p, cx, cy) {
  const isle = new Painter(36, 26);
  const base = 20;
  pine(isle, 22, base - 1, 15, P.pine);
  tree(isle, 13, base - 1, 6, P.leaf, 402);
  stamp(isle, 30, 5, 3, base - 2, (s) => {
    for (let y = 0; y < 3; y++) for (let x = y; x < 28 - y * 2; x++) s.px(x, y + 1, tone(P.rock, 0.35 - y * 0.35));
    for (let x = 2; x < 24; x++) s.px(x, 0, tone(P.rockMoss, 0.2));
  });
  const ox = cx - 18;
  const oy = cy - base;
  for (let y = 0; y < isle.h; y++) {
    for (let x = 0; x < isle.w; x++) {
      if (!isle.alphaAt(x, y)) continue;
      p.px(ox + x, oy + y, isle.get(x, y));
      const ry = base + 3 + (base - y);
      if (ry < isle.h + 14 && ry % 3 !== 0) p.px(ox + x, oy + ry, mix(isle.get(x, y), p.get(ox + x, Math.min(p.h - 1, oy + ry)), 0.5), 0.55);
    }
  }
  p.hline(ox + 3, ox + 31, oy + base + 2, P.waterLine, 0.7);
}

// A half-sunk log with a painted turtle catching the sun.
function basking(p, x, y) {
  stamp(p, 26, 7, x - 2, y - 4, (s) => {
    for (let i = 0; i < 20; i++) {
      s.px(i + 2, 4, tone('#9a6a3a', 0.35));
      s.px(i + 2, 5, tone('#9a6a3a', -0.35));
    }
    s.px(22, 3, '#7a4a2a');
    s.px(23, 2, '#7a4a2a');
    s.hline(9, 12, 2, '#3a8a3a');
    s.px(10, 2, '#7ac850');
    s.hline(8, 13, 3, '#2a6a2a');
    s.px(8, 3, '#f0d040');
    s.px(13, 3, '#f0d040');
    s.px(14, 2, '#2a5a2a');
    s.px(15, 2, '#f0d040');
  });
  p.hline(x - 2, x + 22, y + 3, P.waterLine, 0.6);
}

function lilyPads(p, rng, cx, cy, n) {
  for (let i = 0; i < n; i++) {
    const x = cx + Math.round((rng() - 0.5) * 14);
    const y = cy + Math.round((rng() - 0.5) * 6);
    const rx = 1 + Math.floor(rng() * 2);
    const base = rng() < 0.3 ? P.padYellow : P.pad;
    for (let dx = -rx - 1; dx <= rx + 1; dx++) {
      if (Math.abs(dx) <= rx) p.px(x + dx, y - 1, tone(base, 0.35));
      p.px(x + dx, y, tone(base, -0.1));
    }
    p.px(x + 1, y - 1, tone(base, -0.7));
    p.hline(x - rx - 1, x + rx + 1, y + 1, P.water5, 0.4);
    if (i % 2 === 0) {
      // a pink lotus in bloom
      p.px(x - 1, y - 2, P.lotus);
      p.px(x + 1, y - 2, P.lotus);
      p.px(x, y - 3, P.lotus);
      p.px(x, y - 2, P.flowerYellow);
    }
  }
}

// Reeds, cattails and meadow flowers are drawn live (see environment/Reeds.js)
// so they can sway in the wind. Each one keeps its shape and colours here.
export const REEDS = [];
function reed(bx, by, h, lean, kind, seed) {
  const stalk = [];
  for (let k = 0; k < h; k++) stalk.push(hex(tone(kind === 'flower' ? P.grass : P.reed, (k / h - 0.5) * 0.6 + (noise(k, seed, 600) < 0.25 ? 0.33 : 0))));
  const head = kind === 'cattail' ? Array.from({ length: 5 }, (_, i) => [hex(tone(P.cattail, -0.33)), hex(tone(P.cattail, i < 2 ? 0.66 : 0.33))]) : null;
  const bloom = kind === 'flower' ? [P.flowerRed, P.flowerYellow, P.flowerWhite, P.flowerViolet][seed % 4] : null;
  return {
    bx, by, h, lean, stalk, head,
    bloom: bloom && { petal: hex(tone(bloom, 0)), lit: hex(tone(bloom, 0.66)), heart: hex(tone(P.flowerYellow, bloom === P.flowerYellow ? -0.66 : 0)) },
    tip: hex(tone(P.reed, 0.33)),
    phase: noise(seed, 0, 604) * 6,
    give: 0.7 + noise(seed, 1, 605) * 0.6,
  };
}

function paintBanks(scene, rng) {
  REEDS.length = 0;
  const p = new Painter(AW, AH);
  const yTop = AH - 112;
  const edgeAt = (y) => Math.round(4 + (y - yTop) * 0.34 + Math.sin(y * 0.33) * 1.5);

  // left bank: a lush meadow sloping to the water
  stamp(p, 50, AH - yTop + 2, 0, yTop - 1, (s) => {
    for (let y = yTop; y < AH; y++) {
      const e = edgeAt(y);
      for (let x = 0; x <= e; x++) {
        if (e - x < 2) {
          s.px(x, y - yTop + 1, tone(P.earth, e - x === 0 ? -0.33 : 0));
          continue;
        }
        // grass tufts: small lighter chevrons scattered through the turf
        let k = (x - e) * 0.03;
        const tx = x % 4;
        const ty = (y + Math.floor(x / 4) * 2) % 5;
        if (ty === 0 && tx === 1) k += 0.66;
        else if (ty === 1 && (tx === 0 || tx === 2)) k += 0.33;
        else if (ty === 3) k -= 0.2;
        s.px(x, y - yTop + 1, tone(P.grass, k));
      }
    }
  });
  for (let y = yTop; y < AH; y++) p.px(edgeAt(y) + 2, y, P.waterLine, 0.6);
  for (let i = 0; i < 14; i++) {
    const y = yTop + 8 + Math.floor(rng() * 100);
    const x = 2 + Math.floor(rng() * Math.max(1, edgeAt(y) - 5));
    p.px(x, y, [P.flowerRed, P.flowerYellow, P.flowerWhite, P.flowerViolet][i % 4]);
  }
  for (let i = 0; i < 14; i++) {
    const by = yTop + 5 + Math.floor(rng() * 105);
    if (by >= AH) continue;
    REEDS.push(reed(edgeAt(by) - Math.floor(rng() * 4), by, 14 + Math.floor(rng() * 19), (rng() - 0.3) * 5, rng() < 0.5 ? 'cattail' : 'reed', i));
  }
  for (let i = 0; i < 10; i++) {
    const by = yTop + 10 + Math.floor(rng() * 95);
    if (by >= AH) continue;
    REEDS.push(reed(2 + Math.floor(rng() * Math.max(1, edgeAt(by) - 6)), by, 5 + Math.floor(rng() * 5), (rng() - 0.5) * 2, 'flower', i + 20));
  }

  // right bank: mossy boulders
  for (const [cx, cy, rx, ry] of [[178, AH - 60, 8, 7], [177, AH - 34, 10, 9], [170, AH - 48, 7, 5], [164, AH - 10, 16, 10], [150, AH - 4, 10, 6]]) {
    boulder(p, cx, cy, rx, ry);
  }
  for (let i = 0; i < 6; i++) {
    REEDS.push(reed(160 + Math.floor(rng() * 16), AH - 75 + Math.floor(rng() * 30), 11 + Math.floor(rng() * 10), (rng() - 0.6) * 4, rng() < 0.3 ? 'cattail' : 'reed', i + 40));
  }
  p.texture(scene, 'banks');
}

// A boulder lit as a sphere in clean bands, with a cap of moss.
function boulder(p, cx, cy, rx, ry) {
  p.hline(cx - rx - 1, cx + rx + 1, cy + ry + 2, P.waterLine, 0.6);
  stamp(p, rx * 2 + 3, ry * 2 + 3, cx - rx - 1, cy - ry - 1, (s) => {
    for (let y = -ry; y <= ry; y++) {
      for (let x = -rx; x <= rx; x++) {
        const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
        if (d > 1) continue;
        const nz = Math.sqrt(1 - d);
        const lit = (x / rx) * 0.5 - (y / ry) * 0.6 + nz * 0.6;
        const moss = y / ry < -0.45 + Math.sin(x * 0.8) * 0.12;
        const base = moss ? P.rockMoss : noise(cx + x, cy + y, 700) < 0.05 ? P.lichen : P.stone;
        s.px(rx + 1 + x, ry + 1 + y, tone(base, (lit - 0.55) * 1.3));
      }
    }
  });
}

function paintDock(scene) {
  const p = new Painter(AW, AH);
  const y0 = DOCK_AY;
  const depth = AH - y0;
  const leftAt = (y) => Math.round(40 - ((y - y0) * 20) / depth);
  const rightAt = (y) => Math.round(140 + ((y - y0) * 20) / depth);

  for (const x of [38, 139]) {
    stamp(p, 5, 10, x - 1, y0 - 7, (s) => {
      for (let y = 1; y < 9; y++) for (let i = 0; i < 3; i++) s.px(1 + i, y, tone(P.wood, (i - 1) * 0.5 + (y === 1 ? 0.5 : 0)));
    });
  }
  for (const y of [y0 - 3, y0 - 1]) for (let x = 37; x <= 42; x++) p.px(x, y, tone(P.rope, x % 2 ? 0.33 : -0.33));

  // planks, alternating warm tones, with nails and darker grain
  for (let y = y0; y < AH; y++) {
    const row = (y - y0) % 5;
    const board = Math.floor((y - y0) / 5);
    const plank = board % 3 === 1 ? P.woodAlt : P.wood;
    const l = leftAt(y);
    const r = rightAt(y);
    for (let x = l; x <= r; x++) {
      let c;
      if (row === 4 || x === l || x === r) c = P.woodGap;
      else c = tone(plank, row === 0 ? 0.66 : row === 3 ? -0.33 : noise(Math.floor((x + board * 7) / 5), row, 804) < 0.15 ? -0.33 : 0);
      p.px(x, y, c);
    }
    if (row === 1) {
      p.px(l + 2, y, P.nail);
      p.px(r - 2, y, P.nail);
    }
  }

  p.ellipse(PLAYER_AX, y0 + 12, 6, 1, P.ink, 0.3);
  p.ellipse(DOG.x, DOG.y, 7, 1, P.ink, 0.25);

  // tackle box
  stamp(p, 13, 9, 105, y0 + 7, (s) => {
    for (let y = 0; y < 6; y++) for (let x = 0; x < 11; x++) s.px(1 + x, 2 + y, tone(y < 2 ? P.tackleDark : P.tackle, (y === 2 ? 0.5 : 0) + (x > 8 ? 0.33 : x < 2 ? -0.33 : 0)));
    s.hline(5, 8, 0, P.metal);
    s.px(5, 1, P.metalDark);
    s.px(8, 1, P.metalDark);
    s.px(6, 4, '#ffe060');
  });

  // enamel camp mug
  stamp(p, 6, 6, MUG.x - 1, MUG.y - 1, (s) => {
    for (let y = 0; y < 4; y++) for (let x = 0; x < 3; x++) s.px(1 + x, 1 + y, tone(P.mug, (x - 1) * 0.5));
    s.hline(1, 3, 1, P.enamel);
    s.px(4, 2, P.mug);
    s.px(4, 3, P.mug);
  });

  // galvanised bait bucket
  stamp(p, 9, 10, 126, y0 + 21, (s) => {
    for (let y = 0; y < 6; y++) for (let x = y >> 2; x <= 5 - (y >> 2); x++) s.px(1 + x, 3 + y, y === 0 ? P.enamel : tone(P.metal, (x - 2.5) * 0.25 + (y % 2 ? -0.33 : 0)));
    s.hline(1, 6, 1, P.metalDark);
    s.px(0, 2, P.metalDark);
    s.px(7, 2, P.metalDark);
  });

  p.texture(scene, 'dock');
}

// Puffy cumulus: a row of round billows piled highest in the middle, each
// lit on top and shaded underneath so the lumps read, on a flat cool base.
function paintCloud(scene, key, w, h, rng) {
  const p = new Painter(w, h);
  const n = Math.max(3, Math.floor(w / 5));
  const puffs = [];
  for (let i = 0; i < n; i++) {
    const cx = 3 + (i / (n - 1)) * (w - 6) + (rng() - 0.5) * 2;
    const r = Math.max(2.5, (h - 2) * (0.32 + 0.4 * Math.sin((Math.PI * cx) / w)) * (0.85 + rng() * 0.3));
    puffs.push({ cx, cy: h - 2 - r * 0.75, r });
  }
  // middle billows sit on top of the outer ones
  puffs.sort((a, b) => a.r - b.r);
  for (const b of puffs) {
    for (let y = Math.floor(b.cy - b.r); y < h - 1; y++) {
      for (let x = Math.floor(b.cx - b.r); x <= b.cx + b.r; x++) {
        const dx = (x - b.cx) / b.r;
        const dy = (y - b.cy) / b.r;
        if (dx * dx + dy * dy > 1) continue;
        const k = -dy * 0.8 + dx * 0.25;
        p.px(x, y, k > 0.35 ? P.cloudLight : k > -0.25 ? P.cloud : P.cloudShade);
      }
    }
  }
  for (let x = 0; x < w; x++) if (p.alphaAt(x, h - 2)) p.px(x, h - 2, P.cloudShade);
  p.texture(scene, key);
}

// Soft mist that tiles seamlessly left to right.
function paintMist(scene, key, w, h, density, rng) {
  const p = new Painter(w, h);
  const step = 12;
  const knots = Array.from({ length: Math.ceil(w / step) }, () => rng());
  const wave = (x) => {
    const i = Math.floor(x / step);
    const t = (x % step) / step;
    const a = knots[i % knots.length];
    const b = knots[(i + 1) % knots.length];
    return a + (b - a) * (0.5 - Math.cos(Math.PI * t) / 2);
  };
  for (let y = 0; y < h; y++) {
    const v = Math.sin((Math.PI * (y + 0.5)) / h);
    for (let x = 0; x < w; x++) p.px(x, y, P.mist, v * wave(x) * density * 0.8);
  }
  p.texture(scene, key);
}
