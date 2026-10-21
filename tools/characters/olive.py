"""Olive: the angler's dog, and a character of her own.

Olive is a 40 lb husky / cattle dog mix: black coat, a narrow white blaze up
her face, white muzzle, chest, belly and legs, ears up, warm brown eyes, a
plumed tail curled over with a white tip, and a coral floral bandana. Her
notes are in docs/characters/olive.md.

She's rotoscoped: her outline and markings were traced by hand over a photo
of her lying on the carpet, the photo's own light and shade were sampled
into the game's palette (four shades of black coat, four of white fur), and
then her face, eyes, nose and bandana were finished by hand. Each animation
is a small change to that one drawing (a breath, a blink, a wag, an ear
flick), the way a real dog lying down moves, so she never stops looking
like herself.

Run on its own to write her sprite sheet and previews:
    python3 tools/characters/olive.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "art" / "characters" / "olive"
DOCS = ROOT / "docs" / "characters"

INK = {
    "o": "#25131a",  # the shared outline
    "d": "#2a1d27",  # deepest shadow in the coat
    "K": "#33323d",  # black coat
    "k": "#3c424e",  # black coat in light
    "s": "#545666",  # sheen along the back
    "g": "#8b7373",  # white fur in deep shade, toe lines
    "w": "#b3a697",  # white fur in shade
    "W": "#eae2dc",  # white fur
    "H": "#fff9f0",  # white fur in full light
    "r": "#8e3f45",  # bandana fold
    "R": "#c25f62",  # bandana
    "F": "#fff4d6",  # bandana flowers
    "P": "#985252",  # inside the ears
    "N": "#25131a",  # nose
    "n": "#8b7373",  # shine on the nose
    "E": "#a36443",  # eyes
    "e": "#fff4d6",  # catchlights
}

# Olive lying down, head up and turned to you, front legs out ahead, hind
# legs stretched behind, traced from her photo.
LIE = [
    "..........oo......................................",
    ".........oKko.....................................",
    ".........oKPko..ooo...............................",
    ".........oKPKKookPko..............................",
    ".........oKKKKWsKKKo..............................",
    "..........oeEKWKeEKo..............................",
    "..........oKKWWWKKKko.............................",
    "..........oWnWWWWKKso.............................",
    "..........oNNWWWWKkwdoo...........................",
    "..........oWgWWWWKKKkkkooooo......................",
    "........ooRRFRWWKKKKKKKkkkkkooooo.................",
    "......ooRFRRrrrKKKKKKKKKKKKkkkkKKooooo......o.....",
    ".....oRRFRrrooWKKKKKKKKKKKKKKKKKKKKkkkooo..oHo....",
    ".....orRrooooWWKKKKKKKKKKKKKKKKKdKKKKKKKsooHHHoo..",
    "......oro.oWWWWwKdKKKKKKKKKKKddddKKKkkkKkksdskkso.",
    ".......o..oWWWWWsdddKkkKKKKKddKddKKKkkKKKKKsdkKKo.",
    "......oooodWWWWWWsksWWWwwsKggwWKdKKKkKKKKKKKdkKKKo",
    "...oooHHHHHWWWWWWWWWWWWWWWgwWWWWwdKKkKKKKKKKdKKKKo",
    "..oHHWWWWWWHWWWWwWWWWWWWWWWWWWWWWdKKKKKKKKKKKddKKo",
    ".owWWwwwWHWWWWwwoooowwwWWWWWWWWWWKKKKKKKKdKKKdKoo.",
    "oHwWdoodHWWWWWoo....ooowwwwwwwwwwKKKKKdddddKkoo...",
    "owWWo..oWWWWdo.........ooooooooowdddddddddddo.....",
    ".ooo....oWwWo...................owwdddddddddo.....",
    "........oWWWWo..................oWWwwddddddKo.....",
    ".........oWwwo...................owWwwwwdddKso....",
    "..........ooo.....................owWWwwwgdddo....",
    "...................................owWWwwgdddKo...",
    "....................................owwWwgKsKdo...",
    ".....................................owgwWwgWHo...",
    "......................................owwwWHgHo...",
    ".......................................oWwWHgHHo..",
    ".......................................oWWwHgHHo..",
    "........................................oWWHgHWo..",
    "........................................oWWHgWWo..",
    ".........................................oWHgWwwo.",
    ".........................................oWHHwgo..",
    "..........................................oHWWo...",
    "..........................................oWgo....",
    "...........................................oo.....",
]
FW, FH = len(LIE[0]), len(LIE)
EYES = [(5, 11), (5, 12), (5, 16), (5, 17)]
TAIL_TIP = (10, 14, 40, 50)  # rows and columns of the white tip of her tail


def grid():
    return [list(r) for r in LIE]


def breathe(g, up):
    """Her ribs rise: the top line of her back, from shoulder to hip, lifts a
    pixel, the coat filling in under it."""
    if not up:
        return g
    for x in range(20, 39):
        y = next(y for y in range(FH) if g[y][x] != ".")
        g[y - 1][x] = "o"
        g[y][x] = g[y + 1][x] if g[y + 1][x] not in "o." else "K"
    return g


def wag(g, dx):
    """The white tip of her tail swings a pixel either way."""
    if not dx:
        return g
    y0, y1, x0, x1 = TAIL_TIP
    old = [row[:] for row in g]
    for y in range(y0, y1):
        for x in range(x0, x1):
            if old[y][x] in "WHw" or (old[y][x] == "o" and y < 13):
                g[y][x] = "."
    for y in range(y0, y1):
        for x in range(x0, x1):
            ch = old[y][x]
            if ch in "WHw" or (ch == "o" and y < 13):
                g[y][x + dx] = ch
    # close the outline where the tip left the curl
    for y in range(y0, y1 + 1):
        for x in range(x0, x1):
            if g[y][x] == "." and any(0 <= x + b < FW and g[y + a][x + b] not in ".o" for a, b in ((0, 1), (0, -1), (1, 0), (-1, 0))):
                g[y][x] = "o"
    return g


def blink(g, shut):
    if shut:
        for y, x in EYES:
            g[y][x] = "K"
    return g


def ear(g, flick):
    """Her right ear twitches back at a sound: the tip drops a pixel."""
    if flick:
        g[2][16:19] = list("...")
        g[3][15:20] = list("oooko")
        g[4][16:19] = list("kPK")
    return g


def frame(g):
    img = Image.new("RGBA", (FW, FH))
    for y, row in enumerate(g):
        for x, ch in enumerate(row):
            if ch != ".":
                img.putpixel((x, y), tuple(int(INK[ch][i:i + 2], 16) for i in (1, 3, 5)) + (255,))
    return img


def pose(up=0, dx=0, shut=False, flick=False):
    return frame(ear(blink(wag(breathe(grid(), up), dx), shut), flick))


def animations():
    return {
        # a slow breath, the tail stirring a beat behind it
        "lie": ([pose(0), pose(1), pose(1, 1), pose(0, 1)], 2, True),
        "blink": ([pose(), pose(shut=True), pose()], 8, False),
        "wag": ([pose(dx=1), pose(), pose(dx=-1), pose()], 8, True),
        "ear": ([pose(flick=True), pose(flick=True), pose()], 6, False),
    }


def sheet():
    """Every frame in one strip, and where each animation's frames are."""
    anims = animations()
    frames, index, i = [], {}, 0
    for name, (fs, fps, loop) in anims.items():
        index[name] = {"frames": list(range(i, i + len(fs))), "fps": fps, "loop": loop}
        frames += fs
        i += len(fs)
    strip = Image.new("RGBA", (FW * len(frames), FH))
    for k, f in enumerate(frames):
        strip.alpha_composite(f, (k * FW, 0))
    return strip, index


def preview(path):
    """Every animation laid out row by row, enlarged, with an animated GIF of
    each beside the docs."""
    anims = animations()
    S = 6
    most = max(len(fs) for fs, _, _ in anims.values())
    img = Image.new("RGBA", (most * FW * S + 40, len(anims) * FH * S + 20), (240, 236, 208, 255))
    for r, (name, (fs, _, _)) in enumerate(anims.items()):
        for k, f in enumerate(fs):
            img.alpha_composite(f.resize((FW * S, FH * S), Image.NEAREST), (20 + k * FW * S, 10 + r * FH * S))
    img.save(path)
    for old in DOCS.glob("olive-*.gif"):
        old.unlink()
    for name, (fs, fps, _) in anims.items():
        big = [Image.alpha_composite(Image.new("RGBA", (FW, FH), (240, 236, 208, 255)), f).resize((FW * S, FH * S), Image.NEAREST).convert("P", palette=Image.ADAPTIVE) for f in fs]
        big[0].save(DOCS / f"olive-{name}.gif", save_all=True, append_images=big[1:], duration=int(1000 / fps), loop=0)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    DOCS.mkdir(parents=True, exist_ok=True)
    strip, index = sheet()
    strip.save(OUT / "olive.png")
    import json
    (OUT / "olive.json").write_text(json.dumps({"frameWidth": FW, "frameHeight": FH, "animations": index}, indent=1) + "\n")
    preview(DOCS / "olive-sheet.png")
    print("frames", strip.width // FW, {k: len(v["frames"]) for k, v in index.items()})
