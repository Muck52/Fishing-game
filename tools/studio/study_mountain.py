"""Study 4: the bluff around the falls, and the stream above it.

Study 3's tiered cascade sits in the rock now, but the bluff around it is
still one smooth block with the falls at its corner, and the river comes
from nowhere. This study reshapes the bluff around the falls and brings a
stream down to its lip, so the falls belongs to a landscape:

- **A, ravine:** the bluff's top dips into a V where the river has cut it,
  and the stream winds down the ravine out of the forest, narrower and
  paler the further back it is, small riffles at its bends, trees on the
  slopes overlapping it.
- **B, plateau river:** the bluff stays high; the river comes from far
  back across the plateau, seen side-on as a stack of reaches between the
  rows of trees, each further reach thinner and lighter, swinging left and
  right.
- **C, rapids gorge:** the river cuts a narrow rocky gorge into the
  bluff's top, granite walls either side stepping up behind, and comes
  down it in two small rapids before the falls.

In all three, the bluff changes round the falls: its top edge slopes down
into the notch, the walls of the recess the falls has cut are lit on the
side that faces the sun and shaded on the other, cedars cling to its
ledges, and the rock is wet and green near the water.

    python3 tools/studio/study_mountain.py   -> docs/studio/studies/04-mountain/
"""
import json
import math
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import study_bank as b  # noqa: E402
import study_falls as sf  # noqa: E402

OUT = b.ROOT / "docs" / "studio" / "studies" / "04-mountain"
ROCK = ("pink-granite", "lichen", "moss", "basalt", "grey-gneiss")


# ---------------------------------------------------------------- the stream

def ribbon(c, path, seed=0, glints=True):
    """A stream seen from the side as it comes toward us: a line of points
    (x, y, width) from far to near. Each point is stamped as a flat oval
    (we look along the water, so it's squashed), the far reaches lighter
    with the sky they reflect at a low angle, the near ones dark with glints
    of sky sliding toward us 3 px a frame, a lit bank on the right (it
    faces the sun) and a shaded one on the left, and riffles of white where
    it bends."""
    pts = []
    for (ax, ay, aw), (bx, by, bw) in zip(path, path[1:]):
        n = max(2, int(math.hypot(bx - ax, by - ay) * 2))
        for j in range(n):
            t = j / n
            pts.append((ax + (bx - ax) * t, ay + (by - ay) * t, aw + (bw - aw) * t))
    pts.append(path[-1])
    cells = {}
    for k, (x, y, w) in enumerate(pts):
        rx, ry = w / 2, max(1.0, w * 0.35)
        for yy in range(int(y - ry - 1), int(y + ry + 2)):
            for xx in range(int(x - rx - 1), int(x + rx + 2)):
                if ((xx - x) / max(rx, 0.5)) ** 2 + ((yy - y) / ry) ** 2 <= 1:
                    far = 1 - k / len(pts)
                    if (xx, yy) not in cells or cells[(xx, yy)][0] < far:
                        cells[(xx, yy)] = (far, k)
    # the banks: a dark wet edge round the water, drawn into the bank image,
    # with a little lit moss on the right bank (it faces the sun)
    for (xx, yy), (far, k) in cells.items():
        for dx, dy in ((-1, 0), (1, 0), (0, 1)):
            if (xx + dx, yy + dy) not in cells:
                lit = dx > 0 and random.Random(xx * 7 + yy).random() < 0.5
                c.put(xx + dx, yy + dy, "moss" if lit else "floor", 2 if lit else 1)
    bends = set()
    for k in range(2, len(pts) - 2):
        if (pts[k + 2][0] - pts[k][0]) * (pts[k][0] - pts[k - 2][0]) < 0:
            bends.add(k)

    def draw(g, f):
        rnd = random.Random(seed * 11 + f)
        for (xx, yy), (far, k) in cells.items():
            if any(abs(k - bk) < 2 for bk in bends) and rnd.random() < 0.25:
                g(xx, yy, "whitewater", rnd.randrange(2, 4))  # a riffle at the bend
                continue
            # the further reaches reflect the pale sky at a low angle; the
            # near water is dark, with the sky in its ripples
            mat, base = ("clear", 3) if far > 0.55 else ("clear", 2) if far > 0.25 else ("clear", 1)
            if glints and (yy - 3 * f) % 6 == 0 and (xx * 3 + yy) % 7 < 2:
                g(xx, yy, "clear", 4)  # sky in a ripple, sliding toward us
            elif (xx, yy - 1) not in cells:
                g(xx, yy, "clear", 4 if far > 0.25 else 3)  # the far edge catches the light
            elif (xx, yy + 1) not in cells:
                g(xx, yy, mat, max(1, base - 1))
            else:
                g(xx, yy, mat, base)
    c.water.append(draw)
    return cells


def river(c, path, seed=0, bank_trees=True):
    """A river winding toward us through the forest, as it really sits: in
    its own opening, the forest stepping back from it. Each reach has a far
    bank (a lit strip of gravel and grass, the far bank's trees standing on
    it) and a near bank (dark, wet); gravel bars on the inside of the bends;
    the water reflects the far bank's trees as a dark band along its far
    edge and the sky in its middle, paler further off; ripples of sky slide
    toward us; riffles of white where it bends. No tree stands in it."""
    rnd = random.Random(seed)
    pts = []
    for (ax, ay, aw), (bx, by, bw) in zip(path, path[1:]):
        n = max(2, int(math.hypot(bx - ax, by - ay) * 2))
        for j in range(n):
            t = j / n
            pts.append((ax + (bx - ax) * t, ay + (by - ay) * t, aw + (bw - aw) * t))
    pts.append(path[-1])
    cells = {}
    for k, (x, y, w) in enumerate(pts):
        rx, ry = w / 2, max(1.0, w * 0.3)
        for yy in range(int(y - ry - 1), int(y + ry + 2)):
            for xx in range(int(x - rx - 1), int(x + rx + 2)):
                if ((xx - x) / max(rx, 0.5)) ** 2 + ((yy - y) / ry) ** 2 <= 1:
                    far = 1 - k / len(pts)
                    if (xx, yy) not in cells or cells[(xx, yy)] < far:
                        cells[(xx, yy)] = far
    near = lambda p, r: any((p[0] + dx, p[1] + dy) in cells for dx in range(-r, r + 1) for dy in range(-r // 2, r // 2 + 1))  # noqa: E731
    xs = [p[0] for p in cells]
    ys = [p[1] for p in cells]
    # the opening the river runs through: a strip of sedge meadow either side
    for yy in range(min(ys) - 3, max(ys) + 4):
        for xx in range(min(xs) - 8, max(xs) + 9):
            if (xx, yy) in cells or not near((xx, yy), 6):
                continue
            p = c.at(xx, yy)
            if p and p[0] in ROCK:
                continue
            # darker the further from the water, where the forest's shade begins
            c.put(xx, yy, "floor" if not near((xx, yy), 3) else "grass", 2 if (xx * 3 + yy * 5) % 7 else 1)
    # the banks
    for (xx, yy), far in cells.items():
        if (xx, yy - 1) not in cells:  # the far bank: gravel at the water, grass above
            c.put(xx, yy - 1, "sand", 3)
            if (xx, yy - 2) not in cells:
                c.put(xx, yy - 2, "grass", 3 if rnd.random() < 0.5 else 2)
        if (xx, yy + 1) not in cells:  # the near bank: dark and wet
            c.put(xx, yy + 1, "floor", 0)
            if (xx, yy + 2) not in cells:
                c.put(xx, yy + 2, "grass", 1)
    # gravel bars on the inside of the bends
    for k in range(3, len(pts) - 3):
        before, after = pts[k][0] - pts[k - 3][0], pts[k + 3][0] - pts[k][0]
        if before * after < 0 and rnd.random() < 0.5:
            x, y, w = pts[k]
            side = 1 if before > 0 else -1  # the bend turns back; the bar is on the side it turns from
            bx = round(x - side * (w / 2 + 2))
            for dx in range(-3, 4):
                for dy in range(0, 2):
                    if (bx + dx, round(y) + dy) not in cells:
                        c.put(bx + dx, round(y) + dy, "sand", 3 if dy == 0 else 2)
    # the trees on each far bank, standing back from the water a little;
    # they hide the reaches further off, never their own
    if bank_trees:
        tops = sorted({(xx, yy) for (xx, yy) in cells if (xx, yy - 1) not in cells}, key=lambda p: p[0])
        x_last = -99
        for xx, yy in tops:
            if xx - x_last < rnd.randrange(5, 10):
                continue
            far = cells[(xx, yy)]
            h = round(8 + 14 * (1 - far)) + rnd.randrange(-2, 3)
            base = yy - 3
            snap = {(px, py): c.at(px, py) for px in range(xx - h, xx + h) for py in range(base - h - 2, base + 2)}
            b.spruce(c, xx, base, h, "spruce-needles", seed=seed + xx * 7, ratio=0.42, trunk=2)
            for (px, py), was in snap.items():
                if c.at(px, py) != was:
                    if (px, py) in cells:
                        c.front.add((px, py))
            x_last = xx

    bends = set()
    for k in range(2, len(pts) - 2):
        if (pts[k + 2][0] - pts[k][0]) * (pts[k][0] - pts[k - 2][0]) < 0:
            bends.add(k)

    def draw(g, f):
        rnd2 = random.Random(seed * 11 + f)
        for (xx, yy), far in cells.items():
            depth = 0
            while (xx, yy - depth - 1) in cells:
                depth += 1
            if depth < 2:
                g(xx, yy, "river", 1 if depth == 0 else 2)  # the far bank's trees, reflected
            elif (yy - 3 * f) % 6 == 0 and (xx * 3 + yy) % 7 < 2:
                g(xx, yy, "river", 4)  # a ripple of sky, sliding toward us
            elif (xx, yy + 1) not in cells:
                g(xx, yy, "river", 2)
            else:
                g(xx, yy, "river", 3 if far > 0.4 else 2)  # the sky in the middle, paler further off
        for k in bends:
            x, y, w = pts[k]
            for _ in range(2):
                g(round(x + rnd2.uniform(-w / 3, w / 3)), round(y + rnd2.uniform(0, w * 0.2)), "whitewater", 3)
    c.water.append(draw)
    return cells


def plateau_forest(c, x0, x1, top, bottom, seed=0):
    """Raises the green forest behind the bluff's top, so the river crosses
    forested ground rather than the haze of the far ridge: row under row of
    treetops from `top` (a function of x) down to `bottom`, behind the rock."""
    rnd = random.Random(seed)
    for x in range(x0, x1):
        t = int(top(x))
        for y in range(t, bottom):
            p = c.at(x, y)
            if p and p[0] in ROCK:
                break
            c.put(x, y, "spruce-needles", 1 if ((y - t) // 9) % 2 == 0 else 2)
    for k in range(4):
        x = x0
        while x < x1:
            base = int(top(x)) + 9 * k + rnd.randrange(0, 3)
            if not (c.at(x, base) and c.at(x, base)[0] in ROCK):
                b.spruce(c, x, base, rnd.randrange(9, 18 - k * 2), "spruce-needles", seed=seed + x * 3 + k,
                         ratio=0.42, trunk=0, steps=(3, 2, 1 if k % 2 == 0 else 2, 0), flat=True)
            x += rnd.randrange(3, 6)


def rapid(c, x0, x1, y, h, seed=0):
    """A small drop in the stream: a short white curtain and a puff of foam."""
    sf.mouth(c, x0, x1, y, seed=seed, river=False)
    sf.curtain(c, (x0, x1), (x0 - 1, x1 + 1), y, y + h, seed=seed + 1)
    sf.splash(c, (x0 + x1) // 2, y + h + 2, max(2, (x1 - x0) // 2), seed=seed + 2, height=2)


def rows_over(c, x0, x1, ys, seed=0):
    """Rows of treetops in front of the stream's further reaches: each row
    stands at its own depth, so it hides the water behind it, and the
    stream winds back between them into the forest."""
    rnd = random.Random(seed)
    for k, y in enumerate(ys):
        snap = {(xx, yy): c.at(xx, yy) for xx in range(x0 - 8, x1 + 8) for yy in range(y - 16, y + 3)}
        x = x0 + rnd.randrange(0, 4)
        while x < x1:
            b.spruce(c, x, y + rnd.randrange(0, 3), rnd.randrange(7, 14), "spruce-needles", seed=seed + x + k * 97,
                     ratio=0.42, trunk=0, flat=True)
            x += rnd.randrange(4, 10)
        for (xx, yy), p in snap.items():
            if c.at(xx, yy) != p:
                c.front.add((xx, yy))


def tree_over(c, x, base, h, seed, mat="spruce-needles"):
    """A spruce standing in front of the water: it hides what it covers."""
    before = {(xx, yy) for yy in range(base - h - 2, base + 2) for xx in range(x - h, x + h) if c.at(xx, yy)}
    snap = {(xx, yy): c.at(xx, yy) for xx, yy in before}
    b.spruce(c, x, base, h, mat, seed=seed, ratio=0.42)
    for yy in range(base - h - 2, base + 2):
        for xx in range(x - h, x + h):
            p = c.at(xx, yy)
            if p and p[0] in (mat, "white-pine-bark") and snap.get((xx, yy)) != p:
                c.front.add((xx, yy))


# ---------------------------------------------------------------- the bluff round the falls

def slope_into(c, x0, y0, x1, y1, x2, y2):
    """Cuts the bluff's top edge down into the notch: the rock above the
    lines (x0, y0)-(x1, y1) and (x1, y1)-(x2, y2) goes, the forest behind
    shows, and the new edge gets a lit rim."""
    for x in range(x0, x2 + 1):
        if x <= x1:
            edge = y0 + (y1 - y0) * (x - x0) / max(1, x1 - x0)
        else:
            edge = y1 + (y2 - y1) * (x - x1) / max(1, x2 - x1)
        top = None
        for y in range(100, int(edge)):
            p = c.at(x, y)
            if p and p[0] in ROCK:
                c.put(x, y, "spruce-needles", 1 if (y // 9) % 2 == 0 else 0)
        for y in range(int(edge), int(edge) + 3):
            p = c.at(x, y)
            if p and p[0] in ROCK:
                if top is None:
                    top = y
                    c.put(x, y, "pink-granite", 4 if x > x1 else 3)  # the new rim, lit
                    if random.Random(x).random() < 0.35:
                        c.put(x, y, "moss", 3)


def recess(c, left, right, y0, y1, seed=0):
    """The walls of the recess the falls has cut: the right wall faces the
    sun (light from the upper left) and is lit, the left one is in shade."""
    rnd = random.Random(seed)
    for y in range(y0, y1):
        t = (y - y0) / max(1, y1 - y0)
        lx = round(left[0] + (left[1] - left[0]) * t)
        rx = round(right[0] + (right[1] - right[0]) * t)
        for k in range(rnd.randrange(3, 6)):
            p = c.at(lx - k, y)
            if p and p[0] == "pink-granite":
                c.put(lx - k, y, "pink-granite", max(0, min(p[1], 1 if k < 3 else 2)))
        for k in range(rnd.randrange(3, 6)):
            p = c.at(rx + k, y)
            if p and p[0] == "pink-granite":
                c.put(rx + k, y, "pink-granite", 3 if k < 2 else max(p[1], 2))


def cedars(c, spots, seed=0):
    """Small white cedars clinging to the ledges by the falls."""
    rnd = random.Random(seed)
    for x, y, side in spots:
        for k in range(4):
            c.put(x + side * k, y - k // 2, "white-pine-bark", 1)
        for k in range(3):
            b.blob(c, x + side * (3 + k * 2), y - 3 - k, rnd.randrange(2, 4), "cedar-foliage", rnd=rnd, flat=0.6)


def common(c):
    """What all three versions do to the bluff round the falls."""
    recess(c, (192, 186), (210, 214), 160, 276, seed=70)
    cedars(c, [(178, 190, -1), (224, 228, 1), (180, 230, -1)], seed=71)


# ---------------------------------------------------------------- the versions

def ravine(c):
    sf.falls_a(c)
    slope_into(c, 160, 144, 199, 157, 250, 136)
    ribbon(c, [(209, 117, 3), (214, 120, 4), (205, 124, 6), (217, 130, 8), (199, 138, 11), (211, 147, 14), (201, 157, 16)], seed=80)
    rows_over(c, 192, 230, [127, 141], seed=88)
    for k, (x, base, h) in enumerate([(190, 152, 26), (228, 144, 30), (182, 140, 22)]):
        tree_over(c, x, base, h, seed=90 + k)
    common(c)


def plateau(c):
    sf.falls_a(c)
    plateau_forest(c, 168, 286, lambda x: 110 + abs(x - 228) * 0.18, 168, seed=130)
    slope_into(c, 176, 150, 199, 157, 226, 146)
    river(c, [(244, 122, 3), (220, 124, 4), (240, 129, 5), (210, 134, 6), (234, 141, 8), (206, 149, 11), (201, 157, 15)], seed=81)
    for k, (x, base, h) in enumerate([(262, 142, 22), (186, 152, 22), (249, 124, 12), (243, 125, 10)]):
        tree_over(c, x, base, h, seed=100 + k)  # the far end goes round behind the trees
    common(c)


def gorge(c):
    sf.falls_a(c)
    slope_into(c, 172, 146, 199, 157, 240, 140)
    ribbon(c, [(206, 119, 3), (204, 123, 4), (205, 128, 6)], seed=82)
    rapid(c, 201, 208, 129, 6, seed=83)
    ribbon(c, [(203, 139, 7), (203, 143, 8)], seed=84)
    rapid(c, 198, 208, 144, 6, seed=85)
    ribbon(c, [(202, 153, 11), (201, 157, 14)], seed=86)
    # the gorge's granite walls, low and rounded, stepping up behind,
    # in front of the stream's edges
    sf.front_rock(c, [(186, 160), (187, 148), (191, 140), (196, 136), (199, 142), (198, 152), (196, 160)], seed=110, moss=0.4)
    sf.front_rock(c, [(207, 160), (207, 150), (210, 141), (216, 136), (222, 138), (222, 152), (216, 160)], seed=111, moss=0.4)
    sf.front_rock(c, [(196, 136), (198, 126), (202, 122), (203, 130), (200, 136)], seed=112, moss=0.4)
    sf.front_rock(c, [(208, 136), (209, 126), (213, 120), (217, 124), (216, 134)], seed=113, moss=0.4)
    rows_over(c, 194, 216, [122], seed=87)
    for k, (x, base, h) in enumerate([(188, 136, 20), (224, 128, 22), (232, 146, 26)]):
        tree_over(c, x, base, h, seed=120 + k)
    common(c)


VERSIONS = {"A": ravine, "B": plateau, "C": gorge}


def export(name, fn):
    land, strip, anchors = b.images(b.version_c(fn))
    OUT.mkdir(parents=True, exist_ok=True)
    land.save(OUT / f"{name}-land.png")
    strip.save(OUT / f"{name}-falls.png")
    (OUT / f"{name}.json").write_text(json.dumps(anchors) + "\n")


if __name__ == "__main__":
    export("now", sf.falls_a)
    for name, fn in VERSIONS.items():
        export(name, fn)
        print(name)
