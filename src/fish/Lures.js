// The five baits and lures in the tackle box, and which fish go for each,
// as anglers on Midwest lakes rig for them:
//
//   worm      a nightcrawler on a small hook under a float: the panfish
//             bait (bluegill, pumpkinseed, yellow perch) and the classic
//             for stocked brook trout.
//   minnow    a live minnow on a jig or under a slip float: crappie and
//             walleye feed on minnows above all, and the burbot hunts
//             small fish along the bottom at night.
//   plastic   a soft plastic worm, Texas-rigged: the bass bait, for
//             largemouth in the weeds and smallmouth on the rocks.
//   spinner   a flashing spinner or spoon: the white bass chase it, the
//             rainbow trout hit in-line spinners, and pike and muskie
//             strike big spoons and bucktails.
//   dough     a dough ball or cut bait on the bottom: carp take dough and
//             corn, channel catfish and drum go for cut bait and stink
//             bait, sturgeon vacuum up nightcrawler gobs and cut bait.
export const LURES = [
  { id: 'worm', name: 'Worm', note: 'Panfish and trout' },
  { id: 'minnow', name: 'Minnow', note: 'Crappie, walleye, burbot' },
  { id: 'plastic', name: 'Plastic worm', note: 'Bass' },
  { id: 'spinner', name: 'Spinner', note: 'White bass, rainbows, pike, muskie' },
  { id: 'dough', name: 'Dough ball', note: 'Carp, catfish, drum, sturgeon' },
];

export const PREFERS = {
  bluegill: 'worm', pumpkinseed: 'worm', perch: 'worm', trout: 'worm',
  crappie: 'minnow', walleye: 'minnow', catfish: 'minnow',
  bass: 'plastic', largemouth: 'plastic',
  whitebass: 'spinner', rainbow: 'spinner', pike: 'spinner', muskie: 'spinner',
  carp: 'dough', channelcat: 'dough', drum: 'dough', golden: 'dough',
};

export const takes = (fishId, lure) => PREFERS[fishId] === lure;

// Each one drawn twice on the pixel grid, from the same few pixels: an
// icon for the tackle box (11 x 11) and the bait on the hook (7 x 9).
// Letters: k dark steel, s steel, w worm, W worm lit, m minnow, M minnow
// lit, p plastic, P plastic lit, g gold, G gold lit, d dough, D dough lit.
const COL = {
  k: 0x3c3c46, s: 0xc8ced6, w: 0xc2606a, W: 0xe08a90, m: 0x8aa0a8, M: 0xdfe8ec, p: 0x5e7a3a, P: 0x8aa858,
  g: 0xc8962a, G: 0xffd84a, d: 0xd8b878, D: 0xf2dca8, o: 0x25131a,
};
const ICON = {
  worm: ['...........', '....ww.....', '...wW.w....', '...w..W....', '....ww.w...', '.......W...', '....s..w...', '....s.ww...', '....s.w....', '....ksw....', '.....k.....'],
  minnow: ['...........', '....s......', '....s......', '..mmmmm.m..', '.mMMMMMmm..', '.okmmmmm.m.', '..mmmmm....', '....s......', '....s.s....', '....kss....', '...........'],
  plastic: ['...........', '...pp......', '..pPPp.....', '...ppPp....', '.....pPp...', '......ppp..', '.......Pp..', '....s...p..', '....s.s.p..', '....kss.p..', '...........'],
  spinner: ['....s......', '....s......', '...gGg.....', '..gGGGg....', '..gGGGg....', '...gGg.....', '....s......', '....s......', '...wsw.....', '....kss....', '.....k.....'],
  dough: ['...........', '...........', '...dDDd....', '..dDDDDd...', '..dDDDdd...', '..ddDddd...', '...dddd....', '....s......', '....s.s....', '....kss....', '...........'],
};
const BAIT = {
  worm: ['..s....', '..s....', '.wWw...', '.w..W..', '..ww.w.', '...k.w.', '..kw...', '.......', '.......'],
  minnow: ['..s....', '..s....', 'mmmmm.m', 'MMMMMmm', 'kmmmm.m', '..s....', '..ss...', '.......', '.......'],
  plastic: ['..s....', '..s....', '.pPp...', '..pPp..', '...pPp.', '..s.pp.', '..ss...', '.......', '.......'],
  spinner: ['..s....', '.gGg...', 'gGGGg..', '.gGg...', '..s....', '.wsw...', '..ks...', '.......', '.......'],
  dough: ['..s....', '..s....', '.dDDd..', 'dDDDDd.', '.dddd..', '..s....', '..ks...', '.......', '.......'],
};

function paint(scene, key, rows) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ add: false });
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '.') g.fillStyle(COL[ch], 1).fillRect(x, y, 1, 1);
  }));
  g.generateTexture(key, rows[0].length, rows.length);
  g.destroy();
}

export function makeLureArt(scene) {
  for (const l of LURES) {
    paint(scene, `lure-${l.id}`, ICON[l.id]);
    paint(scene, `bait-${l.id}`, BAIT[l.id]);
  }
}
