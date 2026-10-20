// Wooden signboards, parchment cards and small icons for the interface.
import { Painter, mulberry32 } from './Painter.js';
import { P } from './palette.js';

export function paintUi(scene) {
  const rng = mulberry32(7);
  panel(scene, 'panel-hud-l', 70, 20, 'wood', rng);
  panel(scene, 'panel-hud-r', 86, 20, 'wood', rng);
  panel(scene, 'panel-card', 200, 236, 'paper', rng);
  panel(scene, 'panel-menu', 200, 78, 'paper', rng);
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
      else if (wood) c = (y - 2) % 6 === 5 ? P.woodDark : rng() < 0.04 ? P.woodDark : P.wood;
      else if (ex === 4 || ey === 4) c = (x + y) % 2 ? P.parchmentDark : P.parchment;
      else c = rng() < 0.03 ? P.parchmentDark : P.parchment;
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
  const p = new Painter(16, 144);
  for (let y = 0; y < 144; y++) {
    for (let x = 0; x < 16; x++) {
      const ex = Math.min(x, 15 - x);
      const ey = Math.min(y, 143 - y);
      if (ex + ey < 2) continue;
      let c = P.wood;
      if (ex === 0 || ey === 0 || ex + ey === 2) c = P.woodGap;
      else if (ex === 1) c = x < 8 ? P.woodLit : P.woodDark;
      else if (x >= 4 && x <= 11 && y >= 6 && y <= 137) c = y < 26 ? '#43262a' : '#1e2b2c';
      p.px(x, y, c);
    }
  }
  for (let y = 26; y < 138; y += 22) p.hline(12, 13, y, P.woodGap);
  p.texture(scene, 'meter');
}
