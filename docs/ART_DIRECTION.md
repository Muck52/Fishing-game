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
   key colours and the interface art's own shades. It is now fixed in
   `tools/palette.json`, with a few shades added for the creatures, so
   redrawing art never shifts it. This is what makes art from many packs
   and our own drawings look like one game. *Since study 10,* the pack art
   is what's graded: everything we draw ourselves (scenery, animals, birds,
   fish) keeps its own colours.
3. **Outlines say "this moves."** The angler, the boat, the hut and props
   carry the shared dark outline. The animals and fish carry a selective
   one (study 6): the dark line only underneath and on the shadow side,
   the lit top and left edged in a shade of the animal's own colour, the
   lines inside the body softened (`tools/characters/edges.py`, the art
   build's last pass). The scenery has none, so actors always read in
   front of it.
4. **Light from above and behind.** Sun shafts slant down into the water,
   the surface twinkles, and depth darkens and cools everything. Glows are
   pixel sprites (`firefly`, `hut-lights`), never blurred.
5. **Things are to scale.** The angler is about 34 pixels tall, and
   everything is sized against him. Fish swim at 17 (sunfish) to 44
   (sturgeon) pixels long, a little larger than life so their markings
   read; minnows are 13. Nothing is shrunk in the game.
6. **Distance is darker and bluer.** The background rock shelf, the posts
   below the waterline and deep fish are pushed toward the water's colour.
7. **Motion is slow and stepped.** Ambient loops run at 3–8 frames a second;
   floating UI moves in whole-pixel steps (`ease: 'Stepped'`). Fast motion is
   saved for the moments that matter: the bite, the splash, the landing.
   Creatures move *with* their animation: each walk cycle has a step per
   frame, measured from the sheet by following a planted foot, and the body
   advances only by that step as the frame changes, so feet never slide. All
   creature sheets face left and are turned to face the way they travel.
   Fish swim with a wave that runs head to tail (6 frames, the tail beating
   faster when the fish swims faster); big birds alternate wingbeats and
   glides.

   **The camera breathes with the cast.** On the dock with the rod up, the
   camera looks up into a big sky (ours, drawn for each time of day, with
   stars at night) and the dock sits low on screen. Casting pans slowly
   down until the whole lake, down to the lakebed, is in view with the dock
   near the top; when the fish is in (or gone) it drifts back up. The
   interface stays pinned to the screen.

8. **Lettering is part of the art, and it's all one hand.** Every word in
   the game is set in Monogram (datagoblin, CC0), a small, friendly pixel
   font with a bit of handwriting in it, baked at its native 16px
   (`fonts()` in the build). Over the scene it wears the same dark outline
   as the sprites (`body`, and `head` for headings); on paper, in the
   journal, it's plain ink (`ink`), so it reads like print. Bold is the
   same letters with every upright stroke doubled (`head`, `ink-bold`),
   so the letters grow wider rather than filling in: the openings in m,
   w, M, W, # and " stay open (letters made only of curves and diagonals,
   like s and x, thicken a pixel wherever that doesn't close a gap). Every
   glyph of every cut has been checked at size for legibility.
   Text is tinted, never resized off the grid; titles are 2x.

9. **The hour sets the mood.** `src/environment/Daylight.js` multiplies the
   scene by a colour for the time on the phone: rose at dawn, clear by day,
   gold then mauve at dusk, deep blue at night. After dark the hut's
   window and doorway light up (only the openings change colour, so the
   light sits exactly on the art) and fireflies come out over the reeds.
   The clock is read every frame, so the lake follows real time as you
   play. Night is kept a little brighter than true dark, and a faint blue
   is added over the scene after dusk so the deepest shadows lift and
   details still read on a phone in the dark.
   The interface sits above the grade so it always reads the same.

## The creatures

Olive, the deer, fox, hare and bear on the far bank, the gulls, sparrows,
mallards and the bald eagle in the sky, and the minnows are all drawn by
the game's own scripts (`tools/characters/`) with one shared kit: side-on
and lit from above, one palette and outline, real proportions on one scale,
legs drawn through their joints, real gaits, birds in profile (study 9). The
rules and the research behind each animal are in
[docs/characters/README.md](characters/README.md).

## The fish

Loon Lake holds seventeen species found in the upper Midwest: bluegill,
pumpkinseed, yellow perch, black crappie, white bass, common carp,
smallmouth and largemouth bass, brook and rainbow trout, channel catfish,
freshwater drum, walleye, burbot, northern pike, muskellunge and lake
sturgeon. All are painted by `tools/fish_art.py`, which draws each one
straight onto the grid at two sizes, never shrinking a bigger picture:

- **Silhouette first.** Each species has its own body plan: depth and where
  it peaks, a humped or level back, blunt or pointed head, tail shape
  (forked, square, rounded or the sturgeon's shark-like tail), fin layout
  (spiny and soft dorsals, sails, adipose fins) and barbels. A sunfish, a
  perch, a pike and a sturgeon are told apart by outline alone.
- **Countershading.** Dark back, lit flank, pale belly, with a short
  dithered seam on the card and a clean step on the swimming sprite; a lit
  rim along the back and a shaded one under the belly.
- **Fins** are darker than the body and a little see-through; the dorsal
  and tail can differ from the lower fins (a perch's orange belly fins, a
  brook trout's white-edged ones). Card fins show their rays.
- **Head detail:** a gill-cover arc, a mouth sized to the species (the
  largemouth's runs past its eye), and a ringed eye with a glint on the
  card (red for smallmouth, glassy for walleye).
- **One signature at swimming size.** The card carries every marking; the
  small sprite keeps only the one or two you'd know it by (`SIGNATURE`):
  the bluegill's dark ear, the perch's bars, the rainbow's pink band, the
  walleye's white tail tip, the pike's pale beans.

## How each fish takes the bait

`src/fish/Strike.js` gives every species the approach, nibble and strike
it shows in the wild, and what each does to the float. All of it is
movement on the grid: position, pauses, which way the fish faces and how
fast its tail beats (a hurrying fish beats faster). Nothing is rotated.

| Fish | Comes in | Nibbles | Takes it | The float |
| --- | --- | --- | --- | --- |
| Bluegill | short darts with pauses | 2–4 double pecks | sucks it in | jiggles, then dips |
| Pumpkinseed | rises from below | 2–3 pecks | sucks it in | jiggles, then dips |
| Yellow perch | with two schoolmates | 1–2 pecks | snaps and darts down; school scatters | dips hard |
| Black crappie | rises from below | a tap | swims up with it | **lifts** instead of sinking |
| White bass | the pack races past, wheels back | slashing passes | slashes through | jerks under |
| Common carp | grubbing along the bottom, bubbles and silt | mouths it for a long moment | moves off with it | trembles, then slides away and sinks |
| Smallmouth bass | stops a few lengths off to look, edges closer | a tap | lunges and turns for deep water | plunges |
| Largemouth bass | already waiting by cover, barely moving | creeps closer | flares and engulfs it in a burst of bubbles | slams under and shakes |
| Brook trout | holds in the current, slipping back and forth | snaps and drops back | snaps | quick dips |
| Rainbow trout | cruises in fast | one snap | rolls on it with a flash of silver | dips hard |
| Channel catfish | follows the scent from the bottom, head swinging | nudges with its whiskers | swims off with it | slides away and sinks |
| Freshwater drum | roots along the bottom | crunches: a rattle of tugs | sucks it in | rattles, then dips |
| Walleye | shadows it up out of the deep | maybe a tap | takes it so gently | barely dips, slides away |
| Burbot | creeps along the bottom like an eel | mouths it | inhales it | trembles, then dips |
| Northern pike | lying in ambush; never nibbles | — | rockets in, grabs it crossways and holds still | slams under |
| Muskellunge | follows, then lazy figure eights | noses up and turns away | lunges from nowhere | plunges |
| Lake sturgeon | vacuuming the bottom | mouths it, silt puffs | slow, heavy take | slides away and sinks deep |

Add `?fish=walleye` (any species id) to the address to make that species
bite every time while tuning.

## Reeling in: the catch bar

`src/fishing/BarFight.js` and `src/ui/FishBar.js`, after Stardew Valley's
fishing. A wooden column stands beside the angler with a water track, a
green bar and the fish. Hold anywhere to float the bar up; let go and it
sinks (and bounces off the bottom). Keep the fish inside the bar to fill the
catch meter beside it; let it out and the meter drains. Full, it's caught;
empty, it slips the hook. The bar is a little sluggish while the fish is in
it, which helps you hold it there.

The bar is dressed to belong to the scene: a small board in the same wood
as the counters and the journal (tan rim, plank seams, plum-brown outline),
with a window onto the lake in the lake's own colours, from the shimmering
surface down to sand and swaying weed, bubbles rising through it. The net is
see-through so the water shows behind it, the fish icon takes its back and
belly colours from the hooked fish's own sprite, the catch meter is a gauge
carved into the board, and the reel at its foot is brass. Hints sit on the
same wooden plaques as the counters.

Each species moves in its own way (`MOVES`): bluegill and bass wander,
perch, trout, pike and muskie dart, walleye glide smoothly, carp, catfish
and drum sink toward the bottom, crappie float up. `difficulty` sets how far
and how often. The hooked fish's depth in the lake follows its place in the
bar.

- **Perfect catch:** never let it leave the bar for +25% coins.
- **Treasure chest:** sometimes a chest appears in the track; keep it in the
  bar until its little meter fills for bonus coins.

## The rhythm-tug fight (?reel=rhythm)

`src/fishing/RhythmFight.js`. A hooked fish pulls in tugs, each species to
its own beat (`TUGS`): the rod tip quivers (the tell), the fish tugs, and
then there is a short window to reel. Tap just after each tug; the first
moment of the window counts as perfect. Tapping into a tug strains the line
(crappie's paper mouths strain faster), and a tug you let go takes line. The
meter says WAIT, REEL! or STEER.

- **Leaps** (bass, rainbow, muskie, sturgeon): don't reel; "let it jump".
- **Runs for cover:** some fish bolt for the weeds, the hut's posts or the
  bottom. Swipe away from it (weeds: right, posts: left, bottom: up) to turn
  its head, or the line snags and it takes line.
- `?reel=hold` brings back the first hold-to-reel fight for comparison.

The angler acts it out: idle he glances back at the hut, shifts his feet
and breathes; waiting, he jigs the bait and leans in to peer at the water;
on a bite the tip is yanked down; fighting, he leans back with the rod bent
toward the fish, which pumps up as the reel's handle spins on every good
turn. The rod is a pixel line drawn from his hands each frame, so it bends
without breaking the one-pixel grid.

## The backpack

The inventory lives in a backpack (`src/ui/Backpack.js`). Its button in
the bottom-right corner is a wooden counter with the bag drawn on it:
canvas body lit from the left, a leather flap with a brass buckle, shoulder
straps, a front pocket and the shared outline. It stays shut while the
inventory is closed; tap it and the flap lifts and falls back, a fish tail
and a float peek out and bob while you look; close the inventory and it
shuts again. The panel is the journal's board with a 5 x 4 grid of slots
carved into the planks (shadow along the top and left, light on the bottom
edge) and a dark inlay that names whatever you tap. Tackle is always in the
bag; each kind of fish you catch stacks in its own slot. Tap a fish and it
comes alive like a fish out of water (`src/fish/Flop.js`), each species as
it really behaves when landed, all on the grid: its own swim frames curl
the body tail-up and tail-down, it hops in whole pixels, jitters a pixel
side to side, flips over, and flicks off water drops when it slaps down;
between bouts it lies still with its gills pumping.

| Fish | Out of the water |
| --- | --- |
| Bluegill, pumpkinseed | flip end over end on their flat sides, short rests |
| Yellow perch | a few stiff tail slaps, then still |
| Black crappie | tires fast: weak flaps |
| White bass | non-stop thrashing |
| Common carp, lake sturgeon | heavy: one slow curl and slap, long rests (the sturgeon barely stirs) |
| Smallmouth bass, rainbow trout | springy, high flops and flips (the rainbow highest) |
| Largemouth bass, walleye, muskie | head shakes side to side (walleye lazily, muskie hard) |
| Brook trout | fast slippery quiver |
| Channel catfish, burbot | slow eel-like writhing, creeping along, no hopping |
| Freshwater drum | drums: a fast buzz |
| Northern pike | lies dead still, then explodes into a thrashing fit | The bag opens
while you're on the dock with the rod up, and a tap outside closes it.

## The field journal

`src/ui/Journal.js`. Its button, beside the backpack, is a worn leather
notebook drawn in the build (`journal()`): a stitched spine, scuffed
patches and rubbed corners, a fish pressed into the cover, a strap with a
brass clasp. It swings open (and a page corner lifts now and then) while
the journal is open, and shuts when it closes.

Open, it's held as you'd hold a book to read (`journal-held.png`): the
right-hand page flat, facing you and centred on the screen, with everything
to read on it, and the left half lifted toward you on its spine by your
hand. It's drawn the way perspective works for a page swung up about the
spine: foreshortened to a sliver of its width; its free edge, nearer to
you, taller, so its top and bottom edges slope out from the spine (a
trapezoid) with faint lines of writing converging the same way; bowing up
out of the gutter; darker toward the spine, casting a soft shadow on the
facing page; the gutter the darkest line in the book. The leather cover
overhangs the pages, stitched round the edge, and
the edges of the pages beneath show along the right and bottom. You're
well into the book, so the lifted half is thick with turned pages: a deep
block of page edges along its free edge and its top and bottom, deeper
toward the free edge (it's nearer), a few pages standing proud of the rest.
The pages have depth of their own: the top page curves, lit across its
middle and shading into the gutter and toward its curling edge; under it,
each page's edge is a shade of its own, darker deeper into the block, with
a thin shadow where the top page overhangs the rest, and the page tips
along the top and bottom staggered as real pages are,
and round them the lifted cover: a thick board whose stitched inside face
shows, then its own edge turned toward you, darker. It's a well-used book, not a new one: the corners are knocked round and
soft, the soft leather rolls over the boards' edges (a shaded roll at the
very edge, a padded swell catching the light just inside it), the edges are
frayed with little nicks and rubbed pale, paler still at the corners where
hands hold it, and a few stitches have worn through. The whole book is centred on the screen, as much
room to its left as to its right (the build records where the drawing
starts and ends, and the page positions, in `anchors.journal`). A red satin ribbon is tucked in behind
the book, only its V-cut tail hanging out below the cover; a ripple runs
down it in the breeze, swinging wider toward the loose end, its edges
catching the light as it turns. Tap it to go to the contents. The same ribbon trails from the closed journal on the
button.

The first page is the contents: all seventeen fish in two columns in the
book's order, each with its name in the journal's ink, its picture
(a silhouette until caught) and its page. Tap one to go straight there;
from any page the arrows go to the next or previous fish in the same order.
Turning forward, the page swings up off the right side, standing on edge
over the spine (narrowing, its near edge growing taller, darkening), then
falls onto the stack of turned pages, gathering pace, its edges bowing like
theirs and its shadow darkening the stack, lands a hair proud of the stack
and settles flush, and a fresh page edge on the stack catches the light.
Going back, the top page peels off the stack the same way in reverse.

Each fish has one page: its name filling the same box in the header on
every page (the same height, stretched across by a whole number so its
pixels stay square-edged, with the room left over shared between the
letters), the Latin name, the photo, your record
and the notes. On it:

- a photo taped in at both corners: a window onto the lake (its own water
  colours, light shafts, sand and weed) with the fish swimming in it at 2x,
  the way that species swims (`src/fish/Swim.js`): sunfish hover and
  scull, perch shuffle in place, white bass and rainbows cruise end to end
  (the rainbow rising now and then), smallmouth pause and dart, largemouth,
  pike and muskie lie still then lunge, brook trout hold against the
  current and dart up for insects, carp, catfish, drum and sturgeon cruise
  the bottom and stop to root up silt, and the burbot creeps along like an
  eel. Tap it and it flops like a fish out of water, then swims on;
- how many you've caught and the best weight;
- notes in brown ink under bold red headings: where it lives, what it eats,
  its size and something worth knowing (`data/fish/journal.js`).

A fish not yet caught is a dark silhouette with a question mark, with only
a clue to where it lives. Swipe or tap the arrows to turn the page.

## Olive

The angler's dog, Olive, is a character of her own with her own rig, sheet
and character sheet: see [docs/characters/olive.md](characters/olive.md).

## How each piece fits

| Piece | Source pack | Size on grid | Outline | Motion |
| --- | --- | --- | --- | --- |
| Sky, hills, clouds | ours: `tools/scenery/sky.py` (study 1, version B) | 360 x 260, 1x, one image per time of day | none | blends through the day; clouds drift |
| Far bank | ours: `tools/scenery/bank.py` (study 2, version C) | 360 x 324 on the grid, 1x | none | the falls and stream run 4 frames |
| Underwater, shelf, lakebed | built in `build_art.py` from the palette | full width | none | displacement wobble; shafts pulse |
| Weeds, sand, clam | Reactorcore aquatic | 1x | none | 4-frame sway |
| Hut, posts, barrel | CraftPix fishing | 1x | shared | hut windows lit at night |
| Shallows: cattails, bulrush, sedge, algae, duckweed, lily pads | ours: `tools/scenery/shore.py` (study 5, version C) | 1x | none | plants sway, the algae mat drifts and rides the swell, 4 frames |
| Rowboat and oars | CraftPix skiff, made double-ended; oars drawn in the build | 1x | shared | rides the swell and rocks through 4 baked tilt frames, sending tiny ripples off each end |
| Tiny ripples | drawn in the build | 22 x 3 | none | spread and fade in 5 frames, all over the surface |
| Angler | CraftPix fishing (turned, line erased; rod cut away for the live-rod body) | 48 x 48 frames | shared | idle fidgets, waiting jigs, bite, fight, land; the rod is drawn live so it bends |
| 17 fish species | painted by `tools/fish_art.py` | 17–44 px swimming, 1x; drawn again at about 3.4x for the card | shared | 6-frame head-to-tail swim wave; depth tint |
| Minnows | ansimuz underwater, redrawn small | 13 px long, 1x | shared | 4-frame swim, school |
| Deer, fox, hare, bear | ScratchIO animals | 1x | shared | foot-locked walk, hop and idle cycles; deer drinks, hare nibbles, bear stands planted |
| Gulls, ducks, eagle | MoikMellah, aroachi, Spring Spring | 1x | shared | gulls and eagle flap then glide; ducks flap steadily |
| Float, branch, ripples | Nelson Yiap, Amberfall | 1x | shared | bob cycles |
| Splash, bubbles, coins, boards | Pixel Frog (Treasure Hunters) | 1x | own | splash 5 frames; coin spin |
| Backpack (inventory button and icon) | drawn in the build (`backpack()`) in palette colours | 24 x 24, 1x | shared | closed; opens in 3 frames when the inventory opens, then a slow rummage loop; shuts again when it closes; a little hop now and then |
| Journal (button icon and book) | drawn in the build (`journal()`) in palette colours | icon 24 x 24; held book 360 x 464, its right page 237 x 375, 1x | shared | closed; opens in 3 frames, page corner lifting while read; the page slides as it turns |
| Lettering | Monogram by datagoblin | 16px glyphs, 1x or 2x; outlined over the scene, plain ink on paper | shared | stepped bobbing |

## Changing the art

All art goes through `tools/build_art.py`. Put an untouched pack in
`assets/source/`, cut and animate it in the script, and run
`python3 tools/build_art.py`. The palette pass at the end recolours it with
everything else. Hand-editing in a free pixel editor such as LibreSprite or
Piskel is fine for new source art; save it to `assets/source/` and let the
build do the rest.
