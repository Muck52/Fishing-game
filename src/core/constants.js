// The whole game is drawn on one small pixel grid, 360 art pixels wide, and
// scaled up to fill the phone. Every sprite is drawn at its own size on that
// grid: nothing is scaled, squashed or rotated, so all the art shares one
// pixel size. Height stretches to fill taller phones.
export const W = 360;
export const H = Math.round(Math.min(800, Math.max(640, (W * window.innerHeight) / window.innerWidth)) / 2) * 2;

// The backdrop is wider than the screen; this is its left edge, in pixels,
// so the pines and the waterfall sit in view.
export const BACK_X = 150;

// The lake, seen side-on: the surface line, the deck the angler stands on,
// and the lakebed.
export const SURFACE_Y = 306;
export const DECK_Y = SURFACE_Y - 50;
export const BED_Y = H - 48;

// The fishing hut stands on stilts on the right; its walkway runs out over
// the water toward the left, and the angler stands near its end.
// How far above the scene the camera looks while you're on the dock with
// the rod up: the sky runs on above the art, so the dock sits low on screen.
// The camera stays here: the whole game is played from this view.
export const LOOK_UP = Math.round((H * 0.25) / 2) * 2;
// The lowest water you can see from there: fish, bait and fights keep
// above it, so nothing happens off screen.
export const VIEW_BED = Math.min(BED_Y, H - LOOK_UP - 14);

// The interface (and the time-of-day grade over the whole screen) stays put
// while the camera pans; everything else scrolls with the world.
export function pinToScreen(scene) {
  for (const o of scene.children.list) {
    if (o.inWorld) continue; // a grade that scrolls with the world
    if (o.depth >= 50 || (o.depth >= 30 && o.depth < 31)) pin(o);
  }
}

// Pins one object, and everything inside it if it's a container.
export function pin(o) {
  o.setScrollFactor(0);
  if (o.list) o.list.forEach(pin);
  return o;
}

export const HUT_X = 216;
export const ANGLER_X = 232;

// Draw order, back to front.
export const DEPTH = {
  SKY: 0,
  STARS: 0.5,
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
  SHADE: 30, // the time-of-day colour grade
  GLOW: 31, // lamps and fireflies, bright through the grade
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

// Lettering colours. The fonts are white with a baked dark outline, so a
// tint colours the letters and leaves the outline dark.
export const INK = {
  cream: 0xfff4d6,
  gold: 0xffd84a,
  soft: 0xffe2b0,
  sky: 0xd8f0ff,
  green: 0x9cf07a,
  red: 0xff7a5a,
};

// Pixel lettering. 'body' is the small reading font, 'head' the bold one;
// size is a whole-number multiple so letters stay on the grid.
export function label(scene, x, y, text, { font = 'body', size = 1, color = INK.cream, align = 1, width = 0 } = {}) {
  const t = scene.add.bitmapText(x, y, font, text, 16 * size, align).setOrigin(0.5).setTint(color);
  if (width) t.setMaxWidth(width);
  return t;
}
