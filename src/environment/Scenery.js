import { W, PX, AW, HORIZON, WATER_Y, DOCK_AY, DEPTH } from '../core/constants.js';
import { SUN, MUG, DOG, FALLS, REED_BED } from '../art/SceneryArt.js';
import { Wind } from './Wind.js';
import { Waves } from './Waves.js';
import { Sun } from './Sun.js';
import { Reeds } from './Reeds.js';

const layer = (scene, key, y, depth) => scene.add.image(0, y, key).setOrigin(0).setScale(PX).setDepth(depth);

// Lays out the painted lake and keeps its weather and light moving.
export class Scenery {
  constructor(scene) {
    this.scene = scene;
    layer(scene, 'sky', 0, DEPTH.SKY);
    layer(scene, 'mountains', 0, DEPTH.MOUNTAINS);
    layer(scene, 'forest', 0, DEPTH.FOREST);

    // the waterfall pours off the west cliff into a churn of foam
    const fallsH = HORIZON - FALLS.top;
    this.falls = scene.add.tileSprite(FALLS.x * PX, FALLS.top * PX, FALLS.w, fallsH, 'falls').setOrigin(0).setScale(PX).setDepth(DEPTH.FOREST + 0.2);
    scene.add.sprite((FALLS.x + FALLS.w / 2) * PX, HORIZON * PX + PX, 'foam').setScale(PX).setDepth(DEPTH.WATER_LIFE).play('foam-churn');
    layer(scene, 'water', WATER_Y, DEPTH.WATER);
    layer(scene, 'banks', 0, DEPTH.BANKS);
    layer(scene, 'dock', 0, DEPTH.DOCK);

    this.wind = new Wind();
    this.sun = new Sun(scene);
    this.waves = new Waves(scene, this.wind);
    this.reeds = new Reeds(scene, this.wind);
    this.wind.onGust = (g) => {
      this.waves.gustPatch(g);
      this.blowLeaves(g);
    };

    this.clouds = [
      { key: 'cloud-0', y: 6, speed: 1.6 },
      { key: 'cloud-1', y: 52, speed: 2.5 },
      { key: 'cloud-2', y: 22, speed: 1.0 }, // drifts across the face of the sun
    ].map((c) => {
      const img = scene.add.image(Math.random() * W, c.y * PX, c.key).setOrigin(0).setScale(PX).setDepth(DEPTH.CLOUDS);
      img.speed = c.speed * PX;
      return img;
    });

    // Light haze along the far shore and drifting over the water.
    this.mist = [
      { key: 'mist-far', y: HORIZON - 7, depth: DEPTH.MIST_FAR, speed: -1.1, alpha: 0.45 },
      { key: 'mist-water', y: HORIZON + 1, depth: DEPTH.MIST_NEAR, speed: 1.6, alpha: 0.35 },
      { key: 'mist-water', y: HORIZON + 16, depth: DEPTH.MIST_NEAR, speed: -0.9, alpha: 0.2 },
      { key: 'mist-water', y: HORIZON + 41, depth: DEPTH.MIST_NEAR, speed: 1.2, alpha: 0.1 },
    ].map((m) => {
      const t = scene.add.tileSprite(0, m.y * PX, AW, scene.textures.get(m.key).getSourceImage().height, m.key);
      t.setOrigin(0).setScale(PX).setDepth(m.depth).setAlpha(m.alpha);
      t.tilePositionX = Math.random() * AW;
      t.speed = m.speed;
      return t;
    });

    this.sparkles = [];
    for (let i = 0; i < 12; i++) {
      const s = scene.add.sprite(0, 0, 'sparkle', 0).setScale(PX).setDepth(DEPTH.WATER_LIFE);
      this.placeSparkle(s);
      s.on('animationcomplete', () => scene.time.delayedCall(Phaser.Math.Between(200, 2500), () => this.placeSparkle(s)));
    }

    this.leaves = [];
    for (let i = 0; i < 5; i++) {
      const y = Phaser.Math.Between(HORIZON + 22, DOCK_AY - 22) * PX;
      const leaf = scene.add.sprite(Math.random() * W, y, 'leaf', i % 3).setScale(PX).setDepth(DEPTH.WATER_LIFE);
      leaf.baseY = y;
      leaf.speed = (1.5 + Math.random() * 2) * PX;
      leaf.phase = Math.random() * 6;
      this.leaves.push(leaf);
    }

    // a rowboat moored by the reeds, rocking on the swell
    this.boat = scene.add.sprite((REED_BED.x + 30) * PX, (REED_BED.y + 3) * PX, 'boat').setOrigin(0.5, 1).setScale(PX - 1).setDepth(DEPTH.BANKS + 0.3);
    this.boatY = this.boat.y;

    this.dog = scene.add.sprite(DOG.x * PX, DOG.y * PX, 'dog', 0).setOrigin(0.5, 1).setScale(PX).setFlipX(true).setDepth(DEPTH.DOCK_LIFE);
    this.nextWag = scene.time.now + 4000;
    scene.add.sprite((MUG.x + 2) * PX, MUG.y * PX, 'steam').setOrigin(0.5, 1).setScale(PX).setAlpha(0.55).setDepth(DEPTH.DOCK_LIFE).play('steam-rise');
  }

  // Glints appear where the low sun lights the water.
  placeSparkle(s) {
    const r = Phaser.Math.Between(2, 75);
    const spread = 2 + r * 0.25;
    s.setPosition(Math.round(SUN.x + (Math.random() - 0.5) * spread * 2) * PX, (HORIZON + r) * PX);
    s.play('sparkle');
  }

  // A gust strips leaves from the aspens and tamaracks and carries them out
  // over the lake, tumbling, until they settle on the water.
  blowLeaves(g) {
    const s = this.scene;
    const n = Math.round(3 + g.power * 8);
    for (let i = 0; i < n; i++) {
      const leaf = s.add.sprite(Phaser.Math.Between(-20, W * 0.6), Phaser.Math.Between(HORIZON - 30, HORIZON - 4) * PX, 'leaf', i % 3).setScale(PX).setDepth(DEPTH.MIST_NEAR + 0.5);
      const landY = Phaser.Math.Between(HORIZON + 10, DOCK_AY - 10) * PX;
      const startY = leaf.y;
      const phase = Math.random() * 6;
      s.tweens.addCounter({
        from: 0,
        to: 1,
        delay: i * 180,
        duration: Phaser.Math.Between(3000, 5000),
        onUpdate: (tw) => {
          const t = tw.getValue();
          leaf.x += (60 + this.wind.strength * 140) * (1 / 60);
          leaf.y = startY + (landY - startY) * t + Math.sin(t * 12 + phase) * 4 * PX;
          leaf.setFlipX(Math.sin(t * 20 + phase) > 0).setFlipY(Math.sin(t * 13 + phase) > 0.6);
        },
        onComplete: () => {
          s.tweens.add({ targets: leaf, alpha: 0, duration: 2500, onComplete: () => leaf.destroy() });
        },
      });
    }
  }

  dogAlert(on) {
    this.dog.stop();
    this.dog.setFrame(on ? 2 : 0);
  }

  dogWag() {
    this.dog.play('dog-wag');
  }

  update(time, dt) {
    this.wind.update(dt);
    const w = this.wind.strength;
    this.sun.update(time, dt, this.clouds);
    this.waves.update(time, dt);
    this.reeds.update();
    this.falls.tilePositionY -= 40 * dt;
    this.boat.y = this.boatY + Math.round(Math.sin(time / 900)) * (PX - 1);
    this.boat.rotation = Math.sin(time / 1300) * 0.03 * (0.5 + w);
    for (const c of this.clouds) {
      c.x += c.speed * (0.4 + w * 1.4) * dt;
      if (c.x > W) c.x = -c.width * PX;
    }
    for (const m of this.mist) m.tilePositionX += m.speed * (0.5 + w * 1.2) * dt;
    for (const leaf of this.leaves) {
      leaf.x += leaf.speed * (0.4 + w * 1.5) * dt;
      leaf.y = leaf.baseY + Math.round(Math.sin(time / 900 + leaf.phase)) * PX;
      if (leaf.x > W + 10) leaf.x = -10;
    }
    if (time > this.nextWag && this.dog.frame.name !== 2) {
      this.dogWag();
      this.nextWag = time + Phaser.Math.Between(7000, 15000);
    }
  }
}

