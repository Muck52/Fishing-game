// Wooden UI pieces built from the Treasure Hunters board and button art,
// stretched as nine-slices so corners stay crisp at any size.

// A plank-filled board with a carved frame. w and h are in art pixels.
export function board(scene, x, y, w, h, scale = 3) {
  return scene.add.nineslice(x, y, 'board', null, w, h, 32, 32, 32, 32).setScale(scale);
}

// A small rounded wooden pill, for counters and buttons.
export function pill(scene, x, y, w, h, scale = 3) {
  return scene.add.nineslice(x, y, 'button', 0, w, h, 5, 5, 5, 5).setScale(scale);
}
