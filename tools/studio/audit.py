"""Measures every image in the game the same way, so the art can be judged
against one set of rules (docs/studio/audit.md).

    python3 tools/studio/audit.py     -> docs/studio/audit/audit.json and contact sheets

For each image (the first frame of a sheet):
- origin: which art pack it came from, or "ours" (drawn by our scripts);
- colours: how many distinct colours it uses;
- outline: of the pixels on its silhouette's edge, the share in the shared
  outline colour #25131a (actors should be near 1, scenery near 0);
- cluster: the average run of same-coloured pixels along a row; small
  numbers mean busy, noisy detail, large ones flat shapes;
- noise: the share of pixels that differ from all four neighbours (lone
  pixels; a little is texture, a lot is noise);
- dither: the share of 2x2 squares in a checkerboard (two colours
  alternating);
- doubled: the share of 2x2 squares of one colour on the even grid; near 1
  means the art was drawn at 2x and enlarged (breaks the one pixel grid);
- hue shift: how far the hue of its darkest quarter turns from its
  lightest quarter, in degrees, positive toward blue (cool shadows, warm
  light, as our creatures do), near 0 for plain darkening;
- contrast and saturation: the spread of brightness and the mean
  saturation, 0..1.
"""
import colorsys
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "studio" / "audit"

ORIGIN = {
    "sky": "craftpix mountain river", "mountains": "craftpix mountain river", "cloud-big": "craftpix mountain river",
    "land": "ours (study 2)", "falls": "ours (study 2)",
    "cloud-1": "pixel frog", "cloud-2": "pixel frog", "cloud-3": "pixel frog",
    "water-surface": "craftpix fishing", "hut": "craftpix fishing", "post-wet": "craftpix fishing", "barrel": "craftpix fishing",
    "boat": "craftpix fishing", "angler": "craftpix fishing", "bucket": "craftpix fishing",
    "cattails-1": "craftpix fishing", "cattails-2": "craftpix fishing", "cattails-3": "craftpix fishing", "cattails-4": "craftpix fishing",
    "underwater": "ansimuz (light) + ours", "splash": "pixel frog", "bubble": "pixel frog", "coin": "pixel frog",
    "board": "pixel frog", "button": "pixel frog",
    "bed-clam-small": "reactorcore", "bed-sand-pit-2": "reactorcore", "bed-sand-pit-3": "reactorcore",
    "bed-sand-pit-4": "reactorcore", "bed-sand-pit-5": "reactorcore",
    "bed-seaweed-1": "reactorcore", "bed-seaweed-2": "reactorcore", "bed-seaweed-3": "reactorcore", "bed-seaweed-4": "reactorcore",
    "bed-sea-bush-weed-1": "reactorcore", "bed-sea-bush-weed-2": "reactorcore", "bed-sea-flora-plant-1": "reactorcore",
    "bed-sea-flora-plant-2": "reactorcore", "bed-sea-flora-plant-3": "reactorcore", "bed-sea-flora-plant-4": "reactorcore",
    "lakebed": "reactorcore (sand) + ours", "shelf": "ours (from the far bank)", "ripple-tiny": "amberfall (cut down)",
    "ripple": "amberfall", "branch": "amberfall", "bobber": "nelson yiap",
}
GROUPS = [
    ("Scenery", lambda k: k in ("sky", "mountains", "cloud-big", "land", "falls", "cloud-1", "cloud-2", "cloud-3", "water-surface",
                                "underwater", "lakebed", "shelf", "post-wet") or k.startswith("bed-") or k.startswith("cattails")),
    ("Props", lambda k: k in ("hut", "barrel", "boat", "branch", "bobber", "hook", "hut-lights")),
    ("Characters and creatures", lambda k: k in ("angler", "olive", "deer", "fox", "hare", "bear", "gull", "sparrow", "mallard", "eagle", "minnow")),
    ("Fish", lambda k: k.startswith("fish-") or k.startswith("card-")),
    ("Effects", lambda k: k in ("splash", "bubble", "ripple", "ripple-tiny", "drop", "spark", "star", "mote", "mist", "firefly", "light-ray")),
    ("Interface", lambda k: k in ("board", "button", "coin", "bucket", "backpack", "journal", "journal-held")),
]
OUTLINE = np.array([37, 19, 26])


def frame_of(url, sheet):
    img = Image.open(ROOT / url).convert("RGBA")
    if sheet:
        img = img.crop((0, 0, sheet["frameWidth"], sheet["frameHeight"]))
    return img


def measure(img):
    a = np.asarray(img).astype(int)
    solid = a[..., 3] > 0
    if solid.sum() == 0:
        return None
    rgb = a[..., :3]
    cols = {tuple(c) for c in rgb[solid]}
    pad = np.pad(solid, 1)
    inner = pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:]
    edge = solid & ~inner
    outline = float((np.all(rgb[edge] == OUTLINE, axis=-1)).mean()) if edge.any() else 0.0
    # runs along rows
    same = solid[:, 1:] & solid[:, :-1] & np.all(rgb[:, 1:] == rgb[:, :-1], axis=-1)
    runs = solid.sum() / max(1, solid.sum() - same.sum())
    # lone pixels
    key = rgb[..., 0] * 65536 + rgb[..., 1] * 256 + rgb[..., 2]
    kp = np.pad(key, 1, constant_values=-1)
    n = [kp[:-2, 1:-1], kp[2:, 1:-1], kp[1:-1, :-2], kp[1:-1, 2:]]
    lone = solid & np.all([key != m for m in n], axis=0)
    # 2x2 squares
    k00, k01, k10, k11 = key[:-1, :-1], key[:-1, 1:], key[1:, :-1], key[1:, 1:]
    s4 = solid[:-1, :-1] & solid[:-1, 1:] & solid[1:, :-1] & solid[1:, 1:]
    checker = s4 & (k00 == k11) & (k01 == k10) & (k00 != k01)
    ev = s4[::2, ::2] & (k00 == k01)[::2, ::2] & (k00 == k10)[::2, ::2] & (k00 == k11)[::2, ::2]
    # brightness, saturation, hue shift
    px = rgb[solid] / 255
    lum = px @ np.array([0.3, 0.59, 0.11])
    hsv = np.array([colorsys.rgb_to_hsv(*p) for p in px[:: max(1, len(px) // 4000)]])
    lum_s = hsv[:, 2]
    lo, hi = np.quantile(lum_s, 0.25), np.quantile(lum_s, 0.75)
    sat = hsv[:, 1]

    def mean_hue(mask):
        h = hsv[mask & (sat > 0.08), 0] * 2 * np.pi
        if len(h) == 0:
            return None
        return np.arctan2(np.sin(h).mean(), np.cos(h).mean())

    hd, hl = mean_hue(lum_s <= lo), mean_hue(lum_s >= hi)
    shift = None
    if hd is not None and hl is not None:
        # positive when the shadows sit nearer blue (240°) than the lights do
        blue = 240 / 360 * 2 * np.pi
        dist = lambda h: abs((h - blue + np.pi) % (2 * np.pi) - np.pi)  # noqa: E731
        shift = round(float(np.degrees(dist(hl) - dist(hd))), 1)
    return {
        "size": list(img.size), "pixels": int(solid.sum()), "colours": len(cols),
        "outline": round(outline, 2), "cluster": round(float(runs), 2),
        "noise": round(float(lone.sum() / solid.sum()), 3), "dither": round(float(checker.sum() / max(1, s4.sum())), 3),
        "doubled": round(float(ev.sum() / max(1, s4[::2, ::2].sum())), 2), "hue_shift": shift,
        "contrast": round(float(lum.std()), 3), "saturation": round(float(sat.mean()), 3),
    }


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    m = json.loads((ROOT / "assets" / "art" / "manifest.json").read_text())
    items = {k: (u, None) for k, u in m["images"].items()}
    items.update({k: (s["url"], s) for k, s in m["sheets"].items()})
    res = {}
    for k, (u, s) in sorted(items.items()):
        img = frame_of(u, s)
        r = measure(img)
        if r:
            r["origin"] = ORIGIN.get(k, "ours")
            r["url"] = u
            res[k] = r
    (OUT / "audit.json").write_text(json.dumps(res, indent=1) + "\n")
    # contact sheets by group, on a mid sky colour, at 2x
    for title, test in GROUPS:
        keys = [k for k in res if test(k)]
        imgs = []
        for k in keys:
            u, s = items[k]
            im = frame_of(u, s)
            if im.width > 200:
                im = im.resize((200, max(1, round(im.height * 200 / im.width))), Image.NEAREST)
            imgs.append(im)
        if not imgs:
            continue
        W = 720
        x = y = rowh = 0
        place = []
        for im in imgs:
            if x + im.width > W:
                x, y, rowh = 0, y + rowh + 6, 0
            place.append((x, y))
            x += im.width + 6
            rowh = max(rowh, im.height)
        sheet = Image.new("RGBA", (W, y + rowh), (178, 208, 208, 255))
        for im, p in zip(imgs, place):
            sheet.alpha_composite(im, p)
        sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).save(OUT / f"{title.split()[0].lower()}.png")
    print(len(res), "images measured")


if __name__ == "__main__":
    main()
