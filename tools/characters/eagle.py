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
from kit import blank, put, outline, wing, ink, write  # noqa: E402

INK = ink(
    D="#543426",  # dark brown body and wings
    d="#342a24",  # far wing, in shade
    B="#704a30",  # light on the brown
    b="#3f2939",  # tips of the far wing
    W="#faffff",  # white head and tail
    w="#dde0cd",  # white in shade
    Y="#ffd84a",  # bill, feet
    y="#c79a49",  # bill in shade
    E="#25131a",  # eye
)

FW, FH = 36, 40
BODY = [
    "....ooooo.............",
    "..ooWWWWWoo...........",
    "oYYWWEWWWWWo..........",
    "oyYoWWWWWWWDooooo.....",
    ".ooo.owwWDDDDDDDDDoooo",
    ".....oDDDDDDDDDDDDDWWWo",
    "......oDDDDDDDDDDDDWWWWo",
    ".......ooDDDDDDYYooooo..",
    ".........ooooooooo......",
]
BODY_AT = (0, 14)
SHOULDER = (14, 18)
TIPS = {"up": ((19, 0), (20, 8)), "half": ((17, 2), (18, 32)), "level": ((16, 1), (17, 37)), "down": ((18, 10), (16, 37))}


def fingers(g, tip, ch, down):
    """The spread primaries at a soaring wing's tip: notches between them."""
    tx, ty = tip
    for k in (1, 3):
        y, x = ty + (-2 if down else 2), tx + k
        if 0 <= y < FH and 0 <= x < FW and g[y][x] == ch:
            g[y][x] = "."
        y2 = ty + (-1 if down else 1)
        if 0 <= y2 < FH and 0 <= x < FW and g[y2][x] == ch:
            g[y2][x] = "."


def pose(tip, lift=0):
    g = blank(FW, FH)
    sx, sy = SHOULDER
    (fx, fy), (nx, ny) = TIPS[tip]
    wing(g, (sx + 2, sy - 1 + lift), (fx, fy + lift), 7, "d", tip_chord=6)
    put(g, BODY, BODY_AT[0], BODY_AT[1] + lift)
    wing(g, (sx, sy + 1 + lift), (nx, ny + lift), 7, "D", lead="B", tip_chord=6)
    if tip == "level":
        fingers(g, (fx, fy + lift), "d", False)
        fingers(g, (nx, ny + lift), "D", True)
    return outline(g)


def animations():
    return {
        "fly": ([pose("level"), pose("half"), pose("up"), pose("half"), pose("level", -1), pose("down", -1), pose("half")], 6, True),
        "glide": ([pose("level")], 1, False),
    }


def sheet():
    return write("eagle", animations(), INK, FW, FH)


if __name__ == "__main__":
    sheet()
