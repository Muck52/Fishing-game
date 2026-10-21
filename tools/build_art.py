"""Compiles the game's art from the source packs in assets/source/.

Every image the game shows is built here and written to assets/art/, with
assets/art/manifest.json listing each texture, its frame size and the anchor
points the code needs (rod tips, stilt positions, and so on). Run it after
changing anything in assets/source/:

    python3 tools/build_art.py

Credits for every pack are in assets/CREDITS.md.
"""
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/source"
OUT = ROOT / "assets/art"

manifest = {"images": {}, "sheets": {}, "fonts": {}, "anchors": {}}
GRADED = []  # (path, is_actor) for every image the palette pass recolours
KEEP = []  # images whose exact colours join the master palette


def load(path):
    return Image.open(SRC / path).convert("RGBA")


def save(img, rel, key=None, frame=None, frames=None, grade=True, actor=False, keep=False):
    """Writes an image and lists it in the manifest as an image or a sheet.

    grade: recolour it to the master palette in the final pass.
    actor: a character or prop that moves on its own; its dark edge pixels
    are all set to the one outline colour.
    keep: small, carefully shaded art (the interface) whose own colours are
    added to the master palette so they survive the pass unchanged.
    """
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    if grade:
        GRADED.append((path, actor))
    if keep:
        KEEP.append(img)
    url = f"assets/art/{rel}"
    key = key or Path(rel).stem
    if frame:
        manifest["sheets"][key] = {"url": url, "frameWidth": frame[0], "frameHeight": frame[1], "frames": frames}
    else:
        manifest["images"][key] = url
    return img


def strip(frames):
    """Lays equal-sized frames side by side."""
    w, h = frames[0].size
    out = Image.new("RGBA", (w * len(frames), h))
    for i, f in enumerate(frames):
        out.alpha_composite(f, (i * w, 0))
    return out


def cut(img, fw, fh=None, n=None, vertical=False):
    fh = fh or img.height
    n = n or ((img.height // fh) if vertical else (img.width // fw))
    return [img.crop((0, i * fh, fw, (i + 1) * fh)) if vertical else img.crop((i * fw, 0, (i + 1) * fw, fh)) for i in range(n)]


def flip(img):
    return img.transpose(Image.FLIP_LEFT_RIGHT)


def recolor(img, mapping):
    """Swaps exact colours: {(r, g, b): (r, g, b)}."""
    out = img.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a and (r, g, b) in mapping:
                px[x, y] = (*mapping[(r, g, b)], a)
    return out


def tint(img, rgb):
    """Recolours every pixel to rgb, keeping some of its own light and shade."""
    out = img.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a:
                v = (r * 0.3 + g * 0.59 + b * 0.11) / 255
                px[x, y] = tuple(round(c * (0.55 + 0.45 * v)) for c in rgb) + (a,)
    return out


def sway(img, n=4, amp=2):
    """Frames of a plant swaying: each row is pushed sideways, the top most
    and the root not at all, so it bends on the pixel grid instead of being
    rotated."""
    w, h = img.size
    frames = []
    for f in range(n):
        out = Image.new("RGBA", (w + amp * 2, h))
        k = math.sin(f / n * math.pi * 2)
        for y in range(h):
            dx = round(amp * k * (1 - y / h) ** 2)
            out.alpha_composite(img.crop((0, y, w, y + 1)), (amp + dx, y))
        frames.append(out)
    return strip(frames), (w + amp * 2, h)


def hash01(x, y, seed=0):
    """Repeatable noise in [0, 1) for scattering texture details."""
    n = (x * 374761393 + y * 668265263 + seed * 2147483647) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    return (n ^ (n >> 16)) / 4294967296


def lerp(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]


# ---------------------------------------------------------------- backdrop
def backdrop():
    mr = "craftpix-mountain-river"
    save(load(f"{mr}/Plan 4.png"), "environments/sky.png")
    save(load(f"{mr}/Plan 2.png"), "environments/mountains.png")
    cloud = load(f"{mr}/Plan 3.png")
    save(cloud.crop(cloud.getbbox()), "environments/cloud-big.png")
    land = load(f"{mr}/Plan 1.png")
    save(land, "environments/land.png")
    for i in (1, 2, 3):
        save(load(f"pixelfrog-treasure-hunters/Background/Small Cloud {i}.png"), f"environments/cloud-{i}.png")

    # The waterfall and the river below it, animated: in each column the
    # water's own pixels are rolled downward a few rows per frame.
    box = (326, 120, 576, 324)
    region = land.crop(box)
    is_water = lambda r, g, b: (b - r >= 12 and b > 150) or min(r, g, b) > 215
    frames = []
    for f in range(4):
        out = Image.new("RGBA", region.size)
        src = region.load()
        dst = out.load()
        for x in range(region.width):
            ys = [y for y in range(region.height) if src[x, y][3] and is_water(*src[x, y][:3])]
            if not ys:
                continue
            cols = [src[x, y] for y in ys]
            k = (f * 3) % len(cols)
            rolled = cols[-k:] + cols[:-k] if k else cols
            for y, c in zip(ys, rolled):
                dst[x, y] = c
        frames.append(out)
    save(strip(frames), "environments/falls.png", frame=region.size, frames=4)
    manifest["anchors"]["falls"] = {"x": box[0], "y": box[1]}
    manifest["anchors"]["fallsFoot"] = {"x": 352, "y": 214}


# ---------------------------------------------------------------- the lake
LAKE = {
    (155, 240, 253): (176, 236, 240),
    (98, 171, 212): (86, 168, 188),
    (88, 128, 204): (62, 128, 160),
    (86, 88, 123): (44, 92, 120),
}
DEEP = [(44, 92, 120), (30, 70, 98), (20, 50, 76), (14, 34, 56)]
DEEP = [lerp(DEEP[min(2, i // 3)], DEEP[min(3, i // 3 + 1)], (i % 3) / 3) for i in range(9)] + [DEEP[3]]


def lake():
    water = load("craftpix-fishing/Water.png").crop((0, 2, 96, 32))
    save(recolor(water, LAKE), "environments/water-surface.png")

    # The water below the surface strip: a dithered fall-off into the deep,
    # with the soft light shafts of the underwater pack laid over it.
    w, h = 360, 500
    body = Image.new("RGBA", (w, h))
    px = body.load()
    light = load("ansimuz-underwater/background.png").convert("L")
    base = light.getpixel((5, 5))
    for y in range(h):
        t = y / (h - 1) * (len(DEEP) - 1)
        i = min(len(DEEP) - 2, int(t))
        f = t - i
        for x in range(w):
            c = DEEP[i + 1] if f * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5 else DEEP[i]
            glow = (light.getpixel((x % light.width, y % light.height)) - base) / 255
            if glow > 0.02:
                c = lerp(c, (120, 200, 210), min(0.35, glow * 0.8) * (1 - y / h))
            px[x, y] = (*c, 255)
    save(body, "environments/underwater.png")

    # light shafts slanting down from the surface, drawn additively
    rw, rh = 30, 300
    ray = Image.new("RGBA", (rw, rh))
    rp = ray.load()
    for y in range(rh):
        for x in range(rw):
            d = abs(x - rw / 2 + y * 0.12) / (rw / 2)
            a = max(0, 1 - d) ** 1.5 * (1 - y / rh) ** 1.2
            if a * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5:
                rp[x, y] = (200, 240, 230, 255)
    save(ray, "effects/light-ray.png", grade=False)

    ra = "reactorcore-aquatic"
    for n in ["seaweed 1", "seaweed 2", "seaweed 3", "seaweed 4", "sea bush weed 1", "sea bush weed 2",
              "sea flora plant 1", "sea flora plant 2", "sea flora plant 3", "sea flora plant 4",
              "sand pit 2", "sand pit 3", "sand pit 4", "sand pit 5", "clam small"]:
        img = load(f"{ra}/{n}.png")
        key = f"bed-{n.replace(' ', '-')}"
        if n.startswith("sea"):
            sheet, size = sway(img, amp=2)
            save(sheet, f"environments/{key}.png", frame=size, frames=4)
        else:
            save(img, f"environments/{key}.png")

    # the lakebed: a band of sand and silt that the plants stand in
    bw, bh = 360, 40
    bed = Image.new("RGBA", (bw, bh))
    bp = bed.load()
    silt = [(66, 74, 64), (88, 92, 70), (112, 106, 78), (138, 126, 90)]
    for x in range(bw):
        top = 6 + round(3 * math.sin(x * 0.07) + 2 * math.sin(x * 0.23 + 1))
        for y in range(top, bh):
            d = y - top
            c = silt[3] if d == 0 else silt[2] if d < 3 else silt[1] if d < 10 else silt[0]
            if d and hash01(x, y, 1) < 0.05:
                c = silt[3]
            bp[x, y] = (*c, 255)
    save(bed, "environments/lakebed.png")

    # A rock shelf in the background, sloping from the left shore down to
    # the bed: darker and bluer than anything near, so it reads as distance.
    sw_, sh_ = 200, 460
    shelf = Image.new("RGBA", (sw_, sh_))
    sp = shelf.load()
    rock = [(14, 36, 54), (20, 46, 66), (28, 58, 78)]
    edge = []
    for x in range(sw_):
        t = x / (sw_ - 1)
        top = round(30 + t ** 1.7 * 420 + 4 * math.sin(x * 0.21) + 3 * math.sin(x * 0.07 + 2))
        edge.append(top)
        for y in range(max(0, top), sh_):
            d = y - top
            c = rock[2] if d < 2 else rock[1] if d < 8 or (d < 14 and BAYER[(y & 3) * 4 + (x & 3)] < 8) else rock[0]
            if d > 6 and hash01(x // 3, y // 2, 2) < 0.06:
                c = rock[1]  # stones in the silt
            sp[x, y] = (*c, 255)
    save(shelf, "environments/shelf.png")
    manifest["anchors"]["shelf"] = edge[::4]


# ---------------------------------------------------------------- the pier
def pier():
    hut = flip(load("craftpix-fishing/Fishing_hut.png"))
    save(hut, "environments/hut.png", actor=True)
    # stilt columns, read off the bottom row of the turned hut
    row = [hut.getpixel((x, 121))[3] > 0 for x in range(hut.width)]
    stilts, x = [], 0
    while x < hut.width:
        if row[x]:
            s = x
            while x < hut.width and row[x]:
                x += 1
            stilts.append((s + x) / 2)
        x += 1
    manifest["anchors"]["hut"] = {"deck": 62, "stilts": stilts, "w": hut.width, "h": hut.height, "window": {"x": 109, "y": 41}}
    tiles = load("craftpix-fishing/Pier_Tiles.png")
    save(tiles.crop((66, 64, 74, 128)), "environments/post-wet.png")
    save(load("craftpix-fishing/Boat.png"), "environments/boat.png", actor=True)
    save(load("craftpix-fishing/Fishbarrel4.png"), "environments/barrel.png", actor=True)
    for i in range(1, 5):
        sheet, size = sway(load(f"craftpix-fishing/Grass{i}.png"), amp=1)
        save(sheet, f"environments/cattails-{i}.png", frame=size, frames=4, actor=True)


# ---------------------------------------------------------------- the angler
LINE = {(167, 172, 186)}


def no_line(frame):
    """Removes the line hanging from the rod tip; the game draws its own."""
    out = frame.copy()
    px = out.load()
    for y in range(27, 48):
        for x in range(36, 48):
            r, g, b, a = px[x, y]
            if a and ((r, g, b) in LINE or (r, g, b) == OUTLINE and x >= 40):
                px[x, y] = (0, 0, 0, 0)
    return out


def angler():
    cf = "craftpix-fishing"
    idle = cut(load(f"{cf}/Fisherman_idle.png"), 48)
    fish = [no_line(f) for f in cut(load(f"{cf}/Fisherman_fish.png"), 48)]
    hook = cut(load(f"{cf}/Fisherman_hook.png"), 48)
    hurt = cut(load(f"{cf}/Fisherman_hurt.png"), 48)
    frames = [flip(f) for f in idle + fish + hook[3:] + hurt[1:]]
    save(strip(frames), "characters/angler.png", frame=(48, 48), frames=len(frames), actor=True)
    # rod tips of the fishing frames, in the turned (left-facing) frame
    tips = []
    for f in frames[4:8]:
        px = f.load()
        best = None
        for y in range(20, 30):
            for x in range(48):
                if px[x, y][3]:
                    if best is None or x < best[0]:
                        best = (x, y)
                    break
        tips.append({"x": best[0], "y": best[1]})
    manifest["anchors"]["angler"] = {"idle": [0, 3], "fish": [4, 7], "land": [8, 10], "hurt": 11, "tips": tips}
    save(load(f"{cf}/Icons_16.png"), "ui/bucket.png")


# ---------------------------------------------------------------- wildlife
def wildlife():
    sw = "scratchio-wild-animals"
    for name, fw in [("Deer_Walk", 72), ("Deer_Idle", 72), ("Fox_Walk", 64), ("Fox_Idle", 64),
                     ("Rabbit_Hop", 32), ("Rabbit_Idle", 32), ("Bear_Walk", 64)]:
        img = load(f"{sw}/{name}.png")
        save(img, f"characters/{name.lower().replace('_', '-')}.png", frame=(fw, img.height), frames=img.width // fw, actor=True)
    birds = load("moikmellah-birds/birds.32x32.png")
    bp = birds.load()
    for y in range(birds.height):  # the sheet has a magenta backdrop
        for x in range(birds.width):
            if bp[x, y][:3] == (255, 0, 255):
                bp[x, y] = (0, 0, 0, 0)
    save(birds, "characters/birds.png", frame=(32, 32), frames=12, actor=True)
    save(load("spring-spring-eagle/eagle_flap.png"), "characters/eagle.png", frame=(41, 21), frames=7, actor=True)
    duck = cut(load("duck-16x16/duck_spritesheet.png"), 16, 16, vertical=True)
    save(strip(duck), "characters/duck.png", frame=(16, 16), frames=4, actor=True)
    # minnows: a third of their pack size, smaller than any catchable fish
    darts = [shrink(f.crop(f.getbbox()), 11) for f in cut(load("ansimuz-underwater/fish-dart.png"), 39)]
    fw, fh = max(d.width for d in darts), max(d.height for d in darts)
    padded = []
    for d in darts:
        p = Image.new("RGBA", (fw, fh))
        p.alpha_composite(d, (0, fh - d.height))
        padded.append(p)
    save(strip(padded), "characters/minnow.png", frame=(fw, fh), frames=4, actor=True)


# ---------------------------------------------------------------- fish
# How long each species swims on screen, in pixels, nose to tail. The angler
# stands about 34 pixels tall; fish are drawn a little larger than life
# beside him so their markings still read, smallest to largest.
FISH_LENGTH = {"bluegill": 16, "perch": 19, "bass": 24, "trout": 24, "catfish": 28, "pike": 34, "golden": 40}


def shrink(img, length):
    """Redraws a sprite smaller on the pixel grid: each new pixel takes the
    average of the pixels it covers, edges are cut clean, and a fresh
    one-pixel outline goes round the result."""
    w, h = img.size
    nw, nh = length, max(3, round(h * length / w))
    a = np.array(img).astype(np.float64)
    a[..., :3] *= a[..., 3:] / 255  # premultiply so the old outline doesn't bleed in
    small = np.array(Image.fromarray(a.astype(np.uint8)).resize((nw, nh), Image.Resampling.BOX)).astype(np.float64)
    alpha = small[..., 3]
    out = np.zeros((nh + 2, nw + 2, 4), np.uint8)
    solid = alpha > 110
    rgb = np.where(alpha[..., None] > 0, small[..., :3] * 255 / np.maximum(alpha[..., None], 1), 0)
    inner = out[1:-1, 1:-1]
    inner[solid, :3] = np.clip(rgb[solid] * 1.08, 0, 255)  # a touch brighter, as the outline darkens it
    inner[solid, 3] = 255
    body = out[..., 3] > 0
    ring = np.zeros_like(body)
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        ring |= np.roll(np.roll(body, dy, 0), dx, 1)
    out[ring & ~body] = (*OUTLINE, 255)
    return Image.fromarray(out)


def fish():
    """Swim frames for each species: the rear of the body sways side to side."""
    info = {}
    for path in sorted((SRC / "baked-fish").glob("*.png")):
        card = Image.open(path).convert("RGBA")
        card = card.crop(card.getbbox())
        img = shrink(card, FISH_LENGTH[path.stem])
        w, h = img.size
        frames = []
        for f in range(4):
            out = Image.new("RGBA", (w, h + 4))
            sp = img.load()
            dp = out.load()
            for x in range(w):
                t = max(0, (x / w - 0.45) / 0.55)  # 0 at mid-body, 1 at the tail tip
                dy = round(math.sin(f / 4 * math.pi * 2) * 1.4 * t * t)
                for y in range(h):
                    if sp[x, y][3]:
                        dp[x, y + 2 + dy] = sp[x, y]
            frames.append(out)
        save(strip(frames), f"fish/{path.stem}.png", key=f"fish-{path.stem}", frame=(w, h + 4), frames=4, actor=True)
        save(card, f"fish/{path.stem}-card.png", key=f"card-{path.stem}", actor=True)
        info[path.stem] = {"w": w, "h": h}
    manifest["anchors"]["fish"] = info


# ---------------------------------------------------------------- effects
def effects():
    th = "pixelfrog-treasure-hunters"
    white = lambda im: tint(im, (235, 250, 250))
    splash = [white(load(f"{th}/Water_Water-Splash/{i}.png")) for i in range(1, 6)]
    save(strip(splash), "effects/splash.png", frame=(56, 14), frames=5)
    bub = [load(f"{th}/Water_Bubbles/{i}.png") for i in range(1, 4)]
    save(strip(bub), "effects/bubble.png", frame=(7, 7), frames=3)
    save(load("amberfall-lake/ripples.png"), "effects/ripple.png", frame=(32, 32), frames=4)
    save(load("amberfall-lake/floatingbranch.png"), "effects/branch.png", frame=(32, 32), frames=4, actor=True)
    save(load("nelson-yiap-bobbles/fishing_bobbles.png").crop((0, 0, 48, 24)), "effects/bobber.png", frame=(24, 24), frames=2, actor=True)

    # the hook with a worm on it, and small particle motes
    hook = Image.new("RGBA", (6, 9))
    for x, y, c in [(2, 0, "k"), (2, 1, "s"), (2, 2, "s"), (2, 3, "s"), (2, 4, "s"), (2, 5, "s"), (2, 6, "s"),
                    (3, 7, "s"), (4, 6, "s"), (4, 5, "k"), (1, 7, "s"), (0, 2, "w"), (1, 3, "w"), (0, 4, "w"),
                    (1, 5, "w"), (3, 3, "w"), (3, 4, "W")]:
        hook.putpixel((x, y), {"k": (60, 60, 70, 255), "s": (200, 206, 214, 255), "w": (222, 110, 120, 255), "W": (250, 150, 160, 255)}[c])
    save(hook, "effects/hook.png")
    for name, size, rgb in [("mote", 1, (255, 246, 210)), ("drop", 1, (230, 246, 250)), ("spark", 3, (255, 250, 220)), ("star", 1, (255, 255, 240))]:
        m = Image.new("RGBA", (size, size), (*rgb, 255))
        if size == 3:
            for x, y in [(0, 0), (2, 0), (0, 2), (2, 2)]:
                m.putpixel((x, y), (0, 0, 0, 0))
        save(m, f"effects/{name}.png", grade=False)
    puff = Image.new("RGBA", (9, 9))
    for y in range(9):
        for x in range(9):
            d = math.hypot(x - 4, y - 4) / 4.5
            if d < 1:
                puff.putpixel((x, y), (236, 246, 250, round(200 * (1 - d))))
    save(puff, "effects/mist.png", grade=False)

    # a soft round glow for lamps and fireflies, dithered rather than
    # smooth so it sits on the pixel grid
    G = 33
    glow = Image.new("RGBA", (G, G))
    for y in range(G):
        for x in range(G):
            t = max(0, 1 - math.hypot(x - 16, y - 16) / 16.5) ** 1.6
            if t * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5:
                glow.putpixel((x, y), (255, 214, 140, 255) if t > 0.55 else (255, 180, 100, 255) if t > 0.25 else (200, 120, 80, 255))
    save(glow, "effects/glow.png", grade=False)

    # a firefly: one hot pixel in a dim halo
    fly = Image.new("RGBA", (5, 5))
    for x, y in [(1, 2), (3, 2), (2, 1), (2, 3)]:
        fly.putpixel((x, y), (180, 200, 80, 255))
    fly.putpixel((2, 2), (255, 250, 170, 255))
    save(fly, "effects/firefly.png", grade=False)

    # the hut window's light lying on the water: broken, wavering bars
    rw_, rh_ = 16, 30
    streak = Image.new("RGBA", (rw_, rh_))
    for y in range(0, rh_, 2):
        half = round((rw_ / 2 - 1) * (1 - y / rh_) * (0.6 + 0.4 * math.sin(y * 1.3)))
        for x in range(rw_ // 2 - half, rw_ // 2 + half):
            streak.putpixel((x, y), (255, 200, 120, 255) if y < rh_ / 2 else (200, 130, 80, 255))
    save(streak, "effects/light-streak.png", grade=False)
    # a displacement map that makes the deep water waver: bands of sideways
    # push (red) and a little lift (green)
    dm = Image.new("RGBA", (64, 256))
    for y in range(256):
        for x in range(64):
            u = x / 64 * math.pi * 2
            dm.putpixel((x, y), (round(127.5 + 127.5 * math.sin(y / 9 + math.sin(u) * 0.9)), round(127.5 + 60 * math.cos(y / 17 + u)), 0, 255))
    save(dm, "effects/ripple-map.png", grade=False)
    coin = [load(f"{th}/Objects_Gold-Coin/0{i}.png") for i in range(1, 5)]
    save(strip(coin), "ui/coin.png", frame=(16, 16), frames=4, keep=True)


# ---------------------------------------------------------------- interface
def ui():
    th = "pixelfrog-treasure-hunters"
    board = Image.new("RGBA", (96, 96))
    for i in range(9):
        board.alpha_composite(load(f"{th}/UI_Yellow-Board/{i + 1}.png"), ((i % 3) * 32, (i // 3) * 32))
    save(board, "ui/board.png", keep=True)
    btn = [load(f"{th}/UI_Yellow-Button/{i}.png") for i in range(1, 5)]
    save(strip(btn), "ui/button.png", frame=(14, 14), frames=4, keep=True)


# ---------------------------------------------------------------- fonts
OUTLINE = (37, 19, 26)  # the one dark edge colour shared by every actor and all lettering
CHARS = [chr(c) for c in range(32, 127)] + ["\u00b7"]


def font(name, ttf, size):
    """Bakes a TrueType pixel font into a bitmap font: white letters with
    a dark one-pixel outline and a drop shadow, ready to tint in game."""
    f = ImageFont.truetype(str(SRC / "kenney-fonts" / ttf), size)
    asc, desc = f.getmetrics()
    cell_h = asc + desc + 3
    glyphs = []
    for ch in CHARS:
        adv = round(f.getlength(ch))
        w = max(1, adv) + 3
        g = Image.new("RGBA", (w, cell_h))
        mask = Image.new("L", (w, cell_h))
        d = ImageDraw.Draw(mask)
        d.fontmode = "1"
        d.text((1, 1), ch, font=f, fill=255)
        m = np.array(mask) > 0
        out = np.zeros((cell_h, w, 4), np.uint8)
        ring = np.zeros_like(m)
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, -1), (-1, 1), (1, 1), (0, 2), (1, 2), (-1, 2)]:
            ring |= np.roll(np.roll(m, dy, 0), dx, 1)
        out[ring] = (*OUTLINE, 255)
        out[m] = (255, 255, 255, 255)
        glyphs.append((ch, Image.fromarray(out), adv))
    cols = 16
    cw = max(g.width for _, g, _ in glyphs)
    rows = (len(glyphs) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cw, rows * cell_h))
    xml = [f'<font><info face="{name}" size="{size}"/><common lineHeight="{asc + desc + 2}" base="{asc}" scaleW="{sheet.width}" scaleH="{sheet.height}" pages="1"/>',
           f'<pages><page id="0" file="{name}.png"/></pages><chars count="{len(glyphs)}">']
    for i, (ch, g, adv) in enumerate(glyphs):
        x, y = (i % cols) * cw, (i // cols) * cell_h
        sheet.alpha_composite(g, (x, y))
        xml.append(f'<char id="{ord(ch)}" x="{x}" y="{y}" width="{g.width}" height="{cell_h}" xoffset="-1" yoffset="-1" xadvance="{adv + 1}" page="0"/>')
    xml.append("</chars></font>")
    (OUT / "fonts").mkdir(parents=True, exist_ok=True)
    sheet.save(OUT / f"fonts/{name}.png")
    (OUT / f"fonts/{name}.xml").write_text("".join(xml))
    manifest["fonts"][name] = {"png": f"assets/art/fonts/{name}.png", "xml": f"assets/art/fonts/{name}.xml"}


def fonts():
    font("body", "Kenney Pixel.ttf", 16)
    font("head", "Kenney Mini.ttf", 16)


# ---------------------------------------------------------------- palette
# A few colours every scene needs exactly, whatever the packs average out to.
KEY_COLORS = [OUTLINE, (255, 244, 214), (255, 216, 74), (232, 74, 58), (138, 208, 106), (14, 34, 56), (44, 92, 120), (176, 236, 240)]


def palette_pass():
    """Recolours every graded image to one master palette.

    The palette is the 56 colours that best cover all the packs together
    (median cut over every opaque pixel), plus the key colours above and
    the interface art's own colours. Then
    each actor's dark edge pixels are set to the shared outline colour.
    """
    arrays = [np.array(Image.open(p).convert("RGBA")) for p, _ in GRADED]
    pix = np.concatenate([a[a[..., 3] > 0][:, :3] for a in arrays])[::5]
    side = int(np.ceil(np.sqrt(len(pix))))
    pad = np.zeros((side * side, 3), np.uint8)
    pad[: len(pix)] = pix
    pad[len(pix):] = pix[0]
    q = Image.fromarray(pad.reshape(side, side, 3)).quantize(colors=56, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()[: 56 * 3]
    kept = {tuple(int(v) for v in c) for im in KEEP for c in np.array(im)[np.array(im)[..., 3] > 0][:, :3]}
    colors = np.array(sorted({tuple(pal[i:i + 3]) for i in range(0, len(pal), 3)} | set(KEY_COLORS) | kept), np.int32)
    # sorted by brightness for the swatch sheet in the docs
    colors = colors[np.argsort(colors @ np.array([3, 6, 1]))]
    sw = Image.new("RGB", (len(colors) * 8, 8))
    for i, c in enumerate(colors):
        sw.paste(tuple(int(v) for v in c), (i * 8, 0, i * 8 + 8, 8))
    sw.save(ROOT / "docs/palette.png")
    manifest["palette"] = ["#%02x%02x%02x" % tuple(int(v) for v in c) for c in colors]

    w = np.array([2, 4, 3])
    for (path, actor), a in zip(GRADED, arrays):
        rgb = a[..., :3].astype(np.int32)
        d = (((rgb[..., None, :] - colors[None, None]) ** 2) * w).sum(-1)
        out = a.copy()
        out[..., :3] = colors[d.argmin(-1)]
        if actor:
            solid = a[..., 3] > 0
            edge = solid & ~(np.roll(solid, 1, 0) & np.roll(solid, -1, 0) & np.roll(solid, 1, 1) & np.roll(solid, -1, 1))
            dark = (rgb @ np.array([3, 6, 1])) < 700  # luminance under ~70
            out[edge & dark, :3] = OUTLINE
        Image.fromarray(out).save(path, optimize=True)


if __name__ == "__main__":
    for step in (backdrop, lake, pier, angler, wildlife, fish, effects, ui, fonts, palette_pass):
        step()
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=1) + "\n")
    print(f"{len(manifest['images'])} images, {len(manifest['sheets'])} sheets")
