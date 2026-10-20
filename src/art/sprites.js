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
const DEER = { B: '#9b6b40', D: '#6e4828', L: '#dcc6a1', K: '#2a1d14', W: '#f2ece0' };
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
const MOOSE = { B: '#3a2a20', A: '#cdb48a', L: '#9a8468', K: '#1c1410', b: '#2a1e16' };
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
const HERON = { G: '#7f93a3', g: '#5d6f7e', W: '#e8ece9', K: '#1f2528', Y: '#d9a531', L: '#6b5a3a' };
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
const BEAVER = { B: '#6b4428', b: '#4a2e1a', K: '#1c1410', g: '#7f8a3a', Y: '#e3b955' };
const BEAVER_SWIM = ['......Y.Y..', '.BBBB.gYgY.', 'KBBBBBBgg..', '..bb.......'];

const DRAGONFLY = { B: '#2f8f8a', K: '#1c3a3a', W: '#d8eef0' };
const DRAGONFLY_A = ['.WW.WW.', 'BBBBBBK', '.WW.WW.'];
const DRAGONFLY_B = ['..W.W..', 'BBBBBBK', '..W.W..'];

const JUMPER = { S: '#c9d2cc', B: '#5d6b66', T: '#8a968f' };
const JUMP_FISH = ['.BBBB..T', 'SSSSSSTT', '.SSSS..T'];

// Nova Scotia duck toller asleep on the dock, facing right.
const DOG = { O: '#c4622d', D: '#8e4520', W: '#f3ece0', K: '#2a1d18', N: '#1c1410' };
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
  sheet(scene, 'eagle-fly', [EAGLE_GLIDE, EAGLE_FLAP], EAGLE);
  sheet(scene, 'eagle-perch', [EAGLE_PERCH], EAGLE);
  sheet(scene, 'deer', [DEER_WALK_A, DEER_WALK_B, DEER_DRINK], DEER);
  sheet(scene, 'moose', [MOOSE_A, MOOSE_B], MOOSE);
  sheet(scene, 'heron', [HERON_IDLE, HERON_STRIKE], HERON);
  sheet(scene, 'loon', [LOON_SWIM], LOON);
  sheet(scene, 'beaver', [BEAVER_SWIM], BEAVER);
  sheet(scene, 'dragonfly', [DRAGONFLY_A, DRAGONFLY_B], DRAGONFLY);
  sheet(scene, 'jumpfish', [JUMP_FISH], JUMPER);
  sheet(scene, 'dog', [DOG_REST_A, DOG_REST_B, DOG_ALERT], DOG);
  sheet(scene, 'steam', STEAM_FRAMES, STEAM);
  sheet(scene, 'bobber', BOBBER_FRAMES, BOB);
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

// The angler, seen from behind: knit toque, flannel jacket, jeans.
export const PLAYER_HAND = { x: 20, y: 26 };
function paintPlayer(scene) {
  const p = new Painter(22, 46);
  const C = {
    boot: '#4a3020', bootLit: '#6b4a30', jeans: '#41597a', jeansDark: '#2f4360',
    red: '#b23a2c', mid: '#7d2a22', dark: '#3a1c18', skin: '#e3b48a', hair: '#5a3a24',
    hat: '#d49a2e', hatDark: '#a9741f', pom: '#f1e6cf',
  };
  const plaid = (x, y) => {
    const v = x % 4 === 0;
    const h = y % 4 === 0;
    return v && h ? C.dark : v || h ? C.mid : C.red;
  };
  p.rect(5, 42, 5, 4, C.boot);
  p.rect(12, 42, 5, 4, C.boot);
  p.hline(5, 9, 42, C.bootLit);
  p.hline(12, 16, 42, C.bootLit);
  p.rect(6, 30, 4, 12, C.jeans);
  p.rect(12, 30, 4, 12, C.jeans);
  p.vline(9, 30, 41, C.jeansDark);
  p.vline(12, 30, 41, C.jeansDark);
  for (let y = 13; y <= 31; y++) {
    for (let x = 3; x <= 18; x++) {
      if ((y === 13 && (x < 5 || x > 16)) || (y === 14 && (x === 3 || x === 18))) continue;
      p.px(x, y, plaid(x, y));
    }
  }
  p.vline(18, 15, 31, C.red);
  p.hline(4, 17, 31, C.dark);
  for (let y = 15; y <= 27; y++) p.rect(1, y, 2, 1, plaid(1, y));
  p.rect(1, 28, 2, 2, C.skin);
  for (let y = 15; y <= 24; y++) p.rect(18, y, 3, 1, plaid(19, y));
  p.rect(19, 25, 2, 2, C.skin);
  p.hline(6, 15, 12, C.dark);
  p.rect(7, 7, 8, 5, C.hair);
  p.px(6, 8, C.skin);
  p.px(15, 8, C.skin);
  p.rect(6, 1, 10, 6, C.hat);
  p.hline(7, 14, 0, C.hat);
  for (let x = 6; x <= 15; x += 2) p.vline(x, 5, 6, C.hatDark);
  p.rect(9, -1, 4, 2, C.pom);
  p.hline(10, 11, 0, C.pom);
  p.outline(C.dark);
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
  [P.aspenLit, '#c0502e', P.tamarack].forEach((c, i) => {
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
