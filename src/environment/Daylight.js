import { W, H, SURFACE_Y, DEPTH } from '../core/constants.js';

// The lake keeps the phone's own time. Each moment of the day is a colour
// the whole scene is multiplied by, and how dark it is (0 noon, 1 night).
// Between the keyframes the colours blend minute by minute.
const DAY = [
  [0, 0x46528c, 1],
  [4.5, 0x4a5690, 1],
  [6, 0xb88aa0, 0.55], // dawn: rose
  [7.5, 0xffe2c8, 0.1],
  [9, 0xffffff, 0],
  [16.5, 0xffffff, 0],
  [18, 0xffc890, 0.2], // golden hour
  [19.5, 0xc07a8a, 0.55], // dusk: mauve
  [21, 0x4a4e8e, 0.9],
  [22, 0x46528c, 1],
  [24, 0x46528c, 1],
];

// The hour the lake shows: the phone's clock, or ?hour=21 in the address
// bar to look at another time.
export function hourNow() {
  const forced = Number(new URLSearchParams(window.location.search).get('hour'));
  if (forced || forced === 0) return forced % 24;
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

export function partOfDay(h = hourNow()) {
  return h < 5 ? 'night' : h < 8 ? 'dawn' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 20 ? 'evening' : 'night';
}

function sample(h) {
  let i = 0;
  while (i < DAY.length - 2 && h >= DAY[i + 1][0]) i++;
  const [h0, c0, n0] = DAY[i];
  const [h1, c1, n1] = DAY[i + 1];
  const t = (h - h0) / (h1 - h0);
  const a = Phaser.Display.Color.IntegerToColor(c0);
  const b = Phaser.Display.Color.IntegerToColor(c1);
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 100, Math.round(t * 100));
  return { color: Phaser.Display.Color.GetColor(c.r, c.g, c.b), night: n0 + (n1 - n0) * t };
}

export class Daylight {
  constructor(scene, pier) {
    this.scene = scene;
    this.shade = scene.add.image(0, 0, '__WHITE').setOrigin(0).setDisplaySize(W, H).setDepth(DEPTH.SHADE).setBlendMode(Phaser.BlendModes.MULTIPLY);
    // lights that show through the dark: the hut's window and fireflies
    // over the reeds
    this.window = scene.add.image(pier.window.x, pier.window.y, 'glow').setDepth(DEPTH.GLOW).setBlendMode(Phaser.BlendModes.ADD);
    this.streak = scene.add.image(pier.window.x - 30, SURFACE_Y + 1, 'light-streak').setOrigin(0.5, 0).setDepth(DEPTH.GLOW).setBlendMode(Phaser.BlendModes.ADD);
    this.flies = scene.add.particles(0, 0, 'firefly', {
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, SURFACE_Y - 70, 200, 66) },
      lifespan: { min: 2500, max: 5000 },
      frequency: 260,
      speedX: { min: -6, max: 6 },
      speedY: { min: -5, max: 3 },
      alpha: { onUpdate: (p, k, t) => Math.sin(Math.PI * t) }, // fade in, then out
      blendMode: 'ADD',
    }).setDepth(DEPTH.GLOW);
    this.update(0);
  }

  update(time) {
    const { color, night } = sample(hourNow());
    this.night = night;
    this.shade.setTint(color);
    this.window.setAlpha(night * (0.75 + 0.1 * Math.sin(time / 300)));
    this.streak.setAlpha(night * 0.6).setFlipX(Math.sin(time / 400) > 0); // shimmering
    this.flies.setVisible(night > 0.5);
  }
}
