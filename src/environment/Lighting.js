import { PX, DEPTH } from '../core/constants.js';
import { SUN } from '../art/SceneryArt.js';
import { UNLIT } from '../art/NormalMaps.js';

const AMBIENT = 0xeceef6; // cool sky light that fills the shadows
const SUN_LIGHT = 0xffe2a8;
const SUN_INTENSITY = 0.7;

// The sun as a Light2D light. Every world sprite, image and tile layer added
// to the scene is lit by it (through its normal map), apart from the sky and
// the things that give off light themselves. Needs WebGL; on the canvas
// renderer the scene is simply drawn unlit.
export class Lighting {
  constructor(scene) {
    this.on = scene.sys.game.renderer.type === Phaser.WEBGL;
    if (!this.on) return;
    scene.lights.enable().setAmbientColor(AMBIENT);
    this.sun = scene.lights.addLight(SUN.x * PX, SUN.y * PX, 2200, SUN_LIGHT, SUN_INTENSITY);
    // depth is set after an object is added, so sort them out before drawing
    this.pending = [];
    const added = (obj) => this.pending.push(obj);
    scene.sys.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, added);
    scene.sys.events.on(Phaser.Scenes.Events.POST_UPDATE, () => this.flush());
    scene.sys.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.sys.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, added));
  }

  flush() {
    for (const obj of this.pending) {
      const key = obj.texture?.key ?? obj.tileset?.[0]?.image?.key;
      if (!obj.scene || !key || obj.depth >= DEPTH.UI || UNLIT.test(key)) continue;
      if (obj.type === 'Image' || obj.type === 'Sprite' || obj.type === 'TileSprite' || obj.type === 'TilemapLayer') obj.setPipeline('Light2D');
    }
    this.pending.length = 0;
  }

  // A cloud over the sun (dim near 0.3) takes most of its light away.
  update(dim) {
    if (this.on) this.sun.setIntensity(SUN_INTENSITY * (0.3 + 0.7 * dim));
  }
}
