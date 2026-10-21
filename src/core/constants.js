// The game is laid out on a fixed-width portrait canvas and scaled to fit the
// phone. Height stretches to fill taller phones so there are no empty bars.
export const W = 720;
export const H = Math.round(Math.min(1600, Math.max(1280, (W * window.innerHeight) / window.innerWidth)) / 6) * 6;

// All art is pixel art drawn at whole-number scales: the far backdrop at 2x,
// everything near the angler at 3x.
export const BG = 2;
export const FG = 3;

// The backdrop is wider than the screen; this is its left edge, in backdrop
// pixels, so the pines and the waterfall sit in view.
export const BACK_X = 150;

// The lake, seen side-on: the surface line, the deck the angler stands on,
// and the lakebed.
export const SURFACE_Y = 612;
export const DECK_Y = SURFACE_Y - 102;
export const BED_Y = H - 96;

// The fishing hut stands on stilts on the right; its walkway runs out over
// the water toward the left, and the angler stands near its end.
export const HUT_X = 400;
export const ANGLER_X = 446;

export const FONT = '"Pixelify Sans", "Courier New", monospace';
export const INK = '#2a1a14';

// Draw order, back to front.
export const DEPTH = {
  SKY: 0,
  CLOUDS: 1,
  MOUNTAINS: 2,
  BIRDS: 2.5,
  LAND: 3,
  FALLS: 3.5,
  SHORE_LIFE: 4,
  MIST: 5,
  DEEP: 6,
  SURFACE: 7,
  RAYS: 8,
  BED: 9,
  WEEDS: 10,
  POSTS: 10.5,
  FISH: 11,
  BUBBLES: 12,
  LINE: 14,
  PIER: 15,
  BOAT: 16,
  ANGLER: 17,
  REEDS: 17.5,
  BOBBER: 18,
  SPLASH: 20,
  AIR: 21,
  UI: 50,
  POPUP: 100,
};

export const STATE = {
  IDLE: 'idle',
  CASTING: 'casting',
  WAITING: 'waiting',
  BITE: 'bite',
  REELING: 'reeling',
  RESULT: 'result',
};

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const webgl = (scene) => scene.sys.game.renderer.type === Phaser.WEBGL;

// Cream lettering with a dark brown outline, to sit on the wooden boards and
// over the scene alike.
export function textStyle(size, color = '#fff4d6', extra = {}) {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    align: 'center',
    stroke: INK,
    strokeThickness: Math.max(4, Math.round(size / 6)),
    shadow: { offsetX: 0, offsetY: Math.max(3, Math.round(size / 12)), color: INK, blur: 0, stroke: true, fill: true },
    ...extra,
  };
}

// Plain dark lettering for the inside of a wooden board.
export function boardStyle(size, color = '#4a2a18', extra = {}) {
  return { fontFamily: FONT, fontSize: `${size}px`, color, align: 'center', ...extra };
}
