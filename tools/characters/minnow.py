"""The minnows that school mid-water.

Spottail and emerald shiners, the little silver fish every Midwest lake is
full of: 2 to 4 inches, an olive back, bright silver sides with a dark
stripe along them and a white belly. Drawn smaller than any fish you can
catch. Drawn with the shared kit (tools/characters/kit.py) in the same
manner as the painted fish (tools/fish_art.py): dark back, lit flank, pale
belly, the shared outline, and a swim that runs a wave down to the tail.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import blank, put, outline, ink, write  # noqa: E402

INK = ink(
    O="#6c7f58",  # olive back
    S="#dde0cd",  # silver flank
    L="#4f738b",  # the dark stripe
    W="#faffff",  # belly
    T="#86a398",  # tail and fins
    E="#25131a",  # eye
)

FW, FH = 14, 7
BODY = [
    "...ooooo...",
    "..oOOOOOoo.",
    ".oESSSSSSSo",
    "oSLLLLLLLLL",
    ".ooWWWWWWo.",
    "...oooooo..",
]
TAILS = [  # the tail beating: up, level, down, level
    ["....", "..oo", ".oTo", "oTTo", "o..o", "...."],
    ["....", "...o", "o.oT", "TTTo", "o.oT", "...o"],
    ["....", "o..o", "oTTo", ".oTo", "..oo", "...."],
    ["....", "...o", "o.oT", "TTTo", "o.oT", "...o"],
]


def pose(k):
    g = blank(FW, FH)
    put(g, BODY, 0, 0)
    put(g, TAILS[k], 10, 0)
    return outline(g)


def animations():
    return {"swim": ([pose(k) for k in range(4)], 8, True)}


def sheet():
    return write("minnow", animations(), INK, FW, FH, keep="E")


if __name__ == "__main__":
    sheet()
