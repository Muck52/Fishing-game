"""The shared kit every creature in the game is drawn with.

Olive, the deer, fox, hare and bear, the birds and the minnows are all built
the same way, so they read as one world (see docs/characters/README.md):

- **Side-on, facing left, one light.** Every creature is drawn in profile
  facing left (the game turns it to face the way it goes), lit from above:
  a lighter band along the back, shade underneath, the far legs or far wing
  a step darker than the near ones.
- **One palette, one outline.** Every colour is one of the game's master
  palette (``PALETTE``; `ink()` refuses anything else), and every creature
  wears the shared outline colour, `#25131a`, put round it after drawing.
- **Real proportions, one scale.** Sizes come from the real animal measured
  against the angler (about 34 pixels for 5 ft 9 in, so half a pixel to the
  inch), with small animals drawn up to 1.6 times larger so they still read
  (`size()`); the deer and the bear are near true size, the fox and the hare
  enlarged like Olive.
- **A body drawing, legs from joints.** The body and head are one pixel
  drawing; the legs are drawn every frame through their joints (shoulder,
  wrist, paw in front; hip, hock, paw behind), so walks, trots, gallops and
  hops pose them freely and every frame lands on whole pixels.
- **Stepped motion.** Creatures move by a fixed step as each walk frame
  changes, so feet don't slide; the step comes from the gait itself.
"""
import json
import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "assets" / "art" / "characters"
DOCS = ROOT / "docs" / "characters"

OUTLINE = "#25131a"
_P = json.loads((ROOT / "tools" / "palette.json").read_text())
PALETTE = set(_P["colours"]) | set(_P["creatures"])
PREVIEW_BG = (178, 208, 208, 255)
INCH = 34 / 69  # pixels per inch: the angler is 34 pixels for 5 ft 9 in


def size(inches, boost=1.0):
    """How many pixels a real measurement comes to on the grid."""
    return round(inches * INCH * boost)


def ink(**colours):
    """A creature's colours by letter, checked against the master palette.
    'o' is always the shared outline."""
    for k, c in colours.items():
        assert c.lower() in PALETTE, f"{k}: {c} is not in the master palette"
    return {"o": OUTLINE, **colours}


def blank(w, h):
    return [["."] * w for _ in range(h)]


def put(g, rows, x0, y0):
    """Draws a pixel drawing onto a frame; '.' is see-through."""
    for j, r in enumerate(rows):
        for i, ch in enumerate(r):
            y, x = y0 + j, x0 + i
            if ch != "." and 0 <= y < len(g) and 0 <= x < len(g[0]):
                g[y][x] = ch


def line(a, b):
    (x0, y0), (x1, y1) = a, b
    n = max(abs(x1 - x0), abs(y1 - y0), 1)
    return [(round(x0 + (x1 - x0) * t / n), round(y0 + (y1 - y0) * t / n)) for t in range(n + 1)]


def limb(g, pts, fill, width=2, dy=0, upper=None, lower=None, toe=True):
    """A leg through its joints, `width` pixels thick.

    upper: (letter, rows) colours the top rows of the leg (a thigh);
    lower: (letter, rows) colours the bottom rows (a fox's black stockings,
    a deer's hooves); toe: a pixel of foot pointing forward."""
    h, w = len(g), len(g[0])
    pts = [(x, y + dy) for x, y in pts]
    top, foot = pts[0][1], pts[-1][1]
    for a, b in zip(pts, pts[1:]):
        for x, y in line(a, b):
            for xx in range(x, x + width):
                if 0 <= y < h and 0 <= xx < w:
                    ch = fill
                    if upper and y <= top + upper[1] - 1:
                        ch = upper[0]
                    if lower and y > foot - lower[1]:
                        ch = lower[0]
                    g[y][xx] = ch
    x, y = pts[-1]
    if toe and 0 <= y < h and 1 <= x <= w:
        g[y][x - 1] = lower[0] if lower else fill


def outline(g):
    """The shared outline round everything drawn."""
    h, w = len(g), len(g[0])
    for y in range(h):
        for x in range(w):
            if g[y][x] == "." and any(0 <= y + a < h and 0 <= x + b < w and g[y + a][x + b] not in ".o" for a, b in ((0, 1), (0, -1), (1, 0), (-1, 0))):
                g[y][x] = "o"
    return g


def rotate(g, deg, cx, cy):
    """Turns a frame on the pixel grid (positive lifts the nose of a
    left-facing creature), sampling each pixel four times so the outline
    holds together."""
    h, w = len(g), len(g[0])
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    out = blank(w, h)
    for y in range(h):
        for x in range(w):
            votes = {}
            for sy in (0.25, 0.75):
                for sx in (0.25, 0.75):
                    X, Y = x + sx - cx, y + sy - cy
                    u, v = math.floor(c * X + s * Y + cx), math.floor(-s * X + c * Y + cy)
                    ch = g[v][u] if 0 <= v < h and 0 <= u < w else "."
                    votes[ch] = votes.get(ch, 0) + 1
            if votes.get(".", 0) >= 3:
                continue
            fill = {k: n for k, n in votes.items() if k not in ".o"}
            out[y][x] = max(fill, key=fill.get) if sum(fill.values()) >= 2 else "o"
    return outline(out)


def walk_legs(t, legs, stance=0.65, lift=2, reach=3, ground=23, knee=4):
    """Leg joints at phase t of a walking cycle.

    legs: one (kind, root, phase) per leg, kind 'front' or 'hind', root the
    shoulder or hip, phase where in the cycle that foot is. Each paw is
    planted for the stance part of the cycle and swept back under the body,
    then lifted and swung forward with the wrist (front) or hock (hind)
    bent. knee: how far above the ground the wrist or hock sits."""
    out = []
    for kind, (rx, ry), ph in legs:
        p = (t + ph) % 1
        if p < stance:
            px, y = round(rx - reach + 2 * reach * p / stance), ground
            lifted = False
        else:
            k = (p - stance) / (1 - stance)
            px, y = round(rx + reach - 2 * reach * k), ground - round(lift * math.sin(math.pi * k))
            lifted = True
        j = ground - knee
        if kind == "front":
            mid = (rx + (px - rx) // 2 - (1 if lifted else 0), j)
            out.append([(rx, ry), mid, (px + (1 if lifted else 0), y)])
        else:
            out.append([(rx, ry), (px + 2, j - (1 if lifted else 0)), (px, y)])
    return out


def image(g, colours, water=None, water_rgb=(46, 93, 120)):
    """A frame as an image. Rows from `water` down are seen through the lake:
    dimmer, bluer and partly see-through."""
    img = Image.new("RGBA", (len(g[0]), len(g)))
    px = img.load()
    for y, row in enumerate(g):
        for x, ch in enumerate(row):
            if ch == ".":
                continue
            c = colours[ch]
            r, gg, b = (int(c[i:i + 2], 16) for i in (1, 3, 5))
            if water is not None and y >= water:
                px[x, y] = (round(r * 0.35 + water_rgb[0] * 0.65), round(gg * 0.35 + water_rgb[1] * 0.65), round(b * 0.35 + water_rgb[2] * 0.65), 150)
            else:
                px[x, y] = (r, gg, b, 255)
    return img


def sheet(anims, colours, fw, fh):
    """anims: name -> (frames, fps, loop[, extra]) where extra is a dict of
    more facts for the game (a walk's step, a waterline). Returns every
    frame in one strip and the table of where each animation is."""
    frames, index = [], {}
    for name, a in anims.items():
        fs, fps, loop = a[:3]
        extra = a[3] if len(a) > 3 else {}
        water = extra.get("water")
        index[name] = {"frames": list(range(len(frames), len(frames) + len(fs))), "fps": fps, "loop": loop, **{k: v for k, v in extra.items() if k != "water"}}
        frames += [image(f, colours, water) for f in fs]
    strip = Image.new("RGBA", (fw * len(frames), fh))
    for k, f in enumerate(frames):
        strip.alpha_composite(f, (k * fw, 0))
    return strip, index


def preview(name, anims, colours, fw, fh, scale=6):
    """Every animation row by row, enlarged, as docs/characters/<name>-sheet.png,
    and an animated GIF of each."""
    DOCS.mkdir(parents=True, exist_ok=True)
    most = max(len(a[0]) for a in anims.values())
    img = Image.new("RGBA", (most * fw * scale, len(anims) * fh * scale), PREVIEW_BG)
    for old in DOCS.glob(f"{name}-*.gif"):
        old.unlink()
    for r, (an, a) in enumerate(anims.items()):
        fs, fps = a[0], a[1]
        water = a[3].get("water") if len(a) > 3 else None
        frames = [image(f, colours, water) for f in fs]
        for k, f in enumerate(frames):
            img.alpha_composite(f.resize((fw * scale, fh * scale), Image.NEAREST), (k * fw * scale, r * fh * scale))
        big = [Image.alpha_composite(Image.new("RGBA", (fw, fh), PREVIEW_BG), f).resize((fw * scale, fh * scale), Image.NEAREST).convert("P", palette=Image.ADAPTIVE) for f in frames]
        big[0].save(DOCS / f"{name}-{an}.gif", save_all=True, append_images=big[1:], duration=int(1000 / fps), loop=0)
    img.save(DOCS / f"{name}-sheet.png")


def write(name, anims, colours, fw, fh, folder=None, anchors=None):
    """Writes a creature's sheet and animation table (and previews), the way
    the art build and `python3 tools/characters/<name>.py` both do."""
    out = ART / (folder or "")
    out.mkdir(parents=True, exist_ok=True)
    strip, index = sheet(anims, colours, fw, fh)
    strip.save(out / f"{name}.png")
    (out / f"{name}.json").write_text(json.dumps({"frameWidth": fw, "frameHeight": fh, "animations": index, **({"anchors": anchors} if anchors else {})}, indent=1) + "\n")
    preview(name, anims, colours, fw, fh)
    return strip, index


def poly(g, pts, ch):
    """Fills a polygon on the grid with one letter."""
    from PIL import ImageDraw
    h, w = len(g), len(g[0])
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).polygon([(round(x), round(y)) for x, y in pts], fill=1)
    px = m.load()
    for y in range(h):
        for x in range(w):
            if px[x, y]:
                g[y][x] = ch


def wing(g, root, tip, chord, fill, tip_fill=None, tip_share=0.3, lead=None, tip_chord=None):
    """A bird's wing seen from the side, as a tapering blade from its root (the
    shoulder, `chord` pixels long front to back) out to the tip. The outer
    `tip_share` of it can be another colour (black primaries); `lead` colours
    the leading edge (the lit forearm). The blade narrows to `tip_chord`."""
    (rx, ry), (tx, ty) = root, tip
    tc = tip_chord if tip_chord is not None else max(1, chord // 2)
    front, back = (rx - chord // 2, ry), (rx + chord - chord // 2, ry)
    # the tip's own short edge, square to the wing
    dx, dy = tx - rx, ty - ry
    n = max(1e-6, math.hypot(dx, dy))
    px, py = -dy / n, dx / n  # across the wing
    if px < 0:
        px, py = -px, -py
    t1, t2 = (tx, ty), (tx + px * tc, ty + py * tc)
    poly(g, [front, back, t2, t1], fill)
    if tip_fill:
        k = 1 - tip_share
        f2 = (front[0] + (t1[0] - front[0]) * k, front[1] + (t1[1] - front[1]) * k)
        b2 = (back[0] + (t2[0] - back[0]) * k, back[1] + (t2[1] - back[1]) * k)
        poly(g, [f2, b2, t2, t1], tip_fill)
    if lead:
        for x, y in line(front, (tx, ty))[:-2]:
            if 0 <= y < len(g) and 0 <= x < len(g[0]) and g[y][x] == fill:
                g[y][x] = lead
