"""Reads and writes Pixelorama projects (.pxo), so every creature can be
opened, looked over and touched up in Pixelorama, and the touch-ups come
back into the build.

A .pxo is a zip: `data.json` describes the canvas, layers, frames and
animation tags, and each cel's pixels are stored raw (RGBA, 8 bits a
channel, the full canvas) under `image_data/frames/<frame>/layer_<layer>`,
both counted from 1. This writes format version 7, which Pixelorama 1.2
saves and every later version still opens.

Each creature's project has two layers:
  - "drawn": what tools/characters/<name>.py draws. Rewritten every build.
  - "touch-ups": hand edits, painted over it. Kept between builds; any
    pixel painted here replaces the drawn one (an erase is painted with the
    colour #ff00ff, since a see-through pixel means "no edit").
One frame per animation frame, and one tag per animation, named as in the
game. The canvas palette is the game's.
"""
import json
import zipfile
from pathlib import Path

from PIL import Image

VERSION = "v1.2.3-stable"
PXO_VERSION = 7
ERASE = (255, 0, 255)  # painted on the touch-up layer, it clears a pixel


def _layer(name, locked=False):
    return {
        "name": name, "visible": True, "locked": locked, "blend_mode": 0, "clipping_mask": False,
        "opacity": 1.0, "ui_color": "(0, 0, 0, 0)", "parent": -1, "effects": [], "type": 0,
        "new_cels_linked": False, "metadata": {},
    }


def write(path, size, layers, tags, fps, palette=None, durations=None):
    """layers: [(name, [one RGBA image per frame], locked)]; tags: [(name,
    first frame, last frame)], frames counted from 1 as Pixelorama shows
    them."""
    w, h = size
    n = len(layers[0][1])
    data = {
        "pixelorama_version": VERSION,
        "pxo_version": PXO_VERSION,
        "size_x": w,
        "size_y": h,
        "color_mode": 5,  # RGBA8
        "tile_mode_x_basis_x": w, "tile_mode_x_basis_y": 0,
        "tile_mode_y_basis_x": 0, "tile_mode_y_basis_y": h,
        "layers": [_layer(name, locked) for name, _, locked in layers],
        "tags": [{"name": t, "color": "ffffff", "from": a, "to": b} for t, a, b in tags],
        "guides": [],
        "symmetry_points": [w / 2, h / 2],
        "frames": [
            {"cels": [{"opacity": 1.0, "z_index": 0, "ui_color": "(0, 0, 0, 0)", "metadata": {}} for _ in layers],
             "duration": (durations[i] if durations else 1.0), "metadata": {}}
            for i in range(n)
        ],
        "current_frame": 0,
        "current_layer": len(layers) - 1,
        "brushes": [],
        "palettes": [],
        "reference_images": [],
        "tilesets": [],
        "vanishing_points": [],
        "fps": fps,
        "include_blended_images": False,
        "metadata": {},
    }
    if palette:
        colours = [{"color": "(%s, %s, %s, 1)" % tuple(round(int(c[i:i + 2], 16) / 255, 4) for i in (1, 3, 5)), "index": i}
                   for i, c in enumerate(palette)]
        cols = 16
        data["palettes"] = [{"Reel It In": json.dumps({"comment": "The game's master palette", "colors": colours,
                                                      "width": cols, "height": (len(colours) + cols - 1) // cols})}]
        data["project_current_palette_name"] = "Reel It In"
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("data.json", json.dumps(data))
        z.writestr("mimetype", "application/x-pixelorama")
        for f in range(n):
            for li, (_, frames, _) in enumerate(layers):
                img = frames[f].convert("RGBA")
                assert img.size == (w, h)
                z.writestr(f"image_data/frames/{f + 1}/layer_{li + 1}", img.tobytes())
        z.writestr("preview.png", _png(layers[0][1][0]))


def _png(img):
    import io
    b = io.BytesIO()
    img.save(b, "PNG")
    return b.getvalue()


def read(path):
    """{layer name: [one RGBA image per frame]}, and the canvas size."""
    with zipfile.ZipFile(path) as z:
        data = json.loads(z.read("data.json"))
        w, h = data["size_x"], data["size_y"]
        out = {}
        for li, layer in enumerate(data["layers"]):
            frames = []
            for f in range(len(data["frames"])):
                raw = z.read(f"image_data/frames/{f + 1}/layer_{li + 1}")
                if data.get("pxo_version", 7) >= 8 and len(raw) != w * h * 4:
                    # newer files keep each cel only as big as its content
                    cel = data["frames"][f]["cels"][li]
                    cw, ch = (int(v) for v in cel["image_size"].strip("Vector2i()").split(","))
                    ox, oy = (int(v) for v in str(cel.get("offset", "(0, 0)")).strip("Vector2i()").split(","))
                    img = Image.new("RGBA", (w, h))
                    img.paste(Image.frombytes("RGBA", (cw, ch), raw), (ox, oy))
                else:
                    img = Image.frombytes("RGBA", (w, h), raw)
                frames.append(img)
            out[layer["name"]] = frames
        return out, (w, h)


def apply_touchups(frames, touchups):
    """Lays the touch-up layer over the drawn frames: painted pixels replace
    the drawn ones, #ff00ff erases."""
    out = []
    for img, t in zip(frames, touchups):
        img = img.copy()
        a, b = img.load(), t.load()
        for y in range(img.height):
            for x in range(img.width):
                r, g, bb, al = b[x, y]
                if al == 0:
                    continue
                a[x, y] = (0, 0, 0, 0) if (r, g, bb) == ERASE else (r, g, bb, 255)
        out.append(img)
    return out
