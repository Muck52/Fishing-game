"""Olive: the angler's dog, and a character of her own.

Modelled on a real dog, a 40 lb husky / cattle dog mix: black coat with a
sheen along her back, a narrow white blaze down to a white muzzle, white
throat, chest, belly and legs, black thighs, upright ears, warm brown eyes,
a plumed tail curled over her back with a white tip, and a coral bandana
with cream flowers. Her notes are in docs/characters/olive.md.

She's drawn side-on, facing left, at a size that sits beside the angler.
Her proportions follow a real canid: her build and her walk were worked out
over the CC0 fox in assets/source/scratchio-wild-animals (the same body plan,
made stockier for a 40 lb dog), and her gallop follows Muybridge's
photographs of a running dog (Animal Locomotion, 1887, public domain).

Her body and head are one pixel drawing; her legs are drawn per frame from
joint positions (shoulder, wrist, paw in front; hip, hock, paw behind), so
every animation can pose them freely; tilted frames (the leap) are turned on
the pixel grid. Everything is in the game's palette with its shared outline.

Run on its own to write her sprite sheet and previews:
    python3 tools/characters/olive.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import blank as _blank, put as _put, limb, outline as _outline, rotate as _rotate, walk_legs, ink, write  # noqa: E402

INK = ink(
    d="#3f2939",  # coat in deep shadow, far legs' thighs
    K="#33323d",  # black coat
    k="#3c424e",  # black coat in light
    s="#545666",  # sheen along her back
    g="#8b7373",
    w="#b3a697",  # white fur in shade (the far legs)
    W="#eae2dc",  # white fur
    H="#faffff",  # the tip of her tail
    r="#833f4c",  # bandana fold
    R="#c25f62",  # bandana
    F="#fff4d6",  # bandana flower
    P="#985252",  # inside her ear
    N="#25131a",  # nose
    E="#a36443",  # eye
    b="#b2d0d0",  # water drops
    B="#f5f2db",  # water drops catching the light
)

FW, FH = 40, 30  # one frame
PAD = 4  # room above her for the tilt of a leap
FEET = 23 + PAD  # the row her paws stand on

# Her body and head, facing left, without legs or tail.
BODY = [
    ".......o..o",
    "......oPooKo",
    "......oPKoKKo",
    "......oKKKKKo",
    ".....oWKKKKKKo",
    "...ooWEKKKKKKKo",
    ".oNWWWKKKKKKKKKo",
    ".oWWWWWKKKKKKKKKo",
    "..oowWWWKKKKKKKKKo",
    ".....oWWWKKKKKKKKKoooooooooo",
    ".....oWWRRKKKKKssssssssssssKo",
    "......oRFRRkkkkkkkkkkkkkkkkKo",
    "......oWRrkkkkkkkkkkkkkkkkkKKo",
    "......oWWkkkkkkkkkkkkkkkkkkKKo",
    ".......oWWkkkkkkkkkkkkkkkkkKKo",
    ".......oWWWwkkkkkkkkkkkkkkKKKo",
    "........oWWWwwwwwwoookKKKKKKo",
    ".........ooooooooo..oKKKKKo",
]
EYE = (6, 5)
# Her tail, curled up over her rump, the white tip resting toward her back.
TAIL = [
    "...oooo...",
    "..oKkkKo..",
    ".oKKooKKo.",
    "oHWo..oKo.",
    "oWWo..oKKo",
    ".oo...oKKo",
    "......oKKo",
    ".....oKKo.",
]
TAIL_AT = (21, 2)
# Swimming, her tail floats out behind her on the water.
SWIM_TAIL = [".ooo.", "oKKWo", ".ooo."]

# Legs, as joint positions in the body's frame: near front, far front, near
# hind, far hind. Fronts hang from the shoulder at row 15, hinds from the hip
# at row 16; paws stand on row 23.
STAND = ([(10, 15), (10, 23)], [(13, 15), (13, 23)], [(24, 16), (25, 20), (24, 23)], [(21, 16), (22, 20), (21, 23)])
CROUCH = ([(10, 15), (8, 19), (9, 21)], [(13, 15), (11, 19), (12, 21)], [(24, 16), (20, 19), (22, 21)], [(21, 16), (17, 19), (19, 21)])
# The rotary gallop, as Muybridge photographed it: gathered under her, hind
# feet land, push off, stretched out flying, front feet land, front push.
# Each with how far her body rises or drops.
GALLOP = [
    (0, ([(10, 15), (9, 19), (13, 21)], [(13, 15), (12, 19), (16, 21)], [(24, 16), (20, 19), (17, 21)], [(21, 16), (18, 20), (15, 22)])),
    (1, ([(10, 15), (8, 18), (10, 21)], [(13, 15), (11, 19), (13, 21)], [(24, 16), (22, 19), (20, 22)], [(21, 16), (20, 19), (19, 22)])),
    (0, ([(10, 15), (6, 18), (3, 20)], [(13, 15), (9, 18), (7, 21)], [(24, 16), (26, 19), (28, 23)], [(21, 16), (23, 20), (25, 23)])),
    (-2, ([(10, 15), (5, 17), (1, 19)], [(13, 15), (8, 17), (4, 20)], [(24, 16), (28, 18), (32, 19)], [(21, 16), (25, 18), (29, 20)])),
    (0, ([(10, 15), (8, 19), (7, 23)], [(13, 15), (10, 18), (7, 21)], [(24, 16), (27, 19), (30, 21)], [(21, 16), (24, 19), (26, 21)])),
    (1, ([(10, 15), (11, 19), (13, 22)], [(13, 15), (14, 19), (16, 22)], [(24, 16), (24, 19), (22, 21)], [(21, 16), (20, 19), (18, 20)])),
]


def blank():
    return _blank(FW, FH)


def put(g, rows, x0, y0):
    _put(g, rows, x0, y0)


def outline(g):
    return _outline(g)


def leg(g, pts, near, hind, dy=0):
    """A leg two pixels thick through its joints. The far legs are in shade;
    the tops of the hind legs are her black thighs."""
    thigh = ("K" if near else "d", 3) if hind else None
    limb(g, pts, "W" if near else "w", dy=dy, upper=thigh)


def pose(legs, dy=0, wag=0, blink=False):
    g = blank()
    dy += PAD
    near_f, far_f, near_h, far_h = legs
    leg(g, far_f, False, False, dy)
    leg(g, far_h, False, True, dy)
    put(g, BODY, 0, dy)
    put(g, TAIL, TAIL_AT[0] + wag, TAIL_AT[1] + dy)
    leg(g, near_f, True, False, dy)
    leg(g, near_h, True, True, dy)
    if blink:
        g[EYE[1] + dy][EYE[0]] = "K"
    return outline(g)


def gait(t):
    """A four-beat walk: near hind, near front, far hind, far front, a
    quarter of a cycle apart, so three paws are down at any moment."""
    return walk_legs(t, [("front", (10, 15), 0.25), ("front", (13, 15), 0.75), ("hind", (24, 16), 0), ("hind", (21, 16), 0.5)])


def rotate(g, deg):
    return _rotate(g, deg, 20, 17)


SWIM_DY = 3 + PAD
WATERLINE = 11 + SWIM_DY  # rows from here down are under the water


def swim(k):
    """Dog-paddling: head and back above the water, legs churning below,
    each front paw reaching forward and pulling back in turn."""
    g = blank()
    fronts = [[(10, 15), (6, 18), (5, 21)], [(10, 15), (9, 19), (12, 21)], [(10, 15), (11, 19), (13, 20)], [(10, 15), (8, 19), (7, 21)]]
    hinds = [[(24, 16), (27, 19), (30, 20)], [(24, 16), (26, 19), (27, 21)], [(24, 16), (24, 19), (23, 21)], [(24, 16), (26, 20), (28, 21)]]
    leg(g, fronts[(k + 2) % 4], False, False, SWIM_DY)
    leg(g, [(21, 16), (23, 19), hinds[(k + 2) % 4][-1]], False, True, SWIM_DY)
    put(g, BODY, 0, SWIM_DY)
    put(g, SWIM_TAIL, 27, 8 + SWIM_DY)
    leg(g, fronts[k], True, False, SWIM_DY)
    leg(g, hinds[k], True, True, SWIM_DY)
    return outline(g)


def shake(k):
    """Shaking off: her body twists side to side over planted legs, tail
    flung the other way, water flying off her."""
    dx = (-1, 1, -1, 1)[k]
    g = blank()
    leg(g, STAND[1], False, False, PAD)
    leg(g, STAND[3], False, True, PAD)
    body = blank()
    put(body, BODY, dx, PAD)
    put(body, TAIL, TAIL_AT[0] - dx, TAIL_AT[1] + PAD)
    for y in range(FH):
        for x in range(FW):
            if body[y][x] != ".":
                g[y][x] = body[y][x]
    leg(g, STAND[0], True, False, PAD)
    leg(g, STAND[2], True, True, PAD)
    g = outline(g)
    drops = [
        [(3, 5), (30, 3), (35, 12), (1, 15), (18, 4)],
        [(5, 3), (33, 5), (37, 15), (2, 12), (20, 2)],
        [(2, 6), (31, 2), (36, 10), (4, 16), (16, 3)],
        [(6, 4), (32, 4), (38, 13), (0, 14), (22, 3)],
    ][k]
    for x, y in drops:
        if g[y][x] == ".":
            g[y][x] = "B"
        if g[y + 1][x] == ".":
            g[y + 1][x] = "b"
    return g


def animations():
    """name -> (frames as pixel grids, fps, loops, facts for the game)."""
    st = STAND
    return {
        # standing, tail wagging, now and then a blink
        "idle": ([pose(st), pose(st, wag=1), pose(st), pose(st, wag=-1), pose(st, blink=True), pose(st)], 4, True),
        "walk": ([pose(gait(i / 8), dy=1 if i % 4 == 2 else 0) for i in range(8)], 10, True, {"step": 1}),
        "run": ([pose(legs, dy=d) for d, legs in GALLOP], 14, True, {"step": 4}),
        # crouch, spring with her nose up, stretched out in the air, nose down to dive
        "leap": ([pose(CROUCH, dy=2), rotate(pose(GALLOP[2][1]), 12), pose(GALLOP[3][1], dy=-2), rotate(pose(GALLOP[3][1]), -35)], 8, False),
        "swim": ([swim(k) for k in range(4)], 6, True, {"water": WATERLINE}),
        "shake": ([shake(k) for k in range(4)] * 2, 14, False),
    }


def sheet():
    """Her sheet and animation table, and her previews in docs/characters."""
    return write("olive", animations(), INK, FW, FH, folder="olive", keep="ENneF")


if __name__ == "__main__":
    strip, _ = sheet()
    print("frames", strip.width // FW)
