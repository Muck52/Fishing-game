import { Painter, dither, mix, mulberry32, shade, noise } from './Painter.js';
import { P } from './palette.js';
import { AW, AH, HORIZON, DOCK_AY } from '../core/constants.js';

export const SUN = { x: 132, y: HORIZON - 33 };
export const SNAG = { x: 26, top: HORIZON - 40 }; // dead spruce the eagle perches on
export const PLAYER_AX = 70; // where the angler stands on the dock
export const MUG = { x: 125, y: DOCK_AY + 8 };
export const DOG = { x: 51, y: DOCK_AY + 11 };

const grain = (x, y, seed, amount) => (noise(x, y, seed) - 0.5) * 2 * amount;

export function paintScenery(scene) {
  const rng = mulberry32(20260920);
  paintSky(scene);
  const mountains = paintMountains(scene, rng);
  const forest = paintForest(scene, rng);
  paintWater(scene, rng, mountains, forest);
  paintBanks(scene, rng);
  paintDock(scene, rng);
  paintCloud(scene, 'cloud-0', 26, 10, rng);
  paintCloud(scene, 'cloud-1', 17, 7, rng);
  paintCloud(scene, 'cloud-2', 34, 12, rng);
  paintMist(scene, 'mist-far', AW, 9, 0.75, rng);
  paintMist(scene, 'mist-water', AW, 5, 0.5, rng);
}

// Banded gradient with ordered dithering between each pair of colours.
function vgradient(p, y0, y1, stops) {
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0 - 1);
    let k = 0;
    while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [ta, ca] = stops[k];
    const [tb, cb] = stops[k + 1];
    const f = Math.min(1, Math.max(0, (t - ta) / (tb - ta)));
    for (let x = 0; x < p.w; x++) p.px(x, y, dither(x, y, f) ? cb : ca);
  }
}

function paintSky(scene) {
  const p = new Painter(AW, HORIZON);
  vgradient(p, 0, HORIZON, [[0, P.sky0], [0.3, P.sky1], [0.58, P.sky2], [0.8, P.sky3], [1, P.sky4]]);
  // thin mare's-tail cirrus high up
  for (let y = 6; y < 50; y++) {
    for (let x = 0; x < AW; x++) {
      const n = noise(Math.floor(x / 5), y, 41);
      if (n > 0.93 && noise(x, y, 42) > 0.3) p.px(x, y, P.cloudLight, 0.25 + (n - 0.93) * 6);
    }
  }
  for (let y = SUN.y - 20; y <= SUN.y + 20; y++) {
    for (let x = SUN.x - 20; x <= SUN.x + 20; x++) {
      const d = Math.hypot(x - SUN.x, y - SUN.y);
      if (d < 6) p.px(x, y, d < 4 ? '#fffaea' : P.sun);
      else if (d < 8) p.px(x, y, P.sunGlow);
      else if (d < 12) dither(x, y, 0.5) && p.px(x, y, P.sunGlow);
      else if (d < 19) dither(x, y, (0.45 * (19 - d)) / 7) && p.px(x, y, P.sunGlow2);
    }
  }
  p.texture(scene, 'sky');
}

function ridge(rng, base, count, minH, maxH, minW, maxW) {
  const top = new Array(AW).fill(base);
  for (let i = 0; i < count; i++) {
    const cx = -15 + rng() * (AW + 30);
    const h = minH + rng() * (maxH - minH);
    const w = minW + rng() * (maxW - minW);
    for (let x = 0; x < AW; x++) {
      const d = Math.abs(x - cx) / w;
      if (d < 1) top[x] = Math.min(top[x], base - h * Math.pow(1 - d, 1.3));
    }
  }
  let j = 0;
  return top.map((t) => {
    j = j * 0.7 + (rng() - 0.5) * 1.4;
    return Math.round(t + j);
  });
}

function paintMountains(scene, rng) {
  const p = new Painter(AW, HORIZON);
  const far = ridge(rng, HORIZON - 8, 8, 14, 35, 15, 41);
  const snowLine = HORIZON - 27;
  for (let x = 0; x < AW; x++) {
    // Slopes facing the low eastern sun (to the right) catch the light.
    const lit = (far[x + 1] ?? far[x]) > (far[x - 1] ?? far[x]);
    for (let y = far[x]; y < HORIZON; y++) {
      const depth = y - far[x];
      let base = P.mtnFar;
      let k = (lit ? 0.35 : -0.25) + grain(x, Math.floor(y / 2), 3, 0.2);
      if (depth > 2 && depth < 16 && noise(x, 0, 9) < 0.14) k -= 0.3; // gullies
      if (far[x] < snowLine && depth < 2 + (snowLine - far[x]) * 0.3 && noise(x, y, 5) > 0.12) {
        base = P.snow;
        k = (lit ? 0.3 : -0.45) + grain(x, y, 6, 0.12);
      }
      if (depth === 0) k += 0.2;
      const haze = (y - (HORIZON - 24)) / 24;
      p.px(x, y, haze > 0 && dither(x, y, haze) ? P.mist : shade(base, k));
    }
  }
  const near = ridge(rng, HORIZON, 10, 6, 20, 10, 30);
  for (let x = 0; x < AW; x++) {
    const lit = (near[x + 1] ?? near[x]) > (near[x - 1] ?? near[x]);
    for (let y = near[x]; y < HORIZON; y++) {
      let k = (lit ? 0.25 : -0.2) + grain(x, y, 7, 0.3);
      if (noise(x, y, 8) < 0.15) k -= 0.35; // dark crowns of distant trees
      p.px(x, y, shade(P.mtnNear, k));
    }
  }
  p.texture(scene, 'mountains');
  return p;
}

// A spruce or tamarack: tiered branches, sunlit on the right, shadow tucked
// under each tier, and needle-clump texture throughout.
function conifer(p, cx, baseY, h, base, seed) {
  const maxHalf = Math.max(1, h * 0.2);
  for (let r = 0; r < h; r++) {
    const t = (r + 1) / h;
    const tier = r % 3;
    const half = Math.round(maxHalf * t * (0.7 + 0.2 * tier));
    const y = baseY - h + r;
    for (let x = -half; x <= half; x++) {
      const side = half ? x / half : 0;
      let k = side * 0.45 - 0.05 + (tier === 0 ? 0.15 : tier === 2 ? -0.25 : 0);
      k += grain(cx * 7 + x, y, seed, 0.28);
      if (r === 0) k += 0.25;
      p.px(cx + x, y, shade(base, k));
    }
  }
  p.px(cx, baseY, P.trunk);
}

function aspen(p, cx, cy, r, seed) {
  for (let y = cy + Math.round(r * 0.5); y <= cy + r + 2; y++) p.px(cx, y, shade(P.birch, grain(cx, y, seed, 0.2)));
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = (x * x) / (r * r) + (y * y) / (r * r * 0.7);
      if (d > 1 || (d > 0.65 && noise(cx + x, cy + y, seed) < 0.45)) continue;
      const lit = (x / r) * 0.6 - (y / r) * 0.8;
      const clump = grain(Math.floor((cx + x) / 2), Math.floor((cy + y) / 2), seed + 1, 0.25);
      p.px(cx + x, cy + y, shade(P.aspen, lit * 0.45 + clump + grain(cx + x, cy + y, seed, 0.15)));
    }
  }
}

function birch(p, x, baseY, h, seed) {
  for (let y = baseY - h; y <= baseY; y++) p.px(x, y, noise(x, y, seed) < 0.22 ? P.birchMark : shade(P.birch, grain(x, y, seed, 0.15)));
  aspen(p, x, baseY - h - 1, 2, seed);
}

function snag(p) {
  const { x, top } = SNAG;
  for (let y = top; y < HORIZON - 2; y++) {
    p.px(x, y, shade(P.snag, 0.2 + grain(x, y, 21, 0.15)));
    p.px(x + 1, y, shade(P.snag, -0.4 + grain(x + 1, y, 21, 0.15)));
  }
  for (const [y, dir] of [[top + 6, -1], [top + 11, 1], [top + 16, -1], [top + 21, 1], [top + 26, -1]]) {
    for (let i = 1; i <= 3; i++) p.px(dir > 0 ? x + 1 + i : x - i, y - (i >> 1), shade(P.snag, dir > 0 ? 0.15 : -0.2));
  }
}

function paintForest(scene, rng) {
  const p = new Painter(AW, HORIZON);
  const base = HORIZON - 2;
  for (let x = -3; x < AW + 3; x += 2 + Math.floor(rng() * 3)) conifer(p, x, base - 1, 9 + Math.floor(rng() * 11), P.spruceFar, x);
  for (let i = 0; i < 8; i++) aspen(p, Math.floor(rng() * AW), base - 5 - Math.floor(rng() * 4), 3 + Math.floor(rng() * 3), i + 50);
  snag(p);
  for (let x = -2; x < AW + 2; x += 3 + Math.floor(rng() * 4)) {
    if (Math.abs(x - SNAG.x) < 3) continue;
    const h = rng() < 0.12 ? 22 + Math.floor(rng() * 8) : 6 + Math.floor(rng() * 14);
    conifer(p, x, base, h, rng() < 0.14 ? P.tamarack : P.spruce, x + 100);
  }
  for (let i = 0; i < 5; i++) birch(p, 6 + Math.floor(rng() * (AW - 12)), base, 8 + Math.floor(rng() * 6), i + 70);
  // rocky shoreline
  for (let x = 0; x < AW; x++) {
    const top = base - (noise(x, 0, 30) < 0.3 ? 1 : 0);
    for (let y = top; y < HORIZON; y++) {
      const stone = noise(x, y, 31) < 0.2;
      p.px(x, y, shade(stone ? P.stone : P.shore, (y === top ? 0.35 : -0.1) + grain(x, y, 32, 0.2)));
    }
  }
  p.texture(scene, 'forest');
  return p;
}

function paintWater(scene, rng, mountains, forest) {
  const h = AH - HORIZON;
  const p = new Painter(AW, h);
  vgradient(p, 0, h, [[0, P.water0], [0.03, P.water1], [0.12, P.water2], [0.3, P.water3], [0.6, P.water4], [1, P.water5]]);

  // Wind texture: ripple bands that stretch out as they come closer.
  for (let r = 1; r < h; r++) {
    const stretch = 1 + r / 25;
    for (let x = 0; x < AW; x++) {
      const n = noise(Math.floor((x + r * 3) / stretch), r, 11);
      if (n < 0.1) p.recolor(x, r, shade(p.get(x, r), 0.3));
      else if (n > 0.86) p.recolor(x, r, shade(p.get(x, r), -0.25));
    }
  }

  // The shore mirrored in still water, broken by faint ripple lines.
  const R = 44;
  for (let r = 0; r < R; r++) {
    const sy = HORIZON - 1 - r;
    if (sy < 0) break;
    const a = 0.6 * (1 - r / R);
    const wob = Math.round(Math.sin(r * 0.9));
    const gap = r > 3 && r % 3 === 2;
    for (let x = 0; x < AW; x++) {
      const sx = Math.min(AW - 1, Math.max(0, x + wob));
      const src = forest.alphaAt(sx, sy) ? forest.get(sx, sy) : mountains.alphaAt(sx, sy) ? mountains.get(sx, sy) : null;
      if (!src || (gap && rng() < 0.6)) continue;
      p.px(x, r, mix(src, p.get(x, r), 0.4), a);
    }
  }
  for (let x = 0; x < AW; x++) if (rng() < 0.4) p.px(x, 0, P.waterLine, 0.6);

  // Glitter on the water below the sun.
  for (let r = 1; r < 82; r += 2) {
    if (rng() < 0.35) continue;
    const spread = 2 + r * 0.25;
    const cx = SUN.x + Math.round((rng() - 0.5) * spread * 2);
    const len = Math.floor(rng() * Math.max(1, 5 - r / 25));
    p.hline(cx - len, cx + len, r, P.sunGlow, 0.75 * (1 - r / 82));
  }

  island(p, rng, 15, 30);
  basking(p, Math.round(AW * 0.66), Math.round(h * 0.42));
  lilyPads(p, rng, 22, 69, 5, true);
  lilyPads(p, rng, 150, h - 112, 4, false);
  p.texture(scene, 'water');
}

// A granite islet with a few spruce, mirrored in the water below it.
function island(p, rng, cx, cy) {
  const isle = new Painter(34, 24);
  const base = 18;
  conifer(isle, 10, base - 1, 10, P.spruce, 201);
  conifer(isle, 15, base - 1, 15, P.spruce, 202);
  conifer(isle, 20, base - 1, 9, P.tamarack, 203);
  conifer(isle, 24, base - 1, 7, P.spruce, 204);
  for (let y = 0; y < 3; y++) {
    for (let x = 4 + y; x < 29 - y * 2; x++) {
      isle.px(x, base + y - 1, shade(noise(x, y, 205) < 0.2 ? P.lichen2 : P.stone, (y === 0 ? 0.4 : -0.3 * y) + grain(x, y, 206, 0.2)));
    }
  }
  const ox = cx - 17;
  const oy = cy - base;
  for (let y = 0; y < isle.h; y++) {
    for (let x = 0; x < isle.w; x++) {
      if (!isle.alphaAt(x, y)) continue;
      p.px(ox + x, oy + y, isle.get(x, y));
      const ry = base + 2 + (base - y); // reflection
      if (ry < isle.h + 12 && ry % 3 !== 0) p.px(ox + x, oy + ry, mix(isle.get(x, y), p.get(ox + x, Math.min(p.h - 1, oy + ry)), 0.55), 0.6);
    }
  }
}

// A half-sunk log with a painted turtle catching the morning sun.
function basking(p, x, y) {
  for (let i = 0; i < 20; i++) {
    p.px(x + i, y, shade('#8a7a62', 0.2 + grain(i, 0, 300, 0.25)));
    p.px(x + i - 1, y + 1, shade('#5a4a3a', grain(i, 1, 300, 0.25)));
    p.px(x + i, y + 2, '#3a3028', 0.7);
  }
  p.px(x + 20, y - 1, '#5a4a3a');
  p.px(x + 21, y - 2, '#6a5a48');
  p.hline(x - 2, x + 22, y + 3, P.waterLine, 0.35);
  p.hline(x + 7, x + 10, y - 2, '#56663e');
  p.px(x + 8, y - 2, '#6f8050');
  p.hline(x + 6, x + 11, y - 1, '#3f4a30');
  p.px(x + 6, y - 1, '#c9b048');
  p.px(x + 11, y - 1, '#c9b048');
  p.px(x + 12, y - 2, '#2e3a26');
  p.px(x + 13, y - 2, '#d9b84a');
}

function lilyPads(p, rng, cx, cy, n, flower) {
  for (let i = 0; i < n; i++) {
    const x = cx + Math.round((rng() - 0.5) * 14);
    const y = cy + Math.round((rng() - 0.5) * 6);
    const rx = 1 + Math.floor(rng() * 2);
    const base = rng() < 0.35 ? P.padYellow : P.pad;
    // Seen nearly edge-on, a pad is a flat oval: two rows, with a notch.
    for (let dx = -rx - 1; dx <= rx + 1; dx++) {
      if (Math.abs(dx) <= rx) p.px(x + dx, y - 1, shade(base, 0.3 + grain(x + dx, y, 400, 0.15)));
      p.px(x + dx, y, shade(base, -0.15 + grain(x + dx, y + 1, 400, 0.15)));
    }
    p.px(x + 1, y - 1, shade(base, -0.7));
    p.hline(x - rx - 1, x + rx + 1, y + 1, P.water5, 0.35);
    if (flower && i === 0) {
      p.hline(x - 1, x + 1, y - 1, P.enamel);
      p.px(x, y - 2, '#fffaf0');
      p.px(x, y - 1, '#e8c547');
    }
  }
}

function paintBanks(scene, rng) {
  const p = new Painter(AW, AH);
  const yTop = AH - 112;
  const edgeAt = (y) => Math.round(4 + (y - yTop) * 0.34 + Math.sin(y * 0.33) * 1.5);

  // left bank: earth, autumn grass, rust-coloured bracken
  for (let y = yTop; y < AH; y++) {
    const e = edgeAt(y);
    for (let x = 0; x <= e; x++) {
      let c = shade(P.earth, grain(x, y, 500, 0.35) + (noise(Math.floor(x / 2), Math.floor(y / 2), 501) < 0.15 ? 0.4 : 0));
      if (e - x < 2) c = shade(P.grassGold, (e - x === 0 ? 0.3 : -0.1) + grain(x, y, 502, 0.25));
      else if (e - x === 2 && noise(x, y, 503) < 0.5) c = shade(P.grass, grain(x, y, 504, 0.25));
      p.px(x, y, c);
    }
    p.px(e + 1, y, P.water5, 0.6);
  }
  for (let i = 0; i < 5; i++) {
    const y = yTop + 15 + Math.floor(rng() * 90);
    fern(p, Math.floor(rng() * Math.max(1, edgeAt(y) - 3)) + 2, y);
  }
  for (let i = 0; i < 16; i++) {
    const by = yTop + 5 + Math.floor(rng() * 105);
    if (by >= AH) continue;
    reed(p, edgeAt(by) - Math.floor(rng() * 4), by, 14 + Math.floor(rng() * 19), (rng() - 0.3) * 5, rng() < 0.5, i);
  }
  grassTufts(p, rng, 0, yTop, 30, AH - yTop, 26);

  // right bank: lichen-spotted granite
  for (const [cx, cy, rx, ry] of [[178, AH - 60, 8, 7], [177, AH - 34, 10, 9], [170, AH - 48, 7, 5], [164, AH - 10, 16, 10], [150, AH - 4, 10, 6]]) {
    boulder(p, cx, cy, rx, ry);
  }
  for (let i = 0; i < 6; i++) {
    reed(p, 160 + Math.floor(rng() * 16), AH - 75 + Math.floor(rng() * 30), 11 + Math.floor(rng() * 10), (rng() - 0.6) * 4, rng() < 0.3, i + 40);
  }
  grassTufts(p, rng, 154, AH - 72, 26, 68, 12);
  p.texture(scene, 'banks');
}

function reed(p, bx, by, h, lean, cattail, seed) {
  for (let k = 0; k < h; k++) {
    const t = k / h;
    const base = noise(k, seed, 600) < 0.25 ? P.grassGold : P.reed;
    p.px(bx + Math.round(lean * t * t), by - k, shade(base, (t - 0.5) * 0.4 + grain(k, seed, 601, 0.2)));
  }
  if (cattail) {
    const x = bx + Math.round(lean * 0.64);
    const top = by - Math.round(h * 0.8);
    for (let y = top - 4; y <= top; y++) {
      p.px(x, y, shade(P.cattail, -0.2 + grain(x, y, 602, 0.15)));
      p.px(x + 1, y, shade(P.cattail, 0.3 + grain(x + 1, y, 602, 0.15)));
    }
    p.px(x, top - 5, shade(P.reed, 0.2));
  }
}

function fern(p, x, y) {
  for (let i = 0; i < 5; i++) {
    const dir = i - 2;
    for (let k = 0; k < 4; k++) {
      p.px(x + Math.round(dir * k * 0.6), y - k + Math.abs(dir) * Math.floor(k / 2), shade(P.fern, (dir > 0 ? 0.25 : -0.2) + grain(i, k, 610, 0.2)));
    }
  }
}

function grassTufts(p, rng, x0, y0, w, h, n) {
  for (let i = 0; i < n; i++) {
    const x = x0 + Math.floor(rng() * w);
    const y = y0 + Math.floor(rng() * h);
    if (!p.alphaAt(x, y)) continue;
    const blades = 2 + Math.floor(rng() * 3);
    for (let k = 0; k < blades; k++) p.px(x + (k > 1 ? 1 : 0), y - k, shade(rng() < 0.5 ? P.grassGold : P.grass, 0.1 + k * 0.1));
  }
}

// Granite boulder lit as a sphere, with crusts of lichen.
function boulder(p, cx, cy, rx, ry) {
  p.hline(cx - rx, cx + rx, cy + ry + 1, P.water5, 0.6);
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
      if (d > 1) continue;
      const nz = Math.sqrt(1 - d);
      const lit = (x / rx) * 0.5 - (y / ry) * 0.6 + nz * 0.6;
      const lichen = noise(Math.floor((cx + x) / 2), Math.floor((cy + y) / 2), 700) < 0.14;
      const base = lichen ? (noise(cx + x, cy + y, 701) < 0.5 ? P.lichen : P.lichen2) : P.stone;
      p.px(cx + x, cy + y, shade(base, (lit - 0.55) * 1.2 + grain(cx + x, cy + y, 702, 0.2)));
    }
  }
}

function paintDock(scene, rng) {
  const p = new Painter(AW, AH);
  const y0 = DOCK_AY;
  const depth = AH - y0;
  const leftAt = (y) => Math.round(40 - ((y - y0) * 20) / depth);
  const rightAt = (y) => Math.round(140 + ((y - y0) * 20) / depth);

  // pilings at the far corners, one with a coil of rope
  for (const x of [38, 139]) {
    for (let y = y0 - 6; y <= y0 + 1; y++) {
      for (let i = 0; i < 3; i++) p.px(x + i, y, shade(P.wood, (i - 1) * 0.4 + (y === y0 - 6 ? 0.4 : 0) + grain(x + i, y, 800, 0.15)));
    }
  }
  for (const y of [y0 - 3, y0 - 1]) for (let x = 37; x <= 42; x++) p.px(x, y, shade(P.rope, (x % 2 ? 0.25 : -0.15)));

  // weathered planks: each board its own tone, with grain, knots and nails
  for (let y = y0; y < AH; y++) {
    const row = (y - y0) % 5;
    const board = Math.floor((y - y0) / 5);
    const tone = mix(P.wood, noise(board, 0, 801) < 0.3 ? '#8d8577' : P.woodAlt, noise(board, 1, 802) * 0.6);
    const l = leftAt(y);
    const r = rightAt(y);
    for (let x = l; x <= r; x++) {
      let c;
      if (row === 4 || x === l || x === r) c = P.woodGap;
      else {
        let k = row === 0 ? 0.35 : row === 3 ? -0.35 : 0;
        k += grain(Math.floor(x / 3), y, 803 + board, 0.22);
        if (noise(Math.floor((x + board * 7) / 2), row, 804) < 0.1) k -= 0.3; // grain streaks
        c = shade(tone, k);
      }
      p.px(x, y, c);
    }
    if (row === 1) {
      p.px(l + 2, y, P.nail);
      p.px(r - 2, y, P.nail);
    }
    if (row === 2 && noise(board, 2, 805) < 0.35) {
      const kx = Math.round(l + 10 + noise(board, 3, 806) * (r - l - 20));
      p.px(kx, y, shade(tone, -0.7));
      p.px(kx + 1, y, shade(tone, -0.4));
    }
  }

  // shadows under the angler and the dog
  p.ellipse(PLAYER_AX, y0 + 13, 6, 1, P.ink, 0.3);
  p.ellipse(DOG.x, DOG.y, 7, 1, P.ink, 0.25);

  // tackle box
  const tx = 106;
  const ty = y0 + 10;
  for (let y = 0; y < 6; y++) for (let x = 0; x < 11; x++) p.px(tx + x, ty + y, shade(y < 2 ? P.tackleDark : P.tackle, (y === 2 ? 0.35 : 0) + (x === 10 ? 0.3 : x === 0 ? -0.3 : 0) + grain(x, y, 810, 0.12)));
  p.hline(tx + 4, tx + 7, ty - 2, P.metal);
  p.px(tx + 4, ty - 1, P.metalDark);
  p.px(tx + 7, ty - 1, P.metalDark);
  p.px(tx + 5, ty + 2, P.metal);
  p.hline(tx, tx + 10, ty + 6, P.ink, 0.3);

  // enamel camp mug
  const { x: mx, y: my } = MUG;
  for (let y = 0; y < 4; y++) for (let x = 0; x < 3; x++) p.px(mx + x, my + y, shade(P.mug, (x - 1) * 0.35 + grain(x, y, 820, 0.1)));
  p.hline(mx, mx + 2, my, P.enamel);
  p.px(mx + 1, my + 2, P.enamel);
  p.px(mx + 3, my + 1, P.mug);
  p.px(mx + 3, my + 2, P.mug);
  p.hline(mx, mx + 3, my + 4, P.ink, 0.3);

  // galvanised bait bucket
  const bx = 127;
  const by = y0 + 23;
  for (let y = 0; y < 6; y++) {
    for (let x = (y >> 2); x <= 5 - (y >> 2); x++) p.px(bx + x, by + y, y === 0 ? P.enamel : shade(P.metal, (x - 2.5) * 0.18 + (y % 2 ? -0.15 : 0.05)));
  }
  p.hline(bx, bx + 5, by - 2, P.metalDark);
  p.px(bx - 1, by - 1, P.metalDark);
  p.px(bx + 6, by - 1, P.metalDark);
  p.hline(bx + 1, bx + 5, by + 6, P.ink, 0.3);

  p.texture(scene, 'dock');
}

function paintCloud(scene, key, w, h, rng) {
  const p = new Painter(w, h);
  // A cumulus: billows piled highest in the middle, on a flat base.
  const puffs = 3 + Math.floor(w / 6);
  for (let i = 0; i < puffs; i++) {
    const cx = 2 + (i / (puffs - 1)) * (w - 4) + (rng() - 0.5) * 2;
    const r = Math.max(1.5, (h - 2) * (0.3 + 0.45 * Math.sin((Math.PI * cx) / w)) * (0.7 + rng() * 0.5));
    p.ellipse(Math.round(cx), Math.round(h - 1 - r), Math.round(r), Math.round(r), P.cloud);
  }
  // Shade a copy: sunlit upper right, cool flat base, soft lumpy texture.
  const shaded = new Painter(w, h);
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w; x++) {
      if (!p.alphaAt(x, y)) continue;
      let k = grain(x, y, w, 0.12) + ((x / w) - 0.5) * 0.3;
      if (!p.alphaAt(x, y - 1)) k += 0.45;
      else if (!p.alphaAt(x, y - 2)) k += 0.2;
      if (y >= h - 3) k -= 0.4;
      // Cloud shadows take the blue of the sky around them.
      shaded.px(x, y, k < 0 ? mix(P.cloud, P.sky1, Math.min(1, -k * 1.2)) : shade(P.cloud, k));
    }
  }
  shaded.texture(scene, key);
}

// Soft dithered mist that tiles seamlessly left to right.
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
    for (let x = 0; x < w; x++) if (dither(x, y, v * wave(x) * density)) p.px(x, y, P.mist);
  }
  p.texture(scene, key);
}
