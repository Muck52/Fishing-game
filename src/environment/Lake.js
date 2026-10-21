import { W, H, FG, BG, SURFACE_Y, BED_Y, DEPTH, webgl } from '../core/constants.js';
import { FISH } from '../../data/fish/fish.js';

const STRIP_TOP = SURFACE_Y - 6; // the surface band's outline sits just above the waterline
const DEEP_TOP = STRIP_TOP + 24 * FG; // tucked under the band so no seam shows when it bobs
const R = (a, b) => Phaser.Math.Between(a, b);

// Deeper water filters out the warm colours: things far down take on a
// blue-green cast.
export function depthTint(y) {
  const t = Phaser.Math.Clamp((y - SURFACE_Y) / (BED_Y - SURFACE_Y), 0, 1);
  const c = Phaser.Display.Color.Interpolate.ColorWithColor({ r: 255, g: 255, b: 255 }, { r: 120, g: 170, b: 185 }, 100, Math.round(t * 100));
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
}

// The lake seen side-on: a rolling surface band, and below it a cut-away of
// the water with light shafts, a silty bed of swaying weeds, drifting
// motes, rising bubbles and the fish that live there.
export class Lake {
  constructor(scene) {
    this.scene = scene;
    this.surface = scene.add.tileSprite(0, STRIP_TOP, W / FG, 30, 'water-surface').setOrigin(0).setScale(FG).setDepth(DEPTH.SURFACE);
    this.deep = scene.add.image(0, DEEP_TOP, 'underwater').setOrigin(0).setScale(FG).setDepth(DEPTH.DEEP);
    // the deep image is tall enough for any phone; past it, the darkest blue
    scene.add.rectangle(0, DEEP_TOP + this.deep.height * FG, W, H, 0x0e2238).setOrigin(0).setDepth(DEPTH.DEEP);

    // shafts of sunlight slanting down through the water
    this.rays = [70, 210, 330, 520, 640].map((x, i) => {
      const r = scene.add.image(x, SURFACE_Y + 20, 'light-ray').setOrigin(0.5, 0).setScale(FG, FG * 1.2).setDepth(DEPTH.RAYS).setBlendMode(Phaser.BlendModes.ADD);
      r.phase = i * 1.9;
      return r;
    });

    this.bed = scene.add.image(0, BED_Y - 14 * FG, 'lakebed').setOrigin(0).setScale(FG).setDepth(DEPTH.BED);
    scene.add.rectangle(0, BED_Y + 26 * FG, W, H, 0x424a40).setOrigin(0).setDepth(DEPTH.BED);
    const sand = ['sand-pit-2', 'sand-pit-3', 'sand-pit-4', 'sand-pit-5'];
    [40, 260, 470, 650].forEach((x, i) => scene.add.image(x, BED_Y + 18, `bed-${sand[i]}`).setOrigin(0.5, 1).setScale(BG).setDepth(DEPTH.BED + 0.1));
    scene.add.image(560, BED_Y + 10, 'bed-clam-small').setOrigin(0.5, 1).setScale(BG).setDepth(DEPTH.WEEDS + 0.1);

    // weeds rooted in the bed, leaning with the current
    const kinds = ['seaweed-1', 'seaweed-2', 'seaweed-3', 'seaweed-4', 'sea-bush-weed-1', 'sea-bush-weed-2', 'sea-flora-plant-1', 'sea-flora-plant-2', 'sea-flora-plant-3', 'sea-flora-plant-4'];
    this.weeds = [];
    for (let x = 14; x < W; x += R(26, 58)) {
      const k = kinds[R(0, kinds.length - 1)];
      const tall = k.startsWith('seaweed') && Math.random() < 0.5;
      const w = scene.add.image(x, BED_Y + R(4, 16), `bed-${k}`).setOrigin(0.5, 1).setScale(FG, FG * (tall ? 1.6 : 1)).setDepth(DEPTH.WEEDS + Math.random() * 0.05);
      w.phase = Math.random() * 6;
      w.give = 0.03 + Math.random() * 0.04;
      this.weeds.push(w);
    }

    // glints of sun dancing on the surface
    this.glints = [];
    for (let i = 0; i < 6; i++) {
      const g = scene.add.sprite(0, 0, 'glints', 0).setOrigin(0.5, 1).setScale(BG, BG * 0.35).setDepth(DEPTH.SURFACE + 0.1).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.7);
      g.on('animationcomplete', () => scene.time.delayedCall(R(100, 1800), () => this.placeGlint(g)));
      this.placeGlint(g);
      this.glints.push(g);
    }

    // a branch drifting by, the odd bit of driftwood on the surface
    this.branch = scene.add.sprite(-60, SURFACE_Y + 6, 'branch').setScale(BG).setDepth(DEPTH.BOBBER - 0.2).play('branch-bob');

    // bubbles trickling up from the weeds, and motes hanging in the water
    const water = new Phaser.Geom.Rectangle(0, SURFACE_Y + 14, W, BED_Y - SURFACE_Y);
    this.bubbleEmitter = scene.add.particles(0, 0, 'bubble', {
      frame: [0, 1, 2],
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, BED_Y - 30, W, 30) },
      deathZone: { type: 'onLeave', source: water },
      lifespan: 12000,
      frequency: 420,
      speedY: { min: -70, max: -40 },
      speedX: { min: -8, max: 8 },
      scale: { min: FG - 2, max: FG - 1 },
      alpha: 0.75,
    }).setDepth(DEPTH.BUBBLES);
    this.motes = scene.add.particles(0, 0, 'mote', {
      emitZone: { type: 'random', source: water },
      lifespan: { min: 5000, max: 9000 },
      frequency: 160,
      speedX: { min: -6, max: 6 },
      speedY: { min: -4, max: 6 },
      scale: { min: 2, max: 3 },
      alpha: { start: 0.35, end: 0 },
    }).setDepth(DEPTH.BUBBLES);

    // a school of minnows that wheels about mid-water
    this.school = Array.from({ length: 6 }, (_, i) => {
      const m = scene.add.sprite(0, 0, 'minnow').setScale(BG - 1).setDepth(DEPTH.FISH - 0.2).setAlpha(0.9).play({ key: 'minnow-swim', startFrame: i % 4 });
      m.off = { x: R(-50, 50), y: R(-24, 24), p: Math.random() * 6 };
      m.setPosition(W * 0.3 + m.off.x, SURFACE_Y + 220 + m.off.y);
      return m;
    });
    this.schoolAt = { x: W * 0.3, y: SURFACE_Y + 200, dir: 1 };

    // a few fish of the lake cruising slowly, out of reach
    this.cruisers = [];
    for (let i = 0; i < 3; i++) this.cruisers.push(this.newCruiser(true));

    // the deep wavers like real water
    if (webgl(scene)) {
      this.wobble = this.deep.postFX.addDisplacement('ripple-map', 0, 0);
      scene.cameras.main.postFX.addVignette(0.5, 0.5, 0.95, 0.25);
    }
  }

  placeGlint(g) {
    g.setPosition(R(20, W - 20), SURFACE_Y + 6).play('glint');
  }

  newCruiser(anywhere) {
    const fish = FISH[R(0, FISH.length - 1)];
    const fromLeft = Math.random() < 0.5;
    const y = R(SURFACE_Y + 160, BED_Y - 80);
    const s = this.scene.add.sprite(anywhere ? R(0, W) : fromLeft ? -120 : W + 120, y, `fish-${fish.id}`).setScale(BG).setDepth(DEPTH.FISH - 0.5).setAlpha(0.85).play(`swim-${fish.id}`);
    s.setFlipX(fromLeft); // the art faces left
    s.setTint(depthTint(y));
    s.vx = (fromLeft ? 1 : -1) * R(18, 40);
    s.baseY = y;
    s.phase = Math.random() * 6;
    return s;
  }

  update(time, dt, wind) {
    this.surface.tilePositionX += (6 + wind * 18) * dt;
    this.surface.y = STRIP_TOP + Math.round(Math.sin(time / 900)) * 2;
    for (const r of this.rays) r.setAlpha(0.13 + 0.07 * Math.sin(time / 1700 + r.phase));
    for (const w of this.weeds) w.rotation = Math.sin(time / 1300 + w.phase) * w.give + wind * 0.05;

    this.branch.x += (10 + wind * 20) * dt;
    this.branch.y = SURFACE_Y + 6 + Math.round(Math.sin(time / 700)) * 2;
    if (this.branch.x > W + 80) this.branch.x = -R(200, 900);

    // the school swings back and forth across the lake as one
    const s = this.schoolAt;
    s.x += s.dir * 40 * dt;
    if (s.x > W - 80 || s.x < 80) s.dir *= -1;
    s.y = SURFACE_Y + 220 + Math.sin(time / 3000) * 90;
    for (const m of this.school) {
      m.x += (s.x + m.off.x + Math.sin(time / 600 + m.off.p) * 10 - m.x) * Math.min(1, dt * 2.5);
      m.y += (s.y + m.off.y + Math.cos(time / 700 + m.off.p) * 6 - m.y) * Math.min(1, dt * 2.5);
      m.setFlipX(s.dir < 0);
    }

    for (let i = 0; i < this.cruisers.length; i++) {
      const c = this.cruisers[i];
      c.x += c.vx * dt;
      c.y = c.baseY + Math.sin(time / 1500 + c.phase) * 14;
      if (c.x < -160 || c.x > W + 160) {
        c.destroy();
        this.cruisers[i] = this.newCruiser(false);
      }
    }

    if (this.wobble) {
      this.wobble.x = 0.004 * Math.sin(time / 900);
      this.wobble.y = 0.002 * Math.cos(time / 1300);
    }
  }
}
