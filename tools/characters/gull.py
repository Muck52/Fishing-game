"""A ring-billed gull crossing the sky.

The commonest gull on Midwest lakes: white head, body and tail, pale grey
back and wings with black wingtips and a white spot in the black, a yellow
bill with a black ring near its tip, and a dark eye. About 19 inches long
with a 4 foot wingspan; drawn near true size (it flies high, far off).
Drawn with the shared kit (tools/characters/kit.py).

Birds are seen from below as they cross the sky, so it is drawn that way:
the body in profile, the far wing reaching up behind it and the near wing
down in front, both spread. It flies with steady, easy wingbeats and long
glides: on the downstroke both wings sweep down (the body lifting a pixel
as they push), on the upstroke they come back up, and it glides on wings
held out wide.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import blank, put, outline, bird_wing, ink, write  # noqa: E402

INK = ink(
    W="#faffff",  # white head, body, tail, trailing edge, mirrors
    w="#dde0cd",  # white in shade, the underwing
    G="#b2d0d0",  # pale grey wings
    g="#86a398",  # grey in shade, the far wing
    K="#33323d",  # black wingtips
    Y="#ffd84a",  # bill
    y="#c79a49",  # lower bill, in shade
    E="#25131a",  # eye, the ring on the bill
)

FW, FH = 32, 34
BODY = [
    "....ooo...........",
    "..ooWWWoo.........",
    ".oWWWWWWWoooo.....",
    "oYEYWEWWWWWWWoooo.",
    "ooyyowWWWWWWWWWWWo",
    "...oowWWWWWWWWWWwo",
    ".....oowwwwwwwwwo.",
    ".......ooooooooo..",
]
BODY_AT = (1, 13)
NEAR, FAR = (11, 17), (12, 16)  # shoulders
# A wingbeat after Marey's chronophotographs of gulls (1887): the downstroke
# on fully spread wings, then the upstroke with the wrist bent and the hand
# swept back so the wing slips up through the air. (wrist, tip) offsets
# from each shoulder, near wing then far wing.
POSES = {
    "up": (((2, -6), (5, -12)), ((3, -7), (6, -14))),
    "sweep": (((0, 3), (2, 8)), ((1, -7), (4, -13))),
    "spread": (((-1, 7), (3, 14)), ((0, -7), (4, -13))),
    "down": (((0, 7), (2, 14)), ((-1, 4), (1, 9))),
    "fold": (((2, 3), (8, 4)), ((2, -3), (8, -4))),
    "rise": (((1, -3), (6, -8)), ((2, -5), (7, -10))),
    "glide": (((-1, 7), (5, 13)), ((0, -7), (5, -12))),
}
NEAR_INK = {"lead": "W", "covert": "w", "second": "G", "edge": "W", "primary": "G", "tip": "K", "mirror": "W"}
FAR_INK = {"lead": "G", "covert": "G", "second": "g", "edge": "W", "primary": "g", "tip": "K", "mirror": "W"}


def pose(name, lift=0):
    g = blank(FW, FH)
    (nw, nt), (fw, ft) = POSES[name]

    bird_wing(g, FAR, fw, ft, 4.5, 3, "far", FAR_INK, lift, serrate=False)
    put(g, BODY, BODY_AT[0], BODY_AT[1] + lift)
    bird_wing(g, NEAR, nw, nt, 4.5, 3, "near", NEAR_INK, lift, serrate=False)
    return outline(g)


def animations():
    return {
        # the body lifts a pixel as the wings push down
        "fly": ([pose("up"), pose("sweep"), pose("spread", -1), pose("down", -1), pose("fold"), pose("rise")], 10, True),
        "glide": ([pose("glide")], 1, False),
    }


def sheet():
    return write("gull", animations(), INK, FW, FH, keep="ENYy")


if __name__ == "__main__":
    sheet()
