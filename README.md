# Fishing Game (Mobile)

## Folder structure

### `assets/` – everything the player sees and hears
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
- `core/` – game loop, startup, global game state
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
