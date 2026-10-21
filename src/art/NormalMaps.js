// Normal maps for Phaser's Light2D pipeline, worked out from each painted
// texture: brighter pixels read as raised and every shape bevels down at its
// silhouette, so the low sun catches the edges turned toward it.

// Things that give off light, or are only light, stay out of the lighting.
export const UNLIT = /^(sky|sun|sun-glow|sun-rays|cloud-\d|mist-.*|sparkle|steam|ripple|wake|pack-.*|fish.*|ui-.*|__.*)$/;

const STRENGTH = 2;

export function addNormalMaps(scene) {
  if (scene.sys.game.renderer.type !== Phaser.WEBGL) return;
  for (const key of scene.textures.getTextureKeys()) {
    if (UNLIT.test(key)) continue;
    const tex = scene.textures.get(key);
    if (tex.dataSource.length) continue;
    const img = tex.getSourceImage();
    const { width: w, height: h } = img;
    if (!w || !h) continue;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, w, h).data;
    const height = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const a = d[i * 4 + 3] / 255;
      height[i] = a * (0.6 + (0.4 * (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11)) / 255);
    }
    // past the canvas edge, a layer carries on as it was
    const at = (x, y) => height[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
    const out = ctx.createImageData(w, h);
    const o = out.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = -(at(x + 1, y) - at(x - 1, y)) * STRENGTH;
        const ny = (at(x, y + 1) - at(x, y - 1)) * STRENGTH; // y up, as the shader expects
        const len = Math.hypot(nx, ny, 1);
        const i = (y * w + x) * 4;
        o[i] = (nx / len) * 127.5 + 127.5;
        o[i + 1] = (ny / len) * 127.5 + 127.5;
        o[i + 2] = (1 / len) * 127.5 + 127.5;
        o[i + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
    tex.setDataSource(canvas);
  }
}
