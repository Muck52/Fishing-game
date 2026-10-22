# Audit: how the art measures up

Every image in the game was measured the same way by `tools/studio/audit.py`
(the numbers are in [audit/audit.json](audit/audit.json); what each one means
is at the top of the script), and looked at side by side in contact sheets
([scenery](audit/scenery.png), [props](audit/props.png),
[characters](audit/characters.png), [fish](audit/fish.png),
[effects](audit/effects.png), [interface](audit/interface.png)) and in the
game at four times of day ([scene-times.png](audit/scene-times.png)).

## Where the art comes from

Of the 103 images, about half are ours (the creatures, Olive, all the fish,
the backpack, journal and effects we drew). The rest come from seven packs:

| Source | What | Fits our rules? |
| --- | --- | --- |
| CraftPix mountain river | sky, mountains, far bank with waterfall, big cloud | **No.** Drawn at 2x and enlarged; alpine peaks; plain darkening, no hue shift |
| Pixel Frog | small clouds, splash, bubbles, coin, boards, buttons | **Partly.** Clouds and boards at 2x; cartoon cloud style; board reads as brick |
| CraftPix fishing | angler, hut, posts, boat, barrel, cattails, water surface, bucket | **Mostly.** 1x, outlined, warm; the closest to our style |
| Reactorcore | lakebed weeds, sand pits, clam | **No.** Very noisy texture (almost half the pixels are lone pixels) |
| ansimuz | underwater light | **No.** Heavy checkerboard dithering; the most saturated thing on screen |
| Amberfall | ripples, drifting branch | Mostly; the branch is half outlined |
| Nelson Yiap | the float | Mostly; half outlined |

## What the measurements say

| | Ours (median) | Packs (median) | What we want |
| --- | --- | --- | --- |
| **Drawn at 2x and enlarged** | 0.25 | up to 0.95 (sky, mountains, clouds, boards) | near 0 everywhere: one pixel grid |
| **Hue shift** (shadows cooler than lights) | 34° | 0–3° for the backdrop | a steady shift everywhere |
| **Lone-pixel noise** | 0.09 | 0.47 (lakebed weeds and sand) | low; texture made of clusters |
| **Checkerboard dither** | 0.01 | 0.24 (underwater light) | sparing, and only on big gradients |
| **Outline on actors** | 0.98 | 1.0 (CraftPix fishing), 0.26–0.37 (branch, float) | 1 on actors, 0 on scenery |

## What's wrong, most visible first

1. **Two pixel sizes on one screen.** The sky, mountains, far bank, clouds,
   the rock shelf under the water and the interface boards are drawn at
   double size and enlarged, so their pixels are twice as big as the angler's,
   Olive's or a fish's. This breaks our first rule and is what most makes the
   scene look assembled rather than drawn.
2. **The wrong mountains.** Snow-capped alpine peaks belong in the Rockies or
   the Alps. Behind a north-woods lake you'd see low, rolling, forested hills
   in blue haze.
3. **Two cloud styles.** Cartoon puffs with flat bottoms (Pixel Frog) next to
   a wispy painted cloud (CraftPix).
4. **No hue shift in the backdrop.** The pack scenery just gets darker in
   shadow; our creatures and fish shade from warm light to cool shadow. Under
   the time-of-day grade the difference shows.
5. **Noisy lakebed and dithered water.** The lakebed plants and sand are
   speckled with lone pixels, and the underwater light is a coarse
   checkerboard. Both fight the fish and the line, which should be what you
   look at.
6. **Banded sky.** The sky is a few hard horizontal bands; at dawn and dusk
   the bands show clearly.
7. **Interface boards read as brick.** The wooden board pattern looks like a
   brick wall, and is drawn at 2x.
8. **Small inconsistencies:** half-outlined float and branch; the underwater
   colour is the most saturated thing on screen, more than any fish.

What already works and should be kept: the hut, dock, boat and angler
(1x, outlined, warm, one light); our creatures and fish; the journal and
backpack; the time-of-day grade and night lights.

## What to redo first

In order of how much each changes the look, cheapest first within a tie:

1. **Sky** at 1x with a smooth, hue-shifted gradient for each time of day,
   and one cloud style, ours.
2. **Distant hills** in place of the alpine peaks: rolling, forested, with
   atmospheric perspective.
3. **Far bank** at 1x: north-woods trees (pines, spruce, birch), granite,
   the waterfall.
4. **Underwater**: a clean depth gradient with soft light shafts, a lakebed
   of sand, gravel and muck in clusters, and our own lake plants.
5. **Interface boards** in our wood material.
6. **Water surface, ripples, splash** in our water material.

Each of these starts as a study on a materials-library test sheet (wood,
water, stone, foliage, sky) before it goes into the game.
