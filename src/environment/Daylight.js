import { W, H, SURFACE_Y, DEPTH, LOOK_UP } from '../core/constants.js';

// The lake keeps the phone's own time, read afresh every frame, so it is
// dark in the game when it is dark outside. Each moment of the day is a colour
// the whole scene is multiplied by, and how dark it is (0 noon, 1 night).
// Between the keyframes the colours blend minute by minute.
const DAY = [
  [0, 0x6c78b0, 1],
  [4.5, 0x707cb2, 1],
  [6, 0xc89cb0, 0.55], // dawn: rose
  [7.5, 0xffe2c8, 0.1],
  [9, 0xffffff, 0],
  [16.5, 0xffffff, 0],
  [18, 0xffc890, 0.2], // golden hour
  [19.5, 0xcc8a98, 0.55], // dusk: mauve
  [21, 0x7076ae, 0.9],
  [22, 0x6c78b0, 1],
  [24, 0x6c78b0, 1],
];
// After dark a faint blue is added over everything as well, so the deepest
// shadows lift a little and details still read on a phone at night.
const LIFT = 0x0e1424;

// The hour the lake shows: the phone's clock, or ?hour=21 in the address
// bar to look at another time.
export function hourNow() {
  const forced = new URLSearchParams(window.location.search).get('hour');
  if (forced !== null && forced !== '' && Number.isFinite(Number(forced))) return Number(forced) % 24;
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

// The sky (Backdrop.js) is drawn for five times of day; at any hour it
// blends between the two either side. Returns [from, to, how far].
const SKY = [[0, 'night'], [4.5, 'night'], [6, 'dawn'], [9, 'day'], [16.5, 'day'], [18, 'golden'], [19.5, 'dusk'], [21, 'night'], [24, 'night']];
export function skyBlend(h = hourNow()) {
  let i = 0;
  while (i < SKY.length - 2 && h >= SKY[i + 1][0]) i++;
  const [h0, a] = SKY[i];
  const [h1, b] = SKY[i + 1];
  return [a, b, a === b ? 0 : Math.max(0, Math.min(1, (h - h0) / (h1 - h0)))];
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
  constructor(scene, pier, unshaded = null) {
    this.scene = scene;
    // the sky is drawn in each hour's own light (Backdrop.js), so the grade
    // leaves it alone: the grade is a white sheet with the sky cut out of it
    // (a clear pixel neither multiplies nor adds), and birds up there are
    // tinted by hand instead
    const shade = (blend) => scene.add.image(0, 0, '__WHITE').setOrigin(0).setDisplaySize(W, H).setDepth(DEPTH.SHADE).setBlendMode(blend);
    this.shade = shade(Phaser.BlendModes.MULTIPLY);
    this.lift = shade(Phaser.BlendModes.ADD).setDepth(DEPTH.SHADE + 0.1).setTint(LIFT);
    if (unshaded) {
      // a sheet over the whole world the camera can see, a little extra for
      // its shake, that scrolls with it
      const m = 8;
      const top = -LOOK_UP - m;
      if (scene.textures.exists('shade-sheet')) scene.textures.remove('shade-sheet');
      const sheet = scene.textures.addDynamicTexture('shade-sheet', W + m * 2, H - top + m);
      sheet.fill(0xffffff, 1).erase(new Phaser.GameObjects.Rectangle(scene, 0, 0, W + m * 2, unshaded.bottom - top, 0xffffff).setOrigin(0));
      for (const [key, frame, x, y] of unshaded.bank) sheet.draw(scene.make.image({ key, frame, x: x + m, y: y - top, add: false }).setOrigin(0).setTintFill(0xffffff));
      for (const o of [this.shade, this.lift]) {
        o.setTexture('shade-sheet').setPosition(-m, top).setDisplaySize(sheet.width, sheet.height);
        o.inWorld = true;
      }
      this.masked = true;
    }
    // lights that show through the dark: the hut's windows and doorway,
    // and fireflies over the reeds
    this.lights = scene.add.image(pier.hutAt.x, pier.hutAt.y, 'hut-lights').setOrigin(0).setDepth(DEPTH.GLOW);
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
    if (this.masked) {
      for (const o of this.scene.children.list) if (o.depth === DEPTH.BIRDS && o.setTint) o.setTint(color);
    }
    this.lift.setAlpha(night);
    this.lights.setAlpha(Phaser.Math.Clamp((night - 0.3) / 0.5, 0, 1)); // on from dusk
    this.flies.setVisible(night > 0.5);
  }
}
