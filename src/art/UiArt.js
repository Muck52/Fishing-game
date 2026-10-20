// Wooden signboards, parchment cards and small icons for the interface.
import { Painter, mulberry32, shade, noise } from './Painter.js';
import { P } from './palette.js';

export function paintUi(scene) {
  const rng = mulberry32(7);
  panel(scene, 'panel-hud-l', 52, 15, 'wood', rng);
  panel(scene, 'panel-hud-r', 64, 15, 'wood', rng);
  panel(scene, 'panel-card', 150, 178, 'paper', rng);
  panel(scene, 'panel-menu', 150, 58, 'paper', rng);
  paintCoin(scene);
  paintFishIcon(scene);
  paintMeter(scene);
}

function panel(scene, key, w, h, style, rng) {
  const p = new Painter(w, h);
  const wood = style === 'wood';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ex = Math.min(x, w - 1 - x);
      const ey = Math.min(y, h - 1 - y);
      if (ex + ey < 2) continue; // rounded corners
      let c;
      if (ex === 0 || ey === 0 || ex + ey === 2) c = wood ? P.woodGap : P.parchmentEdge;
      else if (ey === 1 && y < h / 2) c = wood ? P.woodLit : P.parchmentLit;
      else if (ey === 1 || ex === 1) c = wood ? P.woodDark : P.parchmentDark;
      else if (wood) c = (y - 2) % 5 === 4 ? P.woodDark : shade(P.wood, (noise(Math.floor(x / 3), y, 90) - 0.5) * 0.5);
      else if (ex === 3 || ey === 3) c = (x + y) % 2 ? P.parchmentDark : P.parchment;
      else c = shade(P.parchment, (noise(x, y, 91) - 0.5) * 0.25 - (ex < 8 || ey < 8 ? 0.08 : 0));
      p.px(x, y, c);
    }
  }
  p.texture(scene, key);
}

function paintCoin(scene) {
  const p = new Painter(9, 9);
  p.ellipse(4, 4, 3.6, 3.6, '#a8741f');
  p.ellipse(4, 4, 2.6, 2.6, '#e8b83a');
  p.px(3, 2, '#fbe08a');
  p.px(2, 3, '#fbe08a');
  p.vline(4, 3, 5, '#a8741f');
  p.texture(scene, 'coin');
}

function paintFishIcon(scene) {
  const p = new Painter(12, 7);
  p.sprite(['..LLLL....L.', '.LLLLLLL.LL.', 'LkLLLLLLLL..', '.LLLLLLL.LL.', '..LLLL....L.'], { L: P.parchment, k: P.ink }, 0, 1);
  p.texture(scene, 'fish-icon');
}

// Vertical tension gauge set in a wooden frame. The top band is the danger zone.
function paintMeter(scene) {
  const p = new Painter(12, 108);
  for (let y = 0; y < 108; y++) {
    for (let x = 0; x < 12; x++) {
      const ex = Math.min(x, 11 - x);
      const ey = Math.min(y, 107 - y);
      if (ex + ey < 2) continue;
      let c = shade(P.wood, (noise(x, Math.floor(y / 3), 92) - 0.5) * 0.5);
      if (ex === 0 || ey === 0 || ex + ey === 2) c = P.woodGap;
      else if (ex === 1) c = x < 6 ? P.woodLit : P.woodDark;
      else if (x >= 3 && x <= 8 && y >= 5 && y <= 102) c = y < 20 ? '#43262a' : '#1e2b2c';
      p.px(x, y, c);
    }
  }
  for (let y = 20; y < 103; y += 16) p.px(9, y, P.woodGap);
  p.texture(scene, 'meter');
}
