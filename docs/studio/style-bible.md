# Style bible (draft)

The rules every piece of art in Reel It In follows. Built from the
[audit](audit.md) and the research
([materials](research/materials.md), [the real lake](research/north-woods-lake.md),
[other games](research/cohesive-games.md)). **Draft:** each section becomes
settled once we've tried it in a study and you've agreed. Settled rules
are marked ✔; the rest are proposals.

## 1. Vision

A quiet summer evening on a real north-woods lake, the kind you'd find in
northern Minnesota, Wisconsin or Michigan, drawn as warm, readable pixel
art. Three pillars:

- **A real place.** White pines, granite, loons, the light at 9 pm in June.
  If it wouldn't be on a north-woods lake, it isn't in the game.
- **Calm, then the catch.** The scene is quiet and soft; the fish, the line
  and the creatures are the clearest things on screen.
- **Living light.** The lake follows the time of day on your phone.

## 2. The canvas ✔

- 360 pixels wide, drawn at 1x, scaled up with hard edges.
- **One pixel grid:** nothing is drawn at 2x and enlarged, nothing is scaled
  in the game.
- Rotation only through RotSprite, and only where a pose truly needs a tilt.

## 3. Light

- **One key light, from the upper left**, warm. Lit faces take the warm end
  of a ramp, shadows the cool end. ✔ for creatures; to extend to everything.
- **Night:** the moon is a cool, weak key light; the hut's window and
  lanterns become warm second lights, drawn in palette colours.
- **Underwater:** light comes from above, in slanting shafts that fade with
  depth; caustics only in the shallows.

## 4. Colour

- **Every material gets a ramp of 4–6 shades,** hue-shifted about 15–20° a
  step (shadows toward blue-violet, lights toward yellow), most saturated
  in the middle. ✔ for creatures (the kit's `shift()`).
- **Metal is the exception:** cold, pale lights; warm, deep shadows.
- **Ramps are shared:** dock wood, bark and cattail heads share a brown;
  distant hills and far trees reuse the sky's colours.
- **Saturation is a budget:** the scenery stays soft; the strongest colours
  are kept for the fish, the creatures and the interface's accents.
- **The palette is fixed** in `tools/palette.json`. ✔

## 5. Lines and edges ✔

- Actors (creatures, fish, the angler, props that move) wear the plum-black
  outline `#25131a`, with a selective outline along the lit top of light
  parts.
- Scenery has no outline.
- Scenery is never darker than the outline, nor more saturated than the
  creatures in front of it.
- No anti-aliasing on the outside of a sprite; inside, only by hand.

## 6. Depth, in bands

From back to front, each band farther away is lighter, less saturated,
nearer the sky's hue, and less detailed:

1. **Sky:** a smooth gradient for each time of day, varied band heights,
   ordered dither at most. One cloud style, ours: spheres on a flat base,
   low contrast.
2. **Distant hills:** low, rounded, forested ridges in two or three bands of
   blue haze, a haze band at their foot. **No snowy peaks.**
3. **Far bank:** north-woods trees (white pine above the rest, spruce and fir
   spires, birch clumps, aspen), pink-grey granite, the waterfall. Texture in
   1–2 px clusters.
4. **The lake surface:** reflections of the far bank, flipped, shortened,
   darker, broken by horizontal gaps.
5. **The dock, hut and actors:** full detail and contrast.
6. **Underwater:** its own haze, deepening and cooling with depth, reds
   draining out of things as they go deeper. Sand, cobble and weed beds in
   the shallows, a drop-off, dark muck deep down; plants stop at about 15–20
   ft.

## 7. Texture

- **By suggestion:** a few planks show grain, a few stones are shaded, a few
  scales and tufts of fur; calm areas inside, detail at the edges.
- **Clusters, not specks:** 2–4 px clusters near, 1–2 px far; no lone pixels
  except deliberate glints. The audit measures this (`noise`).
- **No noise dither.** Ordered dither for big gradients only; rough dither
  only for foam, sand sparkle and mud.
- Never two busy textures side by side.

## 8. Materials

Each material gets a ramp, a texture rule and a test sheet in the materials
library (to build next): water, wood (fresh and weathered silver-grey),
bark (white pine, red pine, birch), stone (pink granite, grey gneiss, dark
basalt), conifer needles, leaves, grass and reeds, sky, clouds, distant
hills, sand, cobble, muck, snow and ice, fur, feathers, fish scales,
cloth, metal (aluminium boats, galvanized dock pipe), rope.

## 9. Creatures and fish ✔

As in [docs/characters/README.md](../characters/README.md) and the fish
section of the art direction: real proportions on one scale, silhouette
first, one signature feature, birds seen from below, real gaits, the
finishing passes.

## 10. Animation

- **Frame budget:** idle and swim loops 4–8 frames at 4–10 fps; walks 8.
- **Smears** only on fast moments: the cast, the strike, the splash.
- **Secondary motion:** every creature gets at least one (tail, ears, fins).
- **Water** moves by rule: glints at most 1 px a frame, each ripple one
  chunk, underwater things sway in a sine wave.
- **Waterfall:** bright mouth, darkening bands, particle splash; consider
  colour cycling.

## 11. Interface

- Panels made from the world's own wood ramp.
- The font on the same grid (Monogram ✔).
- Accents from the same accent ramps as the creatures.
- Not tinted by the time of day ✔.

## 12. Outside art

Every pack asset is tracked as **pack-original → recoloured → redrawn →
approved**. A half-restyled game looks worse than either style, so the plan
is to finish the restyle, not stop halfway.

## Open questions for you

These change what we draw, so they're yours to call:

1. **What kind of lake?** A *clear* lake (green-teal water, you can see the
   bottom) or a *tannin* lake (root-beer brown water, amber shallows, very
   dark and mirror-like)? Both are typical up north; clear reads better for
   watching fish.
2. **The hut.** A fishing hut on stilts isn't really a north-woods thing (it's
   more Gulf Coast). Keep it as is, keep it but restyle it (gable roof,
   silver-grey wood, barn-red or green trim, dock on pipe legs), or swap it
   for a weathered boathouse on a crib at the end of the dock?
3. **Seasons.** Stay in summer, or follow the real calendar the way the light
   follows the clock (gold aspen in October, the hare turning white, snow)?
4. **Time of day.** Today one tint is laid over everything. The research
   points to a palette for each time of day (dawn, day, golden hour, dusk,
   night) that each material is drawn in, so the light changes the colours
   rather than tinting them. It's more work but a big step in quality.
5. **New wildlife.** The common loon is *the* bird of these lakes (Minnesota's
   state bird). Add it, and others (heron, kingfisher, osprey, painted
   turtle, beaver)?
