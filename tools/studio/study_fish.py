"""Study 10: the fish.

The seventeen species (and how they swim) are painted by tools/fish_art.py
straight onto the grid. Next to the redrawn cast they had fallen behind:
their colours are snapped to the old pack palette in the art build (the
land animals and birds keep their own), their eye is one dark pixel where
every other animal has the cast's big eye with a catchlight, and at
swimming size only one signature marking is drawn. Three versions, each
building on the last (the styles are in fish_art.STYLES):

- **A, their own colours and the cast's eye:** the same drawing, kept in
  its painted colours (no palette snap), with the cast's eye.
- **B, A in the cast's proportions:** deeper, rounder bodies, blunter
  heads, a thicker tail stalk, a bigger eye on the journal card.
- **C, B in full detail:** every marking at swimming size, fin rays, a
  shimmer of scales and the lateral line.

    python3 tools/studio/study_fish.py   -> docs/studio/studies/10-fish/
"""
import json
import math
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
sys.path.insert(0, str(ROOT / "tools" / "characters"))
import fish_art  # noqa: E402
from edges import treat  # noqa: E402

ART = ROOT / "assets" / "art"
OUT = ROOT / "docs" / "studio" / "studies" / "10-fish"


def swim(img, n=6):
    """The swimming wave, as the art build makes it (tools/build_art.py fish)."""
    w, h = img.size
    frames = []
    sp = img.load()
    for f in range(n):
        out = Image.new("RGBA", (w, h + 4))
        dp = out.load()
        for x in range(w):
            t = x / (w - 1)
            amp = 0.35 + 1.6 * max(0, t - 0.35) ** 1.5 / 0.65 ** 1.5
            dy = round(amp * math.sin(f / n * math.pi * 2 - t * math.pi * 1.4))
            for y in range(h):
                if sp[x, y][3]:
                    dp[x, y + 2 + dy] = sp[x, y]
        frames.append(out)
    strip = Image.new("RGBA", (w * n, h + 4))
    for i, f in enumerate(frames):
        strip.alpha_composite(f, (i * w, 0))
    return treat(strip, w), (w, h + 4)


def build(v):
    """A version's sheets and cards, and their frame sizes."""
    sizes = {}
    d = OUT / v / "fish"
    d.mkdir(parents=True, exist_ok=True)
    for sid in fish_art.SPECIES:
        img = fish_art.paint(sid, fish_art.LENGTH[sid], style=v)
        card = fish_art.paint(sid, min(150, round(fish_art.LENGTH[sid] * 3.4)), card=True, style=v)
        sheet, fr = swim(img)
        sheet.save(d / f"{sid}.png")
        card.save(d / f"{sid}-card.png")
        sizes[sid] = fr
    return sizes


def frames_of(v):
    out = {}
    m = json.loads((ART / "manifest.json").read_text())
    for sid in fish_art.SPECIES:
        if v == "now":
            s = m["sheets"][f"fish-{sid}"]
            img = Image.open(ROOT / s["url"]).convert("RGBA")
            card = Image.open(ART / "fish" / f"{sid}-card.png").convert("RGBA")
            fw = s["frameWidth"]
        else:
            img = Image.open(OUT / v / "fish" / f"{sid}.png").convert("RGBA")
            card = Image.open(OUT / v / "fish" / f"{sid}-card.png").convert("RGBA")
            fw = img.width // 6
        f = img.crop((0, 0, fw, img.height))
        out[sid] = (f.crop(f.getbbox()), card)
    return out


WATER = (46, 93, 120)


def lineup(v, scale=4):
    """All seventeen swimming, in three rows, against the lake."""
    fr = frames_of(v)
    rows = [list(fish_art.SPECIES)[i:i + 6] for i in (0, 6, 12)]
    W = max(sum(fr[s][0].width + 4 for s in r) for r in rows) + 4
    hs = [max(fr[s][0].height for s in r) + 6 for r in rows]
    bg = Image.new("RGBA", (W, sum(hs)), (*WATER, 255))
    y = 0
    for r, h in zip(rows, hs):
        x = 4
        for s in r:
            img = fr[s][0]
            bg.alpha_composite(img, (x, y + (h - img.height) // 2))
            x += img.width + 4
        y += h
    return bg.resize((W * scale, bg.height * scale), Image.NEAREST)


def cards(v, scale=2, only=("bluegill", "perch", "trout", "walleye", "pike", "golden")):
    """The journal's large paintings, for a few species."""
    fr = frames_of(v)
    imgs = [fr[s][1] for s in only]
    cols = 3
    cw = max(i.width for i in imgs) + 8
    ch = max(i.height for i in imgs) + 8
    bg = Image.new("RGBA", (cw * cols, ch * 2), (236, 226, 200, 255))
    for k, img in enumerate(imgs):
        x, y = (k % cols) * cw, (k // cols) * ch
        bg.alpha_composite(img, (x + (cw - img.width) // 2, y + (ch - img.height) // 2))
    return bg.resize((bg.width * scale, bg.height * scale), Image.NEAREST)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    info = {}
    for v in ("A", "B", "C"):
        info[v] = build(v)
    (OUT / "sizes.json").write_text(json.dumps(info))
    for v in ("now", "A", "B", "C"):
        lineup(v).save(OUT / f"{v}-lineup.png")
        cards(v).save(OUT / f"{v}-cards.png")
        print(v)
