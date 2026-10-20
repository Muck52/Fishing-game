// Hand-drawn pixel sprites. Each frame is rows of characters; '.' is clear.
import { sheet, Painter } from './Painter.js';
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
  sheet(scene, 'boat', [BOAT_MAP], BOAT, { strength: 0.4, seed: 13, outline: P.outline });
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

// The angler, seen from behind, sitting on the lake-side edge of the pier
// with his legs over the water: a straw hat, red shirt under a green vest, a
// strap to the wicker creel on his hip, both hands on the pole out to his
// left. Each material has its own light, mid and shadow tone, lit from the
// upper right.
const ANGLER = {
  H: '#f8d878', h: '#e0b050', d: '#a87830', R: '#e04040',
  A: '#7a4a24', a: '#4a2410', S: '#f0b888',
  C: '#f06a50', c: '#d04030', e: '#902a28',
  V: '#3ab87a', v: '#2a8a5a', w: '#1a5a40', L: '#8a5a2a',
  P: '#5a7af0', p: '#3a5ad8', q: '#283a98',
  K: '#d8a060', k: '#8a5a2a',
};
const ANGLER_MAP = [
  '......hHHh......',
  '.....hHHHHh.....',
  '.....hhHHHd.....',
  '.....RRRRRR.....',
  '..hhHHHHHHHHhd..',
  '.dhhhhhhhhhhhdd.',
  '....aAAAAAAa....',
  '...SaAAaAAAAS...',
  '....aAAaAAAa....',
  '.....aSSSSa.....',
  '...eCCCCCCCCe...',
  '.SceCwvVVVVwce..',
  'SSeecwvVLVVwce..',
  '.eecwwvVVLVwce..',
  '..eecwvvVVLwce..',
  '...ecwwvvvvLwc..',
  '..qqpPPPPPPPpqK.',
  '.qqpPPPPPPPPPpqk',
];
export const PLAYER_HAND = { x: 2, y: 13 }; // in the outlined sprite
function paintPlayer(scene) {
  const p = new Painter(18, ANGLER_MAP.length + 2);
  p.sprite(ANGLER_MAP, ANGLER, 1, 1);
  p.outerOutline(P.outline);
  p.texture(scene, 'player');
}

// A small white rowboat moored by the reeds, bow to the right.
const BOAT = { L: '#b0703a', W: '#f4f4fc', w: '#c8d0e0', B: '#3a6ad8', b: '#283a98', s: '#8a5a2a' };
const BOAT_MAP = [
  '.L..........s..L.',
  '.LLLLLLLLLLLLLLLL',
  'WWWWWWWWWWWWWWWWW',
  '.wWWWWWWWWWWWWWw.',
  '..BBBBBBBBBBBBB..',
  '...bbbbbbbbbbb...',
];

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
