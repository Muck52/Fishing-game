import { W, H, SURFACE_Y, BED_Y, VIEW_BED, DEPTH, webgl } from '../core/constants.js';
import { ART } from '../core/Assets.js';
import { tinyRipple } from './Effects.js';
import { FISH } from '../../data/fish/fish.js';

const STRIP_TOP = SURFACE_Y - 2; // the surface band's outline sits just above the waterline
const DEEP_TOP = STRIP_TOP + 24; // tucked under the band so no seam shows when it bobs
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
    this.surface = scene.add.tileSprite(0, STRIP_TOP, W, 30, 'water-surface').setOrigin(0).setDepth(DEPTH.SURFACE);
    // where the stream from the falls runs into the lake: the surface band's
    // shoreline line opens up there, and the river's foam spreads and fades
    const m = ART.anchors.mouth;
    this.mouth = m ? scene.add.sprite(m.x, STRIP_TOP, 'river-mouth').setOrigin(0).setDepth(DEPTH.SURFACE + 0.05).play('river-mouth') : null;
    this.deep = scene.add.image(0, DEEP_TOP, 'underwater').setOrigin(0).setDepth(DEPTH.DEEP);
    // the deep image is tall enough for any phone; past it, the darkest blue
    scene.add.rectangle(0, DEEP_TOP + this.deep.height, W, H, 0x0e2238).setOrigin(0).setDepth(DEPTH.DEEP);

    // shafts of sunlight slanting down through the water
    this.rays = [35, 105, 165, 260, 320].map((x, i) => {
      const r = scene.add.image(x, SURFACE_Y + 10, 'light-ray').setOrigin(0.5, 0).setDepth(DEPTH.RAYS).setBlendMode(Phaser.BlendModes.ADD);
      r.phase = i * 1.9;
      return r;
    });

    // a rock shelf in the distance, sloping down from the left shore, with
    // weeds along its rim
    const shelfTop = SURFACE_Y + 14;
    scene.add.image(0, shelfTop, 'shelf').setOrigin(0).setDepth(DEPTH.DEEP + 0.5);
    ART.anchors.shelf.forEach((y, i) => {
      if (i % 4 !== 1 || shelfTop + y > BED_Y - 30) return;
      const k = `bed-${['seaweed-1', 'seaweed-2', 'sea-bush-weed-2'][i % 3]}`;
      scene.add.sprite(i * 4, shelfTop + y + 3, k).setOrigin(0.5, 1).setDepth(DEPTH.DEEP + 0.6).setTint(0x5a7a8a).play({ key: `sway-${k}`, startFrame: i % 4 });
    });

    scene.add.image(0, BED_Y - 14, 'lakebed').setOrigin(0).setDepth(DEPTH.BED);
    scene.add.rectangle(0, BED_Y + 26, W, H, 0x424a40).setOrigin(0).setDepth(DEPTH.BED);
    ['sand-pit-2', 'sand-pit-3', 'sand-pit-4', 'sand-pit-5'].forEach((k, i) => scene.add.image([20, 130, 235, 325][i], BED_Y + 9, `bed-${k}`).setOrigin(0.5, 1).setDepth(DEPTH.BED + 0.1));
    scene.add.image(280, BED_Y + 5, 'bed-clam-small').setOrigin(0.5, 1).setDepth(DEPTH.WEEDS + 0.1);

    // weeds rooted in the bed, swaying in the current
    const kinds = ['seaweed-1', 'seaweed-2', 'seaweed-3', 'seaweed-4', 'sea-bush-weed-1', 'sea-bush-weed-2', 'sea-flora-plant-1', 'sea-flora-plant-2', 'sea-flora-plant-3', 'sea-flora-plant-4'];
    for (let x = 7; x < W; x += R(13, 29)) {
      const k = `bed-${kinds[R(0, kinds.length - 1)]}`;
      scene.add.sprite(x, BED_Y + R(2, 8), k).setOrigin(0.5, 1).setDepth(DEPTH.WEEDS + Math.random() * 0.05).play({ key: `sway-${k}`, startFrame: R(0, 3) });
    }

    // the plants of the shallows along the shore (tools/scenery/shore.py):
    // reeds standing in front, algae floating on the surface (riding its
    // swell), stems and weed seen through the water
    const layer = { reeds: DEPTH.REEDS, surface: DEPTH.SURFACE + 0.06, under: DEPTH.SURFACE + 0.04 };
    this.floating = [];
    (ART.anchors.shore?.items || []).forEach((it, i) => {
      const s = scene.add.sprite(it.x, SURFACE_Y + it.y, it.key).setOrigin(...(it.origin || [0, 1])).setDepth(layer[it.layer]);
      if (ART.sheets[it.key]?.frames > 1) s.play({ key: `sway-${it.key}`, startFrame: i % 4 });
      if (it.bob) {
        s.baseY = s.y;
        this.floating.push(s);
      }
    });

    // the sun twinkling on the surface
    this.twinkle = scene.add.particles(0, 0, 'spark', {
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, SURFACE_Y + 1, W, 8) },
      lifespan: { min: 300, max: 700 },
      frequency: 120,
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
    }).setDepth(DEPTH.SURFACE + 0.1);

    // little ripples coming and going all over the surface
    this.nextRipple = 0;

    // a branch drifting by on the surface
    this.branch = scene.add.sprite(-30, SURFACE_Y + 3, 'branch').setDepth(DEPTH.BOBBER - 0.2).play('branch-bob');

    // bubbles trickling up from the weeds, and motes hanging in the water
    const water = new Phaser.Geom.Rectangle(0, SURFACE_Y + 7, W, BED_Y - SURFACE_Y);
    this.bubbleEmitter = scene.add.particles(0, 0, 'bubble', {
      frame: [0, 1, 2],
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, BED_Y - 15, W, 15) },
      deathZone: { type: 'onLeave', source: water },
      lifespan: 14000,
      frequency: 420,
      speedY: { min: -35, max: -20 },
      speedX: { min: -4, max: 4 },
      alpha: 0.75,
    }).setDepth(DEPTH.BUBBLES);
    this.motes = scene.add.particles(0, 0, 'mote', {
      emitZone: { type: 'random', source: water },
      lifespan: { min: 5000, max: 9000 },
      frequency: 160,
      speedX: { min: -3, max: 3 },
      speedY: { min: -2, max: 3 },
      alpha: { start: 0.4, end: 0 },
    }).setDepth(DEPTH.BUBBLES);

    // a school of minnows that wheels about mid-water
    this.schoolAt = { x: W * 0.3, y: SURFACE_Y + 110, dir: 1 };
    this.school = Array.from({ length: 6 }, (_, i) => {
      const m = scene.add.sprite(0, 0, 'minnow').setDepth(DEPTH.FISH - 0.2).play({ key: 'minnow-swim', startFrame: i % 4 });
      m.off = { x: R(-25, 25), y: R(-12, 12), p: Math.random() * 6 };
      m.setPosition(this.schoolAt.x + m.off.x, this.schoolAt.y + m.off.y);
      return m;
    });

    // a few fish of the lake cruising slowly through the water you can see,
    // for life: they never come to the bait
    this.cruisers = [];
    for (let i = 0; i < 4; i++) this.cruisers.push(this.newCruiser(true));

    // the deep wavers like real water
    if (webgl(scene)) {
      this.wobble = this.deep.postFX.addDisplacement('ripple-map', 0, 0);
      scene.cameras.main.postFX.addVignette(0.5, 0.5, 0.95, 0.25);
    }
  }

  newCruiser(anywhere) {
    const fish = FISH[R(0, FISH.length - 1)];
    const fromLeft = Math.random() < 0.5;
    const y = R(SURFACE_Y + 28, VIEW_BED - 16);
    const s = this.scene.add.sprite(anywhere ? R(0, W) : fromLeft ? -60 : W + 60, y, `fish-${fish.id}`).setDepth(DEPTH.FISH - 0.5).setAlpha(0.9).play(`swim-${fish.id}`);
    s.setFlipX(fromLeft).setTint(depthTint(y)); // the art faces left
    s.vx = (fromLeft ? 1 : -1) * R(9, 20);
    s.anims.timeScale = Math.abs(s.vx) / 14; // tail beats faster when it swims faster
    s.baseY = y;
    s.phase = Math.random() * 6;
    return s;
  }

  update(time, dt, wind) {
    if (time > this.nextRipple) {
      tinyRipple(this.scene, R(6, W - 6), SURFACE_Y + R(6, 16));
      this.nextRipple = time + R(250, 700) - wind * 200;
    }
    this.surface.tilePositionX += (3 + wind * 9) * dt;
    this.surface.y = STRIP_TOP + Math.round(Math.sin(time / 900));
    if (this.mouth) this.mouth.y = this.surface.y;
    for (const s of this.floating) s.y = s.baseY + (this.surface.y - STRIP_TOP);
    for (const r of this.rays) r.setAlpha(0.13 + 0.07 * Math.sin(time / 1700 + r.phase));

    this.branch.x += (5 + wind * 10) * dt;
    this.branch.y = SURFACE_Y + 3 + Math.round(Math.sin(time / 700));
    if (this.branch.x > W + 40) this.branch.x = -R(100, 450);

    // the school swings back and forth across the lake as one
    const s = this.schoolAt;
    s.x += s.dir * 20 * dt;
    if (s.x > W - 40 || s.x < 40) s.dir *= -1;
    s.y = SURFACE_Y + 110 + Math.sin(time / 3000) * 45;
    for (const m of this.school) {
      m.x += (s.x + m.off.x + Math.sin(time / 600 + m.off.p) * 5 - m.x) * Math.min(1, dt * 2.5);
      m.y += (s.y + m.off.y + Math.cos(time / 700 + m.off.p) * 3 - m.y) * Math.min(1, dt * 2.5);
      m.setFlipX(s.dir < 0);
    }

    for (let i = 0; i < this.cruisers.length; i++) {
      const c = this.cruisers[i];
      c.x += c.vx * dt;
      c.y = c.baseY + Math.sin(time / 1500 + c.phase) * 7;
      if (c.x < -80 || c.x > W + 80) {
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
