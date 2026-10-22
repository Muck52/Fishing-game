# How other pixel games keep one look

Gathered 2026-10-22. Developers have written little about their art
pipelines. The best-sourced points are the tutorials (Slynyrd, Lospec) and
the interviews on Owlboy, Dave the Diver, Eastward, Octopath and Hyper
Light Drifter, plus 80.lv's piece on Moonlighter. "(excerpt)" marks a claim
taken from a search excerpt rather than the full page.

## Game by game

### Owlboy
- **Strict rules.** Simon Stafsnes Andersen wanted to show "pixel art done
  properly, using as few 'cheats' as possible… No gradient or blur
  effects, no tracing or 3D captures… as limited a palette as I could
  allow." ([Kill Screen](https://www.killscreen.com/owlboy/))
- **One exception: rotation.** "The only thing that we've had to do is
  allow rotations, but I'm just going to have to accept that." Even a
  purist team gave way on rotation.
- **They kept redrawing.** The team restyled and redrew assets over nine
  years so the whole game stayed current (excerpt;
  [Goodreads](https://www.goodreads.com/author_blog_posts/13840274),
  [GDC 2017 talk](https://www.gamedeveloper.com/audio/20-talks-gamasutra-wants-to-see-at-gdc-2017-from-sex-scenes-to-grouchy-fish)).

### Celeste
- **Paint high, pixel down.** Amora Bettany's concept and high-resolution
  art is "later pixelated by her partner Pedro Medeiros or used in game as
  it is" ([Wikipedia](https://en.wikipedia.org/wiki/Amora_Bettany)).
- **Shared tips.** Medeiros's weekly animated pixel-art tips make a good
  shared reference
  ([itch.io](https://itch.io/jam/heartjam/topic/208072/pixel-art-tips-by-celestes-designer)).

### Hyper Light Drifter
- **Colour and silhouette above everything.** Alx Preston thinks about
  colour and silhouette "more than anything," so things read at low
  resolution.
- **Constraints on purpose.** The resolution limits were chosen
  deliberately: "creative solutions are born from constraints."
- Source: [Automaton](https://automaton-media.com/articles/interviewsjp/20170525-47328/)

### Eastward
- **Pixel art plus 3D lighting.** Retro pixel art lit by a modern 3D
  lighting system ([IGF](https://igf.com/eastward)).
- **References.** It looks to 90s anime and to real places such as Kowloon
  Walled City.
- **Tools that free the artists.** Aseprite for animation, Photoshop for
  design, and in-house tools that automate the asset pipeline "so artists
  could focus more on their creations"
  ([Game Developer](https://www.gamedeveloper.com/disciplines/road-to-the-igf-pixpil-s-i-eastward-i-)).

### Sea of Stars
- **Day/night is the headline.** Dynamic "Radiant Lighting" tied to a
  day/night cycle
  ([Sabotage](https://sabotagestudio.com/press-release/sea-of-stars-the-highly-anticipated-turn-based-rpg-from-sabotage-studio-primed-for-playstation-consoles-in-2023/)).
- **How it's lit.** Sprites with normal maps, shadows and volumetric light
  (excerpt).
- **Lights colour the characters.** Characters pick up coloured
  highlights, and small pose changes carry the expression
  ([Megavisions](https://megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels)).

### Dave the Diver
- **Why they went 3D.** Flat 2D pixel underwater "was not that
  aesthetically pleasing," so 3D background objects were added for depth
  ([Game Developer](https://www.gamedeveloper.com/design/dave-the-diver)).
- **One feature per fish.** Each fish keeps its single most recognisable
  feature.
- **Light from above.** Light filtering down from the surface is what
  reviewers remember
  ([Shacknews](https://shacknews.com/article/136261/dave-the-diver-review-score)).

### Cast n Chill, the closest game to ours
- **Who draws it.** A two-person studio whose artists trained in landscape
  painting: realistic Canadian landscapes reduced to simple pixel shapes,
  "glassy reflections" on the water
  ([Qualbert](https://www.qualbert.com/reviews/cast-n-chill-review/)).
- **The light moves with the day.** "The quality of the light changed
  through the course of the day"
  ([Aftermath](https://aftermath.site/cast-n-chill-demo/),
  [The Magic Rain](https://themagicrain.com/2025/06/cast-n-chill-is-a-pixel-perfect-idle-fishing-game-game-review/)).
- **No AI art.** They hired one pixel artist for landscapes and animals and
  ruled out AI art
  ([Work With Indies](https://workwithindies.com/careers/wombat-brawler-pixel-artist)).

### Octopath Traveler, for contrast
- **Why HD-2D.** Lighting on flat 2D wasn't enough, so they added 3D.
- **Too much detail.** Pushing detail too far "turns into a pretty
  picture" and loses the pixel feel; thick pixels just for nostalgia looked
  worse ([Nintendo Everything](https://nintendoeverything.com/octopath-traveler-devs-on-character-origins-visual-style-initial-hd-rumble-plans-much-more/)).
- **The lesson.** Every style needs a cap on how much detail each element
  gets.

### Blasphemous, Moonlighter, Dead Cells
- **Blasphemous.** It avoided fancy shaders. The art director sets the
  vision and the team iterates on sketches until they reach the bar
  (excerpt; [Heavy](https://heavymag.com.au/interview-blasphemous-the-game-kitchen/)).
- **Moonlighter.** Night light is faked by layering sprites, not dynamic
  lights ([80.lv](https://80.lv/articles/moonlighter-building-pixel-art-preparing-for-switch/)).
- **Dead Cells.** A saturated palette keeps the player alert and pulls the
  eye to what's new
  ([GoNintendo](https://gonintendo.com/archives/280488)).

### Mark Ferrari's colour cycling
- **One picture, moving water.** Rain, waterfalls, fog and lakes move by
  cycling palette entries in one flat 256-colour image.
- **One picture through the day.** His "Living Worlds" re-lights the same
  scene through the day by swapping palettes
  ([80.lv](https://80.lv/articles/color-cycling-from-the-90s-returns-with-html5),
  [Living Worlds](https://www.effectgames.com/demos/worlds/)).

### Stardew Valley, Terraria, Chicory
- **Stardew Valley.** Barone redrew most of the art several times as he
  learned ([Wikipedia](https://en.wikipedia.org/wiki/Stardew_Valley)).
  Lesson: when early art stops matching, redraw it.
- **Terraria.** When updates re-sprited only some assets, players said the
  mix looked "like a weird texture pack"
  ([Steam](https://steamcommunity.com/app/105600/discussions/0/3544924290417739524)).
  Lesson: **a half-done restyle looks worse than either style alone**.
- **Chicory.** Each region gets four locked colours
  ([Edge](https://www.pressreader.com/australia/edge/20210617/283626763003629)).

## Technique sources

### Palette ramps (Slynyrd)
- Shift the hue about 20° per swatch, warmer as colours get lighter.
- Keep saturation highest in the middle of a ramp.
- Avoid colours that are both very saturated and very bright.
- Keep some desaturated neutrals; "a little color goes a long way."
- Source: [Slynyrd Pixelblog 1](https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes)

### Landscapes (Slynyrd)
- Build the scene in horizontal bands.
- Each band farther back is lighter, less saturated and closer in hue to
  the sky.
- The farthest range reuses a sky colour, with a haze band at the foot of
  the mountains.
- Texture shrinks with distance: blades near, 1–2 px clusters in the
  middle, flat at the back.
- About 15 colours reused across all the bands.
- Source: [Slynyrd Pixelblog 62](https://www.slynyrd.com/blog/2026/5/27/pixelblog-62-landscape-backgrounds)

### Outlines (Lospec)
- An outline should always increase contrast.
- Selective outlining: darker on the shadow side, lighter on the lit side.
- Inner lines take the colour of the nearer part.
- Always check at 1x.
- Source: [Lospec](https://lospec.com/articles/pixel-art-outlines-part-2-using-color)

### Mixels (mixed pixel sizes)
- One grid everywhere. Choose the resolution early and never mix pixel
  sizes within a layer.
- Sources: [ModDB](https://www.moddb.com/features/guard-duty-a-development-retrospective-dev-diary-4),
  [Flowlab](https://community.flowlab.io/t/mini-rant-stop-using-mixels/38287)

### Style guides and critique
- **Guides.** Pictures over prose, do/don't pairs, hex codes, a short rule
  list ([Bugnet](https://bugnet.io/blog/how-to-write-an-art-style-guide)).
- **Reviews.** Check new art against the guide after milestones and scrap
  what doesn't fit
  ([Wayline](https://www.wayline.io/blog/top-earning-indie-games-consistent-art)).
- **Good critique** is specific and fixable: "the outline goes from 3–4 px
  to 1", "the light on this tile doesn't match"
  ([Polycount](https://polycount.com/discussion/comment/1762426)).

## What it means for Reel It In

1. **One pixel grid, no exceptions in the scenery.** Redraw pack art at
   size; never enlarge it. Rotation only where it's earned (RotSprite, as
   now).
2. **Finish the restyle.** Terraria shows a half-restyled game looks worse
   than either style. Recolouring a pack asset isn't enough; its clusters,
   line weight and texture density carry the pack's "handwriting".
3. **Hue-shifted ramps** for every material. Darks lean plum-blue toward the
   outline, lights warm. Desaturated neutrals for rock, wood and the hut;
   saturated accents saved for creatures, fish and the interface.
4. **Figure and ground.** Creatures outlined, scenery not, and scenery
   never darker than the outline or more saturated than the creatures in
   front of it.
5. **Depth in bands.** Sky, distant hills (sky colours, haze at the base),
   far bank (1–2 px texture), the lake, the dock (full detail), and
   underwater with its own haze toward blue-green.
6. **Time of day through palettes** rather than one tint over everything,
   with colour cycling for the waterfall, ripples and reflections. Glows
   drawn in palette colours.
7. **One light:** upper left by day; the hut and lanterns as warm second
   lights at night; underwater, light from above.
8. **Fish and creatures:** silhouette first, one signature feature.
9. **Animation:** a fixed frame budget; smears only on fast moments (the
   cast, the strike, the splash); a secondary motion on every creature.
10. **Interface from the world's materials:** panels in the scenery's wood
    ramps, the font on the same grid.
11. **Process:** a "golden scene" (one finished screen everything is judged
    against), regular critiques at 1x and at phone size, a reference board,
    and every asset tracked as pack-original, recoloured, redrawn or
    approved.

## Outline for our style bible

Vision and pillars; the canvas and grid; the palette and its ramps; time
of day; light and shading; lines and edges; depth and layers; characters
and creatures; fish; the environment kit; animation; effects; interface;
the policy for outside art; the workflow and review checklist; and a
do/don't gallery of before-and-after redraws.
