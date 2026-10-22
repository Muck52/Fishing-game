"""Study 7: the land animals (Olive, the deer, fox, hare and bear).

On the new beach they looked flat: big areas of one colour, lit only along
their top and bottom rows, while the scenery round them is lit as rounded
masses from the upper left. This study tries three ways of lighting and
texturing them, on the finished sheets (the drawing and animation stay the
same; only how the pixels are lit changes):

- **A, lit as one mass:** each animal lit like the bank's rock and trees:
  toward the sun (upper left) a band of light, away from it (lower right) a
  band of shade, one calm tone between, worked out afresh from each frame's
  silhouette so it moves with the body.
- **B, mass and fur:** A, plus fur: where two different colours of coat
  meet (a deer's white throat and tan neck, a fox's white chest and red
  flank) the edge interlocks like hair instead of running straight.
- **C, sunlit fur:** B, plus the light of the scene: a warm rim where the
  sun catches the top of the back, and a cool, faint light bounced up from
  the sand along the belly.

All three also get, in the game itself, a soft shadow under each animal,
and the visitors now walk through the cattails to stop on the open sand
(src/wildlife/Wildlife.js), so they aren't hidden behind the reeds.

    python3 tools/studio/study_land.py   -> docs/studio/studies/07-land/
"""
import colorsys
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "assets" / "art"
OUT = ROOT / "docs" / "studio" / "studies" / "07-land"
LAND = ["olive", "deer", "fox", "hare", "bear"]
OUTLINE = (37, 19, 26)


def hsv(c):
    return colorsys.rgb_to_hsv(*(x / 255 for x in c))


def rgb_of(h, s, v):
    return tuple(round(max(0, min(1, x)) * 255) for x in colorsys.hsv_to_rgb(h % 1, s, v))


def toward(h, target, amount):
    d = (target - h + 0.5) % 1 - 0.5
    return h + max(-amount, min(amount, d))


def light(c, k=1.0):
    h, s, v = hsv(c)
    return rgb_of(toward(h, 50 / 360, 12 / 360 * k), s * (1 - 0.12 * k), min(1, v * (1 + 0.14 * k) + 0.04 * k))


def shade(c, k=1.0):
    h, s, v = hsv(c)
    return rgb_of(toward(h, 250 / 360, 14 / 360 * k), min(1, s * (1 + 0.1 * k) + 0.04 * k), v * (1 - 0.2 * k))


def warm_rim(c):
    h, s, v = hsv(c)
    return rgb_of(toward(h, 40 / 360, 20 / 360), s * 0.8, min(1, v * 1.3 + 0.12))


def bounce(c):
    h, s, v = hsv(c)
    return rgb_of(toward(h, 200 / 360, 18 / 360), s * 0.85, min(1, v * 1.1 + 0.05))


def reach(mask, x, y, dx, dy, cap=10):
    k = 0
    while k < cap and (x + dx * (k + 1), y + dy * (k + 1)) in mask:
        k += 1
    return k


def is_mark(c):
    """The outline, eyes, noses: left as drawn."""
    return c == OUTLINE or sum(c) < 70


def light_frame(img, mode):
    px = img.load()
    w, h = img.size
    body = {(x, y) for y in range(h) for x in range(w) if px[x, y][3] and not is_mark(px[x, y][:3])}
    out = img.copy()
    op = out.load()
    v_of = {}
    for x, y in body:
        a, b = reach(body, x, y, -1, -1), reach(body, x, y, 1, 1)
        u, d = reach(body, x, y, 0, -1), reach(body, x, y, 0, 1)
        if a + b < 3 and u + d < 3:
            continue  # legs, ears, tails: too thin to model
        v_of[(x, y)] = 0.55 * (b - a) / (a + b + 1) + 0.45 * (d - u) / (d + u + 1)
    for (x, y), v in v_of.items():
        c = px[x, y][:3]
        band = 1 if v > 0.3 else -1 if v < -0.3 else 0
        if band > 0:
            op[x, y] = (*light(c, 0.8), 255)
        elif band < 0:
            op[x, y] = (*shade(c, 0.8), 255)
    if mode in ("B", "C"):
        # where two coat colours meet across a row, the edge interlocks like
        # hair: every other column the colour below reaches up a pixel
        src = out.copy().load()
        for x, y in body:
            if (x, y + 1) in body and (x + y) % 2 == 0:
                c0, c1 = px[x, y][:3], px[x, y + 1][:3]
                h0, h1 = hsv(c0), hsv(c1)
                different = abs(h0[2] - h1[2]) > 0.25 and (abs(h0[1] - h1[1]) > 0.2 or min(abs(h0[0] - h1[0]), 1 - abs(h0[0] - h1[0])) > 0.08)
                if different and (x, y - 1) in body:
                    op[x, y] = src[x, y + 1]
    if mode == "C":
        for x, y in body:
            above = (x, y - 1) not in body
            below = (x, y + 1) not in body
            if above and (x, y) in v_of and v_of[(x, y)] > 0.1:
                op[x, y] = (*warm_rim(px[x, y][:3]), 255)  # the sun catching the back
            elif below and (x, y - 1) in body and (x, y) in v_of:
                op[x, y - 1] = (*bounce(px[x, y - 1][:3]), 255)  # light bounced up from the sand
    return out


def treat(path, fw, mode):
    img = Image.open(path).convert("RGBA")
    n = img.width // fw
    out = Image.new("RGBA", img.size)
    for i in range(n):
        f = img.crop((i * fw, 0, (i + 1) * fw, img.height))
        out.alpha_composite(light_frame(f, mode), (i * fw, 0))
    return out


def lineup(sheets, frames):
    land = Image.open(ART / "environments" / "land.png").convert("RGBA")
    bg = land.crop((150, 236, 150 + 300, 310)).copy()
    x = 4
    for name in LAND:
        img, fw, fh = sheets[name]
        i = frames[name]
        f = img.crop((i * fw, 0, (i + 1) * fw, fh))
        bg.alpha_composite(f, (x, 66 - fh))
        x += fw + 6
    return bg.resize((bg.width * 4, bg.height * 4), Image.NEAREST)


if __name__ == "__main__":
    m = json.loads((ART / "manifest.json").read_text())
    frames = {}
    for name in LAND:
        a = m["anchors"]["olive"] if name == "olive" else m["anchors"]["creatures"][name]
        frames[name] = (a.get("idle") or a.get("stand") or next(iter(a.values())))["frames"][0]
    OUT.mkdir(parents=True, exist_ok=True)
    for mode in ("now", "A", "B", "C"):
        sheets = {}
        for name in LAND:
            s = m["sheets"][name]
            path = ROOT / s["url"]
            img = Image.open(path).convert("RGBA") if mode == "now" else treat(path, s["frameWidth"], mode)
            sheets[name] = (img, s["frameWidth"], s["frameHeight"])
            if mode != "now":
                dst = OUT / mode / path.relative_to(ART)
                dst.parent.mkdir(parents=True, exist_ok=True)
                img.save(dst)
        lineup(sheets, frames).save(OUT / f"{mode}-lineup.png")
        print(mode)
