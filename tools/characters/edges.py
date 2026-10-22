"""The creatures' edges, as decided in study 6 (version B, selective):
docs/studio/studies.md.

Every animal and fish is drawn with the shared plum-black outline round
every part (tools/characters/kit.py, tools/fish_art.py); this last pass
turns it into a selective one, so the cast is lit from the same side as
the scenery: the dark line stays only underneath and on the shadow side,
where the form turns away from the sun; on the lit top and left the edge
takes a shade of the animal's own colour; the lines inside the body soften
to a deep shade of the colour round them. Eyes, nostrils and small marks
drawn in the outline colour stay as they are.

The study's other treatments (A, a coloured line; C, no line) are kept
here so the study can be re-run.
"""
import colorsys
from collections import Counter

OUTLINE = (37, 19, 26)


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


def treat(img, fw, mode="B"):
    """The sheet (frames fw wide) with its outline treated one way: "A" a
    coloured line, "B" selective (the one in the game), "C" no line."""
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
