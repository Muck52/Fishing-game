"""Study 7: the land animals (Olive, the deer, fox, hare and bear).

On the new beach they looked flat: big areas of one colour, lit only along
their top and bottom rows, while the scenery round them is lit as rounded
masses from the upper left. This study tries three ways of lighting and
texturing them, on the finished sheets (the drawing and animation stay the
same; only how the pixels are lit changes):

- **A, lit as one mass:** each animal lit like the bank's rock and trees:
  toward the sun (upper left) a band of light, away from it (lower right) a
  band of shade, one calm tone between, worked out afresh from each frame's
  silhouette so it moves with the body.
- **B, mass and fur:** A, plus fur: where two different colours of coat
  meet (a deer's white throat and tan neck, a fox's white chest and red
  flank) the edge interlocks like hair instead of running straight.
- **C, sunlit fur:** B, plus the light of the scene: a warm rim where the
  sun catches the top of the back, and a cool, faint light bounced up from
  the sand along the belly.

All three also get, in the game itself, a soft shadow under each animal,
and the visitors now walk through the cattails to stop on the open sand
(src/wildlife/Wildlife.js), so they aren't hidden behind the reeds.

    python3 tools/studio/study_land.py   -> docs/studio/studies/07-land/
"""
import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "characters"))
from light import LAND, lit  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "assets" / "art"
OUT = ROOT / "docs" / "studio" / "studies" / "07-land"


def treat(path, fw, mode):
    return lit(Image.open(path), fw, mode)


def lineup(sheets, frames):
    land = Image.open(ART / "environments" / "land.png").convert("RGBA")
    bg = land.crop((150, 236, 150 + 300, 310)).copy()
    x = 4
    for name in LAND:
        img, fw, fh = sheets[name]
        i = frames[name]
        f = img.crop((i * fw, 0, (i + 1) * fw, fh))
        bg.alpha_composite(f, (x, 66 - fh))
        x += fw + 6
    return bg.resize((bg.width * 4, bg.height * 4), Image.NEAREST)


if __name__ == "__main__":
    m = json.loads((ART / "manifest.json").read_text())
    frames = {}
    for name in LAND:
        a = m["anchors"]["olive"] if name == "olive" else m["anchors"]["creatures"][name]
        frames[name] = (a.get("idle") or a.get("stand") or next(iter(a.values())))["frames"][0]
    OUT.mkdir(parents=True, exist_ok=True)
    for mode in ("now", "A", "B", "C"):
        sheets = {}
        for name in LAND:
            s = m["sheets"][name]
            path = ROOT / s["url"]
            img = Image.open(path).convert("RGBA") if mode == "now" else treat(path, s["frameWidth"], mode)
            sheets[name] = (img, s["frameWidth"], s["frameHeight"])
            if mode != "now":
                dst = OUT / mode / path.relative_to(ART)
                dst.parent.mkdir(parents=True, exist_ok=True)
                img.save(dst)
        lineup(sheets, frames).save(OUT / f"{mode}-lineup.png")
        print(mode)
