// Hand-drawn pixel sprites. Each frame is rows of characters; '.' is clear.
import { sheet, Painter, shade } from './Painter.js';
import { P } from './palette.js';

const BIRD = { k: '#3a3d3a' };
const BIRD_UP = ['k.....k', '.k...k.', '..kkk..'];
const BIRD_DOWN = ['.......', '.kkkkk.', 'k..k..k'];

// Bald eagle, facing right.
const EAGLE = { K: '#3b2c22', H: '#f4f1e8', Y: '#e0a92b' };
const EAGLE_GLIDE = [
  '......KKKK......',
  '.....KKKKKKK....',
  '....KKKKKKKKK...',
  'HHKKKKKKKKKKKHHY',
  '...KKKKKKKKK....',
  '................',
  '................',
];
const EAGLE_FLAP = [
  '................',
  '................',
  '................',
  'HHKKKKKKKKKKKHHY',
  '....KKKKKKKKK...',
  '.....KKKKKKK....',
  '......KKKK......',
];
const EAGLE_PERCH = ['.HH..', 'YHHH.', '.KKK.', 'KKKKK', 'KKKKK', '.KKKK', '..HH.', '.Y.Y.'];

// White-tailed doe, facing right.
const DEER = { B: '#c07838', D: '#8a4a20', L: '#f0d8b0', K: '#2a1d14', W: '#ffffff' };
const DEER_TOP = [
  '............D.D..',
  '............BBB..',
  '............BKBBK',
  '...........BBBL..',
  '..........BBB....',
  '.WBBBBBBBBBBB....',
  '.BBBBBBBBBBBB....',
  '..BBBBBBBBBBB....',
  '..BLLLLLLLLB.....',
];
const DEER_WALK_A = [...DEER_TOP, '..D.D....D.D.....', '..D..D...D..D....', '.D...D..D...D....', '.K...K..K...K....'];
const DEER_WALK_B = [...DEER_TOP, '...D.D...D.D.....', '...D.D...D.D.....', '...D.D...D.D.....', '...K.K...K.K.....'];
const DEER_DRINK = [
  '.................',
  '.................',
  '.................',
  '.................',
  '.................',
  '.WBBBBBBBBBBB....',
  '.BBBBBBBBBBBBB...',
  '..BBBBBBBBBBBBB..',
  '..BLLLLLLLLBBBB..',
  '...D.D...D.D.BBD.',
  '...D.D...D.D..BBB',
  '...D.D...D.D..BKB',
  '...K.K...K.K...BK',
];

// Bull moose, facing right. Pale legs, dark body, palmate antlers.
const MOOSE = { B: '#5a3a24', A: '#e8d0a0', L: '#b09878', K: '#1c1410', b: '#3a2416' };
const MOOSE_TOP = [
  '..............A.A.A.....',
  '..............AAAAA.A...',
  '...............AAAAAA...',
  '...........BBB...BB.....',
  '...BBBBBBBBBBBBBBBBB....',
  '..BBBBBBBBBBBBBBBBBBBB..',
  '..BBBBBBBBBBBBBBB.BBBBBK',
  '..BBBBBBBBBBBBBB...BBB..',
  '..BBBBBBBBBBBBBB....b...',
  '...BBBBBBBBBBBBB........',
];
const MOOSE_A = [
  ...MOOSE_TOP,
  '...LL.LL.....LL.LL......',
  '...L..L......L...L......',
  '..L...L.....L....L......',
  '..L....L....L.....L.....',
  '..L....L....L.....L.....',
  '..K....K....K.....K.....',
];
const MOOSE_B = [
  ...MOOSE_TOP,
  '....LL.......LLL........',
  '....LL.......L.L........',
  '....LL.......L.L........',
  '....LL.......L.L........',
  '....LL.......L.L........',
  '....KK.......K.K........',
];

// Great blue heron, facing left.
const HERON = { G: '#8aa0c8', g: '#5a6aa0', W: '#ffffff', K: '#1f2528', Y: '#f0b830', L: '#a08040' };
const HERON_LEGS = ['......L.L..', '......L.L..', '......L.L..', '......L.L..', '......L.L..', '.....LL.LL.'];
const HERON_IDLE = [
  '....KK.....',
  '...KWWK....',
  'YYYYWWW....',
  '....WWG....',
  '.....WG....',
  '.....WG....',
  '....WG.....',
  '....WG.....',
  '.....WGG...',
  '....GGGGGG.',
  '...GGgggGGG',
  '...GGgggggG',
  '....GGgggg.',
  '.....GGGg..',
  '......GG...',
  ...HERON_LEGS,
];
const HERON_STRIKE = [
  '...........',
  '...........',
  '...........',
  '...........',
  '...........',
  '...........',
  '...........',
  '...........',
  '.......GG..',
  '....GGGGGG.',
  '...WGgggGGG',
  '..WGGgggggG',
  '.WG.GGgggg.',
  'KWW..GGGg..',
  'WWK...GG...',
  'YY....L.L..',
  'Y.....L.L..',
  ...HERON_LEGS.slice(2),
];

// Common loon, facing left.
const LOON = { K: '#1c2224', W: '#e9ecea', R: '#b02a2a', b: '#3a4448' };
const LOON_SWIM = [
  '..KKK.........',
  '.KKRKK........',
  'bbKKKK........',
  '...KWK........',
  '...KKKKKKKKK..',
  '..KWKWKWKWKKKK',
  '...KKKKKKKKKK.',
];

// Beaver towing an aspen branch, facing left.
const BEAVER = { B: '#8a5a2a', b: '#5a3a1a', K: '#1c1410', g: '#4aa83a', Y: '#a8e05a' };
const BEAVER_SWIM = ['......Y.Y..', '.BBBB.gYgY.', 'KBBBBBBgg..', '..bb.......'];

const DRAGONFLY = { B: '#2f8f8a', K: '#1c3a3a', W: '#d8eef0' };
const DRAGONFLY_A = ['.WW.WW.', 'BBBBBBK', '.WW.WW.'];
const DRAGONFLY_B = ['..W.W..', 'BBBBBBK', '..W.W..'];

// A white butterfly; each one is tinted its own colour in the scene.
const BUTTERFLY = { W: '#ffffff', B: '#2a2a3a' };
const BUTTERFLY_OPEN = ['WW.WW', 'WWBWW', '.W.W.'];
const BUTTERFLY_SHUT = ['.....', '.WBW.', '..B..'];

const JUMPER = { S: '#c9d2cc', B: '#5d6b66', T: '#8a968f' };
const JUMP_FISH = ['.BBBB..T', 'SSSSSSTT', '.SSSS..T'];

// Nova Scotia duck toller asleep on the dock, facing right.
const DOG = { O: '#e0702a', D: '#a04a1a', W: '#ffffff', K: '#2a1d18', N: '#1c1410' };
const DOG_REST_A = [
  '..................',
  '..................',
  '..OOOOOOOOOOO.....',
  '.OOOOOOOOOOOOOO...',
  'OOOOOOOOOOOOOOOOO.',
  'WOOOOOOOOOOOOWOKON',
  '..OOOOOOOOOOOWWWO.',
  '...DD.......DDDD..',
];
const DOG_REST_B = [
  '..................',
  'W.................',
  'O.OOOOOOOOOOO.....',
  '.OOOOOOOOOOOOOO...',
  '.OOOOOOOOOOOOOOOO.',
  '.OOOOOOOOOOOOWOKON',
  '..OOOOOOOOOOOWWWO.',
  '...DD.......DDDD..',
];
const DOG_ALERT = [
  '..............OO..',
  '.............OOOO.',
  '.............OKOON',
  '..OOOOOOOOOOOOWW..',
  '.OOOOOOOOOOOOOWW..',
  'OOOOOOOOOOOOOOW...',
  'WOOOOOOOOOOOOO....',
  '...DD.......DDOO..',
];

const STEAM = { w: '#f4efe6' };
const STEAM_FRAMES = [
  ['..w..', '.w...', '.w...', '..w..', '...w.', '...w.', '..w..', '.....'],
  ['.....', '..w..', '.w...', '.w...', '..w..', '...w.', '...w.', '..w..'],
  ['...w.', '.....', '..w..', '.w...', '.w...', '..w..', '...w.', '...w.'],
];

// Bobber: in flight, floating, nibbled, and pulled under.
const BOB = { k: '#2a2620', R: '#d4402f', r: '#f07a5a', W: '#f3efe6', L: '#d8e4dc' };
const BOBBER_FRAMES = [
  ['...k...', '...k...', '..kkk..', '.kRrRk.', 'kRRrRRk', 'kRRRRRk', 'kWWWWWk', '.kWWWk.', '..kkk..', '.......', '.......'],
  ['.......', '.......', '...k...', '...k...', '..kkk..', '.kRrRk.', 'kRRrRRk', 'kRRRRRk', 'kWWWWWk', 'LL...LL', '.LLLLL.'],
  ['.......', '.......', '.......', '.......', '...k...', '...k...', '..kkk..', '.kRrRk.', 'kRRRRRk', 'LL...LL', '.LLLLL.'],
  ['.......', '.......', '.......', '.......', '.......', '.......', '.......', '...k...', '...k...', 'L.LkL.L', '.LLLLL.'],
];

export function paintSprites(scene) {
  sheet(scene, 'bird', [BIRD_UP, BIRD_DOWN], BIRD);
  sheet(scene, 'eagle-fly', [EAGLE_GLIDE, EAGLE_FLAP], EAGLE, { strength: 0.5, flat: 'Y', seed: 2, outline: P.outline });
  sheet(scene, 'eagle-perch', [EAGLE_PERCH], EAGLE, { strength: 0.6, flat: 'Y', seed: 3, outline: P.outline });
  sheet(scene, 'deer', [DEER_WALK_A, DEER_WALK_B, DEER_DRINK], DEER, { flat: 'K', seed: 4, outline: P.outline });
  sheet(scene, 'moose', [MOOSE_A, MOOSE_B], MOOSE, { flat: 'K', seed: 5, outline: P.outline });
  sheet(scene, 'heron', [HERON_IDLE, HERON_STRIKE], HERON, { flat: 'KY', seed: 6, outline: P.outline });
  sheet(scene, 'loon', [LOON_SWIM], LOON, { strength: 0.5, flat: 'R', seed: 7, outline: P.outline });
  sheet(scene, 'beaver', [BEAVER_SWIM], BEAVER, { flat: 'K', seed: 8, outline: P.outline });
  sheet(scene, 'dragonfly', [DRAGONFLY_A, DRAGONFLY_B], DRAGONFLY);
  sheet(scene, 'jumpfish', [JUMP_FISH], JUMPER, { strength: 0.7, seed: 9, outline: P.outline });
  sheet(scene, 'dog', [DOG_REST_A, DOG_REST_B, DOG_ALERT], DOG, { flat: 'KN', seed: 10, outline: P.outline });
  sheet(scene, 'steam', STEAM_FRAMES, STEAM);
  sheet(scene, 'bobber', BOBBER_FRAMES, BOB, { strength: 0.5, grain: 0.05, flat: 'kL', seed: 11 });
  sheet(scene, 'butterfly', [BUTTERFLY_OPEN, BUTTERFLY_SHUT], BUTTERFLY);
  paintPlayer(scene);
  paintRipples(scene);
  paintSparkles(scene);
  paintLeaves(scene);
  paintWake(scene);

  const anims = [
    ['bird-flap', 'bird', [0, 1], 6, -1],
    ['eagle-flap', 'eagle-fly', [0, 1, 0, 1, 0], 5, 0],
    ['deer-walk', 'deer', [0, 1], 5, -1],
    ['moose-walk', 'moose', [0, 1], 3, -1],
    ['dragonfly-buzz', 'dragonfly', [0, 1], 20, -1],
    ['butterfly-flap', 'butterfly', [0, 1], 8, -1],
    ['foam-churn', 'foam', [0, 1, 2], 9, -1],
    ['dog-wag', 'dog', [0, 1, 0, 1, 0, 1, 0], 5, 0],
    ['steam-rise', 'steam', [0, 1, 2], 3, -1],
    ['ripple', 'ripple', [0, 1, 2, 3], 8, 0],
    ['sparkle', 'sparkle', [1, 2, 3, 2, 1, 0], 10, 0],
  ];
  for (const [key, tex, frames, frameRate, repeat] of anims) {
    if (scene.anims.exists(key)) continue;
    scene.anims.create({ key, frames: frames.map((f) => ({ key: tex, frame: f })), frameRate, repeat });
  }
}

// The angler, seen from behind and drawn chibi-style: a wide straw hat,
// a big round head of hair, a short body in a red shirt and green vest.
export const PLAYER_HAND = { x: 20, y: 22 };
function paintPlayer(scene) {
  const p = new Painter(26, 36);
  const C = { hat: '#f0c860', band: '#e04040', hair: '#6a3a1a', skin: '#f0b888', shirt: '#e05040', vest: '#2a9a6a', pants: '#3a5ad8', boot: '#7a4422' };
  const o = 1; // margin for the outline
  p.rect(o + 7, 31, 4, 3, C.boot);
  p.rect(o + 13, 31, 4, 3, C.boot);
  p.rect(o + 7, 25, 10, 2, C.pants);
  p.rect(o + 7, 27, 4, 4, C.pants);
  p.rect(o + 13, 27, 4, 4, C.pants);
  p.rect(o + 6, 15, 12, 11, C.shirt);
  p.rect(o + 7, 16, 10, 9, C.vest);
  p.vline(o + 12, 16, 24, shade(C.vest, -0.5));
  p.rect(o + 4, 16, 2, 7, C.shirt);
  p.rect(o + 4, 23, 2, 2, C.skin);
  p.rect(o + 18, 16, 2, 5, C.shirt);
  p.rect(o + 19, 21, 2, 2, C.skin);
  p.ellipse(o + 12, 12, 6, 4, C.hair);
  for (const x of [8, 11, 15]) p.px(o + x, 16, C.hair);
  p.px(o + 5, 12, C.skin);
  p.px(o + 19, 12, C.skin);
  p.ellipse(o + 12, 5, 5, 4, C.hat);
  p.hline(o + 7, o + 17, 7, C.band);
  p.ellipse(o + 12, 9, 10, 1, C.hat);
  for (let x = o + 3; x <= o + 21; x += 3) p.px(x, 9, shade(C.hat, -0.33));
  p.light({ strength: 0.5, grain: 0.03, flat: [C.skin, C.band], seed: 12 });
  p.outerOutline(P.outline);
  p.texture(scene, 'player');
}

function ring(p, ox, oy, rx, ry, c, a) {
  const inside = (x, y, rx2, ry2) => rx2 > 0 && ry2 > 0 && (x * x) / (rx2 * rx2) + (y * y) / (ry2 * ry2) <= 1;
  for (let y = -ry - 1; y <= ry + 1; y++) {
    for (let x = -rx - 1; x <= rx + 1; x++) {
      if (inside(x, y, rx + 0.5, ry + 0.5) && !inside(x, y, rx - 0.6, ry - 0.6)) p.px(ox + x, oy + y, c, a);
    }
  }
}

function paintRipples(scene) {
  const p = new Painter(23 * 4, 7);
  [[3, 1], [5, 2], [7, 2], [10, 3]].forEach(([rx, ry], i) => ring(p, i * 23 + 11, 3, rx, ry, P.waterLine, 1 - i * 0.2));
  const tex = p.texture(scene, 'ripple');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * 23, 0, 23, 7);
}

function paintSparkles(scene) {
  const c = '#fff6dc';
  const p = new Painter(20, 5);
  p.px(7, 2, c);
  p.px(12, 2, c);
  p.px(11, 2, c);
  p.px(13, 2, c);
  p.px(12, 1, c);
  p.px(12, 3, c);
  p.hline(15, 19, 2, c);
  p.vline(17, 0, 4, c);
  const tex = p.texture(scene, 'sparkle');
  for (let i = 0; i < 4; i++) tex.add(i, 0, i * 5, 0, 5, 5);
}

function paintLeaves(scene) {
  const p = new Painter(9, 2);
  [P.leafLit, P.leafLime, P.maple].forEach((c, i) => {
    p.hline(i * 3, i * 3 + 1, 0, c);
    p.hline(i * 3 + 1, i * 3 + 2, 1, c);
  });
  const tex = p.texture(scene, 'leaf');
  for (let i = 0; i < 3; i++) tex.add(i, 0, i * 3, 0, 3, 2);
}

// V-shaped wake that trails behind a swimmer heading left.
function paintWake(scene) {
  const p = new Painter(26, 9);
  for (let t = 0; t < 26; t++) {
    if (t % 5 === 4) continue;
    const off = Math.round(t * 0.16);
    const a = 0.8 * (1 - t / 26);
    p.px(t, 4 - off, P.waterLine, a);
    p.px(t, 4 + off, P.waterLine, a);
  }
  p.texture(scene, 'wake');
}
