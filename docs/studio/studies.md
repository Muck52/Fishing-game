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

<!--
## Study N: <subject> (<date>)

**Why:** what the audit or research says is wrong or missing.
**References:** links and notes.
**Versions:** A, B, C, with what each tries.
**Verdict:** your call.
**Learned:** the rule it gives us.
-->
