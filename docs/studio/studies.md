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

**Verdict:** waiting on you.

**Learned:** (after the verdict)

<!--
## Study N: <subject> (<date>)

**Why:** what the audit or research says is wrong or missing.
**References:** links and notes.
**Versions:** A, B, C, with what each tries.
**Verdict:** your call.
**Learned:** the rule it gives us.
-->
