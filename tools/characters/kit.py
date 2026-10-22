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
import colorsys
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


def scale2x(g):
    """Doubles a frame the Scale2x (EPX) way: each pixel becomes four, and a
    corner takes its neighbours' colour where two of them meet, so diagonal
    edges stay clean diagonals instead of becoming staircases."""
    h, w = len(g), len(g[0])
    out = blank(w * 2, h * 2)
    at = lambda y, x: g[y][x] if 0 <= y < h and 0 <= x < w else "."  # noqa: E731
    for y in range(h):
        for x in range(w):
            p = g[y][x]
            a, b, c, d = at(y - 1, x), at(y, x + 1), at(y, x - 1), at(y + 1, x)
            out[2 * y][2 * x] = c if c == a and c != d and a != b else p
            out[2 * y][2 * x + 1] = b if a == b and a != c and b != d else p
            out[2 * y + 1][2 * x] = c if d == c and d != b and c != a else p
            out[2 * y + 1][2 * x + 1] = b if b == d and b != a and d != c else p
    return out


def rotate(g, deg, cx, cy):
    """Turns a frame on the pixel grid the RotSprite way (positive lifts the
    nose of a left-facing creature): blown up eight times with Scale2x,
    which keeps lines and curves smooth, turned there, then brought back
    down, each pixel taking the colour that fills most of it. Small pixel
    art keeps its shape this way instead of breaking into jagged bits."""
    h, w = len(g), len(g[0])
    k = 8
    big = scale2x(scale2x(scale2x(g)))
    bh, bw = len(big), len(big[0])
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    out = blank(w, h)
    for y in range(h):
        for x in range(w):
            votes = {}
            for yy in range(y * k, y * k + k, 2):
                for xx in range(x * k, x * k + k, 2):
                    X, Y = xx + 0.5 - cx * k, yy + 0.5 - cy * k
                    u, v = math.floor(c * X + s * Y + cx * k), math.floor(-s * X + c * Y + cy * k)
                    ch = big[v][u] if 0 <= v < bh and 0 <= u < bw else "."
                    votes[ch] = votes.get(ch, 0) + 1
            if votes.get(".", 0) >= 8:
                continue
            votes.pop(".", None)
            fill = {kk: n for kk, n in votes.items() if kk != "o"}
            out[y][x] = max(fill, key=fill.get) if fill and sum(fill.values()) >= 6 else "o"
    return outline(cleanup(out))


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


# ---------------------------------------------------------------- finishing
# Every frame goes through the same finishing passes before it's saved.

def cleanup(g, keep=""):
    """Tidies a frame: outline pixels left touching nothing are removed, and
    a lone pixel of one colour sitting in a patch of another (noise left by
    shading or turning) takes its surroundings' colour. Letters in `keep`
    (eyes, noses: details that are meant to be one pixel) are left alone."""
    h, w = len(g), len(g[0])
    at = lambda y, x: g[y][x] if 0 <= y < h and 0 <= x < w else "."  # noqa: E731
    for y in range(h):
        for x in range(w):
            ch = g[y][x]
            n4 = [at(y - 1, x), at(y + 1, x), at(y, x - 1), at(y, x + 1)]
            if ch == "o" and all(n in ".o" for n in n4) and not any(
                at(y + a, x + b) not in ".o" for a in (-1, 1) for b in (-1, 1)
            ):
                g[y][x] = "."
            elif ch not in ".o" and ch not in keep and len(set(n4)) == 1 and n4[0] not in ".o" and n4[0] != ch:
                g[y][x] = n4[0]
    return g


def _hsv(c):
    return colorsys.rgb_to_hsv(*(int(c[i:i + 2], 16) / 255 for i in (1, 3, 5)))


def _hex(h, s, v):
    return "#%02x%02x%02x" % tuple(round(max(0, min(1, x)) * 255) for x in colorsys.hsv_to_rgb(h % 1, s, v))


def _toward(h, target, amount):
    """Moves a hue toward another the short way round."""
    d = (target - h + 0.5) % 1 - 0.5
    return h + max(-amount, min(amount, d))


def shift(c, kind):
    """A hue-shifted step of a colour: light warms toward yellow and loses a
    little saturation, shade cools toward blue-violet and gains it, so a
    shaded colour reads as the same material in another light rather than
    the same colour with black mixed in. 'sel' is the deep, cool shade used
    for a selective outline."""
    h, s, v = _hsv(c)
    if kind == "light":
        return _hex(_toward(h, 50 / 360, 14 / 360), s * 0.85, min(1, v * 1.12 + 0.05))
    if kind == "shade":
        return _hex(_toward(h, 250 / 360, 16 / 360), min(1, s * 1.1 + 0.05), v * 0.8)
    return _hex(_toward(h, 250 / 360, 22 / 360), min(1, s * 1.15 + 0.1), v * 0.55)


def _lum(c):
    r, g, b = (int(c[i:i + 2], 16) for i in (1, 3, 5))
    return (r * 3 + g * 6 + b) / 10


def finish(frames, colours, keep="ENne"):
    """The finishing passes, the same for every creature:

    - cleanup (above);
    - light and shade: the top pixel of each run of colour, where it meets
      the sky, takes a hue-shifted light step of that colour, and the bottom
      pixel a hue-shifted shade, so every form reads as round and lit from
      above;
    - selective outline: along the top edge of light-coloured parts (white
      fur, a gull's back) the outline takes a deep, cool shade of the colour
      it surrounds instead of the plum-black, so light forms aren't hemmed
      in by a hard dark line where the light falls on them; underneath and
      round dark parts it stays the shared outline.

    Returns the finished frames and the colours with the new steps added
    (each one also joins the palette's creature shades)."""
    colours = dict(colours)
    made = {}
    pool = iter(chr(c) for c in range(0x100, 0x2000))

    def step(ch, kind):
        key = (ch, kind)
        if key not in made:
            hexc = shift(colours[ch], kind)
            letter = next(pool)
            while letter in colours:
                letter = next(pool)
            colours[letter] = hexc
            made[key] = letter
            register(hexc)
        return made[key]

    out = []
    for g in frames:
        g = cleanup([row[:] for row in g], keep)
        h, w = len(g), len(g[0])
        at = lambda y, x: g[y][x] if 0 <= y < h and 0 <= x < w else "."  # noqa: E731
        lit = [row[:] for row in g]
        for y in range(h):
            for x in range(w):
                ch = g[y][x]
                if ch in ".o" or ch in keep:
                    continue
                up, down = at(y - 1, x), at(y + 1, x)
                if up in ".o" and down == ch:
                    lit[y][x] = step(ch, "light")
                elif down in ".o" and up == ch:
                    lit[y][x] = step(ch, "shade")
        for y in range(h):
            for x in range(w):
                if g[y][x] != "o" or at(y - 1, x) != ".":
                    continue
                below = at(y + 1, x)
                if below not in ".o" and below not in keep and _lum(colours[below]) > 150:
                    lit[y][x] = step(below, "sel")
        out.append(lit)
    return out, colours


_added = set()


def register(hexc):
    """Adds a colour to the palette's creature shades (tools/palette.json)."""
    hexc = hexc.lower()
    if hexc in PALETTE or hexc in _added:
        return
    _added.add(hexc)
    PALETTE.add(hexc)
    path = ROOT / "tools" / "palette.json"
    data = json.loads(path.read_text())
    if hexc not in data["creatures"]:
        data["creatures"].append(hexc)
        path.write_text(json.dumps(data, indent=1) + "\n")


# ---------------------------------------------------------------- output

PROJECTS = ROOT / "assets" / "source" / "pixelorama"


def frames_of(anims, colours, keep="ENne"):
    """Every frame of every animation, finished and as images, with the
    table of where each animation is and the tags for Pixelorama."""
    names, grids, waters, index, tags = [], [], [], {}, []
    for name, a in anims.items():
        fs, fps, loop = a[:3]
        extra = a[3] if len(a) > 3 else {}
        n0 = len(grids)
        index[name] = {"frames": list(range(n0, n0 + len(fs))), "fps": fps, "loop": loop, **{k: v for k, v in extra.items() if k != "water"}}
        tags.append((name, n0 + 1, n0 + len(fs)))
        grids += fs
        waters += [extra.get("water")] * len(fs)
    done, colours = finish(grids, colours, keep)
    images = [image(g, colours, w) for g, w in zip(done, waters)]
    return images, index, tags


def project(name, images, tags, fps, fw, fh):
    """Keeps the creature's Pixelorama project (assets/source/pixelorama/
    <name>.pxo) in step: the "drawn" layer is rewritten from the script, the
    "touch-ups" layer, painted by hand in Pixelorama, is kept and laid over
    it. Returns the frames with the touch-ups applied."""
    import pxo
    path = PROJECTS / f"{name}.pxo"
    touch = [Image.new("RGBA", (fw, fh)) for _ in images]
    if path.exists():
        layers, size = pxo.read(path)
        old = layers.get("touch-ups")
        if old and size == (fw, fh) and len(old) == len(images):
            touch = old
        elif old and any(t.getbbox() for t in old):
            print(f"  {name}: its frames changed shape, so the old touch-ups were set aside in {name}.old.pxo")
            path.replace(path.with_suffix(".old.pxo"))
    pal = json.loads((ROOT / "tools" / "palette.json").read_text())
    pxo.write(path, (fw, fh), [("drawn", images, True), ("touch-ups", touch, False)], tags, fps, palette=pal["colours"] + pal["creatures"])
    return pxo.apply_touchups(images, touch)


def preview(name, anims_images, fw, fh, scale=6):
    """Every animation row by row, enlarged, as docs/characters/<name>-sheet.png,
    and an animated GIF of each. anims_images: name -> (images, fps)."""
    DOCS.mkdir(parents=True, exist_ok=True)
    most = max(len(f) for f, _ in anims_images.values())
    img = Image.new("RGBA", (most * fw * scale, len(anims_images) * fh * scale), PREVIEW_BG)
    for old in DOCS.glob(f"{name}-*.gif"):
        old.unlink()
    for r, (an, (frames, fps)) in enumerate(anims_images.items()):
        for k, f in enumerate(frames):
            img.alpha_composite(f.resize((fw * scale, fh * scale), Image.NEAREST), (k * fw * scale, r * fh * scale))
        big = [Image.alpha_composite(Image.new("RGBA", (fw, fh), PREVIEW_BG), f).resize((fw * scale, fh * scale), Image.NEAREST).convert("P", palette=Image.ADAPTIVE) for f in frames]
        big[0].save(DOCS / f"{name}-{an}.gif", save_all=True, append_images=big[1:], duration=int(1000 / fps), loop=0)
    img.save(DOCS / f"{name}-sheet.png")


def write(name, anims, colours, fw, fh, folder=None, anchors=None, keep="ENne"):
    """Writes a creature's sheet and animation table, its Pixelorama project
    and its previews, the way the art build and `python3 tools/characters/
    <name>.py` both do."""
    images, index, tags = frames_of(anims, colours, keep)
    fps = max(a[1] for a in anims.values())
    images = project(name, images, tags, fps, fw, fh)
    out = ART / (folder or "")
    out.mkdir(parents=True, exist_ok=True)
    strip = Image.new("RGBA", (fw * len(images), fh))
    for k, f in enumerate(images):
        strip.alpha_composite(f, (k * fw, 0))
    strip.save(out / f"{name}.png")
    (out / f"{name}.json").write_text(json.dumps({"frameWidth": fw, "frameHeight": fh, "animations": index, **({"anchors": anchors} if anchors else {})}, indent=1) + "\n")
    preview(name, {an: ([images[i] for i in t["frames"]], t["fps"]) for an, t in index.items()}, fw, fh)
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


def feathered_wing(g, shoulder, wrist, tip, arm_chord, hand_chord, side, ink_map, fingers=0, serrate=True, tip_width=1, unit=1):
    """A bird's wing built like a real one, seen from below: the arm runs
    from the shoulder to the wrist and the hand from the wrist to the tip;
    the bones lie along the leading edge, and the feathers trail behind
    them. Across the wing, from the leading edge back: the lit marginal
    coverts ('lead'), the coverts ('covert'), then the flight feathers:
    secondaries along the arm ('second'), primaries along the hand
    ('primary'), with an optional 'mirror' (a gull's white spot) near the
    tip and a pale 'edge' along the trailing edge of the arm. The primaries'
    trailing edge is notched (serrate), and `fingers` opens gaps between the
    outermost ones, like a soaring eagle's. tip_width: a pointed wing (1) or a
    broad, blunt one (an eagle's). unit: the size of a pixel (when drawn
    larger to be brought down to the grid).

    side: 'near' (the wing toward the viewer, hanging below the body) or
    'far' (reaching up behind it); it decides which way is "behind"."""
    h, w = len(g), len(g[0])
    sx, sy = shoulder
    pts = [shoulder, wrist, tip]
    segs = [(pts[0], pts[1], arm_chord, hand_chord + 1, "arm"), (pts[1], pts[2], hand_chord + 1, tip_width, "hand")]
    seglen = [math.dist(a, b) for a, b, *_ in segs]
    total = sum(seglen) or 1
    done = 0.0
    for (a, b, c0, c1, part), L in zip(segs, seglen):
        n = max(1, int(L * 4))
        dx, dy = (b[0] - a[0]) / (L or 1), (b[1] - a[1]) / (L or 1)
        # "behind" the bone: square to it, on the trailing side
        px, py = (dy, -dx) if side == "near" else (-dy, dx)
        if L == 0:
            px, py = 1, 0
        for i in range(n + 1):
            t = i / n
            x0, y0 = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
            along = (done + L * t) / total
            chord = c0 + (c1 - c0) * t
            m = max(1, int(chord * 4))
            for j in range(m + 1):
                u = j / m  # 0 at the leading edge, 1 at the trailing edge
                x, y = round(x0 + px * chord * u), round(y0 + py * chord * u)
                if not (0 <= y < h and 0 <= x < w):
                    continue
                if u < 0.2 and chord > 1.5:
                    key = "lead"
                elif part == "arm" and u < 0.55:
                    key = "covert"
                elif part == "arm":
                    key = "edge" if u > 0.9 and "edge" in ink_map else "second"
                elif u < 0.4 and t < 0.5 and chord > 2:
                    key = "covert"
                else:
                    key = "primary"
                    if "mirror" in ink_map and 0.82 < along < 0.92 and 0.3 < u < 0.8:
                        key = "mirror"
                    if "tip" in ink_map and along > 0.66:
                        key = "tip" if not (key == "mirror") else key
                g[y][x] = ink_map[key]
        done += L
    # notches along the hand's trailing edge, and the eagle's fingers
    a, b = pts[1], pts[2]
    L = math.dist(a, b)
    if L and (serrate or fingers):
        dx, dy = (b[0] - a[0]) / L, (b[1] - a[1]) / L
        px, py = (dy, -dx) if side == "near" else (-dy, dx)
        for i, t in enumerate([0.35, 0.55, 0.75]):
            chord = (hand_chord + 1) * (1 - t) + t
            x, y = round(a[0] + (b[0] - a[0]) * t + px * chord), round(a[1] + (b[1] - a[1]) * t + py * chord)
            if 0 <= y < h and 0 <= x < w and g[y][x] != ".":
                g[y][x] = "."
        # slits between the outer primaries, cut in from the tip
        tc = tip_width
        for i in range(fingers):
            u = (i + 1) / (fingers + 1)
            bx, by = b[0] + px * tc * u, b[1] + py * tc * u
            for d in range(int(2.6 * unit)):
                for e in range(-int(unit * 0.35), int(unit * 0.35) + 1):
                    x, y = round(bx - dx * d + px * e), round(by - dy * d + py * e)
                    if 0 <= y < h and 0 <= x < w:
                        g[y][x] = "."


def supersampled(g, draw, k=4, keep=0.5):
    """Draws a shape k times larger, then brings it down to the grid one
    pixel at a time by vote: a pixel is filled if at least `keep` of it is
    covered, with the letter that covers most of it. Curves and slanted
    edges come out as clean, even steps instead of the ragged edges of
    drawing at 1x. `draw(big, k)` draws onto the large grid, with every
    coordinate and size multiplied by k."""
    h, w = len(g), len(g[0])
    big = blank(w * k, h * k)
    draw(big, k)
    for y in range(h):
        for x in range(w):
            votes = {}
            for yy in range(y * k, y * k + k):
                for xx in range(x * k, x * k + k):
                    ch = big[yy][xx]
                    votes[ch] = votes.get(ch, 0) + 1
            filled = k * k - votes.pop(".", 0)
            if filled >= keep * k * k:
                g[y][x] = max(votes, key=votes.get)


def bird_wing(g, shoulder, wrist, tip, arm, hand, side, ink_map, lift=0, **kw):
    """One wing of a bird seen from below (`feathered_wing`), drawn four
    times larger and brought down to the grid for clean edges. wrist and tip
    are offsets from the shoulder; lift raises or lowers the whole wing."""
    sx, sy = shoulder

    def draw(big, k):
        sc = lambda p: ((p[0] + 0.5) * k, (p[1] + lift + 0.5) * k)  # noqa: E731
        if "tip_width" in kw:
            kw2 = {**kw, "tip_width": kw["tip_width"] * k}
        else:
            kw2 = kw
        feathered_wing(big, sc(shoulder), sc((sx + wrist[0], sy + wrist[1])), sc((sx + tip[0], sy + tip[1])), arm * k, hand * k, side, ink_map, unit=k, **kw2)

    supersampled(g, draw)
