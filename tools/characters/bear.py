"""The American black bear that ambles out of the pines.

A black bear stands 30 to 36 inches at the shoulder and is about 5 feet
long. It is not a grizzly: no hump over the shoulders (walking, its rump is
the highest point), a straight face from brow to nose, and bigger, more
upright ears. Glossy black with a tan-brown muzzle and small brown eyes,
heavy legs, and flat feet that come down heel first. Near life size against
the angler. Drawn with the shared kit (tools/characters/kit.py).

It ambles: the legs on one side swing nearly together, head low and
swinging; standing, it lifts its nose to scent the air.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import blank, put, limb, outline, walk_legs, ink, write  # noqa: E402

INK = ink(
    K="#33323d",  # black coat
    k="#3c424e",  # coat in the light
    s="#545666",  # sheen along the back
    d="#3f2939",  # coat in shade, far legs
    M="#a9805f",  # tan muzzle
    m="#704a30",  # muzzle in shade
    N="#25131a",  # nose
    E="#704a30",  # eye
)

FW, FH = 38, 24
GROUND = 22

HEAD = [
    "..ooo.ooo...",
    ".oKKKoKKKo..",
    ".oKKkkkKKo..",
    "oKKKkEkKKKK.",
    "oMMKKKKKKKKK",
    "NMMMMKKKKKKK",
    "ommmMMKKKKKK",
    ".ooooooKKKKK",
]
HEAD_AT = (0, 6)
BODY = [
    "......................oooooooo",
    "..................oooosssssssoo",
    "............ooooosskkkkkkkkkkkso",
    "..........oosskkkkkkkkkkkkkkkkkKo",
    ".........oskkkkkkkKKKKKKKKKKKKKKKo",
    "........okkKKKKKKKKKKKKKKKKKKKKKKKo",
    "........oKKKKKKKKKKKKKKKKKKKKKKKKKKo",
    "........oKKKKKKKKKKKKKKKKKKKKKKKKKKo",
    "........oKKKKKKKKKKKKKKKKKKKKKKKKKKo",
    "........oKKKKKKKKKKKKKKKKKKKKKKKKKo",
    ".........oKKKKKKdddddddddddKKKKKKo",
    "..........oKKKKdddddddddddddKKKKo",
    "...........oooooooooooooooooooo",
]
BODY_AT = (0, 4)
# the lateral amble: near hind and near front close together, then the far pair
LEGS = [("front", (10, 15), 0.15), ("front", (13, 15), 0.65), ("hind", (29, 15), 0.0), ("hind", (26, 15), 0.5)]
STAND = [[(10, 15), (10, 22)], [(13, 15), (13, 22)], [(29, 15), (29, 18), (28, 22)], [(26, 15), (26, 18), (25, 22)]]
STEP = 1


def pose(legs, head=0, dy=0):
    """head: how far the nose lifts, scenting the air (0, 1, 2)."""
    g = blank(FW, FH)
    near_f, far_f, near_h, far_h = legs
    limb(g, far_f, "d", width=3, dy=dy)
    limb(g, far_h, "d", width=3, dy=dy)
    put(g, BODY, BODY_AT[0], BODY_AT[1] + dy)
    put(g, HEAD, HEAD_AT[0] + (1 if head else 0), HEAD_AT[1] - head + dy)
    limb(g, near_f, "K", width=3, dy=dy)
    limb(g, near_h, "K", width=3, dy=dy)
    return outline(g)


def animations():
    amble = [walk_legs(i / 8, LEGS, stance=0.6, lift=2, reach=3, ground=GROUND, knee=4) for i in range(8)]
    st = STAND
    return {
        "walk": ([pose(amble[i], dy=1 if i % 4 == 2 else 0) for i in range(8)], 7, True, {"step": STEP}),
        "idle": ([pose(st), pose(st), pose(st, head=1), pose(st, head=2), pose(st, head=2), pose(st, head=1)], 3, True),
    }


def sheet():
    return write("bear", animations(), INK, FW, FH, keep="ENE")


if __name__ == "__main__":
    sheet()
