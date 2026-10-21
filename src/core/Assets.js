// Every texture comes from assets/art/manifest.json, written by
// tools/build_art.py. The loader reads the manifest first, then queues each
// image and sprite sheet it lists.

export let ART = null; // the manifest, once loaded

export function loadArt(scene) {
  scene.load.json('manifest', 'assets/art/manifest.json');
  scene.load.once('filecomplete-json-manifest', (key, type, data) => {
    ART = data;
    for (const [k, url] of Object.entries(data.images)) scene.load.image(k, url);
    for (const [k, s] of Object.entries(data.sheets)) scene.load.spritesheet(k, s.url, { frameWidth: s.frameWidth, frameHeight: s.frameHeight });
    for (const [k, f] of Object.entries(data.fonts)) scene.load.bitmapFont(k, f.png, f.xml);
  });
}

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// [key, texture, frames, frameRate, repeat]
const ANIMS = [
  ['falls', 'falls', range(0, 3), 8, -1],
  ['angler-idle', 'angler', range(0, 3), 4, -1],
  ['angler-fish', 'angler', range(4, 7), 4, -1],
  ['angler-reel', 'angler', range(4, 7), 12, -1],
  ['angler-land', 'angler', range(8, 10), 9, 0],
  ['angler-body', 'angler', range(12, 15), 4, -1],
  ['angler-step', 'angler', [16, 17, 18, 17, 16], 8, 0],
  ['deer-walk', 'deer-walk', range(0, 7), 8, -1],
  ['deer-idle', 'deer-idle', range(0, 9), 5, -1],
  ['fox-walk', 'fox-walk', range(0, 7), 10, -1],
  ['fox-idle', 'fox-idle', range(0, 5), 6, -1],
  ['rabbit-hop', 'rabbit-hop', range(0, 9), 12, -1],
  ['rabbit-idle', 'rabbit-idle', range(0, 9), 6, -1],
  ['bear-walk', 'bear-walk', range(0, 7), 6, -1],
  ['gull-fly', 'birds', range(0, 4), 10, -1],
  ['sparrow-fly', 'birds', range(6, 10), 12, -1],
  ['eagle-flap', 'eagle', range(0, 6), 9, -1],
  ['duck-fly', 'duck', range(0, 3), 10, -1],
  ['minnow-swim', 'minnow', range(0, 3), 8, -1],
  ['splash', 'splash', range(0, 4), 14, 0],
  ['bubble-pop', 'bubble', range(0, 2), 8, -1],
  ['ripple', 'ripple', range(0, 3), 9, 0],
  ['ripple-tiny', 'ripple-tiny', range(0, 4), 7, 0],
  ['branch-bob', 'branch', range(0, 3), 4, -1],
  ['bobber-bob', 'bobber', [0, 1], 3, -1],
  ['coin-spin', 'coin', range(0, 3), 10, -1],
  ['bag-open', 'backpack', [0, 1, 2], 12, 0],
  ['bag-close', 'backpack', [2, 1, 0], 12, 0],
  ['bag-rummage', 'backpack', [2, 3], 3, -1],
  ['book-open', 'journal', [0, 1, 2], 12, 0],
  ['book-close', 'journal', [2, 1, 0], 12, 0],
  ['book-read', 'journal', [2, 2, 2, 3], 3, -1],
];

export function makeAnims(scene, fishIds) {
  const add = (key, tex, frames, frameRate, repeat) => {
    if (!scene.anims.exists(key)) scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(tex, { frames }), frameRate, repeat });
  };
  for (const a of ANIMS) add(...a);
  for (const id of fishIds) add(`swim-${id}`, `fish-${id}`, range(0, ART.sheets[`fish-${id}`].frames - 1), 9, -1);
  // plants sway slowly, each sheet four frames
  for (const key of Object.keys(ART.sheets)) if (key.startsWith('bed-sea') || key.startsWith('cattails')) add(`sway-${key}`, key, range(0, 3), 3, -1);
}
