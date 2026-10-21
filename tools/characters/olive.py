"""Olive: the angler's dog, and a character of her own.

Olive is a 40 lb husky / cattle dog mix: black coat, a narrow white blaze up
her face, white muzzle and chest, white front legs and hind socks, one ear
up and one tipped over, warm amber-brown eyes, a plumed tail carried in a
curl with a white tip, and a coral floral bandana. She tilts her head when
she's curious. Her design notes, palette and the research behind her
movement are in docs/characters/olive.md.

She's built as a small pixel rig rather than drawn frame by frame: her head
and body are fixed pixel drawings; her legs are jointed (shoulder, elbow,
paw in front; hip, stifle, hock, paw behind) and placed by a gait, so every
walk and trot frame follows the real footfall order; her tail is a chain of
segments that follows the body a frame late. Everything lands on whole
pixels in the game's palette, with the shared outline added after.

Run on its own to write her sprite sheet and a preview:
    python3 tools/characters/olive.py
"""
import math
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "art" / "characters" / "olive"
DOCS = ROOT / "docs" / "characters"

FW, FH = 34, 24  # one frame
GROUND = 22  # the row her paws stand on

hexc = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
INK = {
    "K": hexc("#33323d"),  # black coat
    "k": hexc("#3f2939"),  # black coat on her far side, in shade
    "W": hexc("#eae2dc"),  # white fur
    "w": hexc("#b3a697"),  # white fur on her far side, in shade
    "N": hexc("#3f2939"),  # nose, glossy black, apart from the outline
    "n": hexc("#8b7373"),  # the shine on it
    "E": hexc("#a36443"),  # eye: a warm amber iris
    "a": hexc("#daab76"),  # the light catching the top of the iris
    "e": hexc("#faffff"),  # the catchlight
    "p": hexc("#25131a"),  # the pupil
    "P": hexc("#985252"),  # inside the ear
    "R": hexc("#d88571"),  # bandana
    "F": hexc("#fff4d6"),  # its little flowers
    "D": hexc("#25131a"),  # a fold in the coat: the line of the hind thigh
}
SHEEN = hexc("#3c424e")  # light along the top of the black coat
SHADE = hexc("#b3a697")  # shade under the white fur
OUTLINE = hexc("#25131a")

# ---- the fixed drawings -----------------------------------------------------

# Her head in profile, facing left: a domed skull rising from a clear stop,
# a muzzle as long as the skull (husky standard) ending in a rounded glossy
# nose, the blaze running up the bridge, the near ear up (pink inside) and
# the far one tipped, and the eye at the stop where the white meets the
# black: catchlight, two-tone iris, pupil, a pixel of fur between it and
# the blaze.
HEAD = [
    "....K.K...",
    "...KPKKK..",
    "...KWKKKK.",
    ".KKWKeaKK.",
    "nWWWKEpKK.",
    "NWWWWKKKK.",
    ".WWWKKKK..",
]
# The head tilt she does when she's curious: the near ear drops, the far
# one rises, the muzzle dips a pixel.
HEAD_TILT = [
    "......KK..",
    "...KK.KK..",
    "...KPKKKK.",
    "...KWKeaK.",
    ".KKWKKEpK.",
    "nWWWWKKKK.",
    "NWWWWKKK..",
    ".WWWKKK...",
]
# Her body, the neck rising from the shoulders, the white chest and the
# bandana; the belly tucks up behind the ribs.
BODY = [
    "...WWKKK..........",
    "...WWKKKKKKKKKKK..",
    "..WRRKKKKKKKKKKKK.",
    "..RFRKKKKKKKKKKKKK",
    "...RWKKKKKKKKKKKKK",
    "...WWWKKKKKKKKKKKK",
    "....WWWWKKKK.KKKK.",
]
BODY_AT = (6, 9)  # where the body drawing sits in the frame
HEAD_AT = (1, 3)
SHOULDER = (11, 15)  # front legs hang from here
HIP = (20, 15)  # hind legs from here, under the thigh
RUMP = (22, 10)  # the tail grows from here


# ---- drawing helpers ----------------------------------------------------------

class Canvas:
    def __init__(self):
        self.g = [["." for _ in range(FW)] for _ in range(FH)]

    def put(self, x, y, ch):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < FW and 0 <= y < FH:
            self.g[y][x] = ch

    def stamp(self, rows, at, dx=0, dy=0):
        ox, oy = at
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch != ".":
                    self.put(ox + i + dx, oy + j + dy, ch)

    def line(self, a, b, ch, width=2):
        (x0, y0), (x1, y1) = a, b
        n = max(abs(x1 - x0), abs(y1 - y0), 1)
        for i in range(int(n) + 1):
            t = i / n
            x = x0 + (x1 - x0) * t
            y = y0 + (y1 - y0) * t
            for w in range(width):
                self.put(x + w, y, ch)

    def image(self):
        a = np.zeros((FH, FW, 4), np.uint8)
        g = self.g
        for y in range(FH):
            for x in range(FW):
                ch = g[y][x]
                if ch == ".":
                    continue
                c = INK[ch]
                above = g[y - 1][x] if y > 0 else "."
                below = g[y + 1][x] if y + 1 < FH else "."
                if ch == "K" and above == ".":
                    c = SHEEN  # light along her back
                elif ch == "W" and below == ".":
                    c = SHADE  # shade under her white fur
                a[y, x] = c + (255,)
        solid = a[..., 3] > 0
        p = np.pad(solid, 1)
        ring = ~solid & (p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:])
        a[ring] = OUTLINE + (255,)
        return Image.fromarray(a)


def front_leg(c, top, paw, lift, near):
    """A front leg: shoulder, elbow, wrist bending forward as it lifts, and
    the paw. White all the way down; her far legs in shade."""
    ch = "W" if near else "w"
    sx, sy = top
    px, py = paw
    ex, ey = sx + (px - sx) * 0.35 + 0.5, sy + 2  # the elbow
    wx, wy = px + (1 if lift else 0), py - 2  # the wrist folds as the paw lifts
    c.line((sx, sy), (ex, ey), ch)
    c.line((ex, ey), (wx, wy), ch)
    c.line((wx, wy), (px, py), ch)
    c.line((px - 1, py), (px + 1, py), ch, 1)  # the paw


def hind_leg(c, top, paw, lift, near):
    """A hind leg: hip, the stifle forward, the hock back, the paw. Black to
    the hock, white below it (her socks)."""
    dark, light = ("K", "W") if near else ("k", "w")
    hx, hy = top
    px, py = paw
    kx, ky = hx - 1 + (px - hx) * 0.3, hy + 2  # stifle
    jx, jy = px + 1 + (1 if lift else 0), py - 2  # hock
    c.line((hx, hy), (kx, ky), dark)
    c.line((kx, ky), (jx, jy), dark)
    c.line((jx, jy), (px, py), light)
    c.line((px - 1, py), (px + 1, py), light, 1)


def tail(c, root, angles, white_tip=2):
    """Her tail: a chain of segments from the rump, thick at the root, the
    last pixels white. `angles` are the segments' headings in degrees, 0
    pointing up, positive curling back toward her head."""
    x, y = root
    pts = [(x, y)]
    for a in angles:
        r = math.radians(a)
        x += math.sin(-r) * 1.6
        y -= math.cos(r) * 1.6
        pts.append((x, y))
    n = len(pts) - 1
    for i in range(n):
        ch = "W" if i >= n - white_tip else "K"
        c.line(pts[i], pts[i + 1], ch, 2 if i < n - 2 else 1)


# ---- poses ---------------------------------------------------------------------

def standing(c, legs, bob=0, nod=0, tail_angles=None, head=HEAD):
    """Lays down a standing frame: far legs, body, head, near legs, tail.
    legs: four (paw_x, lift) for near-front, far-front, near-hind, far-hind,
    paws measured from their joints."""
    (nfx, nfl), (ffx, ffl), (nhx, nhl), (fhx, fhl) = legs
    sh = (SHOULDER[0], SHOULDER[1] + bob)
    hp = (HIP[0], HIP[1] + bob)
    front_leg(c, (sh[0] + 2, sh[1]), (sh[0] + 2 + ffx, GROUND - ffl), ffl, False)
    hind_leg(c, (hp[0] - 2, hp[1]), (hp[0] - 2 + fhx, GROUND - fhl), fhl, False)
    c.stamp(BODY, BODY_AT, dy=bob)
    c.stamp(head, HEAD_AT, dy=bob + nod)
    front_leg(c, sh, (sh[0] + nfx, GROUND - nfl), nfl, True)
    hind_leg(c, hp, (hp[0] + nhx, GROUND - nhl), nhl, True)
    tail(c, (RUMP[0], RUMP[1] + bob), tail_angles or [-20, -10, 10, 40, 70])


def gait(t, offsets, stance, stride, lift):
    """Where each paw is at time t (0..1 through the cycle): on the ground it
    slides back under her as she moves forward; in the air it lifts and
    swings forward again."""
    out = []
    for o in offsets:
        p = (t + o) % 1
        if p < stance:
            s = p / stance
            out.append((round(-stride / 2 + stride * s), 0))
        else:
            s = (p - stance) / (1 - stance)
            out.append((round(stride / 2 - stride * s), round(lift * math.sin(math.pi * s))))
    return out


def walk_frames(n=8):
    """A walk: four beats, hind-left, fore-left, hind-right, fore-right, three
    paws down at any moment. The hips rise as each hind paw passes under
    her, the head nods against the body, and the tail sways a beat late."""
    frames = []
    for f in range(n):
        t = f / n
        # facing left she moves to -x, so a paw on the ground slides to +x
        legs = gait(t, [0.25, 0.75, 0.0, 0.5], 0.62, 5, 2)
        bob = -1 if f % 4 in (1, 2) else 0
        nod = 1 if f % 4 == 2 else 0
        sway = 12 * math.sin(2 * math.pi * (t - 0.12))
        c = Canvas()
        standing(c, legs, bob, nod, [-20 + sway * 0.3, -10 + sway * 0.6, 10 + sway, 40 + sway, 70 + sway])
        frames.append(c.image())
    return frames


def trot_frames(n=6):
    """A trot: diagonal pairs together (near-front with far-hind, far-front
    with near-hind), a longer stride and higher lift, and a moment with all
    four paws up; the body bobs on each beat."""
    frames = []
    for f in range(n):
        t = f / n
        legs = gait(t, [0.0, 0.5, 0.5, 0.0], 0.45, 7, 2)
        bob = -1 if f % 3 == 1 else 0
        nod = 1 if f % 3 == 2 else 0
        sway = 18 * math.sin(2 * math.pi * (t - 0.15))
        c = Canvas()
        standing(c, legs, bob, nod, [-30 + sway * 0.3, -25 + sway * 0.6, -10 + sway, 15 + sway, 40 + sway])
        frames.append(c.image())
    return frames


def idle_frames():
    """Standing at ease: a slow breath (her back rising a pixel), her tail
    wagging and arriving a frame after the body, and a flick of the ear."""
    frames = []
    wag = [[-20, -10, 10, 40, 70], [-15, 0, 25, 55, 85], [-20, -10, 10, 40, 70], [-25, -20, -5, 25, 55]]
    for f in range(4):
        c = Canvas()
        standing(c, [(0, 0), (2, 0), (0, 0), (-2, 0)], -1 if f in (1, 2) else 0, 0, wag[f])
        frames.append(c.image())
    return frames


def tilt_frames():
    """The curious head tilt: anticipation (a dip), the tilt, held."""
    out = []
    for head, nod in ((HEAD, 1), (HEAD_TILT, -1), (HEAD_TILT, -1)):
        c = Canvas()
        standing(c, [(0, 0), (2, 0), (0, 0), (-2, 0)], 0, nod, None, head)
        out.append(c.image())
    return out


SIT = [
    "....K.K.............",
    "...KPKKK............",
    "...KWKKKK...........",
    ".KKWKeaKK...........",
    "nWWWKEpKK...........",
    "NWWWWKKKK...........",
    ".WWWKKKK............",
    "...WWKKKK...........",
    "..WRRKKKKK..........",
    "..RFRKKKKKK.........",
    "...RWKKKKKKK........",
    "...WWKKKKKKKK.......",
    "...WWWKKKKKKKK......",
    "...WWWKKKKKKKKK.....",
    "...WW.WKKKKKKKK.....",
    "...WW..KKKKKKKKWW...",
    "...WW..KKKKKKKKKWW..",
    "..WWW.wwKKKKKKWWWW..",
]
LIE = [
    "....K.K.....................",
    "...KPKKK....................",
    "...KWKKKK...................",
    ".KKWKeaKK...................",
    "nWWWKEpKK...................",
    "NWWWWKKKK...................",
    ".WWWKKKK....................",
    "..WWWKKK..........KK..KW....",
    "..WRRKKK.......KKKKKK.KW....",
    "..RFRKKKKKKKKKKKKKKKKK......",
    "...RWKKKKKKKKKKKDKKKK.......",
    "...WWKKKKKKKKKKDKKKKK.......",
    ".WWWWWWWWKKKKKDKKKKWWW......",
    "WWWWWWWWW..WWWWWWWWWWWW.....",
    "wwwwwwww............wwww....",
]


def still(rows, at, breathe=False):
    c = Canvas()
    c.stamp(rows, at)
    if breathe:
        # her back rising with a breath: lift the top row of her body a pixel
        for x in range(FW):
            for y in range(at[1] + 8, FH):
                if c.g[y][x] == "K" and c.g[y - 1][x] == ".":
                    c.g[y - 1][x] = "K"
                    break
    return c.image()


def sit_frames():
    """Sitting: a two-frame breath."""
    at = (4, GROUND - len(SIT) + 1)
    return [still(SIT, at), still(SIT, at, True)]


def lie_frames():
    """Lying down as on the carpet: a slow two-frame breath."""
    at = (2, GROUND - len(LIE) + 1)
    return [still(LIE, at), still(LIE, at, True)]


# Her animations: name -> (frames, frames per second, loops).
def animations():
    return {
        "idle": (idle_frames(), 4, True),
        "walk": (walk_frames(), 10, True),
        "trot": (trot_frames(), 12, True),
        "tilt": (tilt_frames(), 6, False),
        "sit": (sit_frames(), 2, True),
        "lie": (lie_frames(), 1.5, True),
    }


def sheet():
    """Every frame in one strip, and where each animation's frames are."""
    anims = animations()
    frames, index, i = [], {}, 0
    for name, (fs, fps, loop) in anims.items():
        index[name] = {"frames": list(range(i, i + len(fs))), "fps": fps, "loop": loop}
        frames += fs
        i += len(fs)
    strip = Image.new("RGBA", (FW * len(frames), FH))
    for k, f in enumerate(frames):
        strip.alpha_composite(f, (k * FW, 0))
    return strip, index


def preview(path):
    """Every animation laid out row by row, enlarged, with an animated GIF of
    each beside the docs."""
    anims = animations()
    S = 6
    rows = len(anims)
    most = max(len(fs) for fs, _, _ in anims.values())
    img = Image.new("RGBA", (most * FW * S + 40, rows * FH * S + 20), (240, 236, 208, 255))
    for r, (name, (fs, _, _)) in enumerate(anims.items()):
        for k, f in enumerate(fs):
            img.alpha_composite(f.resize((FW * S, FH * S), Image.NEAREST), (20 + k * FW * S, 10 + r * FH * S))
    img.save(path)
    for name, (fs, fps, _) in anims.items():
        big = [Image.alpha_composite(Image.new("RGBA", (FW, FH), (240, 236, 208, 255)), f).resize((FW * S, FH * S), Image.NEAREST).convert("P", palette=Image.ADAPTIVE) for f in fs]
        big[0].save(DOCS / f"olive-{name}.gif", save_all=True, append_images=big[1:], duration=int(1000 / fps), loop=0)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    DOCS.mkdir(parents=True, exist_ok=True)
    strip, index = sheet()
    strip.save(OUT / "olive.png")
    import json
    (OUT / "olive.json").write_text(json.dumps({"frameWidth": FW, "frameHeight": FH, "animations": index}, indent=1) + "\n")
    preview(DOCS / "olive-sheet.png")
    print("frames", strip.width // FW, {k: len(v["frames"]) for k, v in index.items()})
