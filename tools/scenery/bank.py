"""The far bank, as chosen in study 2 (version C, the birch cove):
docs/studio/studies.md.

A low bank and a pebble beach where the animals come down to drink, white
birch and aspen against dark spruce, a pair of red pines, and a pink
granite bluff with the falls dropping through a dark cleft, its stream
running across the beach to the lake. Drawn by the study's tools
(tools/studio/study_bank.py) from the materials library, in daylight; the
game's time-of-day grade shades it.

The art build saves the bank as environments/land.png and its water as
the four-frame environments/falls.png.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "studio"))
import study_bank as s  # noqa: E402


def images():
    """(land, falls strip, anchors) for the art build."""
    return s.images(s.version_c())
