# Next steps

Plan for the next working session on Reel It In.

## Working preferences
- Push every change to GitHub (`main`) as it is made.
- Republish the playable artifact after each change.
- Do not run browser tests or take screenshots unless asked. Viewing art-pack
  sprite sheets to slice and align them is fine.
- Keep token use low: few steps per change, short replies.

## 1. Use ready-made art packs
- Network access must allow `opengameart.org`, `itch.io` and `kenney.nl`.
- The repository is public, so use CC0 (public-domain) packs only, such as
  Kenney's and CC0 packs on OpenGameArt, unless the repo is made private.
  Record each pack's name, author, link and license in `assets/CREDITS.md`.
- Pick packs with a matching 16-bit style. Make the look uniform in code by
  recolouring every image to the game's palette (`src/art/palette.js`).
- Put image files under `assets/art/` in the existing folders and load them in
  `src/scenes/BootScene.js`. Replace the code-drawn art piece by piece; keep
  the fish field-guide sprites (`src/art/FishArt.js`) unless a better match
  is found.
- No PixelLab.

## 2. Use more of Phaser (version 3.80)
- Light2D lighting: the sun as a light source, sprites lit through normal
  maps where the art has them.
- Effects (FX): bloom on the sun and water glints, glow, a displacement
  ripple on the water, vignette.
- Particles: splashes, waterfall mist and spray, drifting pollen and leaves.
- Tilemaps built with the Tiled editor for the shoreline and dock, once
  tilesets from the art packs are in.

## Status
- Done: Zelda-like overworld (ArMM1998) and Kenney Tiny Town packs, recoloured
  on load (`src/art/Packs.js`); far-shore trees and rocks come from them.
- Done: Light2D sun with generated normal maps (`src/art/NormalMaps.js`,
  `src/environment/Lighting.js`); bloom, glow, water displacement and
  vignette (`src/environment/SceneFx.js`); particles
  (`src/environment/Particles.js`, `src/environment/Effects.js`); a Tiled
  map for the west shore and a raft landing (`assets/art/environments/
  shore.json`, `src/environment/Shore.js`).
- Next: tune the look in a browser (light strength, bloom, ripple amount),
  and swap more painted pieces (pier boards, props) for pack art.

## Current scene, for reference
- 16-bit RPG look, late-summer palette, blue menu windows.
- Horizon at 44% of screen height (`WATER_Y` in `src/core/constants.js`).
- Weathered pier turned 180 degrees and raised (`DOCK`, `LIFT` in
  `src/art/SceneryArt.js`), angler seated on its lake-side edge with the
  pole out to his right (`src/player/Player.js`).
