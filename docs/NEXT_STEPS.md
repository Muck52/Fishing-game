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
- Done: the whole scene was redrawn as a side view built from image packs
  (CC0, CC-BY and OGA-BY, see `assets/CREDITS.md`). `tools/build_art.py`
  compiles `assets/source/` into `assets/art/` plus a manifest the game
  loads. Fish come to the bait in an underwater cut-away; particles carry
  splashes, bubbles, motes, waterfall mist and pollen; a displacement
  ripple and a vignette are the only full-screen effects (bloom was
  dropped for speed on phones).
- Next: sound; a day/night tint; more species art; a shop for rods and
  lures (`src/economy`, `src/equipment` are still empty).

## Current scene, for reference
- Portrait 720 px wide. Backdrop at 2x, everything near the angler at 3x
  (`BG`, `FG` in `src/core/constants.js`).
- Waterline at `SURFACE_Y`, angler on the hut's walkway at `DECK_Y`,
  lakebed at `BED_Y`.
