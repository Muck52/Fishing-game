"""The bald eagle that circles high over the lake.

A bald eagle is dark chocolate brown with a white head and white tail, a
big hooked yellow bill and yellow feet, and broad, flat wings (about 6 1/2
feet across) whose outer feathers spread like fingers when it soars. Drawn
near true size against the angler. Drawn with the shared kit
(tools/characters/kit.py).

Seen from below as it crosses the sky, like all the birds: body in
profile, the far wing reaching up behind it and the near wing down in front.
It mostly soars on wide, flat wings with the fingers spread, with a few
slow, deep wingbeats between glides.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import blank, put, outline, bird_wing, ink, write  # noqa: E402

INK = ink(
    D="#543426",  # dark brown body and wings
    d="#342a24",  # far wing, in shade
    B="#704a30",  # light on the brown
    W="#faffff",  # white head and tail
    w="#dde0cd",  # white in shade
    Y="#ffd84a",  # bill, feet
    y="#c79a49",  # bill in shade
    E="#25131a",  # eye
)

FW, FH = 40, 50
BODY = [
    "....ooooo..............",
    "..ooWWWWWoo............",
    "oYYWWWEWWWWo...........",
    "oyYYoWWWWWWWBoooo......",
    ".ooo..owWWDBBDDDDDooo..",
    "......oDDDDDDDDDDDDWWWo",
    ".......oDDDDDDDDDDWWWWWo",
    "........ooDDDYYDDoWWWWo.",
    "..........ooooooooooooo.",
]
BODY_AT = (0, 20)
NEAR, FAR = (13, 25), (14, 24)
# slow, deep beats and long soaring glides on flat wings, fingers spread;
# (wrist, tip) offsets from each shoulder, near wing then far wing
POSES = {
    "up": (((3, -9), (7, -18)), ((4, -10), (8, -20))),
    "sweep": (((1, 4), (3, 11)), ((2, -10), (6, -20))),
    "spread": (((-1, 10), (3, 21)), ((0, -10), (4, -21))),
    "down": (((0, 10), (2, 21)), ((-1, 6), (1, 13))),
    "fold": (((3, 4), (11, 6)), ((3, -4), (11, -6))),
    "rise": (((2, -4), (8, -11)), ((3, -6), (9, -14))),
    "glide": (((-1, 10), (2, 22)), ((0, -10), (3, -22))),
}
NEAR_INK = {"lead": "B", "covert": "D", "second": "D", "primary": "d"}
FAR_INK = {"lead": "D", "covert": "d", "second": "d", "primary": "d"}


def pose(name, lift=0):
    g = blank(FW, FH)
    (nw, nt), (fw, ft) = POSES[name]
    spread = name in ("spread", "glide")
    bird_wing(g, FAR, fw, ft, 7, 6, "far", FAR_INK, lift, fingers=4 if spread else 0, tip_width=5, serrate=False)
    put(g, BODY, BODY_AT[0], BODY_AT[1] + lift)
    bird_wing(g, NEAR, nw, nt, 7, 6, "near", NEAR_INK, lift, fingers=4 if spread else 0, tip_width=5, serrate=False)
    return outline(g)


def animations():
    return {
        "fly": ([pose("glide"), pose("up"), pose("sweep"), pose("spread", -1), pose("down", -1), pose("fold"), pose("rise")], 6, True),
        "glide": ([pose("glide")], 1, False),
    }


def sheet():
    return write("eagle", animations(), INK, FW, FH, keep="ENYy")


if __name__ == "__main__":
    sheet()
