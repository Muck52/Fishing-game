# Next steps

Plan for the next working session on Reel It In.

## Working preferences
- Push every change to GitHub (`main`) as it is made.
- Republish the playable artifact after each change.
- Keep token use low: few steps per change, short replies.

## Art rules
- Use pixel-art packs licensed CC0, CC-BY or OGA-BY (agreed with the owner),
  and record each in `assets/CREDITS.md`. No PixelLab.
- Put the untouched originals in `assets/source/<pack>/`, then cut, turn,
  recolour and animate them in `tools/build_art.py`; never hand-edit
  `assets/art/`.
- Screenshots in a headless browser are fine for checking layout.

## Status
- Done: side view built from image packs; one 360-px pixel grid; one
  master palette and shared outline; baked pixel fonts; the lake follows
  the phone's clock (dawn, day, dusk, night with lit window and fireflies).
  See `docs/ART_DIRECTION.md` for the rules every new asset must follow.
- Next: sound; more species art; a shop for rods and lures
  (`src/economy`, `src/equipment` are still empty); small daily reasons to
  open the game (a fish of the day, weather).

## Current scene, for reference
- Portrait canvas 360 px wide, every sprite at 1x (`src/core/constants.js`).
- Waterline at `SURFACE_Y`, angler on the hut's walkway at `DECK_Y`,
  lakebed at `BED_Y`.
