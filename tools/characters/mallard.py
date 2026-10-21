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
from kit import blank, put, outline, bird_wing, ink, write  # noqa: E402

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
    B="#8b7373",  # upper wing, grey-brown
    b="#6e5e50",  # primaries
    E="#25131a",  # eye
)

FW, FH = 20, 26
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
BODY_AT = (0, 11)
NEAR, FAR = (7, 14), (8, 13)
# fast, shallow beats, never a glide: (wrist, tip) from each shoulder
POSES = {
    "up": (((1, -4), (3, -9)), ((2, -5), (4, -10))),
    "spread": (((-1, 4), (1, 9)), ((0, -4), (2, -9))),
    "down": (((0, 4), (1, 9)), ((-1, 3), (0, 6))),
    "fold": (((2, 2), (5, 3)), ((2, -2), (5, -3))),
}
# the near wing shows its pale underside; the far wing its upper side, grey
# brown with the blue speculum edged in white along the trailing edge
NEAR_INK = {"lead": "S", "covert": "S", "second": "s", "primary": "s"}
FAR_INK = {"lead": "B", "covert": "B", "second": "U", "edge": "W", "primary": "b"}


def pose(body, name, lift=0):
    g = blank(FW, FH)
    (nw, nt), (fw, ft) = POSES[name]
    bird_wing(g, FAR, fw, ft, 3.5, 2.5, "far", FAR_INK, lift, serrate=False)
    put(g, body, BODY_AT[0], BODY_AT[1] + lift)
    bird_wing(g, NEAR, nw, nt, 3.5, 2.5, "near", NEAR_INK, lift, serrate=False)
    return outline(g)


def animations():
    beat = ["up", "spread", "down", "fold"]
    return {
        "fly": ([pose(DRAKE, t, -1 if t == "down" else 0) for t in beat], 12, True),
        "hen": ([pose(HEN, t, -1 if t == "down" else 0) for t in beat], 12, True),
    }


def sheet():
    return write("mallard", animations(), INK, FW, FH)


if __name__ == "__main__":
    sheet()
