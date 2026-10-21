# Reel It In – Fishing Game (Mobile)

A cozy pixel-art fishing game for phones, built with [Phaser 3](https://phaser.io).

It's late September on Loon Lake, a remote lake in the northern forest. Fog lifts off the water, the tamaracks have turned gold, and the wildlife goes about its morning: an eagle on a dead snag, a loon diving, a heron in the reeds, deer and moose at the far shore, geese heading south. Every catch goes into your field journal.

The scene is a side view of the lake: snowy peaks and a waterfall on the far bank, a fishing hut on stilts, and a cut-away of the water where you can watch the fish come to your bait. All of it is pixel art from free art packs (see `assets/CREDITS.md`).

## Art pipeline
The original packs live in `assets/source/`. `tools/build_art.py` (Python + Pillow) compiles them into the sprite sheets in `assets/art/` and writes `assets/art/manifest.json`, which the game reads at start-up to load every texture. After changing anything in `assets/source/`, run:

```
python3 tools/build_art.py
```

## How to play
1. **Swipe up** to cast. A longer swipe casts farther, where rarer fish bite.
2. Watch a fish come to the bait. Small nibbles are fake-outs; tapping during one scares the fish.
3. When the float goes under and **!** appears, **tap** to hook the fish.
4. **Hold** to reel. Watch the tension meter and **let go** before it hits red, or the line snaps.

Progress (coins and species found) is saved in the browser.

## Run it locally
The game uses JavaScript modules, so it has to be served by a web server rather than opened as a file:

```
python3 -m http.server 8000
```

Then open http://localhost:8000 in a browser (use the phone-sized view in your browser's dev tools).

## Folder structure

### `assets/` – everything the player sees and hears
- `source/` – the original art packs, untouched
- `art/fish/` – fish sprites and models
- `art/environments/` – lakes, rivers, ocean, docks, backgrounds, skies
- `art/characters/` – the player character and NPCs
- `art/equipment/` – rods, reels, lines, lures, bait, boats
- `art/ui/` – buttons, icons, menus, HUD elements
- `art/effects/` – splashes, ripples, bubbles, particles
- `audio/music/` – background music tracks
- `audio/sfx/` – casting, reeling, splashes, catch sounds, UI clicks
- `audio/ambient/` – water, wind, birds, rain
- `fonts/` – game fonts
- `animations/` – casting, reeling, fish fighting, and so on

### `src/` – game code
- `core/` – layout, draw order and text styles, and the asset loader that reads the art manifest
- `wildlife/` – the animals and their behavior
- `scenes/` – main menu, fishing spot, shop, map, aquarium/collection screens
- `player/` – player stats and controls
- `fishing/` – casting, bobber, bite detection, hooking, reeling and line tension
- `fish/` – fish behavior and AI, spawning, rarity, size and weight
- `equipment/` – rods, reels, lures, bait and upgrades
- `environment/` – water, weather, day/night cycle, seasons
- `ui/` – HUD, menus, popups, the tension meter
- `inventory/` – caught fish, gear and items
- `economy/` – coins, shop, selling fish
- `progression/` – XP, levels, unlocks, achievements
- `quests/` – challenges, tournaments, daily tasks
- `input/` – touch controls, swipe to cast, tap/hold to reel, tilt
- `audio/` – sound and music playback
- `save/` – saving and loading progress
- `utils/` – shared helper functions

### `data/` – game content definitions (stats and config)
- `fish/` – each fish species: rarity, size range, locations, value
- `locations/` – fishing spots and which fish live there
- `equipment/` – gear stats and prices
- `quests/` – quest and challenge definitions

### Other
- `platform/ios/`, `platform/android/` – phone-specific build settings and icons
- `tests/` – automated tests
- `docs/` – design notes and the game design document
- `tools/` – helper scripts (asset conversion, data editors)
