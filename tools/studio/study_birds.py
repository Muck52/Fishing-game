"""Study 9: the birds (the gull, eagle, mallard drake and hen, sparrow) and
the loon, who joins them.

Drawn the way the land animals were settled in study 8: from shapes
(tools/characters/anatomy.py), with study 8's proportions (direction C)
and its big eyes with a catchlight, finished with the selective edge and
lit as one mass. The study is about how they fly across the sky:

- **A, flapping in profile:** wings beating up and down beside the body,
  seen side-on like the animals on the beach.
- **B, spread from below:** both wings outstretched as they pass over,
  the far wing up behind and the near wing down in front.
- **C, a mix:** the big birds (eagle, gull) soar spread, as they do; the
  small ones (mallard, sparrow) flap in profile, as they do.

Every bird also has a resting pose: the gull standing, the eagle perched,
the mallards and the loon swimming, the sparrow on a cattail.

    python3 tools/studio/study_birds.py   -> docs/studio/studies/09-birds/
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "characters"))
from anatomy import Canvas, scaled, rounder  # noqa: E402
from kit import outline, image  # noqa: E402
from edges import treat  # noqa: E402
from light import lit  # noqa: E402

OUT = ROOT / "docs" / "studio" / "studies" / "09-birds"
FACE = {"E": "#25131a", "C": "#f7f4ee", "o": "#25131a"}
HEAD, ROUND = 1.15, 0.22  # study 8's direction C


def draw(spec, pose):
    """A bird in a pose: an ordered list of parts, each (layer, ink, points)
    where layer is "body" (rounded a little, as in study 8), "head" (scaled
    about the neck), "flat" (as given), "limb" (joints and widths) or
    "mark"/"head_mark" (only over what's drawn)."""
    p = spec["poses"][pose]
    W, H = p["frame"]
    dx, dy = p.get("at", (0, 0))
    c = Canvas(W, H)
    pivot = (p["pivot"][0] + dx, p["pivot"][1] + dy)
    mv = lambda pts: [(x + dx, y + dy) for x, y in pts]  # noqa: E731
    for part in p["parts"]:
        layer, ch = part[0], part[1]
        if layer == "limb":
            c.limb(mv(part[2]), part[3], ch)
        elif layer == "body":
            c.blob(rounder(mv(part[2]), ROUND), ch)
        elif layer == "head":
            c.blob(scaled(mv(part[2]), pivot, HEAD), ch)
        elif layer == "head_mark":
            c.blob(scaled(mv(part[2]), pivot, HEAD), ch, clip=True)
        elif layer == "mark":
            c.blob(mv(part[2]), ch, clip=True)
        else:
            c.blob(mv(part[2]), ch)
    g = c.grid()
    ex, ey = scaled(mv([p["eye"]]), pivot, HEAD)[0]
    ex, ey = round(ex), round(ey)
    big = spec.get("eye", 2)
    for x in range(ex, ex + big):
        for y in range(ey, ey + big):
            if 0 <= x < W and 0 <= y < H:
                g[y][x] = "E"
    if 0 <= ex < W and 0 <= ey < H:
        g[ey][ex] = "C"
    return g


def render(spec, pose, water=None):
    g = outline(draw(spec, pose))
    img = image(g, {**FACE, **spec["colours"]}, water=water)
    return lit(treat(img, img.width), img.width)


# ---------------------------------------------------------------- the birds
# Each faces left. Flight poses share a body and head; the wings make the
# pose. "flap-up"/"flap-down" are profile (A); "glide"/"stroke" spread (B).

def gull_parts(wings):
    body = [("body", "W", [(9, 12), (14, 10.6), (20, 11), (25, 12.5), (27, 14), (24, 15.6), (17, 17), (11, 16.6), (8, 14.8)]),
            ("flat", "W", [(24, 12.6), (29, 12.2), (30, 14), (25, 15.4)]),
            ("mark", "G", [(13, 10), (24, 10.6), (26, 12.6), (14, 12.4)]),
            ("head", "W", [(5, 9), (8.5, 8.4), (10.5, 10), (10, 12.6), (7, 13.4), (4.4, 12.6), (3.8, 10.8)]),
            ("head", "Y", [(4.6, 11), (0.8, 11.4), (1, 12.4), (4.8, 12.6)]),
            ("head_mark", "K", [(1.8, 10.8), (2.6, 10.8), (2.6, 13), (1.8, 13)])]
    return wings[0] + body + wings[1]


def resample(pts, n=40):
    """A closed shape as n points evenly spaced round its smooth outline."""
    import math
    from anatomy import spline
    c = spline(pts)
    c = c + [c[0]]
    d = [0.0]
    for a, b in zip(c, c[1:]):
        d.append(d[-1] + math.dist(a, b))
    out, j = [], 0
    for i in range(n):
        t = d[-1] * i / n
        while d[j + 1] < t:
            j += 1
        f = (t - d[j]) / ((d[j + 1] - d[j]) or 1)
        out.append((c[j][0] + (c[j + 1][0] - c[j][0]) * f, c[j][1] + (c[j + 1][1] - c[j][1]) * f))
    return out


def between(up, down, t=0.5):
    """The wing halfway through its beat (level with the back), made by
    morphing the near wing (and its dark tip) from up to down; the far
    wing, just showing above the back on the downstroke, is kept."""
    near = []
    for a, b in zip(up[1], down[1]):
        pa, pb = resample(a[2]), resample(b[2])
        near.append((a[0], a[1], [(x + (u - x) * t, y + (v - y) * t) for (x, y), (u, v) in zip(pa, pb)]))
    return (down[0], near)


GULL_W = {
    "flap-up": ([], [("flat", "G", [(13, 12), (15, 8), (18, 4.4), (22, 1.2), (24, 1.8), (21, 6), (19, 10), (17, 12.6)]),
                     ("mark", "K", [(20, 0.4), (25, 0.4), (23, 4), (20, 3.4)])]),
    "flap-down": ([("flat", "g", [(16, 11.2), (19, 8.4), (21.4, 8.8), (19.4, 11.6)])],
                  [("flat", "G", [(13, 13), (16, 16), (18, 21), (19, 26), (21, 25.6), (20, 20), (19.5, 15), (17.5, 12.8)]),
                   ("mark", "K", [(17.6, 23), (22, 23), (21.6, 27), (18.6, 27)])]),
    "glide": ([("flat", "g", [(15, 11), (19, 6.4), (24, 1.6), (27.6, 0.6), (26, 4), (21.4, 8.6), (18, 12)]),
               ("mark", "K", [(24.6, 0), (28.6, 0), (27, 3.6), (24, 3)])],
              [("flat", "W", [(14, 14), (15, 19), (16, 24.4), (17.6, 28.6), (19.6, 28), (19.4, 22), (19, 16.4), (17.6, 13.4)]),
               ("mark", "K", [(16.4, 25), (20.4, 25), (20, 29.6), (16.8, 29.6)])]),
    "stroke": ([("flat", "g", [(15, 11.4), (18, 8.4), (22, 6), (25, 5.6), (24.4, 7.6), (20.6, 10), (18, 12.4)]),
                ("mark", "K", [(22.6, 4.8), (26, 4.8), (25.4, 7.8), (22.6, 7.6)])],
               [("flat", "W", [(13.6, 14.6), (15.4, 18.6), (18.4, 22.6), (21.4, 24.6), (22.4, 23.4), (20.4, 19.4), (18.6, 15.4), (17.6, 13.4)]),
                ("mark", "K", [(19.4, 21.4), (23, 21.6), (22.6, 25), (19.4, 24.6)])]),
}
GULL_W["flap-mid"] = between(GULL_W["flap-up"], GULL_W["flap-down"])

GULL = {
    "colours": {"W": "#faffff", "G": "#b2d0d0", "g": "#86a398", "K": "#33323d", "Y": "#ffd84a"},
    "poses": {**{k: {"frame": (32, 31), "pivot": (9, 12), "eye": (6.4, 10), "parts": gull_parts(w)} for k, w in GULL_W.items()},
              "rest": {"frame": (32, 24), "pivot": (9, 7), "eye": (6.4, 5), "at": (0, 0), "parts": [
                  ("limb", "y", [(15, 15), (15, 22.6)], [1, 1]), ("limb", "y", [(19, 15), (19.4, 22.6)], [1, 1]),
                  ("body", "W", [(9, 8), (14, 6.6), (20, 7), (25, 9), (27, 11), (24, 12.6), (17, 14.6), (11, 14), (8, 11.6)]),
                  ("flat", "G", [(12, 8), (19, 7), (26, 9.4), (30, 11.4), (26, 12.4), (17, 11.6), (12.4, 10.6)]),
                  ("mark", "K", [(25.6, 9.6), (30.6, 11), (28.6, 12.6), (25, 12.2)]),
                  ("head", "W", [(5, 4), (8.5, 3.4), (10.5, 5), (10, 7.6), (7, 8.4), (4.4, 7.6), (3.8, 5.8)]),
                  ("head", "Y", [(4.6, 6), (0.8, 6.4), (1, 7.4), (4.8, 7.6)]),
                  ("head_mark", "K", [(1.8, 5.8), (2.6, 5.8), (2.6, 8), (1.8, 8)])]}},
}
GULL["colours"]["y"] = "#e8c040"


def eagle_parts(wings):
    body = [("body", "O", [(12, 16), (18, 14), (26, 14.6), (32, 16), (35, 18), (31, 20), (22, 21.4), (15, 21), (11, 19)]),
            ("flat", "W", [(32, 16.6), (39, 16), (40, 19.4), (33, 20.6)]),
            ("head", "W", [(7, 11.6), (11, 11), (13.4, 13), (13, 16), (9.6, 17), (6.6, 16.4), (5.4, 14.4)]),
            ("head", "Y", [(6, 13.4), (2.6, 13.4), (1.8, 14.8), (2.6, 16.2), (6.4, 16)])]
    return wings[0] + body + wings[1]


EAGLE_W = {
    "flap-up": ([], [("flat", "O", [(17, 15), (20, 10), (24, 4.6), (29, 0.8), (32, 1.2), (30, 5), (27, 10), (23, 15.4)]),
                     ("mark", "S", [(27, 0), (33, 0), (31, 5), (27.6, 4)])]),
    "flap-down": ([("flat", "S", [(21, 14.4), (25, 11), (28, 11.6), (25, 15)])],
                  [("flat", "O", [(17, 17), (21, 22), (24, 28), (27, 34), (30, 35), (29, 29), (26, 22), (23, 17)]),
                   ("mark", "S", [(25, 31), (31, 31), (30.6, 36), (26, 36)])]),
    "glide": ([("flat", "S", [(19, 14.5), (24, 9), (30, 3.6), (37, 0.6), (39, 2), (34, 7), (28, 12.6), (24, 15.4)])],
              [("flat", "O", [(16, 18), (17, 24), (18, 31), (19.5, 38), (22.4, 38.4), (22, 31), (21.5, 24), (21, 18.6)]),
               ("mark", "S", [(18.4, 33), (23, 33), (23, 39), (19, 39)])]),
    "stroke": ([("flat", "S", [(19, 15), (23, 11.4), (28, 8.4), (33, 7.6), (32.4, 10), (27.6, 13), (23.6, 16)])],
               [("flat", "O", [(16, 19), (19, 24), (23, 29), (28, 32), (29.4, 30.4), (26, 25.6), (22.6, 21), (21, 18.6)]),
                ("mark", "S", [(25, 28.4), (30, 29), (29.4, 33), (25.4, 32.4)])]),
}
EAGLE_W["flap-mid"] = between(EAGLE_W["flap-up"], EAGLE_W["flap-down"])

EAGLE = {
    "colours": {"O": "#4a3528", "S": "#33241c", "W": "#f4f1ea", "Y": "#f0b030", "y": "#e8b030"},
    "poses": {**{k: {"frame": (42, 40), "pivot": (12, 15), "eye": (8.4, 13), "parts": eagle_parts(w)} for k, w in EAGLE_W.items()},
              "rest": {"frame": (30, 34), "pivot": (8, 8), "eye": (5.4, 6), "parts": [
                  ("limb", "y", [(12, 25), (12, 30)], [1.4, 1.2]), ("limb", "y", [(15, 25), (15.4, 30)], [1.4, 1.2]),
                  ("flat", "W", [(14, 26), (17, 31), (15, 33.4), (12, 30)]),
                  ("body", "O", [(9, 11), (14, 9.6), (18, 12), (19.4, 18), (18, 24), (15, 27), (11, 26.4), (8, 21), (7.6, 15)]),
                  ("flat", "S", [(13, 11), (18, 12), (20, 19), (18.4, 26), (15.6, 23), (14, 16)]),
                  ("head", "W", [(4.6, 4.4), (8.6, 3.6), (11, 5.6), (10.6, 9), (7, 10), (4, 9.2), (3, 7)]),
                  ("head", "Y", [(3.8, 6.6), (0.6, 6.8), (0, 8.2), (0.8, 9.6), (4, 9.2)])]}},
}


def mallard_parts(wings, hen=False):
    body = [("body", "O", [(7, 9), (11, 7.6), (16, 8), (20, 9.6), (21, 11), (18, 12.6), (12, 13.2), (8, 12.6), (6, 11)]),
            ("flat", "T", [(19, 9.4), (23, 8.8), (23.6, 10.6), (20, 11.4)]),
            ("mark", "U", [(5.6, 9.4), (9.4, 9.2), (10, 12.6), (6.4, 12.6)]),
            ("head", "G", [(3.6, 5), (6.6, 4.6), (8, 6.4), (7.6, 8.6), (5, 9.4), (3, 8.6), (2.6, 6.6)]),
            ("head", "Y", [(3, 7.2), (0.2, 7.6), (0.4, 8.6), (3.2, 8.6)])]
    if not hen:
        body.append(("head_mark", "W", [(5.6, 8.6), (8, 8.2), (8.4, 9.6), (6, 10)]))
    return wings[0] + body + wings[1]


MALLARD_W = {
    "flap-up": ([], [("flat", "O", [(10, 9), (12, 5.4), (15, 2), (17.6, 0.6), (18.4, 1.6), (16, 5), (14, 9.6)]),
                     ("mark", "Q", [(12.4, 6.6), (14.6, 6.6), (14.2, 8), (12, 8)])]),
    "flap-down": ([("flat", "O", [(12, 8.4), (14.6, 6.4), (16, 7), (14.4, 9)])],
                  [("flat", "O", [(10, 11), (12, 14), (14, 17.6), (16, 19.6), (17.4, 19), (15.6, 15), (14, 10.6)]),
                   ("mark", "Q", [(11.4, 12.6), (13.6, 12.6), (13.8, 14), (11.8, 14)])]),
    "glide": ([("flat", "O", [(11, 8.8), (14, 5), (18, 1.4), (20.6, 0.6), (19.6, 3), (16, 7.4), (13.4, 9.8)])],
              [("flat", "O", [(9.6, 11), (10.4, 14.4), (11.4, 18), (12.6, 19.8), (14, 19.4), (13.4, 15), (12.6, 11)]),
               ("mark", "Q", [(9.6, 13), (13.4, 13), (13.4, 14.6), (9.8, 14.6)])]),
    "stroke": ([("flat", "O", [(11, 9), (14, 6.6), (17.4, 5), (19, 5.4), (17, 7.4), (14, 9.8)])],
               [("flat", "O", [(9.6, 11.4), (11.4, 14), (14.4, 16.4), (16.6, 17), (16.4, 15.4), (13.6, 13), (12.4, 11)]),
                ("mark", "Q", [(10.6, 12.4), (13.4, 13), (13, 14.4), (10.6, 14)])]),
}
MALLARD_W["flap-mid"] = between(MALLARD_W["flap-up"], MALLARD_W["flap-down"])
SWIM = [("body", "O", [(7, 5), (11, 3.6), (16, 4), (20, 5.6), (21, 7), (18, 8.6), (12, 9.2), (8, 8.6), (6, 7)]),
        ("flat", "T", [(19, 5.2), (23, 4.2), (23.6, 6), (20, 7.4)]),
        ("mark", "U", [(5.6, 5.4), (9.4, 5.2), (10, 8.6), (6.4, 8.6)]),
        ("flat", "O", [(10, 4.6), (16, 4.2), (19.6, 5.8), (14, 6.6), (10.6, 6.2)]),
        ("mark", "Q", [(15.6, 4.8), (18, 5.4), (17.6, 6.2), (15.4, 6)]),
        ("head", "G", [(3.6, 0.6), (6.6, 0.2), (8, 2), (7.6, 4.2), (5, 5), (3, 4.2), (2.6, 2.2)]),
        ("head", "Y", [(3, 2.8), (0.2, 3.2), (0.4, 4.2), (3.2, 4.2)])]
MALLARD = {
    "colours": {"O": "#a8a39a", "T": "#33323d", "U": "#7a4a3a", "G": "#2f6a4a", "Y": "#e8c040", "W": "#faffff", "Q": "#3f5fa0"},
    "poses": {**{k: {"frame": (25, 21), "pivot": (7, 8.5), "eye": (4.4, 6), "at": (0, 0), "parts": mallard_parts(w)} for k, w in MALLARD_W.items()},
              "rest": {"frame": (25, 12), "pivot": (7, 4.5), "eye": (4.4, 2), "at": (0, 1),
                       "parts": SWIM + [("head_mark", "W", [(5.6, 4.6), (8, 4.2), (8.4, 5.6), (6, 6)])]}},
}
HEN = {
    "colours": {"O": "#9c7a52", "T": "#7a5a3a", "U": "#8a6a46", "G": "#8a6a46", "Y": "#d8903a", "Q": "#3f5fa0"},
    "poses": {**{k: {"frame": (25, 21), "pivot": (7, 8.5), "eye": (4.4, 6), "parts": mallard_parts(w, hen=True)} for k, w in MALLARD_W.items()},
              "rest": {"frame": (25, 12), "pivot": (7, 4.5), "eye": (4.4, 2), "at": (0, 1), "parts": SWIM}},
}


def sparrow_parts(wings):
    body = [("body", "O", [(4, 5.6), (7, 4.6), (10, 5.2), (11.4, 6.6), (10, 8), (6.4, 8.4), (4, 7.6)]),
            ("flat", "S", [(10.4, 5.6), (13.4, 5.2), (13.6, 6.4), (10.8, 7)]),
            ("mark", "W", [(4, 6.8), (9, 7.4), (8, 8.6), (4.4, 8.4)]),
            ("head", "O", [(1.6, 2.6), (4.4, 2.2), (5.6, 3.6), (5.2, 5.6), (3, 6.2), (1.4, 5.4), (1, 3.8)]),
            ("head_mark", "R", [(1.6, 2.2), (5, 2), (5.4, 3.2), (2, 3.2)]),
            ("head", "Y", [(1.4, 4), (-0.6, 4.4), (1.4, 5)])]
    return wings[0] + body + wings[1]


SPARROW_W = {
    "flap-up": ([], [("flat", "S", [(6, 5.4), (7.4, 2.6), (9.6, 0.6), (10.4, 1.2), (9, 4), (8, 6)])]),
    "flap-down": ([], [("flat", "S", [(6, 6.8), (7.4, 9), (8.8, 11), (9.8, 10.6), (8.8, 8), (8, 6.6)])]),
    "glide": ([("flat", "S", [(7, 5.2), (9, 2.6), (11.6, 0.6), (12.4, 1.4), (10.4, 3.8), (8.6, 5.8)])],
              [("flat", "S", [(6, 7), (6.6, 9), (7.4, 11), (8.6, 11), (8.2, 8.6), (7.6, 6.8)])]),
    "stroke": ([("flat", "S", [(7, 5.4), (9, 4), (11, 3.4), (11, 4.4), (9, 5.8)])],
               [("flat", "S", [(6, 7), (7.4, 8.6), (9.4, 9.6), (10, 9), (8.4, 7.6), (7.6, 6.6)])]),
}
SPARROW_W["flap-mid"] = between(SPARROW_W["flap-up"], SPARROW_W["flap-down"])
SPARROW_W["fold"] = ([], [("flat", "S", [(5.4, 5.4), (8.6, 5), (11, 6.2), (8.6, 7.2), (6, 7)])])
SPARROW = {
    "eye": 1,
    "colours": {"O": "#8a6a4a", "S": "#5a4230", "W": "#d8c8a8", "R": "#9a5a3a", "Y": "#c8a060", "y": "#a07850", "B": "#6b8040", "b": "#5a3a22"},
    "poses": {**{k: {"frame": (15, 12), "pivot": (4, 5), "eye": (2.6, 3.4), "at": (1, 0), "parts": sparrow_parts(w)} for k, w in SPARROW_W.items()},
              # on a cattail: the stalk and its brown head, the bird holding on
              "rest": {"frame": (15, 22), "pivot": (4, 5), "eye": (2.6, 3.4), "at": (1, 2), "parts": [
                  ("limb", "B", [(7, 9), (7.4, 20)], [1, 1]), ("limb", "b", [(7, 9.6), (7.2, 15)], [2.6, 2.4]),
                  ("limb", "y", [(6, 8), (6.6, 9.4)], [1, 1])] + sparrow_parts(([], [("flat", "S", [(5.4, 5.4), (8.6, 5), (11, 6.2), (8.6, 7.2), (6, 7)])]))}},
}

# the common loon in summer: black head with a green sheen, a dagger bill,
# a white necklace, a black back chequered white, low in the water
LOON = {
    "colours": {"O": "#25262e", "K": "#1c1d24", "b": "#3a3b44", "W": "#eae6dc", "w": "#b8b4aa"},
    "poses": {"rest": {"frame": (36, 15), "pivot": (8, 5), "eye": (5, 1.6), "at": (4, 1), "parts": [
        ("body", "O", [(8, 7), (13, 5.8), (20, 5.8), (26, 6.6), (29, 8), (26, 9.8), (18, 10.6), (10, 10.4), (7, 9)]),
        ("mark", "W", [(13, 6.6), (14, 6.6), (14, 7.6), (13, 7.6)]), ("mark", "W", [(17, 6.4), (18, 6.4), (18, 7.4), (17, 7.4)]),
        ("mark", "W", [(21, 6.6), (22, 6.6), (22, 7.6), (21, 7.6)]), ("mark", "W", [(25, 7.2), (26, 7.2), (26, 8.2), (25, 8.2)]),
        ("mark", "W", [(15, 8.4), (16, 8.4), (16, 9.4), (15, 9.4)]), ("mark", "W", [(19, 8.4), (20, 8.4), (20, 9.4), (19, 9.4)]),
        ("mark", "W", [(23, 8.6), (24, 8.6), (24, 9.6), (23, 9.6)]),
        ("flat", "K", [(6, 3), (9.6, 3.2), (11.6, 7.6), (8.4, 9.4), (6, 7)]),
        ("head", "K", [(3, 1), (6.6, 0), (9, 1.4), (9.4, 4), (6.6, 5.2), (3.6, 4.6), (2.4, 3)]),
        ("head", "b", [(3, 2.4), (-2.4, 3.4), (3, 4.2)]),
        ("mark", "W", [(7.4, 5.6), (10.4, 5.2), (10.8, 6.2), (7.6, 6.6)])]},
        # going under: head and neck first, the back rolling after
        "dive": {"frame": (36, 15), "pivot": (9, 9), "eye": (6, 8.6), "at": (4, 1), "parts": [
            ("body", "O", [(9, 9), (15, 6.6), (22, 5.4), (27, 4), (29, 5.2), (26, 8.4), (18, 10.6), (10, 11)]),
            ("mark", "W", [(17, 7.6), (18, 7.6), (18, 8.6), (17, 8.6)]), ("mark", "W", [(21, 6.6), (22, 6.6), (22, 7.6), (21, 7.6)]),
            ("head", "K", [(4, 8), (8, 7.4), (10.6, 9), (10, 11.4), (6, 12), (3.4, 11)]),
            ("head", "b", [(3.6, 9.6), (-1.6, 11), (3.8, 11.4)])]}},
}

BIRDS = {"gull": GULL, "eagle": EAGLE, "mallard": MALLARD, "hen": HEN, "sparrow": SPARROW}
VIEWS = {"A": {"big": ("flap-up", "flap-down"), "small": ("flap-up", "flap-down")},
         "B": {"big": ("glide", "stroke"), "small": ("glide", "stroke")},
         "C": {"big": ("glide", "stroke"), "small": ("flap-up", "flap-down")}}
BIG = {"gull", "eagle"}


def sky_sheet(view, scale=4):
    """The flyers in a version's view, two wing positions each, against the
    sky, then each bird at rest."""
    sky = Image.open(ROOT / "assets" / "art" / "environments" / "sky-day.png").convert("RGBA")
    items = []
    for name, spec in BIRDS.items():
        for pose in VIEWS[view]["big" if name in BIG else "small"]:
            items.append(render(spec, pose))
    w = sum(i.width + 4 for i in items) + 4
    h = max(i.height for i in items) + 8
    bg = sky.crop((0, 60, w, 60 + h)) if w <= sky.width else Image.new("RGBA", (w, h), sky.getpixel((10, 70)))
    if w > sky.width:
        for x0 in range(0, w, sky.width):
            bg.alpha_composite(sky.crop((0, 60, sky.width, 60 + h)), (x0, 0))
    x = 4
    for img in items:
        bg.alpha_composite(img, (x, (h - img.height) // 2))
        x += img.width + 4
    return bg.resize((bg.width * scale, bg.height * scale), Image.NEAREST)


def rest_sheet(scale=4):
    """Each bird at rest where it would be: the gull and eagle on the sand,
    the sparrow on its cattail, the mallards and the loon on the water."""
    land = Image.open(ROOT / "assets" / "art" / "environments" / "land.png").convert("RGBA")
    surf = Image.open(ROOT / "assets" / "art" / "environments" / "water-surface.png").convert("RGBA")
    land_items = [render(GULL, "rest"), render(EAGLE, "rest"), render(SPARROW, "rest")]
    water_items = [render(MALLARD, "rest", water=9), render(HEN, "rest", water=9), render(LOON, "rest", water=9), render(LOON, "dive", water=9)]
    w = max(sum(i.width + 6 for i in land_items), sum(i.width + 6 for i in water_items)) + 6
    top = 40
    bg = Image.new("RGBA", (w, top + 24))
    strip = land.crop((150, 306 - top, 330, 306))
    for x0 in range(0, w, strip.width):
        bg.alpha_composite(strip, (x0, 0))
    for x0 in range(0, w, surf.width):
        bg.alpha_composite(surf.crop((0, 0, surf.width, 24)), (x0, top))
    x = 6
    for img in land_items:
        bg.alpha_composite(img, (x, top - 2 - img.height))
        x += img.width + 6
    x = 6
    for img in water_items:
        bg.alpha_composite(img, (x, top + 10 - img.height + 3))
        x += img.width + 6
    return bg.resize((bg.width * scale, bg.height * scale), Image.NEAREST)


def strips():
    """Sheets for the in-game shots: each version's two wing positions per
    flyer, and every bird at rest; frame sizes go to sheets.json."""
    import json
    info = {}
    for v, view in VIEWS.items():
        for name, spec in BIRDS.items():
            frames = [render(spec, pose) for pose in view["big" if name in BIG else "small"]]
            w, h = frames[0].size
            sheet = Image.new("RGBA", (w * len(frames), h))
            for i, f in enumerate(frames):
                sheet.alpha_composite(f, (i * w, 0))
            (OUT / v).mkdir(exist_ok=True)
            sheet.save(OUT / v / f"{name}.png")
            info[f"{v}/{name}"] = [w, h]
    for name, spec, pose, water in (("gull", GULL, "rest", None), ("eagle", EAGLE, "rest", None), ("sparrow", SPARROW, "rest", None),
                                    ("mallard", MALLARD, "rest", 9), ("hen", HEN, "rest", 9), ("loon", LOON, "rest", 9), ("loon-dive", LOON, "dive", 9)):
        img = render(spec, pose, water=water)
        (OUT / "rest").mkdir(exist_ok=True)
        img.save(OUT / "rest" / f"{name}.png")
        info[f"rest/{name}"] = list(img.size)
    (OUT / "sheets.json").write_text(json.dumps(info))


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    strips()
    for v in VIEWS:
        sky_sheet(v).save(OUT / f"{v}-sky.png")
    rest_sheet().save(OUT / "rest.png")
