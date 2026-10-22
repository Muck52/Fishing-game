"""Animals built from shapes, not typed pixel by pixel.

Each animal is described as rounded masses (torso, neck, head, ears, tail,
markings) given as a few points that a smooth closed curve runs through,
and legs as chains of joints that taper from shoulder or hip to the foot.
Everything is drawn four times larger and brought down to the grid by vote,
so curves come out as clean, even steps (as in kit.supersampled).

A *style* reshapes the same anatomy: the head scaled about the top of the
neck, the legs shortened (the body lowered to keep the feet on the
ground), the torso pulled toward a rounder oval, and the eye drawn larger
with a catchlight. That's how study 8 draws one animal three ways.

The result is a grid of ink letters, ready for the kit's finishing passes
(outline, light and shade) and the art build's (selective edges, light as
one mass).
"""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import blank  # noqa: E402

K = 4  # drawn this many times larger, then voted down


def spline(pts, closed=True, n=6):
    """A smooth curve through the points (Catmull-Rom)."""
    out = []
    m = len(pts)
    rng = range(m) if closed else range(m - 1)
    for i in rng:
        p0 = pts[(i - 1) % m] if closed else pts[max(0, i - 1)]
        p1, p2 = pts[i], pts[(i + 1) % m]
        p3 = pts[(i + 2) % m] if closed else pts[min(m - 1, i + 2)]
        for j in range(n):
            t = j / n
            out.append(tuple(0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t * t
                                    + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t ** 3) for d in range(2)))
    if not closed:
        out.append(pts[-1])
    return out


def scaled(pts, pivot, s, sy=None):
    sy = s if sy is None else sy
    return [(pivot[0] + (x - pivot[0]) * s, pivot[1] + (y - pivot[1]) * sy) for x, y in pts]


def rounder(pts, amount):
    """Pulls a shape's points toward the oval that fits it."""
    if not amount:
        return pts
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    rx, ry = (max(xs) - min(xs)) / 2, (max(ys) - min(ys)) / 2
    out = []
    for x, y in pts:
        a = math.atan2((y - cy) / max(ry, 0.1), (x - cx) / max(rx, 0.1))
        ex, ey = cx + rx * math.cos(a), cy + ry * math.sin(a)
        out.append((x + (ex - x) * amount, y + (ey - y) * amount))
    return out


class Canvas:
    """A large drawing of letters, voted down to the grid."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.img = Image.new("L", (w * K, h * K), 0)
        self.d = ImageDraw.Draw(self.img)
        self.letters = {".": 0}

    def code(self, ch):
        if ch not in self.letters:
            self.letters[ch] = len(self.letters)
        return self.letters[ch]

    def blob(self, pts, ch, clip=None):
        """A closed smooth shape. clip: only over pixels already drawn."""
        poly = [((x + 0.5) * K, (y + 0.5) * K) for x, y in spline(pts)]
        if clip:
            mask = Image.new("L", self.img.size, 0)
            ImageDraw.Draw(mask).polygon(poly, fill=255)
            body = self.img.point(lambda v: 255 if v else 0)
            from PIL import ImageChops
            mask = ImageChops.multiply(mask, body)
            self.img.paste(self.code(ch), mask=mask)
        else:
            self.d.polygon(poly, fill=self.code(ch))

    def limb(self, joints, widths, ch):
        """A leg: tapered capsules between joints, round at each joint."""
        for (a, b), (wa, wb) in zip(zip(joints, joints[1:]), zip(widths, widths[1:])):
            ax, ay = (a[0] + 0.5) * K, (a[1] + 0.5) * K
            bx, by = (b[0] + 0.5) * K, (b[1] + 0.5) * K
            dx, dy = bx - ax, by - ay
            L = math.hypot(dx, dy) or 1
            nx, ny = -dy / L, dx / L
            ra, rb = wa * K / 2, wb * K / 2
            self.d.polygon([(ax + nx * ra, ay + ny * ra), (bx + nx * rb, by + ny * rb), (bx - nx * rb, by - ny * rb), (ax - nx * ra, ay - ny * ra)],
                           fill=self.code(ch))
            for (cx, cy), r in (((ax, ay), ra), ((bx, by), rb)):
                self.d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=self.code(ch))

    def dot(self, x, y, ch, w=1, h=1):
        self.d.rectangle((x * K, y * K, (x + w) * K - 1, (y + h) * K - 1), fill=self.code(ch))

    def grid(self, keep=0.45):
        g = blank(self.w, self.h)
        names = {v: k for k, v in self.letters.items()}
        px = self.img.load()
        for y in range(self.h):
            for x in range(self.w):
                votes = {}
                for yy in range(y * K, y * K + K):
                    for xx in range(x * K, x * K + K):
                        c = px[xx, yy]
                        votes[c] = votes.get(c, 0) + 1
                filled = K * K - votes.pop(0, 0)
                if filled >= keep * K * K:
                    g[y][x] = names[max(votes, key=votes.get)]
        return g


STYLES = {
    # head scale, leg scale, torso roundness, ear scale, eye
    "natural": {"head": 1.0, "legs": 1.0, "round": 0.0, "ears": 1.0, "eye": "dot"},
    "cozy": {"head": 1.32, "legs": 0.8, "round": 0.45, "ears": 1.15, "eye": "big"},
    "between": {"head": 1.15, "legs": 0.9, "round": 0.22, "ears": 1.05, "eye": "catch"},
}


def draw(spec, style="natural", pose="stand"):
    """An animal (spec, see tools/studio/study_creatures.py) in a style and
    pose, as a grid of ink letters (outline not yet added)."""
    st = STYLES[style]
    p = dict(spec["poses"][pose])
    if "base" in p:
        p = {**spec["poses"][p["base"]], **p}
    W, H, G = spec["frame"][0], spec["frame"][1], spec["ground"]
    c = Canvas(W, H)
    legs = []
    for side, joints, widths in p["legs"]:
        top = joints[0][1]
        new = [(x, top + (y - top) * st["legs"]) for x, y in joints]
        legs.append((side, new, widths))
    # the whole animal lowered so its lowest foot stands on the ground
    drop = G - max(j[-1][1] for _, j, _ in legs)
    sh = lambda pts: [(x, y + drop) for x, y in pts]  # noqa: E731
    legs = [(side, [(x, y + drop) for x, y in j], w) for side, j, w in legs]
    pivot = p["pivot"]
    pivot = (pivot[0], pivot[1] + drop)
    head = lambda pts, extra=1.0: scaled(sh(pts), pivot, st["head"] * extra)  # noqa: E731
    torso = rounder(sh(p["torso"]), st["round"])
    for side, j, w in legs:
        if side == "far":
            c.limb(j, w, spec.get("far", "S"))
    for t in p.get("behind", []):
        c.blob(sh(t[1]), t[0])
    c.blob(torso, "O")
    c.blob(sh(p["neck"]), "O")
    for ch, joints, widths in p.get("antlers_far", []):
        c.limb(head(joints), widths, ch)
    for ch, pts in p.get("ears_far", []):
        c.blob(head(pts, st["ears"]), ch)
    c.blob(head(p["head"]), "O")
    for ch, pts in p.get("ears", []):
        c.blob(head(pts, st["ears"]), ch)
    for ch, joints, widths in p.get("antlers", []):
        c.limb(head(joints), widths, ch)
    for ch, pts in p.get("marks", []):
        c.blob(sh(pts), ch, clip=True)
    for ch, pts in p.get("head_marks", []):
        c.blob(head(pts), ch, clip=True)
    for side, j, w in legs:
        if side == "near":
            c.limb(j, w, spec.get("near", "O"))
    for ch, pts in p.get("front", []):
        c.blob(sh(pts), ch)
    for side, j, w in legs:
        foot = spec.get("foot")
        if foot:
            x, y = j[-1]
            c.dot(round(x - 0.5), round(y), foot, 2 if spec.get("foot_w", 1) > 1 else 1, 1)
    g = c.grid()
    # the face: drawn at 1x so the eye and nose are crisp
    ex, ey = head([p["eye"]])[0]
    nx, ny = head([p["nose"]])[0]
    ex, ey, nx, ny = round(ex), round(ey), round(nx), round(ny)

    def put(x, y, ch):
        if 0 <= x < W and 0 <= y < H:
            g[y][x] = ch
    if st["eye"] == "dot":
        put(ex, ey, "E")
    elif st["eye"] == "catch":
        put(ex, ey, "E")
        put(ex, ey + 1, "E")
        put(ex, ey, "C")  # the catchlight, top of the eye
        put(ex, ey + 1, "E")
        put(ex + 1, ey + 1, "E")
    else:
        for dx in (0, 1):
            for dy in (0, 1):
                put(ex + dx, ey + dy, "E")
        put(ex, ey, "C")
        put(ex + 1, ey + 2, "B")  # a little blush under the eye
    ring = spec.get("eye_ring")
    if ring:
        # on a dark coat the eye needs a lighter rim to be seen
        eye = {(ex, ey), (ex, ey + 1), (ex + 1, ey + 1)}
        for x0, y0 in eye:
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    x, y = x0 + dx, y0 + dy
                    if (x, y) not in eye and 0 <= x < W and 0 <= y < H and g[y][x] in spec.get("coat", "O"):
                        g[y][x] = ring
    put(nx, ny, "N")
    if st["eye"] == "big":
        put(nx, ny - 1, "N")
    return g
