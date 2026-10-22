"""Study 5: the cattails at the shoreline.

The cattails were the pack's art, outlined, floating 9 px out on the lake's
surface band instead of rooted at the water's edge. This study tucks them
in against the beach, roots them in the shallows, and adds algae where they
stand (a floating mat of green scum on the surface, threads of it on their
stems under the water), in three versions:

- **A, tucked in:** the pack's cattails moved tight to the shore, their
  feet in the water, with an algae mat round them.
- **B, our stand:** cattails redrawn in our materials (no outline, lit as
  one mass, seed heads catching the light) as a dense stand along the
  shore, with the algae mat and their stems seen through the water, threads
  of algae on them.
- **C, mixed shallows:** our cattails in clumps with bulrush and sedge
  between, the algae mat, duckweed scattered on the surface, a few lily
  pads, and the stems under the water.

Every piece sways or drifts in four frames. Below the waterline everything
is drawn through the water: in the lake's own colours, mixed toward them
the deeper it goes.

    python3 tools/studio/study_shore.py   -> docs/studio/studies/05-shore/
"""
import json
import math
import random
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import study_bank as b  # noqa: E402
from materials import lerp, lit, rgb  # noqa: E402

OUT = b.ROOT / "docs" / "studio" / "studies" / "05-shore"
FRAMES = 4
WATERLINE = 2  # rows below SURFACE_Y - 2 (the surface band's top) where the water starts, in image terms
LAKE = ["#2c5c78", "#4f738b", "#86a398", "#b0ecf0"]


def materials():
    R = b.materials()
    R["algae"] = ["#3a4420", "#5a6a2c", "#7e9038", "#a8b850"]  # green scum, olive to yellow-green
    R["cattail"] = b.ramp("#4c6a36", 4)  # deeper than the materials sample: leaves in the shade of the stand
    R["sedge"] = R["grass"]
    R["lily"] = ["#2f4a2a", "#4a6a34", "#6e8f44", "#94b45a"]
    return R


class Sheet:
    """A sprite drawn as four frames: put(frame, x, y, colour)."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.frames = [Image.new("RGBA", (w, h)) for _ in range(FRAMES)]

    def put(self, f, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.frames[f].putpixel((x, y), (*rgb(c), 255))

    def strip(self):
        out = Image.new("RGBA", (self.w * FRAMES, self.h))
        for i, im in enumerate(self.frames):
            out.paste(im, (i * self.w, 0))
        return out


def colour(R, mat, step, time="day"):
    r = R[mat]
    step = max(0, min(len(r) - 1, step))
    return lit(r[step], step, len(r), time)


def underwater(c, depth):
    """A colour seen through `depth` rows of water: mixed toward the lake."""
    if depth <= 0:
        return c
    return lerp(c, LAKE[1], min(0.75, 0.35 + depth * 0.05))


# ---------------------------------------------------------------- plants

def cattail(sh, R, x, base, h, seed, water, head=True, leaves=6):
    """One cattail plant: a fan of long, flat leaves arcing out from the
    base, 2 px wide low down and narrowing to a point, dark at the root,
    lit on the sun's side, some tips bending over; and a straight flower
    stalk with its brown seed head (lit on the sun's side, dark underneath)
    and the thin spike above it. Each frame the tips sway a little, the base
    still. `water` is the image row of the waterline: below it the plant is
    seen through the water."""
    rnd = random.Random(seed)
    blades = []
    for i in range(leaves):
        lean = (i - (leaves - 1) / 2) / leaves * 1.6 + rnd.uniform(-0.25, 0.25)
        blades.append((lean, rnd.randrange(int(h * 0.55), h + 1), rnd.random() < 0.3))
    for f in range(FRAMES):
        sway = math.sin(f * math.pi / 2 + seed)
        for lean, bh, droop in sorted(blades, key=lambda b_: -abs(b_[0])):
            for k in range(bh):
                t = k / bh
                # arcing out: the lean grows with height; a drooping tip folds over
                dx = lean * (k * 0.25 + t * t * bh * 0.35) + t ** 2 * sway * 1.5
                y = base - k
                if droop and t > 0.8:
                    dx += (t - 0.8) * 20 * (1 if lean >= 0 else -1)
                    y += round((t - 0.8) * 12)
                xx = x + round(dx)
                step = 1 if t < 0.25 else (3 if lean < 0 and t > 0.35 else 2)
                sh.put(f, xx, y, underwater(colour(R, "cattail", step), y - water))
                if t < 0.6:
                    sh.put(f, xx + 1, y, underwater(colour(R, "cattail", max(0, step - 1)), y - water))
        if head:
            sh_h = h + rnd.randrange(2, 6)
            top = base - sh_h
            for k in range(sh_h):
                y = base - k
                t = k / sh_h
                sh.put(f, x + round((t ** 2) * sway), y, underwater(colour(R, "cattail", 1), y - water))
            hx = x + round(sway) - 1
            for k in range(6):  # the seed head, a brown cylinder, rounded at its ends
                y = top + 2 + k
                end = k in (0, 5)
                sh.put(f, hx, y, colour(R, "cattail-head", 1 if end else 2))
                sh.put(f, hx + 1, y, colour(R, "cattail-head", 1 if end else 2 if k < 3 else 1))
                if not end:
                    sh.put(f, hx + 2, y, colour(R, "cattail-head", 0))
            sh.put(f, hx + 1, top, colour(R, "cattail", 3))  # the spike
            sh.put(f, hx + 1, top + 1, colour(R, "cattail", 2))


def bulrush(sh, R, x, base, h, seed, water):
    """Bulrush: a few round, upright stems, dark green, a little brown tuft
    near the top of one."""
    rnd = random.Random(seed)
    stems = [(rnd.randrange(-2, 3), rnd.randrange(int(h * 0.7), h + 1)) for _ in range(4)]
    for f in range(FRAMES):
        sway = math.sin(f * math.pi / 2 + seed)
        for i, (ox, sh_h) in enumerate(stems):
            for k in range(sh_h):
                t = k / sh_h
                y = base - k
                dx = ox + round((t ** 2) * sway)
                sh.put(f, x + dx, y, underwater(colour(R, "spruce-needles", 2 if t > 0.4 else 1), y - water))
            if i == 0:
                sh.put(f, x + ox + round(sway) + 1, base - sh_h + 2, colour(R, "cattail-head", 2))
                sh.put(f, x + ox + round(sway) + 1, base - sh_h + 3, colour(R, "cattail-head", 1))


def sedge(sh, R, x, base, seed, water):
    """A low tuft of sedge at the water's edge."""
    rnd = random.Random(seed)
    blades = [(rnd.uniform(-1, 1), rnd.randrange(3, 8)) for _ in range(5)]
    for f in range(FRAMES):
        sway = math.sin(f * math.pi / 2 + seed) * 0.6
        for lean, bh in blades:
            for k in range(bh):
                t = k / bh
                y = base - k
                sh.put(f, x + round(lean * k * 0.6 + t * t * sway), y,
                       underwater(colour(R, "grass", 3 if t > 0.6 and lean < 0 else 2), y - water))


def threads(sh, R, x, top, n, seed):
    """Threads of green algae hanging off a stem under the water, drifting."""
    rnd = random.Random(seed)
    for f in range(FRAMES):
        for k in range(n):
            y = top + k
            dx = round(math.sin(k / 3 + f * math.pi / 2 + seed) * min(2, k / 4))
            sh.put(f, x + dx, y, underwater(colour(R, "algae", 2 if k % 3 else 1), 2 + k))


# ---------------------------------------------------------------- on the surface

def mat_sheet(R, w, spans, seed, duckweed=0, pads=()):
    """The algae mat floating on the surface round the plants' feet: soft
    patches of green scum, thick in the middle and breaking up into specks
    at its edges, drifting a little each frame; duckweed scattered further
    out; lily pads lying flat. Drawn over the surface band's top rows."""
    rnd = random.Random(seed)
    sh = Sheet(w, 8)
    patches = []
    for x0, x1 in spans:
        x = x0
        while x < x1:
            patches.append((x, rnd.uniform(2.5, 4.5), rnd.randrange(7, 15)))
            x += rnd.randrange(4, 9)
    specks = [(rnd.randrange(0, w), rnd.randrange(1, 7)) for _ in range(duckweed)]
    for f in range(FRAMES):
        drift = [0, 1, 1, 0][f]
        for cx, depth, half in patches:
            for x in range(int(cx - half), int(cx + half) + 1):
                u = abs(x - cx) / half
                rows = depth * (1 - u * u)
                for y in range(1, 1 + int(round(rows)) + 1):
                    if u > 0.7 and rnd.random() < 0.5:
                        continue
                    edge = y >= rows
                    sh.put(f, x + drift, y, R["algae"][1 if edge else (3 if y <= 2 and (x + f) % 3 else 2)])
        for x, y in specks:
            sh.put(f, (x + (f if y % 2 else -f // 2)) % w, y, R["algae"][3 if (x + y) % 3 else 2])
        for px, py in pads:
            for dx in range(-3, 4):
                for dy in range(0, 2):
                    if abs(dx) == 3 and dy == 1:
                        continue
                    if dx == 1 and dy == 0:
                        continue  # the notch
                    sh.put(f, px + dx, py + dy, R["lily"][3 if dy == 0 and dx < 0 else 2 if dy == 0 else 1])
    return sh


# ---------------------------------------------------------------- the versions
# The reeds image: its bottom row at SURFACE_Y + 6, in the shallows just off
# the beach, so the plants stand with their feet a few rows under the water.
RW, RH, RBOTTOM = 110, 52, 6
RWATER = RH - 1 - (RBOTTOM + 2)


def stand(R, plants):
    sh = Sheet(RW, RH)
    for kind, x, h, seed in plants:
        base = RH - 1 - rnd_base(seed)
        if kind == "cattail":
            cattail(sh, R, x, base, h, seed, RWATER, head=seed % 3 != 0)
        elif kind == "bulrush":
            bulrush(sh, R, x, base, h, seed, RWATER)
        elif kind == "sedge":
            sedge(sh, R, x, RWATER + 1, seed, RWATER)
        elif kind == "threads":
            threads(sh, R, x, RWATER + 3, h, seed)
    return sh


def rnd_base(seed):
    return random.Random(seed).randrange(0, 4)


def version_a(R):
    """The pack's cattails, tucked in tight to the shore, feet in the water."""
    items = [{"key": f"cattails-{k}", "x": x, "y": 1, "layer": "reeds"} for x, k in ((-4, 2), (16, 3), (34, 4), (52, 3))]
    mat = mat_sheet(R, 96, [(0, 70)], seed=1)
    return {"sheets": {"shore-algae": mat}, "items": items + [
        {"key": "shore-algae", "x": 0, "y": -2, "layer": "surface", "origin": [0, 0], "bob": True, "fps": 2}]}


def version_b(R):
    """Our own dense stand of cattails along the shore."""
    rnd = random.Random(2)
    plants = []
    x = 1
    while x < 74:
        plants.append(("cattail", x, rnd.randrange(18, 30), rnd.randrange(1000)))
        x += rnd.randrange(5, 9)
    for x in range(4, 70, 9):
        plants.append(("threads", x + rnd.randrange(-2, 3), rnd.randrange(3, 6), rnd.randrange(1000)))
    reeds = stand(R, plants)
    mat = mat_sheet(R, 96, [(0, 82)], seed=3)
    return {"sheets": {"shore-reeds": reeds, "shore-algae": mat}, "items": [
        {"key": "shore-algae", "x": 0, "y": -2, "layer": "surface", "origin": [0, 0], "bob": True, "fps": 2},
        {"key": "shore-reeds", "x": -4, "y": RBOTTOM, "layer": "reeds", "fps": 3}]}


def version_c(R):
    """Clumps of cattails, bulrush and sedge, algae, duckweed, lily pads."""
    rnd = random.Random(4)
    plants = []
    for cx in (6, 34, 62):
        for k in range(rnd.randrange(4, 7)):
            plants.append(("cattail", cx + rnd.randrange(-6, 7), rnd.randrange(18, 30), rnd.randrange(1000)))
    for x in (20, 48, 76):
        plants.append(("bulrush", x, rnd.randrange(14, 22), rnd.randrange(1000)))
    for x in range(0, 90, 6):
        plants.append(("sedge", x + rnd.randrange(0, 4), 0, rnd.randrange(1000)))
    for x in range(4, 80, 8):
        plants.append(("threads", x, rnd.randrange(3, 6), rnd.randrange(1000)))
    reeds = stand(R, plants)
    mat = mat_sheet(R, 120, [(0, 22), (28, 46), (56, 74)], seed=5, duckweed=30, pads=((86, 3), (100, 5), (93, 1)))
    return {"sheets": {"shore-reeds": reeds, "shore-algae": mat}, "items": [
        {"key": "shore-algae", "x": 0, "y": -2, "layer": "surface", "origin": [0, 0], "bob": True, "fps": 2},
        {"key": "shore-reeds", "x": -4, "y": RBOTTOM, "layer": "reeds", "fps": 3}]}


VERSIONS = {"A": version_a, "B": version_b, "C": version_c}


def export(name, v):
    d = OUT / name
    d.mkdir(parents=True, exist_ok=True)
    sheets = {}
    for key, sh in v["sheets"].items():
        sh.strip().save(d / f"{key}.png")
        sheets[key] = {"url": f"assets/art/study/{key}.png", "frameWidth": sh.w, "frameHeight": sh.h, "frames": FRAMES}
    (OUT / f"{name}.json").write_text(json.dumps({"sheets": sheets, "anchors": {"shore": {"items": v["items"]}}}, indent=1) + "\n")


if __name__ == "__main__":
    R = materials()
    for name, fn in VERSIONS.items():
        export(name, fn(R))
        print(name)
