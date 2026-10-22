"""Study 9b: the birds, in more detail.

Study 9 settled how the birds fly (A, in profile); its drawings were
mostly flat shapes: one colour for a wing, a dark tip, a plain body. This
study adds the detail a birder looks for, at three levels:

- **A, feathered wings:** each wing laid out like a real one, in bands
  from the leading edge back: the small coverts (lighter), the flight
  feathers (darker, their trailing edge notched feather by feather), the
  primaries at the tip (with a gull's white mirrors, an eagle's spread
  fingers, a mallard's blue speculum between white bars, a sparrow's pale
  wing bars). Worked out from each wing's shape, so every frame of the
  beat gets it.
- **B, A plus field marks:** what tells each species apart: the gull's
  tucked yellow legs and grey back shading; the eagle's hooked bill, ragged
  white hood and yellow feet; the drake's curled black tail feathers,
  white tail edge and green sheen; the hen's orange bill with its dark
  saddle, eye stripe and mottling; the sparrow's streaked breast, central
  spot and grey brow; the loon's striped necklace, chin bar and chequered
  rows.
- **C, B drawn a third larger,** so each mark has more pixels to sit in
  (the birds would be bigger in the sky and on the beach).

    python3 tools/studio/study_bird_detail.py  -> docs/studio/studies/09b-bird-detail/
"""
import math
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "characters"))
sys.path.insert(0, str(ROOT / "tools" / "studio"))
import study_birds as sb  # noqa: E402
from anatomy import Canvas, scaled, rounder  # noqa: E402
from kit import outline, image  # noqa: E402
from edges import treat  # noqa: E402
from light import lit  # noqa: E402

OUT = ROOT / "docs" / "studio" / "studies" / "09b-bird-detail"
NEAR, FAR = "1", "2"  # wing letters until the feather pass colours them

# ---------------------------------------------------------------- wings
# How each species' wing is coloured, band by band: covert (the leading
# edge, lighter), base, second (the flight feathers), edge (the notched
# trailing edge), prim (the primaries, from `tip` of the way out), and the
# extras: mirror (white spots near the tip), fingers (gaps between the
# primaries), spec (a speculum: colour and its white bars).
WINGS = {
    "gull": {"covert": "c", "base": "G", "second": "d", "edge": "W", "prim": "K", "tip": 0.66, "mirror": "W",
             "far": {"covert": "g", "base": "g", "second": "h", "edge": "g", "prim": "K"}},
    "eagle": {"covert": "c", "base": "O", "second": "S", "edge": "d", "prim": "S", "tip": 0.6, "fingers": True,
              "far": {"covert": "S", "base": "S", "second": "d", "edge": "d", "prim": "d"}},
    "mallard": {"covert": "c", "base": "V", "second": "V", "edge": "v", "prim": "v", "tip": 0.62, "spec": ("Q", "W"),
                "far": {"covert": "v", "base": "v", "second": "v", "edge": "v", "prim": "v"}},
    "sparrow": {"covert": "c", "base": "S", "second": "S", "edge": "d", "prim": "d", "tip": 0.6, "bars": "w",
                "far": {"covert": "S", "base": "S", "second": "d", "edge": "d", "prim": "d"}},
}
WINGS["hen"] = WINGS["mallard"]
INKS = {
    "gull": {"c": "#c8e0dc", "d": "#97b7b4", "h": "#6e8a84"},
    "eagle": {"c": "#5e4434", "d": "#251a14"},
    "mallard": {"V": "#8f877a", "v": "#6e665c", "c": "#bdb8ae"},
    "hen": {"V": "#8f7a5e", "v": "#6e5c46", "c": "#a8916e", "W": "#faffff"},
    "sparrow": {"c": "#8a6a4a", "d": "#3e2c20", "w": "#d8c8a8", "u": "#6a4426"},
}


def feathers(g, root, st, wid):
    """Colours the wing drawn as `wid`: along it from root to tip (t) and
    across it from trailing edge to leading edge (f)."""
    cells = [(x, y) for y, row in enumerate(g) for x, ch in enumerate(row) if ch == wid]
    if not cells:
        return
    rx, ry = root
    tip = max(cells, key=lambda c: (c[0] - rx) ** 2 + (c[1] - ry) ** 2)
    L = math.dist(tip, root) or 1
    d = ((tip[0] - rx) / L, (tip[1] - ry) / L)
    n = (-d[1], d[0])
    if n[0] * -1 + n[1] * -1 < 0:  # the leading edge faces forward and up
        n = (-n[0], -n[1])
    t = {c: ((c[0] - rx) * d[0] + (c[1] - ry) * d[1]) / L for c in cells}
    s = {c: (c[0] - rx) * n[0] + (c[1] - ry) * n[1] for c in cells}
    bins = {}
    for c in cells:
        bins.setdefault(round(t[c] * 8), []).append(s[c])
    far = wid == FAR
    ink = st["far"] if far else st
    for c in cells:
        lo, hi = min(bins[round(t[c] * 8)]), max(bins[round(t[c] * 8)])
        f = (s[c] - lo) / (hi - lo) if hi > lo else 0.5
        k = int(t[c] * L)
        x, y = c
        if t[c] > st["tip"]:
            ch = ink["prim"]
            if st.get("mirror") and not far and t[c] > 0.86 and 0.3 < f < 0.8:
                ch = st["mirror"]
            if st.get("fingers") and t[c] > 0.74 and f < 0.42 and k % 2 == 0:
                ch = "."  # the slot between two primaries
        elif f > 0.64:
            ch = ink["covert"]
            if st.get("bars") and not far and k % 3 == 1:
                ch = st["bars"]
        elif f < 0.34:
            ch = ink["second"]
            if s[c] == lo and k % 2 == 0:
                ch = ink["edge"]  # the trailing edge, notched feather by feather
            if st.get("spec") and not far and 0.15 < t[c] < st["tip"]:
                ch = st["spec"][0]
        else:
            ch = ink["base"]
            if st.get("spec") and not far and 0.15 < t[c] < st["tip"] and f < 0.48:
                ch = st["spec"][1]  # the white bar in front of the speculum
        g[y][x] = ch


# ---------------------------------------------------------------- field marks
# Extra parts per bird, for flight (one body for every wing position) and
# for rest, laid over what's drawn. (layer, ink, points[, widths])
MARKS = {
    "gull": {
        "fly": [("limb", "y", [(22.5, 15.8), (26, 15.4)], [1, 1]),  # legs tucked under the tail
                ("mark", "w", [(10, 15.6), (17, 16.4), (24, 15), (24, 16.6), (12, 17.6)])],  # the belly in shade
        "rest": [("mark", "w", [(10, 12.6), (17, 13.6), (24, 12), (24, 13.6), (12, 15)]),
                 ("mark", "W", [(18, 10.6), (24, 10.8), (25, 11.6), (18, 11.6)])],  # the white tertial crescent
    },
    "eagle": {
        "fly": [("head_mark", "h", [(1.8, 14.8), (3.2, 15.2), (3, 16.4), (2.2, 16.2)]),  # the hook of the bill
                ("mark", "W", [(12.6, 14.4), (14.6, 14.8), (13.4, 16.2)]), ("mark", "W", [(12.6, 17.4), (14.4, 17.2), (13, 18.8)]),
                ("limb", "Y", [(28, 20.6), (31, 21.4)], [1.4, 1.2]),  # feet tucked under the tail
                ("mark", "w", [(33, 18.2), (40, 18), (40, 18.8), (33, 19)])],  # the tail's feathers
        "rest": [("head_mark", "h", [(0, 8.2), (1.2, 8.6), (1, 9.8), (0.4, 9.6)]),
                 ("mark", "W", [(9, 9.6), (11, 10.4), (9.6, 11.6)]),
                 ("limb", "d", [(11.4, 30), (10.6, 30.6)], [0.8, 0.8]), ("limb", "d", [(14.6, 30), (13.8, 30.6)], [0.8, 0.8])],
    },
    "mallard": {
        "fly": [("limb", "T", [(22, 9.2), (23, 7.6), (21.8, 6.8)], [0.9, 0.8, 0.8]),  # the drake's curl
                ("mark", "W", [(22.4, 9.6), (24, 9.8), (23.6, 11), (22.2, 10.8)]),  # white tail edge
                ("head_mark", "g", [(3.8, 4.8), (6.6, 4.6), (7.4, 5.8), (4, 6)]),  # the sheen
                ("limb", "F", [(17, 12.6), (20, 12.6)], [1, 1])],  # orange feet tucked
        "rest": [("limb", "T", [(22, 5), (23, 3.4), (21.8, 2.6)], [0.9, 0.8, 0.8]),
                 ("mark", "W", [(22.4, 5.6), (24, 5.6), (23.6, 6.8), (22.2, 6.8)]),
                 ("head_mark", "g", [(3.8, 0.4), (6.6, 0.2), (7.4, 1.4), (4, 1.6)])],
    },
    "hen": {
        "fly": [("head_mark", "d", [(1, 7.6), (3, 7.6), (3, 8.4), (1, 8.4)]),  # the saddle on her orange bill
                ("head_mark", "d", [(3.4, 5.6), (8, 5.8), (8, 6.4), (3.4, 6.4)]),  # eye stripe
                ("limb", "F", [(17, 12.6), (20, 12.6)], [1, 1])],
        "rest": [("head_mark", "d", [(1, 3.2), (3, 3.2), (3, 4), (1, 4)]),
                 ("head_mark", "d", [(3.4, 1.2), (8, 1.4), (8, 2), (3.4, 2)])],
    },
    "sparrow": {
        "fly": [("mark", "b", [(4.6, 7), (5.4, 7), (5.4, 8.4), (4.6, 8.4)]), ("mark", "b", [(6.6, 7.2), (7.4, 7.2), (7.4, 8.6), (6.6, 8.6)]),
                ("head_mark", "g", [(2.2, 3.2), (5.2, 3), (5.2, 3.6), (2.2, 3.8)]),  # grey brow
                ("mark", "b", [(7, 4.8), (9, 5), (9, 5.6), (7, 5.6)])],  # streaked back
        "rest": [("mark", "b", [(4.6, 7), (5.4, 7), (5.4, 8.4), (4.6, 8.4)]), ("mark", "b", [(6.6, 7.2), (7.4, 7.2), (7.4, 8.6), (6.6, 8.6)]),
                 ("head_mark", "g", [(2.2, 3.2), (5.2, 3), (5.2, 3.6), (2.2, 3.8)])],
    },
    "loon": {
        "rest": [("mark", "O", [(7.4, 5.6), (10.8, 5.2), (10.8, 6.6), (7.4, 6.6)]),  # the solid necklace, now striped:
                 *[("mark", "W", [(x, 5.3), (x + 0.7, 5.3), (x + 0.7, 6.6), (x, 6.6)]) for x in (7.6, 8.8, 10)],
                 ("mark", "W", [(5.6, 4.2), (7.2, 4.2), (7.2, 4.8), (5.6, 4.8)]),  # the chin bar
                 *[("mark", "W", [(x, 8.2), (x + 0.8, 8.2), (x + 0.8, 8.9), (x, 8.9)]) for x in (12, 14, 16, 18, 20, 22, 24)],
                 *[("mark", "w", [(x, 9.4), (x + 0.8, 9.4), (x + 0.8, 10), (x, 10)]) for x in (13, 17, 21, 25)],
                 ("head_mark", "g", [(3.6, 0.6), (6.6, 0), (8.4, 1.4), (4, 1.8)])],  # green sheen
        "dive": [],
    },
}
EXTRA_INKS = {
    "gull": {"w": "#dde0cd"},
    "eagle": {"h": "#b07a20", "w": "#d8d2c6", "d": "#251a14"},
    "mallard": {"g": "#3f8a5a", "F": "#e08a3a"},
    "hen": {"d": "#5a4028", "Y": "#d8823a", "F": "#e08a3a"},
    "sparrow": {"b": "#4a3020", "g": "#a8a094"},
    "loon": {"g": "#2e463c", "w": "#4a4b55"},
}

# Feather texture laid over a body colour, inside its edge (B and C):
# (letter, ink, pattern) with pattern "scallop" (staggered feather tips),
# "streak" (short vertical streaks) or "fleck" (scattered).
TEXTURE = {
    "eagle": [("O", "c", "scallop")],
    "hen": [("O", "d", "scallop"), ("G", "d", "streak")],
    "mallard": [("O", "c", "fleck")],
    "sparrow": [("O", "b", "streak")],
    "gull": [("G", "c", "fleck")],
    "loon": [("O", "w", "fleck")],
}


def texture(g, rules):
    h, w = len(g), len(g[0])
    for letter, ink, kind in rules:
        hit = []
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                if g[y][x] != letter or any(g[y + j][x + i] != letter for i, j in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    continue
                if kind == "scallop" and y % 2 == 0 and (x + (y // 2) * 2) % 4 == 0:
                    hit.append((x, y))
                elif kind == "streak" and (x * 7 + (y // 2) * 3) % 5 == 0:
                    hit.append((x, y))
                elif kind == "fleck" and (x * 5 + y * 3) % 11 == 0:
                    hit.append((x, y))
        for x, y in hit:
            g[y][x] = ink


# which part of a rest pose is the folded wing (by its first point)
REST_WING = {"gull": (12, 8), "eagle": (13, 11), "sparrow": (5.4, 5.4), "mallard": (10, 4.6), "hen": (10, 4.6)}
SPECS = {"gull": sb.GULL, "eagle": sb.EAGLE, "mallard": sb.MALLARD, "hen": sb.HEN, "sparrow": sb.SPARROW, "loon": sb.LOON}
BODY = {"gull": sb.gull_parts, "eagle": sb.eagle_parts, "mallard": sb.mallard_parts,
        "hen": lambda w: sb.mallard_parts(w, hen=True), "sparrow": sb.sparrow_parts}
WSETS = {"gull": sb.GULL_W, "eagle": sb.EAGLE_W, "mallard": sb.MALLARD_W, "hen": sb.MALLARD_W, "sparrow": sb.SPARROW_W}


def parts_for(name, pose, level):
    """The parts list for a bird, pose and level ("A" wings, "B"/"C" marks)."""
    spec = SPECS[name]
    if pose.startswith("flap") or pose == "fold":
        front, back = WSETS[name][pose]
        wing = lambda lst, wid: [("wing", wid, t[2]) for t in lst if t[0] == "flat"]  # noqa: E731
        parts = BODY[name]((wing(front, FAR), wing(back, NEAR)))
        # the drake's and hen's speculum marks and tips were on the wing; the
        # feather pass replaces them
        marks = MARKS.get(name, {}).get("fly", [])
    elif name == "sparrow" and pose in ("rest", "perch"):
        # perched on top of a cattail's brown head, gripping it, tail down
        parts = [("limb", "B", [(8, 12), (8.4, 21)], [1, 1]), ("limb", "u", [(8, 11.2), (8, 16.6)], [2.6, 2.4]),
                 ("limb", "y", [(6.6, 9), (7.4, 11)], [0.8, 0.8]), ("limb", "y", [(8.6, 9), (8.8, 11)], [0.8, 0.8]),
                 ("flat", "S", [(9.6, 7), (13.4, 10.4), (12.4, 11.6), (9, 8.8)]),
                 ("body", "O", [(4, 5), (7, 3.8), (10, 4.6), (11, 6.6), (9.6, 8.8), (6.4, 9.4), (4, 8)]),
                 ("mark", "W", [(3.6, 7), (8.4, 8), (7.4, 9.6), (4, 9.2)]),
                 ("wing", NEAR, [(5.4, 4.8), (8.6, 4.4), (11.6, 7.4), (9, 8.2), (6, 7.2)])] + sb.sparrow_parts(([], []))[3:]
        if pose == "perch":
            parts = parts[2:]  # the bird alone, for the game's own cattails
        marks = MARKS["sparrow"]["rest"]
    else:
        parts = []
        for t in spec["poses"][pose]["parts"]:
            if name == "eagle" and t[0] == "flat" and t[1] == "W":
                # the white tail hanging down behind the legs, not a blob at the feet
                t = ("flat", "W", [(14, 22), (19.6, 30), (18, 32.6), (14.6, 30.4), (12.6, 25)])
            if t[0] == "flat" and name in REST_WING and tuple(t[2][0]) == REST_WING[name]:
                parts.append(("wing", NEAR, t[2]))
            elif t[0] == "mark" and t[1] in ("K", "Q") and name in REST_WING and parts and parts[-1][0] == "wing":
                continue  # the old tip or speculum, now from the feather pass
            else:
                parts.append(t)
        marks = MARKS.get(name, {}).get(pose, [])
    if level in ("B", "C"):
        parts = parts + marks
    return parts


def draw(name, pose, level, scale=None):
    spec = SPECS[name]
    p = spec["poses"]["rest" if pose == "perch" else pose]
    k = scale or (4 / 3 if level == "C" else 1)
    W, H = p["frame"]
    W, H = math.ceil(W * k), math.ceil(H * k)
    dx, dy = p.get("at", (0, 0))
    c = Canvas(W, H)
    mv = lambda pts: [((x + dx) * k, (y + dy) * k) for x, y in pts]  # noqa: E731
    pivot = mv([p["pivot"]])[0]
    roots = {}
    for part in parts_for(name, pose, level):
        layer, ch = part[0], part[1]
        if layer == "limb":
            c.limb(mv(part[2]), [w * k for w in part[3]], ch)
        elif layer == "body":
            c.blob(rounder(mv(part[2]), sb.ROUND), ch)
        elif layer == "head":
            c.blob(scaled(mv(part[2]), pivot, sb.HEAD), ch)
        elif layer == "head_mark":
            c.blob(scaled(mv(part[2]), pivot, sb.HEAD), ch, clip=True)
        elif layer == "mark":
            c.blob(mv(part[2]), ch, clip=True)
        elif layer == "wing":
            c.blob(mv(part[2]), ch)
            roots[ch] = mv(part[2])[0]
        else:
            c.blob(mv(part[2]), ch)
    g = c.grid()
    wst = WINGS.get(name)
    for wid, root in roots.items():
        if wst:
            feathers(g, root, wst, wid)
    if level in ("B", "C"):
        texture(g, TEXTURE.get(name, []))
    ex, ey = scaled(mv([p["eye"]]), pivot, sb.HEAD)[0]
    ex, ey = round(ex), round(ey)
    big = spec.get("eye", 2) if k >= 0.6 else 1  # a one-pixel eye on a bird drawn small
    for x in range(ex, ex + big):
        for y in range(ey, ey + big):
            if 0 <= x < W and 0 <= y < H:
                g[y][x] = "E"
    g[ey][ex] = "C"
    return g


def colours(name):
    return {**sb.FACE, **SPECS[name]["colours"], **INKS.get(name, {}), **EXTRA_INKS.get(name, {})}


def render(name, pose, level, water=None, scale=None):
    if level == "now":
        return sb.render(SPECS[name], pose, water=water if water is None else water)
    g = outline(draw(name, pose, level, scale))
    k = scale or (4 / 3 if level == "C" else 1)
    if water is not None and k != 1:
        water = round(water * k)
    img = image(g, colours(name), water=water)
    return lit(treat(img, img.width), img.width)


# ---------------------------------------------------------------- sheets
FLY = ["flap-up", "flap-mid", "flap-down"]
FLYERS = ["gull", "eagle", "mallard", "hen", "sparrow"]


def sky_sheet(level, scale=4):
    sky = Image.open(ROOT / "assets" / "art" / "environments" / "sky-day.png").convert("RGBA")
    rows = [[render(n, p, level) for p in FLY] for n in FLYERS]
    rw = [sum(i.width + 3 for i in r) for r in rows]
    w = max(rw[0] + rw[1], rw[2] + rw[3] + rw[4]) + 8
    h1 = max(i.height for r in rows[:2] for i in r) + 4
    h2 = max(i.height for r in rows[2:] for i in r) + 4
    bg = Image.new("RGBA", (w, h1 + h2 + 4))
    for x0 in range(0, w, sky.width):
        bg.alpha_composite(sky.crop((0, 50, sky.width, 50 + bg.height)), (x0, 0))
    for line, y0, hh in ((rows[:2], 2, h1), (rows[2:], h1 + 2, h2)):
        x = 4
        for r in line:
            for img in r:
                bg.alpha_composite(img, (x, y0 + (hh - img.height) // 2))
                x += img.width + 3
            x += 6
    return bg.resize((bg.width * scale, bg.height * scale), Image.NEAREST)


def rest_sheet(level, scale=4):
    land = Image.open(ROOT / "assets" / "art" / "environments" / "land.png").convert("RGBA")
    surf = Image.open(ROOT / "assets" / "art" / "environments" / "water-surface.png").convert("RGBA")
    land_items = [render(n, "rest", level) for n in ("gull", "eagle", "sparrow")]
    water_items = [render(n, "rest", level, water=9) for n in ("mallard", "hen", "loon")]
    w = max(sum(i.width + 6 for i in land_items), sum(i.width + 6 for i in water_items)) + 6
    top = 52
    bg = Image.new("RGBA", (w, top + 26))
    strip = land.crop((150, 306 - top, 330, 306))
    for x0 in range(0, w, strip.width):
        bg.alpha_composite(strip, (x0, 0))
    for x0 in range(0, w, surf.width):
        bg.alpha_composite(surf.crop((0, 0, surf.width, 26)), (x0, top))
    x = 6
    for img in land_items:
        bg.alpha_composite(img, (x, top - 2 - img.height))
        x += img.width + 6
    x = 6
    k = 4 / 3 if level == "C" else 1
    for img in water_items:
        bg.alpha_composite(img, (x, top + round(13 * k) - img.height))
        x += img.width + 6
    return bg.resize((bg.width * scale, bg.height * scale), Image.NEAREST)


def strips():
    """Sheets for the in-game shots: each level's flyers (up, level, down)
    and every bird at rest; sizes in sheets.json."""
    import json
    info = {}
    for lv in ("now", "A", "B", "C"):
        (OUT / lv).mkdir(parents=True, exist_ok=True)
        for n in FLYERS:
            fr = [render(n, p, lv) for p in FLY]
            w, h = fr[0].size
            sh = Image.new("RGBA", (w * 3, h))
            for i, f in enumerate(fr):
                sh.alpha_composite(f, (i * w, 0))
            sh.save(OUT / lv / f"{n}.png")
            info[f"{lv}/{n}"] = [w, h]
        for n, water in (("gull", None), ("eagle", None), ("sparrow", None), ("mallard", 9), ("hen", 9), ("loon", 9)):
            img = render(n, "rest", lv, water=water)
            img.save(OUT / lv / f"rest-{n}.png")
            info[f"{lv}/rest-{n}"] = list(img.size)
    (OUT / "sheets.json").write_text(json.dumps(info))


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    strips()
    for lv in ("now", "A", "B", "C"):
        sky_sheet(lv).save(OUT / f"{lv}-sky.png")
        rest_sheet(lv).save(OUT / f"{lv}-rest.png")
        print(lv)
