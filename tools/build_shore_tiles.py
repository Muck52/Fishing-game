"""Builds the shoreline tileset from the Zelda-like overworld pack (CC0).

The pack's island tile is a 32x32 patch of grass ringed by a foamy water edge.
Cutting 16x16 windows from it at 8-pixel offsets gives a full set of edge,
corner and centre tiles. A centre tile with flowers, one with a boulder, and
the four quarters of the pack's small raft (used as a boat landing) follow.
Output: assets/art/environments/shore-tiles.png, 8 x 2 tiles of 16 px.

    python3 tools/build_shore_tiles.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ENV = ROOT / "assets/art/environments"
T = 16

src = Image.open(ENV / "zelda-like-overworld.png").convert("RGBA")


def cut(x, y, w=T, h=T):
    return src.crop((x, y, x + w, y + h))


def over(base, top, dx=0, dy=0):
    out = base.copy()
    out.alpha_composite(top, (dx, dy))
    return out


IX, IY = 32, 144  # the island patch
tiles = [
    cut(IX, IY), cut(IX + 8, IY), cut(IX + 16, IY),  # 1-3: top-left, top, top-right
    cut(IX, IY + 8), cut(IX + 8, IY + 8), cut(IX + 16, IY + 8),  # 4-6: left, centre, right
    cut(IX, IY + 16), cut(IX + 8, IY + 16), cut(IX + 16, IY + 16),  # 7-9: bottom row
]
centre = tiles[4]
tiles.append(over(centre, cut(0, 128)))  # 10: flowers
rock = src.crop((100, 85, 111, 94))
tiles.append(over(centre, rock, 3, 5))  # 11: boulder
raft = Image.new("RGBA", (32, 32))
raft.alpha_composite(src.crop((136, 105, 168, 131)), (0, 3))
tiles += [raft.crop((x, y, x + T, y + T)) for y in (0, T) for x in (0, T)]  # 12-15

sheet = Image.new("RGBA", (8 * T, 2 * T))
for i, t in enumerate(tiles):
    sheet.alpha_composite(t, ((i % 8) * T, (i // 8) * T))
sheet.save(ENV / "shore-tiles.png", optimize=True)
print(f"{len(tiles)} tiles")
