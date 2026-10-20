import { W, H, WATER_Y, DOCK_Y } from '../core/constants.js';

// Lake at golden hour: sky, far shore, water and the wooden dock.
export function drawScenery(scene) {
  const g = scene.add.graphics();

  // sky
  g.fillGradientStyle(0x7fc4e8, 0x7fc4e8, 0xf6d6a0, 0xf6d6a0, 1);
  g.fillRect(0, 0, W, WATER_Y);
  g.fillStyle(0xfff1c1, 1);
  g.fillCircle(540, 300, 70);
  g.fillStyle(0xfff1c1, 0.25);
  g.fillCircle(540, 300, 100);

  // far hills
  g.fillStyle(0x6f9b78, 1);
  g.fillPoints(hill(WATER_Y, 90, 0.008, 1.3), true);
  g.fillStyle(0x4b7a5a, 1);
  g.fillPoints(hill(WATER_Y, 55, 0.013, 4.1), true);

  // pine trees along the shore
  g.fillStyle(0x2f5a43, 1);
  for (let i = 0; i < 16; i++) {
    const x = 20 + i * 46 + ((i * 37) % 17);
    const h = 40 + ((i * 53) % 35);
    g.fillTriangle(x - h * 0.3, WATER_Y + 2, x + h * 0.3, WATER_Y + 2, x, WATER_Y - h);
  }

  // water
  g.fillGradientStyle(0x4aa3c9, 0x4aa3c9, 0x0f4766, 0x0f4766, 1);
  g.fillRect(0, WATER_Y, W, H - WATER_Y);
  // sun glare on the water
  g.fillStyle(0xfff1c1, 0.18);
  for (let i = 0; i < 6; i++) {
    g.fillRect(540 - 70 + i * 10, WATER_Y + 12 + i * 26, 140 - i * 20, 6);
  }

  addRipples(scene);
  drawDock(scene);
}

function hill(baseY, height, freq, phase) {
  const pts = [{ x: 0, y: baseY }];
  for (let x = 0; x <= W; x += 24) {
    const y = baseY - height * (0.55 + 0.45 * Math.sin(x * freq + phase));
    pts.push({ x, y });
  }
  pts.push({ x: W, y: baseY });
  return pts;
}

function addRipples(scene) {
  for (let i = 0; i < 16; i++) {
    const y = WATER_Y + 40 + Math.random() * (DOCK_Y - WATER_Y - 60);
    const depth = (y - WATER_Y) / (DOCK_Y - WATER_Y);
    const r = scene.add.rectangle(Math.random() * W, y, 30 + depth * 60, 3 + depth * 2, 0xffffff, 0.22);
    scene.tweens.add({
      targets: r,
      x: r.x + 30 + Math.random() * 30,
      alpha: 0.04,
      duration: 2200 + Math.random() * 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}

function drawDock(scene) {
  const g = scene.add.graphics();
  // posts going into the water
  g.fillStyle(0x4a2f17, 1);
  g.fillRect(170, DOCK_Y - 10, 22, 70);
  g.fillRect(528, DOCK_Y - 10, 22, 70);
  // deck
  g.fillStyle(0x9c6a3a, 1);
  g.fillPoints([
    { x: 160, y: DOCK_Y },
    { x: 560, y: DOCK_Y },
    { x: 640, y: H },
    { x: 80, y: H },
  ], true);
  // planks
  g.lineStyle(3, 0x6e4622, 1);
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    const y = DOCK_Y + (H - DOCK_Y) * t;
    g.lineBetween(160 - 80 * t, y, 560 + 80 * t, y);
  }
  g.fillStyle(0xb98450, 1);
  g.fillRect(156, DOCK_Y - 8, 408, 12);
}
