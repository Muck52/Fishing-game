"""Paints the lake's fish as pixel art, straight onto the pixel grid.

Each species is a short description: body plan, fins, colours and its
markings. paint() draws it at any length, so the same fish comes out small
for swimming and large for the journal card, drawn at both sizes rather than
shrunk.

The techniques come from studying free fish sprites (see
assets/CREDITS.md and docs/ART_DIRECTION.md):
- countershading in three bands, dark back, lit flank, pale belly, with a
  short dithered seam between them (the CC0 pixel pike by angrycheese);
- a lighter rim along the back and a darker one under the belly, so the
  body reads as round under light from above;
- translucent fins, darker than the body, with ray lines at card size, and
  a ringed eye with a glint (the CC0 "8 Fishes" set by dreyzn);
- one strong silhouette and one signature marking per species, so even a
  sixteen-pixel fish is recognisable (Clint Bellanger's CC0 Tiny Fishing);
- a single dark outline round everything, the same one the rest of the
  game uses.
"""
import math

import numpy as np
from PIL import Image

OUTLINE = (37, 19, 26)
BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]


def hash01(x, y, seed=0):
    n = (x * 374761393 + y * 668265263 + seed * 2147483647) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    return (n ^ (n >> 16)) / 4294967296


def mix(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def dither(x, y, t):
    return t * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5


# Body plans. depth: tallest point as a share of body length. peak: where
# along the body (0 nose, 1 tail base) it is tallest. up: share of the
# depth above the midline (over 0.5 for a humped back). nose: how pointed
# the head is (under 1 blunt, over 1 sharp). snout: head depth at the very
# tip. ped: depth of the tail stalk. tail: (shape, length, height).
# Fins: (start, end, height, shape) along the body; shapes are round, spiny,
# tri (high at the front) and sail. Colours are back, flank, belly, fin.
SPECIES = {
    "bluegill": dict(
        depth=0.62, peak=0.42, up=0.53, nose=0.6, snout=0.25, ped=0.3, tail=("square", 0.24, 0.62),
        dorsal=[(0.38, 0.62, 0.22, "spiny"), (0.62, 0.86, 0.3, "round")], anal=[(0.6, 0.86, 0.26, "round")],
        pelvic=0.36, back=(46, 80, 74), flank=(92, 136, 122), belly=(222, 204, 146), fin=(64, 92, 84),
        eye=(40, 40, 50), marks=[("bars", 6, (40, 64, 58), 0.0, 0.8), ("breast", (236, 130, 40)), ("ear", (16, 20, 30), None)],
    ),
    "pumpkinseed": dict(
        depth=0.6, peak=0.42, up=0.55, nose=0.6, snout=0.25, ped=0.3, tail=("square", 0.24, 0.6),
        dorsal=[(0.38, 0.62, 0.22, "spiny"), (0.62, 0.86, 0.3, "round")], anal=[(0.6, 0.86, 0.26, "round")],
        pelvic=0.36, back=(98, 104, 60), flank=(196, 170, 84), belly=(246, 176, 64), fin=(150, 130, 70),
        eye=(40, 40, 50), marks=[("spots", 0.16, (220, 120, 46), 0.15, 0.85, None), ("breast", (250, 150, 40)), ("cheek", (90, 170, 230)), ("ear", (20, 24, 30), (230, 50, 40))],
    ),
    "perch": dict(
        depth=0.3, peak=0.4, up=0.55, nose=0.95, snout=0.15, ped=0.3, tail=("fork", 0.22, 0.75),
        dorsal=[(0.3, 0.55, 0.3, "spiny"), (0.6, 0.8, 0.24, "round")], anal=[(0.66, 0.82, 0.22, "round")],
        pelvic=0.34, back=(66, 88, 40), flank=(214, 196, 70), belly=(240, 234, 196), fin=(230, 120, 44), topfin=(150, 140, 70),
        eye=(30, 30, 30), marks=[("bars", 6, (54, 74, 34), 0.0, 0.72)],
    ),
    "crappie": dict(
        depth=0.5, peak=0.45, up=0.5, nose=0.75, snout=0.2, ped=0.28, tail=("fork", 0.24, 0.7),
        dorsal=[(0.48, 0.86, 0.42, "sail")], anal=[(0.46, 0.86, 0.4, "sail")],
        pelvic=0.36, back=(60, 82, 72), flank=(186, 198, 186), belly=(232, 236, 228), fin=(120, 130, 120),
        eye=(30, 30, 30), mouth=0.1, marks=[("speckle", 0.32, (38, 50, 44)), ("finspots", (40, 50, 44))],
    ),
    "whitebass": dict(
        depth=0.4, peak=0.36, up=0.6, nose=0.85, snout=0.18, ped=0.25, tail=("fork", 0.24, 0.8),
        dorsal=[(0.3, 0.5, 0.3, "spiny"), (0.55, 0.75, 0.24, "round")], anal=[(0.6, 0.78, 0.22, "round")],
        pelvic=0.34, back=(66, 86, 108), flank=(206, 212, 220), belly=(246, 246, 246), fin=(150, 160, 170),
        eye=(200, 170, 60), marks=[("stripes", 5, (60, 68, 80), 0.12, 0.66)],
    ),
    "carp": dict(
        depth=0.36, peak=0.4, up=0.6, nose=0.75, snout=0.2, ped=0.32, tail=("fork", 0.26, 0.8),
        dorsal=[(0.38, 0.82, 0.22, "tri")], anal=[(0.72, 0.84, 0.22, "tri")],
        pelvic=0.45, back=(104, 84, 40), flank=(198, 158, 62), belly=(236, 214, 150), fin=(160, 92, 52),
        eye=(200, 160, 60), barbels="carp", marks=[("scales", (150, 112, 46), (230, 196, 104))],
    ),
    "bass": dict(
        depth=0.32, peak=0.42, up=0.55, nose=0.85, snout=0.2, ped=0.3, tail=("fork", 0.22, 0.7),
        dorsal=[(0.32, 0.56, 0.2, "spiny"), (0.56, 0.8, 0.26, "round")], anal=[(0.64, 0.8, 0.22, "round")],
        pelvic=0.36, back=(88, 78, 40), flank=(156, 132, 70), belly=(222, 210, 170), fin=(130, 100, 56),
        eye=(214, 56, 40), mouth=0.16, marks=[("bars", 10, (104, 84, 38), 0.1, 0.75), ("cheekbars", (90, 70, 40))],
    ),
    "largemouth": dict(
        depth=0.33, peak=0.42, up=0.55, nose=0.85, snout=0.2, ped=0.3, tail=("fork", 0.22, 0.7),
        dorsal=[(0.32, 0.54, 0.22, "spiny"), (0.58, 0.8, 0.26, "round")], anal=[(0.64, 0.8, 0.22, "round")],
        pelvic=0.36, back=(48, 86, 40), flank=(126, 166, 78), belly=(230, 232, 200), fin=(90, 120, 60),
        eye=(170, 120, 40), mouth=0.24, marks=[("band", (38, 66, 30), 0.44, 0.58)],
    ),
    "trout": dict(
        depth=0.27, peak=0.42, up=0.52, nose=0.85, snout=0.2, ped=0.32, tail=("square", 0.2, 0.7),
        dorsal=[(0.4, 0.58, 0.24, "round")], anal=[(0.68, 0.8, 0.2, "round")], adipose=0.84,
        pelvic=0.5, back=(38, 68, 50), flank=(92, 112, 72), belly=(214, 120, 70), fin=(200, 90, 50), topfin=(80, 96, 60),
        eye=(30, 30, 30), marks=[("worms", (150, 170, 110), 0.0, 0.38), ("spots", 0.08, (230, 210, 90), 0.3, 0.7, None), ("spots", 0.04, (220, 40, 40), 0.35, 0.7, (80, 140, 220)), ("finedge", (250, 250, 250))],
    ),
    "rainbow": dict(
        depth=0.26, peak=0.42, up=0.52, nose=0.9, snout=0.2, ped=0.3, tail=("fork", 0.2, 0.72),
        dorsal=[(0.4, 0.58, 0.22, "round")], anal=[(0.68, 0.8, 0.2, "round")], adipose=0.84,
        pelvic=0.5, back=(58, 98, 90), flank=(198, 210, 208), belly=(242, 242, 236), fin=(150, 160, 150),
        eye=(30, 30, 30), marks=[("band", (222, 106, 128), 0.4, 0.56), ("spots", 0.1, (30, 34, 40), 0.0, 0.42, None), ("tailspots", (30, 34, 40))],
    ),
    "channelcat": dict(
        depth=0.24, peak=0.3, up=0.45, nose=0.55, snout=0.35, ped=0.26, tail=("fork", 0.24, 0.85),
        dorsal=[(0.28, 0.4, 0.34, "tri")], anal=[(0.6, 0.86, 0.18, "round")], adipose=0.82,
        pelvic=0.48, back=(68, 88, 110), flank=(148, 164, 180), belly=(236, 236, 236), fin=(90, 104, 120),
        eye=(30, 30, 30), barbels="catfish", marks=[("spots", 0.05, (26, 30, 40), 0.15, 0.6, None)],
    ),
    "drum": dict(
        depth=0.4, peak=0.34, up=0.66, nose=0.7, snout=0.22, ped=0.28, tail=("round", 0.22, 0.7),
        dorsal=[(0.3, 0.46, 0.26, "spiny"), (0.46, 0.86, 0.18, "round")], anal=[(0.66, 0.8, 0.22, "round")],
        pelvic=0.34, back=(96, 106, 116), flank=(188, 194, 200), belly=(240, 240, 240), fin=(140, 146, 150),
        eye=(30, 30, 30), mouth=0.08, marks=[("lateral", (150, 156, 164))],
    ),
    "walleye": dict(
        depth=0.24, peak=0.38, up=0.55, nose=1.0, snout=0.14, ped=0.3, tail=("fork", 0.22, 0.72),
        dorsal=[(0.3, 0.52, 0.3, "spiny"), (0.56, 0.76, 0.24, "round")], anal=[(0.66, 0.8, 0.22, "round")],
        pelvic=0.34, back=(86, 88, 40), flank=(198, 178, 80), belly=(240, 234, 210), fin=(120, 110, 60),
        eye=(232, 236, 214), bigeye=True, mouth=0.14, marks=[("saddles", 5, (58, 58, 28)), ("tailtip", (250, 250, 246)), ("dorsalspot", (20, 20, 20))],
    ),
    "catfish": dict(  # the burbot (save id kept from earlier versions)
        depth=0.2, peak=0.26, up=0.5, nose=0.5, snout=0.4, ped=0.22, tail=("round", 0.16, 0.6),
        dorsal=[(0.4, 0.5, 0.14, "round"), (0.52, 0.96, 0.16, "round")], anal=[(0.52, 0.96, 0.16, "round")],
        pelvic=0.24, back=(88, 78, 48), flank=(140, 124, 80), belly=(208, 198, 150), fin=(100, 88, 56),
        eye=(30, 30, 30), barbels="burbot", marks=[("mottle", (58, 50, 34))],
    ),
    "pike": dict(
        depth=0.17, peak=0.55, up=0.5, nose=1.3, snout=0.2, ped=0.45, tail=("fork", 0.2, 1.1),
        dorsal=[(0.72, 0.86, 0.5, "tri")], anal=[(0.74, 0.88, 0.45, "tri")],
        pelvic=0.55, back=(40, 70, 40), flank=(92, 130, 70), belly=(238, 238, 218), fin=(176, 110, 60),
        eye=(200, 180, 60), mouth=0.2, flathead=True, marks=[("beans", (218, 220, 150)), ("finspots", (60, 50, 30))],
    ),
    "muskie": dict(
        depth=0.17, peak=0.55, up=0.5, nose=1.3, snout=0.2, ped=0.45, tail=("fork", 0.2, 1.15),
        dorsal=[(0.72, 0.86, 0.5, "tri")], anal=[(0.74, 0.88, 0.45, "tri")],
        pelvic=0.55, back=(86, 98, 76), flank=(180, 180, 140), belly=(240, 240, 226), fin=(150, 110, 70),
        eye=(200, 180, 60), mouth=0.2, flathead=True, marks=[("bars", 11, (66, 74, 52), 0.05, 0.8)],
    ),
    "golden": dict(  # the lake sturgeon (save id kept from earlier versions)
        depth=0.17, peak=0.3, up=0.52, nose=1.3, snout=0.1, ped=0.28, tail=("hetero", 0.26, 0.9),
        dorsal=[(0.78, 0.88, 0.3, "tri")], anal=[(0.78, 0.88, 0.25, "tri")],
        pelvic=0.62, back=(90, 100, 98), flank=(150, 160, 154), belly=(224, 224, 214), fin=(110, 118, 116),
        eye=(30, 30, 30), barbels="sturgeon", marks=[("scutes", (210, 214, 206))],
    ),
}

# The one or two markings each species keeps at swimming size, where there
# is no room for more: its signature, the thing you'd know it by.
SIGNATURE = {"bluegill": ["ear", "bars", "breast"], "pumpkinseed": ["ear", "breast"], "perch": ["bars"], "crappie": ["speckle"], "whitebass": ["stripes"], "carp": [], "bass": ["bars"], "largemouth": ["band"], "trout": ["spots", "breast"], "rainbow": ["band"], "channelcat": ["spots"], "drum": ["lateral"], "walleye": ["saddles", "tailtip"], "catfish": ["mottle"], "pike": ["beans"], "muskie": ["bars"], "golden": ["scutes"]}

# Swimming length on screen, nose to tail tip, in pixels. The angler is
# about 34 pixels tall; fish are a little larger than life beside him so
# their markings read.
LENGTH = {
    "bluegill": 17, "pumpkinseed": 17, "perch": 20, "crappie": 20, "whitebass": 22, "carp": 32,
    "bass": 24, "largemouth": 27, "trout": 23, "rainbow": 26, "channelcat": 30, "drum": 26,
    "walleye": 29, "catfish": 28, "pike": 36, "muskie": 42, "golden": 44,
}


def _fin_height(shape, u, h, x):
    u = min(1, max(0, u))
    if shape == "spiny":
        return h * max(0, math.sin(math.pi * u)) ** 0.5 * (1 if x % 2 else 0.7)
    if shape == "tri":
        return h * min(1, u * 4) * (1 - u) ** 0.6
    if shape == "sail":
        return h * max(0, math.sin(math.pi * min(1, u * 1.3))) ** 0.6
    return h * max(0, math.sin(math.pi * u)) ** 0.7


def paint(sid, total, card=False):
    s = SPECIES[sid]
    tshape, tlen, theight = s["tail"]
    L = total / (1 + tlen)  # body length, nose to tail base
    D = s["depth"] * L
    T = tlen * L
    small = not card
    finscale = 0.7 if small else 1
    finroom = max([f[2] for f in s["dorsal"]] + [0.3]) * D + 3
    W = int(math.ceil(L + T)) + 8
    H = int(math.ceil(D + 2 * finroom + D * theight * 0.6)) + 8
    cy = H / 2
    x0 = 3 + (4 if s.get("barbels") in ("catfish", "carp", "burbot") else 0)

    def f(t):
        p, ped, h0 = s["peak"], s["ped"], s["snout"]
        if t < p:
            return h0 + (1 - h0) * (t / p) ** s["nose"]
        return ped + (1 - ped) * math.cos((t - p) / (1 - p) * math.pi / 2) ** 1.3

    top, bot = {}, {}
    for xi in range(int(math.ceil(L)) + 1):
        t = xi / L
        k = f(min(1, t))
        up = s["up"]
        tp = cy - D * up * k
        if s.get("flathead") and t < 0.3:
            tp = cy - D * up * max(k, 0.55 * min(1, t / 0.12))  # the flat duck-bill head of the pikes
        top[xi], bot[xi] = tp, cy + D * (1 - up) * k

    img = np.zeros((H, W, 4), np.uint8)
    body = np.zeros((H, W), bool)
    fins = np.zeros((H, W), bool)
    rng = lambda x, y, seed=0: hash01(x, y, seed + len(sid))

    def put(mask, x, y):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < W and 0 <= y < H:
            mask[y, x] = True

    # ---- fins (behind the body)
    def fin_run(spans, side):
        for t0, t1, hh, shape in spans:
            for xi in range(int(t0 * L), int(t1 * L) + 1):
                u = (xi - t0 * L) / max(1, (t1 - t0) * L)
                h = _fin_height("round" if small and shape == "spiny" else shape, u, hh * D * finscale, xi)
                edge = top[min(xi, len(top) - 1)] if side < 0 else bot[min(xi, len(bot) - 1)]
                for k in range(int(round(h)) + 2):
                    put(fins, x0 + xi, edge + side * k)

    fin_run(s["dorsal"], -1)
    fin_run(s["anal"], 1)
    # pelvic: a small swept-back triangle under the belly
    pv = int(s["pelvic"] * L)
    for k in range(max(2, int(D * 0.22))):
        for j in range(k // 2 + 1):
            put(fins, x0 + pv + k, bot[min(pv + k, len(bot) - 1)] + j)
    if s.get("adipose"):
        ax = int(s["adipose"] * L)
        for k in range(max(2, int(L * 0.04))):
            put(fins, x0 + ax + k, top[min(ax + k, len(top) - 1)] - 1)
    # tail
    pedc = (top[int(L)] + bot[int(L)]) / 2
    pedh = (bot[int(L)] - top[int(L)]) / 2
    th = D * theight / 2
    for xi in range(int(math.ceil(T)) + 1):
        u = xi / max(1, T)
        if tshape == "round":
            half = pedh + (th - pedh) * math.sin(min(1, u * 1.6) * math.pi / 2) * math.sqrt(max(0, 1 - max(0, u - 0.6) ** 2 / 0.16))
            lo, hi = -half, half
            notch = 0
        else:
            half = pedh + (th - pedh) * u ** 0.8
            lo, hi = -half, half
            notch = {"fork": 0.85, "square": 0.12, "hetero": 0.6}[tshape] * th * max(0, (u - 0.35) / 0.65)
            if tshape == "hetero":  # sturgeon: the upper lobe long and high, the lower short
                lo = -(pedh + (th * 1.25 - pedh) * u ** 0.7)
                hi = pedh + (th * 0.6 - pedh) * u ** 1.2 if u < 0.75 else 0
        for y in range(int(math.floor(lo)), int(math.ceil(hi)) + 1):
            if abs(y) < notch and not (tshape == "hetero" and y < 0):
                continue
            put(fins, x0 + L + xi, pedc + y)

    # ---- the body
    for xi, tp in top.items():
        for y in range(int(math.ceil(tp)), int(math.floor(bot[xi])) + 1):
            put(body, x0 + xi, y)
    fins &= ~body

    back, flank, belly, finc = s["back"], s["flank"], s["belly"], s["fin"]
    topfin = s.get("topfin", finc)  # dorsal and tail, where they differ from the lower fins
    # fins: darker than the body, a little see-through, with rays when big
    ys, xs = np.nonzero(fins)
    for y, x in zip(ys, xs):
        c = topfin if (y < cy or x > x0 + L) else finc
        if card and x % 3 == 0:
            c = mix(finc, OUTLINE, 0.25)
        img[y, x] = (*c, 235)
    # countershading in three bands, dithered where they meet
    for xi, tp in top.items():
        bt = bot[xi]
        x = x0 + xi
        ys_ = [y for y in range(int(math.ceil(tp)), int(math.floor(bt)) + 1) if body[y, x]]
        if not ys_:
            continue
        span = max(1, ys_[-1] - ys_[0])
        for y in ys_:
            v = (y - ys_[0]) / span
            seam = (lambda a: dither(x, y, a)) if card else (lambda a: a > 0.5)
            if v < 0.36:
                c = back if not (v > 0.28 and seam((v - 0.28) / 0.08)) else flank
            elif v < 0.68:
                c = flank if not (v > 0.6 and seam((v - 0.6) / 0.08)) else belly
            else:
                c = belly
            img[y, x] = (*c, 255)
        # a lit rim along the back, a shaded one under the belly
        img[ys_[0], x, :3] = mix(back, (255, 255, 230), 0.35)
        if span > 3:
            img[ys_[-1], x, :3] = mix(belly, OUTLINE, 0.35)

    def body_px(x, y):
        x, y = int(round(x)), int(round(y))
        return 0 <= x < W and 0 <= y < H and body[y, x]

    def paint_px(x, y, c, need_body=True):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < W and 0 <= y < H and (body[y, x] or (not need_body and fins[y, x])):
            img[y, x, :3] = c

    def vpos(xi, v):
        xi = max(0, min(len(top) - 1, int(xi)))
        return top[xi] + (bot[xi] - top[xi]) * v

    gill = 0.22 * L
    # ---- markings
    for m in s["marks"]:
        kind = m[0]
        if small and kind not in SIGNATURE[sid]:
            continue
        if kind == "bars":
            n, c, v0, v1 = m[1], m[2], m[3], m[4]
            if small:
                n = min(n, max(3, int(L / 5)))
                if sid == "bass":
                    c = mix(c, flank, 0.4)
            for i in range(n):
                cx = L * (0.3 + 0.62 * (i + 0.5) / n)
                w = max(1, L * 0.035)
                for xi in range(int(cx - w), int(cx + w) + 1):
                    for y in range(int(vpos(xi, v0)), int(vpos(xi, v1)) + 1):
                        if rng(xi, y, i) < 0.85:
                            paint_px(x0 + xi + (y - cy) * 0.15, y, c)
        elif kind == "spots":
            dens, c, v0, v1, halo = m[1], m[2], m[3], m[4], m[5]
            for xi in range(int(gill), int(L)):
                for y in range(int(vpos(xi, v0)), int(vpos(xi, v1)) + 1):
                    if rng(xi, y, 7) < dens * (0.6 if card else 1) and rng(xi + 1, y, 7) >= dens:
                        if halo and card:
                            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                                paint_px(x0 + xi + dx, y + dy, halo)
                        paint_px(x0 + xi, y, c)
        elif kind == "breast":
            for xi in range(int(L * 0.14), int(L * 0.48)):
                for y in range(int(vpos(xi, 0.7)), int(vpos(xi, 1)) + 1):
                    paint_px(x0 + xi, y, mix(m[1], belly, 0.2 if dither(xi, y, 0.5) else 0))
        elif kind == "ear":
            ex, ey = gill + L * 0.03, vpos(gill, 0.35)
            r = max(1, D * 0.08)
            for dx in range(-int(r), int(r * 2) + 1):
                for dy in range(-int(r), int(r) + 1):
                    if dx * dx / (r * 2) ** 2 + dy * dy / r ** 2 <= 1:
                        paint_px(x0 + ex + dx, ey + dy, m[1])
            if m[2]:
                paint_px(x0 + ex + r * 2, ey, m[2])
                if card:
                    paint_px(x0 + ex + r * 2 - 1, ey, m[2])
        elif kind == "cheek":
            for i in range(2 if card else 1):
                for xi in range(int(L * 0.04), int(gill)):
                    paint_px(x0 + xi, vpos(xi, 0.45 + i * 0.15) + math.sin(xi * 0.9) * 0.6, m[1])
        elif kind == "cheekbars":
            for i in range(2):
                for xi in range(int(L * 0.06), int(gill)):
                    paint_px(x0 + xi, vpos(xi, 0.35 + i * 0.18) + (xi - L * 0.06) * 0.3, m[1])
        elif kind == "stripes":
            n, c, v0, v1 = m[1], m[2], m[3], m[4]
            if small:
                n = 3
            for i in range(n):
                v = v0 + (v1 - v0) * i / max(1, n - 1)
                for xi in range(int(gill), int(L * 0.95)):
                    if rng(xi, i, 3) < 0.9:
                        paint_px(x0 + xi, vpos(xi, v), c)
        elif kind == "speckle":
            dens, c = m[1], m[2] if card else mix(m[2], flank, 0.3)
            dens = dens if card else dens * 0.7
            for xi in range(int(gill * 0.6), int(L)):
                for y in range(int(vpos(xi, 0.05)), int(vpos(xi, 0.9)) + 1):
                    blob = rng(xi // 2, y // 2, 11) < dens
                    if blob and rng(xi, y, 12) < 0.8:
                        paint_px(x0 + xi, y, c)
        elif kind == "finspots":
            ys, xs = np.nonzero(fins)
            for y, x in zip(ys, xs):
                if rng(x // 2, y // 2, 13) < 0.3:
                    img[y, x, :3] = m[1]
        elif kind == "scales":
            # large scales in staggered rows: each a small arc with its
            # lower edge in shadow and a glint at the top
            dark, light = m[1], m[2]
            cw, ch = 4, 3
            for row in range(int(D / ch) + 2):
                for col in range(int(L / cw) + 2):
                    sx = gill + col * cw + (cw // 2 if row % 2 else 0)
                    if sx > L * 0.95:
                        continue
                    sy = vpos(sx, 0.08) + row * ch
                    if sy > vpos(sx, 0.85):
                        continue
                    for dx, dy in [(-1, 1), (0, 2), (1, 2), (2, 1)]:
                        paint_px(x0 + sx + dx, sy + dy, dark)
                    paint_px(x0 + sx, sy, light)
        elif kind == "band":
            c, v0, v1 = m[1], m[2], m[3]
            for xi in range(int(gill * 0.7), int(L)):
                wob = math.sin(xi * 0.7) * 0.03 if sid == "largemouth" else 0
                for y in range(int(vpos(xi, v0 + wob)), int(vpos(xi, v1 + wob)) + 1):
                    if sid != "largemouth" or rng(xi, y, 5) < 0.8:
                        paint_px(x0 + xi, y, c)
        elif kind == "worms":
            c, v0, v1 = m[1], m[2], m[3]
            for xi in range(int(L * 0.15), int(L)):
                for y in range(int(vpos(xi, v0)), int(vpos(xi, v1)) + 1):
                    if math.sin(xi * 1.3 + math.sin(y * 1.7) * 2.2) > 0.7:
                        paint_px(x0 + xi, y, c)
        elif kind == "tailspots":
            ys, xs = np.nonzero(fins)
            for y, x in zip(ys, xs):
                if x > x0 + L and rng(x, y, 21) < 0.18:
                    img[y, x, :3] = m[1]
        elif kind == "lateral":
            for xi in range(int(gill), int(L)):
                paint_px(x0 + xi, vpos(xi, 0.32 + 0.1 * xi / L), m[1])
        elif kind == "saddles":
            n, c = m[1], m[2]
            for i in range(n):
                cx = L * (0.3 + 0.65 * (i + 0.5) / n)
                w = max(1, L * 0.04)
                for xi in range(int(cx - w), int(cx + w) + 1):
                    for y in range(int(vpos(xi, 0)), int(vpos(xi, 0.4 + 0.1 * math.cos(xi))) + 1):
                        paint_px(x0 + xi, y, c)
        elif kind == "tailtip":
            ys, xs = np.nonzero(fins)
            for y, x in zip(ys, xs):
                if x > x0 + L + T * 0.55 and y > pedc + th * 0.35:
                    img[y, x, :3] = m[1]
        elif kind == "dorsalspot":
            t0, t1 = s["dorsal"][0][0], s["dorsal"][0][1]
            ys, xs = np.nonzero(fins)
            for y, x in zip(ys, xs):
                if x0 + (t0 + (t1 - t0) * 0.7) * L <= x <= x0 + t1 * L and y < cy - D * 0.3:
                    img[y, x, :3] = m[1]
        elif kind == "mottle":
            for xi in range(int(L * 0.1), int(L)):
                for y in range(int(vpos(xi, 0.0)), int(vpos(xi, 0.75)) + 1):
                    if math.sin(xi * 0.9 + 2 * math.sin(y * 0.8)) * math.cos(y * 1.1 - xi * 0.3) > 0.35:
                        paint_px(x0 + xi, y, m[1])
        elif kind == "beans":
            c = m[1]
            for row, v in enumerate((0.3, 0.52, 0.72) if card else (0.45,)):
                for xi in range(int(L * 0.28) + row, int(L * 0.95), 3 if card else 2):
                    if rng(xi, row, 17) < 0.75:
                        paint_px(x0 + xi, vpos(xi, v), c)
                        if card:
                            paint_px(x0 + xi + 1, vpos(xi, v), c)
        elif kind == "scutes":
            c = m[1]
            for v in ((0.08, 0.45) if card else (0.3,)):
                for xi in range(int(L * 0.25), int(L * 0.95), 3 if card else 2):
                    paint_px(x0 + xi, vpos(xi, v), c)
                    if card:
                        paint_px(x0 + xi, vpos(xi, v) - 1, mix(c, (255, 255, 255), 0.4))
        elif kind == "finedge":
            ys, xs = np.nonzero(fins)
            for y, x in zip(ys, xs):
                if y > cy and not fins[min(H - 1, y + 1), x]:
                    img[y, x, :3] = m[1]

    # pectoral fin, over the body behind the gill
    px_, py_ = gill + L * 0.03, vpos(gill + L * 0.03, 0.6)
    for k in range(max(2, int(L * 0.09))):
        for j in range(-(k // 3), 1):
            paint_px(x0 + px_ + k, py_ + j + k * 0.3, mix(finc, OUTLINE, 0.15))
    # gill cover: an arc behind the head
    for y in range(int(vpos(gill, 0.15)), int(vpos(gill, 0.85)) + 1):
        v = (y - vpos(gill, 0.15)) / max(1, vpos(gill, 0.85) - vpos(gill, 0.15))
        paint_px(x0 + gill + math.sin(v * math.pi) * D * 0.08, y, mix(flank, OUTLINE, 0.45))
    # mouth
    mlen = s.get("mouth", 0.08) * L * (1 if card else 0.5)
    my = vpos(1, 0.62 if sid not in ("crappie",) else 0.45)
    if sid == "golden":
        my = vpos(L * 0.08, 0.95)
    for k in range(max(1, int(mlen))):
        paint_px(x0 + 1 + k, my, OUTLINE)
    # eye
    ex, ey = L * (0.1 if not s.get("flathead") else 0.12), vpos(L * 0.1, 0.33)
    if sid in ("golden", "pike", "muskie"):
        ex = L * 0.14
        ey = vpos(ex, 0.3)
    r = max(1, D * (0.13 if s.get("bigeye") else 0.09)) if card else 0
    if card:
        for dx in range(-int(r) - 1, int(r) + 2):
            for dy in range(-int(r) - 1, int(r) + 2):
                d = math.hypot(dx, dy)
                if d <= r + 0.4:
                    paint_px(x0 + ex + dx, ey + dy, s["eye"] if d > r * 0.45 else (16, 16, 20))
        paint_px(x0 + ex - r * 0.4, ey - r * 0.4, (255, 255, 255))
    else:
        paint_px(x0 + ex, ey, (16, 16, 20))
        if s.get("bigeye") or s["eye"][0] > 150:
            paint_px(x0 + ex + 1, ey, s["eye"])

    # barbels, drawn last so they stand clear of the head
    def whisker(x, y, dx, dy, n, c=(70, 60, 50)):
        for k in range(n):
            xx, yy = int(round(x + dx * k)), int(round(y + dy * k))
            if 0 <= xx < W and 0 <= yy < H and not body[yy, xx]:
                img[yy, xx] = (*c, 255)
                fins[yy, xx] = True

    bar = s.get("barbels")
    nose_y = vpos(1, 0.55)
    face = x0
    while face < W - 1 and not body[int(round(nose_y)), face]:
        face += 1
    x0b = face  # whiskers grow from the front of the face
    if bar == "catfish":
        n = max(3, int(L * 0.18))
        whisker(x0b - 1, nose_y - 1, -0.6, -0.5, n)
        whisker(x0b - 1, nose_y + 1, -0.7, 0.6, n)
        whisker(x0 + 2, vpos(2, 1) + 1, -0.3, 0.9, n // 2 + 1)
    elif bar == "carp":
        whisker(x0b - 1, nose_y + 1, -0.5, 0.7, max(2, int(L * 0.06)))
    elif bar == "burbot":
        whisker(x0 + 2, vpos(2, 1) + 1, -0.2, 1, max(2, int(L * 0.06)))
    elif bar == "sturgeon":
        for k in range(2 if not card else 4):
            whisker(x0 + L * 0.05 + k * 2, vpos(L * 0.05, 1) + 1, 0, 1, max(2, int(L * 0.04)), (200, 190, 170))

    # one dark outline round everything
    img = np.pad(img, ((1, 1), (1, 1), (0, 0)))  # room for the outline, no wrap-round
    solid = img[..., 3] > 0
    p = np.pad(solid, 1)
    ring = p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
    img[ring & ~solid] = (*OUTLINE, 255)
    out = Image.fromarray(img)
    return out.crop(out.getbbox())
