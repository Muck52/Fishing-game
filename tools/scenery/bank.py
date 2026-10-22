"""The far bank, as chosen in study 2 (version C, the birch cove):
docs/studio/studies.md.

A low bank and a pebble beach where the animals come down to drink, white
birch and aspen against dark spruce, a pair of red pines, and a pink
granite bluff with its waterfall (study 3, version A, the tiered cascade):
the river comes down a notch worn into the bluff's top and drops down
three of the bluff's own ledges, among boulders at the foot, into a pool
and out between stones to the lake. Above it (study 4, version B, the
plateau river, as reworked: rim_river) the river runs along just behind
the bluff's top edge, in from the right with a few easy, uneven bends,
widening as it sweeps round and down into the lip; it has banks, gravel
bars, trees on its far banks and a few spruce on the rim in front. The
bluff's face has life on it: rain stains, branching cracks with green in
them, and along its ledges grass, shrubs, saplings, boulders and hanging
creepers (study_mountain.life). Drawn by the study's tools
(tools/studio/study_bank.py) from the materials library, in daylight; the
game's time-of-day grade shades it.

The art build saves the bank as environments/land.png and its water as
the four-frame environments/falls.png.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "studio"))
import study_bank as s  # noqa: E402
import study_mountain as mountain  # noqa: E402


def images():
    """(land, falls strip, anchors) for the art build."""
    return s.images(s.version_c(mountain.plateau_life))


MOUTH_X, MOUTH_W, MOUTH_H = 189, 26, 6  # where the outflow meets the lake, on screen


def mouth():
    """Where the outflow runs into the lake: four frames laid over the top
    of the lake's surface band, in its own colours, the band's dark
    shoreline line opened up where the river comes in, and the river's
    foam spreading out on the lake and fading."""
    from PIL import Image
    R = s.materials()
    lake = {"hi": "#b0ecf0", "light": "#86a398"}
    frames = []
    for f in range(s.FRAMES):
        img = Image.new("RGBA", (MOUTH_W, MOUTH_H))
        px = img.load()
        rnd = s.random.Random(f * 7 + 3)
        for x in range(MOUTH_W):
            edge = min(x, MOUTH_W - 1 - x)
            if edge < 2:
                continue  # the shoreline line stays at the ends
            for y in range(MOUTH_H):
                if y > edge + 1:
                    continue
                if y == 0:
                    px[x, y] = (*s.rgb(lake["hi"]), 255)  # the line opened up
                elif rnd.random() < 0.45 - y * 0.08 and edge > 3:
                    px[x, y] = (*s.rgb(R["whitewater"][rnd.randrange(2, 4)]), 255)  # foam, spreading and fading
                elif y < 3:
                    px[x, y] = (*s.rgb(lake["hi"] if (x + f) % 3 else lake["light"]), 255)
        frames.append(img)
    out = Image.new("RGBA", (MOUTH_W * s.FRAMES, MOUTH_H))
    for i, im in enumerate(frames):
        out.paste(im, (i * MOUTH_W, 0))
    return out, {"x": MOUTH_X, "w": MOUTH_W}
