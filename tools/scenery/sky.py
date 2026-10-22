"""The sky and the distant hills, as chosen in study 1 (version B, the spire
skyline, without the tall-pine mounds): docs/studio/studies.md.

For each time of day (dawn, day, golden hour, dusk, night) one image of the
sky in flat bands, the sun or moon (and stars at night), and three low,
rounded, forested ridges in haze, the nearest edged in fir and spruce
spires; and three clouds of our one style, as separate sprites so they can
drift. Each is drawn in that time's own light by the materials library, so
the game blends between them through the day instead of tinting one
picture. The image covers the world from 120 px above the top of the old
backdrop down to 140, behind the far bank.

Run on its own to write docs previews; the art build saves the images.
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "studio"))
import study_sky as s  # noqa: E402
from materials import TIMES, sky_bands, lerp  # noqa: E402

W, H = s.W, s.H  # 360 x 260
TOP = -120  # the world y of the image's top row
LIFT = 45  # how much higher than in the study the hills sit, to clear the far bank
CLOUDS = [(14, 21), (11, 22), (10, 23)]  # (size, seed) of the three drifting clouds


def scene(time):
    img = Image.new("RGBA", (W, H))
    s.sky(img, time, 205 - LIFT + 30)
    s.stars(img, time)
    sun_x, sun_y, c = s.SUN[time]
    s.SUN[time] = (sun_x, sun_y - LIFT + 30, c)
    s.disc(img, time)
    s.SUN[time] = (sun_x, sun_y, c)
    px = img.load()
    cols = s.hill_colours(time, 4)
    s.ridge(px, cols[0], 192 - LIFT, 38, 150, 31)
    s.ridge(px, cols[1], 214 - LIFT, 28, 110, 32)
    s.ridge(px, cols[2], 232 - LIFT, 20, 80, 33)
    s.haze(px, 230 - LIFT, lerp(sky_bands(time)[-1], cols[2], 0.35), rows=4)
    s.ridge(px, cols[3], 258 - LIFT, 10, 60, 34, tops=s.spires)
    return img


def clouds(time):
    out = []
    for size, seed in CLOUDS:
        img = Image.new("RGBA", (size * 8, size * 4))
        s.cloud(img, time, size * 4, size * 2, size, seed)
        out.append(img.crop(img.getbbox()))
    return out


def images():
    """{name: image} for the art build."""
    out = {}
    for t in TIMES:
        out[f"sky-{t}"] = scene(t)
        for i, c in enumerate(clouds(t)):
            out[f"cloud-{t}-{i}"] = c
    return out


if __name__ == "__main__":
    dst = Path(__file__).resolve().parents[2] / "docs" / "studio" / "studies" / "01-sky"
    for name, img in images().items():
        img.save(dst / f"game-{name}.png")
