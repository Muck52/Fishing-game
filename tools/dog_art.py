"""The angler's dog, drawn from photos of a black-and-white border collie mix:
black coat, a narrow white blaze up her face, white muzzle and chest, white
front legs and hind feet, one ear up and one tipped over, a plumed tail
with a white tip carried in a curl, and a coral floral bandana.

Drawn straight onto the grid in palette colours, at the angler's scale (he
is about 34 pixels tall, she stands about 13 at the shoulder), facing left
like every creature sheet. The shared outline, the light along her back and
the shade under her white fur are added after.

Run on its own to write a preview: python3 tools/dog_art.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

INK = {
    "K": "#33323d",  # black coat
    "W": "#eae2dc",  # white fur
    "N": "#3f2939",  # nose: glossy black, apart from the outline
    "n": "#8b7373",  # the shine on it
    "E": "#704a30",  # eye, warm brown
    "e": "#faffff",  # glint in the eye
    "R": "#d88571",  # bandana
    "r": "#c25f62",  # its shaded folds
    "F": "#fff4d6",  # the little flowers on it
    "P": "#985252",  # inside the ear
    "T": "#c25f62",  # tongue
    "w": "#b3a697",  # white fur on the far side, in shade
    "D": "#25131a",  # a fold in the coat: the line of the hind thigh
}
SHEEN = "#3c424e"  # light along the top of the black coat
SHADE = "#b3a697"  # shade under the white fur
OUTLINE = (37, 19, 26)

HEAD = [
    "........K....",
    ".......KPK.K.",
    "......KKWKKKK",
    ".....KKWKeKKK",
    ".nWWWWWKKEKKK",
    "NNWWWWKKKKKKK",
    ".NWWWWKKKKKK.",
    "..WWWWKKKKK..",
]

# Standing, side on, facing left, at the angler's scale (her head about 60%
# of his height: pixel games draw pets a little large so they read). About
# as tall at the shoulder as she is long, as border collies are. A domed
# skull rising from the stop, a longish muzzle ending in a rounded nose,
# the blaze running up its bridge, the near ear up (pink inside) and the far
# one tipped, a bright eye; then a neck, narrower than the head and set off
# from it behind the jaw, down to the shoulders; a deep chest, hocks on the
# hind legs, the far legs in shade.
STAND = [r.ljust(26, ".") for r in HEAD] + [
    "...WWWWKKKK...............",
    "....WWWKKK................",
    "....WWWRKKKKKKKKKKKKKKK...",
    "....WRRFRKKKKKKKKKKKKKKK..",
    "....WWRRKKKKKKKKKKKKKKKK..",
    ".....WWWKKKKKKKKKKKKKKKK..",
    ".....WWWWKKKKKKKKKKKKKKK..",
    "......WWWWWKK...KKKKKKK...",
    ".......WW.ww....KKK.KKK...",
    ".......WW.ww....KKW..KW...",
    ".......WW.ww.....WW..WW...",
    "......WWW.www....ww.WWW...",
]
# the tail carried up in a curl, white at the tip: four frames of a slow
# wag, drawn over the rump at (19, 2)
TAILS = [
    ["..W", ".KW", ".KK", "KK.", "KK."],
    ["...", ".WW", "KKW", "KK.", "KK."],
    [".W.", "KW.", "KK.", "KK.", "KK."],
    ["...", ".WW", "KKW", "KK.", "KK."],
]

# Lying down as on the carpet: head up and turned to you, the back dipping
# behind the shoulders and rising over the hip, the line of the hind thigh,
# front legs stretched out ahead, hind leg along the floor, tail curled up.
LIE = [r.ljust(33, ".") for r in HEAD] + [
    "...WWWWKKKK.........KKK...KW.....",
    "....WWWKKK.........KKKKK..KW.....",
    "....WWRKKKK.....KKKKKKKKK.KKW....",
    "....WRFRKKKKKKKKKKKKKKKKKKK......",
    "....WRRKKKKKKKKKKKKKKDKKKKK......",
    ".....WWKKKKKKKKKKKKKDKKKKKKK.....",
    "..WWWWWWWWWWKKKKKKDKKKKKKWWWW....",
    "WWWWWWWWWWWW..WWWWWWWWWWWWWWWW...",
    "wwwwwwwwwww...............wwwww..",
]


def paint(rows, tail=None, tail_at=(21, 2)):
    h = len(rows)
    w = max(len(r) for r in rows)
    grid = [list(r.ljust(w, ".")) for r in rows]
    if tail:
        tx, ty = tail_at
        for j, line in enumerate(tail):
            for i, ch in enumerate(line):
                if ch != "." and 0 <= ty + j < h and 0 <= tx + i < w:
                    grid[ty + j][tx + i] = ch
    pad = 1
    a = np.zeros((h + pad * 2, w + pad * 2, 4), np.uint8)
    for y, row in enumerate(grid):
        for x, ch in enumerate(row):
            if ch == ".":
                continue
            c = INK[ch]
            # light along the top of the black coat, shade under the white
            above = grid[y - 1][x] if y > 0 else "."
            below = grid[y + 1][x] if y + 1 < h else "."
            if ch == "K" and above == ".":
                c = SHEEN
            elif ch == "W" and below == "." and y + 1 < h:
                c = SHADE
            a[y + pad, x + pad] = [int(c[i:i + 2], 16) for i in (1, 3, 5)] + [255]
    solid = a[..., 3] > 0
    p = np.pad(solid, 1)
    ring = ~solid & (p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:])
    a[ring] = OUTLINE + (255,)
    return Image.fromarray(a)


def frames():
    stand = [paint(STAND, t, (20, 5)) for t in TAILS]
    lie = [paint(LIE)]
    return stand, lie


if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "docs" / "dog-preview.png"
    stand, lie = frames()
    S = 8
    sheet = Image.new("RGBA", (10 + sum(f.width + 4 for f in stand) * S + lie[0].width * S + 40, 40 + max(f.height for f in stand + lie) * S), (240, 236, 208, 255))
    x = 10
    for f in stand + lie:
        sheet.alpha_composite(f.resize((f.width * S, f.height * S), Image.NEAREST), (x, 20))
        x += f.width * S + 32
    sheet.save(out)
    print(out, [f.size for f in stand + lie])
