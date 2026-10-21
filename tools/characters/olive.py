"""Olive: the angler's dog, and a character of her own.

Modelled on a real dog, a 40 lb husky / cattle dog mix: black coat with a
sheen along her back, a narrow white blaze down to a white muzzle, white
throat, chest, belly and legs, black thighs, upright ears, warm brown eyes,
a plumed tail curled over her back with a white tip, and a coral bandana
with cream flowers. Her notes are in docs/characters/olive.md.

She's drawn side-on, facing left, at a size that sits beside the angler.
Her proportions follow a real canid: her build and her walk were worked out
over the CC0 fox in assets/source/scratchio-wild-animals (the same body plan,
made stockier for a 40 lb dog), and her gallop follows Muybridge's
photographs of a running dog (Animal Locomotion, 1887, public domain).

Her body and head are one pixel drawing; her legs are drawn per frame from
joint positions (shoulder, wrist, paw in front; hip, hock, paw behind), so
every animation can pose them freely; tilted frames (the leap) are turned on
the pixel grid. Everything is in the game's palette with its shared outline.

Run on its own to write her sprite sheet and previews:
    python3 tools/characters/olive.py
"""
import json
import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "art" / "characters" / "olive"
DOCS = ROOT / "docs" / "characters"

INK = {
    "o": "#25131a",  # the shared outline
    "d": "#2a1d27",  # coat in deep shadow, far legs' thighs
    "K": "#33323d",  # black coat
    "k": "#3c424e",  # black coat in light
    "s": "#545666",  # sheen along her back
    "g": "#8b7373",
    "w": "#b3a697",  # white fur in shade (the far legs)
    "W": "#eae2dc",  # white fur
    "H": "#fff9f0",  # the tip of her tail
    "r": "#8e3f45",  # bandana fold
    "R": "#c25f62",  # bandana
    "F": "#fff4d6",  # bandana flower
    "P": "#985252",  # inside her ear
    "N": "#25131a",  # nose
    "E": "#a36443",  # eye
    "b": "#b2d0d0",  # water drops
    "B": "#f5f2db",  # water drops catching the light
}
WATER = (46, 93, 120)  # what shows through the water over her when she swims

FW, FH = 40, 30  # one frame
PAD = 4  # room above her for the tilt of a leap
FEET = 23 + PAD  # the row her paws stand on

# Her body and head, facing left, without legs or tail.
BODY = [
    ".......o..o",
    "......oPooKo",
    "......oPKoKKo",
    "......oKKKKKo",
    ".....oWKKKKKKo",
    "...ooWEKKKKKKKo",
    ".oNWWWKKKKKKKKKo",
    ".oWWWWWKKKKKKKKKo",
    "..oowWWWKKKKKKKKKo",
    ".....oWWWKKKKKKKKKoooooooooo",
    ".....oWWRRKKKKKssssssssssssKo",
    "......oRFRRkkkkkkkkkkkkkkkkKo",
    "......oWRrkkkkkkkkkkkkkkkkkKKo",
    "......oWWkkkkkkkkkkkkkkkkkkKKo",
    ".......oWWkkkkkkkkkkkkkkkkkKKo",
    ".......oWWWwkkkkkkkkkkkkkkKKKo",
    "........oWWWwwwwwwoookKKKKKKo",
    ".........ooooooooo..oKKKKKo",
]
EYE = (6, 5)
# Her tail, curled up over her rump, the white tip resting toward her back.
TAIL = [
    "...oooo...",
    "..oKkkKo..",
    ".oKKooKKo.",
    "oHWo..oKo.",
    "oWWo..oKKo",
    ".oo...oKKo",
    "......oKKo",
    ".....oKKo.",
]
TAIL_AT = (21, 2)
# Swimming, her tail floats out behind her on the water.
SWIM_TAIL = [".ooo.", "oKKWo", ".ooo."]

# Legs, as joint positions in the body's frame: near front, far front, near
# hind, far hind. Fronts hang from the shoulder at row 15, hinds from the hip
# at row 16; paws stand on row 23.
STAND = ([(10, 15), (10, 23)], [(13, 15), (13, 23)], [(24, 16), (25, 20), (24, 23)], [(21, 16), (22, 20), (21, 23)])
CROUCH = ([(10, 15), (8, 19), (9, 21)], [(13, 15), (11, 19), (12, 21)], [(24, 16), (20, 19), (22, 21)], [(21, 16), (17, 19), (19, 21)])
# The rotary gallop, as Muybridge photographed it: gathered under her, hind
# feet land, push off, stretched out flying, front feet land, front push.
# Each with how far her body rises or drops.
GALLOP = [
    (0, ([(10, 15), (9, 19), (13, 21)], [(13, 15), (12, 19), (16, 21)], [(24, 16), (20, 19), (17, 21)], [(21, 16), (18, 20), (15, 22)])),
    (1, ([(10, 15), (8, 18), (10, 21)], [(13, 15), (11, 19), (13, 21)], [(24, 16), (22, 19), (20, 22)], [(21, 16), (20, 19), (19, 22)])),
    (0, ([(10, 15), (6, 18), (3, 20)], [(13, 15), (9, 18), (7, 21)], [(24, 16), (26, 19), (28, 23)], [(21, 16), (23, 20), (25, 23)])),
    (-2, ([(10, 15), (5, 17), (1, 19)], [(13, 15), (8, 17), (4, 20)], [(24, 16), (28, 18), (32, 19)], [(21, 16), (25, 18), (29, 20)])),
    (0, ([(10, 15), (8, 19), (7, 23)], [(13, 15), (10, 18), (7, 21)], [(24, 16), (27, 19), (30, 21)], [(21, 16), (24, 19), (26, 21)])),
    (1, ([(10, 15), (11, 19), (13, 22)], [(13, 15), (14, 19), (16, 22)], [(24, 16), (24, 19), (22, 21)], [(21, 16), (20, 19), (18, 20)])),
]


def blank():
    return [["."] * FW for _ in range(FH)]


def put(g, rows, x0, y0):
    for j, r in enumerate(rows):
        for i, ch in enumerate(r):
            y, x = y0 + j, x0 + i
            if ch != "." and 0 <= y < FH and 0 <= x < FW:
                g[y][x] = ch


def line(a, b):
    (x0, y0), (x1, y1) = a, b
    n = max(abs(x1 - x0), abs(y1 - y0), 1)
    return [(round(x0 + (x1 - x0) * t / n), round(y0 + (y1 - y0) * t / n)) for t in range(n + 1)]


def leg(g, pts, near, hind, dy=0):
    """A leg two pixels thick through its joints. The far legs are in shade;
    the tops of the hind legs are her black thighs."""
    pts = [(x, y + dy) for x, y in pts]
    for a, b in zip(pts, pts[1:]):
        for x, y in line(a, b):
            for xx in (x, x + 1):
                if 0 <= y < FH and 0 <= xx < FW:
                    thigh = hind and y <= pts[0][1] + 2
                    g[y][xx] = ("K" if near else "d") if thigh else ("W" if near else "w")
    x, y = pts[-1]
    if 0 <= y < FH and x >= 1:
        g[y][x - 1] = "W" if near else "w"  # toes, forward


def outline(g):
    for y in range(FH):
        for x in range(FW):
            if g[y][x] == "." and any(0 <= y + a < FH and 0 <= x + b < FW and g[y + a][x + b] not in ".o" for a, b in ((0, 1), (0, -1), (1, 0), (-1, 0))):
                g[y][x] = "o"
    return g


def pose(legs, dy=0, wag=0, blink=False):
    g = blank()
    dy += PAD
    near_f, far_f, near_h, far_h = legs
    leg(g, far_f, False, False, dy)
    leg(g, far_h, False, True, dy)
    put(g, BODY, 0, dy)
    put(g, TAIL, TAIL_AT[0] + wag, TAIL_AT[1] + dy)
    leg(g, near_f, True, False, dy)
    leg(g, near_h, True, True, dy)
    if blink:
        g[EYE[1] + dy][EYE[0]] = "K"
    return outline(g)


def gait(t, stance=0.65, lift=2, reach=3):
    """Leg joints at phase t of a four-beat walk: near hind, near front, far
    hind, far front, a quarter of a cycle apart, so three paws are down at
    any moment. Each paw is planted for most of the cycle and swept back
    under her, then lifted and swung forward with the wrist or hock bent."""
    def front(sx, p):
        if p < stance:
            px = round(sx - reach + 2 * reach * p / stance)
            return [(sx, 15), (sx + (px - sx) // 2, 19), (px, 23)]
        k = (p - stance) / (1 - stance)
        px = round(sx + reach - 2 * reach * k)
        return [(sx, 15), (sx - 1 + (px - sx) // 2, 19), (px + 1, 23 - round(lift * math.sin(math.pi * k)))]

    def hind(hx, p):
        if p < stance:
            px = round(hx - reach + 1 + 2 * reach * p / stance)
            return [(hx, 16), (px + 2, 20), (px, 23)]
        k = (p - stance) / (1 - stance)
        px = round(hx + reach + 1 - 2 * reach * k)
        return [(hx, 16), (px + 2, 19), (px, 23 - round(lift * math.sin(math.pi * k)))]

    return (front(10, (t + 0.25) % 1), front(13, (t + 0.75) % 1), hind(24, t % 1), hind(21, (t + 0.5) % 1))


def rotate(g, deg, cx=20, cy=17):
    """Turns a frame on the pixel grid (positive lifts her nose), sampling
    each pixel four times so the outline holds together."""
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    out = blank()
    for y in range(FH):
        for x in range(FW):
            votes = {}
            for sy in (0.25, 0.75):
                for sx in (0.25, 0.75):
                    X, Y = x + sx - cx, y + sy - cy
                    u, v = math.floor(c * X + s * Y + cx), math.floor(-s * X + c * Y + cy)
                    ch = g[v][u] if 0 <= v < FH and 0 <= u < FW else "."
                    votes[ch] = votes.get(ch, 0) + 1
            if votes.get(".", 0) >= 3:
                continue
            fill = {k: n for k, n in votes.items() if k not in ".o"}
            out[y][x] = max(fill, key=fill.get) if sum(fill.values()) >= 2 else "o"
    return outline(out)


SWIM_DY = 3 + PAD
WATERLINE = 11 + SWIM_DY  # rows from here down are under the water


def swim(k):
    """Dog-paddling: head and back above the water, legs churning below,
    each front paw reaching forward and pulling back in turn."""
    g = blank()
    fronts = [[(10, 15), (6, 18), (5, 21)], [(10, 15), (9, 19), (12, 21)], [(10, 15), (11, 19), (13, 20)], [(10, 15), (8, 19), (7, 21)]]
    hinds = [[(24, 16), (27, 19), (30, 20)], [(24, 16), (26, 19), (27, 21)], [(24, 16), (24, 19), (23, 21)], [(24, 16), (26, 20), (28, 21)]]
    leg(g, fronts[(k + 2) % 4], False, False, SWIM_DY)
    leg(g, [(21, 16), (23, 19), hinds[(k + 2) % 4][-1]], False, True, SWIM_DY)
    put(g, BODY, 0, SWIM_DY)
    put(g, SWIM_TAIL, 27, 8 + SWIM_DY)
    leg(g, fronts[k], True, False, SWIM_DY)
    leg(g, hinds[k], True, True, SWIM_DY)
    return outline(g)


def shake(k):
    """Shaking off: her body twists side to side over planted legs, tail
    flung the other way, water flying off her."""
    dx = (-1, 1, -1, 1)[k]
    g = blank()
    leg(g, STAND[1], False, False, PAD)
    leg(g, STAND[3], False, True, PAD)
    body = blank()
    put(body, BODY, dx, PAD)
    put(body, TAIL, TAIL_AT[0] - dx, TAIL_AT[1] + PAD)
    for y in range(FH):
        for x in range(FW):
            if body[y][x] != ".":
                g[y][x] = body[y][x]
    leg(g, STAND[0], True, False, PAD)
    leg(g, STAND[2], True, True, PAD)
    g = outline(g)
    drops = [
        [(3, 5), (30, 3), (35, 12), (1, 15), (18, 4)],
        [(5, 3), (33, 5), (37, 15), (2, 12), (20, 2)],
        [(2, 6), (31, 2), (36, 10), (4, 16), (16, 3)],
        [(6, 4), (32, 4), (38, 13), (0, 14), (22, 3)],
    ][k]
    for x, y in drops:
        if g[y][x] == ".":
            g[y][x] = "B"
        if g[y + 1][x] == ".":
            g[y + 1][x] = "b"
    return g


def animations():
    """name -> (frames as pixel grids, fps, loops, waterline or None)."""
    st = STAND
    return {
        # standing, tail wagging, now and then a blink
        "idle": ([pose(st), pose(st, wag=1), pose(st), pose(st, wag=-1), pose(st, blink=True), pose(st)], 4, True, None),
        "walk": ([pose(gait(i / 8), dy=1 if i % 4 == 2 else 0) for i in range(8)], 10, True, None),
        "run": ([pose(legs, dy=d) for d, legs in GALLOP], 14, True, None),
        # crouch, spring with her nose up, stretched out in the air, nose down to dive
        "leap": ([pose(CROUCH, dy=2), rotate(pose(GALLOP[2][1]), 12), pose(GALLOP[3][1], dy=-2), rotate(pose(GALLOP[3][1]), -35)], 8, False, None),
        "swim": ([swim(k) for k in range(4)], 6, True, WATERLINE),
        "shake": ([shake(k) for k in range(4)] * 2, 14, False, None),
    }


def image(g, water=None):
    img = Image.new("RGBA", (FW, FH))
    px = img.load()
    for y, row in enumerate(g):
        for x, ch in enumerate(row):
            if ch == ".":
                continue
            r, gg, b = (int(INK[ch][i:i + 2], 16) for i in (1, 3, 5))
            if water is not None and y >= water:
                # under the water: seen through it, dimmer and bluer
                px[x, y] = (round(r * 0.35 + WATER[0] * 0.65), round(gg * 0.35 + WATER[1] * 0.65), round(b * 0.35 + WATER[2] * 0.65), 150)
            else:
                px[x, y] = (r, gg, b, 255)
    return img


def sheet():
    """Every frame in one strip, and where each animation's frames are."""
    frames, index = [], {}
    for name, (fs, fps, loop, water) in animations().items():
        index[name] = {"frames": list(range(len(frames), len(frames) + len(fs))), "fps": fps, "loop": loop}
        frames += [image(f, water) for f in fs]
    strip = Image.new("RGBA", (FW * len(frames), FH))
    for k, f in enumerate(frames):
        strip.alpha_composite(f, (k * FW, 0))
    return strip, index


def preview():
    """Every animation laid out row by row, enlarged, and an animated GIF of
    each beside her notes."""
    S = 6
    bg = (178, 208, 208, 255)
    anims = animations()
    most = max(len(v[0]) for v in anims.values())
    img = Image.new("RGBA", (most * FW * S, len(anims) * FH * S), bg)
    for old in DOCS.glob("olive-*.gif"):
        old.unlink()
    for r, (name, (fs, fps, _, water)) in enumerate(anims.items()):
        frames = [image(f, water) for f in fs]
        for k, f in enumerate(frames):
            img.alpha_composite(f.resize((FW * S, FH * S), Image.NEAREST), (k * FW * S, r * FH * S))
        big = [Image.alpha_composite(Image.new("RGBA", (FW, FH), bg), f).resize((FW * S, FH * S), Image.NEAREST).convert("P", palette=Image.ADAPTIVE) for f in frames]
        big[0].save(DOCS / f"olive-{name}.gif", save_all=True, append_images=big[1:], duration=int(1000 / fps), loop=0)
    img.save(DOCS / "olive-sheet.png")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    DOCS.mkdir(parents=True, exist_ok=True)
    strip, index = sheet()
    strip.save(OUT / "olive.png")
    (OUT / "olive.json").write_text(json.dumps({"frameWidth": FW, "frameHeight": FH, "animations": index}, indent=1) + "\n")
    preview()
    print("frames", strip.width // FW)
