"""Study 1: the sky and the distant hills.

Three versions of the sky and the hills behind the far bank, at full game
width (360 px) and game size, at each time of day, next to what the game
shows now. Built on the materials library (tools/studio/materials.py).

    python3 tools/studio/study_sky.py   -> docs/studio/studies/01-sky/

A  Haze bands: three low, rounded ridges in blue haze, flat sky bands, a
   few soft cumulus.
B  Spire skyline: the same haze, with the nearest ridge edged in the jagged
   line of fir and spruce spires and a few tall white pines standing above
   them (the north-woods horizon), and the sun or moon in the sky.
C  Big sky: the far shore of a big lake, two thin, far ridges low down,
   most of the frame sky, with layered clouds (high wisps, a cumulus bank).
"""
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from materials import TIMES, sky_bands, lerp, rgb, ramps, lit  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "studio" / "studies" / "01-sky"
W, H = 360, 260
SHOTS = Path("/tmp/claude-0/-home-user-Fishing-game/541df5d3-7b9d-5e34-adbc-c8df17111bcb/scratchpad/zoo")

# where the sun or moon sits, and the cloud colours, for each time
SUN = {"dawn": (300, 205, "#ffe0b8"), "day": (250, 40, "#fffbe8"), "golden": (290, 150, "#ffe7a0"),
       "dusk": (305, 222, "#ffb070"), "night": (80, 60, "#e8ecf4")}
CLOUD = {  # lit, mid, shade
    "dawn": ("#f6cdb8", "#d6a0a8", "#8a7a9e"),
    "day": ("#fbfcfc", "#dfe8ee", "#a8b8cc"),
    "golden": ("#ffe8b8", "#e8c49a", "#a896a6"),
    "dusk": ("#f8a878", "#c87a78", "#5e5480"),
    "night": ("#3e4a66", "#2a3450", "#1a2238"),
}


def sky(img, time, horizon_y, n=16):
    """Flat bands of varied height down to the horizon, each joined to the
    next by one row of ordered dither."""
    bands = sky_bands(time, n)
    weights = [1.5 - 0.06 * i for i in range(n)]  # bands thin toward the horizon
    total = sum(weights)
    px = img.load()
    y = 0
    for i, (c, wgt) in enumerate(zip(bands, weights)):
        bh = round(horizon_y * wgt / total) if i < n - 1 else horizon_y - y + 40
        for yy in range(y, min(H, y + bh)):
            for x in range(W):
                col = c
                if yy == y + bh - 1 and i + 1 < n and (x + yy) % 2 == 0:
                    col = bands[i + 1]
                px[x, yy] = (*rgb(col), 255)
        y += bh


def stars(img, time, seed=11):
    if time != "night":
        return
    rnd = random.Random(seed)
    px = img.load()
    for _ in range(90):
        x, y = rnd.randrange(W), rnd.randrange(0, 200)
        px[x, y] = (*rgb("#c8d0e8" if rnd.random() < 0.8 else "#fff4d6"), 255)


def disc(img, time, big=True):
    x, y, c = SUN[time]
    r = 7 if big else 5
    if time == "day":
        r = 6
    d = ImageDraw.Draw(img)
    halo = lerp(c, sky_bands(time, 16)[min(15, int(y / 15))], 0.55)
    d.ellipse([x - r - 3, y - r - 3, x + r + 3, y + r + 3], fill=rgb(halo))
    d.ellipse([x - r, y - r, x + r, y + r], fill=rgb(c))
    if time == "night":  # the moon's shadowed side
        d.ellipse([x - r + 4, y - r - 1, x + r + 4, y + r - 1], fill=rgb(halo))


def cloud(img, time, cx, cy, size, seed, flat=True, wisp=False):
    """Spheres on a flat base, lit from the sun's side as whole shapes, low
    contrast; a bright rim where the sun is behind it at dusk and dawn.
    Wisps are long, thin and flat."""
    rnd = random.Random(seed)
    lit_c, mid_c, shade_c = CLOUD[time]
    sx, sy, _ = SUN[time]
    px = img.load()
    if wisp:
        for k in range(3):
            y = cy + k * 3
            x0 = cx + rnd.randrange(-10, 10)
            ln = int(size * (1.8 - k * 0.4))
            for x in range(x0, x0 + ln):
                if 0 <= x < W and 0 <= y < H and (x * 7 + y) % 11:
                    px[x, y] = (*rgb(mid_c if k else lit_c), 255)
        return
    balls = [(cx, cy, size)]
    for _ in range(7):
        balls.append((cx + rnd.randint(-int(size * 1.6), int(size * 1.6)), cy + rnd.randint(-size // 3, size // 3), int(size * rnd.uniform(0.45, 0.8))))
    base = cy + size // 2
    lx, ly = (sx - cx), (sy - cy)
    n = math.hypot(lx, ly) or 1
    lx, ly = lx / n, ly / n
    if ly > -0.3:  # the light is mostly from above, whatever the sun's height
        ly = -0.6
        n = math.hypot(lx, ly)
        lx, ly = lx / n, ly / n
    x0, x1, y0 = max(0, cx - size * 3), min(W, cx + size * 3), max(0, cy - size * 2)
    mask = {}
    for y in range(y0, min(H, base + 1)):
        for x in range(x0, x1):
            if any(math.hypot(x - bx, y - by) <= r for bx, by, r in balls):
                mask[(x, y)] = True
    for (x, y) in mask:
        # lit where the sky is within two pixels toward the light: a rim of
        # light along the sunward edge; shade along the flat base and the
        # far side; the rest one calm mid tone
        toward_light = any((round(x + lx * k), round(y + ly * k)) not in mask for k in (1, 2))
        away = any((round(x - lx * k), round(y - ly * k)) not in mask for k in (1, 2))
        if flat and y >= base - 1:
            col = shade_c
        elif toward_light:
            col = lit_c
        elif away:
            col = shade_c
        else:
            col = mid_c
        px[x, y] = (*rgb(col), 255)


def ridge(px, colour, base, amp, period, seed, rough=0.0, tops=None):
    rnd = random.Random(seed)
    ph = rnd.uniform(0, 6.28)
    heights = []
    for x in range(W):
        t = x / period
        top = base - amp * (0.55 + 0.3 * math.sin(t * math.pi + ph) + 0.15 * math.sin(t * 2.7 * math.pi + ph * 1.7))
        if rough and rnd.random() < rough:
            top -= 1
        heights.append(int(top))
    if tops:
        tops(heights, rnd)
    for x, top in enumerate(heights):
        for y in range(max(0, top), H):
            px[x, y] = (*rgb(colour), 255)
    return heights


def spires(heights, rnd):
    """The near ridge's edge: a jagged run of fir and spruce spires, with a
    few tall white pines standing above them, flat-topped and tiered."""
    x = 0
    while x < W:
        w = rnd.choice((4, 5, 5, 6, 7))
        h = rnd.randint(6, 13)
        for k in range(w):
            xx = x + k
            if xx >= W:
                break
            rise = h - abs(k - (w - 1) / 2) * (2 * h / w)
            heights[xx] -= max(0, int(rise))
        x += w - rnd.choice((0, 1))
    # no tall white pines here: drawn this small they read as random mounds
    # in the treeline (study 1 verdict); they'll come back only as a proper
    # tiered silhouette from a white pine study


def hill_colours(time, n=3):
    bands = sky_bands(time, 10)
    horizon = bands[-1]
    forest = lit(ramps()["spruce-needles"][1], 1, 5, time)
    if time == "night":
        # by moonlight the ridges step toward the near bank's night colour
        # (the spruce under the game's night grade), not to black, so the
        # nearest ridge meets the bank instead of reading as a hole
        return [lerp(horizon, "#26344f", 0.25 + 0.75 * i / (n - 1)) for i in range(n)]
    far = lerp(horizon, bands[6], 0.4)
    return [lerp(far, forest, i / (n - 1) * 0.8) for i in range(n)]


def haze(px, y0, colour, rows=4):
    for y in range(y0, min(H, y0 + rows)):
        for x in range(W):
            if y > y0 or (x % 2 == 0):
                px[x, y] = (*rgb(colour), 255)


def version_a(time):
    img = Image.new("RGBA", (W, H))
    sky(img, time, 210)
    stars(img, time)
    for cx, cy, s, sd in ((70, 70, 14, 1), (240, 105, 11, 2), (330, 45, 9, 3)):
        cloud(img, time, cx, cy, s, sd)
    px = img.load()
    cols = hill_colours(time)
    ridge(px, cols[0], 196, 40, 140, 21)
    ridge(px, cols[1], 222, 30, 95, 22)
    ridge(px, cols[2], 246, 22, 70, 23, rough=0.4)
    haze(px, H - 5, lerp(sky_bands(time)[-1], cols[2], 0.4))
    return img


def version_b(time):
    img = Image.new("RGBA", (W, H))
    sky(img, time, 205)
    stars(img, time)
    disc(img, time)
    for cx, cy, s, sd in ((60, 80, 15, 4), (200, 55, 11, 5), (320, 120, 10, 6)):
        cloud(img, time, cx, cy, s, sd)
    px = img.load()
    cols = hill_colours(time, 4)
    ridge(px, cols[0], 192, 38, 150, 31)
    ridge(px, cols[1], 214, 28, 110, 32)
    ridge(px, cols[2], 232, 20, 80, 33)
    haze(px, 230, lerp(sky_bands(time)[-1], cols[2], 0.35), rows=4)
    ridge(px, cols[3], 258, 10, 60, 34, tops=spires)
    return img


def version_c(time):
    img = Image.new("RGBA", (W, H))
    sky(img, time, 238, n=18)
    stars(img, time)
    disc(img, time, big=False)
    for cx, cy, s, sd in ((40, 30, 30, 7), (190, 22, 36, 8), (290, 58, 24, 9), (110, 80, 20, 14)):
        cloud(img, time, cx, cy, s, sd, wisp=True)
    for cx, cy, s, sd in ((90, 196, 16, 10), (250, 190, 18, 12)):
        cloud(img, time, cx, cy, s, sd)
    px = img.load()
    cols = hill_colours(time)
    ridge(px, cols[0], 240, 14, 180, 41)
    ridge(px, cols[1], 254, 9, 120, 42, rough=0.5)
    return img


def current(time):
    """What the game shows now, from screenshots at the matching hour."""
    hour = {"dawn": 7, "day": 12, "golden": 19, "dusk": 19, "night": 23}[time]
    p = SHOTS / f"day-{hour}.png"
    if not p.exists():
        return None
    im = Image.open(p).convert("RGBA")
    scale = im.width / 405 * (405 / W)  # screenshot pixels per game pixel
    top, bottom = 150 * im.width / 810, 1000 * im.width / 810
    crop = im.crop((round(16 * im.width / 810), round(top), round(im.width - 16 * im.width / 810), round(bottom)))
    return crop.resize((W, round(crop.height * W / crop.width)), Image.NEAREST).crop((0, 0, W, H))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    versions = {"A": version_a, "B": version_b, "C": version_c}
    times = list(TIMES)
    S = 2
    for name, fn in versions.items():
        sheet = Image.new("RGB", (W * S, len(times) * (H * S + 6)), (24, 32, 32))
        for j, t in enumerate(times):
            img = fn(t)
            img.save(OUT / f"{name}-{t}.png")
            sheet.paste(img.resize((W * S, H * S), Image.NEAREST), (0, j * (H * S + 6)))
        sheet.save(OUT / f"{name}.png")
    cur = Image.new("RGB", (W * S, len(times) * (H * S + 6)), (24, 32, 32))
    for j, t in enumerate(times):
        c = current(t)
        if c:
            c.save(OUT / f"now-{t}.png")
            cur.paste(c.resize((W * S, H * S), Image.NEAREST), (0, j * (H * S + 6)))
    cur.save(OUT / "now.png")
    # side by side at one hour, for a quick look
    for t in times:
        row = Image.new("RGB", (4 * W + 18, H), (24, 32, 32))
        for k, im in enumerate([Image.open(OUT / f"now-{t}.png")] + [Image.open(OUT / f"{v}-{t}.png") for v in "ABC"]):
            row.paste(im.convert("RGB"), (k * (W + 6), 0))
        row.save(OUT / f"compare-{t}.png")
    print("done")


if __name__ == "__main__":
    main()
