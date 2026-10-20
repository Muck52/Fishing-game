import { W, PX, AW, HORIZON, WATER_Y, DOCK_AY, DEPTH } from '../core/constants.js';
import { SUN, MUG, DOG } from '../art/SceneryArt.js';

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

    this.clouds = [
      { key: 'cloud-0', y: 20, speed: 2.2 },
      { key: 'cloud-1', y: 46, speed: 3.4 },
      { key: 'cloud-2', y: 70, speed: 1.4 },
    ].map((c) => {
      const img = scene.add.image(Math.random() * W, c.y * PX, c.key).setOrigin(0).setScale(PX).setDepth(DEPTH.CLOUDS);
      img.speed = c.speed * PX;
      return img;
    });

    // Steam fog lying along the far shore and drifting over the water.
    this.mist = [
      { key: 'mist-far', y: HORIZON - 9, depth: DEPTH.MIST_FAR, speed: -1.5, alpha: 0.7 },
      { key: 'mist-water', y: HORIZON + 2, depth: DEPTH.MIST_NEAR, speed: 2.2, alpha: 0.55 },
      { key: 'mist-water', y: HORIZON + 22, depth: DEPTH.MIST_NEAR, speed: -1.2, alpha: 0.35 },
      { key: 'mist-water', y: HORIZON + 55, depth: DEPTH.MIST_NEAR, speed: 1.6, alpha: 0.2 },
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

    // Cat's-paw ripples where the breeze touches the water.
    for (let i = 0; i < 22; i++) {
      const dash = scene.add.rectangle(0, 0, PX, PX, 0xdce8e2).setOrigin(0).setDepth(DEPTH.WATER_LIFE).setAlpha(0);
      this.placeRipple(dash, Math.random() * 3000);
    }

    this.leaves = [];
    for (let i = 0; i < 5; i++) {
      const y = Phaser.Math.Between(HORIZON + 30, DOCK_AY - 30) * PX;
      const leaf = scene.add.sprite(Math.random() * W, y, 'leaf', i % 3).setScale(PX).setDepth(DEPTH.WATER_LIFE);
      leaf.baseY = y;
      leaf.speed = (2 + Math.random() * 3) * PX;
      leaf.phase = Math.random() * 6;
      this.leaves.push(leaf);
    }

    this.dog = scene.add.sprite(DOG.x * PX, DOG.y * PX, 'dog', 0).setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.DOCK_LIFE);
    this.nextWag = scene.time.now + 4000;
    scene.add.sprite((MUG.x + 2) * PX, MUG.y * PX, 'steam').setOrigin(0.5, 1).setScale(PX).setAlpha(0.55).setDepth(DEPTH.DOCK_LIFE).play('steam-rise');
  }

  // Glints appear where the low sun lights the water.
  placeSparkle(s) {
    const r = Phaser.Math.Between(2, 100);
    const spread = 3 + r * 0.25;
    s.setPosition(Math.round(SUN.x + (Math.random() - 0.5) * spread * 2) * PX, (HORIZON + r) * PX);
    s.play('sparkle');
  }

  placeRipple(dash, delay) {
    const row = Phaser.Math.Between(HORIZON + 8, DOCK_AY - 6);
    const near = (row - HORIZON) / (DOCK_AY - HORIZON);
    dash.setPosition(Phaser.Math.Between(0, AW - 8) * PX, row * PX);
    dash.width = Math.round(2 + near * 8 + Math.random() * 3) * PX;
    this.scene.tweens.add({
      targets: dash,
      alpha: 0.18 + near * 0.2,
      x: dash.x + PX * 3,
      delay,
      duration: Phaser.Math.Between(1400, 2600),
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => this.placeRipple(dash, Math.random() * 1500),
    });
  }

  dogAlert(on) {
    this.dog.stop();
    this.dog.setFrame(on ? 2 : 0);
  }

  dogWag() {
    this.dog.play('dog-wag');
  }

  update(time, dt) {
    for (const c of this.clouds) {
      c.x += c.speed * dt;
      if (c.x > W) c.x = -c.width * PX;
    }
    for (const m of this.mist) m.tilePositionX += m.speed * dt;
    for (const leaf of this.leaves) {
      leaf.x += leaf.speed * dt;
      leaf.y = leaf.baseY + Math.round(Math.sin(time / 900 + leaf.phase)) * PX;
      if (leaf.x > W + 10) leaf.x = -10;
    }
    if (time > this.nextWag && this.dog.frame.name !== 2) {
      this.dogWag();
      this.nextWag = time + Phaser.Math.Between(7000, 15000);
    }
  }
}

