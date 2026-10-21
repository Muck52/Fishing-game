# Art direction

Reel It In is meant to be the game you open without thinking, the way you
check the weather: a minute at the lake, a cast or two, a fish for the
journal, and away. The art serves that. It should be calm to look at, always
a little alive, and different enough each time you open it that the lake
feels like a place rather than a menu.

## What we take from the games we admire

No art from these games is used or traced; their files are copyrighted. What
we borrow is the thinking behind them.

| Game | What it does well | How Reel It In applies it |
| --- | --- | --- |
| Stardew Valley | Warm, saturated colour; dark warm outlines instead of black; wooden UI frames; the calendar and clock give every visit a mood | Warm plum-brown outline (`#25131a`) on every actor and every letter; wooden boards for all panels; the lake follows the phone's clock |
| Dave the Diver | Pixel sprites over an underwater view that grades from bright to dark with depth; light shafts; you watch fish before you catch them | The underwater cut-away, light shafts, and fish tinted blue-green the deeper they swim (`depthTint`); the hooked fish comes to the bait in full view |
| Cast n Chill | Lo-fi, cozy idle fishing; a scene that is pleasant to leave running; gentle, constant motion | Slow ambient loops everywhere (waterfall, weeds, clouds, minnows, drifting branch); no timers or pressure outside a bite |
| Enter the Gungeon | Strict, readable pixel effects; chunky particles; strong silhouettes on actors against busier backgrounds | One-pixel particles, outlined actors over an un-outlined backdrop, short punchy splashes and screen shake on a snapped line |
| Animal Well | A tiny pixel grid held absolutely; dithered light and glow on dark scenes; mood from lighting rather than detail | The whole game renders on a 360-pixel-wide grid; glows are dithered sprites, not blurs; night is a colour grade plus a few lights |

## The rules

1. **One pixel grid.** The game is drawn on a 360 x 640–800 canvas and scaled
   up with hard edges (`src/core/constants.js`, `src/main.js`). Every sprite
   is drawn at 1x on that grid. Nothing is scaled, squashed or rotated in
   play. Things that bend (weeds, cattails, fish tails) have baked animation
   frames that shift whole pixels instead (`sway()` and `fish()` in
   `tools/build_art.py`).
   *Exception:* the fish portrait on the journal card is drawn at 2x, like a
   close-up in a field guide.
2. **One palette.** Every image is recoloured to one master palette of 76
   colours (`docs/palette.png`, also listed in `assets/art/manifest.json`).
   It is the 56 colours that best cover all the packs together, plus a few
   key colours and the interface art's own shades. This is what makes art
   from eleven different packs look like one game.
3. **Outlines say "this moves."** Characters, animals, fish, the boat, the
   hut and props carry the shared dark outline. The backdrop, water and
   lakebed have none, so actors always read in front of scenery.
4. **Light from above and behind.** Sun shafts slant down into the water,
   the surface twinkles, and depth darkens and cools everything. Glows are
   dithered (`glow`, `firefly`, `light-streak`), never blurred.
5. **Distance is darker and bluer.** The background rock shelf, the posts
   below the waterline and deep fish are pushed toward the water's colour.
6. **Motion is slow and stepped.** Ambient loops run at 3–8 frames a second;
   floating UI moves in whole-pixel steps (`ease: 'Stepped'`). Fast motion is
   saved for the moments that matter: the bite, the splash, the landing.
7. **Lettering is part of the art.** Two CC0 Kenney fonts are baked into
   bitmap fonts at their native 16px with the same outline as the sprites
   (`fonts()` in the build). Text is tinted, never resized off the grid.
8. **The hour sets the mood.** `src/environment/Daylight.js` multiplies the
   scene by a colour for the time on the phone: rose at dawn, clear by day,
   gold then mauve at dusk, deep blue at night. After dark the hut window
   glows, its light lies on the water and fireflies come out over the reeds.
   The interface sits above the grade so it always reads the same.

## How each piece fits

| Piece | Source pack | Size on grid | Outline | Motion |
| --- | --- | --- | --- | --- |
| Sky, peaks, far bank | CraftPix mountain river | 576 x 324, 1x, cropped to 360 | none | clouds drift; waterfall and stream roll 4 frames |
| Underwater, shelf, lakebed | built in `build_art.py` from the palette | full width | none | displacement wobble; shafts pulse |
| Weeds, sand, clam | Reactorcore aquatic | 1x | none | 4-frame sway |
| Hut, posts, boat, barrel, cattails | CraftPix fishing | 1x | shared | boat bobs 1px; cattails sway |
| Angler | CraftPix fishing (turned, line erased) | 48 x 48 frames | shared | idle, fish, reel, land |
| Fish species | the game's own field-guide paintings | 1x (card 2x) | shared | 4-frame tail swish; depth tint |
| Minnows | ansimuz underwater | 1x | shared | 4-frame swim, school |
| Deer, fox, hare, bear | ScratchIO animals | 1x | shared | walk and idle cycles |
| Gulls, ducks, eagle | MoikMellah, aroachi, Spring Spring | 1x | shared | flap cycles |
| Float, branch, ripples | Nelson Yiap, Amberfall | 1x | shared | bob cycles |
| Splash, bubbles, coins, boards | Pixel Frog (Treasure Hunters) | 1x | own | splash 5 frames; coin spin |
| Lettering | Kenney Pixel and Kenney Mini | 16px glyphs, 1x or 2x | shared | stepped bobbing |

## Changing the art

All art goes through `tools/build_art.py`. Put an untouched pack in
`assets/source/`, cut and animate it in the script, and run
`python3 tools/build_art.py`. The palette pass at the end recolours it with
everything else. Hand-editing in a free pixel editor such as LibreSprite or
Piskel is fine for new source art; save it to `assets/source/` and let the
build do the rest.
