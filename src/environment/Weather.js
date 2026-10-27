// The weather over the lake: clear, cloudy, rain or fog. It has nothing to
// do with the weather where you are; it changes by itself every few
// minutes, drifting from one kind to a likely next (a clear sky clouds
// over, cloud brings rain or clears, rain thins to fog...). ?weather=rain
// in the address holds it to one kind, for trying them out.
//
// What it does to the scene, each fading in over half a minute:
//   cloudy  the light goes grey and flat, and the breeze picks up
//   rain    darker still, rain slanting down with the wind, the surface
//           pocked with rings
//   fog     a pale, washed-out light, mist lying on the water, and still air
// Which fish bite is up to them (fish/Habits.js).
import { W, H, SURFACE_Y, DEPTH, clamp } from '../core/constants.js';
import { tinyRipple } from './Effects.js';

export const KINDS = ['clear', 'cloudy', 'rain', 'fog'];
export const WEATHER_NAME = { clear: 'Clear', cloudy: 'Cloudy', rain: 'Rain', fog: 'Fog' };
// what tends to come next, and how likely
const NEXT = {
  clear: { cloudy: 3, fog: 1 },
  cloudy: { clear: 3, rain: 3, fog: 1 },
  rain: { cloudy: 3, fog: 2, clear: 1 },
  fog: { clear: 2, cloudy: 2 },
};
const START = { clear: 4, cloudy: 3, rain: 2, fog: 1 };
// the light under each sky (multiplied over everything), the extra breeze,
// how hard it rains and how thick the mist is
const LOOK = {
  clear: { tint: 0xffffff, wind: 0, rain: 0, mist: 0 },
  cloudy: { tint: 0xc6cad4, wind: 0.12, rain: 0, mist: 0 },
  rain: { tint: 0xa2a9ba, wind: 0.25, rain: 1, mist: 0.15 },
  fog: { tint: 0xd2d4d8, wind: -0.18, rain: 0, mist: 1 },
};
const FADE = 30; // seconds to change over
const R = (a, b) => Phaser.Math.Between(a, b);

function pick(weights) {
  const ks = Object.keys(weights);
  let r = Math.random() * ks.reduce((a, k) => a + weights[k], 0);
  return ks.find((k) => (r -= weights[k]) <= 0) || ks[0];
}

// The weather's little icons, 9 x 9, for the badge at the top.
const COL = { y: 0xffd84a, m: 0xf2ecc8, w: 0xc8ced6, W: 0xf0f4f8, g: 0x8890a0, G: 0xb0b8c4, b: 0x7cc8ff, f: 0xd8dce4 };
const ICON = {
  clear: ['....y....', '.y.....y.', '...yyy...', '..yyyyy..', 'y.yyyyy.y', '..yyyyy..', '...yyy...', '.y.....y.', '....y....'],
  night: ['...mmm...', '..mm.....', '.mm......', '.mm......', '.mm......', '.mm......', '..mm.....', '...mmm...', '.........'],
  cloudy: ['.........', '...ww....', '..wWWw...', '.wWWWWww.', 'wWWWWWWWw', 'wWWWWWWWw', '.wwwwwww.', '.........', '.........'],
  rain: ['..gg.....', '.gGGg....', 'gGGGGgg..', 'gGGGGGGg.', '.gggggg..', '.b..b..b.', 'b..b..b..', '..b..b...', '.........'],
  fog: ['.........', '.fffffff.', '.........', 'fffffff..', '.........', '..fffffff', '.........', '.fffff...', '.........'],
};

export function makeWeatherArt(scene) {
  for (const [k, rows] of Object.entries(ICON)) {
    const key = `weather-${k}`;
    if (scene.textures.exists(key)) continue;
    const g = scene.make.graphics({ add: false });
    rows.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && g.fillStyle(COL[ch], 1).fillRect(x, y, 1, 1)));
    g.generateTexture(key, 9, 9);
    g.destroy();
  }
  if (!scene.textures.exists('raindrop')) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0xdfeef8, 0.6).fillRect(0, 0, 1, 2);
    g.fillStyle(0xeef6fc, 1).fillRect(0, 2, 1, 5);
    g.generateTexture('raindrop', 1, 7);
    g.destroy();
  }
}

export class Weather {
  constructor(scene) {
    this.scene = scene;
    makeWeatherArt(scene);
    const forced = new URLSearchParams(window.location.search).get('weather');
    this.fixed = KINDS.includes(forced) ? forced : null;
    this.kind = this.fixed || pick(START);
    this.until = R(180, 420);
    this.onChange = () => {};
    // where things stand now, easing toward the kind's LOOK
    const l = LOOK[this.kind];
    this.now = { r: l.tint >> 16, g: (l.tint >> 8) & 255, b: l.tint & 255, wind: l.wind, rain: l.rain, mist: l.mist };

    // the grey of the sky over everything, under the hour's light
    this.grey = scene.add.image(0, 0, '__WHITE').setOrigin(0).setDisplaySize(W, H).setDepth(DEPTH.SHADE + 0.02).setBlendMode(Phaser.BlendModes.MULTIPLY);
    // a pale veil for fog, darkened by the hour's light like the rest
    // (from the top of the sky down to the water: not over the bar at the
    // top, nor under the surface)
    this.veil = scene.add.image(0, 0, '__WHITE').setOrigin(0).setDisplaySize(W, SURFACE_Y + 2).setDepth(DEPTH.AIR + 0.5).setTint(0xdfe4ea).setAlpha(0);
    // mist lying on the water and over the far bank
    this.mist = scene.add.particles(0, 0, 'mist', {
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-40, SURFACE_Y - 46, W + 40, 52) },
      lifespan: { min: 7000, max: 11000 },
      frequency: 140,
      speedX: { min: 2, max: 7 },
      speedY: { min: -1, max: 1 },
      scale: { start: 4, end: 7 },
      alpha: { onUpdate: (p, k, t) => Math.sin(Math.PI * t) * 0.55 * this.now.mist },
    }).setDepth(DEPTH.AIR);
    // rain, slanting with the breeze, gone where it meets the lake
    this.rain = scene.add.particles(0, 0, 'raindrop', {
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-60, -8, W + 60, 6) },
      deathZone: { type: 'onEnter', source: new Phaser.Geom.Rectangle(-200, SURFACE_Y + 2, W + 400, 2000) },
      lifespan: 2400,
      frequency: 4,
      speedY: { min: 300, max: 360 },
      speedX: { onEmit: () => 30 + this.windNow * 50 },
      alpha: { min: 0.5, max: 0.9 },
    }).setDepth(DEPTH.AIR);
    this.windNow = 0.3;
    this.ringAt = 0;
    this.apply(0);
  }

  // The badge's icon: a clear night shows the moon.
  icon(night) {
    return this.kind === 'clear' && night > 0.6 ? 'weather-night' : `weather-${this.kind}`;
  }

  update(time, dt, wind, night) {
    this.windNow = wind.strength;
    if (!this.fixed) {
      this.until -= dt;
      if (this.until <= 0) {
        this.kind = pick(NEXT[this.kind]);
        this.until = R(180, 420);
        this.onChange(this.kind);
      }
    }
    // ease toward how this weather looks
    const l = LOOK[this.kind];
    const k = Math.min(1, dt / FADE * 3);
    const n = this.now;
    n.r += ((l.tint >> 16) - n.r) * k;
    n.g += (((l.tint >> 8) & 255) - n.g) * k;
    n.b += ((l.tint & 255) - n.b) * k;
    for (const key of ['wind', 'rain', 'mist']) n[key] += (l[key] - n[key]) * k;
    wind.extra = n.wind;
    this.apply(night);
    // rings on the water where the rain lands
    if (n.rain > 0.05 && time > this.ringAt) {
      tinyRipple(this.scene, R(4, W - 4), SURFACE_Y + R(5, 9));
      this.ringAt = time + 90 / n.rain;
    }
  }

  apply(night) {
    const n = this.now;
    // at night the grey matters less: it's dark anyway
    const lift = (c) => Math.round(clamp(c + (255 - c) * night * 0.6, 0, 255));
    this.grey.setTint(Phaser.Display.Color.GetColor(lift(n.r), lift(n.g), lift(n.b)));
    this.veil.setAlpha(n.mist * 0.3);
    this.mist.emitting = n.mist > 0.05;
    this.rain.emitting = n.rain > 0.05;
    this.rain.frequency = n.rain > 0.05 ? 4 / n.rain : 1000;
  }
}
