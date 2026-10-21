"""The white-tailed doe that steps down to the water to drink.

A white-tailed doe stands about 36 inches at the shoulder: tawny brown in
summer, a little lighter along the back in the sun, with a white throat
patch, a white band behind the black nose, a white ring round the eye,
white belly and the white underside of the tail edging it; big ears, a long
neck, and long slender legs with small dark hooves. Near life size against
the angler. Drawn with the shared kit (tools/characters/kit.py).

She walks the four-beat walk, three hooves down at once; standing, she
lowers her neck all the way to the water to drink, flicking an ear and
her tail.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import blank, put, limb, outline, walk_legs, ink, write  # noqa: E402

INK = ink(
    O="#a9805f",  # tawny coat
    L="#daab76",  # coat along the back, in the sun
    S="#704a30",  # coat in shade, far legs
    W="#eae2dc",  # white throat, muzzle band, eye ring, belly, tail edge
    P="#8b7373",  # inside the ears
    N="#25131a",  # nose
    E="#25131a",  # eye
    H="#33323d",  # hooves
)

FW, FH = 40, 32
GROUND = 30

# head up, on her neck
HEAD = [
    "......oo.oo.....",
    ".....oPOooPOo...",
    ".....oPOoOPOo...",
    "......oOOOOo....",
    ".....oOOOOOOo...",
    "...ooOWEOOOOo...",
    ".ooOOOOOOOOOOo..",
    "oNOOOOOOOOOOOo..",
    "oWWOOOOOOOOOOo..",
    ".ooWWWOOOOOOOOo.",
    "....ooWWOOOOOOOo",
    ".....oWWWOOOOOOOo",
    "......oWWWOOOOOOOo",
    ".......oWWOOOOOOOo",
]
# neck down to the water, drinking
DRINK = [
    "...........oOOOOOo",
    "..........oOOOOOo.",
    ".........oOOOOOo..",
    "........oOOOOOo...",
    "...oo..oOOOOOo....",
    "..oPOooOOOOOo.....",
    "..oPOOOOOOOo......",
    "..oOOOOOOOo.......",
    "..oOEWOOOOo.......",
    "..oOOOOOOo........",
    "..oOOOOOOo........",
    "...oOOOOo.........",
    "...oOOOWo.........",
    "...oNWWo..........",
    "....ooo...........",
]
BODY = [
    "......oWWOOOOOoooooooooooooooooo",
    ".......oWOOOOOLLLLLLLLLLLLLLLLLLo",
    ".......oWOOOOOOOOOOOOOOOOOOOOOOOOo",
    "........oOOOOOOOOOOOOOOOOOOOOOOOOo",
    "........oOOOOOOOOOOOOOOOOOOOOOOOOo",
    "........oOOOOOOOOOOOOOOOOOOOOOOOSo",
    ".........oOOOOOOSSSSSSSSSSSOOOOOSo",
    "..........oSSWWWWWWWWWWWWSSOOOOSo",
    "...........oooooooooooooooSSSSSo",
    "..........................ooooo",
]
BODY_AT = (3, 12)
TAIL = ["o..", "Oo.", "OWo", "OWo", "SWo", "oo."]  # hanging, brown above with its white edge
TAIL_AT = (35, 12)
LEGS = [("front", (13, 19), 0.25), ("front", (16, 19), 0.75), ("hind", (31, 19), 0.0), ("hind", (28, 19), 0.5)]
STAND = [[(13, 19), (13, 30)], [(16, 19), (16, 30)], [(31, 19), (33, 24), (32, 30)], [(28, 19), (30, 24), (29, 30)]]
STEP = 1  # px per walk frame


def pose(legs, drink=False, ear=False, tail=0, dy=0):
    g = blank(FW, FH)
    near_f, far_f, near_h, far_h = legs
    limb(g, far_f, "S", width=1, dy=dy, lower=("H", 1))
    limb(g, far_h, "S", width=1, dy=dy, lower=("H", 1))
    put(g, BODY, BODY_AT[0], BODY_AT[1] + dy)
    put(g, TAIL, TAIL_AT[0] + max(0, tail), TAIL_AT[1] + dy - (1 if tail else 0))
    if drink:
        put(g, DRINK, 1, 12 + dy)
    else:
        put(g, HEAD, 0, dy)
        if ear:
            # her near ear swivels back
            g[dy][6] = "."
            g[1 + dy][5] = "."
    limb(g, near_f, "O", width=1, dy=dy, lower=("H", 1))
    limb(g, near_h, "O", width=1, dy=dy, lower=("H", 1))
    return outline(g)


def animations():
    walk = [walk_legs(i / 8, LEGS, stance=0.65, lift=2, reach=3, ground=GROUND, knee=6) for i in range(8)]
    st = STAND
    return {
        "walk": ([pose(walk[i], dy=1 if i % 4 == 2 else 0) for i in range(8)], 8, True, {"step": STEP}),
        # stands, looks about, an ear flick, then drinks, tail flicking
        "idle": ([pose(st), pose(st, ear=True), pose(st), pose(st, drink=True), pose(st, drink=True, tail=1), pose(st, drink=True),
                  pose(st, drink=True), pose(st, drink=True, tail=1), pose(st, drink=True), pose(st)], 4, True),
    }


def sheet():
    return write("deer", animations(), INK, FW, FH)


if __name__ == "__main__":
    sheet()
