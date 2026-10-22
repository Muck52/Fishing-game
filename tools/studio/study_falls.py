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

def mouth(c, x0, x1, y, seed=0, river=True):
    """The river at the top, coming over the lip: a dark smooth band, a
    bright glassy line where it bends over the edge, then the first white.
    river=False: water pouring over a lower ledge, only the glassy bend."""
    def draw(g, f):
        rnd = random.Random(seed * 3 + f)
        for x in range(x0, x1 + 1):
            if river:
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
                elif band == 0 and v > 1:
                    g(x, y, "whitewater", 3)  # a band of light sagging across the sheet, broken by the streaks
                elif band == 1 and v == 3:
                    g(x, y, "whitewater", 3)
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

def front_rock(c, pts, mat="pink-granite", seed=0, moss=0.0):
    """A piece of the bluff in front of the water (a shoulder at the notch,
    a jut along the edge, a boulder at the foot): drawn into the bank and
    listed so the water is hidden behind it."""
    m = b.poly_mask(pts)
    b.pillow(c, m, mat, seed=seed, flecks=len(m) > 60)
    if len(m) > 400:
        b.facets(c, m, mat, seed=seed)
    rnd = random.Random(seed)
    for x, y in m:
        if (x, y - 1) not in m and rnd.random() < moss:
            c.put(x, y, "moss", 3)
            c.put(x, y + 1, "moss", 2)
    c.front |= m


def carve(c, pts):
    """Cuts the bluff back where the river has worn its channel: the forest
    behind shows through."""
    for x, y in b.poly_mask(pts):
        p = c.at(x, y)
        if p and p[0] in ("pink-granite", "lichen", "moss", "basalt"):
            c.put(x, y, "spruce-needles", 1 if (y // 9) % 2 == 0 else 0)


def shelf(c, x0, x1, y, depth=5, seed=0):
    """One of the bluff's own ledges, running into the rock either side of
    the falls: a lit top edge, a calm face, a ragged shadow under the
    overhang. It thins toward its ends and fades into the rock."""
    rnd = random.Random(seed)
    mid = (x0 + x1) / 2
    for x in range(x0, x1 + 1):
        u = abs(x - mid) / ((x1 - x0) / 2)  # 0 middle, 1 ends
        d = max(1, round(depth * (1 - u ** 2)) + rnd.randrange(-1, 2))
        yy = y + round(u * 2) + (1 if rnd.random() < 0.15 else 0)
        if u > 0.85 and rnd.random() < 0.5:
            continue
        c.put(x, yy, "pink-granite", 4 if u < 0.6 else 3)
        for k in range(1, d):
            c.put(x, yy + k, "pink-granite", 3 if k == 1 and u < 0.5 else 2)
        if u < 0.8:
            c.put(x, yy + d, "pink-granite", 0 if rnd.random() < 0.7 else 1)


def wet(c, region, reach=5, seed=0):
    """The rock next to the water stays wet: darker the closer it is, a
    glint here and there, moss and small ferns where the spray falls."""
    rnd = random.Random(seed)
    xs = {}
    for x, y in region:
        lo, hi = xs.get(y, (x, x))
        xs[y] = (min(lo, x), max(hi, x))
    for y, (lo, hi) in xs.items():
        for x in list(range(lo - reach, lo)) + list(range(hi + 1, hi + reach + 1)):
            p = c.at(x, y)
            if not p or p[0] not in ("pink-granite", "basalt", "lichen"):
                continue
            d = min(abs(x - lo), abs(x - hi))
            darker = 2 if d <= 2 else 1
            c.put(x, y, p[0] if p[0] != "lichen" else "pink-granite", max(0, p[1] - darker))
            if d <= 2 and rnd.random() < 0.03:
                c.put(x, y, p[0], 4)
            if d in (3, 4) and rnd.random() < 0.05:
                b.blob(c, x, y, rnd.randrange(1, 3), "moss", steps=(3, 2, 1, 0), rnd=rnd, flat=0.7)


def water_cells(c):
    """Every pixel the water covers in any frame."""
    cells = set()

    def g(x, y, mat, s):
        cells.add((x, y))
    for draw in c.water:
        for f in range(b.FRAMES):
            draw(g, f)
    return cells


def falls_a(c):
    """Tiered cascade, cut into the bluff: the river comes down a notch worn
    into the bluff's top, between rock shoulders that overlap it, and drops
    down three of the bluff's own ledges, each tier stepping sideways and
    widening; rock juts into its edges; at the foot it boils among
    boulders into a pool, and runs out between stones to the lake."""
    # the bluff is carried further left here, so the falls sits in the rock
    buttress = [(170, 292), (168, 240), (172, 196), (182, 168), (192, 156), (200, 152), (200, 292)]
    front_rock(c, buttress, seed=60)
    c.front -= b.poly_mask(buttress)
    # the channel the river has worn into the bluff's top
    carve(c, [(186, 140), (216, 140), (212, 152), (206, 158), (196, 158), (190, 152)])
    # the three tiers, each stepping sideways: the river over the lip, then
    # down the ledges, foam where each lands
    mouth(c, 194, 208, 158, seed=1)
    curtain(c, (194, 208), (193, 210), 159, 189, seed=2)
    splash(c, 201, 191, 9, seed=3, height=4)
    mouth(c, 189, 207, 194, seed=21, river=False)
    curtain(c, (189, 207), (187, 208), 194, 226, seed=4)
    splash(c, 197, 229, 11, seed=5, height=5)
    mouth(c, 190, 213, 232, seed=22, river=False)
    curtain(c, (190, 213), (186, 215), 232, 276, seed=6)
    splash(c, 200, 280, 14, seed=7, height=8)
    pool(c, 200, 285, 16, 4, seed=8)
    outflow(c, (195, 207), (192, 212), BEACH + 1, 305, seed=9)
    wet(c, water_cells(c), seed=10)
    # the ledges are the bluff's own: they run on into the rock either side
    shelf(c, 178, 226, 191, seed=11)
    shelf(c, 174, 228, 229, depth=6, seed=12)
    # the shoulders of the notch, overlapping the ends of the lip
    front_rock(c, [(184, 150), (190, 146), (196, 154), (196, 162), (192, 172), (186, 170)], seed=13, moss=0.3)
    front_rock(c, [(206, 156), (212, 148), (220, 146), (222, 160), (214, 170), (208, 166)], seed=14, moss=0.3)
    # rock jutting into the falls' edges, so they're never straight
    front_rock(c, [(186, 176), (193, 174), (195, 182), (190, 186)], seed=15)
    front_rock(c, [(208, 200), (212, 198), (213, 210), (209, 214)], seed=23)
    front_rock(c, [(184, 204), (189, 202), (191, 212), (186, 216)], seed=24)
    front_rock(c, [(211, 244), (216, 238), (219, 248), (213, 256)], seed=16)
    front_rock(c, [(183, 252), (189, 248), (190, 260), (185, 264)], seed=17)
    # boulders at the foot, the splash boiling up behind them
    front_rock(c, [(176, 292), (178, 282), (186, 276), (193, 280), (195, 292)], "grey-gneiss", seed=18, moss=0.2)
    front_rock(c, [(206, 292), (208, 280), (216, 276), (224, 281), (226, 292)], seed=19, moss=0.2)
    # stones the outflow runs between on its way across the beach
    for k, (x, y) in enumerate([(190, 298), (209, 296), (193, 304), (211, 303)]):
        front_rock(c, [(x - 4, y + 3), (x - 3, y - 1), (x, y - 3), (x + 3, y - 1), (x + 4, y + 3)], "grey-gneiss", seed=30 + k)
    c.foot = (200, 276)


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
