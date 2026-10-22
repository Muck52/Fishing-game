"""The materials library: every material in the lake as a colour ramp, the
way it's lit at each time of day, and a texture sample drawn by its rules.

    python3 tools/studio/materials.py   -> docs/studio/materials/

How it works (the reasons are in docs/studio/research/materials.md):

- **A ramp per material.** Each starts from a real colour (from the
  north-woods research) as its middle shade, and steps out to 4-6 shades:
  each step darker turns its hue toward blue-violet, each step lighter
  toward yellow, saturation highest in the middle. Metal goes the other way.
- **Light per time of day.** Each time (dawn, day, golden hour, dusk, night)
  has a key light (the sun, or the moon) and an ambient colour (the sky).
  A ramp's light end takes the key light's colour, its dark end the sky's,
  so the light changes the colours instead of tinting them, and shadows
  keep their cool hue. The sky, the far hills and the water take their
  colours from the time itself.
- **A texture rule per material, drawn as a sample**, at game size: planks
  with contrast at the seams and grain on only a few; bark by tree; granite
  chiselled into big clean planes with a few flecks and lichen; needles in
  tiers with a dark crescent under and light on top; sky in flat bands of
  varied height; hills in hazy bands; a clear lake darkening in bands; a
  lakebed of sand, cobble and muck. Clusters, not specks; no noise dither.

Everything here is a proposal for the studies to try; nothing is in the
game until a study settles it.
"""
import colorsys
import json
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "studio" / "materials"
BG = (178, 208, 208)


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def hexc(c):
    return "#%02x%02x%02x" % tuple(max(0, min(255, round(v))) for v in c)


def toward(h, target, deg):
    d = (target - h + 0.5) % 1 - 0.5
    step = deg / 360
    return h + max(-step, min(step, d))


# ---------------------------------------------------------------- ramps

def ramp(base, n=5, shift=10, metal=False, reach=(0.55, 0.5)):
    """A hue-shifted ramp around a middle colour. reach: how far the darkest
    and lightest steps go (as a share of the way to black and to white)."""
    h, s, v = colorsys.rgb_to_hsv(*(x / 255 for x in rgb(base)))
    mid = (n - 1) / 2
    out = []
    for i in range(n):
        k = (i - mid) / mid if mid else 0  # -1 darkest .. +1 lightest
        steps = abs(i - mid)
        cool, warm = (55 / 360, 250 / 360) if metal else (250 / 360, 55 / 360)
        hh = toward(h, cool if k < 0 else warm, shift * steps) if k else h
        if k < 0:
            vv = v * (1 - reach[0] * -k)
            ss = min(1, s * (1 + (0.25 if metal else 0.12) * -k))
        else:
            vv = v + (1 - v) * reach[1] * k
            ss = s * (1 - (0.45 if metal else 0.22) * k)
        out.append(hexc(tuple(x * 255 for x in colorsys.hsv_to_rgb(hh % 1, ss, vv))))
    return out


# ---------------------------------------------------------------- light

# key light and sky (ambient) for each time of day, as multipliers, plus the
# sky's own colours top to horizon (from the research)
TIMES = {
    "dawn": {"key": (1.06, 0.90, 0.84), "sky": (0.66, 0.70, 0.92), "gain": 0.92,
             "grad": ["#3a4a78", "#c88aa0", "#f2c29a"]},
    "day": {"key": (1.02, 1.00, 0.95), "sky": (0.86, 0.92, 1.04), "gain": 1.0,
            "grad": ["#3e7cc4", "#6fa4d8", "#c6ddee"]},
    "golden": {"key": (1.12, 0.96, 0.74), "sky": (0.80, 0.86, 1.02), "gain": 0.97,
               "grad": ["#5a86b8", "#e8b070", "#f4c878"]},
    "dusk": {"key": (1.04, 0.74, 0.64), "sky": (0.56, 0.58, 0.84), "gain": 0.8,
             "grad": ["#4a4f80", "#d86a5a", "#f49a48"]},
    "night": {"key": (0.50, 0.58, 0.82), "sky": (0.24, 0.28, 0.46), "gain": 1.0,
              "grad": ["#05070f", "#0d1326", "#1c2640"]},
}


def lit(colour, i, n, time):
    """A ramp colour at step i of n under a time of day's light: the light
    end of the ramp takes the key light, the dark end the sky."""
    t = TIMES[time]
    w = i / (n - 1) if n > 1 else 1
    mul = [t["sky"][c] * (1 - w) + t["key"][c] * w for c in range(3)]
    return hexc(tuple(rgb(colour)[c] * mul[c] * t["gain"] for c in range(3)))


def lerp(a, b, t):
    return hexc(tuple(x + (y - x) * t for x, y in zip(rgb(a), rgb(b))))


def sky_bands(time, n=8):
    """The sky as flat bands, top to horizon, through its three colours."""
    top, mid, hor = TIMES[time]["grad"]
    out = []
    for i in range(n):
        t = i / (n - 1)
        out.append(lerp(top, mid, t * 2) if t < 0.5 else lerp(mid, hor, (t - 0.5) * 2))
    return out


# ---------------------------------------------------------------- materials

MATERIALS = {
    # name: (middle colour, shades, what it is, texture rule)
    "dock-wood": ("#8a857c", 5, "Weathered dock and hut wood", "Silver-grey cedar after a season or two. Planks: lit bevel on top, shadow under, the seam darkest; grain on only a few; a stained board now and then."),
    "cedar": ("#a8703f", 5, "Fresh cedar", "New boards and trim before they grey: warm red-tan, same plank rule."),
    "algae-wood": ("#4a4c34", 4, "Wood at the waterline", "Green-black where posts and planks stay wet."),
    "barn-red": ("#8e2f25", 4, "Barn-red paint", "The hut's trim and door; flat paint, soft highlight."),
    "forest-green": ("#2f4a35", 4, "Forest-green paint", "The other trim colour."),
    "white-pine-bark": ("#5a4f4a", 5, "White pine bark", "Grey-brown with a purple cast, long furrowed plates; stripes widest mid-trunk."),
    "red-pine-bark": ("#c2643a", 5, "Red pine bark, upper", "Thin, flaky orange-red bark high on the trunk; glows in evening sun."),
    "red-pine-plates": ("#7a4e3a", 5, "Red pine bark, lower", "Thick grey-brown to reddish plates low on the trunk."),
    "birch-bark": ("#e2ddd2", 5, "Paper birch bark", "Chalk white with short black horizontal marks, a pink curl now and then."),
    "white-pine-needles": ("#4f6b5a", 5, "White pine needles", "Soft blue-green in flat horizontal tiers with gaps; dark crescent under, light on top."),
    "spruce-needles": ("#33503f", 5, "Spruce and fir needles", "Darker, a sharp spire of short tiers, upper tiers shading the ones below."),
    "aspen-leaves": ("#7a9a45", 5, "Aspen and birch leaves", "Round clusters; detail at the edges, calm inside; gold in fall."),
    "grass": ("#5f7a3a", 4, "Shore grass", "Short 1 px blades, thicker near, 1-2 px clusters far."),
    "cattail": ("#6b8040", 4, "Cattail blades", "Long leaning blades; heads in the shared brown."),
    "cattail-head": ("#5a3a22", 3, "Cattail heads", "2-3 px dark brown heads."),
    "pink-granite": ("#c99a8a", 5, "Pink granite", "Big clean planes chiselled from a blob, a few dark flecks, lichen on top, algae at the waterline."),
    "grey-gneiss": ("#8a8a88", 5, "Grey gneiss", "The other shore rock; same rule."),
    "basalt": ("#4a4a4c", 5, "Basalt", "Dark, weathering rusty."),
    "lichen": ("#e07a1f", 3, "Sunburst lichen", "Small orange clusters on shore rock."),
    "sand": ("#c8b48a", 5, "Sand", "Wavy hard-edged ripples, a few 'c' marks, cool shadow to warm light."),
    "cobble": ("#8c8178", 4, "Cobble", "Rounded stones in grey, pink and black; only a few shaded."),
    "muck": ("#3a3324", 4, "Lake-bottom muck", "Flat dark brown-black, a few soft lumps; the quietest texture."),
    "lake-clear": ("#2f5e66", 6, "Clear lake water", "Green-teal shallows to dark teal: flat bands of varied height, ordered dither only at the joins."),
    "snow": ("#e6edf2", 5, "Snow and ice (for winter)", "White through cyan to deep blue; zig-zag snow on top surfaces."),
    "aluminium": ("#a8aeb4", 5, "Aluminium (boats, dock legs)", "Metal: cool pale lights, warm deep darks, lines of reflection, rivets."),
    "canvas": ("#a89a7a", 4, "Canvas and cloth", "Soft shadows, no highlight; folds from pinch points."),
    "rope": ("#b59a62", 4, "Rope and line", "A regular diagonal step, light and dark every 2 px."),
    "black-fur": ("#33323d", 5, "Black fur (Olive, the bear)", "Clumps, not strands; inner lines in darker fur, never black."),
    "white-fur": ("#eae2dc", 5, "White fur", "Same rule; shade cools toward blue-grey."),
    "tawny-fur": ("#a9805f", 5, "Tawny fur (deer, hare)", "Same rule."),
    "feather-grey": ("#b2c4c8", 5, "Pale feathers (gull)", "Rows as single clusters overlapping toward the body, split by one shadow line."),
    "fish-olive": ("#6c7f58", 5, "Fish back (olive)", "Scales by suggestion: a few arcs in the mid tones, ends plain."),
}
METAL = {"aluminium"}


def ramps():
    return {k: ramp(v[0], v[1], metal=k in METAL) for k, v in MATERIALS.items()}


# ---------------------------------------------------------------- samples
# Each sample is a grid of (material, step) or None, drawn at game size.

def blank(w, h):
    return [[None] * w for _ in range(h)]


def planks(mat, w=48, h=26, seed=1):
    rnd = random.Random(seed)
    g = blank(w, h)
    for top in range(0, h, 5):
        stained = rnd.random() < 0.18
        base = 1 if stained else 2
        joint = rnd.randrange(10, 30)
        grain = rnd.random() < 0.35
        for y in range(top, min(top + 5, h)):
            for x in range(w):
                r = y - top
                step = 0 if r == 4 else 3 if r == 0 else base if r < 3 else 1
                g[y][x] = (mat, step)
            if grain and 0 < y - top < 3:
                x0 = rnd.randrange(0, w - 10)
                for x in range(x0, x0 + rnd.randrange(4, 9)):
                    g[y][x] = (mat, max(0, base - 1))
        for y in range(top, min(top + 4, h)):  # butt joint: dark line, lit edge after it
            g[y][joint] = (mat, 0)
            if joint + 1 < w:
                g[y][joint + 1] = (mat, 3)
        if rnd.random() < 0.3:  # a knot
            kx, ky = rnd.randrange(4, w - 4), top + 2
            g[ky][kx] = (mat, 0)
            g[ky][kx + 1] = (mat, 1)
    return g


def trunk(kind, w=12, h=40, seed=2):
    rnd = random.Random(seed)
    g = blank(w, h)
    # lit from the upper left: the left of the trunk lightest, the right darkest
    across = [2, 3, 3, 3, 2, 2, 2, 2, 1, 1, 1, 0][:w]
    mat = {"white": "white-pine-bark", "red": "red-pine-bark", "birch": "birch-bark"}[kind]
    for y in range(h):
        for x in range(w):
            g[y][x] = (mat, across[x])
    if kind == "white":  # long vertical furrows between plates, broken now and then
        for x in (2, 5, 8):
            y = 0
            while y < h:
                run = rnd.randrange(5, 12)
                for yy in range(y, min(h, y + run)):
                    g[yy][x + (1 if (yy // 7) % 2 else 0)] = (mat, 0)
                y += run + rnd.randrange(1, 3)
    elif kind == "red":  # flaky orange above, thick plates low down
        split = int(h * 0.5)
        for y in range(split, h):
            for x in range(w):
                g[y][x] = ("red-pine-plates", across[x])
        for row in range(split, h, 5):  # plates: dark cracks round them, offset like bricks
            for x in range(w):
                g[row][x] = ("red-pine-plates", 0)
            for yy in range(row, min(h, row + 5)):
                g[yy][(3 + (row // 5) * 5) % (w - 2) + 1] = ("red-pine-plates", 0)
        for _ in range(8):  # a few flakes catching the light up top
            fx, fy = rnd.randrange(1, w // 2), rnd.randrange(0, split - 1)
            g[fy][fx] = (mat, 4)
            g[fy + 1][fx] = (mat, 3)
    else:  # birch: white, short black horizontal marks, a pink curl
        for _ in range(9):
            y, x = rnd.randrange(0, h), rnd.randrange(0, w - 3)
            for xx in range(x, x + rnd.randrange(2, 4)):
                g[y][xx] = (mat, 0)
        cy = rnd.randrange(5, h - 5)
        g[cy][w - 3] = ("red-pine-bark", 4)
        g[cy + 1][w - 3] = ("red-pine-bark", 3)
        for y in range(h - 6, h):  # dark, rough base on an old trunk
            for x in range(w):
                if rnd.random() < 0.5 + (y - (h - 6)) * 0.08:
                    g[y][x] = (mat, 0)
    return g


def boulder(mat, w=40, h=26, seed=3, waterline=None):
    rnd = random.Random(seed)
    g = blank(w, h)
    cx, cy, rx, ry = w / 2, h * 0.62, w / 2 - 1, h * 0.62 - 1
    lx, ly, lz = -0.55, -0.65, 0.52  # light from the upper left
    for y in range(h):
        for x in range(w):
            dx, dy = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
            d = dx * dx + dy * dy
            if d > 1 or y > h - 1:
                continue
            nz = math.sqrt(max(0, 1 - d))
            # chiselled: the normal is snapped into a few big planes
            ang = round(math.atan2(dy, dx) / (math.pi / 4)) * (math.pi / 4)
            r = math.sqrt(d)
            nx, ny = math.cos(ang) * r, math.sin(ang) * r
            shade = nx * lx + ny * ly + nz * lz
            step = 4 if shade > 0.75 else 3 if shade > 0.45 else 2 if shade > 0.15 else 1 if shade > -0.2 else 0
            g[y][x] = (mat, step)
    # a few dark flecks (mica), a crack, lichen on top
    for _ in range(5):
        x, y = rnd.randrange(6, w - 6), rnd.randrange(int(h * 0.35), h - 3)
        if g[y][x]:
            g[y][x] = (mat, 0)
    for y in range(int(h * 0.45), int(h * 0.8)):
        x = int(w * 0.62 + (y % 3 == 0))
        if g[y][x]:
            g[y][x] = (mat, 0)
    for _ in range(3):
        x = rnd.randrange(8, w - 10)
        for y in range(h):
            if g[y][x]:
                g[y][x] = ("lichen", 1)
                if x + 1 < w and g[y][x + 1]:
                    g[y][x + 1] = ("lichen", 2)
                break
    if waterline is not None:
        for y in range(waterline, h):
            for x in range(w):
                if g[y][x]:
                    g[y][x] = ("algae-wood", min(3, g[y][x][1]))
    return g


def conifer(kind, w=28, h=42, seed=4):
    """White pine: a few broad, ragged, flat plates of needles in tiers with
    sky between them, swept a little to one side by the wind, the top flat.
    Spruce: a sharp spire whose tiers slope down to ragged tips, each
    shading the one below. Dark crescent under each tier, light on top."""
    rnd = random.Random(seed)
    g = blank(w, h)
    cx = w // 2
    for y in range(3, h):  # the trunk
        g[y][cx] = ("white-pine-bark", 1)
        g[y][cx + 1] = ("white-pine-bark", 0)
    if kind == "pine":
        mat = "white-pine-needles"
        tiers = [(3, 6, 1, 3), (9, 9, 2, 4), (16, 12, 3, 4), (23, 10, 2, 4), (29, 8, 3, 3)]
        for ty, half, lean, thick in tiers:
            left, right = cx - half + lean, cx + half + lean + 1
            for x in range(left, right):
                if not 0 <= x < w:
                    continue
                edge = min(x - left, right - 1 - x)
                top = ty + (1 if edge < 2 else 0) + (rnd.random() < 0.3)
                bottom = ty + thick - (1 if edge < 1 else 0)
                for y in range(top, bottom + 1):
                    if y == bottom:
                        step = 0
                    elif y == top:
                        step = 4 if x > cx else 3
                    else:
                        step = 2 if x > left + 2 else 1
                    g[y][x] = (mat, step)
    else:
        mat = "spruce-needles"
        for i, ty in enumerate(range(1, h - 7, 3)):
            half = 1 + int(i * 0.9)
            for x in range(cx - half, cx + half + 2):
                if not 0 <= x < w:
                    continue
                d = abs(x - cx - 0.5) / (half + 0.5)
                droop = int(d * 2.5)  # tiers slope down toward their tips
                tip = rnd.random() < 0.25 and d > 0.7
                for dy in range(0, 4 - (1 if tip else 0)):
                    y = ty + droop + dy
                    if y >= h:
                        continue
                    step = 0 if dy == 3 else 3 if dy == 0 and x > cx else 2 if dy == 0 else 1
                    g[y][x] = (mat, step)
    return g


def leafy(w=30, h=28, seed=5):
    """A canopy built from leaf clusters: each cluster lit as one round
    shape (light upper left), the clusters overlapping, detail at the edge."""
    rnd = random.Random(seed)
    g = blank(w, h)
    clusters = [(15, 6, 4), (10, 9, 4), (20, 9, 4), (7, 14, 4), (14, 13, 5), (22, 14, 4), (11, 18, 4), (18, 18, 4)]
    for bx, by, r in clusters:
        for y in range(h):
            for x in range(w):
                d = math.hypot(x - bx, y - by)
                if d > r or (d > r - 1 and rnd.random() < 0.3):
                    continue
                u = ((x - bx) * -0.6 + (y - by) * -0.8) / r  # toward the light
                step = 4 if u > 0.55 else 3 if u > 0.1 else 2 if u > -0.4 else 1
                g[y][x] = ("aspen-leaves", step)
    for y in range(20, h):
        g[y][15] = ("birch-bark", 2)
        g[y][16] = ("birch-bark", 1)
    return g


def shore_plants(w=40, h=22, seed=6):
    rnd = random.Random(seed)
    g = blank(w, h)
    for x in range(w):  # grass
        for y in range(h - rnd.randrange(2, 5), h):
            g[y][x] = ("grass", 3 if y == h - 4 else 2 if rnd.random() < 0.6 else 1)
    for i in range(6):  # cattails
        x0 = 4 + i * 6 + rnd.randrange(-1, 2)
        tall = rnd.randrange(12, 19)
        lean = rnd.choice((-1, 0, 1))
        for k in range(tall):
            x = x0 + (lean if k > tall * 0.6 else 0)
            g[h - 1 - k][x] = ("cattail", 2 if k % 3 else 1)
        if i % 2 == 0:
            for k in range(3):
                g[h - tall - k + 1][x0 + lean] = ("cattail-head", 1 if k else 2)
                g[h - tall - k + 1][x0 + lean + 1] = ("cattail-head", 0)
    return g


def lakebed(w=48, h=16, seed=7):
    rnd = random.Random(seed)
    g = blank(w, h)
    for x in range(w):
        top = 3 + int(1.5 * math.sin(x / 5)) if x < 18 else 5 + (x - 18) // 6
        for y in range(top, h):
            if x < 18:
                g[y][x] = ("sand", 4 if y == top else 3 if y == top + 1 else 2)
            elif x < 32:
                g[y][x] = ("cobble", 1)
            else:
                g[y][x] = ("muck", 2 if y == top else 1)
    for _ in range(5):  # only a few cobbles shaded
        cx, cy = rnd.randrange(19, 30), rnd.randrange(8, 14)
        for dy in range(2):
            for dx in range(3):
                g[cy + dy][cx + dx] = ("cobble", 3 if dy == 0 and dx < 2 else 2)
        g[cy + 1][cx + 2] = ("cobble", 0)
    for _ in range(3):
        cx, cy = rnd.randrange(34, 46), rnd.randrange(10, 15)
        g[cy][cx] = ("muck", 2)
        g[cy][cx + 1] = ("muck", 3)
    for x in (4, 10, 14):  # 'c' ripples in the sand
        g[6][x] = ("sand", 1)
        g[6][x + 1] = ("sand", 1)
        g[7][x - 1] = ("sand", 1)
    return g


def hull(w=48, h=14):
    g = blank(w, h)
    for y in range(h):
        for x in range(w):
            if y < 2:
                step = 4
            elif y < 5:
                step = 3
            elif y in (6, 7):
                step = 1  # a line of reflection
            elif y < 11:
                step = 2
            else:
                step = 0
            g[y][x] = ("aluminium", step)
    for x in range(3, w, 6):  # rivets
        g[3][x] = ("aluminium", 1)
        g[9][x] = ("aluminium", 1)
    return g


def rope(w=40, h=4):
    g = blank(w, h)
    for x in range(w):
        for y in range(h):
            g[y][x] = ("rope", 2 if (x + y * 2) % 4 < 2 else 1)
        g[0][x] = ("rope", 3 if x % 4 < 2 else 2)
        g[h - 1][x] = ("rope", 0 if x % 4 >= 2 else 1)
    return g


SAMPLES = [
    ("Weathered planks", lambda: planks("dock-wood")),
    ("Fresh cedar", lambda: planks("cedar", seed=4)),
    ("White pine bark", lambda: trunk("white")),
    ("Red pine bark", lambda: trunk("red")),
    ("Birch bark", lambda: trunk("birch")),
    ("Pink granite", lambda: boulder("pink-granite", waterline=21)),
    ("Grey gneiss", lambda: boulder("grey-gneiss", seed=9)),
    ("White pine", lambda: conifer("pine")),
    ("Spruce", lambda: conifer("spruce")),
    ("Aspen", leafy),
    ("Grass, cattails", shore_plants),
    ("Sand, cobble, muck", lakebed),
    ("Aluminium hull", hull),
    ("Rope", rope),
]


def paint(grid, R, time, scale=1):
    h, w = len(grid), len(grid[0])
    img = Image.new("RGBA", (w, h))
    px = img.load()
    for y in range(h):
        for x in range(w):
            c = grid[y][x]
            if c:
                mat, i = c
                ramp_ = R[mat]
                i = max(0, min(len(ramp_) - 1, i))
                px[x, y] = (*rgb(lit(ramp_[i], i, len(ramp_), time)), 255)
    return img.resize((w * scale, h * scale), Image.NEAREST) if scale > 1 else img


# ---------------------------------------------------------------- scenery that comes from the time itself

def sky_image(time, w=48, h=48):
    """Flat bands of varied height (bands of equal height draw the eye to
    their edges), joined by a one-row ordered dither."""
    bands = sky_bands(time)
    heights = [9, 7, 6, 6, 5, 5, 5, 5]
    img = Image.new("RGBA", (w, h))
    px = img.load()
    y = 0
    for i, (c, bh) in enumerate(zip(bands, heights)):
        for yy in range(y, min(h, y + bh)):
            for x in range(w):
                col = c
                if yy == y + bh - 1 and i + 1 < len(bands) and x % 2 == (yy % 2):
                    col = bands[i + 1]
                px[x, yy] = (*rgb(col), 255)
        y += bh
    return img


def hills_image(time, w=64, h=40, seed=8):
    """Low, rounded, forested ridges in three bands of haze: each farther
    band lighter, softer and nearer the sky's colour, a haze band at their
    foot; the near ridge's edge broken by 1-2 px tree tips."""
    rnd = random.Random(seed)
    bands = sky_bands(time)
    horizon = bands[-1]
    forest = lit(ramps()["spruce-needles"][1], 1, 5, time)
    if time == "night":
        # at night the hills are dark shapes against a faintly lighter sky
        far, mid, near = lerp(horizon, "#000000", 0.25), lerp(horizon, "#000000", 0.45), lerp(horizon, "#000000", 0.65)
    else:
        far = lerp(horizon, bands[4], 0.35)
        mid = lerp(far, forest, 0.35)
        near = lerp(far, forest, 0.75)
    img = sky_image(time, w, h)
    px = img.load()
    for colour, base, amp, period, trees in ((far, 16, 4, 23, False), (mid, 23, 3, 17, False), (near, 29, 3, 13, True)):
        for x in range(w):
            top = int(base - amp * (0.5 + 0.5 * math.sin(x / period * math.pi + base)))
            if trees and rnd.random() < 0.55:
                top -= rnd.choice((1, 1, 2))
            for y in range(max(0, top), h):
                px[x, y] = (*rgb(colour), 255)
    haze = lerp(horizon, near, 0.45)
    for y in range(h - 4, h):
        for x in range(w):
            if y > h - 4 or (x % 2 == 0):
                px[x, y] = (*rgb(haze), 255)
    return img


def water_image(time, w=32, h=56):
    """The clear lake from the surface down: the surface takes the sky's
    horizon, then green-teal darkening in flat bands of growing height."""
    R = ramps()["lake-clear"]
    surface = lerp(sky_bands(time)[-1], lit(R[4], 4, 6, time), 0.5)
    bands = [surface] + [lit(c, i, 6, time) for i, c in reversed(list(enumerate(R)))]
    heights = [2, 4, 6, 8, 10, 12, 14]
    img = Image.new("RGBA", (w, h))
    px = img.load()
    y = 0
    for i, (c, bh) in enumerate(zip(bands, heights)):
        for yy in range(y, min(h, y + bh)):
            for x in range(w):
                col = c
                if yy == y + bh - 1 and i + 1 < len(bands) and x % 2 == yy % 2:
                    col = bands[i + 1]
                px[x, yy] = (*rgb(col), 255)
        y += bh
    # two glints on the surface, short and bright, lined up with the light
    for x in (6, 7, 19):
        px[x, 0] = (*rgb(lerp(surface, "#ffffff", 0.6)), 255)
    return img


# ---------------------------------------------------------------- sheets

def label(d, xy, text, fill=(37, 19, 26)):
    d.text(xy, text, fill=fill)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    R = ramps()
    times = list(TIMES)
    # every ramp under every light
    sw, rows = 14, []
    sheet = Image.new("RGB", (190 + len(times) * (6 * sw + 12), 18 + len(R) * (sw + 4)), BG)
    d = ImageDraw.Draw(sheet)
    for j, t in enumerate(times):
        label(d, (190 + j * (6 * sw + 12), 4), t)
    for i, (name, r) in enumerate(R.items()):
        y = 18 + i * (sw + 4)
        label(d, (6, y + 2), MATERIALS[name][2][:30])
        for j, t in enumerate(times):
            for k, c in enumerate(r):
                x = 190 + j * (6 * sw + 12) + k * sw
                d.rectangle([x, y, x + sw - 1, y + sw - 1], fill=rgb(lit(c, k, len(r), t)))
    sheet.save(OUT / "ramps.png")
    # the samples at game size, enlarged 4x, under each light
    S = 4
    cell_w = max(len(f()[0]) for _, f in SAMPLES) * S + 16
    cell_h = max(len(f()) for _, f in SAMPLES) * S + 26
    grids = [(n, f()) for n, f in SAMPLES]
    big = Image.new("RGB", (120 + len(times) * cell_w, 20 + len(grids) * cell_h), BG)
    d = ImageDraw.Draw(big)
    for j, t in enumerate(times):
        label(d, (120 + j * cell_w, 4), t)
    for i, (n, g) in enumerate(grids):
        y = 20 + i * cell_h
        label(d, (6, y + 4), n)
        for j, t in enumerate(times):
            img = paint(g, R, t, S)
            big.paste(img, (120 + j * cell_w, y), img)
    big.save(OUT / "samples.png")
    # sky, hills and water: their colours come from the time itself
    S = 4
    env = Image.new("RGB", (100 + len(times) * (64 * S + 16), 20 + (40 + 56) * S + 30), BG)
    d = ImageDraw.Draw(env)
    for j, t in enumerate(times):
        x = 100 + j * (64 * S + 16)
        label(d, (x, 4), t)
        env.paste(hills_image(t).resize((64 * S, 40 * S), Image.NEAREST), (x, 20))
        env.paste(water_image(t).resize((32 * S, 56 * S), Image.NEAREST), (x, 20 + 40 * S + 10))
        env.paste(sky_image(t, 32, 48).resize((32 * S, 48 * S), Image.NEAREST), (x + 32 * S, 20 + 40 * S + 10))
    label(d, (6, 24), "hills")
    label(d, (6, 20 + 40 * S + 14), "water / sky")
    env.save(OUT / "sky-hills-water.png")
    # the numbers, for the docs and later the game
    data = {"times": {t: {"key": v["key"], "sky": v["sky"], "gain": v["gain"], "sky_bands": sky_bands(t)} for t, v in TIMES.items()},
            "materials": {k: {"what": MATERIALS[k][2], "rule": MATERIALS[k][3], "ramp": r,
                              "lit": {t: [lit(c, i, len(r), t) for i, c in enumerate(r)] for t in times}}
                          for k, r in R.items()}}
    (OUT / "materials.json").write_text(json.dumps(data, indent=1) + "\n")
    print(len(R), "materials,", len(SAMPLES), "samples")


if __name__ == "__main__":
    main()
