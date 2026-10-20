import { W, PX, AW, HORIZON, WATER_Y, DOCK_AY, DEPTH } from '../core/constants.js';
import { SUN, MUG, DOG } from '../art/SceneryArt.js';
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
      { key: 'cloud-0', y: 15, speed: 1.6 },
      { key: 'cloud-1', y: 35, speed: 2.5 },
      { key: 'cloud-2', y: 78, speed: 1.0 }, // low enough to drift across the sun
    ].map((c) => {
      const img = scene.add.image(Math.random() * W, c.y * PX, c.key).setOrigin(0).setScale(PX).setDepth(DEPTH.CLOUDS);
      img.speed = c.speed * PX;
      return img;
    });

    // Steam fog lying along the far shore and drifting over the water.
    this.mist = [
      { key: 'mist-far', y: HORIZON - 7, depth: DEPTH.MIST_FAR, speed: -1.1, alpha: 0.7 },
      { key: 'mist-water', y: HORIZON + 1, depth: DEPTH.MIST_NEAR, speed: 1.6, alpha: 0.55 },
      { key: 'mist-water', y: HORIZON + 16, depth: DEPTH.MIST_NEAR, speed: -0.9, alpha: 0.35 },
      { key: 'mist-water', y: HORIZON + 41, depth: DEPTH.MIST_NEAR, speed: 1.2, alpha: 0.2 },
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

    this.dog = scene.add.sprite(DOG.x * PX, DOG.y * PX, 'dog', 0).setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.DOCK_LIFE);
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

