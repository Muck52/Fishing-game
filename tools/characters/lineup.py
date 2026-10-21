"""Everyone side by side at game size, beside the angler, so their sizes can
be checked against each other: docs/characters/lineup.png (shown 4x).

    python3 tools/characters/lineup.py
"""
import importlib
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kit  # noqa: E402

GROUND = ["olive", "deer", "fox", "hare", "bear"]
SKY = ["eagle", "gull", "mallard", "sparrow", "minnow"]


def first(name):
    m = importlib.import_module(name)
    a = m.animations()
    key = "idle" if "idle" in a else next(iter(a))
    img = kit.image(a[key][0][0], m.INK)
    return img.crop(img.getbbox())


def main():
    ang = Image.open(kit.ART / "angler.png").convert("RGBA").crop((0, 0, 48, 48))
    ang = ang.crop(ang.getbbox())
    row1 = [ang] + [first(n) for n in GROUND]
    row2 = [first(n) for n in SKY]
    w = max(sum(i.width + 6 for i in r) for r in (row1, row2)) + 6
    h1, h2 = max(i.height for i in row1), max(i.height for i in row2)
    img = Image.new("RGBA", (w, h1 + h2 + 14), kit.PREVIEW_BG)
    x = 6
    for i in row1:
        img.alpha_composite(i, (x, 4 + h1 - i.height))
        x += i.width + 6
    x = 6
    for i in row2:
        img.alpha_composite(i, (x, h1 + 10 + (h2 - i.height) // 2))
        x += i.width + 6
    img.resize((img.width * 4, img.height * 4), Image.NEAREST).save(kit.DOCS / "lineup.png")


if __name__ == "__main__":
    main()
