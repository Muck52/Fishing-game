"""The plants of the shallows along the left shore, as chosen in study 5
(version C, mixed shallows): docs/studio/studies.md.

Clumps of cattails with bulrush and sedge between them, rooted in the
shallows just off the beach, their stems seen through the water with
threads of algae on them; a mat of algae on the surface round their feet,
duckweed scattered further out and a few lily pads. Drawn by the study's
tools (tools/studio/study_shore.py), four frames each.

The art build saves each sheet and lists where the game places it
(anchors.shore, read by src/environment/Lake.js).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "studio"))
import study_shore as s  # noqa: E402


def sheets():
    """({key: (strip, (frame w, frame h))}, items) for the art build."""
    v = s.version_c(s.materials())
    return {k: (sh.strip(), (sh.w, sh.h)) for k, sh in v["sheets"].items()}, v["items"]
