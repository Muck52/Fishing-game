"""The snowshoe hare that stops to nibble clover by the water.

In summer a snowshoe hare is cinnamon brown above with a darker line down
its back, buff along the flanks, white underneath and under its short tail,
with long black-tipped ears and big hind feet (the "snowshoes"). It sits
about 11 inches tall and is 18 inches long; drawn up 1.6 times, like Olive,
so it reads. Drawn with the shared kit (tools/characters/kit.py).

A hare's body changes shape too much through a hop for a jointed rig, so
its poses are drawn whole: it pushes off with its hind feet, stretches out
in the air, lands on its front feet, and its hind feet swing past and land
ahead of them before it gathers again. It covers ground only in the air.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import blank, put, outline, ink, write  # noqa: E402

INK = ink(
    O="#a9805f",  # cinnamon-brown coat
    L="#704a30",  # the darker line down its back
    B="#daab76",  # buff flanks
    S="#704a30",  # shade, far legs
    W="#eae2dc",  # white belly, tail, feet
    w="#b3a697",  # white in shade
    K="#33323d",  # ear tips
    P="#8b7373",  # inside the ears
    E="#25131a",  # eye
    n="#985252",  # nose
)

FW, FH = 26, 18
GROUND = 16

# crouched, ears up
SIT = [
    "....oo.oo.........",
    "...oKKoKKo........",
    "...oKOooKOo.......",
    "...oPOo.oPOo......",
    "....oPOooPOo......",
    "....oPOooPOo......",
    ".....oOOOOOo......",
    "....oOEOOOOOooo...",
    "...onOOOOOOLLLLoo.",
    "...owWOOOOOOOOOOLo",
    "....owOOOOOOBBBOOOo",
    ".....oWOOOOBBBBBOWo",
    ".....oWWOOOOBBBOOWo",
    ".....oWoOOSSSSSOOo.",
    ".....oWoooSSSSSSo..",
    ".....oWWo.oWWWWWWo.",
    "......oo...oooooo..",
]
# head down, nibbling
NIBBLE = [
    "........oo.oo.....",
    ".......oKKooKKo...",
    ".......oKOooKOo...",
    "......oPOooPOo....",
    "......oPOooPOoooo.",
    ".....oOOOOOOLLLLoo",
    "....oOOOOOOOOOOOLo",
    "...oOEOOOOOOBBBOOo",
    "..oOOOOOOOOBBBBBOWo",
    ".onOOOOOOOOOBBBOOWo",
    ".owWWoOOOSSSSSSOOo.",
    "..oooooWWoSSSSSSo..",
    "......oWWo.oWWWWWWo",
    ".......oo...oooooo.",
]
# sitting up tall, alert
ALERT = [
    "...oo.oo..........",
    "..oKKoKKo.........",
    "..oKOooKOo........",
    "..oPOo.oPOo.......",
    "...oPOooPOo.......",
    "...oPOooPOo.......",
    "....oOOOOo........",
    "...oOEOOOOo.......",
    "..onOOOOOOOo......",
    "..owWOOOOOLLo.....",
    "...owWOOOOOOLo....",
    "....oWWOOOOOOOo...",
    "....oWWOBBBOOOOo..",
    "....oWWBBBBBOOOWo.",
    "....oWoOSSSSSOOWo.",
    "....oWooSSSSSSOo..",
    "....oWWo.oWWWWWWo.",
    ".....oo...oooooo..",
]
# pushing off / stretched out in the air: front feet reaching, hind feet trailing
STRETCH = [
    "........ooooooo..........",
    "......ooKKPPPPPoo........",
    ".....oOOooooooooo........",
    "....oOOEOOOoooooooooo....",
    "..onOOOOOOOLLLLLLLLLLoo..",
    "..owWOOOOOOOOOOBBBOOOOWo.",
    "...oowWWOOOOOOBBBBBOSSWo.",
    "..oWWooowWWWWWWSSSSSSoo..",
    ".oWWo....oooooooooSSSWWWo",
    ".ooo.............ooooWWWo",
    "......................oo.",
]
# landed on its front feet, hind feet swinging through
LAND = [
    "....oo.oo.........",
    "...oKKoKKo........",
    "...oKOooKOo.......",
    "...oPOo.oPOo......",
    "....oPOooPOoooo...",
    "....oOOOOOOLLLLoo.",
    "...oOEOOOOOOOOOOLo",
    "..onOOOOOOOBBBBOOOo",
    "..owWOOOOOBBBBBBOWo",
    "...oowWOOOSSSSSOWWo",
    "....oWWoSSSSSSSoo..",
    "....oWWooWWWWWWo...",
    "....oWWo.oooooo....",
    ".....oo............",
]
# gathered: hind feet planted ahead of where the front feet landed
GATHER = [
    "....oo.oo.........",
    "...oKKoKKo........",
    "...oKOooKOo.......",
    "...oPOo.oPOo......",
    "....oPOooPOo......",
    "....oPOooPOo......",
    ".....oOOOOOooooo..",
    "....oOEOOOOLLLLoo.",
    "...onOOOOOOOOOOOLo",
    "...owWOOOOOBBBBOOo",
    "....owWOOOBBBBBOWo",
    ".....oWOSSSSSSOOWo",
    ".....oWWWWWWWSSSo.",
    ".....oooooooooooo.",
]


def frame(rows, dx=0, dy=0, ear=False, nose=False):
    g = blank(FW, FH)
    # stand the drawing on the ground: its last row is the outline under its feet
    put(g, rows, 2 + dx, GROUND + 1 - len(rows) + 1 + dy)
    if ear:
        # the far ear turns: its tip drops back a pixel
        for y in range(FH):
            for x in range(FW):
                if g[y][x] == "K" and x > 9:
                    g[y][x] = "o" if y > 0 and g[y - 1][x] == "." else g[y][x]
    if nose:
        for y in range(FH):
            for x in range(FW):
                if g[y][x] == "n":
                    g[y][x] = "O"
    return outline(g)


def animations():
    return {
        # one hop: gather, push off, fly, land on the fronts, hinds swing past
        # and land ahead, gather; it moves on only while in the air
        "walk": ([frame(SIT), frame(STRETCH, dy=0), frame(STRETCH, dy=-3), frame(STRETCH, dy=-2), frame(LAND), frame(GATHER),
                  frame(SIT), frame(SIT), frame(SIT, nose=True), frame(SIT)], 12, True,
                 {"steps": [0, 4, 6, 5, 3, 1, 0, 0, 0, 0]}),
        "idle": ([frame(SIT), frame(SIT, nose=True), frame(NIBBLE), frame(NIBBLE, nose=True), frame(NIBBLE), frame(NIBBLE, nose=True),
                  frame(SIT), frame(ALERT), frame(ALERT, ear=True), frame(SIT)], 4, True),
    }


def sheet():
    return write("hare", animations(), INK, FW, FH, keep="ENn")


if __name__ == "__main__":
    sheet()
