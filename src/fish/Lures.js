// The five baits and lures in the tackle box. Every fish will take any of
// them; what differs is how you fish each one:
//
//   float  worm, dough ball: on a hook under a float that sits still on
//          the water; you wait for it to go under.
//   jig    minnow jig, plastic worm: no float. The bait sinks and you tap
//          to work it, lifting it and letting it drop; a fish nearby
//          only strikes once it's been worked a few times.
//   reel   spinner: cast past the fish and hold to reel it back in at a
//          steady pace; a fish strikes as it flashes by, and hooks
//          itself if you keep reeling.
export const LURES = [
  { id: 'worm', name: 'Worm', mech: 'float', note: 'On a float: wait for it to go under' },
  { id: 'dough', name: 'Dough ball', mech: 'float', note: 'On a float: wait for it to go under' },
  { id: 'minnow', name: 'Minnow jig', mech: 'jig', note: 'Tap to jig it: work it till one strikes' },
  { id: 'plastic', name: 'Plastic worm', mech: 'jig', note: 'Tap to hop it: work it till one strikes' },
  { id: 'spinner', name: 'Spinner', mech: 'reel', note: 'Cast past a fish, hold to reel it through' },
];
export const lureOf = (id) => LURES.find((l) => l.id === id);

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
