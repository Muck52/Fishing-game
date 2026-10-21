"""Mallards heading south in a ragged V.

The drake has a glossy green head, a thin white collar, a chestnut breast,
pale grey sides, a black stern with curled tail feathers and a yellow bill;
the hen is mottled brown with an orange-brown bill. Both show a blue wing
patch edged in white (the speculum) and orange feet. About 23 inches long,
3 feet across the wings; drawn a little under true size as they fly high.
Drawn with the shared kit (tools/characters/kit.py), seen from below like
all the birds.

Ducks fly with fast, shallow wingbeats and never glide.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import blank, put, outline, wing, ink, write  # noqa: E402

INK = ink(
    G="#2d442e",  # drake's green head
    g="#407e55",  # gloss on the head
    W="#faffff",  # collar, speculum edge
    C="#90453b",  # chestnut breast
    S="#dde0cd",  # pale grey sides, wing underside
    s="#b3a697",  # grey in shade
    K="#33323d",  # black stern
    Y="#f7ec9b",  # drake's bill
    H="#a9805f",  # hen's mottled brown
    h="#704a30",  # hen's darker mottling
    O="#b77357",  # hen's bill
    U="#275571",  # blue speculum
    F="#c79a49",  # feet
    E="#25131a",  # eye
)

FW, FH = 20, 22
DRAKE = [
    "..ooo.........",
    ".oGgGo........",
    "YGEGGGoooooo..",
    "ooWWCCSSSSSKKo",
    "..oCCCSSSSSKKo",
    "...ooosssFoo..",
    "......ooo.....",
]
HEN = [
    "..ooo.........",
    ".oHhHo........",
    "OHEhHHoooooo..",
    "ooHHhHHhHHhHHo",
    "..oHHhHHhHHhho",
    "...ooohhhFoo..",
    "......ooo.....",
]
BODY_AT = (0, 8)
SHOULDER = (7, 10)
# fast, shallow beats: (far wingtip, near wingtip)
TIPS = {"up": ((9, 0), (10, 5)), "half": ((8, 2), (9, 18)), "down": ((10, 6), (8, 21))}


def pose(body, tip, lift=0):
    g = blank(FW, FH)
    sx, sy = SHOULDER
    (fx, fy), (nx, ny) = TIPS[tip]
    wing(g, (sx + 1, sy - 1 + lift), (fx, fy + lift), 4, "s", tip_chord=3)
    put(g, body, BODY_AT[0], BODY_AT[1] + lift)
    wing(g, (sx, sy + 1 + lift), (nx, ny + lift), 4, "S", tip_chord=3)
    # the blue speculum with its white edge, near the wing root
    for y in range(FH):
        for x in range(FW):
            if g[y][x] == "S" and y > sy + lift + 1 and abs(y - (sy + lift + 3)) <= 1 and x >= sx:
                g[y][x] = "U" if y != sy + lift + 4 else "W"
    return outline(g)


def animations():
    beat = ["up", "half", "down", "half"]
    return {
        "fly": ([pose(DRAKE, t, -1 if t == "down" else 0) for t in beat], 12, True),
        "hen": ([pose(HEN, t, -1 if t == "down" else 0) for t in beat], 12, True),
    }


def sheet():
    return write("mallard", animations(), INK, FW, FH)


if __name__ == "__main__":
    sheet()
