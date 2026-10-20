// Game is laid out on a fixed portrait canvas and scaled to fit the phone.
// Height stretches to fill taller phones so there are no empty bars.
export const W = 720;
export const H = Math.round(Math.min(1600, Math.max(1280, (W * window.innerHeight) / window.innerWidth)));

export const WATER_Y = 480; // horizon line where the lake begins
export const DOCK_Y = H - 180; // front edge of the dock

export const FONT_DISPLAY = '"Lilita One", "Arial Black", sans-serif';
export const FONT_BODY = 'Nunito, "Trebuchet MS", sans-serif';

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

// Things farther out on the lake (higher on screen) draw smaller.
export function depthScale(y) {
  return 0.5 + 0.5 * clamp((y - WATER_Y) / (DOCK_Y - WATER_Y), 0, 1);
}

export function textStyle(size, color = '#ffffff', extra = {}) {
  return {
    fontFamily: FONT_DISPLAY,
    fontSize: `${size}px`,
    color,
    stroke: '#0b2a3f',
    strokeThickness: Math.round(size / 6),
    align: 'center',
    ...extra,
  };
}
