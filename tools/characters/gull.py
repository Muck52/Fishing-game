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
from kit import blank, put, outline, wing, ink, write  # noqa: E402

INK = ink(
    W="#faffff",  # white head and body
    w="#dde0cd",  # white in shade
    G="#b2d0d0",  # pale grey back and wings
    g="#86a398",  # far wing, in shade
    K="#33323d",  # black wingtips
    Y="#ffd84a",  # bill
    E="#25131a",  # eye, bill ring
)

FW, FH = 30, 30
BODY = [
    "...ooo..........",
    ".ooWWWoo........",
    "YEWWEWWWooooo...",
    ".ooWWWWWGGGGWooo",
    "...owWWWWWWWWWWWo",
    "....oowwwwwwwwoo.",
    "......oooooooo...",
]
BODY_AT = (2, 13)
SHOULDER = (12, 15)
# (far wingtip, near wingtip) for each moment of a wingbeat: wings up,
# halfway, spread wide, swept down
TIPS = {"up": ((16, 1), (17, 6)), "half": ((15, 3), (16, 22)), "level": ((14, 2), (15, 27)), "down": ((15, 9), (14, 27))}


def pose(tip, lift=0):
    g = blank(FW, FH)
    sx, sy = SHOULDER
    (fx, fy), (nx, ny) = TIPS[tip]
    # the far wing, up behind the body, its underside in shade
    wing(g, (sx + 1, sy - 1 + lift), (fx, fy + lift), 6, "g", "K", tip_share=0.22, tip_chord=4)
    put(g, BODY, BODY_AT[0], BODY_AT[1] + lift)
    # the near wing, nearer the eye, its white underside to us
    wing(g, (sx, sy + 1 + lift), (nx, ny + lift), 6, "w", "K", tip_share=0.22, lead="G", tip_chord=4)
    return outline(g)


def animations():
    return {
        # down from high to low (the body rising as the wings push), then back up
        "fly": ([pose("up"), pose("half"), pose("level", -1), pose("down", -1), pose("half")], 9, True),
        "glide": ([pose("level")], 1, False),
    }


def sheet():
    return write("gull", animations(), INK, FW, FH)


if __name__ == "__main__":
    sheet()
