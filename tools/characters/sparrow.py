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
from kit import blank, put, outline, wing, ink, write  # noqa: E402

INK = ink(
    B="#a9805f",  # warm brown
    b="#704a30",  # dark streaks
    W="#eae2dc",  # pale breast
    g="#8b7373",  # grey face
    w="#b3a697",  # wing underside
    E="#25131a",  # eye
)

FW, FH = 12, 12
BODY = [
    ".oo......",
    "ogEboooo.",
    "oWWbBBbBo",
    ".oWbWWbo.",
    "..ooooo..",
]
BODY_AT = (0, 4)
SHOULDER = (4, 5)
TIPS = {"up": ((6, 0), (6, 2)), "half": ((5, 1), (5, 10)), "down": ((6, 3), (5, 11))}


def pose(tip, lift=0):
    g = blank(FW, FH)
    if tip == "shut":
        put(g, BODY, BODY_AT[0], BODY_AT[1] + lift)
        g[BODY_AT[1] + 2 + lift][5] = "b"  # wing folded along the back
        return outline(g)
    sx, sy = SHOULDER
    (fx, fy), (nx, ny) = TIPS[tip]
    wing(g, (sx + 1, sy - 1 + lift), (fx, fy + lift), 3, "b", tip_chord=2)
    put(g, BODY, BODY_AT[0], BODY_AT[1] + lift)
    wing(g, (sx, sy + 1 + lift), (nx, ny + lift), 3, "w", tip_chord=2)
    return outline(g)


def animations():
    return {
        # a burst of beats, then wings shut for the dip
        "fly": ([pose("up"), pose("down", -1), pose("up"), pose("down", -1), pose("half"), pose("shut"), pose("shut", 1), pose("shut", 1)], 14, True),
    }


def sheet():
    return write("sparrow", animations(), INK, FW, FH)


if __name__ == "__main__":
    sheet()
