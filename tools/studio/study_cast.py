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
import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "characters"))
from edges import treat  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "assets" / "art"
OUT = ROOT / "docs" / "studio" / "studies" / "06-cast"
MODES = ("A", "B", "C")

LAND = ["olive", "deer", "fox", "hare", "bear"]
BIRDS = ["gull", "eagle", "mallard", "sparrow"]
FISH = ["bluegill", "pumpkinseed", "perch", "crappie", "whitebass", "carp", "bass", "largemouth", "trout",
        "rainbow", "channelcat", "drum", "walleye", "catfish", "pike", "muskie", "golden"]


def sheet_key(name):
    return name if name in LAND + BIRDS + ["minnow"] else f"fish-{name}"


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
