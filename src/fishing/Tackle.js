import { SURFACE_Y, DEPTH, INK, label } from '../core/constants.js';

// Draws a line as chunky pixels snapped to a grid.
export function pixelLine(g, points, color, alpha = 1, size = 1) {
  const seen = new Set();
  g.fillStyle(color, alpha);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (size * 0.5)));
    for (let s = 0; s <= steps; s++) {
      const gx = Math.floor((a.x + (b.x - a.x) * (s / steps)) / size);
      const gy = Math.floor((a.y + (b.y - a.y) * (s / steps)) / size);
      const k = gx * 100000 + gy;
      if (seen.has(k)) continue;
      seen.add(k);
      g.fillRect(gx * size, gy * size, size, size);
    }
  }
}

const curve = (a, c, b, n = 24) => new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(a.x, a.y), new Phaser.Math.Vector2(c.x, c.y), new Phaser.Math.Vector2(b.x, b.y)).getPoints(n);

// The float, the hook and the line between them and the rod. The float
// rides the surface; below it the line runs down to a baited hook.
export class Tackle {
  constructor(scene) {
    this.scene = scene;
    this.bobber = scene.add.sprite(0, 0, 'bobber', 0).setOrigin(0.5, 0.62).setDepth(DEPTH.BOBBER).setVisible(false);
    this.hook = scene.add.image(0, 0, 'hook').setOrigin(0.4, 0).setDepth(DEPTH.FISH + 0.2).setVisible(false);
    this.alert = label(scene, 0, 0, '!', { font: 'head', size: 2, color: INK.gold }).setOrigin(0.5, 1).setDepth(DEPTH.SPLASH + 1).setVisible(false);
    this.line = scene.add.graphics().setDepth(DEPTH.LINE);
    this.underLine = scene.add.graphics().setDepth(DEPTH.FISH + 0.1);
    this.x = 0;
    this.y = 0;
    this.hookY = 0;
    this.dip = 0; // how far a nibble pulls the float under, in px
  }

  get visible() {
    return this.bobber.visible;
  }

  show(on) {
    this.bobber.setVisible(on);
    this.hook.setVisible(on);
    if (!on) {
      this.alert.setVisible(false);
      this.line.clear();
      this.underLine.clear();
    }
  }

  // Bring up the "!" over the float.
  shout(on) {
    this.alert.setVisible(on);
    this.scene.tweens.killTweensOf(this.alert);
    if (on) {
      this.alert.setAlpha(0);
      this.scene.tweens.add({ targets: this.alert, alpha: 1, duration: 60, yoyo: true, repeat: 2 });
    }
  }

  // Lines from the rod tip to the float, and from the float down to `end`
  // (the hook, or the mouth of a hooked fish).
  draw(tip, time, { tension = 0, flying = false, end = null } = {}) {
    const fy = flying ? this.y : SURFACE_Y + Math.round(Math.sin(time / 500) + this.dip);
    this.bobber.setPosition(this.x, fy);
    this.alert.setPosition(this.x, fy - 13 + Math.round(Math.sin(time / 120) * 2));
    const g = this.line;
    g.clear();
    const sag = flying ? 0 : (1 - tension) * 25;
    const mid = { x: (tip.x + this.x) / 2, y: Math.max(tip.y, fy) - 5 + sag };
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xf4f1e6),
      Phaser.Display.Color.ValueToColor(0xff5a40),
      100,
      Math.round(tension * 100),
    );
    pixelLine(g, curve(tip, mid, { x: this.x, y: fy - 3 }), Phaser.Display.Color.GetColor(color.r, color.g, color.b), 0.9);

    const u = this.underLine;
    u.clear();
    if (flying) {
      this.hook.setVisible(false);
      return;
    }
    const hookEnd = end || { x: this.x + Math.round(Math.sin(time / 1300) * 3), y: this.hookY };
    pixelLine(u, curve({ x: this.x, y: fy + 2 }, { x: (this.x + hookEnd.x) / 2, y: (fy + hookEnd.y) / 2 }, hookEnd, 16), 0xdfe8e4, 0.55);
    this.hook.setVisible(!end).setPosition(hookEnd.x, hookEnd.y);
  }
}
