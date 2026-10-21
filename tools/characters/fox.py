"""The red fox that trots along the far bank, nose to the ground.

A real red fox stands 14 to 16 inches at the shoulder and is about 26 inches
nose to rump, with a 14 inch tail: rusty orange, a paler band along the back
in the light, a white chin, throat and chest, black "stockings" on its legs,
black backs to its big pointed ears and a full brush of a tail with a white
tip. Small next to Olive (a fox weighs a third of what she does), so drawn
up 1.5 times like her. Drawn with the shared kit (tools/characters/kit.py).

Its main gait is the trot, the diagonal legs moving together (near front
with far hind), which is also what reads best at this size; standing, it
puts its nose down to sniff, ears flicking.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import blank, put, limb, outline, walk_legs, ink, write  # noqa: E402

INK = ink(
    O="#a36443",  # rusty coat
    L="#b77357",  # coat along the back, in the light
    S="#90453b",  # coat in shade, far legs
    W="#eae2dc",  # white chin, throat, chest, tail tip
    w="#b3a697",  # white in shade
    B="#33323d",  # stockings, ear backs
    N="#25131a",  # nose
    E="#25131a",  # eye
)

FW, FH = 36, 20
GROUND = 18  # the row its paws stand on

HEAD = [
    "...o..o.....",
    "...oBooBo...",
    "..oBOooBo...",
    "..oOOOOOOo..",
    ".oOEOOOOOo..",
    "oOOOOOOOOOo.",
    "NOOWWOOOOOOO",
    "owwWWWOOOOOO",
]
HEAD_AT = (0, 0)
# nose down to the ground, sniffing
HEAD_DOWN = [
    ".....o..o..",
    ".....oBooBo",
    "....oBOooBo",
    "....oOOOOOo",
    "...oOOOOOOo",
    "..oOEOOOOOo",
    ".oOOOOOOOo.",
    "oOOOOWWWo..",
    "NOOWWWo....",
    "ooooo......",
]
HEAD_DOWN_AT = (0, 5)
BODY = [
    "...........ooooooooo",
    "...........LLLLLLLLLo",
    "...oowWWWOOOOOOOOOOOOo",
    "......oWWWOOOOOOOOOOOo",
    ".......oWWWOOOOOOOOOOo",
    "........owWWwOOSSSSOOOo",
    ".........owwwwwSoooSOOo",
    "..........ooooooo..ooo",
]
BODY_AT = (0, 6)
TAIL = [
    "ooo.......",
    "OOOooo....",
    "OOOOOOooo.",
    "SSOOOOOWWo",
    "oSSSOOWWWo",
    ".oooSSWWo.",
    "....oooo..",
]
TAIL_AT = (20, 6)
NECK_DOWN = [(x, y) for y in range(8, 12) for x in range(5, 10)]  # fills the neck when the head is down

LEGS = [("front", (8, 12), 0.0), ("front", (10, 12), 0.5), ("hind", (19, 12), 0.5), ("hind", (17, 12), 0.0)]
STAND = [[(8, 12), (8, 18)], [(10, 12), (10, 18)], [(19, 12), (20, 15), (19, 18)], [(17, 12), (18, 15), (17, 18)]]
STEP = 2  # px per trot frame: the reach of a planted paw swept back over the stance


def pose(legs, head=0, ear=False, tail=0, dy=0):
    """head: 0 up, 1 lowered to sniff. tail: -1, 0, 1 swish."""
    g = blank(FW, FH)
    near_f, far_f, near_h, far_h = legs
    limb(g, far_f, "S", width=1, dy=dy, lower=("B", 3))
    limb(g, far_h, "S", width=1, dy=dy, lower=("B", 2))
    put(g, BODY, BODY_AT[0], BODY_AT[1] + dy)
    put(g, TAIL, TAIL_AT[0], TAIL_AT[1] + dy + tail)
    if head:
        for x, y in NECK_DOWN:
            g[y + dy][x] = "O"
        put(g, HEAD_DOWN, HEAD_DOWN_AT[0], HEAD_DOWN_AT[1] + dy)
    else:
        put(g, HEAD, HEAD_AT[0], HEAD_AT[1] + dy)
    if ear and not head:
        # the near ear flicks back
        g[HEAD_AT[1] + dy][3] = "."
        g[HEAD_AT[1] + dy + 1][3] = "o"
    limb(g, near_f, "O", width=1, dy=dy, lower=("B", 3))
    limb(g, near_h, "O", width=1, dy=dy, lower=("B", 2))
    return outline(g)


def animations():
    trot = [walk_legs(i / 8, LEGS, stance=0.5, lift=2, reach=2, ground=GROUND, knee=3) for i in range(8)]
    return {
        # the trot: diagonal pairs together, a lift of the body as each pair
        # passes under it
        "walk": ([pose(trot[i], dy=-1 if i % 4 == 2 else 0) for i in range(8)], 10, True, {"step": STEP}),
        # standing: looks about, noses the ground, an ear flick, tail swish
        "idle": ([pose(STAND), pose(STAND, ear=True), pose(STAND, head=1), pose(STAND, head=1, tail=1), pose(STAND, head=1), pose(STAND, tail=-1)], 5, True),
    }


def sheet():
    return write("fox", animations(), INK, FW, FH)


if __name__ == "__main__":
    sheet()
