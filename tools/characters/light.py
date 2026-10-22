"""Light for the land animals, as decided in study 7 (version A, lit as one
mass): docs/studio/studies.md.

Olive, the deer, fox, hare and bear are lit like the scenery's rock and
trees: from each frame's own silhouette, a band of light toward the sun
(upper left), a band of shade away from it, one calm tone between, so the
light moves with the body. Thin parts (legs, ears, tails) are left as
drawn, and so are the outline, eyes and nose. The study's other versions
(B, mass and fur; C, sunlit fur) are kept here so the study can be re-run.
"""
import colorsys

from PIL import Image

OUTLINE = (37, 19, 26)
LAND = ["olive", "deer", "fox", "hare", "bear"]


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


def lit(img, fw, mode="A"):
    """The sheet (frames fw wide), each frame lit as one mass."""
    img = img.convert("RGBA")
    out = Image.new("RGBA", img.size)
    for i in range(img.width // fw):
        f = img.crop((i * fw, 0, (i + 1) * fw, img.height))
        out.alpha_composite(light_frame(f, mode), (i * fw, 0))
    return out
