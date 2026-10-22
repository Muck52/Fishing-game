"""Study 11: the angler.

The last pack character on screen (craftpix's fisherman): about 34 pixels
tall, a one-pixel face, his own outline and colours. Redrawn here from
shapes, like the cast (tools/characters/anatomy.py's Canvas): a head a
little large (study 8's C), the cast's eye with a catchlight, limbs that
taper and bend, finished with the selective edge and lit as one mass. The
same man, rigged once, in three outfits:

- **A, the old-timer:** bucket hat, olive fishing vest with pockets over a
  chambray shirt, khakis, a grey beard.
- **B, flannel and beanie:** a red buffalo-check flannel, a knit beanie,
  jeans, a full brown beard (closest to the pack's man).
- **C, rain jacket and cap:** a yellow rain jacket, a ball cap, grey
  trousers, stubble.

Every version is a full sheet laid out like the game's (idle, fishing,
landing, hurt, the fishing body with the rod cut away, walking), with its
rod tips and grip, so it can be tried in the game itself.

    python3 tools/studio/study_angler.py   -> docs/studio/studies/11-angler/
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "characters"))
from anatomy import Canvas  # noqa: E402
from kit import outline, image  # noqa: E402
from edges import treat  # noqa: E402
from light import lit  # noqa: E402

OUT = ROOT / "docs" / "studio" / "studies" / "11-angler"
FW = FH = 48
X0 = 5  # the whole man sits this far right, so the rod alone is in front of the grip
GRIP_X = 21
FACE = {"o": "#25131a", "E": "#25131a", "C": "#f7f4ee", "K": "#e2a98a", "R": "#895a45", "r": "#33323d", "N": "#c98a70"}

OUTFITS = {
    "A": {"colours": {"S": "#8fb0c8", "J": "#6b7048", "j": "#545a38", "T": "#8a7652", "B": "#4a3426", "H": "#b8a77a",
                      "Q": "#7a6a48", "A": "#8a8478", "D": "#c8c2b6", "P": "#545a38", "L": "#a8c4d8", "a": "#6f90a8"},
          "hat": "bucket", "vest": True, "beard": "full"},
    "B": {"colours": {"S": "#a83a32", "J": "#a83a32", "j": "#4a2228", "T": "#3f5f8a", "B": "#4a3426", "H": "#c0503e",
                      "Q": "#8a3428", "A": "#5a3a26", "D": "#6a4630", "X": "#4a2228", "L": "#c4524a", "a": "#7a2a26"},
          "hat": "beanie", "check": True, "beard": "full"},
    # round three: B's direction, realistic, with the clothes' details
    "R1": {"colours": {"J": "#a8323a", "L": "#bc3e44", "l": "#d8c8b0", "X": "#25131a", "x": "#5a1e26", "a": "#7a2430", "j": "#4a1a22",
                       "U": "#8a8e96", "u": "#6e727a", "w": "#e8dcc8", "T": "#2f4a72", "t": "#5a78a0", "e": "#4a2e1e", "k": "#c8ccd0",
                       "B": "#6a4428", "b": "#c8a070", "n": "#e2d4b4", "H": "#a83a32", "h": "#7e2a26", "Q": "#8a2e28", "q": "#6a221e",
                       "A": "#5a3a26", "D": "#6a4630", "S": "#a8323a"},
           "hat": "watch", "buffalo": True, "beard": "trim", "build": "real", "details": True, "sleeves": "rolled",
           "hems": True, "fade": True},
    "R2": {"colours": {"J": "#9a3430", "L": "#ae3e3a", "X": "#25131a", "x": "#561e22", "a": "#70262a", "j": "#3a161c",
                       "U": "#e6dcc6", "u": "#c8bca4", "w": "#e8dcc8", "T": "#4a6c98", "t": "#7a98c0", "e": "#4a2e1e", "k": "#c8ccd0",
                       "B": "#3a2e28", "b": "#241c18", "n": "#a8743a", "H": "#a83a32", "h": "#7e2a26", "Q": "#8a2e28", "q": "#6a221e",
                       "p": "#c8a070", "A": "#5a3a26", "D": "#6a4630", "S": "#9a3430"},
           "hat": "watch", "buffalo": True, "beard": "trim", "build": "real", "details": True, "sleeves": "cuffs",
           "open": True, "pockets": 2, "fade": True, "duck": True, "patch": True},
    "R3": {"colours": {"J": "#a8323a", "L": "#bc3e44", "l": "#d8c8b0", "X": "#25131a", "x": "#5a1e26", "a": "#7a2430", "j": "#4a1a22",
                       "U": "#8a8e96", "u": "#6e727a", "w": "#e8dcc8", "s": "#2a2228", "T": "#7a5a3a", "t": "#9a7a52", "e": "#4a2e1e",
                       "k": "#c8ccd0", "B": "#3f5a3a", "b": "#26321f", "W": "#3f5a3a", "V": "#5a7a52", "n": "#e2d4b4",
                       "H": "#a83a32", "h": "#7e2a26", "Q": "#8a2e28", "q": "#6a221e", "A": "#5a3a26", "D": "#6a4630", "S": "#a8323a"},
           "hat": "watch", "buffalo": True, "beard": "trim", "build": "real", "details": True, "sleeves": "rolled",
           "braces": True, "wellies": True},
    # study 11's pick: B's clothes, beanie and beard, in realistic proportions
    "B2": {"colours": {"S": "#a83a32", "J": "#a83a32", "j": "#4a2228", "T": "#3f5f8a", "B": "#4a3426", "H": "#943328",
                       "Q": "#6a241e", "A": "#5a3a26", "D": "#6a4630", "X": "#4a2228", "L": "#c4524a", "a": "#7a2a26"},
           "hat": "beanie", "check": True, "beard": "trim", "build": "real"},
    "C": {"colours": {"S": "#e0b040", "J": "#e0b040", "j": "#b88a28", "T": "#6a6c70", "B": "#33323d", "H": "#3f6a5a",
                      "Q": "#2c4c40", "A": "#4a3426", "D": "#8a6a52", "L": "#f2cc5c", "a": "#a87c22"},
          "hat": "cap", "hood": True, "beard": "stubble"},
}

# ---------------------------------------------------------------- poses
# Points face left (the lake). Arms: (shoulder, elbow, hand); legs: (hip,
# knee, ankle). dy lowers the upper body (a breath, a step's dip).
STAND = {"near_leg": [(23, 33), (22.6, 39.5), (22.6, 45.4)], "far_leg": [(25.6, 33), (26, 39.5), (26, 45.4)]}
SHOULDER_ROD = {
    "near_arm": [(22.4, 22.4), (21, 27.6), (19.6, 24.4)], "far_arm": [(26.4, 22.4), (27, 27.6), (26.2, 32)],
    "rod": [(17.4, 27.4), (38, 9.4)],
}
POSES = {
    "idle0": {**STAND, **SHOULDER_ROD},
    "idle1": {**STAND, **SHOULDER_ROD, "rod": [(18.4, 28.6), (37, 8.6)], "near_arm": [(22.4, 22.4), (21.4, 27.6), (20.2, 25.4)]},
    "idle2": {**STAND, **SHOULDER_ROD, "dy": 1},
    "idle3": {**STAND, **SHOULDER_ROD},
    # fishing: both hands on the grip in front, the butt against his hip
    "fish": {**STAND, "near_arm": [(22.4, 22.4), (23.6, 26.6), (21.8, 28.4)], "far_arm": [(26.2, 22.4), (25.8, 26.8), (23, 28)],
             "rod": [(25, 30.6), (-1, 23.4)], "reel": (22.4, 30)},
    # landing: the rod swept up and back as the fish comes out
    "land0": {**STAND, "near_arm": [(22.4, 22.4), (21.6, 25.6), (19.6, 22.6)], "far_arm": [(26.2, 22.4), (24.4, 25), (21.6, 23)],
              "rod": [(23.4, 27), (3, 12)]},
    "land1": {**STAND, "near_arm": [(22.4, 22.4), (21.2, 23), (20.4, 19.4)], "far_arm": [(26.2, 22.4), (24, 22), (21.6, 19.6)],
              "rod": [(22.6, 24.6), (8, 4)], "dy": -1},
    "land2": {**STAND, "near_arm": [(22.4, 22.4), (22, 19.6), (21.6, 16.4)], "far_arm": [(26.2, 22.4), (25, 19), (22.8, 16.6)],
              "rod": [(22.4, 21), (17, 0)], "dy": -1},
    # hurt: rocked back, hands up
    "hurt": {**STAND, "near_arm": [(22.6, 22.4), (20.6, 21), (19.6, 17.6)], "far_arm": [(26.6, 22.4), (27.4, 19), (26.6, 16)],
             "lean": 1.5},
}
# walking: legs through a stride, the rod on his shoulder, a dip as the
# feet pass
for i, (n, f, dy) in enumerate([((21, 45.4), (27.6, 45.4), 0), ((22, 44), (26.6, 45.4), 1), ((23.6, 45.4), (25, 45.4), 1),
                                 ((27.6, 45.4), (21, 45.4), 0), ((26.6, 45.4), (22, 44), 1), ((25, 45.4), (23.6, 45.4), 1)]):
    kn = ((23 + n[0]) / 2 - 0.6, 39.4 - (1 if n[1] < 45 else 0))
    kf = ((25.6 + f[0]) / 2 - 0.6, 39.4 - (1 if f[1] < 45 else 0))
    POSES[f"walk{i}"] = {**SHOULDER_ROD, "near_leg": [(23, 33), kn, n], "far_leg": [(25.6, 33), kf, f], "dy": dy}

ORDER = ["idle0", "idle1", "idle2", "idle3", "fish", "fish", "fish", "fish", "land0", "land1", "land2", "hurt",
         "fish", "fish", "fish", "fish", "walk0", "walk1", "walk2", "walk3", "walk4", "walk5"]
BOB = {4: 0, 5: 0, 6: 1, 7: 0, 12: 0, 13: 0, 14: 1, 15: 0}  # breathing while he waits


def draw(outfit, pose, bob=0):
    o = OUTFITS[outfit]
    p = POSES[pose]
    dy = p.get("dy", 0) + bob
    lean = p.get("lean", 0)
    c = Canvas(FW, FH)

    real = o.get("build") == "real"

    def tall(y):  # the realistic build: a shorter torso over longer legs
        return (20 + (y - 20) * 0.8 - 1.2) if (real and y >= 20) else (y - 1.2 if real else y)

    def up(pts, k=1.0):  # the upper body: lowered by dy, leaned by lean
        return [(x + X0 + lean * (1 - (y - 8) / 26) * k, tall(y) + dy) for x, y in pts]

    def hd(pts):  # the head and all on it; smaller about the neck in the realistic build
        if real:
            pts = [(23.4 + (x - 23.4) * 0.8, 19 + (y - 19) * 0.8) for x, y in pts]
        return up(pts, 0.5)

    def low(pts):
        return [(x + X0, y) for x, y in pts]

    def leg(j):  # hip moves with the body, the foot stays put
        (hx, hy), (kx, ky), (ax, ay) = j
        hy = tall(hy)
        if real:
            ky = (hy + ay) / 2 - 0.4
        return [(hx + X0, hy + dy), (kx + X0, ky + dy * 0.5), (ax + X0, ay)]

    # far leg and arm, behind
    c.limb(leg(p["far_leg"]), [3.2, 2.6, 2.4], "T")
    fa = p["far_leg"][2]
    c.limb(low([(fa[0] + 1, fa[1]), (fa[0] - 1.6, fa[1])]), [2.4, 2.4], "B")
    if p.get("far_arm"):
        arm(c, up(p["far_arm"]), [2.6, 2.2, 2], "a", o)  # the far sleeve, in shade
        hx, hy = up([p["far_arm"][2]])[0]
        c.blob([(hx - 1, hy - 1), (hx + 1, hy - 1), (hx + 1, hy + 1), (hx - 1, hy + 1)], "K")
    # the torso
    torso = [(20, 21), (26.8, 20.4), (29.2, 23), (29, 30), (28, 34), (20.6, 34), (19.2, 30), (19.2, 24)]
    if real:  # broad in the shoulders, narrower at the waist: a man, not a barrel
        torso = [(19.2, 20.6), (27.4, 20), (29.4, 21.8), (28.6, 26), (27.6, 30.4), (27.8, 34), (20.8, 34), (20.6, 30), (19.6, 26)]
    c.limb(leg(p["near_leg"])[:1] + leg(p["far_leg"])[:1], [3, 3], "T")
    c.blob(up(torso), "J" if not o.get("vest") else "S")
    if o.get("vest"):
        c.blob(up([(20.8, 22), (26.6, 21.4), (28.4, 23.4), (28, 31), (27, 33.6), (21.6, 33.6), (21, 29), (21.2, 24)]), "J", clip=True)
        c.blob(up([(21.8, 27), (24, 27), (24, 29.6), (21.8, 29.6)]), "P", clip=True)  # a pocket
        c.blob(up([(25, 24), (27, 24), (27, 26), (25, 26)]), "P", clip=True)
    if o.get("hood"):
        c.blob(up([(25.6, 18.6), (28.6, 19), (29, 22.4), (26, 22)]), "j")  # the rolled hood
    # the belt line and trousers' top
    c.blob(up([(20.2, 32.6), (27.6, 32.6), (27.4, 34.4), (20.4, 34.4)]), "T", clip=True)
    # the head
    head = [(19, 11), (22, 8.6), (26, 9), (27.4, 12), (27, 16.4), (24.6, 18.6), (20.6, 18.6), (18.6, 16), (18.4, 13)]
    c.blob(up(head, 0.5), "K")
    c.blob(hd([(18.2, 13.8), (17.4, 15), (18.6, 15.6)]), "K")  # nose
    c.blob(hd([(24.8, 10), (27.8, 11), (27.8, 15.4), (25.2, 16.4), (24.6, 13)]), "A", clip=True)  # hair at the back
    if o["beard"] == "trim":
        c.blob(hd([(18.4, 15.8), (21, 16.4), (24.6, 16.2), (25, 18.2), (22.6, 19.6), (19.6, 19.2), (18.2, 17.6)]), "D")
        c.blob(hd([(18.4, 15.8), (20.4, 15.8), (20.4, 16.6), (18.4, 16.6)]), "D")  # moustache
    elif o["beard"] == "full":
        c.blob(hd([(18, 15.6), (21, 16.2), (24.8, 16), (25.4, 18.6), (22.6, 21), (19.4, 20.4), (17.8, 18)]), "D")
        c.blob(hd([(18.4, 15.8), (20.4, 15.8), (20.4, 16.6), (18.4, 16.6)]), "D")  # moustache
    elif o["beard"] == "stubble":
        c.blob(hd([(18.8, 16.4), (24, 16.6), (24.6, 18.4), (20.4, 18.8), (18.8, 17.6)]), "D", clip=True)
    # the hat
    if o["hat"] == "bucket":
        c.blob(hd([(19.6, 10.4), (20.6, 6.8), (25.6, 6.4), (27.2, 9.8)]), "H")
        c.limb(hd([(17.4, 10.6), (29.4, 10.8)]), [1.6, 1.6], "H")
        c.blob(hd([(19.8, 9), (27, 8.6), (27.2, 9.8), (19.8, 10.2)]), "Q", clip=True)  # the band
    elif o["hat"] == "watch":
        # a knit watch cap: snug over the skull and the tops of the ears,
        # the cuff turned up
        c.blob(hd([(18.2, 11.6), (18.4, 8.4), (21.4, 6), (26.4, 6.2), (28.8, 9.2), (28.8, 12.6)]), "H")
        c.limb(hd([(18.4, 10.8), (28.6, 11.6)]), [2.2, 2.2], "Q")
    elif o["hat"] == "beanie":
        dome = [(18.8, 11.2), (19.8, 8.4), (23.6, 7.4), (27.4, 8.4), (28.2, 11.6)] if real else [(18.8, 11.2), (19.8, 7.4), (23.6, 5.8), (27.4, 7.6), (28.2, 11.6)]
        c.blob(hd(dome), "H")
        c.limb(hd([(18.8, 11), (28, 11.4)]), [2.2, 2.2], "Q")  # the cuff
    else:
        c.blob(hd([(19.4, 10.8), (20.6, 7.4), (25.4, 6.6), (28, 9.2), (28.2, 11.2)]), "H")
        c.limb(hd([(15.4, 11), (20, 10.6)]), [1.4, 1.4], "Q")  # the bill, shading his eyes
    # the rod, then the near arm over it
    if p.get("rod"):
        a, b = up(p["rod"])
        c.limb([a, b], [1.3, 1], "R")
    if p.get("reel"):
        rx, ry = up([p["reel"]])[0]
        c.blob([(rx - 1, ry - 1), (rx + 1, ry - 1), (rx + 1, ry + 1), (rx - 1, ry + 1)], "r")
    c.limb(leg(p["near_leg"]), [3.4, 2.8, 2.6], "T")
    na = p["near_leg"][2]
    c.limb(low([(na[0] + 1, na[1]), (na[0] - 1.8, na[1])]), [2.6, 2.6], "B")
    if p.get("near_arm"):
        arm(c, up(p["near_arm"]), [2.8, 2.4, 2.2], "L", o)  # the near sleeve, catching the light
        hx, hy = up([p["near_arm"][2]])[0]
        c.blob([(hx - 1.1, hy - 1.1), (hx + 1.1, hy - 1.1), (hx + 1.1, hy + 1.1), (hx - 1.1, hy + 1.1)], "K")
    g = c.grid()
    if o.get("details"):
        details(g, o)
    if o.get("buffalo"):
        # buffalo check: red and black squares, dark red where they cross
        for y in range(FH):
            for x in range(FW):
                if g[y][x] in "JL":
                    a, b = (x // 2) % 2, (y // 2) % 2
                    g[y][x] = g[y][x] if (a, b) == (0, 0) else "X" if (a, b) == (1, 1) else "x"
    if o.get("check"):
        # buffalo check: dark lines across the flannel every few pixels
        for y in range(FH):
            for x in range(FW):
                if g[y][x] in "JL" and (x % 3 == 0 or y % 3 == 0) and (x + y) % 2 == 0:
                    g[y][x] = "X"
    # the eye, as the cast's: two by two, a catchlight top left
    ex, ey = hd([(20.4, 12.6)])[0]
    ex, ey = round(ex), round(ey)
    for xx in ((ex,) if o.get("build") == "real" else (ex, ex + 1)):  # a slimmer eye on the smaller head
        for yy in (ey, ey + 1):
            g[yy][xx] = "E"
    g[ey][ex] = "C"
    return g


def arm(c, j, widths, ink, o):
    """A sleeve: whole, rolled to the elbow (bare forearm), or with a
    buttoned cuff at the wrist."""
    if o.get("sleeves") == "rolled":
        c.limb(j[:2], widths[:2], ink)
        c.limb(j[1:], [widths[1] * 0.85, widths[2] * 0.85], "K")
        ex, ey = j[1]
        c.blob([(ex - 1.4, ey - 1.2), (ex + 1.4, ey - 1.2), (ex + 1.4, ey + 1), (ex - 1.4, ey + 1)], "l" if ink == "L" else ink)  # the roll
    else:
        c.limb(j, widths, ink)
        if o.get("sleeves") == "cuffs":
            (ex, ey), (hx, hy) = j[1], j[2]
            cx, cy = ex + (hx - ex) * 0.78, ey + (hy - ey) * 0.78
            c.limb([(cx, cy), (ex + (hx - ex) * 0.92, ey + (hy - ey) * 0.92)], [widths[2] + 0.4, widths[2] + 0.4], "j")


def details(g, o):
    """The clothes' details, placed from the drawn shapes: collar and
    undershirt, placket and buttons, pocket, belt and buckle, faded and
    turned-up jeans, boot soles and laces, the beanie's knit."""
    H_, W_ = len(g), len(g[0])
    rows = [y for y in range(H_) if "J" in g[y]]
    if rows:
        top, bot = rows[0], rows[-1]
        front = {y: g[y].index("J") for y in rows}
        back = {y: W_ - 1 - g[y][::-1].index("J") for y in rows}
        fx = front[top]

        def put(x, y, ch, over="JL"):
            if 0 <= y < H_ and 0 <= x < W_ and g[y][x] in over:
                g[y][x] = ch
        if o.get("open"):
            # the shirt-jacket hangs open over a waffle-knit thermal
            for y in rows:
                for dx in (0, 1):
                    put(front[y] + dx, y, "u" if (front[y] + dx + y) % 2 else "U")
        else:
            put(fx, top, "U"), put(fx + 1, top, "U"), put(fx, top + 1, "U")  # the undershirt at the open collar
            put(fx + 1, top + 1, "X")  # the collar point
            for y in rows[2:]:
                if (y - top) % 3 == 1:
                    put(front[y] + 1, y, "w")  # buttons down the placket
        for k in range(o.get("pockets", 1)):
            px = fx + 2 + k * 3 + (2 if o.get("open") else 0)
            for dx in range(3):
                put(px + dx, top + 3, "X")  # the pocket's flap
            put(px + 1, top + 4, "w")  # its button
        if o.get("braces"):
            for y in rows:
                put(front[y] + 2, y, "s"), put(back[y] - 1, y, "s")
        # the belt and its buckle
        by = bot + 1
        if by < H_:
            for x in range(W_):
                if g[by][x] == "T":
                    g[by][x] = "e"
            xs = [x for x in range(W_) if g[by][x] == "e"]
            if xs:
                g[by][xs[0] + 1] = "k"
    # the trousers: faded thighs and knees, turned-up hems or rubber boots
    trows = [y for y in range(H_) if "T" in g[y]]
    for y in trows:
        xs = [x for x in range(W_) if g[y][x] == "T"]
        for x in xs:
            below = y + 1 < H_ and g[y + 1][x] in "B"
            if o.get("wellies") and y >= H_ - 9:
                g[y][x] = "W" if y > H_ - 9 else "V"
            elif below and o.get("hems"):
                g[y][x] = "t"  # the turned-up hem
            elif o.get("fade") and trows[0] + 3 <= y <= trows[0] + 9 and (x + 2 * y) % 4 == 0 and xs[0] < x < xs[-1]:
                g[y][x] = "t"
    # boots: the sole, and laces or the duck boot's leather upper
    for x in range(W_):
        ys = [y for y in range(H_) if g[y][x] == "B"]
        if not ys:
            continue
        if o.get("wellies"):
            for y in ys:
                g[y][x] = "W"
            g[ys[-1]][x] = "b"
            continue
        g[ys[-1]][x] = "b"
        if o.get("duck"):
            g[ys[0]][x] = "n"
    if not o.get("duck") and not o.get("wellies"):
        for y in range(H_):
            xs = [x for x in range(W_) if g[y][x] == "B"]
            if xs and y + 1 < H_ and "b" in g[y + 1]:
                g[y][xs[0] + 1] = "n"  # laces
    # the beanie's knit: ribs, and a patch on the cuff
    for y in range(H_):
        for x in range(W_):
            if g[y][x] == "H" and x % 2 == 0:
                g[y][x] = "h"
            elif g[y][x] == "Q" and x % 2 == 0:
                g[y][x] = "q"
    if o.get("patch"):
        for y in range(H_):
            xs = [x for x in range(W_) if g[y][x] in "Qq"]
            if xs:
                g[y][xs[0] + 2] = "p"
                break


def frame(outfit, pose, bob=0):
    g = outline(draw(outfit, pose, bob))
    img = image(g, {**FACE, **OUTFITS[outfit]["colours"]})
    return img


def sheet(outfit):
    """The game's 22 frames for an outfit, finished, and their anchors."""
    frames = []
    for i, pose in enumerate(ORDER):
        f = frame(outfit, pose, BOB.get(i, 0))
        if 12 <= i <= 15:  # the fishing body: the rod in front of his hands cut away
            px = f.load()
            for y in range(FH):
                for x in range(GRIP_X):
                    px[x, y] = (0, 0, 0, 0)
        frames.append(f)
    strip = Image.new("RGBA", (FW * len(frames), FH))
    for i, f in enumerate(frames):
        strip.alpha_composite(f, (i * FW, 0))
    flat = treat(strip, FW)
    strip = lit(flat, FW)
    # the knit cap keeps its own colours: lit as part of the mass, its
    # crown went pale and read as a bald head
    sp, fp = strip.load(), flat.load()
    for i, pose in enumerate(ORDER):
        g = outline(draw(outfit, pose, BOB.get(i, 0)))
        for y in range(FH):
            for x in range(FW):
                if 12 <= i <= 15 and x < GRIP_X:
                    continue
                if g[y][x] in "HhQqp":
                    sp[i * FW + x, y] = fp[i * FW + x, y]
                elif g[y][x] == "o" and any(0 <= y + dy < FH and 0 <= x + dx < FW and g[y + dy][x + dx] in "HhQq"
                                            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    sp[i * FW + x, y] = (37, 19, 26, 255)  # a plain dark edge round the cap
    # the rod tips of the fishing frames, and where the hands hold it
    tips, grips = [], []
    for i in range(4, 8):
        f = strip.crop((i * FW, 0, (i + 1) * FW, FH))
        px = f.load()
        best = None
        for y in range(18, 32):
            for x in range(FW):
                if px[x, y][3]:
                    if best is None or x < best[0]:
                        best = (x, y)
                    break
        tips.append({"x": best[0], "y": best[1]})
        ys = [y for y in range(20, 36) if px[GRIP_X - 1, y][3]]
        grips.append({"x": GRIP_X, "y": round(sum(ys) / len(ys)) if ys else 28})
    anchors = {"idle": [0, 3], "fish": [4, 7], "land": [8, 10], "hurt": 11, "body": [12, 15], "walk": [16, 21], "tips": tips, "grips": grips}
    return strip, anchors


def card(strips, scale=4):
    """Each outfit: idle, fishing, landing, hurt, two walking frames, on the deck."""
    pick = [0, 4, 9, 11, 16, 19]
    rows = []
    for v, st in strips.items():
        row = Image.new("RGBA", (FW * len(pick), FH), (196, 178, 140, 255))
        for k, i in enumerate(pick):
            row.alpha_composite(st.crop((i * FW, 0, (i + 1) * FW, FH)), (k * FW, 0))
        rows.append(row)
    out = Image.new("RGBA", (rows[0].width, sum(r.height + 4 for r in rows)), (255, 255, 255, 255))
    for k, r in enumerate(rows):
        out.alpha_composite(r, (0, k * (FH + 4)))
    return out.resize((out.width * scale, out.height * scale), Image.NEAREST)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    strips, anchors = {}, {}
    now = Image.open(ROOT / "assets" / "art" / "characters" / "angler.png").convert("RGBA")
    strips["now"] = now
    for v in OUTFITS:
        st, an = sheet(v)
        (OUT / v).mkdir(exist_ok=True)
        st.save(OUT / v / "angler.png")
        strips[v], anchors[v] = st, an
    (OUT / "anchors.json").write_text(json.dumps(anchors))
    for v, st in strips.items():
        card({v: st}).save(OUT / f"{v}-poses.png")
    card(strips).save(OUT / "all.png")
