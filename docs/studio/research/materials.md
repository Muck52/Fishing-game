# Materials in pixel art

How skilled pixel artists render each material at small sizes, gathered
2026-10-22.

Sources:
- **Pedro Medeiros (Saint11):** his tutorials are annotated GIFs, read frame
  by frame; links go to the GIF.
- **Slynyrd's Pixelblog, Derek Yu, Pixel Parmesan, and Mark Ferrari's Q&A.**
- **Gaps:** no expert source was found for fur, feathers, fish scales or rope.
  Advice on those is marked as weaker-sourced or worked out by us.

## 1. Colour ramps, for every material

- **Shift the hue along the whole ramp, not just the brightness.** Lights
  lean warm (toward yellow), shadows lean cool (toward blue or purple).
  - About 20° per swatch is as far as Slynyrd goes.
  - Ramps without a hue shift look dull and don't harmonise.
  - Source: [Slynyrd 1](https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes)
- **Saturation peaks in the middle** of a ramp, never at 0 or 100%.
  - Brightness steps shrink near white.
  - Very bright, very saturated colours look harsh.
  - Make neutrals by desaturating the middle swatches.
- **Narrow colour bands make each step hard to see.** Saint11 shifts hue
  toward the darker or lighter areas of the colour wheel, keeps the bands
  narrow, and makes each face mostly one solid colour.
  ([Shading](https://saint11.art/img/pixel-tutorials/Shading.gif))
- **About 15–16 colours, reused across all the depth planes.** Grass colours
  also blend the sky; forest greens shade the farther trees.
  ([Slynyrd 62](https://www.slynyrd.com/blog/2026/5/27/pixelblog-62-landscape-backgrounds))

## 2. Water

### Surface
Saint11 draws the surface in two layers
([Water](https://saint11.art/img/pixel-tutorials/Water.gif)):
- **Top layer:** circles that change size a little. Nothing moves more than
  1 px a frame.
- **Lower layer:** slides steadily to one side.
- **Glints:** small and bright, at corners and wave crests, barely moving.
- **Each small wave moves as one chunk.** Don't split a ripple into parts.
- **Things underwater** sway in a sine wave.
- **Bubbles** drift sideways at random and fade or rise.

### Waves
From [Slynyrd 10](https://www.slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion):
- **Shape:** waves are a chain of ovals; circles make short deep waves, wide
  ovals shallow ones.
- **Crests are steeper than troughs.**
- **Get the still wave right before animating it.**
- **Sparkle:** a short (about 6 frame) loop of simple motion, lined up with
  the scene's other highlights.
- **Animation won't rescue a weak still image.**

### Reflections
- Flip the object, shorten it a little and add highlights.
- Ripple it slowly in one direction.
  ([Slynyrd 10](https://www.slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion))
- Make it darker than the object, broken by thin horizontal gaps.
  ([Clip Studio](https://tips.clip-studio.com/en-us/articles/8540))
- Ferrari animated reflections ("Mountain Mirror Pond") by cycling bands of
  colour.
  ([Ferrari Q&A](https://www.effectgames.com/effect/article-Q_A_with_Mark_J_Ferrari.html))

### Waterfalls and foam
Three parts ([Slynyrd 10](https://www.slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion)):
- **Mouth:** bright, full of reflections.
- **Flow:** vertical bands that sag and darken as they fall, breaking up near
  the bottom.
- **Splash:** loops in step with the flow.

Foam:
- Saint11 animates foam and the falling water as particles, like smoke.
  ([Water](https://saint11.art/img/pixel-tutorials/Water.gif))
- **Dither only the foam.** Ferrari used dither only where a wave breaks into
  foam; on the smooth face of the wave it "would have looked terrible".
  ([Ferrari Q&A](https://www.effectgames.com/effect/article-Q_A_with_Mark_J_Ferrari.html))

### Depth, and colour cycling
- **Colour cycling:** each pixel loops through a run of colours, neighbours
  offset like marquee lights. Use runs of different lengths and speeds;
  uniform runs give a "pulsing flash".
- **Dither:** ordered (patterned) dither for smooth gradients, random dither
  only for chaotic texture. Rain and snow streaks get no dither, so they stay
  crisp.
  ([Ferrari Q&A](https://www.effectgames.com/effect/article-Q_A_with_Mark_J_Ferrari.html))
- **For us:** the underwater depth gradient should be flat horizontal bands,
  or bands joined by an ordered dither. Never noise.

## 3. Wood

### Logs and posts
From [Saint11 Wood](https://saint11.art/img/pixel-tutorials/Wood.gif):
- Start with the silhouette in a mid colour, in simple shapes.
- Add shadows, without pillow shading.
- Rings fade in detail with distance.
- Bark: draw it as scales, but light the whole as one shape.
- Then add cracks and grass.

### Planks
- Big shapes and bevels first, texture after.
- **Raise the contrast at the seams** between boards.
- Details: knots, nails, cracks, moss.
- Colour: hue-shift the shadow, mind the light's colour, use slow
  transitions, and don't overdo the highlight.
  ([Saint11 Wood](https://saint11.art/img/pixel-tutorials/Wood.gif))
- Grain is "many almost parallel grooves".
  ([Vegetation 2](https://saint11.art/img/pixel-tutorials/Vegetation2.gif))
- Give a much-repeated plank a cracked or stained variant so it doesn't tire
  the eye.
  ([Slynyrd 45](https://www.slynyrd.com/blog/2023/7/21/pixelblog-45-bricks-walls-doors-and-more))

### Trunks
- Start from a cylinder. Bark stripes are widest in the middle and narrow
  toward the edges; break the lines now and then and add a knot.
  ([Slynyrd 44](https://www.slynyrd.com/blog/2023/5/22/pixelblog-44-top-down-trees))
- For big trunks: light and dark areas first, then texture from separate
  cracks and lumps, then points of light and a backlight in another colour.
  Add one colour at a time.
  ([Vegetation 3](https://saint11.art/img/pixel-tutorials/Vegetation3.gif))

## 4. Stone and rock

### Rock types
From [Saint11 Rock](https://saint11.art/img/pixel-tutorials/Rock.gif):
- **Sedimentary:** layered and crumbly, with big soft highlights.
- **Metamorphic:** strong highlights, breaks in big chunks, large clean
  areas. Closest to our granite boulders.
- **Igneous:** rounded and porous, with very soft highlights.

### Building a rock
- Order of work: silhouette, base shadows, softer shadow layers,
  highlights, then backlight, cutting the noise as you go.
  ([Saint11 Rock](https://saint11.art/img/pixel-tutorials/Rock.gif))
- **Avoid** lone pixels, noise, and too many colours in the details.
- Start from solid blobs and "chisel down the form".
- Big rocks suit angular outlines; drop the steps on small ones.
- Match the rock's colour to the local geology.
  ([Slynyrd 13](https://www.slynyrd.com/blog/2019/1/22/pixelblog-13-rocks))

### Walls, pebbles, the lakebed
- **Don't render every brick**; it reads as noise.
- Shade a few, and leave areas empty.
  ([Slynyrd 2](https://www.slynyrd.com/blog/2018/2/15/pixelblog-2-texture))
- Pebbles and lakebed stones follow the same rule.

## 5. Foliage

### Plants in general
From [Saint11 Vegetation](https://saint11.art/img/pixel-tutorials/Vegetation.gif):
- **Order:** shape, then light, then detail.
- **Silhouette:** must read as a tree without colour; the light shows its
  volume.
- **Colours:** as few as possible. Light is warm, shadow is cold, and
  "almost half of the gradient is light green".
- **Detail:** on the borders, with calm areas inside for the eye to rest.
- **Leaves:** a consistent pattern, no lone pixels. "Repeating patterns is a
  good way to avoid noise."

### Layers and depth
From [Vegetation 2](https://saint11.art/img/pixel-tutorials/Vegetation2.gif):
- Think in layers: highlight, base, shadow, dirt.
- Big empty areas give focus to the rest.
- "Each detail must be conscious; don't throw random dots around."
- Far vegetation fades toward the sky colour; spirals make good texture.
  ([Vegetation 3](https://saint11.art/img/pixel-tutorials/Vegetation3.gif))

### Conifers, the core of our far bank
From [Slynyrd 44](https://www.slynyrd.com/blog/2023/5/22/pixelblog-44-top-down-trees):
- **Skeleton:** start from a stick figure. Branch direction is "critical",
  and each branch is unique, not stamped.
- **Order:** flat-fill all the branches first. Work top to bottom, because
  upper branches overlap lower ones.
- **Shading:** light, mid and dark branch groups, with upper branches casting
  shadows on the ones below.
- **Needle clusters:** 4–5 colours, a dark crescent at bottom left and a
  lighter round at top right, stray pixels cleaned up.

Video: [Benjamin Anderson, "Spruce Tree"](https://www.youtube.com/watch?v=E_NNLmRuFYY)

### Leafy trees
- Rough in the whole tree, then refine the clusters; leave some inner
  branches showing.
- "Not every leaf needs to be represented." "Too much variation will create
  displeasing noise."
  ([Slynyrd 15](https://www.slynyrd.com/blog/2019/3/7/pixelblog-15-plant-life))
- Canopies can be built from a few leaf-cluster sprites, layered, which can
  also sway in the wind.
  ([Slynyrd 2](https://www.slynyrd.com/blog/2018/2/15/pixelblog-2-texture))

### Grass, reeds, cattails
- **Grass:** short 1 px vertical streaks. Thicker blades near, only 1–2 px
  clusters far away.
  ([Slynyrd 62](https://www.slynyrd.com/blog/2026/5/27/pixelblog-62-landscape-backgrounds))
- **Edges:** grass edging along the tops of ground, so they aren't flat lines.
  ([Slynyrd 28](https://www.slynyrd.com/blog/2020/5/21/pixelblog-28-side-view-tiles))
- **Cattails** (no source; ours): grass blades with a 2–3 px dark brown head,
  using the shared wood and bark ramp.

## 6. Sky and clouds

### Sky
- Solid horizontal bands blended with a linear texture.
- The farthest clouds are part of the sky; the nearest get the most contrast.
- Colours are reused across the cloud layers.
  ([Slynyrd 62](https://www.slynyrd.com/blog/2026/5/27/pixelblog-62-landscape-backgrounds))

### Cloud shapes
From [Saint11 Clouds](https://saint11.art/img/pixel-tutorials/CLouds.gif):
- **Shape:** clouds are groups of spheres on a flat base; light the spheres.
- **Colour:** a flat base colour, hue-shifted shadows, low contrast, not too
  many little clusters.
- **Sun behind a cloud:** a bright rim, with the shadow in the flat underside.
- **Distance:** far clouds faded, near ones strong. Work back to front.
- Slynyrd builds clouds from circles of varied size with overlapping arched
  highlights, and a spiral now and then.
  ([Slynyrd 2](https://www.slynyrd.com/blog/2018/2/15/pixelblog-2-texture))

### Bands
- Flat bands or ordered dither, never diffusion dither.
- Bands of equal height draw the eye to their edges, so vary their heights.
  ([Derek Yu](https://www.derekyu.com/makegames/pixelart.html))

## 7. Distant mountains: atmospheric perspective

From [Slynyrd 62](https://www.slynyrd.com/blog/2026/5/27/pixelblog-62-landscape-backgrounds):
- **Each plane back:** less saturated, lighter (in daytime haze), and closer
  in hue to the sky.
- **Colours:** reuse a sky band as the farthest range; shade it bluer; use sky
  colours for distant shadows.
- **Haze:** a band at the foot of the hills.

Saint11's table ([Parallax](https://saint11.art/img/pixel-tutorials/Parallax.gif)):

| | Near | Far |
| --- | --- | --- |
| Saturation | high | low |
| Contrast | high | low |
| Light | bright | dark |
| Hue | warm | cool |
| Detail | lots | little |

The two disagree on brightness. In daytime haze, distance gets lighter, so
for our daytime lake we follow Slynyrd
([Slynyrd 11](https://www.slynyrd.com/blog/2018/11/16/pixelblog-11-landscape-pixeling)).

Ridgelines step in a regular pattern, such as 2-2-3-2-2-3.
([Fundamentals 2](https://saint11.art/img/pixel-tutorials/Fundamentals2.gif))

## 8. Sand, lakebed and mud

### Sand
From [Saint11 Sand](https://saint11.art/img/pixel-tutorials/Sand.gif):
- Wavy patterns with hard edges, a softer shadow at the foot of each mound.
- Up close it can look "coarse and sparkly": small dithered patches.
- The ramp runs from a cool shadow to a warm light.
- "Always choose a fixed light direction."

Also:
- Wispy "s" and "c" shapes.
  ([Slynyrd 62](https://www.slynyrd.com/blog/2026/5/27/pixelblog-62-landscape-backgrounds))
- Dither is fair on rough ground like dirt, used sparingly.
  ([Derek Yu](https://www.derekyu.com/makegames/pixelart.html))

### Lakebed (ours)
- Keep its texture low-contrast.
- It sits behind the water's tint, so it should be the quietest texture in
  the underwater layer.

## 9. Snow and ice

From [Saint11 Ice](https://saint11.art/img/pixel-tutorials/Ice.gif):
- **The ramp:** one six-step run from white through cyan to deep blue: snow
  light, snow shadow, ice glow, ice base, ice shadow, ice deep shadow.
- **Snow:** lies on surfaces facing up. Draw it as a slightly random zig-zag,
  with a few stray flakes.
- **Ice, in order:** basic shape, shadow reflection, highlight, cracks with
  bright edges, snow on top, backlight. Reflections cycle across its faces.
  Icicles form on the object and on the ground.
- **Snowfall:** streaks without dither.

## 10. Fur (weaker sources)

- **At small sizes:** suggest fur with a few spikes or waves inside each
  patch. At about 32 px you may need no strands at all.
- **Avoid:** scribbled texture on a spiky silhouette.
  ([itch.io](https://itch.io/t/2173926/pixel-tutorial-fur))
- **Order:** block in the clumps, then add a few strands.
  ([DeviantArt](https://www.deviantart.com/dodoicons/art/Pixel-fur-shading-tutorial-513887367))
- **Inner lines:** darker shades of the fur rather than black.
  ([Derek Yu](https://www.derekyu.com/makegames/pixelart.html))

## 11. Feathers (no pixel-art source; ours)

- **Rows:** treat each row of feathers as one cluster, overlapping from the
  wingtip toward the body, the shortest at the top.
- **Separation:** split rows with a single shadow line, not an outline round
  every feather.
  ([Clip Studio](https://assets.clip-studio.com/es-es/detail?id=2197086))
- Our `feathered_wing` already bands the wing this way.

## 12. Fish scales (no pixel-art source; ours)

- **Don't draw every scale.** As with bricks, suggest a few scale arcs in the
  mid-tone band and leave the light and dark ends plain.
  ([Slynyrd 2](https://www.slynyrd.com/blog/2018/2/15/pixelblog-2-texture))
- **Use regular, repeating patterns.**
  ([Fundamentals](https://saint11.art/img/pixel-tutorials/Fundamentals.gif))
- **Shine:** a 1 px sheen can move along the body.

## 13. Cloth

From [Saint11 Fabric](https://saint11.art/img/pixel-tutorials/Fabric.gif):
- **Light:** most fabric has soft shadows and no highlight.
- **Folds:** parallel where the cloth is pulled, across it where slack. They
  spread from pinch points and cast shadows on the cloth.
- **Avoid:** too many folds; dark areas get less detail.
- **Wind:** a sine wave in the wind's direction.

## 14. Metal

From [Saint11 Metal](https://saint11.art/img/pixel-tutorials/Metal.gif):
- **Build order:** shape, base light, base shadow, backlight and specular,
  then reflections.
- **Its ramp is the reverse of everything organic:** "light usually colder,
  less saturated; dark usually warmer, more saturated". That is what makes
  metal read as metal.
- **Light:** expect a strong backlight. Lines of light and shadow make easy
  reflections; animate the shine with the angle.
- **Scratches** tell its story.

## 15. Rope (no pixel-art source; ours)

- **Pattern:** a repeating diagonal 1 px step, every step the same length
  ([Fundamentals 2](https://saint11.art/img/pixel-tutorials/Fundamentals2.gif)).
- **Shading:** alternate light and dark every 2 px.
- **Fishing line:** 1–2 px thick, one colour, no outline.

## Cohesion principles

### One light
- One light direction for the whole game.
  ([Derek Yu](https://www.derekyu.com/makegames/pixelart.html),
  [Slynyrd 6](https://www.slynyrd.com/blog/2018/6/15/pixelblog-6-light-and-shadow))
- Lighting must match the shadows an object sits on.
  ([Slynyrd 45](https://www.slynyrd.com/blog/2023/7/21/pixelblog-45-bricks-walls-doors-and-more))

### One pixel grid
- Never scale a sprite in the engine; that makes mixed pixel sizes.
  ([Flowlab](https://community.flowlab.io/t/mini-rant-stop-using-mixels/38287))

### Clusters
- Few small clusters, no lone pixels except deliberate details.
- "I avoid dither when I can." Regular, repeated patterns read best.
  ([Fundamentals](https://saint11.art/img/pixel-tutorials/Fundamentals.gif))
- Spread a few clusters about, and keep detail even across the picture.
  ([Slynyrd 2](https://www.slynyrd.com/blog/2018/2/15/pixelblog-2-texture))
- Clusters may touch at corners, not along their sides. Few colours per
  texture.
  ([Slynyrd 28](https://www.slynyrd.com/blog/2020/5/21/pixelblog-28-side-view-tiles))

### Contrast hierarchy
- Background layers stay quiet; several simple layers beat one or two busy
  ones.
- Never two busy textures side by side; leave empty space.
- Colours may bleed on passive background, never on sprites.
  ([Slynyrd 28](https://www.slynyrd.com/blog/2020/5/21/pixelblog-28-side-view-tiles))
- The nearest plane has the most saturation and contrast.
  ([Slynyrd 62](https://www.slynyrd.com/blog/2026/5/27/pixelblog-62-landscape-backgrounds))

### Outlines
- Outlines take space; at low resolution use them only to separate shapes.
- Inner outlines can be lighter; selective outlining softens edges.
  ([Outlines](https://saint11.art/img/pixel-tutorials/Outlines.gif))
- This supports our rule: plum outline on actors, none on scenery.

### Anti-aliasing
- Hand-placed, only where a jaggy misrepresents a line, and only inside the
  sprite.
- **No outer anti-aliasing on sprites** that move over changing backgrounds;
  none on tiny sprites.
- Match the in-between pixel's value to how much of the square the line
  covers.
  ([Pixel Parmesan](https://pixelparmesan.com/anti-aliasing-fundamentals-for-pixel-artists),
  [Derek Yu](https://www.derekyu.com/makegames/pixelart.html))

### Banding and pillow shading
- Never stack same-length segments in parallel.
- Shade from the light, not inward from the outline.
- On curves, steps shrink toward a corner and grow again.
- Break "imaginary squares" (neighbouring pixels forming accidental blocks)
  by staggering them like bricks.
  ([Pixel Parmesan](https://pixelparmesan.com/anti-aliasing-fundamentals-for-pixel-artists),
  [Fundamentals 2](https://saint11.art/img/pixel-tutorials/Fundamentals2.gif))

### Detail by distance
- Detail and contrast fall off with distance.

### Restraint
- "The beauty of pixel art comes from the lack of information."
  ([Slynyrd 47](https://www.slynyrd.com/blog/2023/11/26/pixelblog-47-tiny-pixels))

## The ten rules for Reel It In

1. **One key light, upper left, warm,** for every asset; lit faces take the
   warm end of a ramp, shadows the cool end.
2. **Every ramp hue-shifts** about 15–20° a step: shadows toward blue or
   purple, lights toward yellow. Saturation highest mid-ramp.
3. **Metal is the exception:** cold, desaturated lights; warm, saturated
   darks.
4. **4–6 shades per material, shared across materials.**
   - Dock wood, bark and cattail heads share one brown ramp.
   - Distant hills and far trees reuse sky bands.
5. **Atmospheric perspective plane by plane.**
   - The far bank, hills and sky lose saturation and contrast toward the sky.
   - Only the dock and the actors get full contrast.
   - Only actors get the outline.
6. **No noise dither.**
   - Ordered dither only for sky and water-depth gradients.
   - Rough dither only for foam, sand sparkle and mud.
7. **Cluster size follows distance:** 2–4 px clusters near, 1–2 px far; no
   lone pixels except deliberate glints.
8. **Texture by suggestion:** a few planks' grain, a few stones, a few scales,
   a few tufts of fur; calm areas inside, detail on the edges.
9. **Water moves by rule.**
   - Glints move at most 1 px a frame, and each ripple is one chunk.
   - Reflections are flipped, shortened, darker and broken by horizontal
     gaps.
   - Waterfalls go bright mouth, darkening bands, particle splash.
   - Underwater things sway in a sine wave.
10. **Anti-aliasing by hand, inside sprites only,** and every curve checked
    for banding, pillow shading and accidental squares.
