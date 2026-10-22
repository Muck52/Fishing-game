"""Study 2: the far bank.

Three versions of everything between the distant hills and the water (the
trees, the rock, the shore the animals walk along, the waterfall and its
stream), drawn on the game's grid from the materials library, and shown in
the game itself: the headless browser swaps them in for the pack's bank.

    python3 tools/studio/study_bank.py        -> docs/studio/studies/02-bank/

What every version keeps, so the game still works:
- a flat shore along the left, its top at the water (y 302), where the
  deer, fox, hare and bear come down to drink;
- the waterfall left of the hut, its foot near (200, 214) where the mist
  and spray rise, and its water drawn on its own layer, four frames, so
  it can run;
- nothing that matters behind the hut (x 216 on).

Light comes from the upper left, as everywhere in the materials library;
each shape is lit as one mass (a rim of light on its top and left, shade
on its bottom and right, one calm mid tone between), texture only where
the light turns.
"""
import json
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from materials import ramp, ramps, lit, lerp, rgb, sky_bands  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "studio" / "studies" / "02-bank"
W, H = 360, 324  # the screen's width; the bank image's height
BACK_X = 150  # the bank image is 576 wide and drawn from x = -150
SHORE = 302  # where the bank meets the water, and the animals stand
FRAMES = 4


def materials(time="day"):
    R = ramps()
    R["tannin"] = ramp("#7d5634", 5)  # root-beer water over dark rock
    R["foam"] = ramp("#e6dcc2", 4)  # cream foam
    R["pink-granite"] = ramp("#b08a7e", 5)  # weathered: greyer than the fresh rock
    R["clear"] = ramp("#8cc4d6", 5)  # white-blue water
    R["spray"] = ramp("#e4f0f2", 4)  # its white water
    R["moss"] = ramp("#5a7438", 4)
    R["floor"] = ramp("#3f4a2e", 4)  # forest floor, needles and shade
    R["cedar-foliage"] = ramp("#56763c", 5)
    R["snag"] = ramp("#8d8478", 4)  # a dead pine, silvered
    # farther trees take on the haze of the sky behind them
    horizon = sky_bands(time, 10)[-1]
    for mat in ("spruce-needles", "white-pine-needles", "aspen-leaves", "white-pine-bark"):
        for k, t in (("far", 0.28), ("farther", 0.45)):
            R[f"{mat}@{k}"] = [lerp(c, horizon, t) for c in R[mat]]
    return R


class Canvas:
    """A grid of (material, step), drawn back to front, and a separate
    water layer drawn once per frame."""

    def __init__(self, seed=1):
        self.g = [[None] * W for _ in range(H)]
        self.water = []  # functions (canvas grid, frame) drawing the water
        self.rnd = random.Random(seed)
        self.foot = (200, 214)

    def put(self, x, y, mat, step):
        if 0 <= x < W and 0 <= y < H:
            self.g[y][x] = (mat, step)

    def at(self, x, y):
        return self.g[y][x] if 0 <= x < W and 0 <= y < H else None


# ---------------------------------------------------------------- shapes

def poly_mask(pts):
    m = Image.new("1", (W, H))
    ImageDraw.Draw(m).polygon([tuple(p) for p in pts], fill=1)
    px = m.load()
    return {(x, y) for y in range(H) for x in range(W) if px[x, y]}


def under(top):
    """A mask from a top edge (a function of x, or None where empty) down to
    the bottom of the image."""
    out = set()
    for x in range(W):
        t = top(x)
        if t is not None:
            out |= {(x, y) for y in range(max(0, int(t)), H)}
    return out


def bevel(c, mask, mat, steps=(4, 3, 2, 1, 0), flecks=0, seed=0):
    """Lights a mass as one shape: its top rim brightest, its upper-left
    edge lit, its lower-right edge in shade and its underside darkest."""
    top, light, mid, shade, dark = steps
    rnd = random.Random(seed)
    for x, y in mask:
        if (x, y - 1) not in mask:
            s = top
        elif (x - 1, y) not in mask or (x - 1, y - 1) not in mask or (x, y - 2) not in mask:
            s = light
        elif (x, y + 1) not in mask or (x + 1, y + 1) not in mask and (x + 1, y) not in mask:
            s = dark
        elif (x + 1, y) not in mask or (x + 1, y + 1) not in mask or (x, y + 2) not in mask:
            s = shade
        else:
            s = mid
        c.put(x, y, mat, s)
    inner = [p for p in mask if all(q in mask for q in ((p[0] - 2, p[1]), (p[0] + 2, p[1]), (p[0], p[1] - 3), (p[0], p[1] + 2)))]
    for x, y in rnd.sample(inner, min(flecks, len(inner))):
        c.put(x, y, mat, dark)
        if rnd.random() < 0.5:
            c.put(x + 1, y, mat, shade)


def reach(mask, x, y, dx, dy, cap=14):
    """How far from (x, y) the mass goes on in direction (dx, dy)."""
    k = 0
    while k < cap and (x + dx * (k + 1), y + dy * (k + 1)) in mask:
        k += 1
    return k


def pillow(c, mask, mat, seed=0, flecks=True, soft=1.0):
    """Lights a rounded mass (rock worn smooth, a hump of ground) as one
    shape: lit toward its upper-left edges, shaded toward its lower-right,
    in a few wide bands that follow its outline, the top rim brightest."""
    rnd = random.Random(seed)
    for x, y in mask:
        a, b = reach(mask, x, y, -1, -1), reach(mask, x, y, 1, 1)
        u, d = reach(mask, x, y, 0, -1), reach(mask, x, y, 0, 1)
        v = 0.55 * (b - a) / (a + b + 1) + 0.45 * (d - u) / (d + u + 1)
        v *= soft
        if u == 0 and v > -0.2:
            s = 4
        elif u < 3 and v > -0.1 or v > 0.4:
            s = 3
        elif v > -0.15:
            s = 2
        elif v > -0.6:
            s = 1
        else:
            s = 0
        c.put(x, y, mat, s)
    if flecks:
        inner = sorted(p for p in mask if reach(mask, *p, 0, -1, 4) == 4 and reach(mask, *p, 1, 0, 4) == 4)
        for x, y in rnd.sample(inner, min(len(inner), len(mask) // 220)):
            c.put(x, y, mat, 0)
            c.put(x - 1, y, mat, 1)


def strata(c, mask, mat, seed=0, every=(18, 30)):
    """Horizontal sheeting joints in the rock, so a rounded mass breaks into
    big clean ledges: each ledge's top edge catches the light, the row under
    the next ledge's overhang is in shade, and a few vertical joints split
    it into blocks."""
    rnd = random.Random(seed)
    ys = [y for _, y in mask]
    if not ys:
        return
    y = min(ys) + rnd.randrange(*every)
    while y < max(ys):
        tilt = rnd.uniform(-0.08, 0.08)
        joints = sorted(rnd.sample(range(W), 2))
        # each joint runs only part of the way across, then dies out
        spans = []
        for _ in range(3):
            a = rnd.randrange(-20, W)
            spans.append((a, a + rnd.randrange(24, 70)))
        for x in range(W):
            if not any(a <= x < b for a, b in spans):
                continue
            yy = round(y + tilt * (x - W / 2) + 1.5 * math.sin(x / 11 + y))
            if (x, yy) not in mask or (x, yy - 2) not in mask:
                continue
            p = c.at(x, yy)
            c.put(x, yy, mat, max(0, min(p[1], 1)))
            c.put(x, yy + 1, mat, min(4, p[1] + 1))
        for jx in joints:
            n = rnd.randrange(*every)
            for k in range(2, n):
                yy = round(y + tilt * (jx - W / 2)) + k
                if (jx, yy) in mask and (jx, yy + 2) in mask:
                    c.put(jx, yy, mat, 0)
                    c.put(jx - 1, yy, mat, 3)
        y += rnd.randrange(*every)


def facets(c, m, mat, seed=0):
    """Chisels a mass into big planes: lines run down from its top edge at a
    slant, and the planes right of each line turn from the sun (a step
    darker), the planes left of it toward it, so the rock reads as blocks.
    The edge between them is a lit line on the near side."""
    rnd = random.Random(seed)
    xs = sorted({x for x, _ in m})
    if len(xs) < 30:
        return
    cuts = sorted(rnd.sample(xs[8:-8], max(1, len(xs) // 34)))
    tops = {}
    for x, y in m:
        tops[x] = min(tops.get(x, H), y)
    for k, cx in enumerate(cuts):
        slant = rnd.uniform(0.15, 0.45) * rnd.choice((-1, 1))
        turn = -1 if k % 2 == 0 else 1
        nxt = cuts[k + 1] if k + 1 < len(cuts) else xs[-1] + 1
        for x, y in m:
            if y - tops.get(x, y) < 3:
                continue
            edge = cx + (y - tops[cx]) * slant
            if edge <= x < nxt + (y - tops[cx]) * slant:
                p = c.at(x, y)
                if p and p[0] == mat and 0 < p[1] < 4:
                    c.put(x, y, mat, max(0, min(3, p[1] + turn)))
            if abs(x - edge) < 0.5 and turn < 0:
                c.put(x, y, mat, 3)


def crack(c, pts, mat, lit=3, dark=0):
    """A crack or joint in the rock: a dark line with a lit lip above it."""
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        n = max(abs(bx - ax), abs(by - ay)) + 1
        for j in range(n):
            x, y = round(ax + (bx - ax) * j / n), round(ay + (by - ay) * j / n)
            if c.at(x, y) and c.at(x, y)[0] == mat:
                c.put(x, y, mat, dark)
                if c.at(x, y - 1) and c.at(x, y - 1)[0] == mat:
                    c.put(x, y - 1, mat, lit)


def slabs(c, polys, mat="pink-granite", lichen=0.0, moss=0.0, seed=0):
    """Rock as big clean planes: each slab a polygon lit as one shape, the
    nearer ones drawn over the farther. Lichen and moss only on the tops."""
    rnd = random.Random(seed)
    for i, pts in enumerate(polys):
        m = poly_mask(pts)
        pillow(c, m, mat, seed=seed + i)
        facets(c, m, mat, seed=seed + i)
        strata(c, m, mat, seed=seed + i)
        tops = [(x, y) for x, y in m if (x, y - 1) not in m]
        for x, y in tops:
            r = rnd.random()
            if r < moss:
                for k in range(rnd.randrange(1, 3)):
                    c.put(x, y + k, "moss", 2 if k else 3)
            elif r < moss + lichen:
                c.put(x, y, "lichen", 2)
                c.put(x, y + 1, "lichen", 1)


def ground(c, top, mat="grass", seed=0, blades=0.35, floor=None):
    """Grass over earth: a lit rim of blades along the top, then calm mid
    tone, with clumps of shade and of light scattered as clusters, never as
    a pattern. floor(x, y) -> True where the trees shade it to forest floor."""
    rnd = random.Random(seed)
    tops = {}
    for x in range(W):
        t = top(x)
        if t is None:
            continue
        t = tops[x] = int(t)
        if rnd.random() < blades:
            c.put(x, t - 1, mat, 3)
        for y in range(max(0, t), H):
            d = y - t
            shaded = floor and floor(x, y)
            m = "floor" if shaded else mat
            s = (2 if shaded else 3) if d == 0 else (1 if shaded else 2) if d < 3 else 1
            c.put(x, y, m, s)
    xs = list(tops)
    for _ in range(len(xs) // 3):
        x = rnd.choice(xs)
        y = tops[x] + rnd.randrange(4, 60)
        if y >= H:
            continue
        shaded = floor and floor(x, y)
        m = "floor" if shaded else mat
        dark = rnd.random() < 0.55
        for k in range(rnd.randrange(2, 6)):
            if c.at(x + k, y) and c.at(x + k, y)[0] == m:
                c.put(x + k, y, m, 0 if dark and shaded else 1 if dark else 2)
        if not dark:
            c.put(x + 1, y - 1, m, 3 if not shaded else 2)  # a tuft catching light


def shoreline(c, x0, x1, y=SHORE, mat="algae-wood"):
    """Where the bank meets the water: wet and dark for the last rows."""
    for x in range(x0, x1):
        for k in range(0, 6):
            if c.at(x, y + k):
                c.put(x, y + k, mat, 1 if k < 2 else 0)


# ---------------------------------------------------------------- trees

def spruce(c, cx, base, h, mat="spruce-needles", seed=0, ratio=0.36, trunk=3, steps=(3, 2, 1, 0), flat=False):
    """A sharp spire of a few big drooping tiers, drawn from the bottom up so
    each tier hangs over the one below. Each tier is one clump: shade tone
    overall, a lit band along its top on the sun's side with the brightest
    needles at its tips, and a dark underside away from the sun.
    flat: a far tree, silhouette and a little light only."""
    rnd = random.Random(seed)
    lit_, mid, shade, dark = steps
    base, h = int(round(base)), int(h)
    top = base - h
    low = base - trunk
    for y in range(low - 3, base + 1):
        c.put(cx, y, "white-pine-bark", 1)
        if h > 60:
            c.put(cx + 1, y, "white-pine-bark", 0)
    tiers = []
    y = top + 1
    while y < low - 2:
        t = (y - top) / max(1, low - top)
        half = max(1, round(t * h * ratio / 2 + rnd.uniform(-1, 1.2)))
        gap = max(2, round(h / 16 + t * h / 22 + rnd.uniform(-0.8, 0.8)))
        tiers.append((y, half, gap + 2))
        y += gap
    for ty, half, thick in reversed(tiers):
        lt, rt = half + rnd.randrange(0, 2), half + rnd.randrange(0, 2)
        cells = {}
        for x in range(cx - lt, cx + rt + 1):
            hw = lt if x < cx else max(1, rt)
            d = abs(x - cx) / hw
            y0 = ty + round(d ** 1.6 * (thick + 1))
            y1 = ty + thick + round(d * 1.5) + (1 if d > 0.9 and rnd.random() < 0.5 else 0)
            if d > 0.85 and rnd.random() < 0.25:
                y0 += 1
            cells[x] = (y0, min(low, y1))
        for x, (y0, y1) in cells.items():
            for yy in range(y0, y1 + 1):
                c.put(x, yy, mat, shade)
        if flat:
            continue
        for x, (y0, y1) in cells.items():
            if x <= cx + rt * 0.35:
                band = 2 if x < cx else 1
                for yy in range(y0, min(y1, y0 + band) + 1):
                    c.put(x, yy, mat, mid)
                if x < cx - lt * 0.15 and rnd.random() < 0.55:
                    c.put(x, y0, mat, lit_)
            if x > cx - lt * 0.4:
                c.put(x, y1, mat, dark)
                if x > cx + rt * 0.2 and y1 - 1 > y0:
                    c.put(x, y1 - 1, mat, dark)
    c.put(cx, top, mat, mid)


def treeline(c, x0, x1, base, hmin, hmax, mat="spruce-needles@far", seed=0, gap=(4, 8), steps=(3, 2, 1, 0), floor=None, flat=True, rows=6):
    """A wall of spires: trunks hidden, crowns overlapping, heights ragged.
    floor: the colour filling below the crowns, down to the image's bottom."""
    rnd = random.Random(seed)
    if floor:
        for x in range(max(0, x0 - 6), min(W, x1 + 6)):
            b = base(x) if callable(base) else base
            for y in range(int(b) - 3, H):
                c.put(x, y, floor[0], floor[1] if ((y - int(b)) // 9) % 2 == 0 else 2)
    x = x0
    tips = []
    while x < x1:
        h = rnd.randrange(hmin, hmax + 1)
        b = (base(x) if callable(base) else base) + rnd.randrange(0, 4)
        tips.append((x, b, h))
        x += rnd.randrange(*gap)
    for x, b, h in tips:
        spruce(c, x, b, h, mat, seed=x * 31 + seed, ratio=0.4, trunk=0, steps=steps, flat=flat)
    if floor and rows:
        # the tops of the trees further down the slope, row under row
        for k in range(1, rows + 1):
            st = (steps[0], steps[1], steps[2] if k % 2 == 0 else steps[1], steps[3])
            treeline(c, x0, x1, (lambda x, k=k: (base(x) if callable(base) else base) + 9 * k), max(6, hmin // 2),
                     max(9, hmax // 2), mat, seed=seed + 17 * k, gap=(3, 6), steps=st, flat=True, rows=0)


def white_pine(c, x, base, h, seed=0, lean=1, mat="white-pine-needles", bark="white-pine-bark"):
    """The skyline tree, drawn big enough for its shape to read: a stout
    trunk, then broad, flat, dense plates of needles in tiers with sky
    between them, longer on the lee side, and a flat, wind-swept top. Each
    plate is a row of soft clumps, lit flat on top with a dark crescent
    under."""
    rnd = random.Random(seed)
    top = base - h
    path = []
    for y in range(base, top + 2, -1):
        t = (base - y) / h
        path.append((round(x + lean * 5 * t * t), y))
    for px_, y in path:
        t = (base - y) / h
        c.put(px_ - 1, y, bark, 2)
        c.put(px_, y, bark, 1 if (y * 5) % 7 else 0)
        if t < 0.7:
            c.put(px_ + 1, y, bark, 0 if (y * 3) % 5 == 0 else 1)
        if t < 0.25:
            c.put(px_ - 2, y, bark, 2)
    tx = dict((yy, xx) for xx, yy in path)
    # plates: (height up the tree as a share, side offset, half width, height)
    plates = [
        (0.42, 8, 12, 6), (0.44, -10, 9, 5),
        (0.58, 12, 16, 7), (0.56, -11, 11, 6),
        (0.74, 13, 17, 7), (0.72, -10, 12, 6),
        (0.88, 9, 16, 7), (0.87, -8, 10, 5),
        (1.0, 4, 17, 6),
    ]
    for frac, off, half, ph in plates:
        py = round(base - h * frac) + 2
        cx = tx.get(py + ph // 2, x) + off * lean
        trunk_x = tx.get(py + ph, x)
        for k in range(min(trunk_x, cx), max(trunk_x, cx) + 1):
            c.put(k, py + ph - 1, bark, 1)
        cells = set()
        k = cx - half
        while k <= cx + half:
            r = rnd.randrange(4, 7)
            yy = py + rnd.randrange(0, 2) + (2 if abs(k - cx) > half * 0.7 else 0)
            for dy in range(-ph // 2, ph // 2 + 1):
                for dx in range(-r, r + 1):
                    if (dx / r) ** 2 + (dy / (ph / 2)) ** 2 <= 1 and not ((dx / r) ** 2 + (dy / (ph / 2)) ** 2 > 0.75 and rnd.random() < 0.35):
                        cells.add((k + dx, yy + ph // 2 + dy))
            k += r + rnd.randrange(0, 3)
        for px_, y in cells:
            above, below = (px_, y - 1) in cells, (px_, y + 1) in cells
            if not above:
                s = 4 if px_ < cx else 3
            elif not (px_, y - 2) in cells and px_ < cx + half * 0.4:
                s = 3
            elif not below:
                s = 0
            elif not (px_, y + 2) in cells:
                s = 1
            else:
                s = 2
            c.put(px_, y, mat, s)


def snag(c, x, base, h, seed=0):
    """A dead pine, silver-grey, with a few broken limbs: where the eagle
    sits."""
    rnd = random.Random(seed)
    for y in range(base - h, base + 1):
        c.put(x, y, "snag", 2)
        c.put(x + 1, y, "snag", 1)
    for k in range(4):
        y = base - h + 6 + k * (h // 5)
        side = -1 if k % 2 else 1
        for d in range(1, rnd.randrange(3, 7)):
            c.put(x + (d if side > 0 else -d + 1), y - d // 3, "snag", 3 if side < 0 else 1)
    c.put(x, base - h - 1, "snag", 3)


def blob(c, bx, by, r, mat, steps=(4, 3, 2, 1), rnd=None, flat=1.0):
    """One leaf cluster lit as a round shape from the upper left."""
    rnd = rnd or random.Random(int(bx * 13 + by))
    for y in range(int(by - r), int(by + r) + 1):
        for x in range(int(bx - r), int(bx + r) + 1):
            d = math.hypot(x - bx, (y - by) / flat)
            if d > r or (d > r - 1 and rnd.random() < 0.35):
                continue
            u = ((x - bx) * -0.6 + (y - by) / flat * -0.8) / max(1, r)
            s = steps[0] if u > 0.55 else steps[1] if u > 0.1 else steps[2] if u > -0.45 else steps[3]
            c.put(x, y, mat, s)


def birch(c, x, base, h, lean=0, seed=0, mat="aspen-leaves"):
    """A slender white trunk with short black marks, leaning, and an oval
    crown over its upper half built of leaf clusters, each lit as a round
    shape, with a few gaps of sky and the trunk showing through."""
    rnd = random.Random(seed)
    top = base - h
    pts = []
    for y in range(base, top, -1):
        t = (base - y) / h
        xx = round(x + lean * t * h * 0.14)
        pts.append((xx, y))
        c.put(xx, y, "birch-bark", 3)
        c.put(xx + 1, y, "birch-bark", 2)
        if rnd.random() < 0.2:
            c.put(xx + rnd.randrange(0, 2), y, "birch-bark", 0)
    crown = pts[int(len(pts) * 0.4):]
    cx = sum(p[0] for p in crown) / len(crown)
    cy = sum(p[1] for p in crown) / len(crown)
    ry, rx = len(crown) / 2 + 2, max(7, h * 0.16)
    for _ in range(int(h * 0.5)):
        a = rnd.uniform(0, math.tau)
        rr = math.sqrt(rnd.random())
        bx, by = cx + math.cos(a) * rr * rx, cy + math.sin(a) * rr * ry
        blob(c, bx, by, rnd.randrange(3, 5), mat, rnd=rnd, flat=0.85)
    for xx, y in crown[2:-6]:
        if rnd.random() < 0.3:
            c.put(xx, y, "birch-bark", 3)


def red_pine(c, x, base, h, seed=0):
    """A tall straight trunk, orange-red and flaky up high, grey-brown plates
    low down, and a rounded, dense crown of tufts in its top third."""
    rnd = random.Random(seed)
    for y in range(base - h + 8, base + 1):
        upper = y < base - h * 0.45
        m = "red-pine-bark" if upper else "red-pine-plates"
        c.put(x - 1, y, m, 3)
        c.put(x, y, m, 2)
        c.put(x + 1, y, m, 1 if (y * 3) % 7 else 0)
    cy, rx, ry = base - h + h * 0.18, h * 0.17, h * 0.15
    for _ in range(int(h * 0.4)):
        a = rnd.uniform(0, math.tau)
        rr = math.sqrt(rnd.random())
        blob(c, x + math.cos(a) * rr * rx, cy + math.sin(a) * rr * ry, rnd.randrange(3, 6),
             "white-pine-needles", steps=(3, 2, 1, 0), rnd=rnd, flat=0.7)
    for k in range(-int(rx * 0.6), int(rx * 0.6), 5):
        c.put(x + k, round(cy + ry * 0.4), "red-pine-bark", 1)


def bushes(c, x0, x1, base, mat="aspen-leaves", seed=0, r=(3, 5), steps=(3, 2, 1, 0)):
    rnd = random.Random(seed)
    x = x0
    while x < x1:
        rr = rnd.randrange(*r)
        b = base(x) if callable(base) else base
        blob(c, x, b - rr + 2, rr, mat, steps=steps, rnd=rnd, flat=0.8)
        x += rnd.randrange(3, 7)


def cedar(c, x, base, reach, seed=0):
    """A white cedar leaning out over the water from the bank, flat sprays
    of foliage along the top of its trunk."""
    rnd = random.Random(seed)
    pts = []
    for k in range(reach):
        t = k / reach
        pts.append((x + k, round(base - k * 0.55 - 6 * math.sin(t * math.pi * 0.8))))
    for px_, py in pts:
        c.put(px_, py, "white-pine-bark", 2)
        c.put(px_, py + 1, "white-pine-bark", 0)
    for k in range(5, reach, 4):
        px_, py = pts[k]
        blob(c, px_ + rnd.randrange(-1, 2), py - 3, rnd.randrange(3, 5), "cedar-foliage", rnd=rnd, flat=0.55)


# ---------------------------------------------------------------- water

PATTERN = [4, 3, 3, 2, 2, 2, 1, 2, 2, 3, 2, 1]  # streaks down a falling sheet; 12 rows, 3 per frame


def streaks(seed, n=12):
    """One column's pattern down a falling sheet, 12 rows long (it runs 3
    rows a frame): long runs, so the water reads as streaks."""
    rnd = random.Random(seed)
    out = []
    while len(out) < n:
        out += [rnd.choice((1, 2, 2, 3, 3, 3))] * rnd.randrange(2, 6)
    return out[:n]


def falls(c, x0, x1, top, bottom, mat="tannin", seed=0, foam="foam"):
    """A sheet of falling water, mostly white with foam, the water's own
    colour in long streaks running down 3 px a frame, darker at the edges,
    a lit lip at the top and churning foam at the foot."""
    cols = [streaks(seed * 101 + x) for x in range(x0, x1 + 1)]
    white = [random.Random(seed + x * 7).random() < 0.45 for x in range(x0, x1 + 1)]

    def draw(g, f):
        rnd = random.Random(seed * 7 + f)
        for y in range(top, bottom + 1):
            # the curtain's edges wobble as the water falls
            wob = random.Random(seed * 13 + (y - 3 * f) // 4)
            l = x0 + (wob.randrange(-1, 1) if y - top > 2 else -1)
            r = x1 + (wob.randrange(0, 2) if y - top > 2 else 1)
            if y > bottom - 5:
                l, r = l - (y - bottom + 5) // 2, r + (y - bottom + 5) // 2
            for x in range(l, r + 1):
                i = min(len(cols) - 1, max(0, x - x0))
                v = cols[i][(y - 3 * f) % 12]
                if y - top < 2:
                    g(x, y, foam, 3 if y == top else 2)  # the lip, catching the light
                elif y > bottom - 5 and rnd.random() < 0.8:
                    g(x, y, foam, rnd.randrange(1, 4))  # churning at the foot
                elif x in (l, r):
                    g(x, y, mat, 1)
                elif v == 1:
                    g(x, y, mat, 2 if white[i] else 3)  # the water's own colour, in the thin streaks
                else:
                    g(x, y, foam, v)
        for _ in range(6):  # spray thrown up at the foot
            g(rnd.randrange(x0 - 6, x1 + 7), bottom - rnd.randrange(3, 9), foam, 3)
    c.water.append(draw)


def pool(c, cx, cy, rx, ry, mat="tannin", seed=0, foam="foam"):
    """The plunge pool: dark water ringed with foam that churns frame to frame."""
    def draw(g, f):
        rnd = random.Random(seed * 11 + f)
        for y in range(cy - ry, cy + ry + 1):
            for x in range(cx - rx, cx + rx + 1):
                d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
                if d > 1:
                    continue
                if d > 0.55 or (y < cy and rnd.random() < 0.5):
                    g(x, y, foam, rnd.randrange(1, 4))
                else:
                    g(x, y, mat, 1 if (x + y + f) % 5 else 2)
    c.water.append(draw)


def stream(c, pts, width, mat="tannin", seed=0, foam="foam"):
    """Water running down a channel: a line of points, ripples moving along
    it 3 px a frame, foam where it drops."""
    def draw(g, f):
        rnd = random.Random(seed * 5 + f)
        for k in range(len(pts) - 1):
            (ax, ay), (bx, by) = pts[k], pts[k + 1]
            n = max(abs(bx - ax), abs(by - ay)) + 1
            steep = abs(by - ay) > abs(bx - ax)
            for j in range(n):
                x = round(ax + (bx - ax) * j / n)
                y = round(ay + (by - ay) * j / n)
                along = k * 50 + j
                for w in range(width):
                    xx, yy = (x + w - width // 2, y) if steep else (x, y + w)
                    if steep and rnd.random() < 0.3:
                        g(xx, yy, foam, rnd.randrange(1, 4))
                        continue
                    s = PATTERN[(along - 3 * f + w * 5) % 12]
                    if w == 0 or w == width - 1:
                        s = max(0, s - 1)
                    g(xx, yy, mat, s)
    c.water.append(draw)


# ---------------------------------------------------------------- output

def render(c, R, time="day", frame=None):
    """The bank as an image 576 wide (drawn from x = -150 in the game).
    frame=None: the bank with the water's first frame; else that frame of
    the water alone."""
    img = Image.new("RGBA", (W + 216, H))
    px = img.load()

    def colour(mat, s):
        r_ = R[mat]
        s = max(0, min(len(r_) - 1, s))
        return (*rgb(lit(r_[s], s, len(r_), time)), 255)

    grid = [row[:] for row in c.g] if frame is None else [[None] * W for _ in range(H)]

    def g(x, y, mat, s):
        if 0 <= x < W and 0 <= y < H:
            grid[y][x] = (mat, s)

    for draw in c.water:
        draw(g, frame or 0)
    for y in range(H):
        for x in range(W):
            if grid[y][x]:
                px[x + BACK_X, y] = colour(*grid[y][x])
    return img


def export(c, name, time="day"):
    R = materials(time)
    land = render(c, R, time)
    frames = [render(c, R, time, f) for f in range(FRAMES)]
    box = None
    for f in frames:
        b = f.getbbox()
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    fw, fh = box[2] - box[0], box[3] - box[1]
    strip = Image.new("RGBA", (fw * FRAMES, fh))
    for i, f in enumerate(frames):
        strip.paste(f.crop(box), (i * fw, 0))
    OUT.mkdir(parents=True, exist_ok=True)
    land.save(OUT / f"{name}-land.png")
    strip.save(OUT / f"{name}-falls.png")
    anchors = {"falls": {"x": box[0], "y": box[1]}, "fallsFoot": {"x": c.foot[0] + BACK_X, "y": c.foot[1]},
               "frame": [fw, fh]}
    (OUT / f"{name}.json").write_text(json.dumps(anchors) + "\n")
    return land


# ---------------------------------------------------------------- the versions

def wave(x, a, b, amp, period, phase=0.0):
    """A height between a and b along x with a gentle swell."""
    return a + (b - a) * x / W + amp * math.sin(x / period + phase)


def hump(x0, x1, top, bottom=H, lean=0.0, steps=24):
    """A rounded mass (a whaleback of granite, a knoll): the top half of an
    ellipse from x0 to x1 peaking at `top`, its peak pushed by lean (-1..1),
    carried down to `bottom`."""
    pts = []
    for i in range(steps + 1):
        t = i / steps
        u = t ** (1 + lean) if lean >= 0 else 1 - (1 - t) ** (1 - lean)
        x = x0 + (x1 - x0) * t
        y = bottom - (bottom - top) * math.sin(math.pi * u) ** 0.6
        pts.append((round(x), round(y)))
    return pts + [(x1, H), (x0, H)]


def outcrop_trees(c, x0, x1, top_of, seed, hmin=36, hmax=62, mat="spruce-needles", gap=(9, 15)):
    """Spruce and fir rooted along the top of a mass: top_of(x) gives the
    ground there."""
    rnd = random.Random(seed)
    x = x0
    while x < x1:
        spruce(c, x, top_of(x) + 2, rnd.randrange(hmin, hmax), mat, seed=seed + x, ratio=0.4)
        x += rnd.randrange(*gap)


def top_of(c, x, mats):
    for y in range(H):
        p = c.at(x, y)
        if p and p[0] in mats:
            return y
    return H


def back_forest(c, seed, far_base, near_base, near_to=W + 6, aspen=0.12):
    """The forest behind the bank: a thin hazy band of spires on the far
    ridge, then the near forest, green, row under row of treetops down the
    slope, with an aspen or birch crown lighter among the spruce, filling
    everything below so no sky shows under the bank."""
    treeline(c, -4, W + 6, lambda x: far_base + 3 * math.sin(x / 23), 10, 20, "spruce-needles@farther", seed=seed,
             floor=("spruce-needles@farther", 1), gap=(3, 6), rows=1)
    treeline(c, -4, W + 6, near_base, 18, 34, "spruce-needles@far", seed=seed + 1,
             floor=("spruce-needles@far", 1), gap=(4, 7), rows=0)
    nb = lambda x: (near_base(x) if callable(near_base) else near_base) + 10  # noqa: E731
    treeline(c, -4, near_to, nb, 16, 30, "spruce-needles", seed=seed + 2,
             floor=("spruce-needles", 1), gap=(4, 7), rows=12)
    rnd = random.Random(seed + 3)
    for _ in range(int(W * aspen / 3)):
        x = rnd.randrange(0, min(W, near_to))
        y = nb(x) + 9 * rnd.randrange(0, 6) - 3
        for k in range(rnd.randrange(2, 4)):  # a crown of a few clusters
            blob(c, x + rnd.randrange(-4, 5), y + rnd.randrange(-2, 3), rnd.randrange(3, 5), "aspen-leaves@far",
                 steps=(3, 2, 1, 0), rnd=rnd, flat=0.8)


def version_a():
    """Granite point: the Canadian Shield. A rounded outcrop of pink granite
    on the right, spruce and fir and a silver snag along its top, the falls
    pouring over its left flank in root-beer water; a big white pine stands
    over the shore on the left, drawn large enough for its plates to read,
    among spruce and a birch clump; smooth granite and a glacial erratic at
    the water where the animals come down."""
    c = Canvas(1)
    back_forest(c, 2, 132, lambda x: wave(x, 152, 142, 4, 17, 1))
    # the slope under the trees on the left
    ground(c, lambda x: wave(x, 214, 222, 3, 13) if x < 200 else None, "moss", seed=4,
           floor=lambda x, y: y < 262)
    # the outcrop, back mass then front, and the dark notch the falls pour through
    slabs(c, [[(176, 236), (178, 192), (196, 176), (226, 168), (262, 162), (300, 160), (340, 152), (362, 154), (362, 324), (176, 324)]],
          "pink-granite", lichen=0.04, moss=0.1, seed=5)
    outcrop_trees(c, 214, 360, lambda x: top_of(c, x, ("pink-granite", "moss", "lichen")), 30)
    snag(c, 300, top_of(c, 300, ("pink-granite", "moss", "lichen")) + 2, 46, seed=7)
    slabs(c, [[(204, 232), (214, 210), (246, 200), (286, 202), (320, 192), (362, 194), (362, 324), (204, 324)],
              [(184, 270), (198, 250), (240, 240), (300, 242), (362, 236), (362, 324), (184, 324)]], "pink-granite", lichen=0.06, seed=6)
    crack(c, [(240, 232), (262, 244), (300, 248)], "pink-granite")
    crack(c, [(214, 190), (236, 204), (250, 222)], "pink-granite")
    slabs(c, [[(180, 182), (190, 174), (198, 176), (200, 236), (178, 236)]], "basalt", seed=8)
    # the big trees on the left: spruce behind, the white pine, spruce in front
    spruce(c, 30, 262, 92, seed=9, ratio=0.44)
    spruce(c, 160, 254, 78, seed=10, ratio=0.42)
    white_pine(c, 92, 286, 150, seed=11, lean=1)
    spruce(c, 58, 280, 64, seed=12, ratio=0.44)
    spruce(c, 138, 284, 58, seed=13, ratio=0.44)
    for k, (x, h, ln) in enumerate([(4, 70, -1), (11, 82, 0), (19, 64, 1)]):
        birch(c, x, 288, h, ln, seed=14 + k)
    # the shore: low granite worn smooth, and an erratic
    slabs(c, [[(-2, 294), (30, 288), (70, 285), (110, 289), (150, 291), (190, 297), (214, 306), (214, 324), (-2, 324)]],
          "pink-granite", lichen=0.06, seed=17)
    slabs(c, [[(30, 301), (32, 290), (42, 280), (58, 277), (68, 284), (73, 301)]], "grey-gneiss", lichen=0.25, seed=18)
    shoreline(c, 0, 214)
    # the falls into a pool, then down over the rock to the lake
    falls(c, 183, 195, 176, 228, seed=15)
    pool(c, 190, 232, 13, 4)
    stream(c, [(198, 234), (210, 250), (218, 272), (224, 304)], 7, seed=17)
    c.foot = (190, 230)
    return c


def version_b():
    """The bank we have, redrawn: the same layout (a grassy slope, a boulder,
    two big spruces, a rock cliff with a tall white waterfall and a treeline
    along its top, the stream running down to the lake) in our materials
    and our light."""
    c = Canvas(2)
    back_forest(c, 2, 132, lambda x: wave(x, 156, 144, 4, 13))
    ground(c, lambda x: wave(x, 222, 196, 3, 31), "grass", seed=4)
    slabs(c, [[(168, 250), (170, 196), (184, 170), (214, 162), (260, 156), (320, 150), (362, 148), (362, 324), (168, 324)]],
          "grey-gneiss", moss=0.18, seed=5)
    outcrop_trees(c, 220, 360, lambda x: top_of(c, x, ("grey-gneiss", "moss")), 40, hmin=40, hmax=64, gap=(7, 12))
    slabs(c, [[(210, 214), (230, 200), (290, 196), (362, 194), (362, 324), (210, 324)],
              [(150, 252), (200, 238), (280, 236), (362, 232), (362, 324), (150, 324)]], "grey-gneiss", moss=0.18, seed=6)
    crack(c, [(232, 214), (260, 224), (300, 222)], "grey-gneiss")
    slabs(c, [[(16, 272), (20, 250), (34, 232), (56, 226), (78, 232), (92, 252), (90, 272)]], "grey-gneiss", lichen=0.08, seed=7)
    spruce(c, 118, 286, 112, seed=8, ratio=0.5)
    spruce(c, 160, 280, 94, seed=9, ratio=0.5)
    ground(c, lambda x: 294 + (1 if x % 13 == 0 else 0), "grass", seed=10)
    shoreline(c, 0, 220)
    falls(c, 186, 201, 160, 214, "clear", seed=11, foam="spray")
    pool(c, 194, 218, 13, 4, "clear", foam="spray")
    stream(c, [(200, 221), (212, 242), (226, 266), (238, 288), (246, 304)], 12, "clear", seed=12, foam="spray")
    c.foot = (194, 216)
    return c


def version_c():
    """Birch cove: a low bank and a pebble beach where the animals come down,
    white birch and aspen bright against dark spruce, a pair of red pines,
    and a pink granite bluff on the right, the falls a narrow ribbon of
    root-beer water dropping through a cleft in it."""
    c = Canvas(3)
    back_forest(c, 2, 132, lambda x: wave(x, 152, 144, 4, 15))
    slabs(c, [[(172, 250), (176, 180), (196, 152), (232, 142), (280, 134), (330, 130), (362, 128), (362, 324), (172, 324)]],
          "pink-granite", lichen=0.05, moss=0.1, seed=4)
    outcrop_trees(c, 226, 360, lambda x: top_of(c, x, ("pink-granite", "moss", "lichen")), 50)
    slabs(c, [[(212, 212), (236, 196), (300, 188), (362, 186), (362, 324), (212, 324)],
              [(176, 262), (220, 248), (300, 244), (362, 240), (362, 324), (176, 324)]], "pink-granite", lichen=0.05, seed=5)
    crack(c, [(226, 210), (250, 224), (262, 246)], "pink-granite")
    slabs(c, [[(188, 156), (196, 148), (204, 150), (206, 248), (186, 250)]], "basalt", seed=6)
    # the forest edge: aspen behind, red pines, birches in front
    bushes(c, -4, 190, lambda x: 266 + 3 * math.sin(x / 9), "aspen-leaves", seed=7, r=(5, 9))
    red_pine(c, 150, 272, 100, seed=8)
    red_pine(c, 168, 276, 88, seed=9)
    for k, (x, h, ln) in enumerate([(26, 76, -1), (34, 88, 0), (42, 70, 1), (92, 80, 0), (100, 66, 1), (124, 72, -1)]):
        birch(c, x, 286, h, ln, seed=20 + k)
    bushes(c, -4, 190, lambda x: 286 + 2 * math.sin(x / 5), "aspen-leaves", seed=10, r=(3, 6))
    # the beach: a line of grass, then sand and cobble to the water
    ground(c, lambda x: 284 if x < 200 else None, "grass", seed=11, blades=0.5)
    rnd = random.Random(12)
    for x in range(0, 206):
        for y in range(289, H):
            c.put(x, y, "sand", 3 if y == 289 else 2 if y < 295 else 1)
    for _ in range(45):
        x, y = rnd.randrange(0, 200), rnd.randrange(292, 304)
        c.put(x, y, "cobble", 3)
        c.put(x + 1, y, "cobble", 2)
        c.put(x + 1, y + 1, "cobble", 0)
    shoreline(c, 0, 206, SHORE + 1)
    falls(c, 192, 201, 154, 244, seed=13)
    pool(c, 196, 247, 9, 3)
    stream(c, [(199, 250), (204, 272), (208, 290), (214, 304)], 6, seed=14)
    c.foot = (196, 245)
    return c


VERSIONS = {"A": version_a, "B": version_b, "C": version_c}


if __name__ == "__main__":
    for name, make in VERSIONS.items():
        export(make(), name)
        print(name)
