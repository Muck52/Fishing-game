"""Study 6: the whole cast, together.

The scenery has moved on: the bank, the falls, the shallows are drawn
without outlines, in the materials library's colours and light. The animals
and fish still carry the shared plum-black outline round every part. This
study tries one edge treatment across the whole cast at once, so we settle
it for all of them before going group by group:

- **A, coloured line:** the outline stays, but each pixel of it takes a
  deep, cool shade of the colour it holds in, instead of the one
  plum-black: still a crisp edge, softer, and it belongs to the animal.
- **B, selective:** the shared dark line only underneath and on the
  shadow side, where the form turns away from the sun; on the lit top and
  left the edge is a shade of the animal's own colour; the lines inside
  the body soften to a deep shade.
- **C, no line:** no outline at all, like the scenery: the edge is the
  animal's own colour on the lit side and a step of shade on the other,
  the lines inside the body a soft shade; the form reads from its colour
  against the background.

Eyes, nostrils and small marks drawn in the outline colour stay as they
are. Every sheet is treated as the game has it now, so the drawing is the
same in all three and only the edges change. Shown as a lineup on the
game's own backgrounds and in the game itself.

    python3 tools/studio/study_cast.py   -> docs/studio/studies/06-cast/
"""
import colorsys
import json
import sys
from collections import Counter
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "assets" / "art"
OUT = ROOT / "docs" / "studio" / "studies" / "06-cast"
OUTLINE = (37, 19, 26)
MODES = ("A", "B", "C")

LAND = ["olive", "deer", "fox", "hare", "bear"]
BIRDS = ["gull", "eagle", "mallard", "sparrow"]
FISH = ["bluegill", "pumpkinseed", "perch", "crappie", "whitebass", "carp", "bass", "largemouth", "trout",
        "rainbow", "channelcat", "drum", "walleye", "catfish", "pike", "muskie", "golden"]


def sheet_key(name):
    return name if name in LAND + BIRDS + ["minnow"] else f"fish-{name}"


def shade(c, kind):
    """A hue-shifted step of a colour (as tools/characters/kit.py): 'shade'
    a step darker and cooler, 'deep' the deep, cool shade of an outline."""
    h, s, v = colorsys.rgb_to_hsv(*(x / 255 for x in c))
    d = (250 / 360 - h + 0.5) % 1 - 0.5
    if kind == "shade":
        h, s, v = h + max(-16 / 360, min(16 / 360, d)), min(1, s * 1.1 + 0.05), v * 0.8
    else:
        h, s, v = h + max(-22 / 360, min(22 / 360, d)), min(1, s * 1.15 + 0.1), v * 0.55
    return tuple(round(max(0, min(1, x)) * 255) for x in colorsys.hsv_to_rgb(h % 1, s, v))


def treat(img, fw, mode):
    """The sheet with its outline treated one way."""
    src = img.convert("RGBA")
    w, h = src.size
    px = src.load()
    out = src.copy()
    op = out.load()
    is_line = lambda x, y: px[x, y][3] and px[x, y][:3] == OUTLINE  # noqa: E731

    def inside(x, y, x0):
        return x0 <= x < x0 + fw and 0 <= y < h

    # small specks of outline colour inside the body are eyes and nostrils: keep them
    seen, keep = set(), set()
    for y in range(h):
        for x in range(w):
            if (x, y) in seen or not is_line(x, y):
                continue
            x0 = x // fw * fw
            comp, stack, outer = [], [(x, y)], False
            seen.add((x, y))
            while stack:
                cx, cy = stack.pop()
                comp.append((cx, cy))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if not inside(nx, ny, x0) or not px[nx, ny][3]:
                        outer = True
                    elif (nx, ny) not in seen and is_line(nx, ny):
                        seen.add((nx, ny))
                        stack.append((nx, ny))
            if not outer and len(comp) <= 3:
                keep |= set(comp)

    for y in range(h):
        for x in range(w):
            if not is_line(x, y) or (x, y) in keep:
                continue
            x0 = x // fw * fw
            near = Counter()
            for r in (1, 2):
                for dy in range(-r, r + 1):
                    for dx in range(-r, r + 1):
                        nx, ny = x + dx, y + dy
                        if inside(nx, ny, x0) and px[nx, ny][3] and not is_line(nx, ny):
                            near[px[nx, ny][:3]] += 1
                if near:
                    break
            if not near:
                continue
            body = near.most_common(1)[0][0]
            open_ = lambda dx, dy: not inside(x + dx, y + dy, x0) or not px[x + dx, y + dy][3]  # noqa: E731
            outer = any(open_(dx, dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            lit = open_(0, -1) or open_(-1, 0)
            dark = open_(0, 1) or open_(1, 0)
            if mode == "A":
                c = shade(body, "deep")
            elif mode == "B":
                if not outer:
                    c = shade(body, "deep")
                elif lit and not dark:
                    c = shade(body, "shade")
                else:
                    c = OUTLINE
            else:
                if not outer:
                    c = shade(body, "shade")
                elif lit and not dark:
                    c = body
                else:
                    c = shade(body, "shade")
            op[x, y] = (*c, 255)
    return out


def sheets():
    m = json.loads((ART / "manifest.json").read_text())["sheets"]
    out = {}
    for name in LAND + BIRDS + ["minnow"] + FISH:
        s = m[sheet_key(name)]
        out[name] = (ROOT / s["url"], s["frameWidth"], s["frameHeight"])
    return out


def frame(img, fw, fh, i=0):
    return img.crop((i * fw, 0, (i + 1) * fw, fh))


def lineup(treated):
    """The cast on the game's own backgrounds: the land animals on the
    beach, the birds against the sky, the fish in the water. 1x."""
    land = Image.open(ART / "environments" / "land.png").convert("RGBA")
    sky = Image.open(ART / "environments" / "sky-day.png").convert("RGBA")
    under = Image.open(ART / "environments" / "underwater.png").convert("RGBA")
    W = 360
    rows = []
    # the beach, its waterline at 302, the forest behind
    beach = Image.new("RGBA", (W, 60))
    beach.alpha_composite(land.crop((150, 250, 150 + W, 310)))
    x = 6
    for name in LAND:
        img, fw, fh = treated[name]
        f = frame(img, fw, fh, 0 if name != "olive" else 0)
        beach.alpha_composite(f, (x, 52 - fh))
        x += fw + 8
    rows.append(beach)
    air = sky.crop((0, 80, W, 140)).copy()
    x = 8
    for name in BIRDS:
        img, fw, fh = treated[name]
        f = frame(img, fw, fh)
        air.alpha_composite(f, (x, max(0, 30 - fh // 2)))
        x += fw + 18
    rows.append(air)
    for part in (FISH[:9], FISH[9:] + ["minnow"]):
        water = under.crop((0, 20, W, 50)).copy()
        x = 4
        for name in part:
            img, fw, fh = treated[name]
            f = frame(img, fw, fh)
            water.alpha_composite(f, (x, 15 - fh // 2))
            x += fw + 3
        rows.append(water)
    out = Image.new("RGBA", (W, sum(r.height for r in rows)))
    y = 0
    for r in rows:
        out.alpha_composite(r, (0, y))
        y += r.height
    return out


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    src = sheets()
    for mode in ("now",) + MODES:
        treated = {}
        for name, (path, fw, fh) in src.items():
            img = Image.open(path)
            t = img.convert("RGBA") if mode == "now" else treat(img, fw, mode)
            treated[name] = (t, fw, fh)
            if mode != "now":
                rel = path.relative_to(ART)
                dst = OUT / mode / rel
                dst.parent.mkdir(parents=True, exist_ok=True)
                t.save(dst)
        lineup(treated).resize((360 * 3, lineup(treated).height * 3), Image.NEAREST).save(OUT / f"{mode}-lineup.png")
        print(mode)
