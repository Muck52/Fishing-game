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

import fish_art

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
    # the sky and the distant hills are ours (study 1, version B): one image
    # per time of day, drawn in that time's light, and our drifting clouds
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent / "scenery"))
    import sky
    shades = set()
    for name, img in sky.images().items():
        save(img, f"environments/{name}.png", grade=False)
        shades |= {"#%02x%02x%02x" % p[:3] for p in img.getdata() if p[3]}
    manifest["anchors"]["sky"] = {"top": sky.TOP, "times": list(sky.TIMES), "clouds": len(sky.CLOUDS)}
    # the far bank is ours too (study 2, version C), with its waterfall's
    # water drawn on its own layer in four frames
    import bank
    land, falls, at = bank.images()
    save(land, "environments/land.png", grade=False)
    save(falls, "environments/falls.png", frame=tuple(at["frame"]), frames=4, grade=False)
    manifest["anchors"]["falls"] = at["falls"]
    manifest["anchors"]["fallsFoot"] = at["fallsFoot"]
    river_mouth, at_mouth = bank.mouth()
    save(river_mouth, "environments/river-mouth.png", frame=(at_mouth["w"], river_mouth.height), frames=4, grade=False)
    manifest["anchors"]["mouth"] = at_mouth
    for img in (land, falls):
        shades |= {"#%02x%02x%02x" % p[:3] for p in img.getdata() if p[3]}
    fixed = json.loads((ROOT / "tools" / "palette.json").read_text())
    fixed["scenery"] = sorted(shades)
    (ROOT / "tools" / "palette.json").write_text(json.dumps(fixed, indent=1) + "\n")


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
    manifest["anchors"]["hut"] = {"deck": 62, "stilts": stilts, "w": hut.width, "h": hut.height}

    # The hut's lights after dark: its window and doorway openings (the dark
    # panes in the art) lit warm, drawn over the hut at night. Only the
    # openings change, so the light sits exactly on the art.
    lit = Image.new("RGBA", hut.size)
    hp, lp = hut.load(), lit.load()
    panes = {(61, 37, 59): (255, 210, 120), (86, 88, 123): (240, 170, 90)}
    for y in range(14, 64):
        for x in range(60, hut.width):
            c = hp[x, y]
            if c[3] and c[:3] in panes:
                # brightest in the middle of each pane, a step darker at its edges
                inner = all(hp[x + dx, y + dy][:3] == c[:3] for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)])
                warm = panes[c[:3]]
                lp[x, y] = (*(warm if inner else lerp(warm, (200, 110, 70), 0.5)), 255)
    save(lit, "environments/hut-lights.png")
    tiles = load("craftpix-fishing/Pier_Tiles.png")
    save(tiles.crop((66, 64, 74, 128)), "environments/post-wet.png")
    rowboat()
    save(load("craftpix-fishing/Fishbarrel4.png"), "environments/barrel.png", actor=True)
    for i in range(1, 5):
        sheet, size = sway(load(f"craftpix-fishing/Grass{i}.png"), amp=1)
        save(sheet, f"environments/cattails-{i}.png", frame=size, frames=4, actor=True)


def rowboat():
    """The pack's skiff made into a double-ended rowboat: its curled stern
    goes and the bow is mirrored to make the other end. Two oars rest in
    their locks, blades in the water. It rocks through baked frames, tilted
    on the pixel grid, so the game never rotates it."""
    src = load("craftpix-fishing/Boat.png")
    w, h = src.size
    half = src.crop((0, 0, w // 2, h))
    hull = Image.new("RGBA", (half.width * 2, h))
    hull.alpha_composite(half, (0, 0))
    hull.alpha_composite(flip(half), (half.width, 0))
    W_, H_ = hull.width, h
    pad = 6
    boat = Image.new("RGBA", (W_ + pad * 2, H_ + pad * 2))
    wood, dark, blade = (214, 160, 100), (150, 96, 60), (190, 132, 82)

    def oar(x0, y0, x1, y1, shade):
        """Shaft from handle (x0, y0) to blade tip (x1, y1); the last third is
        a wider blade."""
        n = max(abs(x1 - x0), abs(y1 - y0))
        d = ImageDraw.Draw(boat)
        for i in range(n + 1):
            t = i / n
            x, y = round(x0 + (x1 - x0) * t), round(y0 + (y1 - y0) * t)
            d.point((x, y), fill=(*shade, 255))
            if t > 0.68:  # the blade
                d.point((x + 1, y), fill=(*blade, 255))
                d.point((x - 1, y), fill=(*blade, 255))
    # the far oar, behind the hull, then the hull, then the near oar
    oar(pad + W_ // 2 + 4, pad + 1, pad + W_ - 4, pad + H_ + 4, dark)
    boat.alpha_composite(hull, (pad, pad))
    oar(pad + W_ // 2 - 4, pad - 2, pad + 6, pad + H_ + 4, wood)
    # oarlocks on the gunwale
    for x in (pad + W_ // 2 - 6, pad + W_ // 2 + 6):
        boat.putpixel((x, pad + 1), (*OUTLINE, 255))
    frames = [boat.rotate(a, resample=Image.Resampling.NEAREST) for a in (0, 2.5, 0, -2.5)]
    save(strip(frames), "environments/boat.png", frame=boat.size, frames=4, actor=True)


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
    walk = cut(load(f"{cf}/Fisherman_walk.png"), 48)
    turned = [flip(f) for f in idle + fish + hook[3:] + hurt[1:]]
    # The fishing pose with the rod cut away (everything in front of his
    # hands), so the game can draw a live rod that bends with the fight.
    GRIP_X = 21
    body = []
    grips = []
    for f in turned[4:8]:
        b = f.copy()
        bp = b.load()
        for y in range(48):
            for x in range(GRIP_X):
                bp[x, y] = (0, 0, 0, 0)
        ys = [y for y in range(20, 34) if f.getpixel((GRIP_X - 1, y))[3]]
        grips.append({"x": GRIP_X, "y": round(sum(ys) / len(ys)) if ys else 27})
        body.append(b)
    frames = turned + body + [flip(f) for f in walk]
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
    manifest["anchors"]["angler"] = {"idle": [0, 3], "fish": [4, 7], "land": [8, 10], "hurt": 11, "body": [12, 15], "walk": [16, 21], "tips": tips, "grips": grips}
    save(load(f"{cf}/Icons_16.png"), "ui/bucket.png")


# ---------------------------------------------------------------- wildlife
CREATURES = ["deer", "fox", "hare", "bear", "gull", "sparrow", "mallard", "eagle", "minnow"]


def wildlife():
    """The lake's animals, each drawn by its own script in tools/characters
    with the shared kit (kit.py): the same palette, outline, scale and
    construction as Olive. Their sheets are saved as drawn (already in the
    palette) and their animation tables go into the manifest."""
    import importlib
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent / "characters"))
    table = {}
    for name in CREATURES:
        mod = importlib.import_module(name)
        strip, index = mod.sheet()
        save(strip, f"characters/{name}.png", key=name, frame=(mod.FW, mod.FH), frames=strip.width // mod.FW, grade=False)
        table[name] = index
    manifest["anchors"]["creatures"] = table


# ---------------------------------------------------------------- fish
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
    p = np.pad(body, 1)
    ring = p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
    out[ring & ~body] = (*OUTLINE, 255)
    return Image.fromarray(out)


def fish():
    """Every species, painted by tools/fish_art.py straight onto the grid: a
    small one that swims and a large one for the journal card."""
    info = {}
    for sid in fish_art.SPECIES:
        img = fish_art.paint(sid, fish_art.LENGTH[sid])
        card = fish_art.paint(sid, min(150, round(fish_art.LENGTH[sid] * 3.4)), card=True)
        w, h = img.size
        # A swimming wave that runs from head to tail: each column of the
        # body is lifted by a sine that lags further behind toward the tail,
        # and grows from almost nothing at the head to the full sweep at the
        # tail fin. The head nods a little against it, as real fish do.
        frames = []
        n = 6
        for f in range(n):
            out = Image.new("RGBA", (w, h + 4))
            sp = img.load()
            dp = out.load()
            for x in range(w):
                t = x / (w - 1)  # 0 at the nose (the art faces left), 1 at the tail tip
                amp = 0.35 + 1.6 * max(0, t - 0.35) ** 1.5 / 0.65 ** 1.5
                dy = round(amp * math.sin(f / n * math.pi * 2 - t * math.pi * 1.4))
                for y in range(h):
                    if sp[x, y][3]:
                        dp[x, y + 2 + dy] = sp[x, y]
            frames.append(out)
        save(strip(frames), f"fish/{sid}.png", key=f"fish-{sid}", frame=(w, h + 4), frames=n, actor=True)
        save(card, f"fish/{sid}-card.png", key=f"card-{sid}", actor=True)
        info[sid] = {"w": w, "h": h}
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

    # tiny ripples: a pair of short glints that spread apart and fade
    tw, th_ = 22, 3
    tiny = []
    for k in range(5):
        fr = Image.new("RGBA", (tw, th_))
        r = 2 + k * 2
        c = (250, 255, 255) if k < 2 else (200, 236, 240) if k < 4 else (140, 196, 210)
        for side in (-1, 1):
            for i in range(2 if k < 4 else 1):
                x = tw // 2 + side * (r + i) - (1 if side < 0 else 0)
                fr.putpixel((x, 1), (*c, 255))
                if k < 3:
                    fr.putpixel((x, 2), (30, 70, 98, 255))  # the dark trough under the glint
        if k < 2:
            fr.putpixel((tw // 2, 0), (*c, 255))
        tiny.append(fr)
    save(strip(tiny), "effects/ripple-tiny.png", frame=(tw, th_), frames=5)
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

    # a firefly: one hot pixel in a dim halo
    fly = Image.new("RGBA", (5, 5))
    for x, y in [(1, 2), (3, 2), (2, 1), (2, 3)]:
        fly.putpixel((x, y), (180, 200, 80, 255))
    fly.putpixel((2, 2), (255, 250, 170, 255))
    save(fly, "effects/firefly.png", grade=False)

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


def backpack():
    """The backpack: the inventory's button and its picture. Drawn straight
    onto the grid in palette colours (so the palette pass leaves it alone):
    a canvas body with a leather flap, straps and a brass buckle, a front
    pocket, and the shared outline. Four frames: closed, the flap lifting,
    open, and open with what's inside bobbing up (a fish's tail and a float)."""
    hexc = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    BODY, BODY_LT, BODY_DK = hexc("#a9805f"), hexc("#daab76"), hexc("#704a30")
    FLAP, FLAP_LT, FLAP_DK = hexc("#90453b"), hexc("#b77357"), hexc("#543426")
    BRASS, GLINT, DEEP, INSIDE = hexc("#c79a49"), hexc("#ffd84a"), hexc("#25131a"), hexc("#342a24")
    TAIL, TAIL_LT, RED, CREAM = hexc("#86a398"), hexc("#b0ecf0"), hexc("#e84a3a"), hexc("#fff4d6")
    edge = OUTLINE + (255,)

    def frame(stage):
        im = Image.new("RGBA", (24, 24))
        px = im.load()

        def put(x, y, c):
            if 0 <= x < 24 and 0 <= y < 24:
                px[x, y] = c

        # side pockets, then the body: canvas lit from the left
        for y in range(13, 20):
            put(3, y, BODY_DK)
            put(20, y, BODY_DK)
        for y in range(9, 21):
            for x in range(4, 20):
                if (x, y) in ((4, 9), (19, 9), (4, 20), (19, 20)):
                    continue
                put(x, y, BODY_LT if x == 4 else BODY_DK if x >= 18 or y == 20 else BODY)
        # the front pocket with its own little flap and buckle
        for y in range(15, 20):
            for x in range(8, 16):
                put(x, y, BODY_DK if y == 19 else BODY)
        for x in range(8, 16):
            put(x, 14, FLAP)
            put(x, 15, FLAP_DK)
        put(11, 15, BRASS)
        put(12, 15, BRASS)
        # shoulder straps down the front
        for y in range(9, 21):
            put(7, y, FLAP_DK)
            put(16, y, FLAP_DK)

        if stage == 0:
            # the flap, buckled down
            for y in range(8, 14):
                for x in range(5, 19):
                    if (x, y) in ((5, 13), (18, 13)):
                        continue
                    put(x, y, FLAP_LT if y == 8 or x == 5 else FLAP_DK if y == 13 else FLAP)
            for y in range(12, 15):
                put(11, y, FLAP_DK)
                put(12, y, FLAP_DK)
            put(11, 13, GLINT)
            put(12, 13, BRASS)
        elif stage == 1:
            # the flap lifting: a sliver of the dark inside shows
            for x in range(6, 18):
                put(x, 9, INSIDE)
                put(x, 10, DEEP)
            for y in range(5, 10):
                for x in range(5, 19):
                    if (x, y) in ((5, 5), (18, 5)):
                        continue
                    put(x, y, FLAP_LT if y == 5 or x == 5 else FLAP_DK if y == 9 else FLAP)
            put(11, 10, FLAP_DK)
            put(12, 10, FLAP_DK)
            put(11, 11, BRASS)
            put(12, 11, BRASS)
        else:
            # open: the flap thrown back shows its paler underside
            bob = 1 if stage == 3 else 0
            for y in range(1, 7):
                for x in range(5, 19):
                    if (x, y) in ((5, 1), (18, 1)):
                        continue
                    put(x, y, FLAP if y == 6 else FLAP_LT)
            for y in range(7, 11):
                for x in range(5 if y > 7 else 6, 19 if y > 7 else 18):
                    put(x, y, DEEP if y < 10 else INSIDE)
            put(11, 0, FLAP_DK)
            put(12, 0, FLAP_DK)
            put(11, 1, BRASS)
            put(12, 1, GLINT)
            # what's inside, peeking out
            for (x, y, c) in ((7, 6, TAIL), (9, 6, TAIL), (7, 7, TAIL), (8, 7, TAIL), (9, 7, TAIL), (8, 8, TAIL_LT), (8, 9, TAIL)):
                put(x, y - bob, c)
            for (x, y, c) in ((14, 6, RED), (15, 6, RED), (14, 7, RED), (15, 7, CREAM), (14, 8, CREAM), (14, 9, FLAP_DK)):
                put(x, y - bob, c)
        # the shared outline round everything
        a = np.array(im)
        solid = a[..., 3] > 0
        pad = np.pad(solid, 1)
        ring = ~solid & (pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:])
        a[ring] = edge
        im = Image.fromarray(a).copy()
        px = im.load()
        if stage == 0:
            # the carrying loop on top
            for (x, y) in ((10, 5), (11, 5), (12, 5), (13, 5), (9, 6), (14, 6)):
                px[x, y] = edge
            px[11, 5] = FLAP_DK
            px[12, 5] = FLAP_DK
        if stage == 3:
            px[3, 3] = CREAM  # a glint
        return im

    save(strip([frame(i) for i in range(4)]), "ui/backpack.png", frame=(24, 24), frames=4, grade=False)


def journal():
    """The field journal: its button picture, a worn leather notebook that
    opens, and the notebook page every fish gets. Drawn in palette colours
    straight onto the grid (the palette pass leaves them alone)."""
    hexc = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    LEATHER, LEATHER_LT, LEATHER_DK = hexc("#704a30"), hexc("#a9805f"), hexc("#543426")
    WORN, STITCH, BRASS, GLINT = hexc("#ae7764"), hexc("#f2d797"), hexc("#c79a49"), hexc("#ffd84a")
    PAPER, PAPER_DK, RULE, RIBBON = hexc("#f5f2db"), hexc("#ebd9a1"), hexc("#b2d0d0"), hexc("#c25f62")
    INKY = hexc("#6e5e50")
    edge = OUTLINE + (255,)

    def outline(im):
        a = np.array(im)
        solid = a[..., 3] > 0
        pad = np.pad(solid, 1)
        ring = ~solid & (pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:])
        a[ring] = edge
        return Image.fromarray(a).copy()

    def icon(stage):
        im = Image.new("RGBA", (24, 24))
        px = im.load()

        def put(x, y, c):
            if 0 <= x < 24 and 0 <= y < 24:
                px[x, y] = c

        if stage == 0:
            # closed: the page block showing at the edge, then the cover
            for y in range(4, 22):
                put(20, y, PAPER if y % 2 else PAPER_DK)
            for x in range(5, 21):
                put(x, 21, PAPER_DK)
            for y in range(3, 21):
                for x in range(4, 20):
                    c = LEATHER
                    if x <= 6:
                        c = LEATHER_DK  # the spine
                    elif y == 3 or x == 7:
                        c = LEATHER_LT
                    elif y == 20 or x == 19:
                        c = LEATHER_DK
                    put(x, y, c)
            for y in range(5, 20, 3):
                put(5, y, STITCH)  # stitching down the spine
            # worn, scuffed patches and rubbed corners
            for (x, y) in ((9, 5), (10, 5), (16, 17), (17, 17), (17, 16), (12, 18), (18, 4), (19, 4), (19, 20), (18, 20)):
                put(x, y, WORN)
            # a little fish pressed into the cover
            for (x, y) in ((10, 8), (11, 7), (12, 7), (13, 7), (11, 9), (12, 9), (13, 9), (14, 8), (15, 7), (15, 9), (11, 8), (12, 8), (13, 8)):
                put(x, y, LEATHER_LT)
            put(11, 8, LEATHER_DK)
            # the strap and brass clasp
            for x in range(14, 22):
                put(x, 12, LEATHER_DK)
                put(x, 13, LEATHER_DK)
            put(18, 11, BRASS)
            put(19, 11, BRASS)
            put(18, 12, GLINT)
            put(19, 12, BRASS)
            put(18, 13, BRASS)
            put(19, 13, BRASS)
            # the red ribbon bookmark trailing out of the bottom
            for y in range(21, 24):
                put(14, y, RIBBON)
            put(13, 23, RIBBON)
            put(15, 23, RIBBON)
            put(14, 23, (0, 0, 0, 0))
        elif stage == 1:
            # the cover swinging open: the page block, and the cover seen
            # edge-on as it turns toward you
            for y in range(4, 21):
                for x in range(8, 21):
                    put(x, y, PAPER_DK if x == 20 or y == 20 else PAPER)
            for y in range(6, 19, 3):
                for x in range(10, 19):
                    put(x, y, RULE)
            for y in range(2, 23):
                for x in range(3, 8):
                    put(x, y, LEATHER_DK if x == 3 else LEATHER_LT if x == 7 else LEATHER)
            put(5, 6, WORN)
            put(4, 17, WORN)
            for x in range(0, 3):
                put(x, 12, LEATHER_DK)  # the strap hanging loose
            put(0, 13, BRASS)
            for y in range(20, 24):
                put(15, y, RIBBON)
        else:
            # open flat: two pages, a gutter, the cover peeking round them
            for y in range(6, 21):
                for x in range(1, 23):
                    put(x, y, LEATHER)
            for y in range(5, 20):
                for x in range(2, 22):
                    put(x, y, PAPER_DK if x in (11, 12) else PAPER)
            for y in range(8, 19, 2):
                for x in range(3, 10):
                    if (x + y) % 5:
                        put(x, y, RULE)
                for x in range(14, 21):
                    if (x * 3 + y) % 7:
                        put(x, y, RULE)
            # a fish sketched on the left page
            for (x, y) in ((4, 11), (5, 10), (6, 10), (7, 10), (5, 12), (6, 12), (7, 12), (8, 11), (9, 10), (9, 12)):
                put(x, y, INKY)
            # the ribbon bookmark
            for y in range(19, 23):
                put(12, y, RIBBON)
            put(11, 22, RIBBON)
            if stage == 3:
                # a page lifting at the corner
                for (x, y) in ((19, 4), (20, 4), (21, 4), (20, 3), (21, 3)):
                    put(x, y, PAPER)
                for (x, y) in ((20, 5), (21, 5)):
                    put(x, y, PAPER_DK)
        return outline(im)

    save(strip([icon(i) for i in range(4)]), "ui/journal.png", frame=(24, 24), frames=4, grade=False)

    # The book as you'd hold it to read: the right-hand page lying flat and
    # facing you, the left half of the book lifted toward you on its spine
    # by your hand. Drawn the way perspective works: swung up about the
    # spine, the left page is foreshortened to a sliver of its width; its
    # free edge, nearer to you, looks taller, so its top and bottom edges
    # slope out from the spine (a trapezoid); it bows up out of the gutter
    # rather than standing flat; it darkens toward the spine and casts a
    # soft shadow on the page beside it; the gutter is the darkest line in
    # the book. The cover board overhangs the pages, and the page edges
    # show the book's thickness. We're well into the book, so the lifted
    # half is thick with turned pages: a deep block of page edges along its
    # free edge and its top and bottom (deeper toward the free edge, which
    # is nearer), a few pages standing proud of the rest, and the cover
    # board behind them.
    LEATHER_MID = hexc("#833f4c")
    BASE, AGED, DEEP, EDGE2 = hexc("#f0ecd0"), hexc("#ebd9a1"), hexc("#e7cd8d"), hexc("#daab76")
    IW, IH = 360, 464
    PX0, PX1, PY0, PY1 = 60, 296, 42, 417  # the right page's paper
    SP = 57  # the spine, at the gutter
    OUTER = 24  # the lifted page's free edge
    RISE = 18  # how much taller the near edge looks
    im = Image.new("RGBA", (IW, IH))
    px = im.load()

    def leather(x, y):
        n = hash01(x, y, 21)
        if hash01(x // 7, y // 7, 4) > 0.9 and n > 0.35:
            return WORN
        return LEATHER_DK if n < 0.14 else LEATHER_MID if n > 0.97 else LEATHER

    # the right board, overhanging the page on three sides, stitched
    for y in range(PY0 - 9, PY1 + 14):
        for x in range(SP, PX1 + 12):
            px[x, y] = leather(x, y)
    for x in range(SP + 4, PX1 + 8):
        if x % 6 < 3:
            px[x, PY0 - 5] = STITCH
            px[x, PY1 + 9] = STITCH
    for y in range(PY0 - 4, PY1 + 9):
        if y % 6 < 3:
            px[PX1 + 7, y] = STITCH
    # its page block: the edges of the pages beneath along the right and
    # bottom, then the page
    for k in range(4):
        for y in range(PY0 + k, PY1 + 1 + k):
            px[PX1 + k, y] = EDGE2 if k % 2 else AGED
        for x in range(SP + 2, PX1 + k):
            px[x, PY1 + k] = EDGE2 if k % 2 else AGED
    for y in range(PY0, PY1):
        for x in range(SP + 2, PX1):
            n = hash01(x, y, 11)
            d = min(PX1 - 1 - x, y - PY0, PY1 - 1 - y)
            c = BASE if n > 0.025 else AGED
            if d < 2 or (d < 6 and n < 0.3) or (d < 12 and n < 0.06):
                c = AGED
            g = x - SP
            # the shadow of the lifted page, and the page curving into the gutter
            if g < 5 or (g < 10 and n < 0.7) or (g < 16 and n < 0.35):
                c = DEEP
            elif g < 24 and n < 0.15:
                c = AGED
            px[x, y] = c
    # the lifted half: its top and bottom edges run from the spine out to the
    # nearer, taller free edge, bowing as they leave the gutter
    def edge_y(x, top):
        t = (SP - x) / (SP - OUTER)
        bow = t ** 0.7
        return round((PY0 - RISE * bow) if top else (PY1 + RISE * bow))
    T = 13  # the turned pages' thickness at the free edge
    C = 9  # the cover board round them: its inside face, then its thick edge
    for x in range(OUTER - T - C, SP):
        xe = max(x, OUTER)
        t = (SP - xe) / (SP - OUTER)
        y0, y1 = edge_y(xe, True), edge_y(xe, False)
        band = round(1 + 7 * t)  # the page block seen along the top and bottom
        for y in range(y0 - band - C, y1 + band + C + 1):
            if x >= OUTER and y0 <= y <= y1:
                n = hash01(x, y, 13)
                # the top page curves: lit across its middle, shading down
                # into the gutter and a little as it curls to its free edge
                v = 1 - abs(t - 0.6) / 0.6
                if t < 0.1:
                    c = DEEP if n > 0.25 else EDGE2
                elif v > 0.85:
                    c = hexc("#f5f2db") if n > 0.3 else BASE
                elif v > 0.6:
                    c = BASE if n > 0.08 else AGED
                elif v > 0.35:
                    c = AGED if n < (0.6 - v) * 2.5 else BASE
                elif v > 0.18:
                    c = AGED if n > 0.25 else DEEP
                else:
                    c = DEEP if n > 0.4 else AGED
                px[x, y] = c
                continue
            # the edges of the turned pages: fine lines, each page a shade
            # different, a few standing proud of the rest
            if x < OUTER:
                k = OUTER - 1 - x  # which page, counting back into the block
                proud = hash01(0, y // 3, 8) > 0.82
                tip = round(hash01(k, 1, 9) * 3)  # each page ends a little short or long
                reach = band + (k * band) // T
                if k < T - (0 if proud else 1) and y0 - reach + tip <= y <= y1 + reach - tip:
                    if k == 0:
                        c = DEEP  # the shadow of the top page on the pages below
                    else:
                        # each page's edge a shade of its own, darker deeper in
                        deep = k / T
                        light = BASE if k % 2 else AGED
                        c = light if deep < 0.45 else (AGED if k % 2 else EDGE2) if deep < 0.8 else (EDGE2 if k % 2 else DEEP)
                        if hash01(x, y // 2, 6) < 0.06:
                            c = DEEP  # a page edge catching in shadow
                    px[x, y] = c
                    continue
            elif y0 - band <= y < y0 or y1 < y <= y1 + band:
                k = (y0 - y) if y < y0 else (y - y1)  # which page along the top or bottom
                dip = hash01(x // 5, k, 7) < 0.12  # a page tip dipping out of line
                if k == 1:
                    c = DEEP
                elif dip:
                    c = EDGE2
                else:
                    deep = k / max(1, band)
                    c = (BASE if k % 2 else AGED) if deep < 0.5 else (AGED if k % 2 else EDGE2)
                px[x, y] = c
                continue
            # the cover board behind the pages: its inside face, stitched,
            # then the board's own thickness turned toward you, darker, with
            # a worn highlight along its outer corner
            d = min(x - (OUTER - T - C), y - (y0 - band - C), (y1 + band + C) - y)
            if d < 1:
                px[x, y] = LEATHER_LT
            elif d < 5:
                px[x, y] = LEATHER_DK if hash01(x, y, 3) > 0.2 else LEATHER
            elif d == 6 and (x + y) % 6 < 3:
                px[x, y] = STITCH
            else:
                px[x, y] = leather(x, y)
    # faint lines of writing on the lifted page, squeezed by the foreshortening
    # and converging with its edges
    for j in range(1, 26):
        f = j / 26
        for x in range(OUTER + 3, SP - 6):
            if hash01(x, j, 2) < 0.25:
                continue
            y0, y1 = edge_y(x, True), edge_y(x, False)
            y = round(y0 + (y1 - y0) * (0.08 + 0.84 * f))
            if (x + j) % 7 < 5:
                px[x, y] = hexc("#d3c7a8") if px[x, y] == BASE else hexc("#b3a697")
    # the gutter: the darkest line in the book
    for y in range(PY0 - 9, PY1 + 14):
        px[SP, y] = OUTLINE + (255,)
        px[SP + 1, y] = LEATHER_DK
    # A well-used cover: the corners knocked round and soft, the edges
    # frayed with little nicks, the leather rubbed paler along its edges and
    # paler still at the corners where hands hold it, and a few stitches
    # worn through.
    a = np.array(im)
    leathers = {LEATHER[:3], LEATHER_DK[:3], LEATHER_MID[:3], WORN[:3], LEATHER_LT[:3], STITCH[:3]}
    is_leather = np.zeros(a.shape[:2], bool)
    for c in leathers:
        is_leather |= (a[..., :3] == c).all(-1) & (a[..., 3] > 0)
    solid = a[..., 3] > 0
    # round the corners: a cover pixel with too little cover around it is a
    # corner tip, worn away
    R = 7
    pad = np.pad(solid, R)
    near = np.zeros(solid.shape, np.int32)
    total = 0
    for dy in range(-R, R + 1):
        for dx in range(-R, R + 1):
            if dx * dx + dy * dy <= R * R:
                near += pad[R + dy:R + dy + solid.shape[0], R + dx:R + dx + solid.shape[1]]
                total += 1
    worn_off = is_leather & (near < total * 0.5)
    a[worn_off] = 0
    solid = a[..., 3] > 0
    # how far each pixel is from the cover's edge, in pixels
    dist = np.where(solid, 99, 0)
    outside = ~solid
    for d in range(1, 5):
        grown = outside.copy()
        grown[1:] |= outside[:-1]
        grown[:-1] |= outside[1:]
        grown[:, 1:] |= outside[:, :-1]
        grown[:, :-1] |= outside[:, 1:]
        dist[(dist == 99) & grown] = d
        outside = grown
    corner = near < total * 0.62  # close to a corner
    hh, ww = solid.shape
    for y in range(hh):
        for x in range(ww):
            if not is_leather[y, x] or not solid[y, x]:
                continue
            n = hash01(x, y, 31)
            d = dist[y, x]
            if d == 1 and n < 0.07:
                a[y, x] = 0  # a nick out of the edge
            elif d == 1:
                # the soft leather rolled over the board's edge, in shadow,
                # rubbed through here and there
                a[y, x] = WORN if n < (0.4 if corner[y, x] else 0.18) else LEATHER_DK
            elif d <= 3 and tuple(a[y, x, :3]) != STITCH[:3]:
                # the padded swell just inside it, catching the light
                a[y, x] = LEATHER_LT if n < (0.3 if corner[y, x] else 0.12) else WORN if n < 0.75 else LEATHER
            elif d <= 5 and corner[y, x] and n < 0.35:
                a[y, x] = WORN  # corners rubbed pale by thumbs
            elif tuple(a[y, x, :3]) == STITCH[:3] and hash01(x // 3, y // 3, 32) < 0.2:
                a[y, x] = LEATHER if n > 0.3 else LEATHER_DK  # a stitch worn through
    im = Image.fromarray(a).copy()
    im = outline(im)
    px = im.load()
    # a soft shadow under the book
    for x in range(SP, PX1 + 14):
        for y in range(PY1 + 15, PY1 + 18):
            if not px[x, y][3]:
                px[x, y] = (16, 20, 28, 110)
    save(im, "ui/journal-held.png", grade=False)
    # where the book's drawing starts and ends across the image, so the game
    # can centre it on the screen
    cols = [x for x in range(IW) if any(im.getpixel((x, y))[3] > 200 for y in range(IH))]
    manifest["anchors"]["journal"] = {
        "x0": cols[0], "x1": cols[-1], "h": IH, "spine": SP + 1,
        "page": {"x0": PX0 - 1, "x1": PX1, "y0": PY0, "y1": PY1},
        "held": {"x": OUTER, "rise": RISE},
    }


def olive():
    """Olive, the angler's dog: her own character, drawn and animated in
    tools/characters/olive.py. Her sheet and its animation table go into the
    manifest under her name, with where her paws stand and where the water
    comes up to when she swims."""
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent / "characters"))
    import olive as rig
    strip, index = rig.sheet()  # also writes her json and previews
    save(strip, "characters/olive/olive.png", key="olive", frame=(rig.FW, rig.FH), frames=strip.width // rig.FW, grade=False)
    manifest["anchors"]["olive"] = index
    manifest["anchors"]["olive-at"] = {"feet": rig.FEET + 1, "waterline": rig.WATERLINE}


# ---------------------------------------------------------------- fonts
OUTLINE = (37, 19, 26)  # the one dark edge colour shared by every actor and all lettering
CHARS = [chr(c) for c in range(32, 127)] + ["\u00b7"]


def font(name, ttf, size, outline=True, bold=False):
    """Bakes a TrueType pixel font into a bitmap font: white letters with
    a dark one-pixel outline and a drop shadow, ready to tint in game.

    outline=False gives plain letters, for ink on a page; bold=True doubles
    every upright stroke, keeping the gaps between strokes open."""
    f = ImageFont.truetype(str(SRC / ttf), size)
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
        if ch == "\u00b7":
            # a middle dot, set at the middle of the small letters
            m[:] = False
            cx = max(1, adv // 2)
            cy = 1 + asc - max(2, asc * 3 // 10)
            m[cy:cy + 2, cx:cx + 2] = True
            adv = max(adv, 4)
        if bold:
            # thicken each upright stroke by repeating its column, so the
            # letter grows wider instead of smudging over its own gaps: the
            # openings in m, w, # and " stay open. Columns that only cross a
            # bar (the tops of o, n and m) are left single.
            cols, extra = [], 0
            for x in range(m.shape[1]):
                cols.append(m[:, x])
                col = m[:, x]
                if (col[1:] & col[:-1]).any():  # a vertical stroke: two or more pixels running down
                    cols.append(m[:, x])
                    extra += 1
            m = np.stack(cols, 1)[:, :w + extra] if cols else m
            if extra == 0 and m.any():
                # all diagonals and curves (s, x, v, z): thicken a pixel to
                # the right wherever that doesn't close a gap
                grow = np.roll(m, 1, 1) & ~np.roll(m, -1, 1)
                grow[:, 0] = False
                m = m | grow
                extra = 1
            adv += extra
            w = max(1, adv) + 3
            if m.shape[1] < w:
                m = np.pad(m, ((0, 0), (0, w - m.shape[1])))
            m = m[:, :w]
        out = np.zeros((cell_h, w, 4), np.uint8)
        ring = np.zeros_like(m)
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, -1), (-1, 1), (1, 1), (0, 2), (1, 2), (-1, 2)]:
            ring |= np.roll(np.roll(m, dy, 0), dx, 1)
        if outline:
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
    """One family for every word in the game: Monogram by datagoblin (CC0),
    a small, friendly pixel hand drawn at its native 16px. Over the scene it
    wears the shared outline; on paper it's plain ink. Bold is the same
    letters with every stroke a pixel wider."""
    MONO = "monogram/monogram-extended.ttf"
    font("body", MONO, 16)
    font("head", MONO, 16, bold=True)
    font("ink", MONO, 16, outline=False)
    font("ink-bold", MONO, 16, outline=False, bold=True)
    font("ink-small", MONO, 16, outline=False)


# ---------------------------------------------------------------- palette
# A few colours every scene needs exactly, whatever the packs average out to.
KEY_COLORS = [OUTLINE, (255, 244, 214), (255, 216, 74), (232, 74, 58), (138, 208, 106), (14, 34, 56), (44, 92, 120), (176, 236, 240)]


def palette_pass():
    """Recolours every graded image to one master palette.

    The palette is fixed in tools/palette.json: it began as the 56 colours
    that best covered all the packs together (a median cut), plus the key
    colours above and the interface art's own colours, and has the shades
    added for the creatures in tools/characters. Then
    each actor's dark edge pixels are set to the shared outline colour.
    """
    arrays = [np.array(Image.open(p).convert("RGBA")) for p, _ in GRADED]
    # the palette is fixed in tools/palette.json (it began as a median cut
    # over the packs), so redrawing or dropping art never shifts it
    fixed = json.loads((ROOT / "tools" / "palette.json").read_text())
    rgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))  # noqa: E731
    # graded art snaps to the original colours; the creature shades (drawn
    # straight in the palette, never graded) are listed with them
    colors = np.array(sorted({rgb(h) for h in fixed["colours"]}), np.int32)
    listed = np.array(sorted({rgb(h) for h in fixed["colours"] + fixed["creatures"] + fixed.get("scenery", [])}), np.int32)
    # sorted by brightness for the swatch sheet in the docs
    listed = listed[np.argsort(listed @ np.array([3, 6, 1]))]
    sw = Image.new("RGB", (len(listed) * 8, 8))
    for i, c in enumerate(listed):
        sw.paste(tuple(int(v) for v in c), (i * 8, 0, i * 8 + 8, 8))
    sw.save(ROOT / "docs/palette.png")
    manifest["palette"] = ["#%02x%02x%02x" % tuple(int(v) for v in c) for c in listed]

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
    for step in (backdrop, lake, pier, angler, wildlife, fish, effects, ui, backpack, journal, olive, fonts, palette_pass):
        step()
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=1) + "\n")
    print(f"{len(manifest['images'])} images, {len(manifest['sheets'])} sheets")
