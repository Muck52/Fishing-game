// Interface pieces in the style of classic 16-bit RPG menus: blue gradient
// windows with a silver bevelled border, plus small icons.
import { Painter, mix } from './Painter.js';
import { P } from './palette.js';

export function paintUi(scene) {
  menuWindow(scene, 'panel-hud-l', 52, 15);
  menuWindow(scene, 'panel-hud-r', 64, 15);
  menuWindow(scene, 'panel-card', 150, 178);
  menuWindow(scene, 'panel-menu', 150, 58);
  paintCoin(scene);
  paintFishIcon(scene);
  paintMeter(scene);
}

// A blue window: dark rim, bright bevel, softer inner bevel, then a smooth
// gradient from bright blue at the top to deep navy at the bottom.
function menuWindow(scene, key, w, h) {
  const p = new Painter(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ex = Math.min(x, w - 1 - x);
      const ey = Math.min(y, h - 1 - y);
      const e = Math.min(ex, ey);
      if (ex + ey < 2) continue; // rounded corners
      let c;
      if (e === 0 || ex + ey === 2) c = P.winEdgeDark;
      else if (e === 1) c = P.winEdgeLit;
      else if (e === 2) c = P.winEdge;
      else if (e === 3) c = P.winEdgeDark;
      else c = mix(P.winTop, P.winBottom, (y - 4) / Math.max(1, h - 9));
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
  p.sprite(['..LLLL....L.', '.LLLLLLL.LL.', 'LkLLLLLLLL..', '.LLLLLLL.LL.', '..LLLL....L.'], { L: '#ffffff', k: P.winBottom }, 0, 1);
  p.texture(scene, 'fish-icon');
}

// Vertical tension gauge: a narrow window with a dark well. The top band is
// the danger zone.
function paintMeter(scene) {
  const p = new Painter(12, 108);
  for (let y = 0; y < 108; y++) {
    for (let x = 0; x < 12; x++) {
      const ex = Math.min(x, 11 - x);
      const ey = Math.min(y, 107 - y);
      const e = Math.min(ex, ey);
      if (ex + ey < 2) continue;
      let c = mix(P.winTop, P.winBottom, y / 107);
      if (e === 0 || ex + ey === 2) c = P.winEdgeDark;
      else if (e === 1) c = P.winEdgeLit;
      else if (e === 2) c = P.winEdge;
      if (x >= 3 && x <= 8 && y >= 5 && y <= 102) c = y < 20 ? '#3a1030' : '#080c30';
      p.px(x, y, c);
    }
  }
  for (let y = 20; y < 103; y += 16) p.px(9, y, P.winEdge);
  p.texture(scene, 'meter');
}
