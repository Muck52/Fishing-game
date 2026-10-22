# Waterfalls

Research for study 3: what a real north-woods waterfall looks like, and how
good pixel art draws and animates one.

## The real thing

**Forms** (from [Wikipedia's list of waterfalls by type](https://en.wikipedia.org/wiki/List_of_waterfalls_by_type),
[World of Waterfalls](https://www.world-of-waterfalls.com/what-types-of-waterfalls-are-there/),
the [Finnish waterfall guide](https://www.suomenvesiputoukset.fi/en_GB/waterfalls/waterfall-types/)
and [WTA's field guide](https://www.wta.org/go-outside/seasonal-hikes/spring-destinations/waterfall-field-guide-hike-4-types-of-falls)):

- **Plunge:** the water leaves the rock and falls free.
- **Horsetail:** the water stays in contact with the rock face, usually
  narrow and steep.
- **Cascade:** the water runs down a slope or a series of rock steps.
- **Segmented:** the flow splits into two or more threads, often around a
  rib of rock; low water thins them, high water merges them.
- **Tiered:** a series of drops close together, each often with its own
  pool.

**Up north:** the North Shore's falls run over dark basalt ledges laid down
by lava flows and carved by glaciers ([MNopedia on Gooseberry Falls](https://www.mnhs.org/mnopedia/search/index/place/gooseberry-falls-state-park));
in spring the water is described as "root-beer-colored"
([MPR News](https://www.mprnews.org/story/2022/04/18/plentiful-precipitation-has-north-shore-waterfalls-roaring)).
Most are tiered falls and cascades over ledges, not tall free plunges, and
they're framed by cedar and pine ([Midwest Weekends](https://midwestweekends.com/plan-a-trip/nature/waterfalls/waterfalls-north-shore-minnesota/)).

**What the eye sees:**
- The river comes **from somewhere**: through a notch at the top, a smooth,
  glassy tongue of dark water bending over the lip, then breaking white.
- Falling water **widens** a little and breaks up; it's whiter the further
  it falls, with amber only where it's thin, near the lip.
- Aerated water is white, and its **shadows take the sky's blue**; deep
  water at the foot is dark and reflects the sky in its ripples.
- The rock beside the water is **dark and wet**, with moss and ferns kept
  green by the spray.
- The pool sits at the **bottom**, at the level of the ground; the river
  leaves it as a short, wide run of riffles.

## In pixel art

- [Slynyrd's Pixelblog 10, *Water in motion*](https://slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion):
  three parts, **the mouth, the flow and the splash**. The mouth, where the
  water spills over, is the brightest part with the most reflections; the
  flow shows movement with **bands that sag and darken as they move down,
  then break apart near the bottom**; the splash has to **loop in sync with
  the flow**.
- [An itch.io devlog on looping waterfalls](https://itch.io/devlog/681218/devlog-06-improving-the-waterfall-loops.amp):
  4 frames, the ripples all **moving down the same 3 px a frame** so the
  loop is seamless; the foamy top and the plumes at the bottom are worked
  out as **separate elements**; small ripples, not chunky ones, so the
  falls stays calm.

## What we take from it

1. A mouth: the river visible at the top, a glassy line at the lip.
2. A flow: vertical streaks plus sagging bands of light, 3 px a frame over
   a 12-row period (four frames loop), whiter as it falls, a thin veil at
   the edges where the rock shows through.
3. A splash: round puffs of foam, lit from the upper left, swelling and
   sinking in turn, and spray above them.
4. Water is white with blue shadows, amber only where thin; deep water is
   dark with sky in its ripples. Brown on its own reads as wood.
5. Wet, dark rock hugging the water, moss on its rims; the pool at the
   foot at ground level; a short outflow to the lake.
