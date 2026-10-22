# Studies

The practice log. Each study: the subject, the references, the versions,
your verdict, and what we learned (which then goes into the style bible).

## Study 1: the sky and the distant hills (2026-10-22)

**Why:** the audit's biggest problems are here: the sky, snowy alpine peaks
and clouds are pack art drawn at 2x, with no hue shift, in two cloud styles,
and the peaks don't belong on a north-woods lake.

**References:** the sky colours through a summer day and the "hills, not
mountains" notes in [research/north-woods-lake.md](research/north-woods-lake.md);
sky bands, cloud shapes and atmospheric perspective in
[research/materials.md](research/materials.md).

**Versions** (`tools/studio/study_sky.py`, images in
[studies/01-sky/](studies/01-sky/), review page `review/study1.html`):
- **A, haze bands:** three low rounded ridges in haze, flat sky bands, a few
  rim-lit cumulus.
- **B, spire skyline:** the same, with the nearest ridge edged in fir and
  spruce spires and tall white pines above them; sun or moon. (The white
  pines were later taken out; see the verdict.)
- **C, big sky:** two thin far ridges low down, most of the frame sky, high
  wisps and a cumulus bank.

**Along the way:** the first clouds were too small and shaded in streaks;
lighting them as one shape (a rim of light on the sun's side, shade along
the flat base, one calm mid tone) fixed it. Sky bands of 10 were too
stripy; 16, thinning toward the horizon, read as a gradient. Hills placed
like real low ridges were hidden behind the far bank; they now rise to
about two-thirds of the way up the frame.

**Verdict:** B, "it looks amazing", but without the random mounds in the
treeline. The mounds were the tall white pines: real ones do stand above
the canopy, but drawn this small they read as lumps, so they're out until a
white pine study gives them a proper tiered silhouette. B is now the
game's sky (`tools/scenery/sky.py`): one image per time of day, blended
hour by hour, with three clouds that drift, and the old snowy peaks, pack
sky and both cloud styles are gone.

**Fitting it in:** the old grade multiplied one colour over everything,
which would have tinted a sky already drawn in its own light twice. Now the
grade is a sheet with the sky cut out of it, so it shades the bank, the
hut and the lake but leaves the sky alone; birds up there are tinted by
hand. At night the nearest ridge first went near black and read as a hole
behind the bank; it now steps toward the bank's own night colour.

**Learned:**
- Light a cloud as one shape: a rim on the sun's side, shade along the
  base, one calm mid tone between.
- 16 sky bands, thinning toward the horizon, read as a gradient; 10 are
  stripes.
- A detail too small to draw properly (a pine 4 px tall) reads as noise.
  Leave it out until it can be drawn at a size where its shape reads.
- Each layer at night must stay a little lighter than the one in front, or
  it reads as a hole.

## Study 2: the far bank (2026-10-22)

**Why:** the bank is the pack's art at twice our pixel size, its trees and
rock in plain darkening, with no white pine, birch or granite of the real
north woods.

**References:** trees, rock and the waterfall in
[research/north-woods-lake.md](research/north-woods-lake.md); needles,
bark and granite in [research/materials.md](research/materials.md).

**Versions** (`tools/studio/study_bank.py`, images in
[studies/02-bank/](studies/02-bank/), review page `review/study2.html`;
each is shown in the game itself, swapped in by the headless browser):
- **A, granite point:** a pink granite outcrop with spruce and a snag on
  top, tea-coloured falls over its flank, a big white pine over a granite
  shore, a birch clump and an erratic.
- **B, the bank we have, redrawn:** today's layout in our materials: grassy
  slope, boulder, two big spruces, a grey cliff with white falls.
- **C, birch cove:** a pebble beach, birches and red pines against spruce,
  a granite bluff with a ribbon falls.

**Along the way:** the first spruces were drawn tier by tier as full rows
and read as stripes; drawing the whole spire in shade first and then
lighting each tier as one clump fixed it. Rock lit only at its edges was a
flat pink wall; broken into planes (lines slanting down from the top, the
planes either side a step lighter or darker) it reads as granite. Joints
run all the way across read as layer cake; they now die out. The forest
behind is row under row of treetops, which reads as a forested slope where
one flat fill read as a curtain.

**Verdict:** C, the birch cove. Before it went in: the falls lost the dark
edges that made it read as a log (it is now a white curtain with streaks
of tea-coloured water and ragged edges), the stream got a wet edge and
ripples that catch the sky's blue, the bluff's joints all run one way
like real bedrock, and the floating aspen crowns in the forest behind came
out. The beach got wetter sand at the water, a few stones and a driftwood
log. It's in the game (`tools/scenery/bank.py`), and with it the last of
the mountain-river pack is gone.

**Learned:**
- Light the whole silhouette in shade first, then light each part (a
  tier, a clump) as one shape; drawing row by row makes stripes.
- Break big rock into planes, with joints that run one way and die out.
- A far forest is rows of treetops; one flat fill reads as a curtain.
- Water reads as water by what it reflects: white crests and sky blue on
  dark water. Brown alone, or a dark outline, reads as wood.

## Study 3: the waterfall (2026-10-22)

**Why:** you said the falls looked unnatural. It was a straight column of
even width out of a square hole, with no river above it, stopping halfway
down the cliff, its stream sliding down the rock like a ramp, and its
tea-brown streaks with a dark outline read as a log.

**References:** [research/waterfalls.md](research/waterfalls.md): the
forms (plunge, horsetail, cascade, segmented, tiered), the North Shore's
falls over basalt ledges, and pixel-art waterfalls as a mouth, a flow and
a splash.

**Versions** (`tools/studio/study_falls.py`, images in
[studies/03-falls/](studies/03-falls/), review page `review/study3.html`,
with animated close-ups):
- **A, tiered cascade:** three drops down basalt ledges, foam at each step.
- **B, plunge from a notch:** one drop, widening, breaking into strands.
- **C, segmented horsetail:** two strands on the rock, split by a rib.

**Along the way:** the first pass used the cream foam and brown pool from
study 2 and read as paper and a rug; white water with blue shadows and a
dark tea-teal pool with sky in its ripples read as water. A box of dark
rock round the falls looked like a slot; a ragged band a few pixels wide
either side, with moss, reads as a gorge. Amber dots near the lip looked
like dirt; amber as short streaks reads as thin water.

**Verdict:** A, the tiered cascade, but it sat flat on the rock: at the
top, down its length and at the base, it didn't melt into the bluff.
Revised: the bluff carries on left so the falls sits in the rock; the
river comes down a notch worn into the bluff's top, between rock
shoulders drawn in front of the lip; the ledges are the bluff's own,
running on into the rock and fading out; each tier steps sideways; rock
juts into the edges; the rock beside the water is wet, darker the closer
it is, with moss; at the foot the splash boils behind boulders and the
outflow runs between stones. It's in the game (`tools/scenery/bank.py`).

**Learned:**
- Water has to go *into* the rock, not lie on it: put rock in front of it
  (shoulders at the lip, juts along the edges, boulders at the foot) so
  its outline is the rock's outline.
- A ledge a waterfall drops over belongs to the whole cliff: run it on
  into the rock either side and let it fade, and the water pours over it
  with only a glassy bend, no dark band.
- Nothing in nature is straight down: step each tier sideways.
- Wet rock is darker the nearer the water, with green where the spray
  falls.

## Study 4: the bluff and its stream (2026-10-22)

**Why:** you liked the cascade and asked for the mountain round it to
change so it looks more natural, and for a stream at the top, for depth
and a more complete, natural waterfall.

**Versions** (`tools/studio/study_mountain.py`, images in
[studies/04-mountain/](studies/04-mountain/), review page
`review/study4.html`, with animated close-ups):
- **A, ravine:** the bluff's top dips into a V; the stream winds down it
  out of the forest.
- **B, plateau river:** reaches stacked between rows of trees, swinging
  back and forth, further ones thinner and paler.
- **C, rapids gorge:** two small rapids down a narrow rocky gorge.

All three: the bluff's top slopes into the notch with a lit rim; the
recess walls are lit on the side facing the sun, shaded on the other;
cedars cling to the ledges.

**Along the way:** the first stream was thin lines with bright banks and
read as wire; then as a grey tube laid on the forest, like a road. Water
in the distance reads by the sky it reflects (pale far, darker near, sky
ripples sliding toward you), and it sits in the forest only when rows of
trees stand in front of it. Too many rows hid it to scattered sparkles;
two sparse rows let it wind back between them.

**Verdict:** B, the plateau river, but it ran into the trees with no sign
of a natural stream: no banks, trees standing in the water, its far
reaches floating in the far ridge's haze. Tuned: the forest rises behind
the bluff so the river crosses forested ground; it runs in its own
opening of sedge meadow; each reach has a far bank (gravel at the water,
grass above, its trees standing on it, hiding only the reaches further
off) and a dark, wet near bank; gravel bars on the inside of the bends;
the water reflects the far bank's trees as a dark band along its far edge
and the sky in its middle, in a calm grey-green; its far end goes round
behind the trees. It's in the game (`tools/scenery/bank.py`).

**Learned:**
- A river makes its own opening: the forest steps back from it, and it
  has banks you can see. Trees stand on its banks, never in it.
- Trees on a reach's far bank hide only the reaches further off; that's
  what lays it back into the distance.
- Water reflects what's across from it: a dark band of the far bank's
  trees along its far edge, the sky in its middle.
- Put the ground under it: water crossing the haze of a far ridge
  floats.

**Follow-up, the river's line:** you felt the river angled too far into
the background. It now runs along just behind the bluff's top edge
(`rim_river()`), in from the right, the rim as its near bank, with a few
easy bends of uneven size that swing toward you (lower, wider) and away
(higher, thinner), widening as it sweeps round and down into the lip.
The bends are drawn as a smooth curve through the points (a Catmull-Rom
spline); straight segments between them read as a zig-zag, and evenly
spaced ones as a sine wave.

**Follow-up, one water:** you asked for the water's colours to blend
where they meet, and with the theme. They'd been chosen piece by piece:
a grey-green river, a brown-teal pool and outflow, amber streaks in the
falls, a blue lake, and the lake's dark shoreline line cut straight
across the outflow. Now every piece of the stream is built from the
lake's own colours (deep #2c5c78, mid #4f738b, light #86a398, highlight
#b0ecf0), used as they are rather than relit, so the time-of-day grade
shades them all alike. The river's middle is the lake's light grey-green;
the glassy water over each lip is the lake's pale teal; the falls' white
water has the lake's blue in its shadows; the pool and outflow are the
lake's deep colour, the outflow's last rows dithered into its surface
colours; and where it meets the lake, a small animated river mouth opens
the shoreline line and spreads the foam out on the lake (`mouth()` in
`tools/scenery/bank.py`, played in `src/environment/Lake.js`).
Rule: all water in the game comes from one family of colours.

**Follow-up, life on the bluff:** you asked for texture on the bare side
of the bluff: foliage, cracks, boulders, vines. Added (`life()` in
`tools/studio/study_mountain.py`): dark rain stains running down from
the ledges; cracks that wander and branch, with grass and moss in them;
and along the bluff's real ledges (its top edge and the tops of its
stepped slabs) a fringe of grass and moss with shrubs, spruce saplings,
resting boulders and creepers hanging down. The first try scattered them
over the open face, where they floated; plants and boulders need a ledge
to sit on.

## Study 5: cattails at the shoreline (2026-10-22)

**Why:** you asked to tuck the cattails in tighter to the shoreline and
add algae round them. They were the pack's art, outlined, floating 9 px
out on the lake's surface band.

**Versions** (`tools/studio/study_shore.py`, images in
[studies/05-shore/](studies/05-shore/), review page `review/study5.html`;
the game now places the shallows' plants from the manifest,
`anchors.shore`, so each version is swapped into the real game):
- **A, tucked in:** the pack's cattails at the shore, an algae mat.
- **B, our stand:** our own cattails, a dense stand rooted in the
  shallows, the algae mat, stems seen through the water with algae
  threads on them.
- **C, mixed shallows:** clumps of cattails with bulrush and sedge,
  algae, duckweed and lily pads.

**Along the way:** the first leaves were 1 px lines standing straight up
and read as pale grass; fans of arcing leaves, 2 px wide low down, some
tips folding over, in a deeper green, read as cattails. Rooted 14 rows
deep, the stems hung down into the lake like a curtain; 6 rows is the
shallows. A one-row algae line vanished on the surface band; three or four
rows in soft patches, breaking up at the edges, read as a mat.

**Verdict:** C, "all the way. It looks beautiful." In the game
(`tools/scenery/shore.py`); the pack's cattails are gone.

**Learned:**
- Plants of the shallows root at the edge: a few rows of stem under the
  water, the rest above, never floating out on the lake.
- Under the waterline, draw through the water: mix toward the lake's own
  colours.
- Variety reads as real: cattails in clumps with bulrush and sedge
  between, algae at their feet, duckweed and lily pads further out.
- A long leaf reads by its arc and its width low down; a 1 px straight
  line reads as grass.

## Study 6: the whole cast (2026-10-22)

**Why:** the scenery is now drawn without outlines, in the materials
library's colours and light; the animals and fish still carry the shared
plum-black outline round every part. Before going group by group (land
animals, birds, fish), settle one edge treatment for everyone.

**Versions** (`tools/studio/study_cast.py`, images in
[studies/06-cast/](studies/06-cast/), review page `review/study6.html`;
only the outline pixels change, eyes and small marks kept):
- **A, coloured line:** the outline in a deep, cool shade of the colour
  it holds in.
- **B, selective:** the dark line only underneath and on the shadow side;
  the lit edges a shade of the animal's own colour.
- **C, no line:** the edge is the animal's own colour, lit side, a step
  of shade on the other.

**Verdict:** B, selective. Every animal and fish is built with it now:
the art build's last pass (`edges()`, using `tools/characters/edges.py`)
treats each creature and fish sheet after the palette pass, so nothing
re-darkens it. The angler (pack art, for the hut restyle) and the
journal's fish cards keep the full outline.

**Learned:**
- Light the cast from the same side as the scenery: a dark edge only
  where the form turns from the sun.
- An edge treatment can be tried on the finished sheets, so a study
  compares only the edges and not new drawings.

## Study 7: the land animals (2026-10-22)

**Why:** on the new beach, Olive, the deer, fox, hare and bear looked
flat (big areas of one colour, lit only along their top and bottom rows)
next to scenery lit as rounded masses; the visitors stopped among the
cattails where you could hardly see them; and they floated on the sand.

**Fixed for every version, in the game:** the visitors walk on through
the cattails to stop on the open sand beyond them, and each has a soft
shadow on the sand that goes where it goes (`src/wildlife/Wildlife.js`).

**Versions** (`tools/studio/study_land.py`, images in
[studies/07-land/](studies/07-land/), review page `review/study7.html`;
a lighting pass over the finished sheets, drawing unchanged):
- **A, lit as one mass:** light toward the upper left, shade away from
  it, from each frame's silhouette.
- **B, mass and fur:** A, plus interlocking edges where two coat colours
  meet.
- **C, sunlit fur:** B, plus a warm rim on the back and cool light
  bounced up from the sand on the belly.

**Along the way:** breaking the light and shade bands into a one-pixel
checker made the deer look spotted like a fawn; fur edges only where two
really different coat colours meet read as hair without the speckle.
Studying in the game by calling the visitors in was too random (others
wandered in, they'd left again); standing the cast on the sand directly
gives a fair comparison.

**Verdict:** A, lit as one mass. The land animals are built that way
now: the art build's last pass lights them (`tools/characters/light.py`)
after making their edges selective.

**Learned:**
- Light the animals the way the scenery is lit, as one rounded mass from
  the upper left, and they belong to it.
- Light worked out from each frame's own silhouette moves with the body;
  texture laid on a fixed grid would crawl as it walks.
- An animal has to be seen to be enjoyed: stage it in the open, give it
  a shadow to stand on.

## Study 8: the land animals, redesigned (2026-10-22)

**Why:** you still wanted the land animals redesigned: stiff and blocky
(bodies like boxes, legs like sticks) and not cozy enough.

**How:** a new way of drawing them (`tools/characters/anatomy.py`): each
animal described as rounded masses that smooth curves run through, and
legs as tapering chains of joints, drawn 4x larger and voted down to the
grid. A style reshapes the same anatomy (head scale, leg length, body
roundness, eye), so one description gives all three directions, and
later every animation.

**Versions** (`tools/studio/study_creatures.py`, images in
[studies/08-creatures/](studies/08-creatures/), review page
`review/study8.html`), each standing and in a pose of its own (Olive
sitting, the deer drinking, the fox sniffing, the hare sitting up, the
bear sitting):
- **A, natural curves:** true proportions, the stiffness gone.
- **B, cozy storybook:** heads a third bigger, shorter legs, rounder
  bodies, big eyes with a catchlight, a touch of blush.
- **C, cozy naturalist:** in between.

**Along the way:** the first deer came out a pony (a deep body on short,
thick legs); real proportions (a shallow body, legs as long as the body
is deep) fixed it. Every leg gets an outline on both sides, so a 1 px
leg is 3 px wide on screen: legs have to be drawn thin, and near and far
legs spaced apart, or they merge into stumps. A sitting bear with its
legs tucked inside its body is a black egg; legs set forward of the chest
read.

**Verdict:** C, cozy naturalist, with corrections: Olive's eyes didn't
show and the deer lost her ears bending down. Checked every model and
fixed: the eyes (B's big eyes with a catchlight on every animal, Olive
included, without the blush; a grey rim, then a brown eye with a black
pupil, were tried on Olive and taken back out, at your call), the
drinking deer's ears (standing up and
back, clear of the neck), the fox's ears (black-backed), the hare's ears
sitting up (parted). Added a buck beside the doe: hardened late-summer
antlers, a heavier neck, a darker coat. His drinking head first had
antlers pointing one way and a head pointing another; now his standing
head, ears and antlers are turned down together as one piece (`head_turn`
in `tools/characters/anatomy.py`), 60 degrees, so they agree.

**Learned:**
- One eye design for the whole cast; the catchlight is what reads, even
  on a black coat.
- Turn a head as one piece with everything on it (ears, antlers); drawn
  separately they point different ways.
- Parts that fold against a body of the same colour vanish; turn them so
  they stand clear of it, or give them a darker or lighter face.
- A tail drawn as a solid shape reads as a plank; drawn as a tapering
  limb (thick at the root, thin to the tip) it reads as a tail. (Olive's,
  at your call; and curled forward over her back toward her head, like a
  husky's, the tip held clear of her back with a gap of air.)
- Antler tines need room: spaced three pixels apart with their outline,
  closer they merge into a clump.

**In the game (later):** after study 9, the designs were animated in
`tools/characters/land.py` and replaced the old sprites: each leg swings
through a stride by gait (the four-beat walk, the fox's trot, Olive's
gallop), its foot held on the sand while it bears weight, so the walk
steps come from the stride; the hare hops; idles come from the poses (ear
flicks, drinking, sniffing, a raised nose, tail swishes); Olive leaps,
swims and shakes. The buck now visits too. The old scripts and their
Pixelorama projects are retired.

## Study 9: the birds (2026-10-22)

**Why:** with the land animals redesigned, the birds were next: the gull,
eagle, mallards and sparrow, plus the common loon as a newcomer.

**Versions:** all redrawn from shapes in study 8's look (C's proportions,
B's big eyes with a catchlight, selective edge, lit as one mass), in
`tools/studio/study_birds.py`. The study is how they fly:
- **A**, flapping in profile, wings up and down beside the body.
- **B**, spread from below, far wing up behind, near wing down in front.
- **C**, a mix: the eagle and gull soar spread, the mallards and sparrow
  flap in profile.

Each bird also has a rest pose, the same in every version: the gull
standing, the eagle perched, the sparrow on a cattail, the drake, hen and
loon swimming (and the loon diving). Review page: `review/study9.html`.

**Verdict:** A, flapping in profile, for every bird.

**In the game:** the birds' sheets now come from `tools/characters/birds.py`
(the old kit-drawn gull, eagle, mallard and sparrow scripts and their
Pixelorama projects are retired). Each wingbeat is four frames: up, level,
down, level, the level frame morphed halfway between up and down. The gull
and eagle glide on level wings; the sparrow bounds, wings folded between
bursts. They get the selective edge and are lit as one mass, like the land
animals. The loon swims in low on the lake, dives, comes up further on and
dives out of sight.

**Learned:**
- Side-on suits this game's camera: the birds now match the animals on
  the beach instead of being the one thing seen from a different angle.
- An in-between frame can be morphed: resample both outlines to the same
  number of points round their smooth curve and meet halfway.
- Swimming birds want their waterline on the surface and the rows below it
  seen through the water, the way Olive swims.

## Study 9b: the birds, in detail (2026-10-22)

**Why:** you felt the birds hadn't had much detail in study 9.

**Versions** (`tools/studio/study_bird_detail.py`):
- **A**, feathered wings: coverts, flight feathers with a notched trailing
  edge, primaries, worked out from each wing's shape (so every frame of the
  beat gets it), with the gull's mirrors, the eagle's fingers, the
  mallards' speculum and the sparrow's wing bars.
- **B**, A plus field marks and body feather texture (scallops, streaks,
  flecks).
- **C**, B a third larger.

Also: the sparrow now perches on top of its cattail; the eagle's tail
hangs behind its legs. Review page: `review/study9b.html`.

**Verdict:** B. In the game: `tools/characters/birds.py` draws every frame
through the detail pass at level B.

**Learned:**
- Detail on a small moving sprite comes cheapest from structure, worked
  out from the shape (feather bands along and across a wing), not placed
  by hand per frame, so every frame of a beat agrees.
- (Later, the rest poses joined the game: now and then a gull, or the
  eagle, glides down onto the open sand, stands a while looking about and
  beats off; a sparrow perches on the tallest cattail's head, bobbing; a
  drake and hen paddle in along the shallows and back out. A bird on the
  sand and a visiting animal never share it.)
- Placed spots read as a pattern (the hen's first mottling looked like a
  leopard's); a texture keyed to the body's interior reads as feathers.

## Study 10: the fish (2026-10-22)

**Why:** the seventeen species, painted by `tools/fish_art.py`, had fallen
behind the cast: the art build snapped their colours to the old pack
palette, their eye was one dark pixel, and at swimming size they showed
only their one signature marking.

**Versions** (`fish_art.STYLES`, `tools/studio/study_fish.py`), each
building on the last:
- **A**, their own painted colours (no palette snap) and the cast's eye.
- **B**, A in the cast's proportions: deeper, rounder, blunter heads, a
  thicker tail stalk.
- **C**, B in full detail: every marking at swimming size, fin rays,
  scale shimmer, the lateral line.

Review page: `review/study10.html`.

**Verdict:** C. In the game: the art build paints every species, card and
the minnows with `fish_art.STYLES["C"]` and keeps them in their own
colours (no palette snap). The old kit-drawn minnow is retired.

**Learned:**
- Check what the build does after the drawing: the fish were painted in
  good colours and then snapped to a 56-colour pack palette on the way
  out. The biggest gain here was undoing that.
- A detail pass written once as a rule (every marking, fin rays, a
  shimmer, the lateral line) carries all seventeen species at once.

<!--
## Study N: <subject> (<date>)

**Why:** what the audit or research says is wrong or missing.
**References:** links and notes.
**Versions:** A, B, C, with what each tries.
**Verdict:** your call.
**Learned:** the rule it gives us.
-->
