// Loon Lake, painted in a 16-bit console RPG style: round leaf-clump
// canopies, tiered pines, layered rock, a waterfall, meadow flowers and
// bright water. Shading is clean bands of a colour ramp with dark outlines.
import { Painter, mix, mulberry32, shade, noise } from './Painter.js';
import { P } from './palette.js';
import { placePiece } from './Packs.js';
import { AW, AH, HORIZON, DOCK_AY } from '../core/constants.js';

export const SUN = { x: 138, y: 30 };
export const SNAG = { x: 30, top: HORIZON - 40 }; // dead pine the eagle perches on
export const FALLS = { x: 6, top: HORIZON - 30, w: 8 }; // waterfall off the cliff
const lerp = (a, b, t) => a + (b - a) * t;

// The pier is laid out along one long edge, parameter t from 0 at its wide
// end to 1 at its narrow end, then the whole thing is turned 180 degrees
// about its middle. On screen it runs in narrow from the bottom-left corner
// and widens toward the upper right, where it ends. Planks run across it at
// a slant. The upper edge faces the lake; the lower edge is where the side
// beam and the pilings hang down into the water. All values are art pixels.
export const DOCK = { x0: -34, x1: 136, y0: AH + 8, y1: DOCK_AY - 2, w0: 30, w1: 22, slant: -0.35 };
// After turning, the pier is raised so its beam and pilings sit fully on screen.
const LIFT = 30;
const CENTER = { x: (DOCK.x0 + DOCK.x1) / 2, y: (DOCK.y0 + DOCK.y1) / 2 };
const turn = (p) => ({ x: 2 * CENTER.x - p.x, y: 2 * CENTER.y - p.y - LIFT });
const edgeA = (t) => ({ x: lerp(DOCK.x0, DOCK.x1, t), y: lerp(DOCK.y0, DOCK.y1, t) });
const width = (t) => lerp(DOCK.w0, DOCK.w1, t);
const edgeB = (t) => ({ x: edgeA(t).x + width(t) * DOCK.slant, y: edgeA(t).y - width(t) });
// after the turn: the lake-side (upper) edge and the lower edge
const upper = (t) => turn(edgeA(t));
const lower = (t) => turn(edgeB(t));

// The pier's edges at a given screen column: `back` is the upper, lake-side
// edge and `front` the lower edge.
export function dockAt(x) {
  const ox = 2 * CENTER.x - x; // the same column before the turn
  const span = DOCK.x1 - DOCK.x0;
  const t = Math.max(0, Math.min(1, (ox - DOCK.x0) / span));
  const tb = Math.max(0, Math.min(1, (ox - DOCK.x0 - DOCK.w0 * DOCK.slant) / (span + (DOCK.w1 - DOCK.w0) * DOCK.slant)));
  return { t, back: 2 * CENTER.y - LIFT - edgeA(t).y, front: 2 * CENTER.y - LIFT - edgeB(tb).y };
}
// The angler sits on the lake-side edge near the wide end, facing the water.
export const PLAYER = { x: 110, y: Math.round(dockAt(110).back) + 3 };
export const MUG = { x: 118, y: Math.round(dockAt(118).back) + 8 };
export const DOG = { x: 74, y: Math.round(dockAt(74).back) + 9 };
export const REED_BED = { x: 0, w: 44, y: HORIZON + 46 }; // waterline of the reed bed

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
  { y0: HORIZON + 95, y1: AH, gap: 6, len: [4, 10], alpha: 1 },
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
  // front rank: trees from the Tiny Town pack, gold tamaracks among them and
  // the odd painted blossom tree for a splash of pink
  for (let x = 24; x < AW + 8; x += 9 + Math.floor(rng() * 6)) {
    const roll = rng();
    const v = rng();
    if (roll < 0.22) placePiece(p, 'tree-tall', x, base + 2, v < 0.5);
    else if (roll < 0.3) placePiece(p, v < 0.5 ? 'tree-tall-gold' : 'tree-small-gold', x, base + 2, v < 0.25);
    else if (roll < 0.36) tree(p, x, base, 6 + Math.floor(v * 4), P.blossom, x + 300);
    else placePiece(p, v < 0.5 ? 'tree-small' : v < 0.8 ? 'bush' : 'tree-tall', x, base + 2, v < 0.3);
  }
  cliff(p);
  // grassy shore with wildflowers
  for (let x = 20; x < AW; x++) {
    for (let y = base - 1; y < HORIZON; y++) p.px(x, y, tone(P.grass, y === base - 1 ? 0.35 : -0.2));
    if (noise(x, 0, 32) < 0.12) p.px(x, base - 1, [P.flowerRed, P.flowerYellow, P.flowerWhite][x % 3]);
  }
  // boulders from the Zelda-like pack along the waterline
  [[44, 'rock-3'], [70, 'rock-4'], [101, 'rock-1'], [133, 'rock-3'], [150, 'rock-4'], [174, 'rock-0']].forEach(([x, k], i) => placePiece(p, k, x, HORIZON + 1, i % 2 === 1));
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

  // rocks breaking the surface, ringed in foam
  placePiece(p, 'rock-wet-0', 114, REED_BED.y - HORIZON + 20);
  placePiece(p, 'rock-wet-1', 118, 36, true);
  island(p, 160, 20);
  basking(p, Math.round(AW * 0.66), Math.round(h * 0.42));
  lilyPads(p, rng, 56, REED_BED.y - HORIZON + 4, 5);
  lilyPads(p, rng, 150, Math.round(h * 0.62), 3);
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

// A reed bed along the grassy point on the west side (a Tiled map, see
// environment/Shore.js): a dense dark base of stems, with taller reeds and
// cattails above it that sway in the wind.
function paintBanks(scene, rng) {
  REEDS.length = 0;
  const p = new Painter(AW, AH);
  const { x: bx, w, y: by } = REED_BED;
  stamp(p, w + 4, 16, bx - 1, by - 13, (s) => {
    for (let x = 1; x <= w; x++) {
      const fade = 1 - Math.max(0, (x - w * 0.6) / (w * 0.4));
      const h = Math.max(1, Math.round((7 + 3 * Math.sin(x * 0.35) + noise(x, 0, 500) * 3) * fade));
      for (let y = 13 - h; y <= 13; y++) {
        let k = -0.33 + (noise(x, Math.floor(y / 2), 501) < 0.3 ? 0.33 : 0);
        if (y === 13 - h) k += 0.33;
        s.px(x, y, tone(noise(x, y, 502) < 0.2 ? P.grassGold : P.reed, k));
      }
    }
  });
  for (let i = 0; i < 26; i++) {
    const x = bx + 1 + Math.floor(rng() * (w - 6));
    const h = Math.round((9 + rng() * 13) * (1 - x / (w * 1.6)));
    REEDS.push(reed(x, by - Math.floor(rng() * 3), h, (rng() - 0.3) * 3, rng() < 0.3 ? 'cattail' : 'reed', i));
  }
  p.texture(scene, 'banks');
}

function paintDock(scene) {
  const d = new Painter(AW, AH);
  const N = 18; // planks along the pier
  // Planks get narrower with distance; this maps distance along the pier
  // to a plank number.
  const plankAt = (t) => N * (1 - Math.pow(1 - t, 1 / 1.1));
  const tOfPlank = (i) => 1 - Math.pow(1 - i / N, 1.1);
  const span = DOCK.x1 - DOCK.x0;

  // Weathered boards. Sun and rain have silvered most of them grey; a few
  // are darker where they stay damp. Each has wavering grain, some have a
  // knot or a split, one has snapped off partway across, and the gaps show
  // the shadowed water beneath. The sun is high on the right, so each
  // board's right-hand edge catches the light and its left edge sits in
  // the shadow of the gap.
  const weathered = '#8f8a7e';
  const below = '#10284a'; // shadowed water seen between the boards
  const broken = 7;
  const boardTone = (idx) => {
    let c = mix(idx % 3 === 1 ? P.woodAlt : P.wood, weathered, 0.25 + noise(idx, 1, 811) * 0.4);
    if (noise(idx, 0, 810) < 0.15) c = mix(c, '#4a3a2c', 0.4);
    return c;
  };
  const shadows = []; // cast onto the water, painted under the pier later

  for (let i = 0; i <= span * 4; i++) {
    const t = i / (span * 4);
    const f0 = upper(t);
    const b0 = lower(t);
    const q = plankAt(t);
    const idx = Math.floor(q);
    const f = q - idx;
    const base = boardTone(idx);
    const knot = noise(idx, 4, 814) < 0.45 ? { v: 0.2 + noise(idx, 2, 812) * 0.6, f: 0.35 + noise(idx, 3, 813) * 0.35 } : null;
    const split = noise(idx, 5, 815) < 0.35 ? noise(idx, 6, 816) * 0.5 : -1;
    const snapAt = 0.55 + noise(i, 0, 817) * 0.1;
    const steps = Math.ceil(width(t) * 3);
    for (let j = 0; j <= steps; j++) {
      const v = j / steps; // 0 at the upper (lake-side) edge, 1 at the lower edge
      const x = Math.round(lerp(f0.x, b0.x, v));
      const y = Math.round(lerp(f0.y, b0.y, v));
      let c;
      if (f < 0.1 || (idx === broken && v > snapAt)) c = below;
      else if (split >= 0 && v > split && v < split + 0.45 && Math.abs(f - 0.56) < 0.05) c = below;
      else {
        let k = f < 0.18 ? 0.5 : f > 0.8 ? -0.33 : 0.1;
        if (v < 0.07) k += 0.33; // lake-side edge
        for (const g of [0.42, 0.68]) if (Math.abs(f - (g + 0.07 * Math.sin(v * 10 + idx * 2))) < 0.045) k -= 0.33; // grain
        if (knot) {
          const dk = Math.hypot((v - knot.v) * width(t), (f - knot.f) * 4);
          if (dk < 0.8) k = -0.85;
          else if (dk < 1.7) k -= 0.33;
        }
        c = tone(base, k);
        if (t < 0.45 && f > 0.5 && f < 0.62 && (j === 1 || j === steps - 1)) c = P.nail;
        else if (t < 0.45 && f > 0.5 && f < 0.62 && (j === 2 || j === steps - 2)) c = '#9a5030'; // rust bleeding from the nail
      }
      d.px(x, y, c);
    }
    // sunlit plank ends, then the side beam in deep shadow, slick with algae
    // at the bottom where the spray reaches it
    const beam = Math.max(2, Math.round(lerp(4, 3, t)));
    const fx = Math.round(b0.x);
    const fy = Math.round(b0.y);
    d.px(fx, fy + 1, f < 0.1 ? below : tone(base, 0.5));
    for (let k = 2; k <= beam; k++) {
      const c = tone(mix(P.woodDark, weathered, 0.2), -0.5 - k * 0.1);
      d.px(fx, fy + k, k === beam && noise(i, 1, 818) < 0.4 ? '#2f5a34' : c);
    }
    // the pier's shadow falls away from the sun, down and to the left
    const reach = Math.round(lerp(11, 7, t));
    for (let k = 0; k < reach; k++) shadows.push([Math.round(fx - k * 0.6), fy + beam + 1 + k, 0.6 * (1 - (k / reach) * 0.45)]);
  }

  // Pilings hold the pier up along both edges, every few planks, their tops
  // standing a little proud of the deck. Sunlit on the right, shadowed on
  // the left; along the front edge they run down into the water, green with
  // algae at the waterline and dark where they stay wet.
  const piling = (x, top, len, pw, wl) => {
    const wood = mix(P.woodDark, weathered, 0.3);
    for (let y = 0; y < len; y++) {
      for (let k = 0; k < pw; k++) {
        let c = tone(wood, k === pw - 1 ? 0.5 : k === 0 ? -0.66 : -0.1);
        if (y === 0) c = tone(weathered, 0.5); // sawn top catching the light
        if (wl) {
          if (y >= wl - 2 && y < wl) c = mix(c, '#3a6a34', 0.6);
          if (y > wl) c = mix(tone(wood, -0.66), P.water4, 0.35 + (y - wl) / len);
        }
        d.px(x + k, top + y, c);
      }
    }
    if (wl) {
      d.hline(x - 1, x + pw, top + wl, P.waterLine);
      for (let k = 0; k < Math.round(len * 0.5); k++) shadows.push([x - 1 - Math.round(k * 0.6), top + wl + 1 + k, 0.45]);
    }
  };
  for (let i = 0; i <= N; i += 3) {
    const t = Math.min(1, tOfPlank(i) + 0.01);
    const pw = Math.max(2, Math.round(lerp(4, 3, t)));
    const rise = 2;
    const u0 = upper(t);
    piling(Math.round(u0.x) - 1, Math.round(u0.y) - rise, rise + 1, pw, 0);
    const l0 = lower(t);
    const len = Math.round(lerp(24, 16, t));
    piling(Math.round(l0.x) - 1, Math.round(l0.y) - rise, len, pw, rise + Math.round(len * 0.45));
  }

  // tackle box, bait bucket and camp mug beside the angler
  const tb = dockAt(92);
  const tby = Math.round(tb.back) + 8;
  for (let y = 0; y < 5; y++) for (let x = 0; x < 9; x++) d.px(88 + x, tby + y, tone(y < 2 ? P.tackleDark : P.tackle, (y === 2 ? 0.5 : 0) + (x > 6 ? 0.33 : x < 2 ? -0.33 : 0)));
  d.hline(91, 94, tby - 1, P.metal);
  d.px(92, tby + 3, '#ffe060');
  const bk = dockAt(124);
  const bky = Math.round(bk.back) - 1;
  for (let y = 0; y < 6; y++) for (let x = y >> 2; x <= 5 - (y >> 2); x++) d.px(121 + x, bky + y, y === 0 ? P.enamel : tone(P.metal, (x - 2.5) * 0.25 + (y % 2 ? -0.33 : 0)));
  d.hline(121, 126, bky - 2, P.metalDark);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 3; x++) d.px(MUG.x + x, MUG.y - 4 + y, tone(P.mug, (x - 1) * 0.5));
  d.hline(MUG.x, MUG.x + 2, MUG.y - 4, P.enamel);
  d.px(MUG.x + 3, MUG.y - 3, P.mug);
  d.outerOutline(P.outline);

  // cool, deep shadows on the water first, then the pier over them
  const p = new Painter(AW, AH);
  const sh = new Painter(AW, AH);
  for (const [x, y, a] of shadows) if (!sh.alphaAt(x, y)) sh.px(x, y, '#0a2456', a);
  for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) if (sh.alphaAt(x, y)) p.px(x, y, sh.get(x, y), sh.alphaAt(x, y) / 255);
  for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) if (d.alphaAt(x, y)) p.px(x, y, d.get(x, y));
  // the angler and the dog cast short shadows down and to the left
  p.ellipse(PLAYER.x - 3, PLAYER.y, 5, 1, '#1a1a3a', 0.4);
  p.ellipse(DOG.x - 3, DOG.y, 8, 1, '#1a1a3a', 0.35);
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
