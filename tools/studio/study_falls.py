"""Study 3: the waterfall.

The falls from study 2 looked unnatural: a straight column of even width out
of a square hole, no river above it, stopping halfway down the cliff, its
stream sliding down the rock like a ramp. This study redraws it three ways,
in the birch cove (study 2, version C), after the research in
docs/studio/research/waterfalls.md:

- **A, tiered cascade:** the North Shore look (Gooseberry Falls): the river
  comes through a notch in the bluff and drops down three basalt ledges,
  each drop a little wider, a burst of foam at each step.
- **B, plunge from a notch:** one tall drop, the water leaving the rock at a
  glassy lip, widening as it falls and breaking into strands, into a
  boiling pool at the foot.
- **C, segmented horsetail:** the flow splits round a rib of rock into a
  main strand and a thin one, both staying on the rock face (a horsetail),
  churning white, and fanning out where they meet the pool.

Every version keeps to the rules from the research: a mouth (the river at
the top, glassy and the brightest part), a flow (vertical streaks, with
bands of light that sag in the middle and run down 3 px a frame, the
water whiter as it falls), and a splash (puffs of foam that loop with the
flow); the rock beside the water dark and wet, moss and ferns along its
edges; the pool at the foot, at the level of the beach, and a short, wide
outflow across the beach to the lake.

    python3 tools/studio/study_falls.py   -> docs/studio/studies/03-falls/
"""
import json
import math
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import study_bank as b  # noqa: E402

OUT = b.ROOT / "docs" / "studio" / "studies" / "03-falls"
BEACH = 289  # the top of the sand
POOL_Y = 283


# ---------------------------------------------------------------- the rock round the falls

def gorge(c, top, bottom, y0, y1, seed=0, margin=(3, 6)):
    """The recess the water has cut, hugging the falls: dark, wet basalt a
    few pixels either side of the water, its edges ragged, with moss and
    small ferns along the rims where the spray keeps them green."""
    rnd = random.Random(seed)
    pts_l, pts_r = [], []
    for y in range(y0 + 1, y1 + 1, 4):
        t = max(0, (y - y0) / max(1, y1 - y0))
        l = top[0] + (bottom[0] - top[0]) * t - rnd.randrange(*margin)
        r = top[1] + (bottom[1] - top[1]) * t + rnd.randrange(*margin)
        pts_l.append((round(l), y))
        pts_r.append((round(r), y))
    outline = pts_l + pts_r[::-1]
    m = b.poly_mask(outline)
    b.pillow(c, m, "basalt", seed=seed, flecks=False, soft=0.6)
    for x, y in m:
        p = c.at(x, y)
        if p and p[1] > 1 and rnd.random() < 0.6:
            c.put(x, y, "basalt", p[1] - 1)  # wet: darker
        if rnd.random() < 0.015:
            c.put(x, y, "basalt", 4)  # a glint of wet rock
    for x, y in m:
        if ((x - 1, y) not in m or (x + 1, y) not in m) and rnd.random() < 0.2:
            b.blob(c, x + (-1 if (x - 1, y) not in m else 1), y, rnd.randrange(1, 3), "moss",
                   steps=(3, 2, 1, 0), rnd=rnd, flat=0.8)


def ledge(c, x0, x1, y, seed=0):
    """A basalt step the water falls from: a lit top, a dark underside."""
    pts = [(x0, y + 4), (x0 + 2, y), (x1 - 2, y - 1), (x1, y + 3), (x1, y + 6), (x0, y + 7)]
    m = b.poly_mask(pts)
    b.pillow(c, m, "basalt", seed=seed, flecks=False)


def notch(c, x0, x1, y, seed=0):
    """Where the river comes through the bluff: the rock cut back in a V,
    the forest showing behind it."""
    for x in range(x0 - 6, x1 + 7):
        d = abs(x - (x0 + x1) / 2) - (x1 - x0) / 2
        cut = y - (0 if d < 0 else int(d * 1.4))
        for yy in range(cut - 30, cut):
            p = c.at(x, yy)
            if p and p[0] in ("pink-granite", "lichen", "moss", "spruce-needles", "white-pine-bark"):
                c.put(x, yy, "spruce-needles", 1 if (yy // 9) % 2 == 0 else 0)


# ---------------------------------------------------------------- the water

def mouth(c, x0, x1, y, seed=0):
    """The river at the top, coming over the lip: a dark smooth band, a
    bright glassy line where it bends over the edge, then the first white."""
    def draw(g, f):
        rnd = random.Random(seed * 3 + f)
        for x in range(x0, x1 + 1):
            g(x, y - 3, "deepwater", 1)
            g(x, y - 2, "deepwater", 2 if (x + f) % 5 else 3)
            g(x, y - 1, "deepwater", 4 if (x - f) % 4 else 3)  # the glassy bend
            g(x, y, "whitewater", 3 if rnd.random() < 0.7 else 2)
    c.water.append(draw)


def curtain(c, top, bottom, y0, y1, seed=0, gaps=(), slope=0.0, churn=0.0):
    """A falling sheet from row y0 to y1, its edges going from top (l, r) to
    bottom (l, r). Vertical streaks; bands of light that sag in the middle
    and run down 3 px a frame (12-row period, so four frames loop); amber
    where it's thin near the top, whiter as it falls; edges a thin veil the
    rock shows through. gaps: (x, from_y) columns where the sheet splits
    into strands. slope: the sheet leans this many px per row (a horsetail
    following the rock). churn: share of foam clusters (water on rock)."""
    cols = {x: b.streaks(seed * 31 + x) for x in range(min(top[0], bottom[0]) - 30, max(top[1], bottom[1]) + 30)}

    def draw(g, f):
        rnd = random.Random(seed * 7 + f)
        for y in range(y0, y1 + 1):
            t = (y - y0) / max(1, y1 - y0)
            sh = round((y - y0) * slope)
            wob = random.Random(seed * 13 + (y - 3 * f) // 3)
            l = round(top[0] + (bottom[0] - top[0]) * t) + sh + (wob.randrange(-1, 1) if t > 0.05 else 0)
            r = round(top[1] + (bottom[1] - top[1]) * t) + sh + (wob.randrange(0, 2) if t > 0.05 else 0)
            mid, half = (l + r) / 2, max(1, (r - l) / 2)
            for x in range(l, r + 1):
                if any(x - sh == gx and y >= gy for gx, gy in gaps):
                    continue
                if any(abs(x - sh - gx) == 1 and y >= gy + 3 and (y + f) % 2 for gx, gy in gaps):
                    continue  # the strands' inner edges thin to a veil
                edge = x in (l, r)
                if edge and (y + f) % 2:
                    continue  # the veil at the edge: the wet rock shows through
                v = cols.get(x - sh, [2] * 12)[(y - 3 * f) % 12]
                sag = round(2.5 * (1 - ((x - mid) / half) ** 2))
                band = (y - 3 * f - sag) % 12
                if churn and rnd.random() < churn:
                    g(x, y, "whitewater", rnd.randrange(1, 4))
                elif band == 0:
                    g(x, y, "whitewater", 3)  # a band of light sagging across the sheet
                elif band == 1:
                    g(x, y, "whitewater", 2)
                elif v < 3 and (y - y0) < 4 + (x * 7 % 5) * 2:
                    g(x, y, "tannin", 4 if v == 2 else 3)  # thin, glassy amber streaks just over the lip
                elif edge:
                    g(x, y, "whitewater", 1)
                else:
                    g(x, y, "whitewater", {1: 1, 2: 2, 3: 3}[v])
    c.water.append(draw)


def splash(c, cx, y, half, seed=0, height=6):
    """Where the water lands: puffs of foam, each lit as a round shape from
    the upper left, swelling and sinking in turn so they loop with the flow,
    and spray thrown up above them."""
    rnd0 = random.Random(seed)
    puffs = [(cx - half + k * 4 + rnd0.randrange(-1, 2), rnd0.randrange(4)) for k in range(half // 2 + 1)]

    def draw(g, f):
        rnd = random.Random(seed * 17 + f)
        for px, ph in puffs:
            r = [2, 3, 3, 2][(f + ph) % 4] + (1 if abs(px - cx) < half / 2 else 0)
            py = y - r + 1
            for yy in range(py - r, py + r + 1):
                for xx in range(px - r, px + r + 1):
                    d = math.hypot(xx - px, yy - py)
                    if d > r + 0.3:
                        continue
                    u = ((xx - px) * -0.6 + (yy - py) * -0.8) / r
                    g(xx, yy, "whitewater", 3 if u > 0.3 else 2 if u > -0.4 else 1)
        for _ in range(half):
            g(cx + rnd.randrange(-half - 2, half + 3), y - rnd.randrange(3, height + 5), "whitewater", 3)
    c.water.append(draw)


def pool(c, cx, y, rx, ry, seed=0):
    """The pool at the foot: dark water, rings of foam spreading out from
    the splash, frame by frame."""
    def draw(g, f):
        for yy in range(y - ry, y + ry + 1):
            for xx in range(cx - rx, cx + rx + 1):
                d = math.hypot((xx - cx) / rx, (yy - y) / ry)
                if d > 1:
                    continue
                ring = (d * 8 - f * 0.75) % 3
                if d > 0.85:
                    g(xx, yy, "deepwater", 0)  # the dark edge where it meets the stones
                elif ring < 0.45 and d > 0.25:
                    g(xx, yy, "whitewater", 2 if yy < y else 1)
                else:
                    g(xx, yy, "deepwater", 1 if (xx + yy) % 7 else 2)
    c.water.append(draw)


def outflow(c, x0, x1, y0, y1, seed=0):
    """The short, wide outflow across the beach to the lake: dark water,
    riffles that catch the sky's blue sliding toward the lake, a wet edge."""
    rnd0 = random.Random(seed)
    riffles = [(rnd0.randrange(0, 12), rnd0.uniform(0, 1), rnd0.randrange(2, 4)) for _ in range(14)]

    def draw(g, f):
        for y in range(y0, y1 + 1):
            t = (y - y0) / max(1, y1 - y0)
            l = round(x0[0] + (x1[0] - x0[0]) * t)
            r = round(x0[1] + (x1[1] - x0[1]) * t)
            for x in range(l, r + 1):
                g(x, y, "whitewater" if x in (l, r) and (x + y) % 2 else "deepwater", 1 if x > l + 1 else 3)
        for ph, u, n in riffles:
            y = y0 + (ph * 2 + 3 * f) % (y1 - y0 + 1)
            t = (y - y0) / max(1, y1 - y0)
            l = x0[0] + (x1[0] - x0[0]) * t
            r = x0[1] + (x1[1] - x0[1]) * t
            x = round(l + 1 + u * (r - l - 3))
            for k in range(n):
                g(x + k, y, "whitewater" if k == 0 else "deepwater", 3 if k == 0 else 4)
    c.water.append(draw)


# ---------------------------------------------------------------- the versions

def falls_a(c):
    """Tiered cascade: three drops down basalt ledges."""
    gorge(c, (189, 205), (181, 213), 148, 284, seed=31)
    notch(c, 188, 206, 150)
    ledge(c, 180, 212, 186, seed=32)
    ledge(c, 178, 214, 224, seed=33)
    mouth(c, 189, 205, 150, seed=1)
    curtain(c, (190, 204), (188, 206), 151, 186, seed=2)
    splash(c, 197, 188, 9, seed=3, height=4)
    curtain(c, (187, 207), (185, 209), 190, 224, seed=4)
    splash(c, 197, 226, 11, seed=5, height=5)
    curtain(c, (184, 210), (181, 213), 228, 278, seed=6)
    splash(c, 197, 282, 15, seed=7)
    pool(c, 197, POOL_Y + 2, 20, 5, seed=8)
    outflow(c, (186, 208), (190, 218), BEACH + 1, 305, seed=9)
    c.foot = (197, 280)


def falls_b(c):
    """Plunge from a notch: one tall drop, breaking into strands."""
    gorge(c, (190, 203), (183, 211), 148, 284, seed=41)
    notch(c, 189, 204, 150)
    mouth(c, 190, 203, 150, seed=1)
    curtain(c, (192, 201), (186, 207), 151, 278, seed=12, gaps=((195, 214), (201, 240)))
    splash(c, 197, 282, 17, seed=13, height=10)
    pool(c, 197, POOL_Y + 2, 21, 5, seed=14)
    outflow(c, (186, 208), (190, 218), BEACH + 1, 305, seed=15)
    c.foot = (197, 278)


def falls_c(c):
    """Segmented horsetail: two strands on the rock face, split by a rib of
    rock, fanning out at the pool."""
    gorge(c, (186, 208), (178, 211), 150, 284, seed=51)
    notch(c, 186, 208, 152)
    # the rib of rock that splits the flow, lit on its left
    rib = b.poly_mask([(200, 160), (204, 158), (206, 200), (203, 240), (199, 236)])
    b.pillow(c, rib, "basalt", seed=52, flecks=False)
    mouth(c, 187, 207, 152, seed=1)
    curtain(c, (188, 198), (180, 196), 153, 270, seed=22, slope=-0.04, churn=0.25)
    curtain(c, (205, 208), (204, 210), 153, 262, seed=23, slope=-0.02, churn=0.2)
    splash(c, 192, 280, 14, seed=24, height=6)
    splash(c, 205, 266, 4, seed=25, height=3)
    pool(c, 196, POOL_Y + 2, 20, 5, seed=26)
    outflow(c, (186, 208), (190, 218), BEACH + 1, 305, seed=27)
    c.foot = (194, 278)


VERSIONS = {"A": falls_a, "B": falls_b, "C": falls_c}


def export(name, waterfall):
    land, strip, anchors = b.images(b.version_c(waterfall))
    OUT.mkdir(parents=True, exist_ok=True)
    land.save(OUT / f"{name}-land.png")
    strip.save(OUT / f"{name}-falls.png")
    (OUT / f"{name}.json").write_text(json.dumps(anchors) + "\n")


if __name__ == "__main__":
    export("now", b.falls_now)
    for name, fn in VERSIONS.items():
        export(name, fn)
        print(name)
