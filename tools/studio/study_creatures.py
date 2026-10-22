"""Study 8: the land animals, redesigned.

You felt the deer, fox, hare, bear and Olive were stiff and blocky (bodies
like boxes, legs like sticks) and not cozy enough. This study redraws all
five from shapes (tools/characters/anatomy.py): rounded masses for the
torso, an S-curve of neck, a head of skull and muzzle, legs that taper and
bend at real joints, so the curves come out clean, in three directions:

- **A, natural curves:** true proportions, the stiffness gone: arched
  backs, deep chests, round haunches, legs that taper to small feet.
- **B, cozy storybook:** the same animals pushed toward charm: heads a
  third bigger, shorter legs, rounder bodies, big eyes with a catchlight
  and a touch of blush.
- **C, cozy naturalist:** in between: real animals, a little rounder and
  softer, the head a touch larger, eyes with a catchlight.

Each is finished the way the game's animals are now (the selective edge of
study 6, lit as one mass as in study 7), and shown standing on the beach.

    python3 tools/studio/study_creatures.py   -> docs/studio/studies/08-creatures/
"""
import copy
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "characters"))
from anatomy import draw  # noqa: E402
from kit import outline, image  # noqa: E402
from edges import treat  # noqa: E402
from light import lit  # noqa: E402

OUT = ROOT / "docs" / "studio" / "studies" / "08-creatures"
FACE = {"E": "#25131a", "N": "#25131a", "C": "#f7f4ee", "B": "#d98a7e", "o": "#25131a"}

# ---------------------------------------------------------------- the animals
# Every animal faces left, its feet on `ground`. Points are on the 1x grid.

DEER = {
    "frame": (46, 42), "ground": 40, "foot": "H",
    "colours": {"O": "#a9805f", "S": "#7d5a3e", "W": "#eae2dc", "P": "#b98f86", "H": "#33323d"},
    "poses": {"stand": {
        "pivot": (12, 12),
        "torso": [(16, 18.5), (22, 18), (29, 17.8), (35, 18), (38, 20.5), (37.5, 23.5), (35, 25), (31.5, 24.4), (26, 25.4), (20, 26.4), (15.5, 25), (13, 22), (13.5, 19.5)],
        "neck": [(13.5, 22), (11.5, 17), (10, 12.5), (12.5, 10.5), (15.5, 14), (17.5, 18.5)],
        "head": [(9, 8.5), (12, 8), (13.8, 9.6), (13.4, 12), (10.8, 13.2), (7.5, 13.6), (4.8, 14), (3.6, 13.2), (4.2, 11.8), (6.8, 10)],
        "ears_far": [("S", [(10.2, 8.5), (8.6, 4.2), (10, 3.8), (11.6, 8)])],
        "ears": [("O", [(12, 8.4), (13, 4), (15, 3.6), (14.6, 7.6), (13.6, 9.4)])],
        "eye": (9.6, 10.4), "nose": (4, 12.8),
        "marks": [("W", [(19, 26), (25, 25.6), (32, 25.6), (32, 28), (19, 28)]),
                  ("W", [(10, 13.6), (11.8, 13.6), (12.6, 16.5), (10.8, 16.5)])],
        "head_marks": [("W", [(5.4, 11.8), (6.6, 11.8), (6.6, 14), (5.4, 14)])],
        "behind": [("O", [(36.5, 18.5), (39.5, 18), (40, 21), (38, 22)]), ("W", [(38.8, 20), (40.2, 20.5), (39.6, 22.5), (38.4, 22)])],
        "legs": [
            ("far", [(20, 24), (20.5, 30), (20, 34.5), (20, 40)], [1.6, 1.1, 1.0, 1.0]),
            ("far", [(31, 23), (32, 28.5), (30, 33), (30, 40)], [2.4, 1.4, 1.0, 1.0]),
            ("near", [(15.5, 24), (15.5, 30), (15, 34.5), (15, 40)], [1.9, 1.2, 1.0, 1.0]),
            ("near", [(35, 22.5), (36.8, 28.5), (34.5, 33), (34.5, 40)], [3, 1.7, 1.0, 1.0]),
        ],
    },
        "drink": {
            "base": "stand", "pivot": (7, 30),
            "neck": [(13.5, 21), (12, 23), (9, 28), (6, 32), (9, 34), (12, 29), (16, 23)],
            "head": [(5, 30), (8.5, 30.5), (9.5, 33), (8.5, 35.5), (6.5, 37.5), (5, 38.4), (3.8, 37.6), (3.6, 35), (4, 32)],
            "ears_far": [("S", [(6.4, 30.4), (6.6, 25.6), (8.2, 25.4), (8.2, 30.2)])],
            "ears": [("O", [(8.2, 30.6), (9.6, 25.8), (11.4, 25.6), (10.4, 31.2)])],
            "head_marks": [("W", [(4, 35.4), (6.6, 35.4), (6.4, 36.6), (4, 36.6)]), ("P", [(9.8, 26.8), (10.6, 26.8), (10, 29.6), (9.4, 29.6)])],
            "eye": (6.6, 32.4), "nose": (4.4, 38),
            "marks": [("W", [(19, 26), (25, 25.6), (32, 25.6), (32, 28), (19, 28)])],
            "legs": [
                ("far", [(20, 24), (20.5, 30), (20, 34.5), (20.5, 40)], [1.6, 1.1, 1.0, 1.0]),
                ("far", [(31, 23), (32, 28.5), (30, 33), (30, 40)], [2.4, 1.4, 1.0, 1.0]),
                ("near", [(15.5, 24), (14, 30), (12.5, 34.5), (12, 40)], [1.9, 1.2, 1.0, 1.0]),
                ("near", [(35, 22.5), (36.8, 28.5), (34.5, 33), (34.5, 40)], [3, 1.7, 1.0, 1.0]),
            ],
        }},
}

# The buck: a white-tailed buck in late summer, his antlers hardened (two
# main beams curving forward, tines rising from them), a heavier neck, a
# slightly darker coat. Drawn from the doe, with a taller frame for the
# antlers.
BUCK = copy.deepcopy(DEER)
BUCK["frame"], BUCK["ground"], BUCK["dx"] = (54, 54), 52, 8
BUCK["colours"].update({"O": "#9c7454", "S": "#735238", "A": "#e2d4b4", "a": "#9c8a6a"})
BUCK["poses"]["stand"].update({
    "neck": [(13.5, 22.5), (11, 17), (9.5, 12.5), (12.8, 10.2), (16.5, 14), (18.5, 19)],
    # the beam sweeps up and back, then forward over the face; tines rise
    # from it, spaced so each reads on its own
    "antlers_far": [("a", [(10.6, 8.4), (12.6, 4.6), (11.4, 1), (7.6, -1), (3.6, -0.6)], [1.2, 1, 1, 1, 1]),
                    ("a", [(10.2, -0.2), (10.4, -4.2)], [1, 1]), ("a", [(6.4, -1), (6, -4.6)], [1, 1])],
    "antlers": [("A", [(12.8, 8.4), (16, 4.6), (15.4, 0.6), (12, -1.6), (7.6, -2), (4.6, -0.8)], [1.3, 1.1, 1, 1, 1, 1]),
                ("A", [(15.6, 2.4), (18.6, -1.2)], [1, 1]), ("A", [(13.4, -1), (14, -5.6)], [1, 1]),
                ("A", [(9.6, -1.9), (9.6, -6.2)], [1, 1])],
})
BUCK["poses"]["drink"] = {**DEER["poses"]["drink"], "head_turn": (-60, "stand"), "pivot": (8, 30),
    "neck": [(13.5, 21), (11.5, 23.5), (8.5, 28.5), (6, 31.5), (9.5, 33.5), (12.5, 29.5), (17, 23)],
}

FOX = {
    "frame": (42, 27), "ground": 25, "near": "K", "far": "S",
    "colours": {"O": "#c4622e", "W": "#ece4da", "K": "#3a2e30", "S": "#2b2427", "P": "#7a3c2c"},
    "poses": {"stand": {
        "pivot": (10, 10),
        "torso": [(14, 14), (20, 13.4), (27, 13.6), (31, 14.4), (32.5, 16.5), (31.5, 19), (28, 19.4), (22, 19.6), (16, 19.4), (12.5, 18), (11.5, 15.5)],
        "neck": [(12, 17), (10, 13), (9, 10.5), (12, 9.5), (15, 12), (16, 15)],
        "head": [(8, 7), (11.5, 6.6), (13, 8.4), (12.4, 10.8), (9.5, 11.6), (6, 11.8), (2.6, 11.4), (2, 10.6), (3, 9.8), (6, 8.2)],
        "ears_far": [("K", [(9.4, 7), (8.6, 2.5), (10.4, 3.4), (11, 7)])],
        "ears": [("O", [(11, 7), (11.8, 2.4), (13.6, 3.4), (13, 7.4)])],
        "eye": (8.8, 8.8), "nose": (2.4, 10.6),
        "marks": [("W", [(9, 11.5), (12, 11.5), (13, 15), (14, 18), (11, 18), (10, 14)]),
                  ("W", [(16, 19), (27, 19), (27, 21), (16, 21)])],
        "head_marks": [("W", [(3, 11), (9, 11.2), (11, 11.8), (3, 12.2)]), ("K", [(11.2, 2), (14, 2.4), (13.6, 4.2), (11.4, 4.2)]),
                       ("P", [(11.9, 4.4), (12.7, 4.2), (12.6, 6.6), (11.9, 6.6)])],
        "behind": [("O", [(31, 14.8), (35, 14), (38.5, 15.6), (39.5, 18.5), (37.5, 20), (33.5, 19.2), (31.5, 17.5)]),
                   ("W", [(37.4, 16), (39.6, 17), (39.4, 19.4), (37.6, 19.4)])],
        "legs": [
            ("far", [(17, 18), (17.5, 22), (17, 25)], [1.4, 1, 1]),
            ("far", [(26, 17.5), (27.5, 20.5), (26.5, 22.5), (26.5, 25)], [2.2, 1.3, 1, 1]),
            ("near", [(13.5, 18), (13.5, 21.5), (13, 25)], [1.8, 1.1, 1]),
            ("near", [(29, 17.5), (30.8, 20.5), (29.5, 22.5), (29.5, 25)], [2.6, 1.4, 1, 1]),
        ],
    },
        "sniff": {
            "base": "stand", "pivot": (6, 19),
            "neck": [(12, 17), (9.5, 17), (6.5, 20), (5, 22.5), (8.5, 23.5), (12.5, 20), (16, 15)],
            "head": [(4.5, 18.5), (8, 18.6), (9.6, 20.4), (8.6, 22.4), (5.6, 23.6), (2.4, 24.6), (1.4, 24), (2, 22.8), (3.8, 20.4)],
            "ears_far": [("K", [(5.8, 18.8), (5.4, 15), (7, 15.6), (7.2, 18.6)])],
            "ears": [("O", [(7.2, 18.6), (7.6, 14.6), (9.4, 15.6), (9, 18.8)])],
            "eye": (5.4, 20.4), "nose": (1.8, 24),
            "marks": [("W", [(16, 19), (27, 19), (27, 21), (16, 21)]), ("W", [(9, 18), (12, 17.5), (13.5, 18.5), (10, 20)])],
            "head_marks": [("W", [(2.4, 23.6), (7, 22.6), (8, 23.2), (3, 24.8)]), ("K", [(7.2, 14.2), (9.8, 15), (9.4, 16.6), (7.4, 16.4)])],
            "behind": [("O", [(31, 14.8), (34, 12), (37, 9.5), (39.5, 10), (39, 13), (36, 15.5), (32.5, 17.5)]),
                       ("W", [(37.6, 9.4), (39.8, 10), (39.6, 12.4), (37.8, 12)])],
        }},
}

HARE = {
    "frame": (30, 31), "ground": 29, "near": "W", "far": "w",
    "colours": {"O": "#9a7652", "W": "#eae2dc", "w": "#b3a697", "S": "#6e5238", "P": "#c89a8e"},
    "poses": {"stand": {
        "pivot": (8, 12),
        "torso": [(9, 13), (14, 10.5), (19, 11), (23, 14), (24.5, 18.5), (23, 22.5), (19, 24.4), (13, 24.6), (9, 23), (7.5, 19), (7.6, 15.5)],
        "neck": [(8, 12), (11, 11.5), (12, 15), (9, 16)],
        "head": [(4, 9.5), (8, 8.5), (10.5, 10.5), (10, 14), (7, 15.5), (3.5, 15), (2, 13.5), (2.4, 11.2)],
        "ears_far": [("S", [(6, 9.4), (6.4, 2.5), (8, 2), (8, 9)])],
        "ears": [("O", [(7.5, 9.2), (9.5, 2), (11.5, 1.5), (10.5, 6), (9.2, 9.8)])],
        "eye": (5.6, 11), "nose": (2.2, 12.6),
        "marks": [("W", [(8, 21), (14, 22.5), (20, 23.6), (14, 25.5), (8, 25)])],
        "head_marks": [("P", [(9.6, 3.2), (10.6, 2.8), (10, 6.4), (9.2, 6.4)])],
        "behind": [("W", [(23.5, 17.5), (26.2, 18), (26, 21), (24, 21)])],
        "legs": [
            ("far", [(11.5, 20), (11, 22.5), (10.5, 25)], [1.6, 1.3, 1.2]),
            ("near", [(9, 20), (8.5, 22.5), (8, 25)], [1.8, 1.4, 1.3]),
            ("near", [(21, 22.5), (17, 24.3), (13, 24.6)], [2.4, 1.8, 1.4]),
        ],
    },
        "alert": {
            "pivot": (9, 11),
            "torso": [(10, 13), (14, 12), (17.5, 14), (19, 18.5), (19, 23.5), (17, 27.5), (13, 28.6), (9.5, 27.5), (8, 23), (8, 17.5)],
            "neck": [(8, 12), (11, 11.5), (12, 15), (9, 16)],
            "head": [(6, 7.5), (10, 7), (12, 9), (11.6, 12.4), (8.6, 13.6), (5, 13.2), (3.6, 11.8), (4, 9)],
            "ears_far": [("S", [(7.4, 7.8), (5.4, 1.2), (7, 0.4), (9, 7.4)])],
            "ears": [("O", [(9.5, 7.6), (11.2, 0.6), (13.2, 0.6), (12, 5.6), (10.8, 8)])],
            "eye": (6.6, 10), "nose": (3.8, 11.4),
            "marks": [("W", [(9, 20), (13, 19), (14, 28.6), (9, 28.6)])],
            "head_marks": [("P", [(11.4, 1.8), (12.4, 1.8), (11.6, 5), (11, 5)])],
            "behind": [("W", [(18.5, 24), (20.8, 24.4), (20.6, 27.4), (18.6, 27.4)])],
            "legs": [
                ("far", [(11.5, 18.5), (10.6, 21), (10.6, 22.4)], [1.4, 1.1, 1.0]),
                ("near", [(9.5, 18), (8.5, 20.5), (8.5, 22)], [1.6, 1.2, 1.1]),
                ("near", [(17, 27), (13, 28.4), (9.5, 28.8)], [2.4, 1.8, 1.4]),
            ],
        }},
}

BEAR = {
    "frame": (46, 31), "ground": 29, "near": "O", "far": "S",
    "colours": {"O": "#3a3742", "S": "#26232c", "M": "#a9805f", "P": "#5a4a50"},
    "poses": {"stand": {
        "pivot": (9, 14),
        "torso": [(12, 12.5), (17, 10), (24, 10.5), (31, 11), (36, 12), (39, 15), (39, 19), (36, 21.5), (28, 22), (19, 22), (13, 21), (10, 18.5), (10, 15)],
        "neck": [(11, 19), (9, 15.5), (10, 12.5), (14, 12), (15, 17)],
        "head": [(6.5, 11.5), (10.5, 11), (12.5, 13), (12, 16), (9, 17.5), (5.5, 18), (2.6, 17.6), (2, 16.4), (3.2, 15), (5.4, 13.4)],
        "ears_far": [("S", [(7.5, 12), (7.2, 9.6), (9, 9.4), (9.4, 11.6)])],
        "ears": [("O", [(10, 11.4), (10.6, 9), (12.6, 9.2), (12.4, 11.8)])],
        "eye": (7.5, 13.6), "nose": (2.3, 16.2),
        "head_marks": [("M", [(2, 15), (5.6, 14.4), (6.4, 17.8), (2.4, 18)])],
        "behind": [("O", [(38.5, 15.5), (40.5, 15.6), (40.4, 17.4), (38.6, 17.4)])],
        "legs": [
            ("far", [(19, 19), (19.5, 24.5), (19, 29)], [4, 2.8, 2.6]),
            ("far", [(30, 18), (31.5, 23.5), (30.5, 29)], [4.6, 3, 2.8]),
            ("near", [(14, 19), (14, 24.5), (13.5, 29)], [4.4, 3.2, 3]),
            ("near", [(35, 18), (36.5, 23.5), (35.5, 29)], [5.4, 3.4, 3]),
        ],
    },
        "sit": {
            "pivot": (11, 7),
            "torso": [(14, 8), (20, 6.5), (26, 9), (29.5, 14), (31, 20), (30, 25.5), (24, 28.8), (17, 28.6), (13.5, 24), (12.5, 17), (12.5, 11)],
            "neck": [(11, 12), (10, 8), (14, 6), (16, 11)],
            "head": [(8, 4.5), (12, 4), (14, 6), (13.6, 9), (10.6, 10.4), (7, 10.8), (4, 10.4), (3.4, 9.2), (4.6, 7.8), (6.6, 6.4)],
            "ears_far": [("S", [(8.6, 5), (8.4, 2.6), (10.2, 2.4), (10.6, 4.6)])],
            "ears": [("O", [(11.4, 4.4), (12, 2), (14, 2.2), (13.8, 4.8)])],
            "eye": (8.6, 6.8), "nose": (3.6, 9.4),
            "head_marks": [("M", [(3.4, 8.4), (7, 7.6), (7.6, 11), (3.6, 11)])],
            "behind": [],
            "legs": [
                ("far", [(15, 14), (13, 21.5), (12.5, 29)], [4, 2.8, 2.6]),
                ("near", [(13, 14), (10, 21.5), (8.5, 29)], [4.4, 3.2, 3]),
                ("near", [(25, 21), (24, 26.5), (19, 29)], [6.5, 4.4, 3]),
            ],
            "front": [("P", [(16.6, 28), (21, 28), (21, 29.6), (16.6, 29.6)])],
        }},
}

OLIVE = {
    "frame": (42, 32), "ground": 30, "near": "W", "far": "w",
    "colours": {"O": "#33323d", "W": "#eae2dc", "w": "#b3a697", "H": "#faffff", "R": "#c25f62", "P": "#985252"},
    "poses": {"stand": {
        "pivot": (11, 12),
        "torso": [(13, 16), (19, 15), (26, 15.2), (31, 16), (33.5, 18.5), (33, 22), (30, 23.5), (24, 23.6), (18, 23.8), (13.5, 22.5), (11, 19.5), (11.5, 17)],
        "neck": [(11.5, 19.5), (10, 15), (10, 12), (13.5, 11), (16, 14), (16, 17.5)],
        "head": [(8.5, 8), (12.5, 7.6), (14.4, 9.4), (14, 12.4), (11, 13.6), (7.6, 13.8), (4.2, 13.6), (3.4, 12.4), (4.4, 11), (7, 9.6)],
        "ears_far": [("O", [(9.6, 8.2), (9.4, 3.6), (11.2, 4.6), (11.6, 8)])],
        "ears": [("O", [(11.8, 8), (12.6, 3.4), (14.4, 4.8), (14, 8.4)])],
        "eye": (9.8, 9.8), "nose": (3.8, 12.2),
        "head_marks": [("W", [(3.6, 11.6), (8, 11), (8.6, 13.8), (4, 13.8)]), ("W", [(8.2, 8.6), (9.2, 8.4), (8.6, 11.4), (7.6, 11.4)]),
                       ("P", [(12.6, 5.4), (13.4, 5), (13.4, 7.4), (12.6, 7.4)])],
        "marks": [("W", [(10, 13), (13, 13), (15, 17), (16, 22), (12, 23), (10.5, 18)]),
                  ("W", [(16, 22.5), (28, 22.5), (28, 25), (16, 25)]),
                  ("R", [(10.2, 14.6), (15.6, 13.4), (16.4, 15.8), (13.4, 18.6), (11.2, 17)])],
        # her tail: a slim plume curled up over her back, tapering to a white tip
        "tail": [("O", [(29.5, 17.5), (29.6, 13.6), (31.4, 10.8), (34.2, 10), (36.4, 11.4)], [2.4, 2.2, 2, 1.8, 1.6]),
                 ("H", [(36.4, 11.4), (36.2, 13.4), (34.8, 14.2)], [1.6, 1.4, 1.2])],
        "legs": [
            ("far", [(18, 21), (18.5, 26), (18, 30)], [2.2, 1.6, 1.4]),
            ("far", [(27.5, 21), (28.6, 25), (27.4, 27.5), (27.4, 30)], [3, 1.8, 1.4, 1.4]),
            ("near", [(14, 21), (14, 26), (13.5, 30)], [2.6, 1.8, 1.6]),
            ("near", [(31, 20.5), (32.5, 25), (31, 27.5), (31, 30)], [3.6, 2.2, 1.6, 1.6]),
        ],
    },
        "sit": {
            "pivot": (11, 10.5),
            "torso": [(13, 14), (18, 13), (23, 15), (27, 19), (28.5, 24), (27, 28.5), (21, 30), (16, 29.5), (12.5, 26), (11, 21), (11.5, 16.5)],
            "neck": [(11, 18), (10, 13.5), (10, 10.5), (13.5, 9.5), (16, 13), (16, 16)],
            "head": [(8.5, 6.5), (12.5, 6.1), (14.4, 7.9), (14, 10.9), (11, 12.1), (7.6, 12.3), (4.2, 12.1), (3.4, 10.9), (4.4, 9.5), (7, 8.1)],
            "ears_far": [("O", [(9.6, 6.7), (9.4, 2.1), (11.2, 3.1), (11.6, 6.5)])],
            "ears": [("O", [(11.8, 6.5), (12.6, 1.9), (14.4, 3.3), (14, 6.9)])],
            "eye": (9.8, 8.3), "nose": (3.8, 10.7),
            "head_marks": [("W", [(3.6, 10.1), (8, 9.5), (8.6, 12.3), (4, 12.3)]), ("W", [(8.2, 7.1), (9.2, 6.9), (8.6, 9.9), (7.6, 9.9)]),
                           ("P", [(12.6, 3.9), (13.4, 3.5), (13.4, 5.9), (12.6, 5.9)])],
            "marks": [("W", [(10, 11.5), (13, 11.5), (15, 16), (16, 24), (12, 26), (10.5, 18)]),
                      ("R", [(10.2, 13.1), (15.6, 11.9), (16.4, 14.3), (13.4, 17.1), (11.2, 15.5)])],
            "tail": [("O", [(26.5, 28.5), (30, 29.1), (33, 28.8)], [2.4, 2, 1.8]),
                     ("H", [(33, 28.8), (35.6, 29.4)], [1.7, 1.4])],
            "legs": [
                ("far", [(16.5, 20), (17, 25), (17, 30)], [2.2, 1.6, 1.4]),
                ("near", [(13.5, 20), (13.5, 25), (13.5, 30)], [2.6, 1.8, 1.6]),
                ("near", [(23, 27.5), (20.5, 29.2), (18, 30)], [2.4, 1.8, 1.6]),
            ],
        }},
}

ANIMALS = {"olive": OLIVE, "deer": DEER, "buck": BUCK, "fox": FOX, "hare": HARE, "bear": BEAR}


def render(spec, style, pose="stand"):
    g = outline(draw(spec, style, pose))
    colours = {**FACE, **spec["colours"]}
    img = image(g, colours)
    fw = img.width
    return lit(treat(img, fw), fw)


POSES = {"olive": ["stand", "sit"], "deer": ["stand", "drink"], "buck": ["stand", "drink"], "fox": ["stand", "sniff"], "hare": ["stand", "alert"], "bear": ["stand", "sit"]}


def sheet(style, scale=4, names=None):
    """One style: each animal standing, then in its own pose, on the beach."""
    land = Image.open(ROOT / "assets" / "art" / "environments" / "land.png").convert("RGBA")
    items = []
    for name in names or ANIMALS:
        spec = ANIMALS[name]
        for pose in POSES[name]:
            items.append((render(spec, style, pose), spec["ground"]))
    w = sum(i.width + 2 for i, _ in items) + 4
    top = max(g for _, g in items) + 4
    strip = land.crop((150, 306 - top, 330, 306))
    bg = Image.new("RGBA", (w, top))
    for x0 in range(0, w, strip.width):
        bg.alpha_composite(strip, (x0, 0))
    x = 4
    for img, g in items:
        bg.alpha_composite(img, (x, top - 3 - g))
        x += img.width + 2
    return bg.resize((bg.width * scale, bg.height * scale), Image.NEAREST)


# the game's animals now, for comparison: a standing frame and the frame
# nearest the new signature pose
NOW = {"olive": (0, 2), "deer": (8, 11), "fox": (8, 10), "hare": (10, 14), "bear": (8, 11)}


def now_frames(name):
    import json
    m = json.loads((ROOT / "assets" / "art" / "manifest.json").read_text())
    name = {"buck": "deer"}.get(name, name)
    sh = m["sheets"][name]
    img = Image.open(ROOT / sh["url"]).convert("RGBA")
    fw, fh = sh["frameWidth"], sh["frameHeight"]
    return [img.crop((i * fw, 0, (i + 1) * fw, fh)) for i in NOW[name]]  # the game has a doe only


def card(name, scale=5):
    """One animal: rows now, A, B, C; its standing pose and its own pose."""
    spec = ANIMALS[name]
    rows = [("now", now_frames(name))] + [(st, [render(spec, st, p) for p in POSES[name]]) for st in ("natural", "cozy", "between")]
    land = Image.open(ROOT / "assets" / "art" / "environments" / "land.png").convert("RGBA")
    fw = max(i.width for _, r in rows for i in r)
    fh = max(i.height for _, r in rows for i in r)
    w, h = 2 * (fw + 4) + 4, fh + 6
    out = Image.new("RGBA", (w, (h + 2) * len(rows)), (255, 255, 255, 255))
    for k, (_, imgs) in enumerate(rows):
        strip = land.crop((150, 306 - h, 150 + w, 306))
        y0 = k * (h + 2)
        out.alpha_composite(strip, (0, y0))
        for j, img in enumerate(imgs):
            out.alpha_composite(img, (4 + j * (fw + 4), y0 + h - 3 - img.height))
    return out.resize((out.width * scale, out.height * scale), Image.NEAREST)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for style in ("natural", "cozy", "between"):
        sheet(style).save(OUT / f"{style}.png")
    for name in ANIMALS:
        card(name).save(OUT / f"card-{name}.png")
    # the chosen direction (C), corrected, as one lineup
    final = sheet("between", scale=4)
    final.save(OUT / "final.png")
