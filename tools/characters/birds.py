"""The birds' sheets, from study 9's drawings (tools/studio/study_birds.py,
version A: every bird seen in profile, wings beating up and down beside
the body, in study 8's look) with study 9b's detail (version B, in
tools/studio/study_bird_detail.py): wings laid out in feather bands from
their shape, field marks and body feather texture.

Each wingbeat is four frames: wings up, level (morphed halfway between up
and down), down, level again. The gull and eagle glide on wings held
level; the sparrow bounds, folding its wings between bursts of beats. The
loon swims and dives.

The sheets are saved drawn and outlined; the art build's last pass gives
them the selective edge and lights them as one mass, like the land
animals.
"""
import json
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / "studio"))
import study_birds as sb  # noqa: E402
import study_bird_detail as bd  # noqa: E402
from kit import outline, image, preview, ART  # noqa: E402

BEAT = ["flap-up", "flap-mid", "flap-down", "flap-mid"]


DETAIL = "B"  # study 9b's pick
NAMES = {id(sb.GULL): "gull", id(sb.EAGLE): "eagle", id(sb.MALLARD): "mallard", id(sb.HEN): "hen", id(sb.SPARROW): "sparrow", id(sb.LOON): "loon"}


def frame(spec, pose, water=None):
    name = NAMES[id(spec)]
    return image(outline(bd.draw(name, pose, DETAIL)), bd.colours(name), water=water)


def anims(name):
    """name -> {animation: ([images], fps, loop)}"""
    if name == "gull":
        return {"fly": ([frame(sb.GULL, p) for p in BEAT], 8, True), "glide": ([frame(sb.GULL, "flap-mid")], 1, False)}
    if name == "eagle":
        return {"fly": ([frame(sb.EAGLE, p) for p in BEAT], 5, True), "glide": ([frame(sb.EAGLE, "flap-mid")], 1, False)}
    if name == "mallard":
        return {"fly": ([frame(sb.MALLARD, p) for p in BEAT], 12, True), "hen": ([frame(sb.HEN, p) for p in BEAT], 12, True)}
    if name == "sparrow":
        return {"fly": ([frame(sb.SPARROW, p) for p in BEAT + BEAT + ["fold", "fold", "fold"]], 16, True)}
    if name == "loon":
        return {"swim": ([frame(sb.LOON, "rest", 9)], 1, False), "dive": ([frame(sb.LOON, "dive", 9)], 1, False)}
    raise KeyError(name)


def sheet(name):
    a = anims(name)
    imgs = [f for fs, _, _ in a.values() for f in fs]
    fw, fh = imgs[0].size
    strip = Image.new("RGBA", (fw * len(imgs), fh))
    index, n = {}, 0
    for an, (fs, fps, loop) in a.items():
        index[an] = {"frames": list(range(n, n + len(fs))), "fps": fps, "loop": loop}
        n += len(fs)
    for k, f in enumerate(imgs):
        strip.alpha_composite(f, (k * fw, 0))
    strip.save(ART / f"{name}.png")
    (ART / f"{name}.json").write_text(json.dumps({"frameWidth": fw, "frameHeight": fh, "animations": index}, indent=1) + "\n")
    preview(name, {an: (fs, fps) for an, (fs, fps, _) in a.items()}, fw, fh)
    return strip, index, fw, fh


if __name__ == "__main__":
    for n in ("gull", "eagle", "mallard", "sparrow", "loon"):
        sheet(n)
