# The creatures

Olive and every animal at the lake are drawn by the game's own scripts in
`tools/characters/`, one file each, all built with one kit (`kit.py`). They
replaced the deer, fox, hare, bear, gulls, sparrows, ducks, eagle and minnows
that came from five different art packs, which each had their own scale,
outline and colours.

![Everyone at game size](lineup.png)

## The rules they share

These came out of building Olive, the fish (`tools/fish_art.py`), the
journal and the backpack, and from the research below.

1. **Side-on, facing left, one light from above.** A lighter band along the
   back, shade underneath, and the far legs (or the far wing) a step darker
   than the near ones. The game turns each creature to face the way it goes.
2. **One palette, one outline.** Every colour is from the master palette
   (`tools/palette.json`; the kit refuses anything else), and every creature
   wears the shared outline, `#25131a`, put round it after drawing. They
   are saved exactly as drawn, never recoloured afterwards.
3. **Real animals, true scale** (study 13). Sizes come from the real
   animal measured against the angler (39 pixels for 5 ft 10: 0.22 pixels
   to the centimetre), and nothing is drawn up: Olive comes to his thigh,
   the deer's ears about to his eyes, the hare is a small brown shape, the
   sparrow a few pixels. Each is drawn again at its size from its shapes
   (factors in `scale.py`). Fish are their true length, no less than 4
   pixels.
4. **What makes the species, first.** The silhouette and one or two marks
   you'd know it by: the fox's black stockings and white-tipped brush, the
   doe's white throat and big ears, the black bear's straight face, big
   ears and rump higher than its shoulders (not a grizzly's hump), the
   hare's long black-tipped ears and big hind feet, the eagle's white head
   and tail, the drake's green head and white collar.
5. **A body drawing, legs from joints.** The body and head are one pixel
   drawing; the legs are drawn every frame through their joints (shoulder,
   wrist, paw; hip, hock, paw), so a gait can pose them freely. The hare,
   whose whole body changes shape through a hop, is drawn pose by pose.
6. **Real gaits, readable at this size.** Walks are four-beat, three feet
   down at a time (Olive, the doe); the fox trots, diagonal legs together,
   which is also what reads best at small sizes; the bear ambles, the legs
   on one side swinging nearly together; the hare's hind feet land ahead of
   its front feet. The body dips or lifts a pixel as the legs pass under it.
7. **Birds fly in profile** (study 9, version A), seen side-on like the
   animals on the beach: the wings beat up and down beside the body, four
   frames to a beat (up, level, down, level; the level frame morphed
   halfway between the two), drawn from shapes in `birds.py` in study 8's
   look, with study 9b's detail: feather bands on each wing, field marks,
   feather texture. Gulls and the eagle beat and glide on level wings; ducks beat
   fast and never glide; sparrows fly in bounds, a burst of beats then
   wings shut. The loon swims low and dives. At rest: the gull stands and
   the eagle perches on the sand, the sparrow on a cattail, the drake and
   hen paddle the shallows (`gull-stand`, `eagle-perch`, `sparrow-perch`,
   `mallard-swim`).

   (Before study 9 the birds were seen from below, as described next; the
   kit's wing tools are kept for reference.)

   Each wing is built like a real one (`feathered_wing` in the kit): an
   arm from shoulder to wrist and a hand from wrist to tip, the bones along
   the leading edge and the feathers trailing behind, coloured in bands as
   on the bird (lit marginal coverts, coverts, then secondaries along the
   arm and primaries along the hand, a gull's black tips with their white
   mirror, the mallard's blue speculum edged in white, an eagle's spread
   fingers on a broad, blunt wing). The wingbeat follows Marey's
   chronophotographs of gulls (1887): a downstroke on fully spread wings,
   then an upstroke with the wrist bent and the hand swept back so the wing
   slips up through the air. Wings are drawn four times larger and brought
   down to the grid by vote (`supersampled`), so their slanted and curved
   edges come out as clean, even steps.
8. **Finished the same way.** Every frame goes through the kit's
   finishing passes (`finish()` in `kit.py`):
   - *cleanup*: outline pixels left touching nothing go, and a lone pixel
     of one colour in a patch of another takes its surroundings' colour
     (eyes, noses and the like are protected);
   - *hue-shifted light and shade*: the top pixel of each run of colour,
     where it meets the sky, takes a light step of that colour warmed
     toward yellow, and the bottom pixel a shade cooled toward blue-violet,
     so forms read as round and lit from above, and shadows look like the
     same material in shade rather than the colour with black mixed in;
   - *selective outline*: along the top edge of light-coloured parts
     (white fur, a gull, a doe's sunlit back) the outline takes a deep,
     cool shade of the colour inside it instead of the plum-black, so
     light forms aren't hemmed in where the light falls; underneath and
     round dark parts it stays the shared outline.

   Tilted frames (Olive's leap) are turned the **RotSprite** way: blown up
   eight times with Scale2x, which keeps lines and curves clean, turned,
   and brought back down by vote, so a small sprite keeps its shape.
   The new light, shade and outline steps join the palette's creature
   shades in `tools/palette.json`.
9. **Moving with the feet.** A creature moves only when its walk advances a
   frame, by a step that comes from its gait, so its feet don't slide.

## Editing in Pixelorama

Since studies 8 and 9, the land animals and the birds are drawn from shapes
(`land.py`, `birds.py`) and have no Pixelorama projects; the touch-ups
below belonged to the old drawings. A creature
with a [Pixelorama](https://orama-interactive.itch.io/pixelorama)
project has it at `assets/source/pixelorama/<name>.pxo`, kept in step by the build:

- a locked **drawn** layer: what its script draws, rewritten each build;
- a **touch-ups** layer for hand edits, kept between builds and laid over
  the drawing (paint `#ff00ff` to erase a drawn pixel);
- one frame per animation frame, a tag per animation (named as in the
  game), and the game's palette as the project palette ("Reel It In").

Open a project, paint on touch-ups, save, and rebuild the art.
`tools/characters/pixelorama.py` drives Pixelorama itself, headless:
`verify` has it open every project and export it, and checks the export
matches the game's sheet pixel for pixel; `export` exports one; `paint` and
`clear` change touch-ups from the command line.

Touch-ups so far: the fox's eyes are amber, as a red fox's are; the hare
has a pale ring of fur round its eye.

## Who's who

| Creature | Real size → on the grid | Look | Animations |
| --- | --- | --- | --- |
| [Olive](olive.md) | 18 in at the shoulder, drawn 1.6x → 40 x 30 frame | black and white husky / cattle dog, coral bandana | idle, walk, run, leap, swim, shake |
| White-tailed doe (`land.py`) | 36 in at the shoulder | tawny, white throat and muzzle band, white belly, big ears, slender legs, dark hooves | walk (four-beat), idle (ear flick, lowers her head to drink, tail flick) |
| White-tailed buck (`land.py`) | as the doe, heavier neck | darker coat, hardened antlers curving forward, spaced tines | walk, idle (drinks, his head and antlers turned down together) |
| Red fox (`land.py`) | 15 in, drawn 1.5x | rusty, white chin to chest and belly, black stockings and ear backs, white-tipped brush | walk (the trot), idle (ear flick, sniffing the ground, tail swish) |
| Snowshoe hare (`land.py`) | sits 11 in, drawn 1.6x | brown, white belly, tail and feet, long ears | hop (moves only in the air), idle (nibbling, ear turn, sits up alert) |
| Black bear (`land.py`) | 33 in at the shoulder | black, tan muzzle, round ears | walk (the amble), idle (lifts its nose to scent the air) |
| Ring-billed gull (`birds.py`) | 4 ft wings | white, pale grey wings with black tips, yellow bill with a black ring | fly (four-frame beat), glide |
| Song sparrow (`birds.py`) | 8 in wings, drawn 2x | brown, rufous cap, pale breast | fly (bounding: beats, then wings folded) |
| Mallard (`birds.py`) | 3 ft wings | drake: green head, white collar, chestnut breast, grey sides, black stern; hen: mottled brown; both a blue speculum | fly (drake), hen |
| Bald eagle (`birds.py`) | 6 1/2 ft wings | dark brown, white head and tail, yellow bill and feet | fly (slow beats), glide |
| Common loon (`birds.py`) | 3 ft long | black head, dagger bill, white necklace, black back chequered white, low in the water | swim, dive |
| Shiner minnow (`tools/fish_art.py`, with the fish) | 3 in | olive back, silver sides, dark stripe, white belly | swim |

Each script writes its sheet (`assets/art/characters/<name>.png`), its
animation table (`<name>.json`, also in the manifest under
`anchors.creatures`) and previews here (`<name>-sheet.png` and a GIF per
animation). Run them on their own (`python3 tools/characters/land.py`,
`birds.py`; the minnow is painted with the fish) or the whole art build. In `land.py` each leg
swings through a stride by gait (walk, trot, gallop), its foot fixed on the
ground while it bears weight, which gives each walk frame its step. `python3 tools/characters/lineup.py` redraws the
lineup above.

## Research

- White-tailed deer: [Virginia DWR](https://www.dgif.virginia.gov/wildlife/information/white-tailed-deer),
  [Pennsylvania Game Commission](https://www.pa.gov/agencies/pgc/wildlife/discover-pa-wildlife/white-tailed-deer.html),
  [Minnesota DNR, deer and elk identification](https://www.dnr.state.mn.us/hunting/deer/deer-elk-id.html)
- Black bear: [NPS, bear identification](https://www.nps.gov/articles/bear-identification.htm),
  [Bear Smart, know the difference](https://bearsmart.com/about-bears/know-the-difference)
- Snowshoe hare: [SUNY ESF](https://www.esf.edu/aec/adks/mammals/snowshoe_hare.htm),
  [Wildwood Tracking](https://wildwoodtracking.com/quiz/quiz054/quiz054A.html)
- Dogs and the gallop: Eadweard Muybridge, *Animal Locomotion* (1887), public domain
- Pixel-art walk cycles: [Walk cycle guide (OpenGameArt)](https://opengameart.org/content/walk-cycle-guide),
  [AGS forums on quadruped walks](https://www.adventuregamestudio.co.uk/forums/index.php?msg=394078),
  [Pixel art walk cycle animation (itch.io)](https://itch.io/blog/526535/pixel-art-walk-cycle-animation)
- Bird flight: Étienne-Jules Marey's chronophotographs of gulls, 1887, public domain
  ([Marey on Wikipedia](https://en.wikipedia.org/wiki/%C3%89tienne-Jules_Marey),
  [*Nature*, 1888](https://www.nature.com/articles/037369a0.pdf));
  [Small birds, 2D Animation: Animate Flying Creatures](https://origin-www.lynda.com/3D-Animation-tutorials/Small-birds/501129/602246-4.html)
  (the wings reverse and fold on the upstroke; the body moves against the wings)
- Pixel-art technique and tools: [Pixelorama](https://github.com/Orama-Interactive/Pixelorama) (MIT),
  the RotSprite and Scale2x algorithms, hue-shifted ramps and selective outlining
- The CC0 [animated wild animals](https://opengameart.org/content/animated-wild-animals) by ScratchIO,
  studied for a canid's body plan and walk at sprite size (nothing copied)
