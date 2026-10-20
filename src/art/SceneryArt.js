import { Painter, dither, mix, mulberry32 } from './Painter.js';
import { P } from './palette.js';
import { AW, AH, HORIZON, DOCK_AY } from '../core/constants.js';

export const SUN = { x: 176, y: 116 };
export const SNAG = { x: 34, top: HORIZON - 52 }; // dead spruce the eagle perches on
export const PLAYER_AX = 93; // where the angler stands on the dock
export const MUG = { x: 166, y: DOCK_AY + 11 };
export const DOG = { x: 68, y: DOCK_AY + 15 };

export function paintScenery(scene) {
  const rng = mulberry32(20260920);
  paintSky(scene);
  const mountains = paintMountains(scene, rng);
  const forest = paintForest(scene, rng);
  paintWater(scene, rng, mountains, forest);
  paintBanks(scene, rng);
  paintDock(scene, rng);
  paintCloud(scene, 'cloud-0', 34, 9, rng);
  paintCloud(scene, 'cloud-1', 22, 7, rng);
  paintCloud(scene, 'cloud-2', 46, 11, rng);
  paintMist(scene, 'mist-far', AW, 12, 0.75, rng);
  paintMist(scene, 'mist-water', AW, 7, 0.5, rng);
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
  for (let y = SUN.y - 26; y <= SUN.y + 26; y++) {
    for (let x = SUN.x - 26; x <= SUN.x + 26; x++) {
      const d = Math.hypot(x - SUN.x, y - SUN.y);
      if (d < 9) p.px(x, y, P.sun);
      else if (d < 11) p.px(x, y, P.sunGlow);
      else if (d < 16) dither(x, y, 0.5) && p.px(x, y, P.sunGlow);
      else if (d < 25) dither(x, y, (0.45 * (25 - d)) / 9) && p.px(x, y, P.sunGlow2);
    }
  }
  p.texture(scene, 'sky');
}

function ridge(rng, base, count, minH, maxH, minW, maxW) {
  const top = new Array(AW).fill(base);
  for (let i = 0; i < count; i++) {
    const cx = -20 + rng() * (AW + 40);
    const h = minH + rng() * (maxH - minH);
    const w = minW + rng() * (maxW - minW);
    for (let x = 0; x < AW; x++) {
      const d = Math.abs(x - cx) / w;
      if (d < 1) top[x] = Math.min(top[x], base - h * Math.pow(1 - d, 1.3));
    }
  }
  let j = 0;
  return top.map((t) => {
    j = j * 0.7 + (rng() - 0.5) * 1.6;
    return Math.round(t + j);
  });
}

function paintMountains(scene, rng) {
  const p = new Painter(AW, HORIZON);
  const far = ridge(rng, 150, 8, 18, 46, 20, 55);
  for (let x = 0; x < AW; x++) {
    // Slopes facing the low eastern sun (to the right) catch the light.
    const lit = (far[x + 1] ?? far[x]) > (far[x - 1] ?? far[x]);
    for (let y = far[x]; y < HORIZON; y++) {
      let c = lit ? P.mtnFarLit : P.mtnFar;
      if (far[x] < 124 && y - far[x] < 2 + (124 - far[x]) * 0.25) c = lit ? P.snow : P.snowShade;
      const haze = (y - (HORIZON - 32)) / 32;
      if (haze > 0 && dither(x, y, haze)) c = P.mist;
      p.px(x, y, c);
    }
  }
  const near = ridge(rng, 160, 10, 8, 26, 14, 40);
  for (let x = 0; x < AW; x++) {
    const lit = (near[x + 1] ?? near[x]) > (near[x - 1] ?? near[x]);
    for (let y = near[x]; y < HORIZON; y++) {
      let c = lit ? P.mtnNearLit : P.mtnNear;
      if (rng() < 0.14) c = P.mtnNearDark;
      p.px(x, y, c);
    }
  }
  p.texture(scene, 'mountains');
  return p;
}

// A spruce or tamarack: tiered branches, sunlit on the right.
function conifer(p, cx, baseY, h, c, lit, dark, rng) {
  const maxHalf = Math.max(1, h * 0.19);
  for (let r = 0; r < h; r++) {
    const t = (r + 1) / h;
    const tier = (r % 4) / 3;
    const half = Math.round(maxHalf * t * (0.75 + 0.35 * tier));
    const y = baseY - h + r;
    for (let x = -half; x <= half; x++) {
      let col = c;
      if (half > 0 && x === half) col = lit;
      else if (half > 0 && x === -half) col = dark;
      else if (x > 0 && rng() < 0.12) col = lit;
      else if (x < 0 && rng() < 0.12) col = dark;
      p.px(cx + x, y, col);
    }
  }
  p.px(cx, baseY, P.trunk);
}

function aspen(p, cx, cy, r, rng) {
  p.vline(cx, cy + Math.round(r * 0.5), cy + r + 3, P.birch);
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = (x * x) / (r * r) + (y * y) / (r * r * 0.7);
      if (d > 1 || (d > 0.7 && rng() < 0.45)) continue;
      let c = P.aspen;
      if (x > r * 0.2 && y < 0) c = P.aspenLit;
      else if (y > r * 0.35 || x < -r * 0.5) c = P.aspenDark;
      if (rng() < 0.1) c = P.aspenLit;
      p.px(cx + x, cy + y, c);
    }
  }
}

function birch(p, x, baseY, h, rng) {
  for (let y = baseY - h; y <= baseY; y++) p.px(x, y, rng() < 0.2 ? P.birchMark : P.birch);
  aspen(p, x, baseY - h - 1, 3, rng);
}

function snag(p) {
  const { x, top } = SNAG;
  for (let y = top; y < HORIZON - 3; y++) {
    p.px(x, y, P.snag);
    p.px(x + 1, y, P.snagDark);
  }
  for (const [y, dir] of [[top + 8, -1], [top + 14, 1], [top + 21, -1], [top + 28, 1], [top + 34, -1]]) {
    for (let i = 1; i <= 3; i++) p.px(dir > 0 ? x + 1 + i : x - i, y - (i >> 1), P.snag);
  }
}

function paintForest(scene, rng) {
  const p = new Painter(AW, HORIZON);
  const base = HORIZON - 3;
  for (let x = -4; x < AW + 4; x += 3 + Math.floor(rng() * 3)) {
    conifer(p, x, base - 1, 12 + Math.floor(rng() * 14), P.spruceFar, P.spruceFarLit, P.spruceFarDark, rng);
  }
  for (let i = 0; i < 9; i++) {
    aspen(p, Math.floor(rng() * AW), base - 6 - Math.floor(rng() * 5), 4 + Math.floor(rng() * 4), rng);
  }
  snag(p);
  for (let x = -3; x < AW + 3; x += 4 + Math.floor(rng() * 5)) {
    if (Math.abs(x - SNAG.x) < 4) continue;
    const h = rng() < 0.12 ? 30 + Math.floor(rng() * 10) : 8 + Math.floor(rng() * 18);
    if (rng() < 0.14) conifer(p, x, base, h, P.tamarack, P.tamarackLit, P.tamarackDark, rng);
    else conifer(p, x, base, h, P.spruce, P.spruceLit, P.spruceDark, rng);
  }
  for (let i = 0; i < 6; i++) birch(p, 8 + Math.floor(rng() * (AW - 16)), base, 10 + Math.floor(rng() * 8), rng);
  // rocky shoreline
  for (let x = 0; x < AW; x++) {
    const top = base - (rng() < 0.3 ? 1 : 0);
    for (let y = top; y < HORIZON; y++) {
      let c = y === top ? P.shoreLit : P.shore;
      if (rng() < 0.15) c = P.stone;
      p.px(x, y, c);
    }
  }
  p.texture(scene, 'forest');
  return p;
}

function paintWater(scene, rng, mountains, forest) {
  const h = AH - HORIZON;
  const p = new Painter(AW, h);
  vgradient(p, 0, h, [[0, P.water0], [0.03, P.water1], [0.12, P.water2], [0.3, P.water3], [0.6, P.water4], [1, P.water5]]);

  // The shore mirrored in still water, broken by faint ripple lines.
  const R = 58;
  for (let r = 0; r < R; r++) {
    const sy = HORIZON - 1 - r;
    if (sy < 0) break;
    const a = 0.6 * (1 - r / R);
    const wob = Math.round(Math.sin(r * 0.8));
    const gap = r > 4 && r % 4 === 3;
    for (let x = 0; x < AW; x++) {
      const sx = Math.min(AW - 1, Math.max(0, x + wob));
      const src = forest.alphaAt(sx, sy) ? forest.get(sx, sy) : mountains.alphaAt(sx, sy) ? mountains.get(sx, sy) : null;
      if (!src || (gap && rng() < 0.6)) continue;
      p.px(x, r, mix(src, p.get(x, r), 0.4), a);
    }
  }
  for (let x = 0; x < AW; x++) if (rng() < 0.4) p.px(x, 0, P.waterLine, 0.6);

  // Glitter on the water below the sun.
  for (let r = 1; r < 110; r += 2) {
    if (rng() < 0.35) continue;
    const spread = 3 + r * 0.25;
    const cx = SUN.x + Math.round((rng() - 0.5) * spread * 2);
    const len = 1 + Math.floor(rng() * Math.max(1, 6 - r / 30));
    p.hline(cx - len, cx + len, r, P.sunGlow, 0.75 * (1 - r / 110));
  }

  island(p, rng, 20, 40);
  basking(p, Math.round(AW * 0.66), Math.round(h * 0.42));
  lilyPads(p, rng, 30, 92, 5, true);
  lilyPads(p, rng, 200, h - 150, 4, false);
  p.texture(scene, 'water');
}

// A granite islet with a few spruce, mirrored in the water below it.
function island(p, rng, cx, cy) {
  const isle = new Painter(44, 30);
  const base = 24;
  conifer(isle, 14, base - 1, 14, P.spruce, P.spruceLit, P.spruceDark, rng);
  conifer(isle, 20, base - 1, 20, P.spruce, P.spruceLit, P.spruceDark, rng);
  conifer(isle, 26, base - 1, 12, P.tamarack, P.tamarackLit, P.tamarackDark, rng);
  conifer(isle, 31, base - 1, 9, P.spruce, P.spruceLit, P.spruceDark, rng);
  for (let y = 0; y < 4; y++) {
    for (let x = 6 + y; x < 38 - y * 2; x++) isle.px(x, base + y - 1, y === 0 ? P.stoneLit : rng() < 0.2 ? P.lichen2 : y > 1 ? P.stoneDark : P.stone);
  }
  const ox = cx - 22;
  const oy = cy - base;
  for (let y = 0; y < isle.h; y++) {
    for (let x = 0; x < isle.w; x++) {
      if (!isle.alphaAt(x, y)) continue;
      p.px(ox + x, oy + y, isle.get(x, y));
      const ry = base + 2 + (base - y); // reflection
      if (ry < isle.h + 14 && ry % 3 !== 0) p.px(ox + x, oy + ry, mix(isle.get(x, y), p.get(ox + x, Math.min(p.h - 1, oy + ry)), 0.55), 0.6);
    }
  }
}

// A half-sunk log with a painted turtle catching the morning sun.
function basking(p, x, y) {
  p.hline(x, x + 25, y, '#8a7a62');
  p.hline(x - 1, x + 26, y + 1, '#5a4a3a');
  p.hline(x, x + 25, y + 2, '#3a3028', 0.7);
  p.px(x + 27, y - 1, '#5a4a3a');
  p.px(x + 28, y - 2, '#5a4a3a');
  p.hline(x - 3, x + 29, y + 3, P.waterLine, 0.35);
  // turtle: dark shell with a yellow rim, striped head raised to the sun
  p.hline(x + 9, x + 13, y - 2, '#3f4a30');
  p.hline(x + 8, x + 14, y - 1, '#3f4a30');
  p.px(x + 10, y - 2, '#56663e');
  p.px(x + 8, y - 1, '#c9b048');
  p.px(x + 14, y - 1, '#c9b048');
  p.px(x + 15, y - 2, '#2e3a26');
  p.px(x + 16, y - 3, '#2e3a26');
  p.px(x + 16, y - 2, '#d9b84a');
}

function lilyPads(p, rng, cx, cy, n, flower) {
  for (let i = 0; i < n; i++) {
    const x = cx + Math.round((rng() - 0.5) * 18);
    const y = cy + Math.round((rng() - 0.5) * 8);
    const rx = 2 + Math.floor(rng() * 2);
    p.ellipse(x, y, rx, 1, rng() < 0.35 ? P.padYellow : P.pad);
    p.px(x - 1, y - 1, P.padLit);
    p.px(x + 1, y, P.padDark);
    p.px(x + 2, y, P.padDark);
    if (flower && i === 0) {
      p.hline(x - 1, x + 1, y - 1, P.enamel);
      p.px(x, y - 2, P.enamel);
      p.px(x, y - 1, '#e8c547');
    }
  }
}

function paintBanks(scene, rng) {
  const p = new Painter(AW, AH);
  const yTop = AH - 150;
  const edgeAt = (y) => Math.round(6 + (y - yTop) * 0.34 + Math.sin(y * 0.25) * 2);

  // left bank: earth, autumn grass, rust-coloured bracken
  for (let y = yTop; y < AH; y++) {
    const e = edgeAt(y);
    for (let x = 0; x <= e; x++) {
      let c = rng() < 0.2 ? P.earthLit : P.earth;
      if (e - x < 2) c = P.grassGold;
      else if (e - x === 2 && rng() < 0.5) c = P.grass;
      p.px(x, y, c);
    }
    p.px(e + 1, y, P.water5, 0.6);
  }
  for (let i = 0; i < 6; i++) {
    const y = yTop + 20 + Math.floor(rng() * 120);
    fern(p, Math.floor(rng() * (edgeAt(y) - 4)) + 2, y, rng);
  }
  for (let i = 0; i < 18; i++) {
    const by = yTop + 6 + Math.floor(rng() * 140);
    if (by >= AH) continue;
    reed(p, edgeAt(by) - Math.floor(rng() * 5), by, 18 + Math.floor(rng() * 26), (rng() - 0.3) * 6, rng() < 0.5, rng);
  }
  grassTufts(p, rng, 0, yTop, 40, AH - yTop, 30);

  // right bank: lichen-spotted granite
  for (const [cx, cy, rx, ry] of [[238, AH - 80, 10, 9], [236, AH - 46, 14, 12], [226, AH - 64, 9, 7], [218, AH - 14, 22, 14], [200, AH - 5, 14, 8]]) {
    boulder(p, cx, cy, rx, ry, rng);
  }
  for (let i = 0; i < 6; i++) {
    const by = AH - 100 + Math.floor(rng() * 40);
    reed(p, 214 + Math.floor(rng() * 22), by, 14 + Math.floor(rng() * 14), (rng() - 0.6) * 5, rng() < 0.3, rng);
  }
  grassTufts(p, rng, 206, AH - 96, 34, 90, 14);
  p.texture(scene, 'banks');
}

function reed(p, bx, by, h, lean, cattail, rng) {
  for (let k = 0; k < h; k++) {
    const t = k / h;
    p.px(bx + Math.round(lean * t * t), by - k, k % 5 === 0 ? P.reedDark : rng() < 0.2 ? P.grassGold : P.reed);
  }
  if (cattail) {
    const x = bx + Math.round(lean * 0.64);
    const top = by - Math.round(h * 0.8);
    p.rect(x, top - 5, 2, 6, P.cattail);
    p.px(x + 1, top - 4, P.cattailLit);
    p.px(x + 1, top - 3, P.cattailLit);
  }
}

function fern(p, x, y, rng) {
  for (let i = 0; i < 5; i++) {
    const dir = i - 2;
    for (let k = 0; k < 5; k++) p.px(x + Math.round(dir * k * 0.6), y - k + Math.abs(dir) * Math.floor(k / 3), rng() < 0.3 ? P.fernDark : P.fern);
  }
}

function grassTufts(p, rng, x0, y0, w, h, n) {
  for (let i = 0; i < n; i++) {
    const x = x0 + Math.floor(rng() * w);
    const y = y0 + Math.floor(rng() * h);
    if (!p.alphaAt(x, y)) continue;
    for (let k = 0; k < 3 + Math.floor(rng() * 3); k++) p.px(x + (k > 2 ? 1 : 0), y - k, rng() < 0.5 ? P.grassGold : P.grass);
  }
}

function boulder(p, cx, cy, rx, ry, rng) {
  p.hline(cx - rx, cx + rx, cy + ry + 1, P.water5, 0.6);
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
      if (d > 1) continue;
      const u = x / rx;
      const v = y / ry;
      let c = P.stone;
      if (d > 0.82) c = P.stoneDark;
      else if (v > 0.35) c = P.stoneDark;
      else if (u > -0.1 && v < -0.2) c = P.stoneLit;
      if (d <= 0.82 && rng() < 0.06) c = rng() < 0.5 ? P.lichen : P.lichen2;
      p.px(cx + x, cy + y, c);
    }
  }
}

function paintDock(scene, rng) {
  const p = new Painter(AW, AH);
  const y0 = DOCK_AY;
  const leftAt = (y) => Math.round(53 - ((y - y0) * 26) / 60);
  const rightAt = (y) => Math.round(187 + ((y - y0) * 26) / 60);

  // pilings at the far corners, one with a coil of rope
  for (const x of [52, 184]) {
    p.rect(x, y0 - 7, 4, 9, P.woodDark);
    p.hline(x, x + 3, y0 - 7, P.woodLit);
    p.vline(x + 3, y0 - 6, y0 + 1, P.wood);
  }
  p.hline(51, 56, y0 - 3, P.rope);
  p.hline(51, 56, y0 - 1, P.rope);

  for (let y = y0; y < AH; y++) {
    const row = (y - y0) % 6;
    const board = Math.floor((y - y0) / 6);
    const l = leftAt(y);
    const r = rightAt(y);
    let streak = 0;
    for (let x = l; x <= r; x++) {
      let c = board % 2 ? P.woodAlt : P.wood;
      if (row === 5) c = P.woodGap;
      else if (row === 0) c = P.woodLit;
      else if (row === 4) c = P.woodDark;
      else if (streak > 0 || rng() < 0.03) {
        c = P.woodDark;
        streak = streak > 0 ? streak - 1 : 2 + Math.floor(rng() * 3);
      }
      if (x === l || x === r) c = P.woodGap;
      p.px(x, y, c);
    }
    if (row === 2) {
      p.px(l + 3, y, P.nail);
      p.px(r - 3, y, P.nail);
    }
  }

  // shadows under the angler and the dog
  p.ellipse(PLAYER_AX, y0 + 17, 8, 1, P.ink, 0.3);
  p.ellipse(DOG.x, DOG.y, 9, 1, P.ink, 0.25);

  // tackle box
  const tx = 144;
  const ty = y0 + 14;
  p.rect(tx, ty, 15, 7, P.tackle);
  p.rect(tx, ty - 2, 15, 2, P.tackleDark);
  p.hline(tx + 5, tx + 9, ty - 4, P.metal);
  p.px(tx + 5, ty - 3, P.metal);
  p.px(tx + 9, ty - 3, P.metal);
  p.px(tx + 7, ty, P.metal);
  p.hline(tx, tx + 14, ty + 6, P.tackleDark);
  p.hline(tx, tx + 14, ty + 7, P.ink, 0.3);

  // enamel camp mug
  const { x: mx, y: my } = MUG;
  p.rect(mx, my, 4, 5, P.mug);
  p.hline(mx, mx + 3, my, P.enamel);
  p.px(mx + 1, my + 2, P.mugLit);
  p.px(mx + 2, my + 3, P.enamel);
  p.px(mx + 4, my + 1, P.mug);
  p.px(mx + 5, my + 2, P.mug);
  p.px(mx + 4, my + 3, P.mug);
  p.hline(mx, mx + 4, my + 5, P.ink, 0.3);

  // galvanised bait bucket
  const bx = 170;
  const by = y0 + 30;
  for (let y = 0; y < 8; y++) p.hline(bx + (y >> 2), bx + 7 - (y >> 2), by + y, y === 0 ? P.enamel : y % 3 === 1 ? P.metalDark : P.metal);
  p.px(bx - 1, by - 1, P.metalDark);
  p.hline(bx, bx + 7, by - 2, P.metalDark);
  p.px(bx + 8, by - 1, P.metalDark);
  p.hline(bx + 1, bx + 7, by + 8, P.ink, 0.3);

  p.texture(scene, 'dock');
}

function paintCloud(scene, key, w, h, rng) {
  const p = new Painter(w, h);
  const puffs = 3 + Math.floor(w / 10);
  for (let i = 0; i < puffs; i++) {
    const r = 2 + rng() * (h - 4);
    const cx = r + rng() * (w - 2 * r);
    p.ellipse(Math.round(cx), Math.round(h - 2 - r * 0.7), Math.round(r * 1.3), Math.round(r), P.cloud);
  }
  // Shade a copy so lit tops and flat grey bottoms read clearly.
  const shaded = new Painter(w, h);
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w; x++) {
      if (!p.alphaAt(x, y)) continue;
      let c = P.cloud;
      if (!p.alphaAt(x, y - 1) || !p.alphaAt(x, y - 2)) c = P.cloudLight;
      else if (y >= h - 3) c = P.cloudShade;
      shaded.px(x, y, c);
    }
  }
  shaded.texture(scene, key);
}

// Soft dithered mist that tiles seamlessly left to right.
function paintMist(scene, key, w, h, density, rng) {
  const p = new Painter(w, h);
  const step = 16;
  const knots = Array.from({ length: Math.ceil(w / step) }, () => rng());
  const noise = (x) => {
    const i = Math.floor(x / step);
    const t = (x % step) / step;
    const a = knots[i % knots.length];
    const b = knots[(i + 1) % knots.length];
    return a + (b - a) * (0.5 - Math.cos(Math.PI * t) / 2);
  };
  for (let y = 0; y < h; y++) {
    const v = Math.sin((Math.PI * (y + 0.5)) / h);
    for (let x = 0; x < w; x++) if (dither(x, y, v * noise(x) * density)) p.px(x, y, P.mist);
  }
  p.texture(scene, key);
}
