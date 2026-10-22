"""Study 13: the animals' scale beside the angler.

Every animal measured against the angler (39 pixels for a man of 5 ft 10,
so 0.219 pixels to the centimetre) and against its real size. The deer,
buck and bear were near true size; Olive, the fox and the mallards nearly
twice it; the hare and the gull nearly three times; the sparrow four
times; the fish three to four. Three ways to set them right, each a size
for every animal (in tools/studio/study_scale.py, SIZES):

- **A, true scale:** everyone at life size beside him. Tiny animals get
  tiny: the sparrow is three pixels long, a bluegill four, a minnow two.
- **B, true scale with a floor:** life size for anything big enough to
  read; below about 16 pixels, sizes are lifted toward a readable floor
  (8 pixels plus half the true size), still in order of size.
- **C, gently compressed:** every size pulled toward the deer's on one
  smooth curve (true size times (170 cm / true size)^0.4), the way games
  like Stardew Valley keep small animals readable, still in order.

Each animal is redrawn at its new size from its shapes (not shrunk), so
its edges stay clean.

    python3 tools/studio/study_scale.py   -> docs/studio/studies/13-scale/
"""
import copy
import json
import math
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
sys.path.insert(0, str(ROOT / "tools" / "characters"))
sys.path.insert(0, str(ROOT / "tools" / "studio"))
import fish_art  # noqa: E402
import study_bird_detail as bd  # noqa: E402
import study_creatures as sc  # noqa: E402
from edges import treat  # noqa: E402

OUT = ROOT / "docs" / "studio" / "studies" / "13-scale"
ART = ROOT / "assets" / "art"
PX_PER_CM = 39 / 178  # the angler: 39 pixels, a man of 178 cm

# Real sizes in cm, adults, in the pose shown: (length, height). Length is
# nose to tail tip (or to the rump with a short tail); height is the ground
# to the top of the head or ears. Sources: field guides and state DNR
# species pages (white-tailed deer, red fox, snowshoe hare, black bear,
# common loon, ring-billed gull, bald eagle, mallard, song sparrow); fish
# at a typical adult catch length.
REAL = {
    "olive": (95, 70), "deer": (170, 150), "buck": (185, 185), "fox": (105, 55), "hare": (45, 40), "bear": (165, 90),
    "gull": (46, 30), "eagle": (35, 80), "sparrow": (15, 13), "mallard": (58, 25), "loon": (80, 25),
}
FISH_CM = {"bluegill": 20, "pumpkinseed": 18, "perch": 25, "crappie": 25, "whitebass": 30, "carp": 60, "bass": 40,
           "largemouth": 45, "trout": 30, "rainbow": 50, "channelcat": 60, "drum": 50, "walleye": 50, "catfish": 50,
           "pike": 75, "muskie": 110, "golden": 150, "minnow": 7}
LAND = ["olive", "deer", "buck", "fox", "hare", "bear"]
BIRDS = {"gull": ("gull", "rest", None), "eagle": ("eagle", "rest", None), "sparrow": ("sparrow", "perch", None),
         "mallard": ("mallard", "rest", 9), "loon": ("loon", "rest", 9)}


def target(px, option):
    """A true size in pixels, as each version shows it."""
    if option == "A":
        return px
    if option == "B":
        return max(px, 8 + 0.5 * px)
    if option == "C":
        return px * (170 * PX_PER_CM / px) ** 0.4
    raise KeyError(option)


def scale_spec(spec, k):
    """An animal's shapes, all scaled by k (its frame, ground and every
    point and width), to be drawn again at the new size."""
    s = copy.deepcopy(spec)
    pt = lambda p: (p[0] * k, p[1] * k)  # noqa: E731
    pts = lambda ps: [pt(p) for p in ps]  # noqa: E731
    s["frame"] = (math.ceil(spec["frame"][0] * k) + 2, math.ceil(spec["frame"][1] * k) + 2)
    s["ground"] = spec["ground"] * k
    if "dx" in s:
        s["dx"] = s["dx"] * k
    s["tiny_eye"] = k < 0.6
    for pose in s["poses"].values():
        for key, v in list(pose.items()):
            if key in ("pivot", "eye", "nose"):
                pose[key] = pt(v)
            elif key in ("torso", "neck", "head"):
                pose[key] = pts(v)
            elif key in ("ears", "ears_far", "marks", "head_marks", "behind", "front"):
                pose[key] = [(ch, pts(p)) for ch, p in v]
            elif key in ("tail", "antlers", "antlers_far"):
                pose[key] = [(ch, pts(p), [w * k for w in ws]) for ch, p, ws in v]
            elif key == "legs":
                pose[key] = [(side, pts(j), [w * k for w in ws]) for side, j, ws in v]
    return s


def measure(img):
    b = img.getbbox()
    return b[2] - b[0] - 2, b[3] - b[1] - 2


def now_size(name):
    """The animal's size now, drawn at scale 1."""
    if name in LAND:
        return measure(sc.render(sc.ANIMALS[name], "between", "stand"))
    n, pose, water = BIRDS[name]
    return measure(bd.render(n, pose, "B", water=water))


def sized(name, option):
    """The animal redrawn at a version's size, and its factor."""
    w, h = now_size(name)
    L, Hc = REAL[name]
    tw, th = target(L * PX_PER_CM, option), target(Hc * PX_PER_CM, option)
    if name in ("mallard", "loon"):
        k = tw / w  # on the water only its length counts
    elif name == "eagle":
        k = th / h  # perched, upright
    else:
        k = math.sqrt((tw / w) * (th / h))
    if name in LAND:
        img = sc.render(scale_spec(sc.ANIMALS[name], k), "between", "stand")
    else:
        n, pose, water = BIRDS[name]
        img = bd.render(n, pose, "B", water=water, scale=k)
    return img.crop(img.getbbox()), k


def fish(sid, option):
    L = round(target(FISH_CM[sid] * PX_PER_CM, option))
    L = max(L, 4)
    sp = fish_art.SPECIES.get(sid) or fish_art.EXTRA[sid]
    img = fish_art.paint(sid, max(L, 4), style="C")
    return treat(img, img.width), L


def angler():
    s = json.loads((ART / "manifest.json").read_text())["sheets"]["angler"]
    im = Image.open(ROOT / s["url"]).convert("RGBA").crop((0, 0, 48, 48))
    return im.crop(im.getbbox())


def lineup(option, scale=4):
    """Everyone side by side on the sand with the angler: land animals and
    the birds at rest, then the fish, each with its size beside it."""
    land = Image.open(ART / "environments" / "land.png").convert("RGBA")
    a = angler()
    items = [a] + [sized(n, option)[0] for n in LAND] + [sized(n, option)[0] for n in ("eagle", "gull", "sparrow")]
    water = [sized(n, option)[0] for n in ("loon", "mallard")]
    fishes = [fish(s, option)[0] for s in FISH_CM]
    w1 = sum(i.width + 4 for i in items) + 4
    w2 = sum(i.width + 4 for i in water + fishes) + 4
    W = max(w1, w2)
    top = max(i.height for i in items) + 6
    H = top + 40
    bg = Image.new("RGBA", (W, H), (46, 93, 120, 255))
    strip = land.crop((150, 306 - top, 330, 306))
    for x0 in range(0, W, strip.width):
        bg.alpha_composite(strip, (x0, 0))
    x = 4
    for im in items:
        bg.alpha_composite(im, (x, top - 2 - im.height))
        x += im.width + 4
    x = 4
    for im in water + fishes:
        bg.alpha_composite(im, (x, top + 6 + (16 - im.height // 2) if im in fishes else top + 2))
        x += im.width + 4
    return bg.resize((W * scale, H * scale), Image.NEAREST)


def table():
    """The numbers: real size, now, and each version's size, in pixels."""
    rows = []
    for n in LAND + list(BIRDS):
        w, h = now_size(n)
        L, Hc = REAL[n]
        rows.append({"name": n, "real_cm": [L, Hc], "true_px": [round(L * PX_PER_CM, 1), round(Hc * PX_PER_CM, 1)], "now_px": [w, h],
                     **{o: list(measure(sized(n, o)[0])) for o in "ABC"}})
    for s, cm in FISH_CM.items():
        now = json.loads((ART / "manifest.json").read_text())
        rows.append({"name": s, "real_cm": [cm, None], "true_px": [round(cm * PX_PER_CM, 1), None],
                     "now_px": [fish_art.LENGTH.get(s, 12), None], **{o: [fish(s, o)[1], None] for o in "ABC"}})
    return rows


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "sizes.json").write_text(json.dumps(table(), indent=1))
    for o in "ABC":
        lineup(o).save(OUT / f"{o}-lineup.png")
        print(o)
