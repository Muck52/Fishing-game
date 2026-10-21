// Wooden UI pieces built from the Treasure Hunters board and button art,
// stretched as nine-slices so their corners stay crisp at any size. Sizes
// are in pixels on the game's one grid.

// A plank-filled board with a carved frame.
export function board(scene, x, y, w, h) {
  return scene.add.nineslice(x, y, 'board', null, w, h, 32, 32, 32, 32);
}

// A small rounded wooden pill, for counters and buttons.
export function pill(scene, x, y, w, h) {
  return scene.add.nineslice(x, y, 'button', 0, w, h, 5, 5, 5, 5);
}
