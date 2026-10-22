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

<!--
## Study N: <subject> (<date>)

**Why:** what the audit or research says is wrong or missing.
**References:** links and notes.
**Versions:** A, B, C, with what each tries.
**Verdict:** your call.
**Learned:** the rule it gives us.
-->
