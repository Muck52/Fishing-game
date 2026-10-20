// All art is pixel art: one art pixel is drawn as a PX x PX block on screen.
export const PX = 3;

// Game is laid out on a fixed-width portrait canvas and scaled to fit the phone.
// Height stretches to fill taller phones so there are no empty bars.
export const W = 720;
const rawH = Math.min(1600, Math.max(1280, (W * window.innerHeight) / window.innerWidth));
export const H = Math.round(rawH / PX) * PX;

// The same layout in art pixels.
export const AW = W / PX;
export const AH = H / PX;

export const WATER_Y = 480; // far shoreline where the lake begins
export const HORIZON = WATER_Y / PX;
export const DOCK_Y = H - 180; // far edge of the dock
export const DOCK_AY = DOCK_Y / PX;

export const FONT = '"Pixelify Sans", "Courier New", monospace';
export const INK = '#2a2620';

// Draw order, back to front.
export const DEPTH = {
  SKY: 0,
  CLOUDS: 1,
  MOUNTAINS: 2,
  MIST_FAR: 3,
  FOREST: 4,
  SHORE: 5,
  WATER: 6,
  WATER_LIFE: 7,
  MIST_NEAR: 8,
  BANKS: 9,
  BANK_LIFE: 10,
  DOCK: 11,
  DOCK_LIFE: 12,
  PLAYER: 13,
  LINE: 14,
  BOBBER: 15,
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

// Things far out on the lake draw at a smaller pixel scale.
export function pxScale(y) {
  return y < WATER_Y + (DOCK_Y - WATER_Y) * 0.45 ? 2 : 3;
}

// Outlined text that reads over sky, forest and water.
export function textStyle(size, color = '#fbf3dc', extra = {}) {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    align: 'center',
    stroke: INK,
    strokeThickness: Math.max(4, Math.round(size / 7)),
    shadow: { offsetX: 0, offsetY: Math.max(3, Math.round(size / 12)), color: INK, blur: 0, stroke: true, fill: true },
    ...extra,
  };
}

// Plain text for parchment and wood panels.
export function inkStyle(size, color = INK, extra = {}) {
  return { fontFamily: FONT, fontSize: `${size}px`, color, align: 'center', ...extra };
}
