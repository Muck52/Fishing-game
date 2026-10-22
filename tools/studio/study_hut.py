"""Study 12: the hut.

The fishing hut was the pack's (craftpix): flat, pinkish-red wood, one
tone per board, its own outline. Redrawn here from materials, like the far
bank, lit from the upper left, at the same size and layout so everything
that stands on it still fits: the walkway at row 62 (the angler and the
barrel stand on it), stilts the game carries on down into the lake, and
the panes that light up after dark (hut-lights). Only its left 144
pixels are on screen.

Every version has a stovepipe, a window and a half-glazed door, a hanging
lantern, a life ring, a coil of rope on a hook, a net drying on the
railing, cross-braced pilings, and a new barrel. Three materials:

- **A, weathered cedar shack:** silver-grey board-and-batten, a rusty
  corrugated tin roof, weathered trim, a grey-blue door.
- **B, red Northwoods boathouse:** barn-red clapboard, white trim, a green
  shingle roof, a green door, a flower box under the window.
- **C, log cabin:** round logs with light chinking between them, a cedar
  shake roof, natural wood trim and door.

    python3 tools/studio/study_hut.py   -> docs/studio/studies/12-hut/
"""
import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "studio" / "studies" / "12-hut"
W, H = 192, 122
DECK = 62
STILTS = [4, 31, 65, 94, 128, 160]
OUTLINE = (37, 19, 26)


def hexc(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def mix(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def noise(x, y, s=0):
    n = (x * 374761393 + y * 668265263 + s * 2147483647) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    return (n ^ (n >> 16)) / 4294967296


LOOKS = {
    "A": {"wall": "boards", "roof": "tin", "w": ["#6e6a62", "#8a857a", "#a8a294", "#c2bcae"], "r": ["#5a4e48", "#7a6e66", "#948a80", "#8a5a3a"],
          "trim": ["#8e897e", "#c8c2b4"], "door": ["#4a5866", "#5e6e7c"], "deck": ["#5a4c3e", "#7a6a56", "#968672"], "post": ["#3e342c", "#5a4c3e", "#74644f"]},
    "B": {"wall": "clapboard", "roof": "shingles", "w": ["#6a2622", "#8a302a", "#a03a32", "#b84a3e"], "r": ["#2a3a32", "#3a4e42", "#4c6454", "#5e7864"],
          "trim": ["#b8b0a2", "#ece6da"], "door": ["#2c4434", "#3c5a44"], "deck": ["#5a3e2a", "#7a563a", "#94704c"], "post": ["#3a2a20", "#54402e", "#6e5640"],
          "flowers": True},
    "C": {"wall": "logs", "roof": "shakes", "w": ["#5a3a24", "#7a5234", "#946a44", "#c8b48c"], "r": ["#4a3222", "#634430", "#7c5a3e", "#946e4a"],
          "trim": ["#7a5234", "#a87a4e"], "door": ["#5a3a24", "#74503a"], "deck": ["#5a3e2a", "#7a563a", "#94704c"], "post": ["#3a2a20", "#54402e", "#6e5640"]},
}


class Pic:
    def __init__(self):
        self.img = Image.new("RGBA", (W, H))
        self.px = self.img.load()
        self.lit = Image.new("RGBA", (W, H))
        self.lp = self.lit.load()

    def put(self, x, y, c, a=255):
        if 0 <= x < W and 0 <= y < H:
            self.px[x, y] = (*c, a)

    def get(self, x, y):
        return self.px[x, y] if 0 <= x < W and 0 <= y < H else (0, 0, 0, 0)

    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.put(x, y, c)

    def glow(self, x, y, warm):
        if 0 <= x < W and 0 <= y < H:
            self.lp[x, y] = (*warm, 255)


def post(p, x0, x1, y0, y1, cols):
    """A squared timber: lit on its left face, shaded on its right."""
    dark, base, light = (hexc(c) for c in cols)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            c = light if x == x0 else dark if x == x1 else base
            if noise(x, y, 5) < 0.06:
                c = mix(c, dark, 0.5)  # grain
            p.put(x, y, c)


def line(p, a, b, w, c):
    (x0, y0), (x1, y1) = a, b
    n = max(abs(x1 - x0), abs(y1 - y0))
    for i in range(n + 1):
        t = i / max(1, n)
        x, y = round(x0 + (x1 - x0) * t), round(y0 + (y1 - y0) * t)
        for k in range(w):
            p.put(x + k, y, c)


def walls(p, look, x0, y0, x1, y1):
    d, b, l, x_ = (hexc(c) for c in look["w"])
    kind = look["wall"]
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if kind == "boards":
                # board-and-batten: wide boards, a narrow batten over each seam
                k = (x - x0) % 7
                c = l if k == 0 else d if k == 1 else b
                if k > 1 and noise(x, y // 3, 1) < 0.12:
                    c = mix(b, d, 0.5)  # weathering streaks
            elif kind == "clapboard":
                # lapped boards: the lip of each lit, the underside shaded
                k = (y - y0) % 3
                c = l if k == 0 else d if k == 2 else b
            else:
                # logs: rounded, lit on top, dark below, chinking between
                k = (y - y0) % 5
                c = [x_, l, b, b, d][k]
            p.put(x, y, c)
    if kind == "logs":
        # the log ends at the corner, round and ringed
        for y in range(y0 + 1, y1, 5):
            for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1), (-1, 0), (-1, 1), (2, 0), (2, 1), (0, 2), (1, 2), (0, -1), (1, -1)):
                p.put(x0 - 2 + dx, y + dy, l if (dx, dy) in ((0, 0), (1, 0)) else b)
            p.put(x0 - 2, y + 1, d)
    # the eaves' shadow on the wall
    for y in range(y0, y0 + 3):
        for x in range(x0, x1 + 1):
            px = p.get(x, y)
            p.put(x, y, mix(px[:3], (30, 20, 30), 0.45 - (y - y0) * 0.12))


def roof(p, look, x0, x1, top, bot):
    d, b, l, a = (hexc(c) for c in look["r"])
    kind = look["roof"]
    for y in range(top, bot + 1):
        inset = round((bot - y) * 0.55)
        for x in range(x0 + inset, x1 - inset + 1):
            if kind == "tin":
                k = x % 3
                c = l if k == 0 else d if k == 2 else b
                if noise(x, y // 2, 3) < 0.08 or (noise(x // 3, 0, 4) < 0.25 and y > bot - 4 and noise(x, y, 7) < 0.5):
                    c = a  # rust, mostly where the water runs off
            elif kind == "shingles":
                row = (y - top) // 3
                k = (y - top) % 3
                c = d if k == 2 else (l if k == 0 else b)
                if (x + row * 2) % 5 == 0 and k != 0:
                    c = d  # the gap between two shingles
            else:  # shakes: long, irregular
                row = (y - top) // 4
                k = (y - top) % 4
                c = d if k == 3 else (l if k == 0 else b)
                if (x + row * 3) % (4 + row % 3) == 0 and k != 0:
                    c = d
                if noise(x, y, 9) < 0.1:
                    c = mix(c, a, 0.5)
            p.put(x, y, c)
    # the fascia board along the eave
    t0, t1 = (hexc(c) for c in look["trim"])
    for x in range(x0, x1 + 1):
        p.put(x, bot + 1, t1)
        p.put(x, bot + 2, t0)


def window(p, look, x0, y0, x1, y1):
    t0, t1 = (hexc(c) for c in look["trim"])
    glass, sky = (40, 54, 70), (120, 150, 170)
    p.rect(x0, y0, x1, y1, t1)
    for x in range(x0, x1 + 1):
        p.put(x, y1, t0)
    mx, my = (x0 + x1) // 2, (y0 + y1) // 2
    for y in range(y0 + 2, y1 - 1):
        for x in range(x0 + 2, x1 - 1):
            if x == mx or y == my:
                continue  # the muntins
            # a pale reflection of the sky, slanting across the panes
            c = sky if (x - x0) + (y - y0) in (6, 7, 15) else glass
            p.put(x, y, c)
            inner = x not in (x0 + 2, x1 - 2, mx - 1, mx + 1) and y not in (y0 + 2, y1 - 2, my - 1, my + 1)
            p.glow(x, y, (255, 214, 130) if inner else (232, 160, 90))
    # the sill, lit on top
    for x in range(x0 - 2, x1 + 3):
        p.put(x, y1 + 1, t1)
        p.put(x, y1 + 2, t0)
    if look.get("flowers"):
        # a flower box: red geraniums over green leaves
        box = hexc(look["trim"][0])
        p.rect(x0 - 1, y1 + 3, x1 + 1, y1 + 5, box)
        for x in range(x0 - 1, x1 + 2):
            p.put(x, y1 + 3, hexc(look["trim"][1]))
            for k in range(2):
                if noise(x, k, 11) < 0.7:
                    p.put(x, y1 + 2 - k, (74, 120, 60) if noise(x, k, 12) < 0.55 else (200, 50, 50))


def door(p, look, x0, y0, x1, y1):
    t0, t1 = (hexc(c) for c in look["trim"])
    d0, d1 = (hexc(c) for c in look["door"])
    p.rect(x0, y0, x1, y1, t1)
    for y in range(y0 + 2, y1 + 1):
        for x in range(x0 + 2, x1 - 1):
            c = d1 if (x - x0) % 4 else d0  # boards
            if x == x0 + 2:
                c = mix(d1, (255, 255, 255), 0.2)
            p.put(x, y, c)
    # the glass in its upper half
    for y in range(y0 + 4, y0 + 11):
        for x in range(x0 + 4, x1 - 3):
            p.put(x, y, (40, 54, 70) if (x + y) % 9 else (120, 150, 170))
            p.glow(x, y, (255, 214, 130) if x0 + 4 < x < x1 - 4 and y0 + 4 < y < y0 + 10 else (232, 160, 90))
    p.put(x1 - 3, (y0 + y1) // 2 + 3, (214, 180, 90))  # the latch
    p.put(x1 - 3, (y0 + y1) // 2 + 4, (140, 110, 60))


def lantern(p, x, y):
    """A storm lantern on a bracket, lit at night."""
    iron = (50, 44, 48)
    for k in range(4):
        p.put(x + k, y, iron)
    p.put(x, y + 1, iron)
    p.put(x, y + 2, iron)
    p.rect(x - 2, y + 3, x + 2, y + 3, iron)
    for yy in range(y + 4, y + 8):
        for xx in range(x - 2, x + 3):
            edge = xx in (x - 2, x + 2)
            p.put(xx, yy, iron if edge else (226, 210, 160))
            if not edge:
                p.glow(xx, yy, (255, 230, 150))
    p.rect(x - 2, y + 8, x + 2, y + 8, iron)


def life_ring(p, cx, cy, r=5):
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            d = math.hypot(x - cx, y - cy)
            if 2.4 <= d <= r + 0.3:
                q = (math.atan2(y - cy, x - cx) + math.pi) / (math.pi / 2)
                c = (214, 64, 54) if int(q) % 2 == 0 else (236, 230, 220)
                if d > r - 0.8 and y > cy:
                    c = mix(c, (40, 20, 30), 0.35)  # shade on its lower rim
                p.put(x, y, c)


def rope(p, cx, cy):
    """A coil of rope hung on a peg."""
    for y in range(cy - 4, cy + 5):
        for x in range(cx - 4, cx + 5):
            d = math.hypot((x - cx) / 1.0, (y - cy) / 1.1)
            if 2 <= d <= 4.4:
                c = (196, 170, 118) if (x + y) % 2 else (150, 124, 82)
                p.put(x, y, c)
    p.put(cx, cy - 5, (50, 44, 48))


def net(p, x0, y0, x1, y1):
    """A landing net's mesh drying over the rail."""
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if (x + y) % 3 == 0 or (x - y) % 3 == 0:
                if noise(x, y, 13) < 0.85 and not (y > y1 - 3 and abs(x - (x0 + x1) / 2) > (y1 - y) * 2 + 2):
                    p.put(x, y, (160, 170, 150))


def hut(look):
    p = Pic()
    deck = [hexc(c) for c in look["deck"]]
    postc = look["post"]
    # pilings and their cross braces, under the deck
    for sx in STILTS:
        post(p, sx - 2, sx + 2, DECK + 2, H - 1, postc)
    brace = hexc(postc[1])
    for a, b in zip(STILTS, STILTS[1:]):
        line(p, (a + 2, DECK + 6), (b - 3, DECK + 26), 2, brace)
        line(p, (b - 3, DECK + 6), (a + 2, DECK + 26), 2, mix(brace, (20, 14, 18), 0.3))
    # the house: walls, then the roof over them
    walls(p, look, 62, 25, 158, DECK - 1)
    roof(p, look, 54, 166, 10, 22)
    # the stovepipe, with its rain cap
    for y in range(1, 12):
        p.put(136, y, (120, 120, 126))
        p.put(137, y, (90, 90, 96))
        p.put(138, y, (64, 64, 70))
    p.rect(134, 0, 140, 1, (70, 70, 76))
    # corner trim
    t0, t1 = (hexc(c) for c in look["trim"])
    if look["wall"] != "logs":
        p.rect(60, 24, 61, DECK - 1, t1)
        p.rect(157, 24, 158, DECK - 1, t0)
    window(p, look, 70, 31, 92, 45)
    door(p, look, 106, 29, 122, DECK - 1)
    lantern(p, 97, 29)
    life_ring(p, 139, 38)
    rope(p, 150, 44)
    # the walkway: plank ends lit on top, a beam under them
    for x in range(0, 172):
        p.put(x, DECK - 2, deck[2])
        p.put(x, DECK - 1, deck[1] if x % 6 else deck[0])
        p.put(x, DECK, deck[1] if x % 6 else deck[0])
        p.put(x, DECK + 1, deck[0])
        p.put(x, DECK + 2, mix(deck[0], (20, 14, 18), 0.4))
    # the railing along the walkway, a net drying on it
    for rx in (2, 20, 38, 56):
        post(p, rx, rx + 2, 42, DECK - 3, postc)
    for x in range(0, 60):
        p.put(x, 41, hexc(postc[2]))
        p.put(x, 42, hexc(postc[1]))
        p.put(x, 50, hexc(postc[1]))
    net(p, 23, 43, 35, 56)
    # one dark outline round the whole silhouette, as the cast has
    img = p.img
    px = img.load()
    solid = [[px[x, y][3] > 0 for x in range(W)] for y in range(H)]
    for y in range(H):
        for x in range(W):
            if not solid[y][x] and any(0 <= x + dx < W and 0 <= y + dy < H and solid[y + dy][x + dx]
                                       for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                px[x, y] = (*OUTLINE, 255)
    return img, p.lit


def barrel(look):
    """A wooden barrel of the day's catch, iron hoops, lit from the left."""
    img = Image.new("RGBA", (16, 18))
    px = img.load()
    d, b, l = (hexc(c) for c in look["deck"])
    for y in range(1, 17):
        bulge = 1 if 4 <= y <= 13 else 0
        x0, x1 = 2 - bulge, 13 + bulge
        for x in range(x0, x1 + 1):
            t = (x - x0) / (x1 - x0)
            c = l if t < 0.25 else d if t > 0.8 else b
            if (x - x0) % 3 == 0:
                c = mix(c, d, 0.5)  # staves
            if y in (3, 4, 13, 14):
                c = (70, 70, 76) if t > 0.3 else (110, 110, 118)  # hoops
            px[x, y] = (*c, 255)
    for x in range(3, 13):
        px[x, 1] = (*mix(d, (20, 14, 18), 0.4), 255)  # the open top, a fish tail showing
    px[7, 0], px[8, 0] = (150, 160, 150, 255), (150, 160, 150, 255)
    solid = [[px[x, y][3] > 0 for x in range(16)] for y in range(18)]
    for y in range(18):
        for x in range(16):
            if not solid[y][x] and any(0 <= x + dx < 16 and 0 <= y + dy < 18 and solid[y + dy][x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                px[x, y] = (*OUTLINE, 255)
    return img


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for v, look in LOOKS.items():
        d = OUT / v / "environments"
        d.mkdir(parents=True, exist_ok=True)
        img, lit = hut(look)
        img.save(d / "hut.png")
        lit.save(d / "hut-lights.png")
        barrel(look).save(d / "barrel.png")
        bg = Image.new("RGBA", (W, H), (196, 178, 140, 255))
        bg.alpha_composite(img)
        bg.alpha_composite(barrel(look), (70 - 8, DECK - 2 - 18 + 1))
        bg.resize((W * 4, H * 4), Image.NEAREST).save(OUT / f"{v}-hut.png")
        print(v)
