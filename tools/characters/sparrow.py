"""Song sparrows flitting across the sky.

A song sparrow is small (about 6 inches, 8 across the wings): warm brown
streaked with darker brown, a pale breast streaked down the middle, a grey
face with a brown stripe through the eye. Drawn twice true size so it
reads. Drawn with the shared kit (tools/characters/kit.py), seen from below
like all the birds.

Small birds fly in bounds: a burst of quick wingbeats that lifts them, then
wings folded shut against the body as they dip, then another burst.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import blank, put, outline, bird_wing, ink, write  # noqa: E402

INK = ink(
    B="#a9805f",  # warm brown
    b="#704a30",  # dark streaks
    W="#eae2dc",  # pale breast
    g="#8b7373",  # grey face
    w="#b3a697",  # wing underside
    E="#25131a",  # eye
)

FW, FH = 12, 14
BODY = [
    "..ooo.....",
    ".oBBBoo...",
    "oggEBBBooo",
    ".oWWbBbBBo",
    "..oWbWbWo.",
    "...ooooo..",
]
BODY_AT = (0, 5)
NEAR, FAR = (4, 7), (5, 6)
POSES = {
    "up": (((1, -2), (2, -5)), ((1, -3), (2, -6))),
    "spread": (((0, 2), (1, 5)), ((0, -3), (1, -6))),
    "down": (((0, 2), (1, 5)), ((0, 2), (0, 4))),
}
NEAR_INK = {"lead": "w", "covert": "w", "second": "w", "primary": "B"}
FAR_INK = {"lead": "B", "covert": "B", "second": "b", "primary": "b"}


def pose(name, lift=0):
    g = blank(FW, FH)
    if name == "shut":
        put(g, BODY, BODY_AT[0], BODY_AT[1] + lift)
        g[BODY_AT[1] + 2 + lift][5] = "b"  # wing folded along the back
        return outline(g)
    (nw, nt), (fw, ft) = POSES[name]
    bird_wing(g, FAR, fw, ft, 2.5, 1.8, "far", FAR_INK, lift, serrate=False)
    put(g, BODY, BODY_AT[0], BODY_AT[1] + lift)
    bird_wing(g, NEAR, nw, nt, 2.5, 1.8, "near", NEAR_INK, lift, serrate=False)
    return outline(g)


def animations():
    return {
        # a burst of beats, then wings shut for the dip
        "fly": ([pose("up"), pose("spread", -1), pose("down", -1), pose("up"), pose("spread", -1), pose("down", -1), pose("shut"), pose("shut", 1), pose("shut", 1)], 14, True),
    }


def sheet():
    return write("sparrow", animations(), INK, FW, FH)


if __name__ == "__main__":
    sheet()
