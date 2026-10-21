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

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/source"
OUT = ROOT / "assets/art"

manifest = {"images": {}, "sheets": {}, "anchors": {}}


def load(path):
    return Image.open(SRC / path).convert("RGBA")


def save(img, rel, key=None, frame=None, frames=None):
    """Writes an image and lists it in the manifest as an image or a sheet."""
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
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
    w, h = 240, 340
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
    rw, rh = 40, 220
    ray = Image.new("RGBA", (rw, rh))
    rp = ray.load()
    for y in range(rh):
        for x in range(rw):
            d = abs(x - rw / 2 + y * 0.12) / (rw / 2)
            a = max(0, 1 - d) ** 1.5 * (1 - y / rh) ** 1.2
            if a * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5:
                rp[x, y] = (200, 240, 230, 255)
    save(ray, "effects/light-ray.png")

    ra = "reactorcore-aquatic"
    for n in ["seaweed 1", "seaweed 2", "seaweed 3", "seaweed 4", "sea bush weed 1", "sea bush weed 2",
              "sea flora plant 1", "sea flora plant 2", "sea flora plant 3", "sea flora plant 4",
              "sand pit 2", "sand pit 3", "sand pit 4", "sand pit 5", "clam small"]:
        save(load(f"{ra}/{n}.png"), f"environments/bed-{n.replace(' ', '-')}.png")

    # the lakebed: a band of sand and silt that the plants stand in
    bw, bh = 240, 40
    bed = Image.new("RGBA", (bw, bh))
    bp = bed.load()
    silt = [(66, 74, 64), (88, 92, 70), (112, 106, 78), (138, 126, 90)]
    for x in range(bw):
        top = 6 + round(3 * math.sin(x * 0.07) + 2 * math.sin(x * 0.23 + 1))
        for y in range(top, bh):
            d = y - top
            c = silt[3] if d == 0 else silt[2] if d < 3 else silt[1] if d < 10 else silt[0]
            if d and ((x * 7 + y * 13) % 23 == 0):
                c = silt[3]
            bp[x, y] = (*c, 255)
    save(bed, "environments/lakebed.png")


# ---------------------------------------------------------------- the pier
def pier():
    hut = flip(load("craftpix-fishing/Fishing_hut.png"))
    save(hut, "environments/hut.png")
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
    manifest["anchors"]["hut"] = {"deck": 62, "stilts": stilts, "w": hut.width, "h": hut.height}
    tiles = load("craftpix-fishing/Pier_Tiles.png")
    save(tiles.crop((66, 64, 74, 128)), "environments/post-wet.png")
    save(load("craftpix-fishing/Boat.png"), "environments/boat.png")
    save(load("craftpix-fishing/Fishbarrel4.png"), "environments/barrel.png")
    for i in range(1, 5):
        save(load(f"craftpix-fishing/Grass{i}.png"), f"environments/cattails-{i}.png")


# ---------------------------------------------------------------- the angler
LINE = {(167, 172, 186)}
OUTLINE = (37, 19, 26)


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
    save(strip(frames), "characters/angler.png", frame=(48, 48), frames=len(frames))
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
    save(load(f"{cf}/Icons_02.png"), "ui/portrait.png")
    save(load(f"{cf}/Icons_16.png"), "ui/bucket.png")


# ---------------------------------------------------------------- wildlife
def wildlife():
    sw = "scratchio-wild-animals"
    for name, fw in [("Deer_Walk", 72), ("Deer_Idle", 72), ("Fox_Walk", 64), ("Fox_Idle", 64),
                     ("Rabbit_Hop", 32), ("Rabbit_Idle", 32), ("Bear_Walk", 64)]:
        img = load(f"{sw}/{name}.png")
        save(img, f"characters/{name.lower().replace('_', '-')}.png", frame=(fw, img.height), frames=img.width // fw)
    birds = load("moikmellah-birds/birds.32x32.png")
    bp = birds.load()
    for y in range(birds.height):  # the sheet has a magenta backdrop
        for x in range(birds.width):
            if bp[x, y][:3] == (255, 0, 255):
                bp[x, y] = (0, 0, 0, 0)
    save(birds, "characters/birds.png", frame=(32, 32), frames=12)
    save(load("spring-spring-eagle/eagle_flap.png"), "characters/eagle.png", frame=(41, 21), frames=7)
    duck = cut(load("duck-16x16/duck_spritesheet.png"), 16, 16, vertical=True)
    save(strip(duck), "characters/duck.png", frame=(16, 16), frames=4)
    dart = load("ansimuz-underwater/fish-dart.png")
    save(dart, "characters/minnow.png", frame=(39, 20), frames=4)


# ---------------------------------------------------------------- fish
def fish():
    """Swim frames for each species: the rear of the body sways side to side."""
    info = {}
    for path in sorted((SRC / "baked-fish").glob("*.png")):
        img = Image.open(path).convert("RGBA")
        img = img.crop(img.getbbox())
        w, h = img.size
        frames = []
        for f in range(4):
            out = Image.new("RGBA", (w, h + 4))
            sp = img.load()
            dp = out.load()
            for x in range(w):
                t = max(0, (x / w - 0.45) / 0.55)  # 0 at mid-body, 1 at the tail tip
                dy = round(math.sin(f / 4 * math.pi * 2) * 2 * t * t)
                for y in range(h):
                    if sp[x, y][3]:
                        dp[x, y + 2 + dy] = sp[x, y]
            frames.append(out)
        save(strip(frames), f"fish/{path.stem}.png", key=f"fish-{path.stem}", frame=(w, h + 4), frames=4)
        save(img, f"fish/{path.stem}-card.png", key=f"card-{path.stem}")
        info[path.stem] = {"w": w, "h": h}
    manifest["anchors"]["fish"] = info


# ---------------------------------------------------------------- effects
def effects():
    th = "pixelfrog-treasure-hunters"
    white = lambda im: tint(im, (235, 250, 250))
    splash = [white(load(f"{th}/Water_Water-Splash/{i}.png")) for i in range(1, 6)]
    save(strip(splash), "effects/splash.png", frame=(56, 14), frames=5)
    shine = [tint(load(f"{th}/Water_Reflexes-1/{i}.png"), (230, 250, 250)) for i in range(1, 7)]
    save(strip(shine), "effects/glints.png", frame=(56, 36), frames=6)
    bub = [load(f"{th}/Water_Bubbles/{i}.png") for i in range(1, 4)]
    save(strip(bub), "effects/bubble.png", frame=(7, 7), frames=3)
    save(load("amberfall-lake/ripples.png"), "effects/ripple.png", frame=(32, 32), frames=4)
    save(load("amberfall-lake/floatingbranch.png"), "effects/branch.png", frame=(32, 32), frames=4)
    save(load("nelson-yiap-bobbles/fishing_bobbles.png").crop((0, 0, 48, 24)), "effects/bobber.png", frame=(24, 24), frames=2)

    # the hook with a worm on it, and small particle motes
    hook = Image.new("RGBA", (6, 9))
    for x, y, c in [(2, 0, "k"), (2, 1, "s"), (2, 2, "s"), (2, 3, "s"), (2, 4, "s"), (2, 5, "s"), (2, 6, "s"),
                    (3, 7, "s"), (4, 6, "s"), (4, 5, "k"), (1, 7, "s"), (0, 2, "w"), (1, 3, "w"), (0, 4, "w"),
                    (1, 5, "w"), (3, 3, "w"), (3, 4, "W")]:
        hook.putpixel((x, y), {"k": (60, 60, 70, 255), "s": (200, 206, 214, 255), "w": (222, 110, 120, 255), "W": (250, 150, 160, 255)}[c])
    save(hook, "effects/hook.png")
    for name, size, rgb in [("mote", 1, (255, 246, 210)), ("drop", 1, (230, 246, 250)), ("spark", 3, (255, 250, 220))]:
        m = Image.new("RGBA", (size, size), (*rgb, 255))
        if size == 3:
            for x, y in [(0, 0), (2, 0), (0, 2), (2, 2)]:
                m.putpixel((x, y), (0, 0, 0, 0))
        save(m, f"effects/{name}.png")
    puff = Image.new("RGBA", (9, 9))
    for y in range(9):
        for x in range(9):
            d = math.hypot(x - 4, y - 4) / 4.5
            if d < 1:
                puff.putpixel((x, y), (236, 246, 250, round(200 * (1 - d))))
    save(puff, "effects/mist.png")
    # a displacement map that makes the deep water waver: bands of sideways
    # push (red) and a little lift (green)
    dm = Image.new("RGBA", (64, 256))
    for y in range(256):
        for x in range(64):
            u = x / 64 * math.pi * 2
            dm.putpixel((x, y), (round(127.5 + 127.5 * math.sin(y / 9 + math.sin(u) * 0.9)), round(127.5 + 60 * math.cos(y / 17 + u)), 0, 255))
    save(dm, "effects/ripple-map.png")
    coin = [load(f"{th}/Objects_Gold-Coin/0{i}.png") for i in range(1, 5)]
    save(strip(coin), "ui/coin.png", frame=(16, 16), frames=4)


# ---------------------------------------------------------------- interface
def ui():
    th = "pixelfrog-treasure-hunters"
    board = Image.new("RGBA", (96, 96))
    for i in range(9):
        board.alpha_composite(load(f"{th}/UI_Yellow-Board/{i + 1}.png"), ((i % 3) * 32, (i // 3) * 32))
    save(board, "ui/board.png")
    btn = [load(f"{th}/UI_Yellow-Button/{i}.png") for i in range(1, 5)]
    save(strip(btn), "ui/button.png", frame=(14, 14), frames=4)


if __name__ == "__main__":
    for step in (backdrop, lake, pier, angler, wildlife, fish, effects, ui):
        step()
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=1) + "\n")
    print(f"{len(manifest['images'])} images, {len(manifest['sheets'])} sheets")
