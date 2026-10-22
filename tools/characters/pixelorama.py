"""Working on the creatures in Pixelorama.

Every creature has a Pixelorama project, assets/source/pixelorama/<name>.pxo,
kept in step by the art build: a locked "drawn" layer (what its script in
tools/characters draws, rewritten each build) and a "touch-ups" layer for
hand edits, which the build keeps and lays over the drawing. Open a project
in Pixelorama, paint on "touch-ups" (pick from the "Reel It In" palette;
paint #ff00ff to erase a drawn pixel), save, and rebuild the art.

From the command line (Pixelorama's own, run headless, does the exporting;
set PIXELORAMA to its executable if it isn't in tools-bin):

    python3 tools/characters/pixelorama.py verify
        opens every project in Pixelorama and checks its export matches the
        game's sheet pixel for pixel
    python3 tools/characters/pixelorama.py export <name> <out.png>
        exports a creature's sheet with Pixelorama
    python3 tools/characters/pixelorama.py paint <name> <frames> <x>,<y>=<#rrggbb|erase> ...
        paints touch-ups without opening the editor: frames is a frame
        number (from 1), a range like 3-6, an animation's name, or "all"
    python3 tools/characters/pixelorama.py clear <name> <frames>
        removes touch-ups from those frames
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from PIL import Image, ImageChops

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pxo  # noqa: E402
from kit import ART, PROJECTS, ROOT  # noqa: E402

DEFAULT = Path("/home/user/tools-bin/Pixelorama-Linux-64bit/Pixelorama.x86_64")


def executable():
    p = Path(os.environ.get("PIXELORAMA", DEFAULT))
    if not p.exists():
        sys.exit(f"Pixelorama not found at {p}; set PIXELORAMA to its executable")
    return p


def export(name, out):
    """Has Pixelorama itself open the project and export its sheet."""
    work = executable().parent.parent / "pixelorama-work"
    work.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(dir=work) as tmp:
        src = Path(tmp) / f"{name}.pxo"
        shutil.copy(PROJECTS / f"{name}.pxo", src)
        made = Path(tmp) / f"{name}.png"
        # its own settings folder; with the marks of the last (closed) run
        # cleared, so it never stops to offer to restore a session
        home = executable().parent.parent / "pixelorama-home"
        (home / "pixelorama").mkdir(parents=True, exist_ok=True)
        (home / "pixelorama" / ".running").unlink(missing_ok=True)
        shutil.rmtree(home / "pixelorama" / "backups", ignore_errors=True)
        # headless, Pixelorama exports and then keeps running, so wait for
        # the file to be written and settle, then close it
        proc = subprocess.Popen([str(executable()), "--headless", "--no-header", "--", str(src), "--export", "--spritesheet", "--output", str(made)],
                                cwd=tmp, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                env={**os.environ, "XDG_DATA_HOME": str(home), "XDG_CONFIG_HOME": str(home), "PWD": tmp})
        last, steady = -1, 0
        for _ in range(600):
            time.sleep(0.2)
            size = made.stat().st_size if made.exists() else -1
            steady = steady + 1 if size == last and size > 0 else 0
            last = size
            if steady >= 3 or proc.poll() is not None:
                break
        proc.kill()
        proc.wait()
        if not made.exists():
            sys.exit(f"Pixelorama did not export {name}")
        shutil.copy(made, out)


def sheet_path(name):
    data = json.loads((ROOT / "assets" / "art" / "manifest.json").read_text())
    return ROOT / data["sheets"][name]["url"]


def verify():
    ok = True
    for p in sorted(PROJECTS.glob("*.pxo")):
        name = p.stem
        if name.endswith(".old"):
            continue
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "out.png"
            export(name, out)
            layers, _ = pxo.read(p)
            erased = any(t.getpixel((x, y)) == (*pxo.ERASE, 255) for t in layers["touch-ups"] for y in range(t.height) for x in range(t.width))
            got = Image.open(out).convert("RGBA")
            want = Image.open(sheet_path(name)).convert("RGBA")
            same = got.size == want.size and ImageChops.difference(got, want).getbbox() is None
            note = "matches the game's sheet" if same else ("differs only where touch-ups erase" if erased else "DIFFERS")
            ok &= same or erased
            print(f"{name:8} opens in Pixelorama, {len(layers['drawn'])} frames, export {note}")
    sys.exit(0 if ok else 1)


def frames_for(name, spec):
    data = json.loads((ART / ("olive/" if name == "olive" else "") / f"{name}.json").read_text())["animations"]
    total = sum(len(a["frames"]) for a in data.values())
    if spec == "all":
        return list(range(total))
    if spec in data:
        return data[spec]["frames"]
    if "-" in spec:
        a, b = (int(v) for v in spec.split("-"))
        return list(range(a - 1, b))
    return [int(spec) - 1]


def paint(name, spec, edits, clear=False):
    path = PROJECTS / f"{name}.pxo"
    layers, size = pxo.read(path)
    with __import__("zipfile").ZipFile(path) as z:
        data = json.loads(z.read("data.json"))
    tags = [(t["name"], t["from"], t["to"]) for t in data["tags"]]
    touch = layers["touch-ups"]
    for f in frames_for(name, spec):
        img = touch[f]
        if clear:
            touch[f] = Image.new("RGBA", size)
            continue
        for e in edits:
            xy, colour = e.split("=")
            x, y = (int(v) for v in xy.split(","))
            rgb = pxo.ERASE if colour == "erase" else tuple(int(colour[i:i + 2], 16) for i in (1, 3, 5))
            img.putpixel((x, y), (*rgb, 255))
    pal = json.loads((ROOT / "tools" / "palette.json").read_text())
    pxo.write(path, size, [("drawn", layers["drawn"], True), ("touch-ups", touch, False)], tags, data["fps"],
              palette=pal["colours"] + pal["creatures"])
    print(f"{name}: touch-ups {'cleared' if clear else 'painted'} on {spec}; rebuild the art to see them in the game")


if __name__ == "__main__":
    cmd, *rest = sys.argv[1:] or ["help"]
    if cmd == "verify":
        verify()
    elif cmd == "export":
        export(rest[0], rest[1])
    elif cmd == "paint":
        paint(rest[0], rest[1], rest[2:])
    elif cmd == "clear":
        paint(rest[0], rest[1], [], clear=True)
    else:
        print(__doc__)
